
-- ============================================================
-- EAGLES CRM · WHATSAPP / CALENTAMIENTOS · BASE DE PRUEBAS
-- Fecha: 2026-09-04
--
-- IMPORTANTE:
-- - Esta migración registra SOLO el grupo de PRUEBA de Victoria.
-- - NO registra todavía el grupo real de la nueva Workshop.
-- - La API key de Evolution NO se guarda en Supabase.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1) INSTANCIAS DE EVOLUTION / WHATSAPP
-- ------------------------------------------------------------
create table if not exists public.whatsapp_instances (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  provider text not null default 'evolution',
  base_url text not null,
  instance_name text not null,
  phone_label text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.whatsapp_instances is
'Instancias/números de WhatsApp. La API key se queda en n8n/Vercel y NO se guarda aquí.';

-- ------------------------------------------------------------
-- 2) GRUPOS DESTINO
-- ------------------------------------------------------------
create table if not exists public.whatsapp_groups (
  id uuid primary key default gen_random_uuid(),
  instance_id uuid not null references public.whatsapp_instances(id) on delete cascade,
  code text not null unique,
  name text not null,
  group_jid text not null,
  purpose text not null default 'test',
  default_send_time_1 time,
  default_send_time_2 time,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(instance_id, group_jid)
);

comment on table public.whatsapp_groups is
'Grupos de WhatsApp asociados a una instancia. PRUEBA_VICTORIA será el sandbox antes de usar grupos reales.';

-- ------------------------------------------------------------
-- 3) IMÁGENES / ASSETS DE LOS COPYS
-- ------------------------------------------------------------
create table if not exists public.marketing_copy_assets (
  id uuid primary key default gen_random_uuid(),

  -- Referencia flexible al copy/calientamiento actual.
  -- Más adelante la conectamos al ID real del Centro de Copys.
  copy_request_ref text,

  asset_type text not null default 'image'
    check (asset_type in ('image','video','pdf','other')),

  storage_bucket text not null default 'marketing-assets',
  storage_path text not null,
  public_url text,

  version integer not null default 1,

  status text not null default 'ready'
    check (status in ('generating','ready','selected','rejected','archived')),

  prompt_used text,
  metadata jsonb not null default '{}'::jsonb,

  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_marketing_copy_assets_copy_request_ref
  on public.marketing_copy_assets(copy_request_ref);

create index if not exists idx_marketing_copy_assets_status
  on public.marketing_copy_assets(status);

comment on table public.marketing_copy_assets is
'Assets visuales de cada calentamiento. Permite varias versiones y seleccionar la que Victoria apruebe.';

-- ------------------------------------------------------------
-- 4) COLA / HISTORIAL DE ENVÍOS A WHATSAPP
-- ------------------------------------------------------------
create table if not exists public.whatsapp_deliveries (
  id uuid primary key default gen_random_uuid(),

  copy_request_ref text,

  asset_id uuid
    references public.marketing_copy_assets(id)
    on delete set null,

  instance_id uuid not null
    references public.whatsapp_instances(id)
    on delete restrict,

  group_id uuid not null
    references public.whatsapp_groups(id)
    on delete restrict,

  caption text not null,

  scheduled_at timestamptz,

  status text not null default 'pending'
    check (status in (
      'pending',
      'approved',
      'scheduled',
      'sending',
      'sent',
      'failed',
      'cancelled'
    )),

  approved_by uuid,
  approved_at timestamptz,

  sent_at timestamptz,
  evolution_message_id text,
  error_message text,
  retry_count integer not null default 0,
  response_payload jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_whatsapp_deliveries_status_scheduled
  on public.whatsapp_deliveries(status, scheduled_at);

create index if not exists idx_whatsapp_deliveries_copy_request_ref
  on public.whatsapp_deliveries(copy_request_ref);

comment on table public.whatsapp_deliveries is
'Cola e historial de envíos. Una fila = un calentamiento enviado/programado a un grupo.';

-- ------------------------------------------------------------
-- 5) BUCKET DE IMÁGENES
-- Ya lo creaste manualmente; esto solo asegura la configuración.
-- ------------------------------------------------------------
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'marketing-assets',
  'marketing-assets',
  true,
  10485760,
  array['image/jpeg','image/png','image/webp']::text[]
)
on conflict (id) do update
set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ------------------------------------------------------------
-- 6) INSTANCIA ACTUAL: WORKSHOP
-- ------------------------------------------------------------
insert into public.whatsapp_instances (
  code,
  name,
  provider,
  base_url,
  instance_name,
  phone_label,
  is_active
)
values (
  'WORKSHOP',
  'Workshop',
  'evolution',
  'https://lanzamientodigital-evolution-api.rstd2l.easypanel.host',
  'WORKSHOP',
  'Número Workshop',
  true
)
on conflict (code) do update
set
  name = excluded.name,
  provider = excluded.provider,
  base_url = excluded.base_url,
  instance_name = excluded.instance_name,
  phone_label = excluded.phone_label,
  is_active = excluded.is_active,
  updated_at = now();

-- ------------------------------------------------------------
-- 7) GRUPO DE PRUEBA DE VICTORIA
-- Este NO es el grupo real de la Workshop.
-- ------------------------------------------------------------
insert into public.whatsapp_groups (
  instance_id,
  code,
  name,
  group_jid,
  purpose,
  default_send_time_1,
  default_send_time_2,
  is_active
)
select
  wi.id,
  'PRUEBA_VICTORIA',
  'Prueba Victoria',
  '120363409439960903@g.us',
  'test',
  '10:00'::time,
  '17:00'::time,
  true
from public.whatsapp_instances wi
where wi.code = 'WORKSHOP'
on conflict (code) do update
set
  instance_id = excluded.instance_id,
  name = excluded.name,
  group_jid = excluded.group_jid,
  purpose = excluded.purpose,
  default_send_time_1 = excluded.default_send_time_1,
  default_send_time_2 = excluded.default_send_time_2,
  is_active = excluded.is_active,
  updated_at = now();

-- ------------------------------------------------------------
-- 8) updated_at automático
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_whatsapp_instances_updated_at
  on public.whatsapp_instances;

create trigger trg_whatsapp_instances_updated_at
before update on public.whatsapp_instances
for each row execute function public.set_updated_at();


drop trigger if exists trg_whatsapp_groups_updated_at
  on public.whatsapp_groups;

create trigger trg_whatsapp_groups_updated_at
before update on public.whatsapp_groups
for each row execute function public.set_updated_at();


drop trigger if exists trg_whatsapp_deliveries_updated_at
  on public.whatsapp_deliveries;

create trigger trg_whatsapp_deliveries_updated_at
before update on public.whatsapp_deliveries
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 9) VERIFICACIÓN FINAL
-- Si todo salió bien, debe regresar UNA fila:
-- WORKSHOP | PRUEBA_VICTORIA | 120363409439960903@g.us
-- ------------------------------------------------------------
select
  wi.code as instancia,
  wi.instance_name,
  wg.code as grupo_codigo,
  wg.name as grupo_nombre,
  wg.group_jid,
  wg.purpose,
  wg.default_send_time_1,
  wg.default_send_time_2
from public.whatsapp_instances wi
join public.whatsapp_groups wg
  on wg.instance_id = wi.id
where
  wi.code = 'WORKSHOP'
  and wg.code = 'PRUEBA_VICTORIA';

-- ============================================================
-- SIGUIENTE PASO:
-- Cuando tengas el ID REAL del grupo de la nueva Workshop,
-- agregamos OTRO registro. No sustituimos PRUEBA_VICTORIA.
-- ============================================================
