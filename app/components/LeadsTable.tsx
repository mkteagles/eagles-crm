'use client'

import Link from 'next/link'

import {
  Phone,
  GraduationCap,
  Building2,
  Globe2,
  DollarSign,
  ArrowUpRight,
} from 'lucide-react'

import type {
  Lead,
  ProductFilter,
  Currency,
} from '@/lib/types'

import { useLeads } from '@/lib/hooks'


// =======================================================
// PRODUCTO
// =======================================================

function getProductInfo(
  product?: ProductFilter | string | null
) {
  switch (product) {
    case 'workshop':
    case 'workshop_high_ticket':
      return {
        label: 'High Ticket',
        icon: GraduationCap,
        className:
          'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300',
      }

    case 'workshop_lite':
      return {
        label: 'Workshop Lite',
        icon: GraduationCap,
        className:
          'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
      }

    case 'empresarial':
      return {
        label: 'Empresarial',
        icon: Building2,
        className:
          'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
      }

    case 'costa_rica':
      return {
        label: 'Costa Rica',
        icon: Globe2,
        className:
          'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300',
      }

    default:
      return {
        label: 'Sin producto',
        icon: DollarSign,
        className:
          'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300',
      }
  }
}


// =======================================================
// FORMATO DINERO
// =======================================================

function formatMoney(
  amount: number | null | undefined,
  currency: Currency | string | null | undefined
) {
  if (
    amount === undefined ||
    amount === null
  ) {
    return '—'
  }

  const safeCurrency =
    currency === 'USD'
      ? 'USD'
      : 'MXN'

  return new Intl.NumberFormat(
    safeCurrency === 'USD'
      ? 'en-US'
      : 'es-MX',
    {
      style: 'currency',
      currency: safeCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }
  ).format(
    Number(amount)
  )
}


// =======================================================
// ESTADO DE PAGO
// =======================================================

function getPaymentBadge(
  status?: string | null
) {
  switch (status) {
    case 'paid':
      return {
        label: 'Pagado',
        className:
          'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300',
      }

    case 'partial':
      return {
        label: 'Parcial',
        className:
          'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-300',
      }

    default:
      return {
        label: 'Sin pago',
        className:
          'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400',
      }
  }
}


// =======================================================
// ESTADO DEL LEAD
// =======================================================

function getLeadStatusInfo(
  status?: string | null
) {
  switch (status) {
    case 'qualified':
      return {
        label: 'Calificado',
        className:
          'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300',
      }

    case 'contacted':
      return {
        label: 'Contactado',
        className:
          'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
      }

    case 'interested':
      return {
        label: 'Interesado',
        className:
          'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
      }

    case 'follow_up':
      return {
        label: 'Seguimiento',
        className:
          'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-300',
      }

    case 'negotiation':
      return {
        label: 'Negociación',
        className:
          'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300',
      }

    case 'won':
      return {
        label: 'Ganado',
        className:
          'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300',
      }

    case 'lost':
      return {
        label: 'Perdido',
        className:
          'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300',
      }

    case 'inactive':
      return {
        label: 'Inactivo',
        className:
          'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400',
      }

    default:
      return {
        label: 'Nuevo',
        className:
          'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400',
      }
  }
}


// =======================================================
// PROPS
// =======================================================

interface LeadsTableProps {
  product?: ProductFilter
}


// =======================================================
// COMPONENTE
// =======================================================

