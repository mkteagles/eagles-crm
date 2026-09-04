# Workshop Octubre · Programación automática 10 AM / 5 PM

## Qué cambia en el CRM

- Solo los calentamientos WhatsApp de la Workshop de octubre usan programación automática.
- La fecha de entrega ya no se captura manualmente para esos calentamientos.
- Al aprobar, Marcos (`marcosc@eagles.com`) reserva automáticamente el siguiente espacio libre:
  - 10:00 AM
  - 5:00 PM
  - zona horaria `America/Mexico_City`
- El copy queda `approved` y la entrega queda `scheduled` en `whatsapp_deliveries`.
- La fecha del slot reservado se refleja en `due_date` para que aparezca correctamente en el Centro de Copys.
- Imagen y video siguen funcionando igual.
- Los demás copys/cursos conservan su flujo actual.

## Destino durante pruebas

`WORKSHOP_OCTUBRE` apunta temporalmente a `PRUEBA_VICTORIA`.

Cuando exista el grupo real, solo se cambia `target_group_code` en `whatsapp_campaign_settings`; no se modifica el CRM.

## n8n

Importar `n8n/Eagles_Workshop_Programados_10AM_5PM.json`.

El workflow corre exactamente a las 10:00 y 17:00, zona horaria `America/Mexico_City`, busca entregas `scheduled` cuyo horario ya llegó, manda imagen/video + caption por Evolution, cambia la entrega a `sent` y el copy a `published`.
