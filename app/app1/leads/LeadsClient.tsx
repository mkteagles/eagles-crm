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

import type {
  ProductFilter,
} from '@/lib/types'

interface LeadsClientProps {
  allowedProducts: string[]
}

export default function LeadsClient({
  allowedProducts,
}: LeadsClientProps) {

  const searchParams =
    useSearchParams()

  const requestedProduct =
    searchParams.get('product')

  // =====================================================
  // PRODUCTO ACTUAL
  // =====================================================

  let product: ProductFilter =
    'all'

  if (
    requestedProduct ===
      'workshop' ||
    requestedProduct ===
      'empresarial' ||
    requestedProduct ===
      'costa_rica'
  ) {
    product =
      requestedProduct
  }

  // =====================================================
  // VALIDAR PRODUCTO
  // =====================================================

  const canSeeAll =
    allowedProducts.includes(
      'all'
    )

  const canSeeRequested =
    canSeeAll ||
    allowedProducts.includes(
      product
    )

  // =====================================================
  // SI INTENTA ENTRAR A UN
  // PRODUCTO NO PERMITIDO
  // =====================================================

  if (
    product !== 'all' &&
    !canSeeRequested
  ) {
    product =
      allowedProducts[0] as ProductFilter
  }

  // =====================================================
  // FILTROS
  // =====================================================

  const filters = [
    {
      value:
        'all' as ProductFilter,
      label: 'Todos',
      icon: Users,
      permission:
        'all',
    },

    {
      value:
        'workshop' as ProductFilter,
      label: 'Workshop',
      icon: GraduationCap,
      permission:
        'workshop',
    },

    {
      value:
        'empresarial' as ProductFilter,
      label: 'Empresarial',
      icon: Building2,
      permission:
        'empresarial',
    },

    {
      value:
        'costa_rica' as ProductFilter,
      label: 'Costa Rica',
      icon: Globe2,
      permission:
        'costa_rica',
    },
  ]

  // =====================================================
  // FILTRAR PRODUCTOS VISIBLES
  // =====================================================

  const visibleFilters =
    filters.filter(
      (filter) => {

        if (
          canSeeAll
        ) {
          return true
        }

        return allowedProducts.includes(
          filter.permission
        )
      }
    )

  // =====================================================
  // HEADER
  // =====================================================

  return (
    <div className="p-6 space-y-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="
        flex
        flex-col
        md:flex-row
        md:items-center
        md:justify-between
        gap-4
      ">

        <div>

          <h1 className="
            text-2xl
            font-bold
            text-foreground
          ">
            Ventas
          </h1>

          <p className="
            text-sm
            text-foreground/60
            mt-1
          ">
            Gestión y seguimiento
            de leads comerciales
          </p>

        </div>

        {/* NUEVO LEAD */}

        <Link
          href="/app1/leads/nuevo"
          className="
            inline-flex
            items-center
            gap-2
            bg-brand-blue
            text-white
            px-4
            py-2
            rounded-lg
            font-semibold
            hover:opacity-90
            transition
          "
        >

          <Plus size={18} />

          Nuevo lead

        </Link>

      </div>

      {/* =================================================
          FILTROS
      ================================================= */}

      <div className="
        flex
        flex-wrap
        gap-2
      ">

        {visibleFilters.map(
          (filter) => {

            const Icon =
              filter.icon

            const active =
              product ===
              filter.value

            const href =
              filter.value ===
              'all'
                ? '/app1/leads'
                : `/app1/leads?product=${filter.value}`

            return (

              <Link
                key={
                  filter.value
                }
                href={href}
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
                      ? `
                        bg-brand-blue
                        text-white
                        border-brand-blue
                      `
                      : `
                        bg-surface
                        border-border-color
                        text-foreground
                        hover:bg-foreground/5
                      `
                  }
                `}
              >

                <Icon size={16} />

                {
                  filter.label
                }

              </Link>

            )
          }
        )}

      </div>

      {/* =================================================
          TABLA
      ================================================= */}

      <LeadsTable
        product={product}
      />

    </div>
  )
}