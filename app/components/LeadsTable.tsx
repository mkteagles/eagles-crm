'use client'

import { Lead } from '@/lib/types'
import { useLeads, ProductFilter } from '@/lib/hooks'
import Link from 'next/link'
import { Phone } from 'lucide-react'

interface LeadsTableProps {
  product?: ProductFilter
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
      <div className="p-4">
        Cargando leads...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error: {error}
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
              Teléfono
            </th>

            <th className="p-3 text-left text-sm font-semibold">
              Email
            </th>

            <th className="p-3 text-left text-sm font-semibold">
              Campaña
            </th>

            <th className="p-3 text-left text-sm font-semibold">
              Estado
            </th>

            <th className="p-3 text-left text-sm font-semibold">
              Score
            </th>

            <th className="p-3 text-left text-sm font-semibold">
              Engagement
            </th>

            <th className="p-3 text-left text-sm font-semibold">
              ¿Compró?
            </th>

            <th className="p-3 text-left text-sm font-semibold">
              Acción
            </th>

          </tr>

        </thead>

        <tbody>

          {leads.map((lead: Lead) => (

            <tr
              key={lead.id}
              className="border-b border-border-color hover:bg-foreground/5"
            >

              {/* NOMBRE */}

              <td className="p-3 font-semibold">
                {lead.full_name}
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


              {/* EMAIL */}

              <td className="p-3">
                {lead.email || '—'}
              </td>


              {/* CAMPAÑA */}

              <td className="p-3 text-sm text-foreground/60">
                {lead.campaign_name || '—'}
              </td>


              {/* ESTADO */}

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
                      lead.lead_status === 'qualified'
                        ? 'bg-green-500'
                        : lead.lead_status === 'interested'
                        ? 'bg-brand-blue'
                        : lead.lead_status === 'contacted'
                        ? 'bg-brand-orange'
                        : lead.lead_status === 'lost'
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


              {/* ENGAGEMENT */}

              <td className="p-3">

                <span
                  className={
                    lead.lead_metrics?.engagement_level === 'hot'
                      ? 'text-red-500 font-bold'
                      : lead.lead_metrics?.engagement_level === 'high'
                      ? 'text-brand-orange font-bold'
                      : lead.lead_metrics?.engagement_level === 'medium'
                      ? 'text-brand-blue'
                      : 'text-foreground/50'
                  }
                >

                  {lead.lead_metrics?.engagement_level || 'low'}

                </span>

              </td>


              {/* COMPRA */}

              <td className="p-3">

                {lead.has_purchased ? (

                  <span className="text-green-500 font-bold">
                    ✓ Sí
                  </span>

                ) : (

                  <span className="text-red-500">
                    ✗ No
                  </span>

                )}

              </td>


              {/* ACCIÓN */}

              <td className="p-3">

                <Link
                  href={`/app1/leads/${lead.id}`}
                  className="text-brand-blue hover:underline"
                >
                  Ver más
                </Link>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  )
}