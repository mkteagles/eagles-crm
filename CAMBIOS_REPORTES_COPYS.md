# Cambios · Reportes consolidados y copys como actividades

## Qué se corrigió

1. El consolidado ya no asume que existe un solo usuario administrador. Luis y cualquier otro admin aparecen con sus actividades.
2. Victoria aparece en el consolidado si tiene actividades, sugerencias o reportes guardados, aunque su rol no sea `executor` o `admin`.
3. Los reportes diarios guardados ahora se pueden abrir y leer dentro del consolidado; antes únicamente se mostraba el contador.
4. El consolidado incluye actividades cuya fecha de vencimiento está en el periodo **o que fueron actualizadas durante el periodo**.
5. El reporte individual de un administrador ya no mezcla actividades de otros usuarios: solo toma las asignadas al usuario del reporte.
6. Cada solicitud del Centro de Copys se sincroniza automáticamente con una actividad de Marketing.
7. Los copys existentes también se convierten en actividades mediante backfill.

## Paso obligatorio en Supabase

Después de subir esta versión del CRM, ejecuta **una sola vez** en el SQL Editor del Supabase del CRM:

`Migracion_Reportes_Copys_Actividades.sql`

No lo ejecutes en el Supabase del Campus.

## n8n

No requiere cambios en n8n.

## Prueba recomendada

1. Abre Marketing → Reportes y selecciona “Hoy”.
2. Confirma que aparezca Victoria y abre su reporte guardado.
3. Confirma que aparezcan las actividades de Luis, incluso si alguna fue actualizada hoy y tenía otra fecha de vencimiento.
4. Crea un copy desde Marketing → Centro de Copys.
5. Regresa a Actividades/Reportes: debe aparecer una actividad con prefijo `Copy ·` para el responsable del copy.
6. Manda el copy a revisión: la actividad debe pasar a “En progreso”.
7. Aprueba o publica el copy: la actividad debe quedar “Completada”.
