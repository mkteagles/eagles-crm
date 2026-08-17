'use client'

import { use } from 'react'
import { useLead } from '@/lib/hooks'
import { LeadDetail } from '@/components/LeadDetail'

export default function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {

  const { id } = use(params)

  const {
    lead,
    interactions,
    loading,
    error,
  } = useLead(id)

  if (loading) {
    return (
      <div className="p-4">
        Cargando...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error: {error}
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="p-4">
        Lead no encontrado
      </div>
    )
  }

  return (
    <LeadDetail
      lead={lead}
      interactions={interactions}
    />
  )
}