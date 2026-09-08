# Workshop Octubre · Marcos + multimedia

Cambios incluidos:

- La Workshop de octubre se asigna para revisión a `marcosc@eagles.com`.
- La aprobación del endpoint de WhatsApp para esta Workshop queda bloqueada exclusivamente a ese correo, incluso si otro usuario tiene rol admin.
- Los Cursos quedan en flujo exclusivo de Victoria; Úrsula no ve Workshop ni Cursos.
- La vista previa de WhatsApp acepta imagen o video.
- Formatos: JPG, PNG, WEBP, MP4 y MOV.
- Imágenes: máximo 10 MB. Videos: máximo 16 MB.
- Los archivos se suben directamente a Supabase Storage mediante signed upload para evitar pasar videos pesados por Vercel.
- Evolution envía automáticamente `mediatype=image` o `mediatype=video` según el contenido seleccionado.
- Los calentamientos de Workshop en n8n fueron acortados a: gancho breve + una frase de valor + fecha/modalidad/precio + Hotmart.

## SQL requerido

Ejecutar una sola vez `Migracion_Workshop_Marcos_Multimedia.sql` en el Supabase del CRM.

El SQL:
- habilita video MP4/MOV en `marketing-assets`;
- aumenta el límite del bucket;
- reasigna a Marcos los copys existentes de la Workshop de octubre.

## n8n

Actualizar el workflow del Centro de Copys con `n8n/Eagles_Centro_Copys_Ollama.json` o usar el JSON entregado por separado. Conservar el secreto actual.
