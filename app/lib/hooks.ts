'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Lead, Interaction } from '@/lib/types'
import { useLeadStore } from '@/store/leadstore'

/**
 * Trae todos los leads (con lead_metrics) respetando los filtros
 * guardados en el store de zustand, y se suscribe a cambios en
 * tiempo real vía Supabase Realtime.
 */
export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const { statusFilter, platformFilter, search } = useLeadStore()

  const fetchLeads = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('leads')
      .select('*, lead_metrics(*)')
      .order('created_at', { ascending: false })

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('lead_status', statusFilter)
    }
    if (platformFilter && platformFilter !== 'all') {
      query = query.eq('platform', platformFilter)
    }
    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,phone_number.ilike.%${search}%,email.ilike.%${search}%`
      )
    }

    const { data, error } = await query

    if (error) {
      setError(error.message)
    } else {
      setLeads(data as Lead[])
      setError(null)
    }
    setLoading(false)
  }, [supabase, statusFilter, platformFilter, search])

  useEffect(() => {
    fetchLeads()

    // Realtime: si n8n o el webhook de Hotmart insertan/actualizan un lead,
    // la tabla se refresca sola sin recargar la página.
    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        () => fetchLeads()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchLeads, supabase])

  return { leads, loading, error, refetch: fetchLeads }
}

/** Trae un solo lead por id junto con su historial de interacciones. */
export function useLead(id: string) {
  const [lead, setLead] = useState<Lead | null>(null)
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchLead = useCallback(async () => {
    setLoading(true)

    const [{ data: leadData, error: leadError }, { data: interactionsData }] =
      await Promise.all([
        supabase.from('leads').select('*, lead_metrics(*)').eq('id', id).single(),
        supabase
          .from('interactions')
          .select('*')
          .eq('lead_id', id)
          .order('created_at', { ascending: false }),
      ])

    if (leadError) {
      setError(leadError.message)
    } else {
      setLead(leadData as Lead)
      setInteractions((interactionsData || []) as Interaction[])
      setError(null)
    }
    setLoading(false)
  }, [id, supabase])

  useEffect(() => {
    fetchLead()
  }, [fetchLead])

  return { lead, interactions, loading, error, refetch: fetchLead }
}
