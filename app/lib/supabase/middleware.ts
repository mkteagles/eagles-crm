import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// =======================================================
// ACTUALIZAR SESIÓN + PROTEGER APP1
// =======================================================

export async function updateSession(
  request: NextRequest
) {

  let response = NextResponse.next({
    request,
  })

  // =====================================================
  // SUPABASE SERVER CLIENT
  // =====================================================

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {

        getAll() {
          return request.cookies.getAll()
        },

        setAll(cookiesToSet) {

          cookiesToSet.forEach(
            ({ name, value }) => {
              request.cookies.set(
                name,
                value
              )
            }
          )

          response = NextResponse.next({
            request,
          })

          cookiesToSet.forEach(
            ({ name, value, options }) => {

              response.cookies.set(
                name,
                value,
                options
              )

            }
          )
        },
      },
    }
  )

  // =====================================================
  // OBTENER USUARIO
  // =====================================================

  const {
    data: {
      user,
    },
  } = await supabase.auth.getUser()

  const pathname =
    request.nextUrl.pathname

  // =====================================================
  // LOGIN
  // =====================================================

  if (
    !user &&
    pathname.startsWith('/app1')
  ) {

    const loginUrl =
      request.nextUrl.clone()

    loginUrl.pathname =
      '/auth/login'

    loginUrl.searchParams.set(
      'next',
      pathname
    )

    return NextResponse.redirect(
      loginUrl
    )
  }

  // =====================================================
  // SI NO ESTÁ EN APP1
  // =====================================================

  if (
    !user ||
    !pathname.startsWith('/app1')
  ) {
    return response
  }

  // =====================================================
  // OBTENER PERFIL
  // =====================================================

  const {
    data: profile,
  } = await supabase
    .from('user_profiles')
    .select(
      'full_name, email, role'
    )
    .eq(
      'id',
      user.id
    )
    .single()

  // =====================================================
  // DATOS DEL USUARIO
  // =====================================================

  const fullName =
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
    fullName
      .trim()
      .toLowerCase()

  const normalizedEmail =
    email
      .trim()
      .toLowerCase()

  // =====================================================
  // IDENTIFICAR USUARIOS
  // =====================================================

  const isMarcos =
    normalizedName.includes('marcos') ||
    normalizedEmail === 'marcosc@eagles.com'

  const isUrsula =
    normalizedName.includes('ursula') ||
    normalizedName.includes('úrsula') ||
    normalizedEmail === 'ursula@eagles.com'

  const isChuy =
    normalizedName.includes('chuy') ||
    normalizedName.includes('jesus') ||
    normalizedName.includes('jesús') ||
    normalizedEmail === 'chuy@eagles.com'

  // =====================================================
  // RUTAS
  // =====================================================

  const isHome =
    pathname === '/app1' ||
    pathname === '/app1/'

  const isMarketing =
    pathname === '/app1/marketing' ||
    pathname.startsWith(
      '/app1/marketing/'
    )

  const isSales =
    pathname === '/app1/leads' ||
    pathname.startsWith(
      '/app1/leads/'
    )

  const isAdministration =
    pathname === '/app1/administracion' ||
    pathname.startsWith(
      '/app1/administracion/'
    )

  const isVideo =
    pathname === '/app1/edicion-video' ||
    pathname.startsWith(
      '/app1/edicion-video/'
    )

  // =====================================================
  // ADMIN
  // =====================================================
  //
  // Hugo
  // Jonathan
  // Lalo
  // Luis
  // Nancy
  //
  // Pueden entrar a TODO.
  // =====================================================

  if (role === 'admin') {
    return response
  }

  // =====================================================
  // EXECUTORES
  // =====================================================

  if (role === 'executor') {

    // ===================================================
    // HOME
    // ===================================================

    if (isHome) {
      return response
    }

    // ===================================================
    // MARKETING
    // ===================================================

    if (isMarketing) {
      return response
    }

    // ===================================================
    // VENTAS
    // ===================================================
    //
    // Marcos -> Workshop
    //
    // Ursula -> Empresarial + Costa Rica
    //
    // Chuy -> NO ventas
    //
    // IMPORTANTE:
    // Aquí solamente permitimos entrar a /leads.
    //
    // El filtrado de productos se controla
    // posteriormente desde la aplicación.
    // ===================================================

    if (isSales) {

      if (isMarcos || isUrsula) {
        return response
      }

      const homeUrl =
        request.nextUrl.clone()

      homeUrl.pathname =
        '/app1'

      homeUrl.search = ''

      return NextResponse.redirect(
        homeUrl
      )
    }

    // ===================================================
    // EDICIÓN DE VIDEO
    // ===================================================

    if (isVideo) {

      if (isChuy) {
        return response
      }

      const homeUrl =
        request.nextUrl.clone()

      homeUrl.pathname =
        '/app1'

      homeUrl.search = ''

      return NextResponse.redirect(
        homeUrl
      )
    }

    // ===================================================
    // ADMINISTRACIÓN
    // ===================================================
    //
    // Los executors NO entran.
    // ===================================================

    if (isAdministration) {

      const homeUrl =
        request.nextUrl.clone()

      homeUrl.pathname =
        '/app1'

      homeUrl.search = ''

      return NextResponse.redirect(
        homeUrl
      )
    }

    // ===================================================
    // CUALQUIER OTRA RUTA
    // ===================================================

    const homeUrl =
      request.nextUrl.clone()

    homeUrl.pathname =
      '/app1'

    homeUrl.search = ''

    return NextResponse.redirect(
      homeUrl
    )
  }

  // =====================================================
  // CUALQUIER OTRO ROLE
  // =====================================================

  return response
}