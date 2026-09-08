-- ============================================================
-- EAGLES CRM · LIVES · ÚRSULA · MULTIGRUPO
-- Fecha: 2026-09-08
--
-- Objetivo:
--   * Úrsula lleva los Lives de inicio a fin.
--   * Live normal: miércoles.
--   * Botón de fecha extraordinaria: permite cualquier fecha.
--   * Martes / día anterior: envíos escalonados 08:30–10:30 MX.
--   * Miércoles / día del Live: envíos escalonados 08:00–10:00 MX.
--   * Instancia de salida: GRUPOS.
--   * Los grupos se seleccionan desde el CRM por cada Live.
--
-- IMPORTANTE:
--   Este SQL NO toca WORKSHOP_OCTUBRE ni CURSO_JF017_OCTUBRE.
-- ============================================================

begin;

create table if not exists public.copy_live_settings (
  copy_request_ref uuid primary key
    references public.copy_requests(id)
    on delete cascade,
  live_date date not null,
  is_extraordinary boolean not null default false,
  template_id text not null default '1',
  selected_group_codes text[] not null default '{}'::text[],
  timezone text not null default 'America/Mexico_City',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_copy_live_settings_live_date
  on public.copy_live_settings(live_date);

comment on table public.copy_live_settings is
'Configuración de Lives: fecha, plantilla visual de referencia y grupos de WhatsApp seleccionados.';

-- La tabla se manipula desde rutas del servidor con service role.
alter table public.copy_live_settings enable row level security;

-- Trigger updated_at, reutilizando la función ya existente del CRM.
drop trigger if exists trg_copy_live_settings_updated_at
  on public.copy_live_settings;

create trigger trg_copy_live_settings_updated_at
before update on public.copy_live_settings
for each row execute function public.set_updated_at();

commit;

-- Verificación: instancia GRUPOS y grupos disponibles.
select
  wi.code as instancia,
  wg.code as group_code,
  wg.name as grupo,
  wg.group_jid,
  wg.is_active
from public.whatsapp_groups wg
join public.whatsapp_instances wi on wi.id = wg.instance_id
where wi.code = 'GRUPOS'
  and wi.is_active = true
  and wg.is_active = true
order by wg.name;
