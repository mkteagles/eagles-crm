'use client'

import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  createClient,
} from '@/lib/supabase/client'

// =========================================================
// TIPOS
// =========================================================

export type ActivityIdeaStatus =
  | 'pending'
  | 'approved'
  | 'rejected'

export type ActivityIdeaPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent'

export interface ActivityIdea {
  id: string

  title: string

  description: string | null

  created_by: string

  status: ActivityIdeaStatus

  assigned_to: string | null

  due_date: string | null

  due_time: string | null

  priority: ActivityIdeaPriority

  reviewed_by: string | null

  reviewed_at: string | null

  rejection_reason: string | null

  created_at: string

  updated_at: string

  creator?: {
    full_name: string
  } | null

  assignee?: {
    full_name: string
  } | null
}

// =========================================================
// HOOK - CARGAR IDEAS
// =========================================================

export function useActivityIdeas(
  status?: ActivityIdeaStatus,
) {
  const [
    ideas,
    setIdeas,
  ] = useState<ActivityIdea[]>([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState<string | null>(null)

  const loadIdeas = useCallback(
    async () => {
      try {
        setLoading(true)
        setError(null)

        const supabase =
          createClient()

        let query =
          supabase
            .from('activity_ideas')
            .select(`
              *,
              creator:created_by (
                full_name
              ),
              assignee:assigned_to (
                full_name
              )
            `)
            .order(
              'created_at',
              {
                ascending: false,
              },
            )

        if (status) {
          query =
            query.eq(
              'status',
              status,
            )
        }

        const {
          data,
          error,
        } = await query

        if (error) {
          throw error
        }

        setIdeas(
          (data || []) as ActivityIdea[],
        )
      } catch (err) {
        console.error(
          'Error cargando ideas:',
          err,
        )

        setError(
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar las ideas',
        )
      } finally {
        setLoading(false)
      }
    },
    [status],
  )

  useEffect(
    () => {
      loadIdeas()
    },
    [loadIdeas],
  )

  return {
    ideas,
    loading,
    error,
    refresh: loadIdeas,
  }
}

// =========================================================
// CREAR IDEA
// =========================================================

export async function createActivityIdea(
  data: {
    title: string
    description?: string
    assigned_to?: string | null
    due_date?: string | null
    due_time?: string | null
    priority: ActivityIdeaPriority
  },
) {
  const supabase =
    createClient()

  const {
    data: userData,
    error: userError,
  } =
    await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!userData.user) {
    throw new Error(
      'No hay un usuario autenticado',
    )
  }

  const {
    error,
  } = await supabase
    .from('activity_ideas')
    .insert({
      title:
        data.title.trim(),

      description:
        data.description?.trim() ||
        null,

      created_by:
        userData.user.id,

      assigned_to:
        data.assigned_to ||
        null,

      due_date:
        data.due_date ||
        null,

      due_time:
        data.due_time ||
        null,

      priority:
        data.priority,

      status:
        'pending',
    })

  if (error) {
    throw error
  }
}

// =========================================================
// APROBAR IDEA
//
// Primero actualiza los datos editados en el modal.
// Después ejecuta la RPC que cambia la idea a aprobada.
// =========================================================

export async function approveActivityIdea(
  data: {
    ideaId: string

    title: string

    description?: string | null

    assigned_to?: string | null

    due_date?: string | null

    due_time?: string | null

    priority: ActivityIdeaPriority
  },
) {
  const supabase =
    createClient()

  // -------------------------------------------------------
  // 1. ACTUALIZAR LOS DATOS DE LA IDEA
  // -------------------------------------------------------

  const {
    error: updateError,
  } = await supabase
    .from('activity_ideas')
    .update({
      title:
        data.title.trim(),

      description:
        data.description?.trim() ||
        null,

      assigned_to:
        data.assigned_to ||
        null,

      due_date:
        data.due_date ||
        null,

      due_time:
        data.due_time ||
        null,

      priority:
        data.priority,
    })
    .eq(
      'id',
      data.ideaId,
    )

  if (updateError) {
    throw updateError
  }

  // -------------------------------------------------------
  // 2. APROBAR LA IDEA
  // -------------------------------------------------------

  const {
    data: approvedData,
    error: approveError,
  } =
    await supabase.rpc(
      'approve_activity_idea',
      {
        p_idea_id:
          data.ideaId,
      },
    )

  if (approveError) {
    throw approveError
  }

  return approvedData
}

// =========================================================
// RECHAZAR IDEA
// =========================================================

export async function rejectActivityIdea(
  ideaId: string,
  reason?: string,
) {
  const supabase =
    createClient()

  const {
    data,
    error,
  } = await supabase.rpc(
    'reject_activity_idea',
    {
      p_idea_id:
        ideaId,

      p_reason:
        reason?.trim() ||
        null,
    },
  )

  if (error) {
    throw error
  }

  return data
}