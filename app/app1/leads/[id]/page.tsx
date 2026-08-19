'use client'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Check,
  Copy,
} from 'lucide-react'

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

  const [
    leadId,
    setLeadId,
  ] = useState<string | null>(null)


  // =====================================================
  // RESOLVER ID
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

          <p
            className="
              text-foreground/60
            "
          >
            Cargando lead...
          </p>

        </div>

      </div>

    )

  }


  return (

    <LeadContent
      leadId={leadId}
    />

  )

}


// =======================================================
// LEAD CONTENT
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
  // COPIADO
  // =====================================================

  const [
    copied,
    setCopied,
  ] = useState(false)


  // =====================================================
  // MENSAJE EMPRESARIAL
  // =====================================================

  const offerMessage =
    useMemo(
      () => {

        if (
          !lead ||
          lead.product !== 'empresarial'
        ) {

          return ''

        }


        const firstName =
          lead.full_name
            ?.trim()
            .split(/\s+/)[0] ||
          'Hola'


        return (
          `Hola ${firstName} 👋 ` +
          `Te contacto de Eagles Gear Solutions por tu interés en el Curso Empresarial. ` +
          `Tenemos una oferta especial para ti: puedes entrar por $2,997 MXN en lugar de $5,997 MXN. ` +
          `Si quieres aprovecharla, respóndeme por aquí y te ayudo con tu inscripción.`
        )

      },
      [
        lead,
      ]
    )


  // =====================================================
  // COPIAR MENSAJE
  // =====================================================

  async function copyOfferMessage() {

    if (!offerMessage) {
      return
    }


    try {

      await navigator.clipboard.writeText(
        offerMessage
      )


      setCopied(true)


      window.setTimeout(
        () => {

          setCopied(false)

        },
        1500
      )

    } catch (copyError) {

      console.error(
        'Error copiando mensaje:',
        copyError
      )

    }

  }


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (

      <div className="p-6">

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

          <p
            className="
              text-foreground/60
            "
          >
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

        <div
          className="
            bg-red-500/10
            border
            border-red-500/30
            text-red-500
            rounded-xl
            p-6
          "
        >

          <p className="font-bold">
            Error cargando el lead
          </p>


          <p
            className="
              text-sm
              mt-1
            "
          >
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

        <div
          className="
            bg-surface
            border
            border-border-color
            rounded-xl
            p-6
            text-center
          "
        >

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

    <div className="space-y-4">


      {/* =================================================
          OFERTA EMPRESARIAL
      ================================================= */}

      {
        lead.product ===
          'empresarial' && (

          <div className="px-6 pt-6">

            <div
              className="
                bg-orange-500/10
                border
                border-orange-500/30
                rounded-xl
                p-5
              "
            >

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


                {/* =======================================
                    PRECIO
                ======================================= */}

                <div>

                  <span
                    className="
                      inline-flex
                      items-center
                      rounded-md
                      bg-orange-500/15
                      px-2.5
                      py-1
                      text-[11px]
                      font-bold
                      uppercase
                      tracking-wide
                      text-orange-500
                    "
                  >
                    Oferta especial Empresarial
                  </span>


                  <div
                    className="
                      mt-3
                      flex
                      items-baseline
                      gap-3
                    "
                  >

                    <span
                      className="
                        text-sm
                        text-foreground/45
                        line-through
                      "
                    >
                      $5,997
                    </span>


                    <span
                      className="
                        text-2xl
                        font-bold
                        text-foreground
                      "
                    >
                      $2,997 MXN
                    </span>

                  </div>

                </div>


                {/* =======================================
                    COPIAR
                ======================================= */}

                <button
                  type="button"
                  onClick={
                    copyOfferMessage
                  }
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded-lg
                    bg-brand-blue
                    px-4
                    py-2.5
                    text-sm
                    font-semibold
                    text-white
                    transition
                    hover:opacity-90
                  "
                >

                  {
                    copied
                      ? (
                        <Check
                          size={17}
                        />
                      )
                      : (
                        <Copy
                          size={17}
                        />
                      )
                  }


                  {
                    copied
                      ? 'Copiado'
                      : 'Copiar mensaje'
                  }

                </button>

              </div>


              {/* =========================================
                  MENSAJE
              ========================================= */}

              <div className="mt-5">

                <p
                  className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-wide
                    text-foreground/45
                  "
                >
                  Mensaje para enviar
                </p>


                <div
                  className="
                    mt-2
                    rounded-lg
                    border
                    border-border-color
                    bg-surface
                    p-4
                    text-sm
                    leading-6
                    text-foreground/80
                  "
                >
                  {offerMessage}
                </div>

              </div>

            </div>

          </div>

        )
      }


      {/* =================================================
          DETALLE NORMAL DEL LEAD
      ================================================= */}

      <LeadDetail
        lead={lead}
        interactions={
          interactions
        }
      />

    </div>

  )

}