-- ============================================================
-- EAGLES CRM · CENTRO DE COPYS
-- Ejecutar UNA VEZ en Supabase del CRM > SQL Editor.
-- No se ejecuta en la base de datos del Campus.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.copy_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 3 and 160),
  category text not null check (category in ('social', 'taller', 'course')),
  product_topic text not null check (char_length(trim(product_topic)) between 2 and 180),
  campaign_month text null check (campaign_month is null or campaign_month ~ '^20[0-9]{2}-(0[1-9]|1[0-2])$'),
  channels text[] not null default '{}',
  objective text not null default 'Venta',
  tone text not null default 'Directo y profesional',
  audience text,
  brief text not null check (char_length(trim(brief)) >= 10),
  call_to_action text,
  needs_image boolean not null default false,
  image_brief text,
  image_prompt text,
  status text not null default 'pending' check (
    status in (
      'pending',
      'generating',
      'draft',
      'review',
      'approved',
      'published',
      'changes_requested'
    )
  ),
  assigned_to uuid references public.user_profiles(id) on delete set null,
  reviewer_id uuid references public.user_profiles(id) on delete set null,
  requested_by uuid not null default auth.uid() references public.user_profiles(id) on delete restrict,
  generated_copy text,
  final_copy text,
  feedback text,
  due_date date,
  generated_at timestamptz,
  reviewed_at timestamptz,
  published_at timestamptz,
  n8n_execution_id text,
  generation_error text,
  activity_id bigint references public.activities(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists copy_requests_status_idx
  on public.copy_requests(status);

create index if not exists copy_requests_assigned_to_idx
  on public.copy_requests(assigned_to);

create index if not exists copy_requests_reviewer_id_idx
  on public.copy_requests(reviewer_id);

create index if not exists copy_requests_campaign_month_idx
  on public.copy_requests(campaign_month);

create or replace function public.set_copy_request_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists copy_requests_updated_at on public.copy_requests;
create trigger copy_requests_updated_at
before update on public.copy_requests
for each row execute function public.set_copy_request_updated_at();

alter table public.copy_requests enable row level security;

drop policy if exists "copy_requests_select" on public.copy_requests;
create policy "copy_requests_select"
on public.copy_requests
for select
to authenticated
using (true);

drop policy if exists "copy_requests_insert" on public.copy_requests;
create policy "copy_requests_insert"
on public.copy_requests
for insert
to authenticated
with check (
  requested_by = auth.uid()
  and exists (
    select 1
    from public.user_profiles profile
    where profile.id = auth.uid()
      and profile.role in ('admin', 'executor')
  )
);

drop policy if exists "copy_requests_update" on public.copy_requests;
create policy "copy_requests_update"
on public.copy_requests
for update
to authenticated
using (
  requested_by = auth.uid()
  or assigned_to = auth.uid()
  or reviewer_id = auth.uid()
  or exists (
    select 1
    from public.user_profiles profile
    where profile.id = auth.uid()
      and profile.role = 'admin'
  )
)
with check (
  requested_by = auth.uid()
  or assigned_to = auth.uid()
  or reviewer_id = auth.uid()
  or exists (
    select 1
    from public.user_profiles profile
    where profile.id = auth.uid()
      and profile.role = 'admin'
  )
);

drop policy if exists "copy_requests_delete" on public.copy_requests;
create policy "copy_requests_delete"
on public.copy_requests
for delete
to authenticated
using (
  requested_by = auth.uid()
  or exists (
    select 1
    from public.user_profiles profile
    where profile.id = auth.uid()
      and profile.role = 'admin'
  )
);

grant select, insert, update, delete on public.copy_requests to authenticated;

-- Realtime refresca el Centro de Copys. Los permisos finales se aplican en Migracion_Roles_Copys_Marcos_Victoria_Ursula.sql.
do $$
begin
  alter publication supabase_realtime add table public.copy_requests;
exception
  when duplicate_object then null;
end;
$$;

select 'Centro de Copys instalado correctamente' as resultado;

-- ============================================================================
-- SINCRONIZACIÓN COPY -> ACTIVIDAD
-- Incluida también en Migracion_Reportes_Copys_Actividades.sql para bases que
-- ya tenían instalado el Centro de Copys.
-- ============================================================================

create index if not exists copy_requests_activity_id_idx
  on public.copy_requests(activity_id);

create or replace function public.sync_copy_request_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_activity_id bigint;
  v_activity_status text;
  v_due_date date;
  v_assigned_to uuid;
  v_description text;
  v_completed_at timestamptz;
begin
  if tg_op = 'DELETE' then
    if old.activity_id is not null then
      delete from public.activities where id = old.activity_id;
    end if;
    return old;
  end if;

  v_activity_status := case
    when new.status in ('approved', 'published') then 'completed'
    when new.status = 'pending' then 'pending'
    else 'in_progress'
  end;

  v_due_date := coalesce(
    new.due_date,
    (coalesce(new.created_at, now()) at time zone 'America/Mexico_City')::date
  );
  v_assigned_to := coalesce(new.assigned_to, new.requested_by);
  v_description := concat(
    'Centro de Copys · ', new.product_topic,
    E'\nObjetivo: ', new.objective,
    E'\nCanales: ', coalesce(array_to_string(new.channels, ', '), 'Sin canal'),
    E'\nSolicitud de copy: ', new.id::text
  );
  v_completed_at := case
    when v_activity_status = 'completed'
      then coalesce(new.published_at, new.reviewed_at, now())
    else null
  end;
  v_activity_id := new.activity_id;

  if v_activity_id is null
     or not exists (select 1 from public.activities where id = v_activity_id) then
    insert into public.activities (
      title, description, assigned_to, created_by, area, due_date, due_time,
      priority, status, completed_at, recurrence_type, recurrence_days,
      recurrence_end_date, recurrence_group_id
    )
    values (
      'Copy · ' || new.title, v_description, v_assigned_to, new.requested_by,
      'marketing', v_due_date, null, 'medium', v_activity_status,
      v_completed_at, 'none', null, null, null
    )
    returning id into v_activity_id;

    update public.copy_requests
    set activity_id = v_activity_id
    where id = new.id
      and activity_id is distinct from v_activity_id;

    return new;
  end if;

  update public.activities
  set
    title = 'Copy · ' || new.title,
    description = v_description,
    assigned_to = v_assigned_to,
    due_date = v_due_date,
    status = v_activity_status,
    completed_at = v_completed_at,
    updated_at = now()
  where id = v_activity_id;

  return new;
end;
$$;

drop trigger if exists copy_requests_sync_activity on public.copy_requests;
create trigger copy_requests_sync_activity
after insert or update or delete on public.copy_requests
for each row execute function public.sync_copy_request_activity();
