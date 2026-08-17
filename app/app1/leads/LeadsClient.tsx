'use client'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import Link from 'next/link'

import {
  Plus,
  Users,
  GraduationCap,
  Building2,
  Globe2,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'

import {
  ProductFilter,
} from '@/lib/types'

import {
  PRODUCT_ACCESS,
} from '@/lib/hooks'

import {
  LeadsTable,
} from '@/components/LeadsTable'


// =======================================================
// PROPS
// =======================================================

interface LeadsClientProps {
  initialProduct?: ProductFilter
}


// =======================================================
// COMPONENTE
// =======================================================

export default function LeadsClient({
  initialProduct = 'all',
}: LeadsClientProps) {

  const supabase =
    createClient()


  // =====================================================
  // USUARIO
  // =====================================================

  const [
    profile,
    setProfile,
  ] = useState<{
    full_name?: string
    email?: string
    role?: string
  } | null>(null)


  const [
    loadingProfile,
    setLoadingProfile,
  ] = useState(true)


  // =====================================================
  // CARGAR PERFIL
  // =====================================================

  useEffect(() => {

    async function loadProfile() {

      setLoadingProfile(true)

      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser()


      if (!user) {

        setLoadingProfile(false)

        return

      }


      const {
        data,
      } =
        await supabase
          .from('user_profiles')
          .select(
            'full_name, email, role'
          )
          .eq(
            'id',
            user.id
          )
          .single()


      setProfile({

        full_name:
          data?.full_name ||
          user.user_metadata?.full_name ||
          '',

        email:
          data?.email ||
          user.email ||
          '',

        role:
          data?.role ||
          'executor',

      })


      setLoadingProfile(false)

    }


    loadProfile()

  }, [
    supabase,
  ])


  // =====================================================
  // NORMALIZAR
  // =====================================================

  const normalizedName =
    profile?.full_name
      ?.trim()
      .toLowerCase() || ''


  const normalizedEmail =
    profile?.email
      ?.trim()
      .toLowerCase() || ''


  // =====================================================
  // USUARIOS
  // =====================================================

  const isMarcos =
    normalizedName.includes('marcos') ||
    normalizedEmail ===
      'marcosc@eagles.com'


  const isUrsula =
    normalizedName.includes('ursula') ||
    normalizedName.includes('úrsula') ||
    normalizedEmail ===
      'ursula@eagles.com'


  // =====================================================
  // PRODUCTOS PERMITIDOS
  // =====================================================

  const allowedProducts =
    useMemo<ProductFilter[]>(
      () => {

        if (
          profile?.role === 'admin'
        ) {

          return PRODUCT_ACCESS.admin

        }


        if (
          profile?.role === 'executor' &&
          isMarcos
        ) {

          return PRODUCT_ACCESS.executor_marcos

        }


        if (
          profile?.role === 'executor' &&
          isUrsula
        ) {

          return PRODUCT_ACCESS.executor_ursula

        }


        return []

      },
      [
        profile?.role,
        isMarcos,
        isUrsula,
      ]
    )


  // =====================================================
  // FILTROS
  // =====================================================

  const allFilters = [

    {
      value:
        'all' as ProductFilter,

      label:
        'Todos',

      icon:
        Users,
    },

    {
      value:
        'workshop_lite' as ProductFilter,

      label:
        'Workshop Lite',

      icon:
        GraduationCap,
    },

    {
      value:
        'workshop_high_ticket' as ProductFilter,

      label:
        'Workshop High Ticket',

      icon:
        GraduationCap,
    },

    {
      value:
        'empresarial' as ProductFilter,

      label:
        'Empresarial',

      icon:
        Building2,
    },

    {
      value:
        'costa_rica' as ProductFilter,

      label:
        'Costa Rica',

      icon:
        Globe2,
    },

  ]


  // =====================================================
  // FILTROS VISIBLES
  // =====================================================

  const filters =
    useMemo(
      () => {

        // ADMIN
        if (
          allowedProducts.includes(
            'all'
          )
        ) {

          return allFilters

        }


        return allFilters.filter(
          filter =>
            allowedProducts.includes(
              filter.value
            )
        )

      },
      [
        allowedProducts,
      ]
    )


  // =====================================================
  // PRODUCTO ACTUAL
  // =====================================================

  const currentProduct =
    filters.some(
      filter =>
        filter.value ===
        initialProduct
    )
      ? initialProduct
      : (
          filters[0]?.value ||
          'all'
        )


  // =====================================================
  // LOADING
  // =====================================================

  if (
    loadingProfile
  ) {

    return (
      <div className="
        p-6
      ">

        <div className="
          bg-surface
          border
          border-border-color
          rounded-xl
          p-8
          text-center
          text-foreground/60
        ">

          Cargando ventas...

        </div>

      </div>
    )
  }


  // =====================================================
  // SIN PERMISOS
  // =====================================================

  if (
    allowedProducts.length === 0
  ) {

    return (
      <div className="
        p-6
      ">

        <div className="
          bg-surface
          border
          border-border-color
          rounded-xl
          p-10
          text-center
        ">

          <div className="
            text-4xl
            mb-4
          ">
            🔒
          </div>

          <h2 className="
            text-xl
            font-bold
            text-foreground
          ">
            Sin acceso
          </h2>

          <p className="
            mt-2
            text-sm
            text-foreground/60
          ">
            Este usuario no tiene productos comerciales asignados.
          </p>

        </div>

      </div>
    )
  }


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="
      p-6
      space-y-6
    ">


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
            Gestión y seguimiento de leads comerciales
          </p>

        </div>


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

        {filters.map(
          filter => {

            const Icon =
              filter.icon


            const active =
              currentProduct ===
              filter.value


            return (

              <Link
                key={
                  filter.value
                }

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

                {filter.label}

              </Link>

            )

          }
        )}

      </div>


      {/* =================================================
          TABLA
      ================================================= */}

      <LeadsTable
        product={
          currentProduct
        }
      />

    </div>
  )
}