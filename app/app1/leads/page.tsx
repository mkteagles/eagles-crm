import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import LeadsClient from './LeadsClient'

export default async function LeadsPage() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },

        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(
              ({ name, value, options }) => {
                cookieStore.set(
                  name,
                  value,
                  options
                )
              }
            )
          } catch {
            // Server Component
          }
        },
      },
    }
  )

  // =====================================================
  // USUARIO
  // =====================================================

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // =====================================================
  // PERFIL
  // =====================================================

  const { data: profile } =
    await supabase
      .from('user_profiles')
      .select(
        'full_name, email, role'
      )
      .eq('id', user.id)
      .single()

  const name =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    ''

  const email =
    profile?.email ||
    user.email ||
    ''

  const role =
    profile?.role ||
    'executor'

  // =====================================================
  // NORMALIZAR
  // =====================================================

  const normalizedName =
    name
      .trim()
      .toLowerCase()

  const normalizedEmail =
    email
      .trim()
      .toLowerCase()

  // =====================================================
  // IDENTIFICAR USUARIO
  // =====================================================

  const isMarcos =
    normalizedName.includes('marcos') ||
    normalizedEmail ===
      'marcosc@eagles.com'

  const isUrsula =
    normalizedName.includes('ursula') ||
    normalizedName.includes('úrsula') ||
    normalizedEmail ===
      'ursula@eagles.com'

  // =====================================================
  // PRODUCTOS PERMITIDOS
  // =====================================================

  let allowedProducts: string[] = []

  // -----------------------------------------------------
  // ADMIN
  // -----------------------------------------------------

  if (role === 'admin') {
    allowedProducts = [
      'all',
      'workshop',
      'empresarial',
      'costa_rica',
    ]
  }

  // -----------------------------------------------------
  // MARCOS
  // -----------------------------------------------------

  else if (
    role === 'executor' &&
    isMarcos
  ) {
    allowedProducts = [
      'workshop',
    ]
  }

  // -----------------------------------------------------
  // URSULA
  // -----------------------------------------------------

  else if (
    role === 'executor' &&
    isUrsula
  ) {
    allowedProducts = [
      'empresarial',
      'costa_rica',
    ]
  }

  // -----------------------------------------------------
  // OTROS EXECUTORES
  // -----------------------------------------------------

  else if (role === 'executor') {
    allowedProducts = []
  }

  // =====================================================
  // SEGURIDAD
  // =====================================================

  if (
    allowedProducts.length === 0
  ) {
    redirect('/app1')
  }

  // =====================================================
  // PASAR PERMISOS AL CLIENTE
  // =====================================================

  return (
    <LeadsClient
      allowedProducts={
        allowedProducts
      }
    />
  )
}