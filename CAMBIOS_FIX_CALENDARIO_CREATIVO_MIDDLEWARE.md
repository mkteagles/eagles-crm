# FIX Calendario Creativo

Causa raíz corregida:
- `/app1/api/creative-calendar*` no estaba excluido del middleware general.
- Para usuarios `executor`, el middleware redirigía la petición API a `/app1`.
- El frontend recibía HTML/una redirección en vez de JSON, quedaba con 0 contenidos y `canEdit=false`.
- Por eso desaparecían `Importar Word` y `Nuevo contenido` y septiembre no mostraba la precarga.

Cambios:
1. Se permite pasar `/app1/api/creative-calendar*` directamente a sus Route Handlers.
2. Los Route Handlers siguen validando sesión y permisos internamente.
3. El perfil de Marcos/Úrsula se consulta con el cliente admin para evitar falsos negativos por RLS.
4. No cambia Lives, Workshop, JF017, Reportes, n8n ni Evolution.
