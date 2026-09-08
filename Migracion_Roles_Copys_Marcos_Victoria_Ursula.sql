-- ============================================================
-- EAGLES CRM · CENTRO DE COPYS · ROLES EXCLUSIVOS
-- Fecha: 2026-09-08
--
-- Objetivo:
--   * Workshop -> Marcos de inicio a fin.
--   * Cursos    -> Victoria de inicio a fin.
--   * Ursula    -> sin acceso a Workshop ni Cursos;
--                 queda reservada para futuros copys de Lives.
--   * Admins    -> conservan acceso total.
--
-- Este script NO cambia grupos de WhatsApp, campañas, horarios,
-- Evolution API ni el scheduler 10:00 / 17:00.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1) Reasignar solicitudes existentes a los nuevos responsables
-- ------------------------------------------------------------

do $$
declare
  v_marcos uuid;
  v_victoria uuid;
begin
  select id
  into v_marcos
  from public.user_profiles
  where lower(coalesce(email, '')) = 'marcosc@eagles.com'
     or translate(lower(coalesce(full_name, '')), 'áéíóúüñ', 'aeiouun') like '%marcos%'
  order by case when lower(coalesce(email, '')) = 'marcosc@eagles.com' then 0 else 1 end
  limit 1;

  select id
  into v_victoria
  from public.user_profiles
  where translate(lower(coalesce(full_name, '')), 'áéíóúüñ', 'aeiouun') like '%victoria%'
  limit 1;

  if v_marcos is null then
    raise exception 'No se encontró el usuario de Marcos en public.user_profiles.';
  end if;

  if v_victoria is null then
    raise exception 'No se encontró el usuario de Victoria en public.user_profiles.';
  end if;

  -- Cualquier Workshop queda exclusivamente en Marcos.
  update public.copy_requests
  set
    assigned_to = v_marcos,
    reviewer_id = v_marcos
  where lower(coalesce(product_topic, '')) like '%workshop%';

  -- Cualquier Curso que NO sea Workshop queda exclusivamente en Victoria.
  update public.copy_requests
  set
    assigned_to = v_victoria,
    reviewer_id = v_victoria
  where category = 'course'
    and lower(coalesce(product_topic, '')) not like '%workshop%';
end $$;

-- ------------------------------------------------------------
-- 2) RLS SELECT
--    Workshop solo Marcos/admin.
--    Cursos solo Victoria/admin.
--    Ursula solo futuros Lives.
--    Otros usuarios conservan visibilidad general fuera de
--    Workshop/Cursos.
-- ------------------------------------------------------------

drop policy if exists "copy_requests_select" on public.copy_requests;
create policy "copy_requests_select"
on public.copy_requests
for select
to authenticated
using (
  -- Admins: todo.
  exists (
    select 1
    from public.user_profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )

  -- Workshop: Marcos.
  or (
    lower(coalesce(product_topic, '')) like '%workshop%'
    and exists (
      select 1
      from public.user_profiles p
      where p.id = auth.uid()
        and (
          lower(coalesce(p.email, '')) = 'marcosc@eagles.com'
          or translate(lower(coalesce(p.full_name, '')), 'áéíóúüñ', 'aeiouun') like '%marcos%'
        )
    )
  )

  -- Cursos, excepto Workshop: Victoria.
  or (
    category = 'course'
    and lower(coalesce(product_topic, '')) not like '%workshop%'
    and exists (
      select 1
      from public.user_profiles p
      where p.id = auth.uid()
        and translate(lower(coalesce(p.full_name, '')), 'áéíóúüñ', 'aeiouun') like '%victoria%'
    )
  )

  -- Resto de copys: comportamiento general, con Ursula limitada a Lives.
  or (
    category <> 'course'
    and lower(coalesce(product_topic, '')) not like '%workshop%'
    and (
      not exists (
        select 1
        from public.user_profiles p
        where p.id = auth.uid()
          and (
            lower(coalesce(p.email, '')) = 'ursula@eagles.com'
            or translate(lower(coalesce(p.full_name, '')), 'áéíóúüñ', 'aeiouun') like '%ursula%'
          )
      )
      or objective = 'Invitación a live'
      or lower(coalesce(product_topic, '')) like '%live%'
      or lower(coalesce(title, '')) like '%live%'
    )
  )
);

-- ------------------------------------------------------------
-- 3) RLS INSERT
-- ------------------------------------------------------------

drop policy if exists "copy_requests_insert" on public.copy_requests;
create policy "copy_requests_insert"
on public.copy_requests
for insert
to authenticated
with check (
  requested_by = auth.uid()
  and (
    -- Admin
    exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
    -- Workshop -> Marcos
    or (
      lower(coalesce(product_topic, '')) like '%workshop%'
      and exists (
        select 1 from public.user_profiles p
        where p.id = auth.uid()
          and (
            lower(coalesce(p.email, '')) = 'marcosc@eagles.com'
            or translate(lower(coalesce(p.full_name, '')), 'áéíóúüñ', 'aeiouun') like '%marcos%'
          )
      )
    )
    -- Curso -> Victoria
    or (
      category = 'course'
      and lower(coalesce(product_topic, '')) not like '%workshop%'
      and exists (
        select 1 from public.user_profiles p
        where p.id = auth.uid()
          and translate(lower(coalesce(p.full_name, '')), 'áéíóúüñ', 'aeiouun') like '%victoria%'
      )
    )
    -- Otros copys; Ursula solo Lives
    or (
      category <> 'course'
      and lower(coalesce(product_topic, '')) not like '%workshop%'
      and (
        not exists (
          select 1 from public.user_profiles p
          where p.id = auth.uid()
            and (
              lower(coalesce(p.email, '')) = 'ursula@eagles.com'
              or translate(lower(coalesce(p.full_name, '')), 'áéíóúüñ', 'aeiouun') like '%ursula%'
            )
        )
        or objective = 'Invitación a live'
        or lower(coalesce(product_topic, '')) like '%live%'
        or lower(coalesce(title, '')) like '%live%'
      )
    )
  )
);

