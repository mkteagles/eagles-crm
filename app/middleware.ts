import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// =======================================================
// ACTUALIZAR SESIÓN Y PROTEGER /app1
// =======================================================

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(
            ({ name, value, options }) => {
              response.cookies.set(
                name,
                value,
                options
              );
            }
          );
        },
      },
    }
  );

  // =====================================================
  // OBTENER USUARIO
  // =====================================================

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // =====================================================
  // USUARIO NO AUTENTICADO
  // =====================================================

  if (!user && pathname.startsWith("/app1")) {
    const loginUrl = request.nextUrl.clone();

    loginUrl.pathname = "/auth/login";

    loginUrl.searchParams.set(
      "next",
      pathname
    );

    return NextResponse.redirect(loginUrl);
  }

  // =====================================================
  // USUARIO AUTENTICADO
  // =====================================================

  if (user && pathname.startsWith("/app1")) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;

    // ===================================================
    // EXECUTOR
    // ===================================================
    //
    // Los ejecutores (Marcos, Ursula, etc.)
    // ahora PUEDEN entrar a:
    //
    // /app1
    // /app1/marketing
    //
    // /app1 es ahora el MENÚ PRINCIPAL.
    //
    // Ya NO los mandamos automáticamente
    // a /app1/marketing.
    // ===================================================

    if (role === "executor") {
      const allowedRoutes = [
        "/app1",
        "/app1/marketing",
      ];

      const isAllowed = allowedRoutes.some(
        (route) =>
          pathname === route ||
          pathname.startsWith(`${route}/`)
      );

      // Si un executor intenta entrar a
      // una sección que todavía no tiene permiso,
      // regresarlo al menú principal.

      if (!isAllowed) {
        const homeUrl =
          request.nextUrl.clone();

        homeUrl.pathname = "/app1";

        homeUrl.search = "";

        return NextResponse.redirect(
          homeUrl
        );
      }
    }
  }

  // =====================================================
  // CONTINUAR REQUEST
  // =====================================================

  return response;
}