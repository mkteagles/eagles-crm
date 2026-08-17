'use client'

import {
  useMemo,
} from 'react'

import {
  Users,
  UserPlus,
  UserCheck,
  ShoppingCart,
  Flame,
  Target,
  TrendingUp,
  DollarSign,
} from 'lucide-react'

import {
  useLeads,
} from '@/lib/hooks'


// =======================================================
// TIPOS AUXILIARES
// =======================================================

interface LeadMetricsLike {
  engagement_level?: string | null
}


// =======================================================
// COMPONENTE CARD
// =======================================================

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ReactNode
  iconClassName: string
  iconBgClassName: string
}

function MetricCard({
  title,
  value,
  description,
  icon,
  iconClassName,
  iconBgClassName,
}: MetricCardProps) {

  return (

    <div
      className="
        relative
        overflow-hidden
        rounded-2xl
        border
        border-border-color
        bg-surface
        p-5
        shadow-sm
        transition
        hover:shadow-md
        hover:-translate-y-[1px]
      "
    >

      {/* DECORACIÓN */}

      <div
        className="
          absolute
          -right-8
          -top-8
          h-24
          w-24
          rounded-full
          bg-foreground/[0.025]
        "
      />


      {/* HEADER */}

      <div
        className="
          flex
          items-start
          justify-between
          gap-4
        "
      >

        <div>

          <p
            className="
              text-sm
              font-medium
              text-foreground/60
            "
          >
            {title}
          </p>


          <p
            className="
              mt-2
              text-3xl
              font-bold
              tracking-tight
              text-foreground
            "
          >
            {value}
          </p>

        </div>


        {/* ICON */}

        <div
          className={`
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-xl
            ${iconBgClassName}
            ${iconClassName}
          `}
        >
          {icon}
        </div>

      </div>


      {/* DESCRIPTION */}

      {description && (

        <p
          className="
            mt-4
            text-xs
            text-foreground/45
          "
        >
          {description}
        </p>

      )}

    </div>
  )
}


// =======================================================
// ENGAGEMENT
// =======================================================

function getEngagementLevel(
  lead: any
): string {

  const metrics =
    lead?.lead_metrics


  if (!metrics) {
    return 'low'
  }


  // Supabase puede devolver relación como ARRAY

  if (
    Array.isArray(metrics)
  ) {

    return (
      metrics[0]?.engagement_level ||
      'low'
    )
  }


  // Supabase puede devolver relación como OBJETO

  return (
    metrics?.engagement_level ||
    'low'
  )
}


// =======================================================
// FORMATO PORCENTAJE
// =======================================================

function formatPercentage(
  value: number
): string {

  if (
    !Number.isFinite(value)
  ) {

    return '0%'
  }

  return `${Math.round(value)}%`
}


// =======================================================
// ANALYTICS
// =======================================================

