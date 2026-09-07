-- ============================================================
-- CURSO ONLINE CVT JF017 · OCTUBRE 2026 · PRUEBAS WHATSAPP
-- Ejecutar UNA VEZ en Supabase del CRM.
--
-- Destino temporal: PRUEBA_VICTORIA
-- Horarios de calentamiento: 10:00 y 17:00 (hora México)
-- Más adelante solo se cambia target_group_code al grupo real.
-- ============================================================

-- La tabla ya existe por la Workshop; esto solo asegura compatibilidad.
alter table public.whatsapp_campaign_settings
  add column if not exists starts_at timestamptz;

alter table public.whatsapp_deliveries
  add column if not exists campaign_code text;

create index if not exists idx_whatsapp_deliveries_campaign_status
  on public.whatsapp_deliveries(campaign_code, status, scheduled_at);

-- Limpia únicamente pruebas pendientes anteriores de ESTA campaña, si se vuelve a ejecutar.
delete from public.whatsapp_deliveries
where campaign_code = 'CURSO_JF017_OCTUBRE'
  and status in ('pending', 'approved', 'scheduled', 'failed', 'cancelled');

-- Configuración temporal para pruebas en el grupo de Victoria.
insert into public.whatsapp_campaign_settings (
  code,
  name,
  campaign_month,
  target_group_code,
  timezone,
  send_time_1,
  send_time_2,
  starts_at,
  is_active
)
values (
  'CURSO_JF017_OCTUBRE',
  'Curso Online CVT JF017 · Octubre 2026',
  '2026-10',
  'PRUEBA_VICTORIA',
  'America/Mexico_City',
  '10:00'::time,
  '17:00'::time,
  now(),
  true
)
on conflict (code) do update
set
  name = excluded.name,
  campaign_month = excluded.campaign_month,
  target_group_code = excluded.target_group_code,
  timezone = excluded.timezone,
  send_time_1 = excluded.send_time_1,
  send_time_2 = excluded.send_time_2,
  starts_at = excluded.starts_at,
  is_active = excluded.is_active,
  updated_at = now();

-- Verificación: debe mostrar PRUEBA_VICTORIA y el próximo slot libre.
select
  s.code as campaign,
  s.target_group_code,
  g.name as grupo,
  g.group_jid,
  i.instance_name as instancia,
  s.timezone,
  s.send_time_1,
  s.send_time_2,
  s.starts_at,
  public.next_whatsapp_campaign_slot(s.code) at time zone s.timezone as siguiente_slot_hora_mexico
from public.whatsapp_campaign_settings s
join public.whatsapp_groups g on g.code = s.target_group_code
join public.whatsapp_instances i on i.id = g.instance_id
where s.code = 'CURSO_JF017_OCTUBRE';
