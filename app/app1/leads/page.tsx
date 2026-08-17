'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Plus,
  Users,
  GraduationCap,
  Building2,
  Globe2,
} from 'lucide-react'
import { LeadsTable } from '@/components/LeadsTable'
import { ProductFilter } from '@/lib/hooks'

export default function LeadsPage() {

  const searchParams = useSearchParams()

  const product =
    (searchParams.get('product') as ProductFilter) || 'all'

  const filters = [
    {
      value: 'all' as ProductFilter,
      label: 'Todos',
      icon: Users,
    },
    {
      value: 'workshop' as ProductFilter,
      label: 'Workshop',
      icon: GraduationCap,
    },
    {
      value: 'empresarial' as ProductFilter,
      label: 'Empresarial',
      icon: Building2,
    },
    {
      value: 'costa_rica' as ProductFilter,
      label: 'Costa Rica',
      icon: Globe2,
    },
  ]

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>

          <h1 className="text-2xl font-bold">
            Ventas
          </h1>

          <p className="text-sm text-foreground/60 mt-1">
            Gestión y seguimiento de leads comerciales
          </p>

        </div>


        <Link
          href="/app1/leads/nuevo"
          className="inline-flex items-center gap-2 bg-brand-blue text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90"
        >

          <Plus size={18} />

          Nuevo lead

        </Link>

      </div>


      {/* FILTROS */}

      <div className="flex flex-wrap gap-2">

        {filters.map((filter) => {

          const Icon = filter.icon

          const active =
            product === filter.value

          return (

            <Link
              key={filter.value}
              href={
                filter.value === 'all'
                  ? '/app1/leads'
                  : `/app1/leads?product=${filter.value}`
              }
              className={`
                inline-flex
                items-center
                gap-2
                px-4
                py-2
                rounded-lg
                text-sm
                font-semibold
                border
                transition

                ${
                  active
                    ? 'bg-brand-blue text-white border-brand-blue'
                    : 'bg-surface border-border-color text-foreground hover:bg-foreground/5'
                }
              `}
            >

              <Icon size={16} />

              {filter.label}

            </Link>

          )

        })}

      </div>


      {/* LEADS */}

      <LeadsTable
        product={product}
      />

    </div>
  )
}