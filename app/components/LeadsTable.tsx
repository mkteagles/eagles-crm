'use client'

import Link from 'next/link'

import {
  Phone,
  GraduationCap,
  Building2,
  Globe2,
  DollarSign,
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
      return {
        label: 'Workshop High Ticket',
        icon: GraduationCap,
        className:
          'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      }

    case 'workshop_lite':
      return {
        label: 'Workshop Lite',
        icon: GraduationCap,
        className:
          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      }

    case 'empresarial':
      return {
        label: 'Empresarial',
        icon: Building2,
        className:
          'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      }

    case 'costa_rica':
      return {
        label: 'Costa Rica',
        icon: Globe2,
        className:
          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      }

    default:
      return {
        label: 'Sin producto',
        icon: DollarSign,
        className:
          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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

  if (status === 'paid') {

    return {
      label: 'Pagado',
      className: `
        bg-green-100
        text-green-700
        dark:bg-green-900/30
        dark:text-green-300
      `,
    }
  }

  if (status === 'partial') {

    return {
      label: 'Pago parcial',
      className: `
        bg-yellow-100
        text-yellow-700
        dark:bg-yellow-900/30
        dark:text-yellow-300
      `,
    }
  }

  return {
    label: 'Sin pago',
    className: `
      bg-gray-100
      text-gray-600
      dark:bg-gray-800
      dark:text-gray-300
    `,
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
        className: `
          bg-green-100
          text-green-700
          dark:bg-green-900/30
          dark:text-green-300
        `,
      }

    case 'contacted':
      return {
        label: 'Contactado',
        className: `
          bg-orange-100
          text-orange-700
          dark:bg-orange-900/30
          dark:text-orange-300
        `,
      }

    case 'interested':
      return {
        label: 'Interesado',
        className: `
          bg-blue-100
          text-blue-700
          dark:bg-blue-900/30
          dark:text-blue-300
        `,
      }

    case 'follow_up':
      return {
        label: 'Seguimiento',
        className: `
          bg-yellow-100
          text-yellow-700
          dark:bg-yellow-900/30
          dark:text-yellow-300
        `,
      }

    case 'negotiation':
      return {
        label: 'Negociación',
        className: `
          bg-purple-100
          text-purple-700
          dark:bg-purple-900/30
          dark:text-purple-300
        `,
      }

    case 'won':
      return {
        label: 'Ganado',
        className: `
          bg-green-100
          text-green-700
          dark:bg-green-900/30
          dark:text-green-300
        `,
      }

    case 'lost':
      return {
        label: 'Perdido',
        className: `
          bg-red-100
          text-red-700
          dark:bg-red-900/30
          dark:text-red-300
        `,
      }

    case 'inactive':
      return {
        label: 'Inactivo',
        className: `
          bg-gray-100
          text-gray-600
          dark:bg-gray-800
          dark:text-gray-300
        `,
      }

    default:
      return {
        label: 'Nuevo',
        className: `
          bg-gray-100
          text-gray-600
          dark:bg-gray-800
          dark:text-gray-300
        `,
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
          rounded-xl
          p-8
          text-center
        "
      >

        <div
          className="
            animate-pulse
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
          dark:bg-red-950/30
          border
          border-red-200
          dark:border-red-900
          rounded-xl
          p-6
          text-red-700
          dark:text-red-300
        "
      >

        <p className="font-semibold">
          Error cargando leads
        </p>

        <p className="text-sm mt-1">
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
          rounded-xl
          p-10
          text-center
        "
      >

        <div
          className="
            mx-auto
            w-12
            h-12
            rounded-xl
            bg-foreground/5
            flex
            items-center
            justify-center
          "
        >

          <span className="text-xl">
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
        overflow-x-auto
        bg-surface
        border
        border-border-color
        rounded-xl
        shadow-sm
      "
    >

      <table
        className="
          w-full
          border-collapse
          min-w-[1150px]
        "
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <thead>

          <tr
            className="
              bg-foreground/[0.03]
              border-b
              border-border-color
            "
          >

            <th className="p-4 text-left text-xs font-bold uppercase tracking-wide">
              Nombre
            </th>

            <th className="p-4 text-left text-xs font-bold uppercase tracking-wide">
              Producto
            </th>

            <th className="p-4 text-left text-xs font-bold uppercase tracking-wide">
              Teléfono
            </th>

            <th className="p-4 text-left text-xs font-bold uppercase tracking-wide">
              Precio
            </th>

            <th className="p-4 text-left text-xs font-bold uppercase tracking-wide">
              Pagado
            </th>

            <th className="p-4 text-left text-xs font-bold uppercase tracking-wide">
              Saldo
            </th>

            <th className="p-4 text-left text-xs font-bold uppercase tracking-wide">
              Pago
            </th>

            <th className="p-4 text-left text-xs font-bold uppercase tracking-wide">
              Estado
            </th>

            <th className="p-4 text-left text-xs font-bold uppercase tracking-wide">
              Score
            </th>

            <th className="p-4 text-left text-xs font-bold uppercase tracking-wide">
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
                    border-b
                    border-border-color
                    last:border-b-0
                    hover:bg-foreground/[0.025]
                    transition
                  "
                >

                  {/* =======================================
                      NOMBRE
                  ======================================= */}

                  <td className="p-4">

                    <div
                      className="
                        font-semibold
                        text-foreground
                      "
                    >
                      {lead.full_name}
                    </div>

                    {lead.email && (

                      <div
                        className="
                          mt-1
                          text-xs
                          text-foreground/50
                        "
                      >
                        {lead.email}
                      </div>

                    )}

                  </td>


                  {/* =======================================
                      PRODUCTO
                  ======================================= */}

                  <td className="p-4">

                    <span
                      className={`
                        inline-flex
                        items-center
                        gap-2
                        px-3
                        py-1.5
                        rounded-lg
                        text-xs
                        font-bold
                        whitespace-nowrap
                        ${productInfo.className}
                      `}
                    >

                      <ProductIcon size={14} />

                      {productInfo.label}

                    </span>

                  </td>


                  {/* =======================================
                      TELÉFONO
                  ======================================= */}

                  <td className="p-4">

                    {lead.phone_number ? (

                      <a
                        href={`https://wa.me/${lead.phone_number.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                          inline-flex
                          items-center
                          gap-2
                          text-green-600
                          dark:text-green-400
                          hover:underline
                          font-medium
                        "
                      >

                        <Phone size={15} />

                        {lead.phone_number}

                      </a>

                    ) : (

                      <span className="text-foreground/40">
                        —
                      </span>

                    )}

                  </td>


                  {/* =======================================
                      PRECIO
                  ======================================= */}

                  <td className="p-4">

                    <div
                      className="
                        font-semibold
                        text-foreground
                        whitespace-nowrap
                      "
                    >

                      {formatMoney(
                        price,
                        lead.currency
                      )}

                    </div>

                  </td>


                  {/* =======================================
                      PAGADO
                  ======================================= */}

                  <td className="p-4">

                    <div
                      className="
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

                    </div>

                  </td>


                  {/* =======================================
                      SALDO
                  ======================================= */}

                  <td className="p-4">

                    <div
                      className={`
                        font-semibold
                        whitespace-nowrap
                        ${
                          balance > 0
                            ? `
                              text-orange-600
                              dark:text-orange-400
                            `
                            : `
                              text-green-600
                              dark:text-green-400
                            `
                        }
                      `}
                    >

                      {formatMoney(
                        balance,
                        lead.currency
                      )}

                    </div>

                  </td>


                  {/* =======================================
                      PAGO
                  ======================================= */}

                  <td className="p-4">

                    <span
                      className={`
                        inline-flex
                        px-2.5
                        py-1
                        rounded-full
                        text-xs
                        font-bold
                        ${paymentBadge.className}
                      `}
                    >

                      {paymentBadge.label}

                    </span>

                  </td>


                  {/* =======================================
                      ESTADO
                  ======================================= */}

                  <td className="p-4">

                    <span
                      className={`
                        inline-flex
                        px-2.5
                        py-1
                        rounded-full
                        text-xs
                        font-bold
                        whitespace-nowrap
                        ${statusInfo.className}
                      `}
                    >

                      {statusInfo.label}

                    </span>

                  </td>


                  {/* =======================================
                      SCORE
                  ======================================= */}

                  <td className="p-4">

                    <span
                      className="
                        font-bold
                        text-foreground
                      "
                    >
                      {lead.score ?? 0}/100
                    </span>

                  </td>


                  {/* =======================================
                      ACCIÓN
                  ======================================= */}

                  <td className="p-4">

                    <Link
                      href={`/app1/leads/${lead.id}`}
                      className="
                        inline-flex
                        items-center
                        px-3
                        py-2
                        rounded-lg
                        text-sm
                        font-semibold
                        bg-brand-blue
                        text-white
                        hover:opacity-90
                        transition
                      "
                    >
                      Ver más
                    </Link>

                  </td>

                </tr>

              )
            }
          )}

        </tbody>

      </table>

    </div>
  )
}