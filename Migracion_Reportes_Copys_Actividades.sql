-- ============================================================================
-- EAGLES CRM · REPORTES CONSOLIDADOS + COPYS COMO ACTIVIDADES
-- Ejecutar UNA VEZ en Supabase del CRM > SQL Editor.
-- Es segura para una base donde Migracion_Centro_Copys.sql ya fue ejecutada.
-- No ejecutar en el Supabase del Campus.
-- ============================================================================

-- El vínculo ya existe en instalaciones nuevas, pero lo agregamos de forma
-- idempotente para instalaciones anteriores.
alter table public.copy_requests
  add column if not exists activity_id bigint references public.activities(id) on delete set null;

create index if not exists copy_requests_activity_id_idx
  on public.copy_requests(activity_id);

-- Mantiene una actividad de Marketing por cada solicitud de copy.
-- De esta forma los copys entran automáticamente a reportes diarios y al
-- consolidado sin que el equipo tenga que capturarlos dos veces.
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

  -- Si todavía no existe actividad (incluye copys creados antes de esta
  -- migración), la creamos y guardamos el vínculo en copy_requests.
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

  -- Si el copy cambia de responsable, fecha o estado, su actividad queda
  -- sincronizada para que el reporte siempre refleje el estado real.
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

-- Backfill: crea actividades para todos los copys que ya existían antes de
-- instalar este cambio. La actualización dispara el trigger anterior.
update public.copy_requests
set updated_at = updated_at
where activity_id is null;

select 'Reportes corregidos y copys sincronizados como actividades' as resultado;
