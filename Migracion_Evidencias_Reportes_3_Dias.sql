-- ============================================================
-- EAGLES CRM · EVIDENCIAS DE ACTIVIDADES EN REPORTES
-- Retención: 3 días
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.report_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  activity_id bigint references public.activities(id) on delete set null,
  report_date date not null default (timezone('America/Mexico_City', now()))::date,
  note text null,
  storage_bucket text not null default 'report-evidence',
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '3 days')
);

create index if not exists report_evidence_user_date_idx
  on public.report_evidence(user_id, report_date desc);

create index if not exists report_evidence_activity_idx
  on public.report_evidence(activity_id);

create index if not exists report_evidence_expires_idx
  on public.report_evidence(expires_at);

alter table public.report_evidence enable row level security;

-- El navegador no consulta esta tabla directamente.
-- Toda lectura/escritura pasa por rutas server-side del CRM usando service role.
-- Por eso no se crean policies públicas.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'report-evidence',
  'report-evidence',
  false,
  8388608,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
  ]::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Verificación
select
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name = 'report_evidence';

select
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
from storage.buckets
where id = 'report-evidence';
