# Fix Lives · middleware / API groups

- Permite `/app1/api/live-stream/*` en middleware para usuarios executor autenticados.
- El Route Handler conserva la validación de sesión y que el usuario sea Úrsula.
- Evita que `/app1/api/live-stream/groups` redirija a `/app1` y devuelva HTML.
- Corrige el error `Unexpected token <, <!DOCTYPE...` del selector.
- El frontend ahora detecta respuestas no JSON y muestra un error legible.
- No modifica Workshop, JF017, scheduler ni destinos de WhatsApp.
