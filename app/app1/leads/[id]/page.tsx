'use client'

import {
  useEffect,
  useState,
} from 'react'

import {
  useLead,
} from '@/lib/hooks'

import {
  LeadDetail,
} from '@/components/LeadDetail'


// =======================================================
// PROPS
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

  // =====================================================
  // ID
  // =====================================================

  const [
    leadId,
    setLeadId,
  ] = useState<string | null>(null)


  // =====================================================
  // RESOLVER PARAMS
  // =====================================================

  useEffect(() => {

    let mounted = true

    async function resolveParams() {

      try {

        const resolved =
          await params

        if (!mounted) {
          return
        }

        setLeadId(
          resolved.id
        )

      } catch (error) {

        console.error(
          'Error obteniendo parámetros del lead:',
          error
        )

      }

    }

    resolveParams()

    return () => {

      mounted = false

    }

  }, [
    params,
  ])


  // =====================================================
  // CARGANDO ID
  // =====================================================

  if (!leadId) {

    return (

      <div className="p-6">

        <div className="
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
  // LEAD
  // =====================================================

  return (
    <LeadContent
      leadId={leadId}
    />
  )

}


// =======================================================
// CONTENIDO
// =======================================================

function LeadContent({
  leadId,
}: {
  leadId: string
}) {

  const {
    lead,
    interactions,
    loading,
    error,
  } = useLead(
    leadId
  )


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (

      <div className="p-6">

        <div className="
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
          bg-red-500/10
          border
          border-red-500/30
          text-red-500
          rounded-xl
          p-6
        ">

          <p className="font-bold">

            Error cargando el lead

          </p>

          <p className="
            text-sm
            mt-1
          ">

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
          bg-surface
          border
          border-border-color
          rounded-xl
          p-6
          text-center
        ">

          <p className="font-bold">

            Lead no encontrado

          </p>

        </div>

      </div>

    )

  }


  // =====================================================
  // DETALLE
  // =====================================================

  return (

    <LeadDetail
      lead={lead}
      interactions={interactions}
    />

  )

}