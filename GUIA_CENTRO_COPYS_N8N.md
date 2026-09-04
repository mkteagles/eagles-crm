# Centro de Copys · CRM Eagles

## Qué se agregó

- Nueva ruta: `/app1/marketing/copys`.
- Solicitudes separadas por Redes Sociales, Transmisiones/Taller y Cursos presenciales.
- Flujo de trabajo: Solicitud → Borrador → En revisión → Aprobado → Publicado.
- Úrsula puede recibir y trabajar solicitudes; Victoria puede revisarlas y pedir cambios.
- Campañas precargadas:
  - Septiembre 2026: 6L80 y 6L90.
  - Octubre 2026: CVT JF017.
  - Noviembre 2026: DQ200, CVT JF016/JF017 y Chevrolet 6L80/6L90.
- Campo opcional para pedir una imagen y redactar su brief visual.
- Botón **Generar con IA**, preparado para llamar un webhook privado de n8n.

## 1. Base de datos

Entra al proyecto de Supabase que usa el CRM, abre **SQL Editor** y ejecuta completo:

`Migracion_Centro_Copys.sql`

No lo ejecutes en el Supabase del Campus.

## 2. Prueba manual antes de n8n

El Centro de Copys funciona sin IA para crear solicitudes, escribir borradores, revisar y aprobar.

1. Despliega el CRM.
2. Abre Marketing → Centro de Copys.
3. Crea una solicitud.
4. Confirma que se seleccionen Úrsula y Victoria. Si sus nombres en el CRM son distintos, selecciónalas manualmente.
5. Abre la solicitud, escribe un texto, guarda el borrador y envíalo a revisión.
6. Inicia sesión como Victoria y prueba Aprobar o Solicitar cambios.

## 3. Workflow de n8n

En n8n crea un workflow con estos nodos:

1. **Webhook**
   - Method: `POST`
   - Path: `eagles-copy-generate`
   - Response: usando el nodo **Respond to Webhook**.
   - Protege el webhook con Header Auth.
   - Header: `x-eagles-secret`
   - Value: un secreto aleatorio de 32 caracteres o más.

2. **OpenAI**
   - Conecta una credencial de OpenAI API. La suscripción de ChatGPT no incluye por sí sola crédito de API.
   - Recibe la información en `{{$json.body.copy_request}}`.
   - Usa también las reglas recibidas en `{{$json.body.rules}}`.
   - Pide una respuesta JSON con esta forma:

```json
{
  "copy": "Texto final o variantes por canal",
  "image_prompt": "Prompt visual, solamente si needs_image es true"
}
```

3. **Respond to Webhook**
   - Status: `200`
   - Response Body:

```json
{
  "copy": "{{ $json.copy }}",
  "image_prompt": "{{ $json.image_prompt }}",
  "execution_id": "{{ $execution.id }}"
}
```

Activa el workflow y copia la URL de producción del Webhook.

## 4. Variables en Vercel del CRM

Agrega en **Settings → Environment Variables**:

```env
N8N_COPY_WEBHOOK_URL=https://TU-N8N/webhook/eagles-copy-generate
N8N_COPY_WEBHOOK_SECRET=EL_MISMO_SECRETO_CONFIGURADO_EN_N8N
```

Ambas son privadas. No uses el prefijo `NEXT_PUBLIC_`.

Después haz un Redeploy del CRM para que Vercel cargue las variables.

## 5. Reglas que ya envía el CRM a n8n

- No inventar precio, fecha, disponibilidad, garantía ni promoción.
- No diagnosticar definitivamente una transmisión por mensaje.
- En solicitudes de taller, pedir marca, modelo, año y síntomas y dirigir a inspección/cita.
- Entregar variantes separadas si se seleccionan varios canales.

## Respuesta esperada del webhook

El CRM acepta cualquiera de los campos `copy`, `output` o `text`. Para el brief visual usa `image_prompt`.

Si n8n no está configurado, solamente falla el botón **Generar con IA**; el flujo manual continúa funcionando.