export function LeadsTable({
  product = 'all',
}: LeadsTableProps) {

  const {
    leads,
    loading,
    error,
  } = useLeads(product)


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div
        className="
          bg-surface
          border
          border-border-color
          rounded-2xl
          p-8
          text-center
        "
      >
        <div
          className="
            animate-pulse
            text-sm
            text-foreground/60
          "
        >
          Cargando leads...
        </div>
      </div>
    )
  }


  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div
        className="
          bg-red-50
          dark:bg-red-950/20
          border
          border-red-200
          dark:border-red-900/50
          rounded-2xl
          p-5
          text-red-700
          dark:text-red-300
        "
      >
        <p className="font-semibold text-sm">
          Error cargando leads
        </p>

        <p className="text-sm mt-1 opacity-80">
          {error}
        </p>
      </div>
    )
  }


  // =====================================================
  // SIN LEADS
  // =====================================================

  if (
    !leads ||
    leads.length === 0
  ) {
    return (
      <div
        className="
          bg-surface
          border
          border-border-color
          rounded-2xl
          p-10
          text-center
        "
      >
        <div
          className="
            mx-auto
            w-11
            h-11
            rounded-xl
            bg-foreground/5
            flex
            items-center
            justify-center
          "
        >
          <span className="text-lg">
            👥
          </span>
        </div>

        <p
          className="
            mt-3
            font-semibold
            text-foreground
          "
        >
          No hay leads
        </p>

        <p
          className="
            mt-1
            text-sm
            text-foreground/50
          "
        >
          No hay leads con este producto o filtro.
        </p>
      </div>
    )
  }


  // =====================================================
  // TABLA
  // =====================================================

  return (
    <div
      className="
        w-full
        overflow-hidden
        bg-surface
        border
        border-border-color
        rounded-2xl
        shadow-sm
      "
    >

      {/* =================================================
          CONTENEDOR SCROLL
      ================================================= */}

      <div className="overflow-x-auto">

        <table
          className="
            w-full
            min-w-[1000px]
            border-collapse
          "
        >

          {/* =================================================
              HEADER
          ================================================= */}

          <thead>

            <tr
              className="
                bg-foreground/[0.025]
                border-b
                border-border-color
              "
            >

              <th
                className="
                  px-4
                  py-3
                  text-left
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-wider
                  text-foreground/50
                  w-[220px]
                "
              >
                Lead
              </th>

              <th
                className="
                  px-3
                  py-3
                  text-left
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-wider
                  text-foreground/50
                  w-[145px]
                "
              >
                Producto
              </th>

              <th
                className="
                  px-3
                  py-3
                  text-left
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-wider
                  text-foreground/50
                  w-[150px]
                "
              >
                Contacto
              </th>

              <th
                className="
                  px-3
                  py-3
                  text-right
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-wider
                  text-foreground/50
                  w-[110px]
                "
              >
                Precio
              </th>

              <th
                className="
                  px-3
                  py-3
                  text-right
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-wider
                  text-foreground/50
                  w-[105px]
                "
              >
                Pagado
              </th>

              <th
                className="
                  px-3
                  py-3
                  text-right
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-wider
                  text-foreground/50
                  w-[105px]
                "
              >
                Saldo
              </th>

              <th
                className="
                  px-3
                  py-3
                  text-left
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-wider
                  text-foreground/50
                  w-[100px]
                "
              >
                Pago
              </th>

              <th
                className="
                  px-3
                  py-3
                  text-left
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-wider
                  text-foreground/50
                  w-[120px]
                "
              >
                Estado
              </th>

              <th
                className="
                  px-3
                  py-3
                  text-center
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-wider
                  text-foreground/50
                  w-[70px]
                "
              >
                Score
              </th>

              <th
                className="
                  px-3
                  py-3
                  text-right
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-wider
                  text-foreground/50
                  w-[90px]
                "
              >
                Acción
              </th>

            </tr>

          </thead>


          {/* =================================================
              BODY
          ================================================= */}

          <tbody>

            {leads.map(
              (lead: Lead) => {

                const productInfo =
                  getProductInfo(
                    lead.product
                  )

                const ProductIcon =
                  productInfo.icon


                const price =
                  Number(
                    lead.product_price || 0
                  )


                const paid =
                  Number(
                    lead.amount_paid || 0
                  )


                const balance =
                  Math.max(
                    price - paid,
                    0
                  )


                const paymentBadge =
                  getPaymentBadge(
                    lead.payment_status
                  )


                const statusInfo =
                  getLeadStatusInfo(
                    lead.lead_status
                  )


                return (

                  <tr
                    key={lead.id}
                    className="
                      group
                      border-b
                      border-border-color
                      last:border-b-0
                      hover:bg-foreground/[0.025]
                      transition-colors
                    "
                  >

                    {/* =====================================
                        LEAD
                    ===================================== */}

                    <td className="px-4 py-3">

                      <div
                        className="
                          min-w-0
                          max-w-[210px]
                        "
                      >

                        <Link
                          href={`/app1/leads/${lead.id}`}
                          className="
                            block
                            truncate
                            text-sm
                            font-semibold
                            text-foreground
                            hover:text-brand-blue
                            transition-colors
                          "
                          title={
                            lead.full_name ||
                            'Sin nombre'
                          }
                        >
                          {lead.full_name ||
                            'Sin nombre'}
                        </Link>


                        {lead.email && (

                          <div
                            className="
                              mt-0.5
                              truncate
                              text-[11px]
                              text-foreground/45
                            "
                            title={
                              lead.email
                            }
                          >
                            {lead.email}
                          </div>

                        )}

                      </div>

                    </td>


                    {/* =====================================
                        PRODUCTO
                    ===================================== */}

                    <td className="px-3 py-3">

                      <span
                        className={`
                          inline-flex
                          items-center
                          gap-1.5
                          px-2
                          py-1
                          rounded-md
                          text-[10px]
                          font-bold
                          whitespace-nowrap
                          ${productInfo.className}
                        `}
                      >

                        <ProductIcon
                          size={12}
                          strokeWidth={2.5}
                        />

                        {productInfo.label}

                      </span>

                    </td>


                    {/* =====================================
                        CONTACTO
                    ===================================== */}

                    <td className="px-3 py-3">

                      {lead.phone_number ? (

                        <a
                          href={`https://wa.me/${lead.phone_number.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="
                            inline-flex
                            max-w-[145px]
                            items-center
                            gap-1.5
                            text-xs
                            text-green-600
                            dark:text-green-400
                            hover:underline
                            font-medium
                            truncate
                          "
                          title={
                            lead.phone_number
                          }
                        >

                          <Phone
                            size={13}
                            className="shrink-0"
                          />

                          <span className="truncate">
                            {lead.phone_number}
                          </span>

                        </a>

                      ) : (

                        <span
                          className="
                            text-xs
                            text-foreground/30
                          "
                        >
                          —
                        </span>

                      )}

                    </td>


                    {/* =====================================
                        PRECIO
                    ===================================== */}

                    <td
                      className="
                        px-3
                        py-3
                        text-right
                      "
                    >

                      <span
                        className="
                          text-xs
                          font-semibold
                          text-foreground
                          whitespace-nowrap
                        "
                      >
                        {formatMoney(
                          price,
                          lead.currency
                        )}
                      </span>

                    </td>


                    {/* =====================================
                        PAGADO
                    ===================================== */}

                    <td
                      className="
                        px-3
                        py-3
                        text-right
                      "
                    >

                      <span
                        className="
                          text-xs
                          font-semibold
                          text-green-600
                          dark:text-green-400
                          whitespace-nowrap
                        "
                      >
                        {formatMoney(
                          paid,
                          lead.currency
                        )}
                      </span>

                    </td>


                    {/* =====================================
                        SALDO
                    ===================================== */}

                    <td
                      className="
                        px-3
                        py-3
                        text-right
                      "
                    >

                      <span
                        className={`
                          text-xs
                          font-semibold
                          whitespace-nowrap
                          ${
                            balance > 0
                              ? 'text-orange-600 dark:text-orange-400'
                              : 'text-green-600 dark:text-green-400'
                          }
                        `}
                      >
                        {formatMoney(
                          balance,
                          lead.currency
                        )}
                      </span>

                    </td>


                    {/* =====================================
                        PAGO
                    ===================================== */}

                    <td className="px-3 py-3">

                      <span
                        className={`
                          inline-flex
                          px-2
                          py-1
                          rounded-md
                          text-[10px]
                          font-bold
                          whitespace-nowrap
                          ${paymentBadge.className}
                        `}
                      >
                        {paymentBadge.label}
                      </span>

                    </td>


                    {/* =====================================
                        ESTADO
                    ===================================== */}

                    <td className="px-3 py-3">

                      <span
                        className={`
                          inline-flex
                          px-2
                          py-1
                          rounded-md
                          text-[10px]
                          font-bold
                          whitespace-nowrap
                          ${statusInfo.className}
                        `}
                      >
                        {statusInfo.label}
                      </span>

                    </td>


                    {/* =====================================
                        SCORE
                    ===================================== */}

                    <td
                      className="
                        px-3
                        py-3
                        text-center
                      "
                    >

                      <span
                        className="
                          inline-flex
                          items-center
                          justify-center
                          min-w-[42px]
                          px-1.5
                          py-1
                          rounded-md
                          bg-foreground/5
                          text-xs
                          font-bold
                          text-foreground
                        "
                      >
                        {lead.score ?? 0}
                      </span>

                    </td>


                    {/* =====================================
                        ACCIÓN
                    ===================================== */}

                    <td
                      className="
                        px-3
                        py-3
                        text-right
                      "
                    >

                      <Link
                        href={`/app1/leads/${lead.id}`}
                        className="
                          inline-flex
                          items-center
                          justify-center
                          gap-1
                          px-2.5
                          py-1.5
                          rounded-md
                          text-[11px]
                          font-semibold
                          bg-brand-blue
                          text-white
                          hover:opacity-90
                          transition
                          whitespace-nowrap
                        "
                      >

                        Ver

                        <ArrowUpRight
                          size={12}
                        />

                      </Link>

                    </td>

                  </tr>

                )
              }
            )}

          </tbody>

        </table>

      </div>


      {/* =================================================
          FOOTER
      ================================================= */}

      <div
        className="
          flex
          items-center
          justify-between
          px-4
          py-2.5
          border-t
          border-border-color
          bg-foreground/[0.015]
        "
      >

        <span
          className="
            text-[11px]
            text-foreground/45
          "
        >
          {leads.length}{' '}
          {leads.length === 1
            ? 'lead'
            : 'leads'}
        </span>

        <span
          className="
            text-[11px]
            text-foreground/35
          "
        >
          Desliza horizontalmente para ver más
        </span>

      </div>

    </div>
  )
}