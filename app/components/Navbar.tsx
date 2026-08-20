'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import {
  LayoutDashboard,
  Users,
  BarChart3,
  LogOut,
  PlusCircle,
  CheckSquare,
  Calendar,
  FileText,
  Wrench,
  ChevronDown,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useCurrentUser } from '@/lib/marketing-hooks'
import ActivityNotifications from '@/components/activity-notifications'


// =========================================================
// LINKS PRINCIPALES
// =========================================================

const links = [
  {
    href: '/app1',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/app1/leads',
    label: 'Leads',
    icon: Users,
  },
  {
    href: '/app1/analytics',
    label: 'Análisis',
    icon: BarChart3,
  },
]


// =========================================================
// LINKS MARKETING
// =========================================================

const marketingLinks = [
  {
    href: '/app1/marketing',
    label: 'Actividades',
    icon: CheckSquare,
  },
  {
    href: '/app1/marketing/calendar',
    label: 'Calendario',
    icon: Calendar,
  },
  {
    href: '/app1/marketing/reports',
    label: 'Reportes',
    icon: FileText,
  },
]


// =========================================================
// TIPOS TALLER
// =========================================================

type TallerAccessLevel =
  | 'manager'
  | 'operator'
  | null


// =========================================================
// NAVBAR
// =========================================================

