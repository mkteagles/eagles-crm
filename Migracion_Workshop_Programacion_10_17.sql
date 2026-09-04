-- ============================================================
-- WORKSHOP OCTUBRE · PROGRAMACIÓN AUTOMÁTICA 10:00 / 17:00
-- Ejecutar UNA sola vez en Supabase del CRM.
--
-- Hoy deja como destino PRUEBA_VICTORIA.
-- Mañana, al tener el group_jid real, se agrega el grupo real y
-- se cambia target_group_code sin tocar el código del CRM.
-- ============================================================

create table if not exists public.whatsapp_campaign_settings (
  code text primary key,
  name text not null,
  campaign_month text,
  target_group_code text not null references public.whatsapp_groups(code),
  timezone text not null default 'America/Mexico_City',
  send_time_1 time not null default '10:00',
  send_time_2 time not null default '17:00',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.whatsapp_deliveries
  add column if not exists campaign_code text;

create index if not exists idx_whatsapp_deliveries_campaign_status
  on public.whatsapp_deliveries(campaign_code, status, scheduled_at);

insert into public.whatsapp_campaign_settings (
  code,
  name,
  campaign_month,
  target_group_code,
  timezone,
  send_time_1,
  send_time_2,
  is_active
)
values (
  'WORKSHOP_OCTUBRE',
  'Workshop Octubre · Transmisiones Automáticas Convencionales',
  '2026-10',
  'PRUEBA_VICTORIA',
  'America/Mexico_City',
  '10:00'::time,
  '17:00'::time,
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
  is_active = excluded.is_active,
  updated_at = now();

-- Devuelve el próximo espacio libre sin reservarlo.
create or replace function public.next_whatsapp_campaign_slot(p_campaign_code text)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg public.whatsapp_campaign_settings%rowtype;
  grp public.whatsapp_groups%rowtype;
  local_now timestamp;
  local_slot timestamp;
  candidate timestamptz;
  slot_time time;
  day_offset integer;
begin
  select * into cfg
  from public.whatsapp_campaign_settings
  where code = p_campaign_code
    and is_active = true;

  if not found then
    raise exception 'No existe configuración activa para %', p_campaign_code;
  end if;

  select * into grp
  from public.whatsapp_groups
  where code = cfg.target_group_code
    and is_active = true;

  if not found then
    raise exception 'No existe el grupo activo %', cfg.target_group_code;
  end if;

  local_now := timezone(cfg.timezone, now());

  for day_offset in 0..60 loop
    foreach slot_time in array array[cfg.send_time_1, cfg.send_time_2] loop
      local_slot := (local_now::date + day_offset) + slot_time;

      if local_slot <= local_now then
        continue;
      end if;

      candidate := local_slot at time zone cfg.timezone;

      if not exists (
        select 1
        from public.whatsapp_deliveries wd
        where wd.group_id = grp.id
          and wd.scheduled_at = candidate
          and wd.status in ('scheduled', 'sending', 'sent')
      ) then
        return candidate;
      end if;
    end loop;
  end loop;

  raise exception 'No hay espacios disponibles en los próximos 60 días';
end;
$$;

-- Reserva el próximo espacio libre e inserta la entrega de forma atómica.
create or replace function public.schedule_whatsapp_campaign_delivery(
  p_campaign_code text,
  p_copy_request_ref text,
  p_asset_id uuid,
  p_caption text,
  p_approved_by uuid
)
returns public.whatsapp_deliveries
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg public.whatsapp_campaign_settings%rowtype;
  grp public.whatsapp_groups%rowtype;
  local_now timestamp;
  local_slot timestamp;
  candidate timestamptz;
  slot_time time;
  day_offset integer;
  delivery public.whatsapp_deliveries%rowtype;
begin
  select * into cfg
  from public.whatsapp_campaign_settings
  where code = p_campaign_code
    and is_active = true
  for update;

  if not found then
    raise exception 'No existe configuración activa para %', p_campaign_code;
  end if;

  select * into grp
  from public.whatsapp_groups
  where code = cfg.target_group_code
    and is_active = true;

  if not found then
    raise exception 'No existe el grupo activo %', cfg.target_group_code;
  end if;

  if exists (
    select 1
    from public.whatsapp_deliveries wd
    where wd.copy_request_ref = p_copy_request_ref
      and wd.status in ('scheduled', 'sending', 'sent')
  ) then
    raise exception 'Este copy ya tiene un envío programado o enviado';
  end if;

  local_now := timezone(cfg.timezone, now());

  for day_offset in 0..60 loop
    foreach slot_time in array array[cfg.send_time_1, cfg.send_time_2] loop
      local_slot := (local_now::date + day_offset) + slot_time;

      if local_slot <= local_now then
        continue;
      end if;

      candidate := local_slot at time zone cfg.timezone;

      if not exists (
        select 1
        from public.whatsapp_deliveries wd
        where wd.group_id = grp.id
          and wd.scheduled_at = candidate
          and wd.status in ('scheduled', 'sending', 'sent')
      ) then
        insert into public.whatsapp_deliveries (
          copy_request_ref,
          campaign_code,
          asset_id,
          instance_id,
          group_id,
          caption,
          scheduled_at,
          status,
          approved_by,
          approved_at
        )
        values (
          p_copy_request_ref,
          p_campaign_code,
          p_asset_id,
          grp.instance_id,
          grp.id,
          p_caption,
          candidate,
          'scheduled',
          p_approved_by,
          now()
        )
        returning * into delivery;

        return delivery;
      end if;
    end loop;
  end loop;

  raise exception 'No hay espacios disponibles en los próximos 60 días';
end;
$$;

-- Trigger de updated_at para settings.
drop trigger if exists trg_whatsapp_campaign_settings_updated_at
  on public.whatsapp_campaign_settings;

create trigger trg_whatsapp_campaign_settings_updated_at
before update on public.whatsapp_campaign_settings
for each row execute function public.set_updated_at();

-- Verificación.
select
  s.code,
  s.target_group_code,
  s.timezone,
  s.send_time_1,
  s.send_time_2,
  public.next_whatsapp_campaign_slot(s.code) as proximo_espacio
from public.whatsapp_campaign_settings s
where s.code = 'WORKSHOP_OCTUBRE';
