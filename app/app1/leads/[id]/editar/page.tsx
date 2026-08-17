'use client'

import { use } from 'react'

import { useLead } from '@/lib/hooks'

import { LeadDetail } from '@/components/LeadDetail'


// =======================================================
// TIPOS
// =======================================================

interface LeadDetailPageProps {
  params: Promise<{
    id: string
  }>
}


// =======================================================
// PAGE
// =======================================================

export default function LeadDetailPage({
  params,
}: LeadDetailPageProps) {

  const {
    id,
  } = use(params)


  // =====================================================
  // OBTENER LEAD
  // =====================================================

  const {
    lead,
    interactions,
    loading,
    error,
    refetch,
  } = useLead(id)


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (

      <div className="p-6">

        <div className="
          max-w-3xl
          mx-auto
          bg-surface
          border
          border-border-color
          rounded-xl
          p-8
          text-center
        ">

          <p className="
            text-foreground/60
          ">

            Cargando lead...

          </p>

        </div>

      </div>

    )

  }


  // =====================================================
  // ERROR
  // =====================================================

  if (error) {

    return (

      <div className="p-6">

        <div className="
          max-w-3xl
          mx-auto
          bg-red-500/10
          border
          border-red-500/30
          text-red-500
          rounded-xl
          p-6
        ">

          <h2 className="
            font-bold
            text-lg
            mb-2
          ">

            Error cargando el lead

          </h2>

          <p className="text-sm">

            {error}

          </p>

        </div>

      </div>

    )

  }


  // =====================================================
  // NO EXISTE
  // =====================================================

  if (!lead) {

    return (

      <div className="p-6">

        <div className="
          max-w-3xl
          mx-auto
          bg-surface
          border
          border-border-color
          rounded-xl
          p-8
          text-center
        ">

          <h2 className="
            font-bold
            text-xl
          ">

            Lead no encontrado

          </h2>

          <p className="
            text-sm
            text-foreground/50
            mt-2
          ">

            El lead que intentas consultar no existe.

          </p>

        </div>

      </div>

    )

  }


  // =====================================================
  // DETAIL
  // =====================================================

  return (

    <LeadDetail
      lead={lead}
      interactions={interactions}
      onSaved={refetch}
    />

  )

}