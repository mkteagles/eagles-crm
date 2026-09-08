# Fix definitivo · Flyers automáticos de Lives

## Problema encontrado
La primera versión intentaba crear el PNG dentro de la ruta de servidor de Next/Vercel usando `sharp`. El Live y el copy podían crearse, pero si el renderer del servidor fallaba o el asset no quedaba registrado, el CRM terminaba sin imagen seleccionada.

## Nueva arquitectura
La generación del flyer ahora ocurre directamente en el navegador de Úrsula mediante Canvas HTML5:

1. Úrsula captura tema, fecha y grupos.
2. El navegador carga una de las 5 plantillas desde `/public/live-templates`.
3. Canvas cubre las zonas variables y escribe tema + fecha + 11 AM.
4. El navegador convierte el resultado a PNG.
5. Se reutiliza el flujo de carga firmado que YA funciona para Workshop/Cursos.
6. El PNG queda en `marketing-assets` como asset `selected`.
7. El Live puede aprobarse y programarse normalmente.

No usa modelos de imagen, APIs de pago ni generación externa.

## Recuperación de Lives ya creados
Si un Live viejo quedó sin imagen, al abrirlo aparece el botón **Generar flyer automático**. Cuando ya tiene imagen, el mismo botón cambia a **Cambiar estilo del flyer** y rota entre las 5 plantillas.

## No se modifica
- Workshop
- Curso JF017
- Ollama
- scheduler
- Evolution
- horarios de Lives
- grupos de WhatsApp
