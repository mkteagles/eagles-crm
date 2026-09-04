# Prueba WhatsApp para Victoria

Esta versión agrega una prueba controlada al Centro de Copys.

## Qué hace

- Los presets de **Workshop del mes** se crean como calentamientos de WhatsApp y requieren imagen.
- Dentro del detalle del copy aparece una **Vista previa WhatsApp · Prueba**.
- Marcos/Úrsula/Victoria pueden subir o reemplazar el flyer desde el CRM.
- La imagen se guarda en el bucket público `marketing-assets` de Supabase Storage y se registra en `marketing_copy_assets`.
- Victoria ve **imagen + copy + instancia + grupo** antes de aprobar.
- Cuando Victoria pulsa **Aprobar y enviar prueba**, el backend del CRM envía imagen + caption mediante Evolution API a `PRUEBA_VICTORIA`.
- Cada intento se registra en `whatsapp_deliveries` como `sent` o `failed`.
- Los copys no-WhatsApp conservan el botón normal **Aprobar**.

## Destino de pruebas

- Instancia: `WORKSHOP`
- Grupo lógico: `PRUEBA_VICTORIA`
- JID actual: `120363409439960903@g.us`

El grupo real de la nueva Workshop **todavía no está configurado**.

## Variables privadas

Además de las variables que el CRM ya tenía, esta versión requiere en Vercel:

```env
EVOLUTION_API_KEY=TU_API_KEY_DE_EVOLUTION
```

No uses `NEXT_PUBLIC_` para esta llave.

`SUPABASE_SERVICE_ROLE_KEY` también debe seguir configurada porque el backend la usa para guardar imágenes y registrar envíos.

## Base de datos

Si ya ejecutaste `Migracion_WhatsApp_Calentamientos_PRUEBA_VICTORIA.sql`, **no necesitas volver a ejecutarla**.
