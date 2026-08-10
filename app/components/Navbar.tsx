'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, BarChart3, LogOut, PlusCircle, CheckSquare, Calendar, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useCurrentUser } from '@/lib/marketing-hooks'
import { useState } from 'react'

const links = [
  { href: '/app1', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app1/leads', label: 'Leads', icon: Users },
  { href: '/app1/analytics', label: 'Análisis', icon: BarChart3 },
]

const marketingLinks = [
  { href: '/app1/marketing', label: 'Actividades', icon: CheckSquare },
  { href: '/app1/marketing/calendar', label: 'Calendario', icon: Calendar },
  { href: '/app1/marketing/reports', label: 'Reportes', icon: FileText },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { user } = useCurrentUser()
  const isExecutor = user?.role === 'executor'
  const [showMarketingMenu, setShowMarketingMenu] = useState(false)

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/auth/login')
      router.refresh()
    } catch (error) {
      console.error('Error logging out:', error)
      router.push('/auth/login')
    }
  }

  const isMarketingActive = pathname.startsWith('/app1/marketing')

  return (
    <nav className="bg-surface border-b border-border-color sticky top-0 z-50">
      <div className="max-w-full px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <Image src="/logo-icon.jpg" alt="Eagles Gear Solutions" width={36} height={36} className="rounded-full" />
          <span className="font-bold text-lg">
            Eagles <span className="text-brand-orange">Gear</span> CRM
          </span>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {/* Links principales (ocultos para executors: solo ven marketing) */}
          {!isExecutor && links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
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
          })}

          {/* Dropdown de Marketing */}
          <div className="relative group">
            <button
              onClick={() => setShowMarketingMenu(!showMarketingMenu)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isMarketingActive
                  ? 'bg-brand-orange/15 text-brand-orange'
                  : 'text-foreground/70 hover:bg-foreground/5'
              }`}
            >
              <CheckSquare size={16} />
              Actividades
            </button>

            <div className="absolute left-0 top-full mt-0 bg-surface border border-border-color rounded-md shadow-lg hidden group-hover:block py-1 min-w-max z-50">
              {marketingLinks.map(({ href: subHref, label: subLabel, icon: SubIcon }) => (
                <Link
                  key={subHref}
                  href={subHref}
                  className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                    pathname === subHref
                      ? 'bg-brand-orange/15 text-brand-orange'
                      : 'text-foreground/70 hover:bg-foreground/5'
                  }`}
                >
                  <SubIcon size={16} />
                  {subLabel}
                </Link>
              ))}
            </div>
          </div>

          {!isExecutor && (
            <Link
              href="/app1/leads/nuevo"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white bg-brand-orange hover:bg-brand-orange-dark ml-2"
            >
              <PlusCircle size={16} />
              Nuevo lead
            </Link>
          )}

          <ThemeToggle />

          <button
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