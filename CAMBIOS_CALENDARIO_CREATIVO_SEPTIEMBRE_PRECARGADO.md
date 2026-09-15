# Calendario creativo de Úrsula · Septiembre precargado + importación mensual Word

## Resultado

- Septiembre 2026 queda precargado desde el Word `SEPTIEMBRE 2026.docx` compartido por el equipo.
- Se cargan las 14 filas del documento conservando copy, contenido, enlaces, programación, responsable, VoBo y estatus tal como vienen en el archivo.
- Las filas sin fecha clara permanecen en `Por acomodar / fuera del mes` para que Úrsula las edite.
- Úrsula puede editar las tarjetas directamente desde el CRM.
- Para octubre, Úrsula solo navega a octubre y pulsa `Importar Word`.
- Si sube `OCTUBRE 2026.docx` con la misma tabla fija, el CRM convierte las filas en tarjetas editables y reemplaza solo octubre.
- El Word que Úrsula importe desde octubre en adelante sí se conserva en Storage privado como archivo original.
- La precarga de septiembre es idempotente: si septiembre ya contiene filas, volver a correr el SQL no las duplica ni reemplaza.

## Archivos del patch

- `app/components/CalendarCreative.tsx`
- `app/lib/creative-calendar-server.ts`
- `app/lib/docx-fixed-format.ts`
- `app/app1/api/creative-calendar/route.ts`
- `app/app1/api/creative-calendar/[id]/route.ts`
- `app/app1/api/creative-calendar/import/route.ts`
- `app/app1/api/creative-calendar/imports/[id]/download/route.ts`
- `Migracion_Calendario_Creativo_SEPTIEMBRE_PRECARGADO.sql`
