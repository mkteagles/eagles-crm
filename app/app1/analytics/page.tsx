'use client'

import { useLeads } from '@/lib/hooks'
import { StatsCard } from '@/components/StatsCard'

// =======================================================
// ANALYTICS
// =======================================================

export default function Analytics() {

  const {
    leads,
  } = useLeads()

  // =====================================================
  // HELPER - ENGAGEMENT
  // =====================================================

  function getEngagementLevel(
    lead: (typeof leads)[number]
  ): string {

    const metrics =
      lead.lead_metrics

    // No hay métricas
    if (!metrics) {
      return 'low'
    }

    // Supabase puede devolver un array
    if (Array.isArray(metrics)) {

      return (
        metrics[0]?.engagement_level ??
        'low'
      )

    }

    // Supabase puede devolver un objeto
    return (
      metrics.engagement_level ??
      'low'
    )
  }

  // =====================================================
  // ESTADÍSTICAS
  // =====================================================

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
        lead.has_purchased
    ).length

  const avgScore =
    total === 0
      ? 0
      : Math.round(
          leads.reduce(
            (
              sum,
              lead
            ) =>
              sum +
              Number(
                lead.score ?? 0
              ),
            0
          ) / total
        )

  const hot =
    leads.filter(
      lead =>
        getEngagementLevel(
          lead
        ) === 'hot'
    ).length

  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="
      p-6
      bg-gray-50
      min-h-screen
    ">

      {/* =================================================
          HEADER
      ================================================= */}

      <h1 className="
        text-3xl
        font-bold
        mb-6
      ">

        📊 Análisis de Leads

      </h1>


      {/* =================================================
          CARDS
      ================================================= */}

      <div className="
        grid
        grid-cols-1
        md:grid-cols-3
        gap-4
        mb-6
      ">

        {/* TOTAL */}

        <StatsCard
          title="Leads Totales"
          value={total}
          color="blue"
        />


        {/* NUEVOS */}

        <StatsCard
          title="Nuevos"
          value={newLeads}
          color="gray"
        />


        {/* CALIFICADOS */}

        <StatsCard
          title="Calificados"
          value={qualified}
          color="green"
        />


        {/* CONVERTIDOS */}

        <StatsCard
          title="Convertidos"
          value={converted}
          color="green"
          icon="✓"
        />


        {/* HOT */}

        <StatsCard
          title="Hot Leads"
          value={hot}
          color="red"
          icon="🔥"
        />


        {/* SCORE */}

        <StatsCard
          title="Score Promedio"
          value={avgScore}
          color="orange"
        />

      </div>

    </div>
  )
}