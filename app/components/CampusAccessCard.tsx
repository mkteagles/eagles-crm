'use client'

import { useEffect, useState } from 'react'
import {
  Check,
  Copy,
  ExternalLink,
  GraduationCap,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  UserPlus,
} from 'lucide-react'

import type { Lead } from '@/lib/types'

interface CampusAccess {
  academy_customer_id?: number
  customerId?: number
  campus_username?: string
  username?: string
  status: string
  provisioned_at?: string
}

interface CreatedCredentials {
  customerId: number
  username: string
  temporaryPassword: string | null
  loginUrl: string
  created: boolean
}

export function CampusAccessCard({ lead }: { lead: Lead }) {
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [access, setAccess] = useState<CampusAccess | null>(null)
  const [credentials, setCredentials] = useState<CreatedCredentials | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const isPaid = lead.payment_status === 'paid' && Number(lead.amount_paid || 0) > 0
  const eligibleProduct = ['workshop', 'high_ticket', 'workshop_high_ticket'].includes(
    String(lead.product || lead.product_interest || '')
  )

  useEffect(() => {
    let active = true

    async function loadAccess() {
      try {
        const response = await fetch(`/app1/api/leads/${lead.id}/campus-access`, { cache: 'no-store' })
        if (!active) return

        if (response.status === 403) {
          setAuthorized(false)
          return
        }

        const data = await response.json()
        setAuthorized(true)
        if (!response.ok) throw new Error(data.error || 'No se pudo consultar el acceso.')
        setAccess(data.access)
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'No se pudo consultar el acceso.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadAccess()
    return () => { active = false }
  }, [lead.id])

  if (!eligibleProduct || authorized === false) return null

  async function generateAccess() {
    if (!isPaid || creating) return
    const confirmed = window.confirm(
      `Se creará el acceso al campus para ${lead.full_name}. ¿El pago ya fue verificado?`
    )
    if (!confirmed) return

    setCreating(true)
    setError('')
    setCredentials(null)

    try {
      const response = await fetch(`/app1/api/leads/${lead.id}/campus-access`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No fue posible generar el acceso.')

      setCredentials(data.access)
      setAccess({
        customerId: data.access.customerId,
        username: data.access.username,
        status: 'active',
        provisioned_at: new Date().toISOString(),
      })
    } catch (creationError) {
      setError(creationError instanceof Error ? creationError.message : 'No fue posible generar el acceso.')
    } finally {
      setCreating(false)
    }
  }

  async function copyCredentials() {
    if (!credentials) return
    const message = [
      'Acceso al Campus Eagles',
      `Liga: ${credentials.loginUrl}`,
      `Usuario: ${credentials.username.replace(/@eagles\.com$/i, '')}`,
      credentials.temporaryPassword
        ? `Contraseña temporal: ${credentials.temporaryPassword}`
        : 'La contraseña ya fue entregada. Si se perdió, restablécela desde el panel del Campus.',
      'Al entrar por primera vez deberás crear una contraseña privada.',
    ].join('\n')

    await navigator.clipboard.writeText(message)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const username = credentials?.username || access?.campus_username || access?.username
  const customerId = credentials?.customerId || access?.customerId || access?.academy_customer_id
  const campusLoginUrl = credentials?.loginUrl
    || `${process.env.NEXT_PUBLIC_CAMPUS_URL || 'https://campus-eagles-gear.vercel.app'}/login`

  return (
    <section className="max-w-3xl mx-auto px-4">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.07] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-black">
              <GraduationCap size={22} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-500">Workshop Elite</p>
              <h2 className="mt-1 text-lg font-bold text-foreground">Acceso al Campus Eagles</h2>
              <p className="mt-1 text-sm text-foreground/60">
                {isPaid
                  ? 'El pago está liquidado. Genera y comparte las credenciales del alumno.'
                  : 'El acceso se habilita cuando el pago esté registrado como liquidado.'}
              </p>
            </div>
          </div>

          {!loading && !username && (
            <button
              type="button"
              onClick={generateAccess}
              disabled={!isPaid || creating}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {creating ? <LoaderCircle className="animate-spin" size={18} /> : isPaid ? <UserPlus size={18} /> : <LockKeyhole size={18} />}
              {creating ? 'Generando…' : 'Generar acceso'}
            </button>
          )}
        </div>

        {loading && (
          <p className="mt-4 flex items-center gap-2 text-sm text-foreground/55">
            <LoaderCircle className="animate-spin" size={16} /> Consultando acceso…
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
            {error}
          </p>
        )}

        {username && (
          <div className="mt-5 rounded-xl border border-border-color bg-surface p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-green-600 dark:text-green-400">
              <Check size={17} /> Acceso activo
            </div>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-foreground/50">Cliente CRM</dt>
                <dd className="mt-1 font-semibold text-foreground">#{customerId}</dd>
              </div>
              <div>
                <dt className="text-xs text-foreground/50">Usuario</dt>
                <dd className="mt-1 break-all font-semibold text-foreground">{username}</dd>
              </div>
              <div>
                <dt className="text-xs text-foreground/50">Contraseña temporal</dt>
                <dd className="mt-1 break-all font-mono font-semibold text-foreground">
                  {credentials?.temporaryPassword || 'No se vuelve a mostrar'}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              {credentials && (
                <button
                  type="button"
                  onClick={copyCredentials}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-bold text-background"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copiado' : 'Copiar credenciales'}
                </button>
              )}
              <a
                href={campusLoginUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border-color px-4 py-2 text-sm font-semibold text-foreground hover:bg-foreground/5"
              >
                <ExternalLink size={16} /> Abrir Campus
              </a>
            </div>

            {!credentials?.temporaryPassword && (
              <p className="mt-3 flex items-start gap-2 text-xs text-foreground/50">
                <KeyRound className="mt-0.5 shrink-0" size={14} />
                La contraseña se muestra una sola vez. Si se perdió, restablécela desde el panel administrativo del Campus.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