export function Navbar() {

  const pathname = usePathname()
  const router = useRouter()

  // -------------------------------------------------------
  // SUPABASE CLIENT
  // -------------------------------------------------------

  const supabase = useMemo(
    () => createClient(),
    []
  )

  // -------------------------------------------------------
  // USUARIO CRM
  // -------------------------------------------------------

  const { user } = useCurrentUser()

  // -------------------------------------------------------
  // ROLE CRM
  // -------------------------------------------------------

  const isAdmin =
    user?.role === 'admin'

  const isExecutor =
    user?.role === 'executor'


  // =======================================================
  // ESTADOS
  // =======================================================

  const [
    showMarketingMenu,
    setShowMarketingMenu,
  ] = useState(false)

  const [
    hasTallerAccess,
    setHasTallerAccess,
  ] = useState(false)

  const [
    tallerAccessLevel,
    setTallerAccessLevel,
  ] = useState<TallerAccessLevel>(null)

  const [
    checkingTallerAccess,
    setCheckingTallerAccess,
  ] = useState(true)


  // =======================================================
  // VERIFICAR ACCESO TALLER
  //
  // FUENTE ÚNICA:
  //
  // taller_user_access
  //
  // NO usamos user.role
  // =======================================================

  useEffect(() => {

    let mounted = true

    async function checkTallerAccess() {

      // -----------------------------------------------
      // Todavía no tenemos usuario
      // -----------------------------------------------

      if (!user?.id) {

        if (mounted) {

          setHasTallerAccess(false)

          setTallerAccessLevel(null)

          setCheckingTallerAccess(false)

        }

        return
      }


      setCheckingTallerAccess(true)


      // -----------------------------------------------
      // CONSULTAR ACCESO
      // -----------------------------------------------

      const {
        data,
        error,
      } = await supabase
        .from('taller_user_access')
        .select(
          'access_level, is_active'
        )
        .eq(
          'user_id',
          user.id
        )
        .eq(
          'is_active',
          true
        )
        .maybeSingle()


      if (!mounted) return


      // -----------------------------------------------
      // ERROR
      // -----------------------------------------------

      if (error) {

        console.error(
          'Error verificando acceso Taller:',
          error
        )

        setHasTallerAccess(false)

        setTallerAccessLevel(null)

        setCheckingTallerAccess(false)

        return
      }


      // -----------------------------------------------
      // SIN ACCESO
      // -----------------------------------------------

      if (!data) {

        setHasTallerAccess(false)

        setTallerAccessLevel(null)

        setCheckingTallerAccess(false)

        return
      }


      // -----------------------------------------------
      // ACCESO CONFIRMADO
      // -----------------------------------------------

      setHasTallerAccess(
        data.is_active === true
      )


      setTallerAccessLevel(
        data.access_level === 'manager' ||
        data.access_level === 'operator'
          ? data.access_level
          : null
      )


      setCheckingTallerAccess(false)
    }


    checkTallerAccess()


    return () => {

      mounted = false

    }

  }, [
    user?.id,
    supabase,
  ])


  // =======================================================
  // LOGOUT
  // =======================================================

  const handleLogout = async () => {

    try {

      await supabase.auth.signOut()

      router.push('/auth/login')

      router.refresh()

    } catch (error) {

      console.error(
        'Error logging out:',
        error
      )

      router.push('/auth/login')
    }
  }


  // =======================================================
  // RUTAS ACTIVAS
  // =======================================================

  const isMarketingActive =
    pathname.startsWith(
      '/app1/marketing'
    )


  const isTallerActive =
    pathname.startsWith(
      '/app1/taller'
    )


  // =======================================================
  // RENDER
  // =======================================================

  return (

    <nav className="border-b border-border-color bg-surface">

      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">


        {/* =================================================
            LOGO
        ================================================= */}

        <div className="flex items-center gap-3">

          <Link
            href="/app1"
            className="flex items-center gap-2"
          >

            <Image
              src="/logo-banner.jpg"
              alt="Eagles Gear CRM"
              width={36}
              height={36}
              className="rounded-md w-[36px] h-[36px] object-cover"
              loading="eager"
            />

            <span className="font-semibold text-foreground">
              Eagles Gear CRM
            </span>

          </Link>

        </div>


        {/* =================================================
            NAVEGACIÓN
        ================================================= */}

        <div className="flex items-center gap-1 flex-wrap">


          {/* =================================================
              LINKS PRINCIPALES
              
              ADMIN:
              Dashboard
              Leads
              Análisis

              EXECUTOR:
              No aparecen aquí.
          ================================================= */}

          {!isExecutor && (

            links.map(
              ({
                href,
                label,
                icon: Icon,
              }) => {

                const active =
                  pathname === href


                return (

                  <Link
                    key={href}
                    href={href}
                    className={`
                      flex items-center gap-1.5
                      px-3 py-1.5
                      rounded-md
                      text-sm
                      font-medium
                      transition-colors
                      ${
                        active
                          ? 'bg-brand-orange/15 text-brand-orange'
                          : 'text-foreground/70 hover:bg-foreground/5'
                      }
                    `}
                  >

                    <Icon size={16} />

                    {label}

                  </Link>

                )
              }
            )

          )}


          {/* =================================================
              MARKETING
              
              Todos los usuarios pueden verlo actualmente.
          ================================================= */}

          <div className="relative group">

            <button
              type="button"
              onClick={() =>
                setShowMarketingMenu(
                  !showMarketingMenu
                )
              }
              className={`
                flex items-center gap-1.5
                px-3 py-1.5
                rounded-md
                text-sm
                font-medium
                transition-colors
                ${
                  isMarketingActive
                    ? 'bg-brand-orange/15 text-brand-orange'
                    : 'text-foreground/70 hover:bg-foreground/5'
                }
              `}
            >

              <CheckSquare size={16} />

              Actividades

              <ChevronDown
                size={14}
                className={`
                  transition-transform
                  ${
                    showMarketingMenu
                      ? 'rotate-180'
                      : ''
                  }
                `}
              />

            </button>


            {/* MENU */}

            <div
              className={`
                absolute
                left-0
                top-full
                mt-1
                bg-surface
                border
                border-border-color
                rounded-md
                shadow-lg
                py-1
                min-w-[180px]
                z-50
                ${
                  showMarketingMenu
                    ? 'block'
                    : 'hidden group-hover:block'
                }
              `}
            >

              {marketingLinks.map(
                ({
                  href: subHref,
                  label: subLabel,
                  icon: SubIcon,
                }) => (

                  <Link
                    key={subHref}
                    href={subHref}
                    className={`
                      flex items-center gap-2
                      px-4 py-2
                      text-sm
                      transition-colors
                      ${
                        pathname === subHref
                          ? 'bg-brand-orange/15 text-brand-orange'
                          : 'text-foreground/70 hover:bg-foreground/5'
                      }
                    `}
                    onClick={() =>
                      setShowMarketingMenu(false)
                    }
                  >

                    <SubIcon size={16} />

                    {subLabel}

                  </Link>

                )
              )}

            </div>

          </div>


          {/* =================================================
              TALLER
              
              IMPORTANTE:
              
              Esto NO depende de:
              
              user.role
              
              Depende exclusivamente de:
              
              taller_user_access
              
              Sabina:
              operator -> aparece

              Lalo:
              manager -> aparece

              Hugo:
              manager -> aparece si tiene registro

              Usuario sin registro:
              no aparece
          ================================================= */}

          {!checkingTallerAccess &&
            hasTallerAccess && (

              <Link
                href="/app1/taller"
                className={`
                  flex items-center gap-1.5
                  px-3 py-1.5
                  rounded-md
                  text-sm
                  font-medium
                  transition-colors
                  ${
                    isTallerActive
                      ? 'bg-orange-500/15 text-orange-500'
                      : 'text-foreground/70 hover:bg-foreground/5'
                  }
                `}
                title={
                  tallerAccessLevel
                    ? `Taller · ${tallerAccessLevel}`
                    : 'Taller'
                }
              >

                <Wrench size={16} />

                Taller

                {tallerAccessLevel && (

                  <span className="text-[10px] opacity-60 uppercase">
                    {tallerAccessLevel}
                  </span>

                )}

              </Link>

            )}


          {/* =================================================
              NUEVO LEAD
              
              Solo administración.
          ================================================= */}

          {isAdmin && (

            <Link
              href="/app1/leads/nuevo"
              className="
                flex items-center gap-1.5
                px-3 py-1.5
                rounded-md
                text-sm
                font-medium
                text-white
                bg-brand-orange
                hover:bg-brand-orange-dark
                ml-2
              "
            >

              <PlusCircle size={16} />

              Nuevo lead

            </Link>

          )}


          {/* =================================================
              SEPARADOR
          ================================================= */}

          <div className="h-6 w-px bg-border-color mx-2" />


          {/* =================================================
              NOTIFICACIONES
          ================================================= */}

          <ActivityNotifications
            user={user}
          />


          {/* =================================================
              TEMA
          ================================================= */}

          <ThemeToggle />


          {/* =================================================
              LOGOUT
          ================================================= */}

          <button
            type="button"
            onClick={handleLogout}
            className="
              p-1.5
              rounded-md
              text-foreground/70
              hover:bg-foreground/5
              hover:text-foreground
              transition-colors
            "
            title="Cerrar sesión"
          >

            <LogOut size={16} />

          </button>

        </div>

      </div>

    </nav>

  )
}