# Fix selector de grupos de Lives

- El endpoint de grupos de Lives ya no depende de filtros PostgREST sobre la relación `whatsapp_instances`.
- Detecta la instancia por `code` o `instance_name = GRUPOS`.
- Muestra grupos con `purpose = live`, códigos `LIVE_*` y, durante pruebas, el JID interno `120363409439960903@g.us`.
- No modifica Workshop, JF017, scheduler ni lógica de envíos.
