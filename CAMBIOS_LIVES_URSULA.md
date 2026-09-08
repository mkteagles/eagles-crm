# Lives · Úrsula · multigrupo

## Flujo
- Úrsula ve únicamente Lives en su Centro de Copys.
- Ella misma crea, genera, revisa, aprueba y programa.
- Live normal: miércoles.
- Botón `Fecha extraordinaria`: permite cualquier fecha.
- Solo se captura tema, fecha, plantilla visual de referencia y grupos.
- El copy es determinista: no pasa por Ollama; conserva la estructura fija y solo cambia el tema. La fecha controla la programación.

## WhatsApp
- Instancia: `GRUPOS`.
- Se pueden seleccionar varios grupos activos desde el CRM.
- Día anterior al Live: distribución escalonada entre 08:30 y 10:30, hora México.
- Día del Live: distribución escalonada entre 08:00 y 10:00, hora México.
- Para Lives normales de miércoles, esto corresponde a martes y miércoles.
- Los envíos se reparten en la ventana para evitar una ráfaga simultánea. Esto no garantiza que WhatsApp no aplique límites o restricciones; usa únicamente grupos autorizados y monitorea la cuenta.

## Plantillas
Las cinco plantillas suministradas son PNG planos. El CRM las muestra como referencias visuales. Un PNG no conserva las capas originales; para edición automática exacta se necesita el archivo fuente editable (Canva, PSD, AI, etc.) o preparar plantillas base/máscaras específicas.

## Instalación
1. Desplegar este CRM.
2. Ejecutar `Migracion_Lives_Ursula_Multigrupo.sql` en Supabase.
3. Importar `n8n/Eagles_Programados_Cursos_Workshop_Lives.json` y copiar en el nodo `Credenciales privadas` los mismos valores del scheduler actual.
4. Desactivar el scheduler anterior 10 AM / 5 PM y activar el consolidado nuevo.
5. No modificar el Centro de Copys AIDA actual: Lives se generan de forma determinista desde el CRM; Workshop y Cursos conservan su lógica.

## Permisos
- Lives: Úrsula es la única persona que puede generar, subir material, revisar, aprobar y programar desde este flujo.
- Workshop conserva a Marcos.
- Cursos conservan a Victoria.
