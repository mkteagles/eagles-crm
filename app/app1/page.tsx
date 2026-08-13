import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

import {
  TrendingUp,
  Megaphone,
  Building2,
  ArrowRight,
  Users,
  ClipboardList,
  UserCog,
  Video,
} from "lucide-react";

export default async function App1Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const name =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Usuario";

  const role = profile?.role || "executor";

  const firstName = name.split(" ")[0];

  // =========================================================
  // PERMISOS DE SECCIONES
  // =========================================================

  const normalizedName = name
    .trim()
    .toLowerCase();

  /*
   * CHUY:
   *
   * Chuy puede entrar a su sección de Edición de Video.
   *
   * También conservamos Marketing, porque actualmente
   * esa sección ya está disponible desde el inicio.
   */

  const isChuy =
    normalizedName.includes("chuy") ||
    normalizedName.includes("jesus") ||
    normalizedName.includes("jesús");

  /*
   * ADMIN / VIEWER:
   *
   * Ven todas las áreas principales.
   */

  const canSeeAllSections =
    role === "admin" ||
    role === "viewer";

  /*
   * EDICIÓN DE VIDEO:
   *
   * Chuy
   * Admin
   * Viewer
   */

  const canSeeVideoEditing =
    isChuy ||
    canSeeAllSections;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-10">

          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Eagles Gear CRM
          </p>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Buenos días, {firstName} 👋
          </h1>

          <p className="mt-2 text-gray-500 dark:text-gray-400">
            ¿Qué quieres gestionar hoy?
          </p>

        </div>

        {/* =====================================================
            ÁREAS PRINCIPALES
        ===================================================== */}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {/* ===================================================
              VENTAS
          =================================================== */}

          {canSeeAllSections && (
            <Link
              href="/app1/leads"
              className="group"
            >

              <div className="relative overflow-hidden h-full min-h-[280px] rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">

                <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-green-100 dark:bg-green-900/20 blur-2xl" />

                <div className="relative p-7 flex flex-col h-full">

                  <div className="flex items-center justify-between mb-8">

                    <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">

                      <TrendingUp
                        size={28}
                        className="text-green-600 dark:text-green-400"
                      />

                    </div>

                    <ArrowRight
                      size={22}
                      className="text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all"
                    />

                  </div>

                  <div className="mt-auto">

                    <p className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">
                      ÁREA COMERCIAL
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Ventas
                    </h2>

                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      Gestiona leads, prospectos y seguimiento comercial.
                    </p>

                    <div className="flex items-center gap-2 mt-5 text-sm font-semibold text-gray-700 dark:text-gray-300">

                      <Users size={16} />

                      Dashboard de Leads

                    </div>

                  </div>

                </div>

              </div>

            </Link>
          )}

          {/* ===================================================
              MARKETING + ACTIVIDADES
          =================================================== */}

          <Link
            href="/app1/marketing"
            className="group"
          >

            <div className="relative overflow-hidden h-full min-h-[280px] rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">

              <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-blue-100 dark:bg-blue-900/20 blur-2xl" />

              <div className="relative p-7 flex flex-col h-full">

                <div className="flex items-center justify-between mb-8">

                  <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">

                    <Megaphone
                      size={28}
                      className="text-blue-600 dark:text-blue-400"
                    />

                  </div>

                  <ArrowRight
                    size={22}
                    className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"
                  />

                </div>

                <div className="mt-auto">

                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">
                    MARKETING Y OPERACIÓN
                  </p>

                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Marketing + Actividades
                  </h2>

                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    Gestiona contenido, actividades, tareas y reportes.
                  </p>

                  <div className="flex items-center gap-2 mt-5 text-sm font-semibold text-gray-700 dark:text-gray-300">

                    <ClipboardList size={16} />

                    Actividades y contenido

                  </div>

                </div>

              </div>

            </div>

          </Link>

          {/* ===================================================
              ADMINISTRACIÓN
          =================================================== */}

          {canSeeAllSections && (
            <Link
              href="/app1/administracion"
              className="group"
            >

              <div className="relative overflow-hidden h-full min-h-[280px] rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">

                <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-purple-100 dark:bg-purple-900/20 blur-2xl" />

                <div className="relative p-7 flex flex-col h-full">

                  <div className="flex items-center justify-between mb-8">

                    <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">

                      <Building2
                        size={28}
                        className="text-purple-600 dark:text-purple-400"
                      />

                    </div>

                    <ArrowRight
                      size={22}
                      className="text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all"
                    />

                  </div>

                  <div className="mt-auto">

                    <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-2">
                      ORGANIZACIÓN
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Administración
                    </h2>

                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      Usuarios, juntas, pendientes y actividades internas.
                    </p>

                    <div className="flex items-center gap-2 mt-5 text-sm font-semibold text-gray-700 dark:text-gray-300">

                      <UserCog size={16} />

                      Gestión administrativa

                    </div>

                  </div>

                </div>

              </div>

            </Link>
          )}

          {/* ===================================================
              EDICIÓN DE VIDEO
          =================================================== */}

          {canSeeVideoEditing && (
            <Link
              href="/app1/edicion-video"
              className="group"
            >

              <div className="relative overflow-hidden h-full min-h-[280px] rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">

                <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-orange-100 dark:bg-orange-900/20 blur-2xl" />

                <div className="relative p-7 flex flex-col h-full">

                  <div className="flex items-center justify-between mb-8">

                    <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">

                      <Video
                        size={28}
                        className="text-orange-600 dark:text-orange-400"
                      />

                    </div>

                    <ArrowRight
                      size={22}
                      className="text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all"
                    />

                  </div>

                  <div className="mt-auto">

                    <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-2">
                      PRODUCCIÓN
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Edición de Video
                    </h2>

                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      Gestiona y da seguimiento a las actividades de edición de video.
                    </p>

                    <div className="flex items-center gap-2 mt-5 text-sm font-semibold text-gray-700 dark:text-gray-300">

                      <Video size={16} />

                      Producción de contenido

                    </div>

                  </div>

                </div>

              </div>

            </Link>
          )}

        </div>

        {/* =====================================================
            INFORMACIÓN INFERIOR
        ===================================================== */}

        <div className="mt-10">

          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">

            <div className="flex items-center gap-3">

              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">

                <span className="text-lg">
                  ✨
                </span>

              </div>

              <div>

                <p className="font-semibold text-gray-900 dark:text-white">
                  Eagles Gear CRM
                </p>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Selecciona un área para comenzar.
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}