-- ------------------------------------------------------------
-- 4) RLS UPDATE
-- ------------------------------------------------------------

drop policy if exists "copy_requests_update" on public.copy_requests;
create policy "copy_requests_update"
on public.copy_requests
for update
to authenticated
using (
  exists (
    select 1 from public.user_profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
  or (
    lower(coalesce(product_topic, '')) like '%workshop%'
    and exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid()
        and (
          lower(coalesce(p.email, '')) = 'marcosc@eagles.com'
          or translate(lower(coalesce(p.full_name, '')), 'áéíóúüñ', 'aeiouun') like '%marcos%'
        )
    )
  )
  or (
    category = 'course'
    and lower(coalesce(product_topic, '')) not like '%workshop%'
    and exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid()
        and translate(lower(coalesce(p.full_name, '')), 'áéíóúüñ', 'aeiouun') like '%victoria%'
    )
  )
  or (
    category <> 'course'
    and lower(coalesce(product_topic, '')) not like '%workshop%'
    and (
      requested_by = auth.uid()
      or assigned_to = auth.uid()
      or reviewer_id = auth.uid()
    )
    and (
      not exists (
        select 1 from public.user_profiles p
        where p.id = auth.uid()
          and (
            lower(coalesce(p.email, '')) = 'ursula@eagles.com'
            or translate(lower(coalesce(p.full_name, '')), 'áéíóúüñ', 'aeiouun') like '%ursula%'
          )
      )
      or objective = 'Invitación a live'
      or lower(coalesce(product_topic, '')) like '%live%'
      or lower(coalesce(title, '')) like '%live%'
    )
  )
)
with check (
  exists (
    select 1 from public.user_profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
  or (
    lower(coalesce(product_topic, '')) like '%workshop%'
    and exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid()
        and (
          lower(coalesce(p.email, '')) = 'marcosc@eagles.com'
          or translate(lower(coalesce(p.full_name, '')), 'áéíóúüñ', 'aeiouun') like '%marcos%'
        )
    )
  )
  or (
    category = 'course'
    and lower(coalesce(product_topic, '')) not like '%workshop%'
    and exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid()
        and translate(lower(coalesce(p.full_name, '')), 'áéíóúüñ', 'aeiouun') like '%victoria%'
    )
  )
  or (
    category <> 'course'
    and lower(coalesce(product_topic, '')) not like '%workshop%'
    and (
      requested_by = auth.uid()
      or assigned_to = auth.uid()
      or reviewer_id = auth.uid()
    )
    and (
      not exists (
        select 1 from public.user_profiles p
        where p.id = auth.uid()
          and (
            lower(coalesce(p.email, '')) = 'ursula@eagles.com'
            or translate(lower(coalesce(p.full_name, '')), 'áéíóúüñ', 'aeiouun') like '%ursula%'
          )
      )
      or objective = 'Invitación a live'
      or lower(coalesce(product_topic, '')) like '%live%'
      or lower(coalesce(title, '')) like '%live%'
    )
  )
);

-- ------------------------------------------------------------
-- 5) RLS DELETE
-- ------------------------------------------------------------

drop policy if exists "copy_requests_delete" on public.copy_requests;
create policy "copy_requests_delete"
on public.copy_requests
for delete
to authenticated
using (
  exists (
    select 1 from public.user_profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
  or (
    lower(coalesce(product_topic, '')) like '%workshop%'
    and exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid()
        and (
          lower(coalesce(p.email, '')) = 'marcosc@eagles.com'
          or translate(lower(coalesce(p.full_name, '')), 'áéíóúüñ', 'aeiouun') like '%marcos%'
        )
    )
  )
  or (
    category = 'course'
    and lower(coalesce(product_topic, '')) not like '%workshop%'
    and exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid()
        and translate(lower(coalesce(p.full_name, '')), 'áéíóúüñ', 'aeiouun') like '%victoria%'
    )
  )
  or (
    category <> 'course'
    and lower(coalesce(product_topic, '')) not like '%workshop%'
    and requested_by = auth.uid()
    and (
      not exists (
        select 1 from public.user_profiles p
        where p.id = auth.uid()
          and (
            lower(coalesce(p.email, '')) = 'ursula@eagles.com'
            or translate(lower(coalesce(p.full_name, '')), 'áéíóúüñ', 'aeiouun') like '%ursula%'
          )
      )
      or objective = 'Invitación a live'
      or lower(coalesce(product_topic, '')) like '%live%'
      or lower(coalesce(title, '')) like '%live%'
    )
  )
);

commit;

-- ============================================================
-- VERIFICACIÓN
-- Debe mostrar Workshop -> Marcos y Cursos -> Victoria.
-- ============================================================
select
  cr.id,
  cr.category,
  cr.product_topic,
  cr.objective,
  assigned.full_name as responsable,
  reviewer.full_name as revisa,
  cr.status
from public.copy_requests cr
left join public.user_profiles assigned on assigned.id = cr.assigned_to
left join public.user_profiles reviewer on reviewer.id = cr.reviewer_id
where lower(coalesce(cr.product_topic, '')) like '%workshop%'
   or cr.category = 'course'
order by cr.updated_at desc
limit 50;
