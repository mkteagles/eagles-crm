# Cambios · Marcos autónomo + actividad de Lives de Úrsula + reporte WhatsApp 5 PM

## 1. Marcos puede aprobar sus propias ideas

- Marcos sigue pudiendo crear ideas.
- Si una idea está asignada a Marcos como responsable, él verá el botón **Aprobar** aunque su rol técnico no sea admin.
- Al aprobar:
  - se crea inmediatamente la actividad de Marketing;
  - la idea cambia a `approved`;
  - la tabla de actividades se refresca sin depender de Victoria.
- La aprobación propia se valida en servidor: solo funciona para Marcos y solo cuando `assigned_to` coincide con su usuario.
- Las aprobaciones administrativas existentes no se modifican.

Archivos principales:
- `app/components/ActivityIdeas.tsx`
- `app/components/ReviewActivityIdeaModal.tsx`
- `app/lib/activity-ideas-hooks.ts`
- `app/app1/api/activity-ideas/self-approve/route.ts`
- `app/components/MarketingDashboard.tsx`
- `app/lib/supabase/middleware.ts`

## 2. Los Lives de Úrsula aparecen en sus actividades el mismo día

Antes, un Live para jueves podía crear la actividad con `due_date = jueves`, por lo que no aparecía en las actividades/evidencias del martes cuando Úrsula realmente hizo el trabajo.

La migración cambia `sync_copy_request_activity()` para que:
- copys normales conserven su fecha de entrega;
- copys de Lives usen como fecha de actividad el día en que se creó/subió el copy;
- al aprobar/publicar el Live, la actividad se marque completada manteniendo la fecha de trabajo;
- haga backfill de Lives existentes, incluido el Live recién creado.

SQL:
- `Migracion_Marcos_Ursula_Reporte_Automatico.sql`

## 3. Reporte individual de Marcos visible en Reportes

- Marcos puede ver su reporte individual aunque su rol sea `admin`.
- En Reportes aparece un aviso de que el envío de WhatsApp está automatizado.
- Se mantiene el consolidado existente.

Archivos:
- `app/components/DailyReportGenerator.tsx`
- `app/app1/marketing/reports/page.tsx`

## 4. Reporte de Marcos por WhatsApp a las 5 PM, lunes a sábado

Se agregó un endpoint servidor-a-servidor:

`/app1/api/automation/marcos-daily-report`

El endpoint:
- identifica a Marcos por `marcosc@eagles.com`;
- toma sus actividades del día;
- incluye sugerencias de contenido del día;
- genera el reporte actualizado;
- lo guarda en `daily_reports`;
- evita duplicados mediante `daily_report_whatsapp_log`;
- no envía los domingos.

Destino solicitado:
- WhatsApp: `4495604176`
- formato interno de Evolution: `5214495604176`
- instancia: `WORKSHOP`

Variable nueva en Vercel:

`DAILY_REPORT_AUTOMATION_SECRET`

Debe ser un valor largo y privado. El mismo valor se configura en el nodo **Configuración privada** de n8n.

Workflow incluido:

`n8n/Eagles_Reporte_Marcos_WhatsApp_5PM_Lun_Sab.json`

Horario:
- lunes a sábado
- 5:00 PM
- zona horaria `America/Mexico_City`

El workflow usa `/message/sendText/WORKSHOP` de Evolution API y registra el envío exitoso para impedir que un reintento mande el reporte dos veces.

## Orden de instalación

1. Subir/desplegar el ZIP del CRM.
2. Ejecutar `Migracion_Marcos_Ursula_Reporte_Automatico.sql` en Supabase del CRM.
3. Crear en Vercel la variable `DAILY_REPORT_AUTOMATION_SECRET` como Secret para Production y redeploy.
4. Importar `Eagles_Reporte_Marcos_WhatsApp_5PM_Lun_Sab.json` en n8n.
5. En el nodo `Configuración privada`, poner:
   - el mismo `DAILY_REPORT_AUTOMATION_SECRET`;
   - la Evolution API key actual.
6. Activar el workflow.

## Pruebas recomendadas

### Marcos
Crear una idea y asignarla a Marcos. Debe aparecer **Aprobar**. Al aprobar, la idea desaparece de pendientes y la actividad aparece de inmediato.

### Úrsula
Abrir Actividades/Reportes después de crear un Live hoy. El copy del Live debe aparecer con fecha de hoy aunque el Live sea mañana o pasado mañana.

### Reporte automático
Para probar sin mandar WhatsApp antes de las 5 PM, ejecutar solamente hasta el nodo **Generar reporte Marcos**. Debe devolver `shouldSend: true` y el texto del reporte.

No ejecutar manualmente el nodo de envío completo si se desea conservar el envío automático de las 5 PM, porque al enviarlo y registrarlo el sistema lo considerará ya enviado ese día.
