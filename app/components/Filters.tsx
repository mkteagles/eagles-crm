'use client'

import { useLeadStore } from '@/store/leadstore'
import { Search } from 'lucide-react'

const statuses = [
  { value: 'all', label: 'Todos' },
  { value: 'new', label: 'Nuevo' },
  { value: 'contacted', label: 'Contactado' },
  { value: 'interested', label: 'Interesado' },
  { value: 'qualified', label: 'Calificado' },
  { value: 'lost', label: 'Perdido' },
]

const platforms = [
  { value: 'all', label: 'Todas' },
  { value: 'fb', label: 'Facebook' },
  { value: 'ig', label: 'Instagram' },
]

export function Filters() {
  const {
    statusFilter,
    platformFilter,
    search,
    setStatusFilter,
    setPlatformFilter,
    setSearch,
    resetFilters,
  } = useLeadStore()

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4 bg-surface border border-border-color p-3 rounded-lg">
      <div className="relative flex-1 min-w-[200px]">
        <Search size={16} className="absolute left-2.5 top-2.5 text-foreground/40" />
        <input
          type="text"
          placeholder="Buscar por nombre, teléfono o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-2 rounded-md text-sm bg-background border border-border-color focus:border-brand-blue outline-none"
        />
      </div>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value as never)}
        className="rounded-md px-2 py-2 text-sm bg-background border border-border-color"
      >
        {statuses.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <select
        value={platformFilter}
        onChange={(e) => setPlatformFilter(e.target.value as never)}
        className="rounded-md px-2 py-2 text-sm bg-background border border-border-color"
      >
        {platforms.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      <button
        onClick={resetFilters}
        className="text-sm text-brand-blue hover:underline"
      >
        Limpiar
      </button>
    </div>
  )
}