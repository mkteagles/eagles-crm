'use client'

import { useLeads } from '@/lib/hooks'
import { StatsCard } from '@/components/StatsCard'
// (con el alias @/* apuntando ahora a app/, estos imports ya resuelven bien)

export default function Analytics() {
  const { leads } = useLeads()

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.lead_status === 'new').length,
    qualified: leads.filter(l => l.lead_status === 'qualified').length,
    converted: leads.filter(l => l.has_purchased).length,
    avgScore: Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length) || 0,
    hot: leads.filter(l => l.lead_metrics?.engagement_level === 'hot').length
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">📊 Análisis de Leads</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatsCard title="Leads Totales" value={stats.total} color="blue" />
        <StatsCard title="Nuevos" value={stats.new} color="gray" />
        <StatsCard title="Calificados" value={stats.qualified} color="green" />
        <StatsCard title="Convertidos" value={stats.converted} color="green" icon="✓" />
        <StatsCard title="Hot Leads" value={stats.hot} color="red" icon="🔥" />
        <StatsCard title="Score Promedio" value={stats.avgScore} color="orange" />
      </div>
    </div>
  )
}