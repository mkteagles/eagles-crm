-- ============================================================
-- WORKSHOP OCTUBRE · MARCOS ÚNICO REVISOR + MULTIMEDIA
-- Ejecutar UNA sola vez en Supabase del CRM.
-- ============================================================

-- 1) Permitir imágenes y videos cortos en el bucket existente.
update storage.buckets
set
  public = true,
  file_size_limit = 20971520, -- 20 MB en Storage; el CRM limita video a 16 MB.
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime'
  ]::text[]
where id = 'marketing-assets';

-- 2) Asegurar que cualquier copy existente de la Workshop de octubre
--    quede asignado a Marcos como revisor, no a Victoria.
update public.copy_requests cr
set
  reviewer_id = up.id,
  updated_at = now()
from public.user_profiles up
where lower(trim(up.email)) = 'marcosc@eagles.com'
  and cr.campaign_month = '2026-10'
  and lower(cr.product_topic) like '%workshop%';

-- 3) Verificación.
select
  cr.id,
  cr.product_topic,
  cr.campaign_month,
  up.full_name as revisor,
  up.email as reviewer_email,
  cr.status
from public.copy_requests cr
left join public.user_profiles up on up.id = cr.reviewer_id
where cr.campaign_month = '2026-10'
  and lower(cr.product_topic) like '%workshop%'
order by cr.updated_at desc;