export default function Analytics() {

  const {
    leads = [],
    loading,
    error,
  } = useLeads()


  // =====================================================
  // ESTADÍSTICAS
  // =====================================================

  const stats =
    useMemo(() => {

      const total =
        leads.length


      const newLeads =
        leads.filter(
          lead =>
            lead.lead_status ===
            'new'
        ).length


      const qualified =
        leads.filter(
          lead =>
            lead.lead_status ===
            'qualified'
        ).length


      const converted =
        leads.filter(
          lead =>
            Boolean(
              lead.has_purchased
            )
        ).length


      const hot =
        leads.filter(
          lead =>
            getEngagementLevel(
              lead
            ) === 'hot'
        ).length


      const warm =
        leads.filter(
          lead =>
            getEngagementLevel(
              lead
            ) === 'warm'
        ).length


      const cold =
        leads.filter(
          lead =>
            getEngagementLevel(
              lead
            ) === 'low' ||
            getEngagementLevel(
              lead
            ) === 'cold'
        ).length


      const totalScore =
        leads.reduce(
          (
            sum,
            lead
          ) => {

            return (
              sum +
              Number(
                lead.score ?? 0
              )
            )

          },
          0
        )


      const avgScore =
        total === 0
          ? 0
          : Math.round(
              totalScore /
              total
            )


      const conversionRate =
        total === 0
          ? 0
          : (
              converted /
              total
            ) *
            100


      const qualificationRate =
        total === 0
          ? 0
          : (
              qualified /
              total
            ) *
            100


      return {

        total,

        newLeads,

        qualified,

        converted,

        hot,

        warm,

        cold,

        avgScore,

        conversionRate,

        qualificationRate,

      }

    }, [leads])


  // =====================================================
  // CARGANDO
  // =====================================================

  if (loading) {

    return (

      <div
        className="
          min-h-screen
          bg-background
          p-6
        "
      >

        <div
          className="
            mx-auto
            max-w-7xl
          "
        >

          <div
            className="
              animate-pulse
              space-y-6
            "
          >

            <div
              className="
                h-10
                w-72
                rounded-lg
                bg-foreground/10
              "
            />

            <div
              className="
                grid
                grid-cols-1
                gap-4
                md:grid-cols-2
                xl:grid-cols-4
              "
            >

              {Array.from({
                length: 8,
              }).map(
                (_, index) => (

                  <div
                    key={index}
                    className="
                      h-32
                      rounded-2xl
                      bg-foreground/5
                    "
                  />

                )
              )}

            </div>

          </div>

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
          min-h-screen
          bg-background
          p-6
        "
      >

        <div
          className="
            mx-auto
            max-w-7xl
          "
        >

          <div
            className="
              rounded-2xl
              border
              border-red-500/20
              bg-red-500/10
              p-6
              text-red-600
              dark:text-red-400
            "
          >

            <div
              className="
                flex
                items-center
                gap-3
              "
            >

              <Target
                size={20}
              />

              <p
                className="
                  font-semibold
                "
              >
                Error cargando Analytics
              </p>

            </div>


            <p
              className="
                mt-2
                text-sm
                opacity-80
              "
            >
              {error}
            </p>

          </div>

        </div>

      </div>

    )
  }


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <main
      className="
        min-h-screen
        bg-background
        p-4
        sm:p-6
      "
    >

      <div
        className="
          mx-auto
          max-w-7xl
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
            gap-4
            sm:flex-row
            sm:items-end
            sm:justify-between
          "
        >

          <div>

            <div
              className="
                flex
                items-center
                gap-3
              "
            >

              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-brand-blue/10
                  text-brand-blue
                "
              >

                <TrendingUp
                  size={22}
                />

              </div>


              <div>

                <h1
                  className="
                    text-2xl
                    font-bold
                    tracking-tight
                    text-foreground
                    sm:text-3xl
                  "
                >
                  Analytics
                </h1>

                <p
                  className="
                    mt-1
                    text-sm
                    text-foreground/55
                  "
                >
                  Rendimiento y comportamiento de tus leads
                </p>

              </div>

            </div>

          </div>


          {/* TOTAL */}

          <div
            className="
              inline-flex
              w-fit
              items-center
              gap-2
              rounded-full
              border
              border-border-color
              bg-surface
              px-3
              py-1.5
              text-xs
              font-medium
              text-foreground/60
            "
          >

            <Users
              size={14}
            />

            {stats.total} leads registrados

          </div>

        </div>


        {/* =================================================
            CARDS PRINCIPALES
        ================================================= */}

        <div
          className="
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-2
            xl:grid-cols-4
          "
        >

          <MetricCard
            title="Leads totales"
            value={stats.total}
            description="Total de registros comerciales"
            icon={
              <Users
                size={20}
              />
            }
            iconClassName="
              text-blue-600
              dark:text-blue-400
            "
            iconBgClassName="
              bg-blue-500/10
            "
          />


          <MetricCard
            title="Nuevos"
            value={stats.newLeads}
            description="Leads recién registrados"
            icon={
              <UserPlus
                size={20}
              />
            }
            iconClassName="
              text-slate-600
              dark:text-slate-300
            "
            iconBgClassName="
              bg-slate-500/10
            "
          />


          <MetricCard
            title="Calificados"
            value={stats.qualified}
            description={`${formatPercentage(stats.qualificationRate)} del total`}
            icon={
              <UserCheck
                size={20}
              />
            }
            iconClassName="
              text-emerald-600
              dark:text-emerald-400
            "
            iconBgClassName="
              bg-emerald-500/10
            "
          />


          <MetricCard
            title="Convertidos"
            value={stats.converted}
            description={`${formatPercentage(stats.conversionRate)} de conversión`}
            icon={
              <ShoppingCart
                size={20}
              />
            }
            iconClassName="
              text-green-600
              dark:text-green-400
            "
            iconBgClassName="
              bg-green-500/10
            "
          />

        </div>


        {/* =================================================
            SEGUNDA FILA
        ================================================= */}

        <div
          className="
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-2
            xl:grid-cols-4
          "
        >

          <MetricCard
            title="Hot Leads"
            value={stats.hot}
            description="Alta intención de compra"
            icon={
              <Flame
                size={20}
              />
            }
            iconClassName="
              text-red-600
              dark:text-red-400
            "
            iconBgClassName="
              bg-red-500/10
            "
          />


          <MetricCard
            title="Warm Leads"
            value={stats.warm}
            description="Interés medio"
            icon={
              <Target
                size={20}
              />
            }
            iconClassName="
              text-orange-600
              dark:text-orange-400
            "
            iconBgClassName="
              bg-orange-500/10
            "
          />


          <MetricCard
            title="Cold Leads"
            value={stats.cold}
            description="Baja interacción"
            icon={
              <Users
                size={20}
              />
            }
            iconClassName="
              text-slate-500
              dark:text-slate-400
            "
            iconBgClassName="
              bg-slate-500/10
            "
          />


          <MetricCard
            title="Score promedio"
            value={`${stats.avgScore}/100`}
            description="Puntuación promedio del pipeline"
            icon={
              <DollarSign
                size={20}
              />
            }
            iconClassName="
              text-amber-600
              dark:text-amber-400
            "
            iconBgClassName="
              bg-amber-500/10
            "
          />

        </div>


        {/* =================================================
            RESUMEN DE ENGAGEMENT
        ================================================= */}

        <section
          className="
            overflow-hidden
            rounded-2xl
            border
            border-border-color
            bg-surface
            shadow-sm
          "
        >

          <div
            className="
              border-b
              border-border-color
              px-5
              py-4
            "
          >

            <div>

              <h2
                className="
                  font-semibold
                  text-foreground
                "
              >
                Nivel de engagement
              </h2>

              <p
                className="
                  mt-1
                  text-xs
                  text-foreground/50
                "
              >
                Distribución actual de tus leads
              </p>

            </div>

          </div>


          <div
            className="
              grid
              grid-cols-1
              divide-y
              divide-border-color
              sm:grid-cols-3
              sm:divide-x
              sm:divide-y-0
            "
          >

            {/* HOT */}

            <div
              className="
                p-5
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >

                <span
                  className="
                    text-sm
                    font-medium
                    text-foreground/60
                  "
                >
                  Hot
                </span>

                <Flame
                  size={17}
                  className="
                    text-red-500
                  "
                />

              </div>


              <div
                className="
                  mt-3
                  flex
                  items-end
                  justify-between
                  gap-4
                "
              >

                <span
                  className="
                    text-2xl
                    font-bold
                    text-foreground
                  "
                >
                  {stats.hot}
                </span>

                <span
                  className="
                    text-xs
                    text-foreground/45
                  "
                >
                  {formatPercentage(
                    stats.total
                      ? (
                          stats.hot /
                          stats.total
                        ) *
                        100
                      : 0
                  )}
                </span>

              </div>


              <div
                className="
                  mt-3
                  h-1.5
                  overflow-hidden
                  rounded-full
                  bg-foreground/10
                "
              >

                <div
                  className="
                    h-full
                    rounded-full
                    bg-red-500
                  "
                  style={{
                    width:
                      `${stats.total ? Math.min((stats.hot / stats.total) * 100, 100) : 0}%`,
                  }}
                />

              </div>

            </div>


            {/* WARM */}

            <div
              className="
                p-5
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >

                <span
                  className="
                    text-sm
                    font-medium
                    text-foreground/60
                  "
                >
                  Warm
                </span>

                <Target
                  size={17}
                  className="
                    text-orange-500
                  "
                />

              </div>


              <div
                className="
                  mt-3
                  flex
                  items-end
                  justify-between
                  gap-4
                "
              >

                <span
                  className="
                    text-2xl
                    font-bold
                    text-foreground
                  "
                >
                  {stats.warm}
                </span>

                <span
                  className="
                    text-xs
                    text-foreground/45
                  "
                >
                  {formatPercentage(
                    stats.total
                      ? (
                          stats.warm /
                          stats.total
                        ) *
                        100
                      : 0
                  )}
                </span>

              </div>


              <div
                className="
                  mt-3
                  h-1.5
                  overflow-hidden
                  rounded-full
                  bg-foreground/10
                "
              >

                <div
                  className="
                    h-full
                    rounded-full
                    bg-orange-500
                  "
                  style={{
                    width:
                      `${stats.total ? Math.min((stats.warm / stats.total) * 100, 100) : 0}%`,
                  }}
                />

              </div>

            </div>


            {/* COLD */}

            <div
              className="
                p-5
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >

                <span
                  className="
                    text-sm
                    font-medium
                    text-foreground/60
                  "
                >
                  Cold
                </span>

                <Users
                  size={17}
                  className="
                    text-slate-500
                  "
                />

              </div>


              <div
                className="
                  mt-3
                  flex
                  items-end
                  justify-between
                  gap-4
                "
              >

                <span
                  className="
                    text-2xl
                    font-bold
                    text-foreground
                  "
                >
                  {stats.cold}
                </span>

                <span
                  className="
                    text-xs
                    text-foreground/45
                  "
                >
                  {formatPercentage(
                    stats.total
                      ? (
                          stats.cold /
                          stats.total
                        ) *
                        100
                      : 0
                  )}
                </span>

              </div>


              <div
                className="
                  mt-3
                  h-1.5
                  overflow-hidden
                  rounded-full
                  bg-foreground/10
                "
              >

                <div
                  className="
                    h-full
                    rounded-full
                    bg-slate-500
                  "
                  style={{
                    width:
                      `${stats.total ? Math.min((stats.cold / stats.total) * 100, 100) : 0}%`,
                  }}
                />

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            RESUMEN
        ================================================= */}

        <section
          className="
            rounded-2xl
            border
            border-border-color
            bg-surface
            p-5
            shadow-sm
          "
        >

          <div
            className="
              flex
              flex-col
              gap-2
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >

            <div>

              <h2
                className="
                  font-semibold
                  text-foreground
                "
              >
                Resumen comercial
              </h2>

              <p
                className="
                  mt-1
                  text-xs
                  text-foreground/50
                "
              >
                Datos calculados directamente desde tus leads
              </p>

            </div>


            <div
              className="
                inline-flex
                items-center
                gap-2
                text-sm
                font-medium
                text-foreground/60
              "
            >

              <TrendingUp
                size={16}
                className="
                  text-brand-blue
                "
              />

              {formatPercentage(
                stats.conversionRate
              )}{' '}
              conversión

            </div>

          </div>

        </section>

      </div>

    </main>
  )
}