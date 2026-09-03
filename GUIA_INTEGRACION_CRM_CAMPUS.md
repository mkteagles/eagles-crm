# Activar la integración CRM → Campus

Esta versión conecta el producto interno `workshop` del CRM (Workshop High Ticket/Elite) con el curso existente del Campus. La creación es manual después de verificar el pago y es segura ante reintentos: el mismo lead no genera dos alumnos.

## 1. Actualizar el Campus

1. Sube el contenido del ZIP actualizado del Campus a su repositorio.
2. En el SQL Editor de **Supabase del Campus**, ejecuta `Migracion_Integracion_CRM_Campus.sql`.
3. Genera un secreto desde una terminal:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. Copia el resultado. En Vercel del Campus abre **Settings → Environment Variables** y agrega:

   ```env
   CAMPUS_PROVISIONING_SECRET=EL_SECRETO_GENERADO
   ```

5. Vuelve a desplegar el Campus.

No borres las variables de Supabase que ya tiene el proyecto. El secreto no lleva el prefijo `VITE_`.

## 2. Actualizar el CRM

1. Sube el contenido del ZIP actualizado del CRM a su repositorio.
2. En el SQL Editor de **Supabase del CRM**, ejecuta `Migracion_Integracion_Campus.sql`.
3. En Vercel del CRM agrega:

   ```env
   CAMPUS_API_URL=https://campus-eagles-gear.vercel.app
   NEXT_PUBLIC_CAMPUS_URL=https://campus-eagles-gear.vercel.app
   CAMPUS_PROVISIONING_SECRET=EL_MISMO_SECRETO_GENERADO
   ```

4. Conserva sus variables actuales de Supabase y Hotmart.
5. Vuelve a desplegar el CRM.

El secreto no lleva el prefijo `NEXT_PUBLIC_` y debe ser exactamente igual en ambos proyectos.

## 3. Prueba completa

1. Entra al CRM como administrador.
2. Abre un lead cuyo producto sea **Workshop High Ticket**.
3. Mientras exista saldo, la tarjeta del Campus debe permanecer bloqueada.
4. Edita el lead, registra el pago total y guarda.
5. Pulsa **Generar acceso** y confirma que el pago fue verificado.
6. Copia las credenciales que aparecen. La contraseña temporal solamente se muestra en esa creación.
7. Abre el Campus e inicia sesión con el usuario sin escribir `@eagles.com`.
8. El alumno deberá crear su contraseña privada antes de entrar al curso.
9. Vuelve al CRM y pulsa nuevamente la operación: debe mostrar la misma cuenta, sin crear otra.

## Comportamiento de seguridad

- Solamente un administrador del CRM puede generar accesos.
- No se genera acceso con pago parcial o sin pago.
- El navegador nunca recibe la service role key de Supabase.
- Cada lead conserva una referencia única en ambos sistemas.
- Un usuario sin inscripción activa ya no puede abrir directamente una URL de clase.
- Para restablecer una contraseña perdida se usa el panel administrativo del Campus.

