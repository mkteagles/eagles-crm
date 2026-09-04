# Centro de Copys · CRM Eagles + n8n + Ollama

## Qué incluye

- Ruta del CRM: `/app1/marketing/copys`.
- Captura rápida de una sola frase: qué se necesita anunciar.
- Tipo, objetivo, Facebook/Instagram, tono, audiencia y responsables se completan automáticamente.
- Todos los datos adicionales quedan ocultos en **Agregar detalles (opcional)**.
- Título y brief interno generados automáticamente.
- El CRM crea la solicitud y llama a Ollama inmediatamente para abrir el borrador.
- Úrsula redacta y Victoria revisa.
- Estados: Solicitud → Borrador → En revisión → Aprobado → Publicado.
- Campañas precargadas de septiembre, octubre y noviembre de 2026.
- Generación gratuita con el Ollama que ya tienes: `qwen2.5:3b`.

## 1. Base de datos

Si **ya ejecutaste** `Migracion_Centro_Copys.sql` en el Supabase del CRM, no lo vuelvas a ejecutar.

Si todavía no lo hiciste, ejecútalo completo en **SQL Editor** del proyecto Supabase del CRM. No lo ejecutes en el Supabase del Campus.

## 2. Importar el workflow

1. Abre n8n.
2. Selecciona **Import from File**.
3. Importa `n8n/Eagles_Centro_Copys_Ollama.json`.
4. Abre el nodo **Validar y preparar copy**.
5. Busca esta línea:

```js
const EXPECTED_SECRET = 'CAMBIA_ESTE_SECRETO_POR_UNO_DE_32_CARACTERES';
```

6. Sustituye solamente el texto entre comillas por un secreto aleatorio de 32 caracteres o más. No uses comillas dentro del secreto.
7. Guarda el nodo y activa el workflow.
8. Abre el nodo **Webhook - CRM Copys** y copia su **Production URL**. Debe terminar en `/webhook/eagles-copy-generate`.

El workflow llama a:

```text
http://ollama:11434/api/chat
```

con el modelo:

```text
qwen2.5:3b
```

No requiere llave de OpenAI, crédito ni otra instalación. Esta URL funciona porque tu n8n y Ollama ya se comunican dentro de Docker.

## 3. Variables privadas en Vercel del CRM

En el proyecto de Vercel del **CRM**, abre **Settings → Environment Variables** y agrega:

```env
N8N_COPY_WEBHOOK_URL=https://TU-N8N/webhook/eagles-copy-generate
N8N_COPY_WEBHOOK_SECRET=EL_MISMO_SECRETO_DEL_NODO_DE_N8N
```

- Usa la Production URL exacta del webhook.
- El secreto debe ser exactamente el mismo del nodo **Validar y preparar copy**.
- Activa ambas para Production y Preview.
- No agregues `NEXT_PUBLIC_`: son variables privadas del servidor.

Después haz **Redeploy** del CRM.

## 4. Prueba completa

1. Entra al CRM y abre **Marketing → Centro de Copys**.
2. Pulsa **Nueva solicitud**.
3. Escribe una sola frase, por ejemplo: `Promocionar el curso 6L80 y 6L90 de septiembre`.
4. Pulsa **Crear borrador**.
5. Espera a que el CRM abra automáticamente el borrador editable generado por Ollama.
6. Revísalo y envíalo a Victoria.

Ejemplo sencillo:

```text
Promocionar el curso presencial 6L80 y 6L90 de septiembre; incluir las fechas confirmadas.
```

## 5. Si algo falla

- **Solicitud no autorizada:** los dos secretos no coinciden.
- **n8n respondió 404:** se usó la Test URL o el workflow no está activo.
- **n8n respondió 405:** confirma que la URL termina en `/webhook/eagles-copy-generate` y que el Webhook acepta `POST`.
- **ECONNREFUSED o timeout en Ollama:** confirma que n8n y Ollama siguen en la misma red de Docker y que `qwen2.5:3b` está disponible.
- **Faltan variables:** revisa Vercel y vuelve a desplegar el CRM.

Si falla la IA, el resto del Centro de Copys sigue funcionando manualmente.

## Reportes y actividades de copys

Si el Centro de Copys ya estaba instalado antes de esta versión, ejecuta una sola vez `Migracion_Reportes_Copys_Actividades.sql` en el Supabase del CRM.

Con este cambio:

- Cada solicitud de copy crea automáticamente una actividad de Marketing.
- La actividad usa el responsable del copy y, si no hay responsable, al solicitante.
- El estado de la actividad se sincroniza con el copy: solicitud → pendiente; borrador/revisión → en progreso; aprobado/publicado → completada.
- Los copys anteriores se convierten también en actividades mediante el backfill de la migración.
- No se modifica n8n para esta función.
