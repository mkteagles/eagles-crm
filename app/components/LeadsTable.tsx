'use client'

import { Lead, ProductFilter } from '@/lib/types'
import { useLeads } from '@/lib/hooks'

import Link from 'next/link'

import {
  Phone,
  DollarSign,
} from 'lucide-react'

interface LeadsTableProps {
  product?: ProductFilter
}

function formatMoney(
  amount: number,
  currency: 'MXN' | 'USD'
) {
  return new Intl.NumberFormat(
    'es-MX',
    {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }
  ).format(amount)
}

function getProductLabel(
  product?: Lead['product']
) {
  switch (product) {
    case 'costa_rica':
      return '🇨🇷 Costa Rica'

    case 'workshop':
      return '🎓 Workshop'

    case 'empresarial':
      return '🏢 Empresarial'

    default:
      return '—'
  }
}

function getPaymentLabel(
  status?: Lead['payment_status']
) {
  switch (status) {
    case 'paid':
      return 'Pagado'

    case 'partial':
      return 'Pago parcial'

    case 'refunded':
      return 'Reembolsado'

    default:
      return 'Sin pago'
  }
}

function getPaymentClass(
  status?: Lead['payment_status']
) {
  switch (status) {
    case 'paid':
      return 'bg-green-500'

    case 'partial':
      return 'bg-brand-orange'

    case 'refunded':
      return 'bg-red-500'

    default:
      return 'bg-gray-500'
  }
}

export function LeadsTable({
  product = 'all',
}: LeadsTableProps) {

  const {
    leads,
    loading,
    error,
  } = useLeads(product)

  if (loading) {
    return (
      <div className="bg-surface border border-border-color rounded-lg p-8 text-center">
        <p className="text-foreground/60">
          Cargando leads...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-surface border border-red-500/30 rounded-lg p-6">
        <p className="text-red-500">
          Error: {error}
        </p>
      </div>
    )
  }

  if (leads.length === 0) {
    return (
      <div className="bg-surface border border-border-color rounded-lg p-8 text-center">
        <p className="text-foreground/50">
          No hay leads con estos filtros.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto bg-surface border border-border-color rounded-lg">

      <table className="w-full border-collapse">

        <thead>
          <tr className="bg-foreground/5">

            <th className="p-3 text-left text-sm font-semibold">
              Nombre
            </th>

            <th className="p-3 text-left text-sm font-semibold">
              Producto
            </th>

            <th className="p-3 text-left text-sm font-semibold">
              Teléfono
            </th>

            <th className="p-3 text-left text-sm font-semibold">
              Precio
            </th>

            <th className="p-3 text-left text-sm font-semibold">
              Apartado
            </th>

            <th className="p-3 text-left text-sm font-semibold">
              Saldo
            </th>

            <th className="p-3 text-left text-sm font-semibold">
              Pago
            </th>

            <th className="p-3 text-left text-sm font-semibold">
              Estado
            </th>

            <th className="p-3 text-left text-sm font-semibold">
              Score
            </th>

            <th className="p-3 text-left text-sm font-semibold">
              Acción
            </th>

          </tr>
        </thead>

        <tbody>

          {leads.map(
            (lead: Lead) => {

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

              const currency =
                lead.currency || 'MXN'

              return (
                <tr
                  key={lead.id}
                  className="border-b border-border-color hover:bg-foreground/5 transition"
                >

                  {/* NOMBRE */}

                  <td className="p-3">

                    <div className="font-semibold">
                      {lead.full_name}
                    </div>

                    {lead.email && (
                      <div className="text-xs text-foreground/50 mt-1">
                        {lead.email}
                      </div>
                    )}

                  </td>


                  {/* PRODUCTO */}

                  <td className="p-3">

                    <span className="text-sm font-medium">
                      {getProductLabel(
                        lead.product
                      )}
                    </span>

                  </td>


                  {/* TELÉFONO */}

                  <td className="p-3">

                    <a
                      href={`https://wa.me/${lead.phone_number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-500 flex items-center gap-1"
                    >

                      <Phone size={16} />

                      {lead.phone_number}

                    </a>

                  </td>


                  {/* PRECIO */}

                  <td className="p-3">

                    <div className="font-semibold whitespace-nowrap">

                      {formatMoney(
                        price,
                        currency
                      )}

                    </div>

                  </td>


                  {/* APARTADO */}

                  <td className="p-3">

                    <div className="text-green-500 font-bold whitespace-nowrap">

                      {formatMoney(
                        paid,
                        currency
                      )}

                    </div>

                  </td>


                  {/* SALDO */}

                  <td className="p-3">

                    <div
                      className={
                        balance > 0
                          ? 'text-brand-orange font-bold whitespace-nowrap'
                          : 'text-green-500 font-bold whitespace-nowrap'
                      }
                    >

                      {formatMoney(
                        balance,
                        currency
                      )}

                    </div>

                  </td>


                  {/* ESTADO DE PAGO */}

                  <td className="p-3">

                    <span
                      className={`
                        inline-flex
                        items-center
                        gap-1
                        px-2
                        py-1
                        rounded
                        text-white
                        text-xs
                        font-bold
                        whitespace-nowrap
                        ${getPaymentClass(
                          lead.payment_status
                        )}
                      `}
                    >

                      <DollarSign size={12} />

                      {getPaymentLabel(
                        lead.payment_status
                      )}

                    </span>

                  </td>


                  {/* ESTADO DEL LEAD */}

                  <td className="p-3">

                    <span
                      className={`
                        px-2
                        py-1
                        rounded
                        text-white
                        text-xs
                        font-bold
                        ${
                          lead.lead_status ===
                          'qualified'
                            ? 'bg-green-500'
                            : lead.lead_status ===
                              'interested'
                            ? 'bg-brand-blue'
                            : lead.lead_status ===
                              'contacted'
                            ? 'bg-brand-orange'
                            : lead.lead_status ===
                              'lost'
                            ? 'bg-gray-400'
                            : 'bg-gray-500'
                        }
                      `}
                    >

                      {lead.lead_status}

                    </span>

                  </td>


                  {/* SCORE */}

                  <td className="p-3 font-bold">

                    {lead.score}/100

                  </td>


                  {/* ACCIÓN */}

                  <td className="p-3">

                    <Link
                      href={`/app1/leads/${lead.id}`}
                      className="text-brand-blue hover:underline font-semibold"
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