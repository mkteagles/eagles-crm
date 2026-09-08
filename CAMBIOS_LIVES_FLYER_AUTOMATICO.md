# Lives · Flyer automático para Úrsula

## Objetivo
Úrsula ya no necesita editar o subir manualmente el flyer de cada Live. Al crear un Live, captura tema, fecha y grupos; el CRM genera un PNG listo para WhatsApp usando las plantillas históricas ya incluidas.

## Arquitectura sin modelos de imagen de pago
- No usa OpenAI Images, Midjourney, Canva API ni otro generador de imagen de pago.
- No necesita Ollama para rasterizar el flyer: el render es determinístico con `sharp` dentro del backend del CRM.
- Ollama/n8n se conservan para los flujos de copy existentes; Workshop y Curso JF017 no cambian.
- El PNG se sube al bucket público `marketing-assets` y queda como asset `selected` en `marketing_copy_assets`.
- El scheduler existente de Workshop + Cursos + Lives toma ese asset y lo manda por Evolution igual que antes.

## Flujo nuevo
1. Úrsula abre Nuevo Live.
2. Captura tema y fecha; selecciona grupos.
3. El CRM crea la solicitud.
4. El backend selecciona automáticamente una de las 5 plantillas de Lives. La selección es estable por tema+fecha; desde el detalle se puede cambiar al siguiente estilo con un botón.
5. El backend cubre las zonas variables del PNG original y coloca:
   - Transmisión / tema.
   - Día y fecha.
   - 11 AM.
6. Se genera PNG 1728x2304.
7. Se sube a `marketing-assets`.
8. Se registra como contenido seleccionado del copy.
9. Úrsula revisa la vista previa, se envía a su propia revisión y programa.

## Controles
- Botón `Cambiar estilo del flyer`: genera la misma información con la siguiente plantilla disponible.
- Botón `Reemplazar manualmente`: se conserva como salida de emergencia.
- La aprobación de Live ya no exige que Úrsula suba un archivo; exige que exista el flyer automático.

## Archivos principales
- `app/lib/live-flyer.ts`: renderer de flyer.
- `app/app1/api/copy-requests/[id]/live/route.ts`: generación, Storage y registro del asset.
- `app/components/CopyCenterDashboard.tsx`: UX de flyer automático y regeneración.
- `package.json`: dependencia directa `sharp`.

## Base de datos
No requiere migración SQL nueva. Reutiliza:
- `copy_live_settings`
- `marketing_copy_assets`
- `whatsapp_deliveries`
- bucket `marketing-assets`

## n8n
No requiere reemplazar el Centro de Copys ni el scheduler. El scheduler ya consume el asset seleccionado desde `marketing_copy_assets`.
