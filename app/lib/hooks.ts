'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Lead, Interaction } from '@/lib/types'
import { useLeadStore } from '@/store/leadstore'

export type ProductFilter =
  | 'all'
  | 'workshop'
  | 'empresarial'
  | 'costa_rica'

/**
 * Trae los leads desde Supabase.
 *
 * Filtros:
 * - status
 * - platform
 * - búsqueda
 * - product
 *
 * También escucha cambios en tiempo real.
 */
export function useLeads(product: ProductFilter = 'all') {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const {
    statusFilter,
    platformFilter,
    search,
  } = useLeadStore()

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    setError(null)

    let query = supabase
      .from('leads')
      .select('*, lead_metrics(*)')
      .order('created_at', { ascending: false })

    // FILTRO POR PRODUCTO
    if (product && product !== 'all') {
      query = query.eq('product', product)
    }

    // FILTRO POR ESTADO
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('lead_status', statusFilter)
    }

    // FILTRO POR PLATAFORMA
    if (platformFilter && platformFilter !== 'all') {
      query = query.eq('platform', platformFilter)
    }

    // BÚSQUEDA
    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,phone_number.ilike.%${search}%,email.ilike.%${search}%`
      )
    }

    const {
      data,
      error,
    } = await query

    if (error) {
      setError(error.message)
      setLeads([])
    } else {
      setLeads((data || []) as Lead[])
      setError(null)
    }

    setLoading(false)
  }, [
    supabase,
    product,
    statusFilter,
    platformFilter,
    search,
  ])

  useEffect(() => {
    fetchLeads()

    // REALTIME
    const channel = supabase
      .channel(`leads-changes-${product}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
        },
        () => {
          fetchLeads()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchLeads, supabase, product])

  return {
    leads,
    loading,
    error,
    refetch: fetchLeads,
  }
}

/**
 * Trae un solo lead por ID junto con:
 *
 * - lead_metrics
 * - historial de interacciones
 */
export function useLead(id: string) {
  const [lead, setLead] = useState<Lead | null>(null)
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchLead = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [
      {
        data: leadData,
        error: leadError,
      },
      {
        data: interactionsData,
        error: interactionsError,
      },
    ] = await Promise.all([
      supabase
        .from('leads')
        .select('*, lead_metrics(*)')
        .eq('id', id)
        .single(),

      supabase
        .from('interactions')
        .select('*')
        .eq('lead_id', id)
        .order('created_at', {
          ascending: false,
        }),
    ])

    if (leadError) {
      setError(leadError.message)
      setLead(null)
    } else {
      setLead(leadData as Lead)
    }

    if (interactionsError) {
      console.error(
        'Error cargando interacciones:',
        interactionsError
      )
      setInteractions([])
    } else {
      setInteractions(
        (interactionsData || []) as Interaction[]
      )
    }

    setLoading(false)
  }, [id, supabase])

  useEffect(() => {
    fetchLead()
  }, [fetchLead])

  return {
    lead,
    interactions,
    loading,
    error,
    refetch: fetchLead,
  }
}