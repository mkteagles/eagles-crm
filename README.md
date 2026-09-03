This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Integración con Campus Eagles

El detalle de un lead de `workshop` (Workshop High Ticket/Elite) muestra una tarjeta para generar su acceso cuando `payment_status` sea `paid` y exista un monto pagado. La creación requiere confirmación manual y únicamente está disponible para administradores.

### Configuración

1. Ejecuta `Migracion_Integracion_Campus.sql` en el SQL Editor del proyecto Supabase del CRM.
2. Ejecuta `Migracion_Integracion_CRM_Campus.sql` en el proyecto Supabase del Campus.
3. Genera un secreto aleatorio de al menos 32 caracteres.
4. En Vercel del Campus agrega `CAMPUS_PROVISIONING_SECRET`.
5. En Vercel del CRM agrega:

```env
SUPABASE_SERVICE_ROLE_KEY=SERVICE_ROLE_PRIVADA_DEL_CRM
CAMPUS_API_URL=https://campus-eagles-gear.vercel.app
NEXT_PUBLIC_CAMPUS_URL=https://campus-eagles-gear.vercel.app
CAMPUS_PROVISIONING_SECRET=EL_MISMO_SECRETO_DEL_CAMPUS
```

6. Vuelve a desplegar ambos proyectos.

Ni el secreto ni `SUPABASE_SERVICE_ROLE_KEY` deben llevar el prefijo `NEXT_PUBLIC_`. El CRM llama al Campus desde el servidor; ninguna clave privada se envía al navegador.

El CRM conserva la identidad en `academy_customers`. Cada lead se enlaza mediante `leads.academy_customer_id`, y el Campus guarda el mismo número como `student_profiles.crm_customer_id`. La relación cliente-alumno es idempotente: reintentar o abrir otro lead del mismo cliente devuelve la misma cuenta y no duplica usuarios.
