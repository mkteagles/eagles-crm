# Cambio de roles · Centro de Copys

Fecha: 8 de septiembre de 2026.

## Regla nueva

- **Marcos**: flujo exclusivo de **Workshop**. Genera, edita, revisa, aprueba y programa sus calentamientos.
- **Victoria**: flujo exclusivo de **Cursos**. Genera, edita, revisa, aprueba y programa los calentamientos de cursos.
- **Úrsula**: ya no ve Workshop ni Cursos en el Centro de Copys. Por el momento solo aparece un **placeholder de Copys de Lives**.
- **Admins**: conservan acceso total.

## Curso CVT JF017 · Octubre

El acceso rápido queda visible para Victoria y el flujo completo se asigna a Victoria como responsable y revisora. Los calentamientos siguen usando la campaña `CURSO_JF017_OCTUBRE` y, mientras esté configurada así en Supabase, se enviarán a `PRUEBA_VICTORIA`.

## Workshop

No se modifica su campaña, grupo, horarios ni scheduler. Sigue siendo exclusiva de Marcos y conserva el flujo actual de producción.

## n8n

No requiere un nuevo workflow por este cambio. Se conserva el Centro de Copys consolidado Workshop + JF017 y el scheduler 10:00 AM / 5:00 PM.

## Supabase

Ejecutar `Migracion_Roles_Copys_Marcos_Victoria_Ursula.sql` una sola vez. El script reasigna solicitudes existentes y actualiza RLS para que Workshop/Cursos respeten los nuevos responsables.

## Corrección estricta de visibilidad
- Las reglas personales ahora tienen prioridad incluso si la cuenta tiene `role = admin`.
- Úrsula: no ve Workshop ni Cursos; solo placeholder de Lives.
- Marcos: solo Workshop.
- Victoria: solo Cursos.
- Solo administradores que no sean Marcos/Victoria/Úrsula conservan vista completa.
