'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

import {
  Activity,
  ActivityWithUser,
  UserProfile,
  DailyReport,
  ConsolidatedReport,
} from '@/lib/marketing-types'

// =========================================================
// USUARIO ACTUAL
// =========================================================

export const useCurrentUser = () => {
  const [user, setUser] =
    useState<UserProfile | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [mounted, setMounted] =
    useState(false)

  const supabase = createClient()

  // -------------------------------------------------------
  // MOUNT
  // -------------------------------------------------------

  useEffect(() => {
    setMounted(true)
  }, [])

  // -------------------------------------------------------
  // OBTENER USUARIO
  // -------------------------------------------------------

  useEffect(() => {
    if (!mounted) return

    let isActive = true

    const getUser = async () => {
      try {
        const {
          data: {
            user: authUser,
          },
        } = await supabase.auth.getUser()

        if (!isActive) return

        if (!authUser) {
          setUser(null)
          return
        }

        const {
          data,
          error,
        } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (!isActive) return

        if (error) {
          console.error(
            'Error fetching user profile:',
            error
          )

          setUser(null)
          return
        }

        setUser(data)
      } catch (error) {
        console.error(
          'Error fetching current user:',
          error
        )
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    getUser()

    return () => {
      isActive = false
    }
  }, [mounted])

  return {
    user,
    loading,
    mounted,
  }
}

// =========================================================
// ACTIVIDADES
// =========================================================
//
// Incluye:
//
// - Actividades
// - Nombre de usuarios
// - Realtime
// - Actividades nuevas
// - markActivityAsSeen
//
// =========================================================

export const useActivities = () => {
  const [
    activities,
    setActivities,
  ] = useState<any[]>([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    newActivityIds,
    setNewActivityIds,
  ] = useState<number[]>([])

  const {
    user,
    mounted,
  } = useCurrentUser()

  const supabase = createClient()

  // =======================================================
  // EFFECT PRINCIPAL
  // =======================================================

  useEffect(() => {
    if (!mounted || !user) {
      return
    }

    let isActive = true

    // =====================================================
    // CARGAR ACTIVIDADES
    // =====================================================

    const fetchActivities = async () => {
      try {
        let query = supabase
          .from('activities')
          .select('*')
          .order(
            'due_date',
            {
              ascending: true,
            }
          )

        // -------------------------------------------------
        // EXECUTOR
        // -------------------------------------------------
        //
        // Los executors solamente ven sus actividades.
        //

        if (
          user.role === 'executor'
        ) {
          query = query.eq(
            'assigned_to',
            user.id
          )
        }

        const [
          activitiesResult,
          profilesResult,
        ] = await Promise.all([
          query,

          supabase
            .from('user_profiles')
            .select(
              'id, full_name'
            ),
        ])

        if (!isActive) {
          return
        }

        const {
          data,
          error,
        } = activitiesResult

        const {
          data: profiles,
        } = profilesResult

        if (error) {
          console.error(
            'Error cargando actividades:',
            error
          )

          return
        }

        // -------------------------------------------------
        // MAPA DE NOMBRES
        // -------------------------------------------------

        const nameById =
          new Map(
            (profiles || []).map(
              (profile: any) => [
                profile.id,
                profile.full_name,
              ]
            )
          )

        // -------------------------------------------------
        // AGREGAR NOMBRES
        // -------------------------------------------------

        const activitiesWithNames =
          (data || []).map(
            (activity: any) => ({
              ...activity,

              assigned_to_name:
                nameById.get(
                  activity.assigned_to
                ) ||
                activity.assigned_to,

              created_by_name:
                nameById.get(
                  activity.created_by
                ) ||
                activity.created_by,

              approved_by_name:
                activity.approved_by
                  ? (
                      nameById.get(
                        activity.approved_by
                      ) ||
                      activity.approved_by
                    )
                  : undefined,
            })
          )

        if (!isActive) {
          return
        }

        setActivities(
          activitiesWithNames
        )
      } catch (error) {
        console.error(
          'Error cargando actividades:',
          error
        )
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    // =====================================================
    // CARGA INICIAL
    // =====================================================

    fetchActivities()

    // =====================================================
    // REALTIME
    // =====================================================
    //
    // MUY IMPORTANTE:
    //
    // 1. Creamos canal.
    // 2. Agregamos callback .on()
    // 3. AL FINAL hacemos .subscribe()
    //
    // Nunca:
    //
    // subscribe()
    // on()
    //
    // =====================================================

    const channelName =
      `activities_realtime_${user.id}_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 10)}`

    console.log(
      '📡 Creando canal Realtime:',
      channelName
    )

    const channel =
      supabase.channel(
        channelName
      )

    // =====================================================
    // CALLBACK REALTIME
    // =====================================================

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'activities',
      },
      async (payload) => {
        if (!isActive) {
          return
        }

        console.log(
          '🔔 Cambio Realtime:',
          payload.eventType,
          payload
        )

        // ================================================
        // INSERT
        // ================================================

        if (
          payload.eventType ===
          'INSERT'
        ) {
          const newActivity =
            payload.new as any

          // ----------------------------------------------
          // EXECUTOR
          // ----------------------------------------------
          //
          // Solamente se considera nueva si está asignada
          // al usuario actual.
          //

          if (
            user.role ===
              'executor' &&
            newActivity.assigned_to !==
              user.id
          ) {
            await fetchActivities()
            return
          }

          const newId =
            Number(
              newActivity.id
            )

          // ----------------------------------------------
          // MARCAR COMO NUEVA
          // ----------------------------------------------

          setNewActivityIds(
            (previous) => {
              if (
                previous.includes(
                  newId
                )
              ) {
                return previous
              }

              return [
                ...previous,
                newId,
              ]
            }
          )

          console.log(
            '🆕 Nueva actividad:',
            newId
          )
        }

        // ================================================
        // UPDATE
        // ================================================

        if (
          payload.eventType ===
          'UPDATE'
        ) {
          const oldActivity =
            payload.old as any

          const updatedActivity =
            payload.new as any

          // ----------------------------------------------
          // DETECTAR NUEVA ASIGNACIÓN
          // ----------------------------------------------
          //
          // Ejemplo:
          //
          // Antes:
          // assigned_to = Hugo
          //
          // Después:
          // assigned_to = Ursula
          //
          // Ursula recibe highlight NUEVA.
          //

          if (
            user.role ===
              'executor'
          ) {
            const wasAssignedToUser =
              oldActivity?.assigned_to ===
              user.id

            const isAssignedToUser =
              updatedActivity?.assigned_to ===
              user.id

            if (
              !wasAssignedToUser &&
              isAssignedToUser
            ) {
              const updatedId =
                Number(
                  updatedActivity.id
                )

              setNewActivityIds(
                (previous) => {
                  if (
                    previous.includes(
                      updatedId
                    )
                  ) {
                    return previous
                  }

                  return [
                    ...previous,
                    updatedId,
                  ]
                }
              )

              console.log(
                '🆕 Actividad asignada al usuario:',
                updatedId
              )
            }
          }

          console.log(
            '🔄 Actividad actualizada:',
            updatedActivity
          )
        }

        // ================================================
        // DELETE
        // ================================================

        if (
          payload.eventType ===
          'DELETE'
        ) {
          const deletedActivity =
            payload.old as any

          const deletedId =
            Number(
              deletedActivity.id
            )

          setNewActivityIds(
            (previous) =>
              previous.filter(
                (id) =>
                  id !==
                  deletedId
              )
          )

          console.log(
            '🗑️ Actividad eliminada:',
            deletedId
          )
        }

        // ================================================
        // RECARGAR ACTIVIDADES
        // ================================================

        await fetchActivities()
      }
    )

    // =====================================================
    // SUSCRIBIR
    // =====================================================
    //
    // ESTE ES EL ÚNICO subscribe()
    // DEL CANAL.
    //
    // =====================================================

    channel.subscribe(
      (status) => {
        console.log(
          '📡 Activities realtime:',
          status
        )

        if (
          status ===
          'SUBSCRIBED'
        ) {
          console.log(
            '✅ Realtime de actividades conectado'
          )
        }

        if (
          status ===
          'CHANNEL_ERROR'
        ) {
          console.error(
            '❌ Error del canal Realtime de actividades'
          )
        }

        if (
          status ===
          'TIMED_OUT'
        ) {
          console.error(
            '⏱️ Timeout del canal Realtime de actividades'
          )
        }

        if (
          status ===
          'CLOSED'
        ) {
          console.log(
            '🔌 Canal Realtime de actividades cerrado'
          )
        }
      }
    )

    // =====================================================
    // CLEANUP
    // =====================================================

    return () => {
      isActive = false

      console.log(
        '🧹 Cerrando Realtime:',
        channelName
      )

      // ---------------------------------------------------
      // IMPORTANTE:
      //
      // Se elimina EXACTAMENTE el canal creado arriba.
      // ---------------------------------------------------

      supabase.removeChannel(
        channel
      )
    }
  }, [
    mounted,
    user?.id,
    user?.role,
  ])

  // =======================================================
  // MARCAR ACTIVIDAD COMO VISTA
  // =======================================================

  const markActivityAsSeen = (
    activityId: number
  ) => {
    const id =
      Number(activityId)

    setNewActivityIds(
      (previous) =>
        previous.filter(
          (existingId) =>
            existingId !== id
        )
    )
  }

  // =======================================================
  // LIMPIAR NUEVA
  // =======================================================

  const clearNewActivity = (
    activityId: number
  ) => {
    markActivityAsSeen(
      activityId
    )
  }

  // =======================================================
  // RETURN
  // =======================================================

  return {
    activities,
    loading,

    // IDs de actividades nuevas
    newActivityIds,

    // Marca actividad como vista
    markActivityAsSeen,

    // Alias compatible
    clearNewActivity,
  }
}

// =========================================================
// USUARIOS
// =========================================================

export const useUsers = () => {
  const [
    users,
    setUsers,
  ] = useState<UserProfile[]>([])

  const [
    loaded,
    setLoaded,
  ] = useState(false)

  const supabase =
    createClient()

  useEffect(() => {
    let isActive = true

    const fetchUsers =
      async () => {
        try {
          const {
            data,
            error,
          } = await supabase
            .from(
              'user_profiles'
            )
            .select('*')

          if (!isActive) {
            return
          }

          if (error) {
            console.error(
              'Error fetching users:',
              error
            )

            return
          }

          setUsers(
            data || []
          )
        } catch (error) {
          console.error(
            'Error fetching users:',
            error
          )
        } finally {
          if (isActive) {
            setLoaded(true)
          }
        }
      }

    fetchUsers()

    return () => {
      isActive = false
    }
  }, [])

  return {
    users,
    loaded,
  }
}

// =========================================================
// REPORTE DIARIO
// =========================================================

export const useDailyReport = (
  userId: string,
  reportDate: string
) => {
  const [
    report,
    setReport,
  ] =
    useState<DailyReport | null>(
      null
    )

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const supabase =
    createClient()

  useEffect(() => {
    if (!userId) {
      return
    }

    let isActive = true

    const fetchReport =
      async () => {
        try {
          const {
            data,
            error,
          } = await supabase
            .from(
              'daily_reports'
            )
            .select('*')
            .eq(
              'user_id',
              userId
            )
            .eq(
              'report_date',
              reportDate
            )
            .single()

          if (!isActive) {
            return
          }

          if (error) {
            console.error(
              'Error fetching report:',
              error
            )

            return
          }

          setReport(data)
        } catch (error) {
          console.error(
            'Error fetching report:',
            error
          )
        } finally {
          if (isActive) {
            setLoading(false)
          }
        }
      }

    fetchReport()

    return () => {
      isActive = false
    }
  }, [
    userId,
    reportDate,
  ])

  return {
    report,
    loading,
  }
}

// =========================================================
// REPORTES CONSOLIDADOS
// =========================================================

export const useConsolidatedReports =
  () => {
    const [
      reports,
      setReports,
    ] =
      useState<
        ConsolidatedReport[]
      >([])

    const {
      user,
      mounted,
    } =
      useCurrentUser()

    const supabase =
      createClient()

    useEffect(() => {
      if (
        !mounted ||
        user?.role !==
          'admin'
      ) {
        return
      }

      let isActive = true

      const fetchReports =
        async () => {
          try {
            const {
              data,
              error,
            } =
              await supabase
                .from(
                  'consolidated_reports'
                )
                .select('*')
                .order(
                  'report_date',
                  {
                    ascending:
                      false,
                  }
                )

            if (!isActive) {
              return
            }

            if (error) {
              console.error(
                'Error fetching consolidated reports:',
                error
              )

              return
            }

            setReports(
              data || []
            )
          } catch (error) {
            console.error(
              'Error fetching consolidated reports:',
              error
            )
          }
        }

      fetchReports()

      return () => {
        isActive = false
      }
    }, [
      user?.id,
      user?.role,
      mounted,
    ])

    return {
      reports,
    }
  }

// =========================================================
// ROLES
// =========================================================

export type UserRole =
  | 'admin'
  | 'executor'
  | 'viewer'