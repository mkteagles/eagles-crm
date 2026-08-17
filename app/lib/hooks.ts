'use client'

import {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react'

import { createClient } from '@/lib/supabase/client'

import {
  Lead,
  Interaction,
  ProductFilter,
} from '@/lib/types'

import { useLeadStore } from '@/store/leadstore'

/* =========================================================
   PRODUCT ACCESS
========================================================= */

export const PRODUCT_ACCESS: Record<
  string,
  ProductFilter[]
> = {
  admin: [
    'all',
    'workshop',
    'empresarial',
    'costa_rica',
  ],

  executor_marcos: [
    'workshop',
  ],

  executor_ursula: [
    'empresarial',
    'costa_rica',
  ],

  executor_chuy: [],
}

/* =========================================================
   PRODUCT CONFIG
========================================================= */

export const PRODUCT_CONFIG = {
  costa_rica: {
    label: '🇨🇷 Costa Rica',
    price: 540,
    currency: 'USD' as const,
  },

  empresarial: {
    label: '🏢 Empresarial',
    price: 5997,
    currency: 'MXN' as const,
  },

  workshop: {
    label: '🎓 Workshop',
    price: 10000,
    currency: 'MXN' as const,
  },
}

/* =========================================================
   LEADS
========================================================= */

export function useLeads(
  product: ProductFilter = 'all'
) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // =====================================================
  // SUPABASE
  // =====================================================

  const supabase = useMemo(
    () => createClient(),
    []
  )

  // =====================================================
  // FILTROS
  // =====================================================

  const {
    statusFilter,
    platformFilter,
    search,
  } = useLeadStore()

  // =====================================================
  // FETCH LEADS
  // =====================================================

  const fetchLeads = useCallback(
    async () => {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('leads')
        .select('*, lead_metrics(*)')
        .order('created_at', {
          ascending: false,
        })

      // =================================================
      // PRODUCTO
      // =================================================

      if (
        product &&
        product !== 'all'
      ) {
        query = query.eq(
          'product',
          product
        )
      }

      // =================================================
      // ESTADO
      // =================================================

      if (
        statusFilter &&
        statusFilter !== 'all'
      ) {
        query = query.eq(
          'lead_status',
          statusFilter
        )
      }

      // =================================================
      // PLATAFORMA
      // =================================================

      if (
        platformFilter &&
        platformFilter !== 'all'
      ) {
        query = query.eq(
          'platform',
          platformFilter
        )
      }

      // =================================================
      // BUSCADOR
      // =================================================

      if (search) {
        query = query.or(
          `full_name.ilike.%${search}%,phone_number.ilike.%${search}%,email.ilike.%${search}%`
        )
      }

      const {
        data,
        error: queryError,
      } = await query

      if (queryError) {
        setError(queryError.message)
        setLeads([])
      } else {
        setLeads(
          (data || []) as Lead[]
        )
      }

      setLoading(false)
    },
    [
      supabase,
      product,
      statusFilter,
      platformFilter,
      search,
    ]
  )

  // =====================================================
  // FETCH + REALTIME
  // =====================================================

  useEffect(() => {
    let active = true

    // Cargar inicialmente
    fetchLeads()

    // ===================================================
    // CANAL ÚNICO
    // ===================================================

    const channelName =
      `leads-${product}-${Date.now()}`

    const channel =
      supabase.channel(channelName)

    // ===================================================
    // AGREGAR CALLBACK ANTES DE SUBSCRIBE
    // ===================================================

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'leads',
      },
      () => {
        if (active) {
          fetchLeads()
        }
      }
    )

    // ===================================================
    // SUBSCRIBE
    // ===================================================

    channel.subscribe()

    // ===================================================
    // CLEANUP
    // ===================================================

    return () => {
      active = false

      supabase.removeChannel(
        channel
      )
    }
  }, [
    supabase,
    product,
    fetchLeads,
  ])

  return {
    leads,
    loading,
    error,
    refetch: fetchLeads,
  }
}

/* =========================================================
   LEAD INDIVIDUAL
========================================================= */

export function useLead(id: string) {
  const [lead, setLead] =
    useState<Lead | null>(null)

  const [interactions, setInteractions] =
    useState<Interaction[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  const supabase = useMemo(
    () => createClient(),
    []
  )

  const fetchLead =
    useCallback(
      async () => {
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
            .select(
              '*, lead_metrics(*)'
            )
            .eq('id', id)
            .single(),

          supabase
            .from('interactions')
            .select('*')
            .eq(
              'lead_id',
              id
            )
            .order(
              'created_at',
              {
                ascending: false,
              }
            ),
        ])

        if (leadError) {
          setError(
            leadError.message
          )

          setLead(null)
        } else {
          setLead(
            leadData as Lead
          )

          setInteractions(
            (interactionsData || []) as Interaction[]
          )
        }

        if (interactionsError) {
          console.error(
            'Error cargando interacciones:',
            interactionsError
          )
        }

        setLoading(false)
      },
      [
        id,
        supabase,
      ]
    )

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