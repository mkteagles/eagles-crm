# Evidencias de actividades en Reportes

## Objetivo
Reemplazar el envío redundante de evidencias a un grupo de WhatsApp por una carga centralizada dentro del CRM.

## Flujo
- Úrsula, Luis, Victoria, Marcos y usuarios operativos pueden adjuntar evidencia a actividades asignadas a ellos.
- Formatos: JPG, PNG, WEBP y PDF; máximo 8 MB por archivo.
- El bucket `report-evidence` es privado.
- Las evidencias se muestran mediante URLs firmadas temporales.
- Victoria puede ver todas las evidencias y copiar un resumen consolidado.
- Nancy, Jonathan y Lalo/Eduardo pueden consultar las evidencias de forma de solo lectura.
- Administradores conservan su acceso actual al reporte consolidado.

## Retención
Cada evidencia recibe `expires_at = created_at + 3 days`.
- Al abrir Reportes, el backend intenta limpiar archivos vencidos (respaldo automático).
- Se incluye `n8n/Eagles_Limpieza_Evidencias_Reportes_3_Dias.json` para una limpieza diaria a las 03:30 hora México.
- El workflow llama `/app1/api/report-evidence/cleanup` y requiere `REPORT_EVIDENCE_CLEANUP_SECRET`.

## Seguridad
- No hay URLs públicas permanentes de evidencias.
- Los usuarios solo pueden adjuntar a actividades asignadas a su propio usuario.
- La eliminación manual está disponible para el autor y Victoria.
- La tabla usa RLS sin policies públicas; la API server-side usa service role.


## Ajuste 2026-09-09 — carga solo del día
- El bloque **Evidencia de mis actividades** ahora muestra únicamente actividades con `due_date` igual a la fecha local actual del usuario.
- Ya no aparecen actividades de días anteriores ni actividades futuras para subir evidencia.
- Las evidencias ya cargadas siguen disponibles en el consolidado durante 3 días y luego se eliminan según la política existente.
