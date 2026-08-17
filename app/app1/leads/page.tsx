'use client'

import Link from 'next/link'

import {
  useSearchParams,
} from 'next/navigation'

import {
  Plus,
  Users,
  GraduationCap,
  Building2,
  Globe2,
} from 'lucide-react'

import {
  useEffect,
  useState,
} from 'react'

import {
  createClient,
} from '@/lib/supabase/client'

import {
  LeadsTable,
} from '@/components/LeadsTable'

import type {
  ProductFilter,
} from '@/lib/types'

import {
  PRODUCT_ACCESS,
} from '@/lib/hooks'


// =======================================================
// COMPONENTE
// =======================================================

export default function LeadsPage() {

  const searchParams =
    useSearchParams()


  // =====================================================
  // SUPABASE
  // =====================================================

  const supabase =
    createClient()


  // =====================================================
  // USUARIO
  // =====================================================

  const [
    userEmail,
    setUserEmail,
  ] = useState<string | null>(
    null
  )


  const [
    userName,
    setUserName,
  ] = useState<string | null>(
    null
  )


  const [
    role,
    setRole,
  ] = useState<string | null>(
    null
  )


  // =====================================================
  // CARGAR PERFIL
  // =====================================================

  useEffect(() => {

    let active = true


    async function loadProfile() {

      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser()


      if (!user || !active) {

        return

      }


      setUserEmail(
        user.email?.toLowerCase() ||
        null
      )


      const {
        data: profile,
      } =
        await supabase
          .from(
            'user_profiles'
          )
          .select(
            'full_name, role'
          )
          .eq(
            'id',
            user.id
          )
          .maybeSingle()


      if (!active) return


      setUserName(
        profile?.full_name
          ?.toLowerCase() ||
        null
      )


      setRole(
        profile?.role ||
        null
      )

    }


    loadProfile()


    return () => {

      active = false

    }

  }, [])


  // =====================================================
  // NORMALIZAR USUARIO
  // =====================================================

  const normalizedName =
    userName
      ?.trim()
      .toLowerCase() ||
    ''


  const normalizedEmail =
    userEmail
      ?.trim()
      .toLowerCase() ||
    ''


  const isMarcos =
    normalizedName.includes(
      'marcos'
    ) ||
    normalizedEmail ===
      'marcosc@eagles.com'


  const isUrsula =
    normalizedName.includes(
      'ursula'
    ) ||
    normalizedName.includes(
      'úrsula'
    ) ||
    normalizedEmail ===
      'ursula@eagles.com'


  // =====================================================
  // PRODUCTOS PERMITIDOS
  // =====================================================

  let allowedProducts:
    ProductFilter[] = []


  if (
    role === 'admin'
  ) {

    allowedProducts =
      PRODUCT_ACCESS.admin ||
      []

  }

  else if (
    role === 'executor' &&
    isMarcos
  ) {

    allowedProducts =
      PRODUCT_ACCESS.executor_marcos ||
      []

  }

  else if (
    role === 'executor' &&
    isUrsula
  ) {

    allowedProducts =
      PRODUCT_ACCESS.executor_ursula ||
      []

  }


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
  // FILTRAR
  // =====================================================

  const filters =
    allFilters.filter(
      (
        filter
      ) => {

        // -----------------------------------------------
        // ADMIN / ALL
        // -----------------------------------------------

        if (
          allowedProducts.includes(
            'all'
          )
        ) {

          return true

        }


        // -----------------------------------------------
        // PRODUCTO
        // -----------------------------------------------

        return allowedProducts.includes(
          filter.value
        )

      }
    )


  // =====================================================
  // PRODUCTO SOLICITADO
  // =====================================================

  const requestedProduct =
    searchParams.get(
      'product'
    ) as ProductFilter | null


  // =====================================================
  // PRODUCTO ACTUAL
  // =====================================================

  const product:
    ProductFilter =

    requestedProduct &&
    filters.some(
      (
        filter
      ) =>
        filter.value ===
        requestedProduct
    )

      ? requestedProduct

      : (
          filters[0]?.value ||
          'all'
        )


  // =====================================================
  // CARGANDO PERMISOS
  // =====================================================

  if (
    role === null
  ) {

    return (

      <div
        className="
          p-6
        "
      >

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

            Cargando ventas...

          </div>

        </div>

      </div>

    )

  }


  // =====================================================
  // SIN PERMISOS
  // =====================================================

  if (
    filters.length === 0
  ) {

    return (

      <div
        className="
          p-6
        "
      >

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

          <div className="text-4xl mb-3">
            🔒
          </div>


          <h1
            className="
              text-xl
              font-bold
            "
          >

            Sin productos asignados

          </h1>


          <p
            className="
              text-sm
              text-foreground/60
              mt-2
            "
          >

            Tu usuario todavía no tiene productos
            asignados para visualizar.

          </p>

        </div>

      </div>

    )

  }


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div
      className="
        p-6
        space-y-6
      "
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <div
        className="
          flex
          flex-col
          md:flex-row
          md:items-center
          md:justify-between
          gap-4
        "
      >

        <div>

          <h1
            className="
              text-2xl
              font-bold
              text-foreground
            "
          >

            Ventas

          </h1>


          <p
            className="
              text-sm
              text-foreground/60
              mt-1
            "
          >

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

          <Plus
            size={18}
          />

          Nuevo lead

        </Link>

      </div>


      {/* =================================================
          FILTROS
      ================================================= */}

      <div
        className="
          flex
          flex-wrap
          gap-2
        "
      >

        {filters.map(
          (
            filter
          ) => {

            const Icon =
              filter.icon


            const active =
              product ===
              filter.value


            return (

              <Link
                key={
                  filter.value
                }
                href={
                  filter.value ===
                  'all'

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

                <Icon
                  size={16}
                />

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
          product
        }
      />

    </div>

  )

}