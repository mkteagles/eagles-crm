# Metodología AIDA en Centro de Copys

- Se agrega AIDA como metodología automática del CRM: Atracción, Interés, Deseo y Acción.
- El CRM muestra la estructura AIDA en el dashboard, en la creación de solicitudes y en la revisión de cada copy.
- La API de generación envía `copy_framework: AIDA`, el detalle de las cuatro etapas y reglas AIDA a n8n.
- Se agrega `campaign_code` explícito para Workshop Octubre y Curso CVT JF017 Octubre, reforzando el ruteo del flujo consolidado.
- No se modifica la programación de WhatsApp, grupos, responsables, permisos ni multimedia.
- No se modifica la lógica de emojis ya validada para JF017.
- No requiere migración SQL: no se agregan columnas ni tablas.
