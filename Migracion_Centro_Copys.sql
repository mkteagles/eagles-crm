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

-- Realtime permite que Úrsula y Victoria vean los cambios sin recargar.
do $$
begin
  alter publication supabase_realtime add table public.copy_requests;
exception
  when duplicate_object then null;
end;
$$;

select 'Centro de Copys instalado correctamente' as resultado;
