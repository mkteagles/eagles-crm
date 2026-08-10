
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  BarChart3,
  LogOut,
  PlusCircle,
  CheckSquare,
  Calendar,
  FileText,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useCurrentUser } from '@/lib/marketing-hooks'
import ActivityNotifications from '@/components/activity-notifications'
import { useState } from 'react'

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
// LINKS DE MARKETING
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
// NAVBAR
// =========================================================

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  const supabase = createClient()

  const { user } = useCurrentUser()

  const isExecutor =
    user?.role === 'executor'

  const [
    showMarketingMenu,
    setShowMarketingMenu,
  ] = useState(false)

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
  // MARKETING ACTIVO
  // =======================================================

  const isMarketingActive =
    pathname.startsWith(
      '/app1/marketing'
    )

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <nav className="border-b border-border-color bg-surface">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">

        {/* =================================================
            LOGO / NOMBRE
        ================================================= */}

        <div className="flex items-center gap-3">
          <Link
            href="/app1"
            className="flex items-center gap-2"
          >
            <Image
              src="/logo.png"
              alt="Eagles Gear CRM"
              width={36}
              height={36}
              className="rounded-md"
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

              Los executors no los ven.
          ================================================= */}

          {!isExecutor &&
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? 'bg-brand-orange/15 text-brand-orange'
                        : 'text-foreground/70 hover:bg-foreground/5'
                    }`}
                  >
                    <Icon size={16} />

                    {label}
                  </Link>
                )
              }
            )}

          {/* =================================================
              DROPDOWN MARKETING
          ================================================= */}

          <div className="relative group">

            <button
              type="button"
              onClick={() =>
                setShowMarketingMenu(
                  !showMarketingMenu
                )
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isMarketingActive
                  ? 'bg-brand-orange/15 text-brand-orange'
                  : 'text-foreground/70 hover:bg-foreground/5'
              }`}
            >
              <CheckSquare size={16} />

              Actividades
            </button>

            {/* =================================================
                MENU
            ================================================= */}

            <div
              className={`absolute left-0 top-full mt-0 bg-surface border border-border-color rounded-md shadow-lg py-1 min-w-max z-50 ${
                showMarketingMenu
                  ? 'block'
                  : 'hidden group-hover:block'
              }`}
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
                    className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                      pathname === subHref
                        ? 'bg-brand-orange/15 text-brand-orange'
                        : 'text-foreground/70 hover:bg-foreground/5'
                    }`}
                    onClick={() =>
                      setShowMarketingMenu(
                        false
                      )
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
              NUEVO LEAD

              No aparece para executors.
          ================================================= */}

          {!isExecutor && (
            <Link
              href="/app1/leads/nuevo"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white bg-brand-orange hover:bg-brand-orange-dark ml-2"
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
            className="p-1.5 rounded-md text-foreground/70 hover:bg-foreground/5 hover:text-foreground transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={16} />
          </button>

        </div>
      </div>
    </nav>
  )
}
