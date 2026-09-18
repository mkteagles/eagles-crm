# Centro de Copys · Estado visual de WhatsApp

Este parche NO modifica la programación existente, NO cambia copys, NO mueve grupos, NO cambia horarios y NO toca n8n.

## Qué agrega
- Badge **PROGRAMADO** cuando ya existe una fila real `scheduled/sending` en `whatsapp_deliveries`.
- Hora exacta en México, grupo e instancia visibles directamente en la lista del Centro de Copys.
- Badge **ENVIADO** cuando n8n ya marcó la entrega como `sent`.
- Badge **REVISAR ENVÍO** si existe un `failed` sin otro envío activo.
- Tarjeta visual dentro del detalle del copy para que el usuario vea claramente si ya está en cola.
- Contador superior **Programados**.
- Mensaje fijo: `PROGRAMADO = ya está en cola; ENVIADO = n8n ya lo mandó`.

## Seguridad del cambio
El endpoint nuevo `/app1/api/copy-requests/schedule-summary` es solo de lectura.
Primero consulta los `copy_requests` que el usuario puede ver con su sesión/RLS y luego devuelve únicamente el estado de WhatsApp de esos copys.

No hay migración SQL.
No hay que cambiar variables de Vercel.
No hay que cambiar el workflow de n8n.

## Archivos
- `app/components/CopyCenterDashboard.tsx`
- `app/app1/api/copy-requests/schedule-summary/route.ts`

## Instalación
Extrae este ZIP directamente en la raíz de `eagles-crm`, aceptando reemplazar archivos.
Después ejecuta:

```powershell
npm run build
git add app/components/CopyCenterDashboard.tsx app/app1/api/copy-requests/schedule-summary/route.ts
git commit -m "Muestra estado real de programacion en Centro de Copys"
git push origin main
```
