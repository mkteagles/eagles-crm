-- ============================================================================
-- EAGLES CRM · EFECTIVIDAD OPERATIVA
-- 1) Lives de Úrsula aparecen en actividades el día en que se crea/sube el copy.
-- 2) Bitácora idempotente para el reporte automático de Marcos por WhatsApp.
--
-- Ejecutar UNA VEZ en Supabase del CRM > SQL Editor.
-- No ejecutar en el Supabase del Campus.
-- ============================================================================

create extension if not exists pgcrypto;

-- --------------------------------------------------------------------------
-- A. COPY / LIVE -> ACTIVIDAD DEL DÍA DE CREACIÓN
--
-- Para copys normales se conserva due_date.
-- Para Lives, la actividad corresponde al trabajo de Úrsula realizado el día
-- en que creó/subió el copy, no al día futuro en que ocurrirá el Live.
-- --------------------------------------------------------------------------

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
  v_is_live boolean;
begin
  if tg_op = 'DELETE' then
    if old.activity_id is not null then
      delete from public.activities
      where id = old.activity_id;
    end if;

    return old;
  end if;

  v_activity_status := case
    when new.status in ('approved', 'published') then 'completed'
    when new.status = 'pending' then 'pending'
    else 'in_progress'
  end;

  v_is_live :=
    new.objective = 'Invitación a live'
    or lower(coalesce(new.product_topic, '')) like '%live%'
    or lower(coalesce(new.title, '')) like '%live%';

  v_due_date := case
    when v_is_live then
      (coalesce(new.created_at, now()) at time zone 'America/Mexico_City')::date
    else
      coalesce(
        new.due_date,
        (coalesce(new.created_at, now()) at time zone 'America/Mexico_City')::date
      )
  end;

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
     or not exists (
       select 1
       from public.activities
       where id = v_activity_id
     ) then

    insert into public.activities (
      title,
      description,
      assigned_to,
      created_by,
      area,
      due_date,
      due_time,
      priority,
      status,
      completed_at,
      recurrence_type,
      recurrence_days,
      recurrence_end_date,
      recurrence_group_id
    )
    values (
      'Copy · ' || new.title,
      v_description,
      v_assigned_to,
      new.requested_by,
      'marketing',
      v_due_date,
      null,
      'medium',
      v_activity_status,
      v_completed_at,
      'none',
      null,
      null,
      null
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

-- Corrige también Lives existentes, incluido el que Úrsula acaba de subir.
update public.copy_requests
set updated_at = now()
where objective = 'Invitación a live'
   or lower(coalesce(product_topic, '')) like '%live%'
   or lower(coalesce(title, '')) like '%live%';

-- --------------------------------------------------------------------------
-- B. BITÁCORA DEL REPORTE AUTOMÁTICO DE MARCOS
--
-- Impide que un reintento de n8n mande dos veces el mismo reporte el mismo día.
-- El backend usa service role; por eso no abrimos políticas a usuarios normales.
-- --------------------------------------------------------------------------

create table if not exists public.daily_report_whatsapp_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  report_date date not null,
  recipient text not null,
  instance_name text not null default 'WORKSHOP',
  status text not null default 'sent' check (status in ('sent', 'failed')),
  evolution_message_id text,
  response_payload jsonb,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, report_date, recipient)
);

create index if not exists daily_report_whatsapp_log_report_date_idx
  on public.daily_report_whatsapp_log(report_date desc);

alter table public.daily_report_whatsapp_log enable row level security;

select 'Migración Marcos + Úrsula + reporte WhatsApp instalada correctamente' as resultado;
