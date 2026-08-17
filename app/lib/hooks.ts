'use client'

import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  createClient,
} from '@/lib/supabase/client'

import type {
  Lead,
  Interaction,
  ProductFilter,
  ProductType,
} from '@/lib/types'

import {
  useLeadStore,
} from '@/store/leadstore'


// =======================================================
// PRODUCT ACCESS
// =======================================================

export const PRODUCT_ACCESS: Record<
  string,
  ProductFilter[]
> = {

  admin: [
    'all',
    'workshop_lite',
    'workshop',
    'empresarial',
    'costa_rica',
  ],

  executor_marcos: [
    'workshop_lite',
    'workshop',
  ],

  executor_ursula: [
    'empresarial',
    'costa_rica',
  ],

  executor_chuy: [],

}


// =======================================================
// PRODUCT CONFIG
// =======================================================

export const PRODUCT_CONFIG: Record<
  ProductType,
  {
    label: string
    shortLabel: string
    price: number
    currency: 'MXN' | 'USD'
  }
> = {

  workshop_lite: {

    label:
      '🎓 Workshop Lite',

    shortLabel:
      'Workshop Lite',

    price:
      14,

    currency:
      'USD',

  },


  workshop: {

    label:
      '🎓 Workshop High Ticket',

    shortLabel:
      'Workshop High Ticket',

    price:
      10000,

    currency:
      'MXN',

  },


  empresarial: {

    label:
      '🏢 Empresarial',

    shortLabel:
      'Empresarial',

    price:
      5997,

    currency:
      'MXN',

  },


  costa_rica: {

    label:
      '🇨🇷 Costa Rica',

    shortLabel:
      'Costa Rica',

    price:
      540,

    currency:
      'USD',

  },

}


// =======================================================
// LEADS
// =======================================================

export function useLeads(
  product: ProductFilter = 'all'
) {

  const [
    leads,
    setLeads,
  ] = useState<Lead[]>([])


  const [
    loading,
    setLoading,
  ] = useState(true)


  const [
    error,
    setError,
  ] = useState<string | null>(null)


  const supabase =
    createClient()


  const {
    statusFilter,
    platformFilter,
    search,
  } = useLeadStore()


  // =====================================================
  // FETCH
  // =====================================================

  const fetchLeads =
    useCallback(
      async () => {

        setLoading(true)
        setError(null)


        let query =
          supabase

            .from('leads')

            .select(
              '*, lead_metrics(*)'
            )

            .order(
              'created_at',
              {
                ascending:
                  false,
              }
            )


        // -------------------------------------------------
        // PRODUCTO
        // -------------------------------------------------

        if (
          product &&
          product !== 'all'
        ) {

          query =
            query.eq(
              'product',
              product
            )

        }


        // -------------------------------------------------
        // STATUS
        // -------------------------------------------------

        if (
          statusFilter &&
          statusFilter !== 'all'
        ) {

          query =
            query.eq(
              'lead_status',
              statusFilter
            )

        }


        // -------------------------------------------------
        // PLATAFORMA
        // -------------------------------------------------

        if (
          platformFilter &&
          platformFilter !== 'all'
        ) {

          query =
            query.eq(
              'platform',
              platformFilter
            )

        }


        // -------------------------------------------------
        // SEARCH
        // -------------------------------------------------

        if (search) {

          query =
            query.or(
              `full_name.ilike.%${search}%,phone_number.ilike.%${search}%,email.ilike.%${search}%`
            )

        }


        const {
          data,
          error:
            queryError,
        } =
          await query


        if (queryError) {

          setError(
            queryError.message
          )

          setLeads([])

        } else {

          setLeads(
            (data || []) as Lead[]
          )

        }


        setLoading(false)

      },
      [
        product,
        statusFilter,
        platformFilter,
        search,
        supabase,
      ]
    )


  // =====================================================
  // EFFECT
  // =====================================================

  useEffect(() => {

    fetchLeads()


    const channel =
      supabase

        .channel(
          `leads-${product}`
        )

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


    channel.subscribe()


    return () => {

      supabase.removeChannel(
        channel
      )

    }

  }, [
    fetchLeads,
    product,
    supabase,
  ])


  return {

    leads,

    loading,

    error,

    refetch:
      fetchLeads,

  }

}


// =======================================================
// LEAD INDIVIDUAL
// =======================================================

export function useLead(
  id: string
) {

  const [
    lead,
    setLead,
  ] = useState<Lead | null>(
    null
  )


  const [
    interactions,
    setInteractions,
  ] = useState<Interaction[]>(
    []
  )


  const [
    loading,
    setLoading,
  ] = useState(true)


  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  )


  const supabase =
    createClient()


  // =====================================================
  // FETCH LEAD
  // =====================================================

  const fetchLead =
    useCallback(
      async () => {

        if (!id) {

          setError(
            'ID de lead inválido.'
          )

          setLoading(false)

          return

        }


        setLoading(true)
        setError(null)


        // =================================================
        // LEAD
        // =================================================

        const {
          data:
            leadData,
          error:
            leadError,
        } =
          await supabase

            .from('leads')

            .select(
              '*, lead_metrics(*)'
            )

            .eq(
              'id',
              id
            )

            .single()


        // =================================================
        // INTERACCIONES
        // =================================================

        const {
          data:
            interactionsData,
          error:
            interactionsError,
        } =
          await supabase

            .from('interactions')

            .select('*')

            .eq(
              'lead_id',
              id
            )

            .order(
              'created_at',
              {
                ascending:
                  false,
              }
            )


        // =================================================
        // ERROR LEAD
        // =================================================

        if (leadError) {

          setLead(null)

          setError(
            leadError.message
          )

          setLoading(false)

          return

        }


        // =================================================
        // ERROR INTERACTIONS
        // =================================================

        if (
          interactionsError
        ) {

          setError(
            interactionsError.message
          )

        }


        // =================================================
        // DATA
        // =================================================

        setLead(
          leadData as Lead
        )


        setInteractions(
          (interactionsData || []) as Interaction[]
        )


        setLoading(false)

      },
      [
        id,
        supabase,
      ]
    )


  // =====================================================
  // INITIAL FETCH
  // =====================================================

  useEffect(() => {

    fetchLead()

  }, [
    fetchLead,
  ])


  return {

    lead,

    interactions,

    loading,

    error,

    refetch:
      fetchLead,

  }

}