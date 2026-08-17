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

  const [
    user,
    setUser,
  ] = useState<UserProfile | null>(null)

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    mounted,
    setMounted,
  ] = useState(false)

  const supabase =
    createClient()


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

    if (!mounted) {
      return
    }

    let isActive = true


    const getUser =
      async () => {

        try {

          const {
            data: {
              user: authUser,
            },
            error: authError,
          } =
            await supabase.auth.getUser()


          if (!isActive) {
            return
          }


          if (authError) {

            console.error(
              'Error obteniendo usuario autenticado:',
              authError
            )

            setUser(null)

            return

          }


          if (!authUser) {

            setUser(null)

            return

          }


          const {
            data,
            error,
          } =
            await supabase
              .from(
                'user_profiles'
              )
              .select('*')
              .eq(
                'id',
                authUser.id
              )
              .single()


          if (!isActive) {
            return
          }


          if (error) {

            console.error(
              'Error obteniendo perfil:',
              error
            )

            setUser(null)

            return

          }


          setUser(
            data as UserProfile
          )

        } catch (error) {

          console.error(
            'Error obteniendo usuario actual:',
            error
          )

          if (isActive) {
            setUser(null)
          }

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

  }, [
    mounted,
  ])


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
// - Todas las actividades
// - Nombre de usuarios
// - Realtime
// - Actividades nuevas
// - markActivityAsSeen
// - refetch
//
// IMPORTANTE:
// No recibe area.
// El filtrado por area se hace en ActivitiesTable.
// =========================================================

export const useActivities = () => {

  const [
    activities,
    setActivities,
  ] =
    useState<ActivityWithUser[]>([])


  const [
    loading,
    setLoading,
  ] =
    useState(true)


  const [
    error,
    setError,
  ] =
    useState<string | null>(null)


  const [
    newActivityIds,
    setNewActivityIds,
  ] =
    useState<number[]>([])


  const {
    user,
    mounted,
  } =
    useCurrentUser()


  // =======================================================
  // FETCH ACTIVIDADES
  // =======================================================

  const fetchActivities =
    useCallback(
      async () => {

        if (
          !mounted ||
          !user
        ) {
          return
        }


        setLoading(true)
        setError(null)


        try {

          const supabase =
            createClient()


          // ------------------------------------------------
          // ACTIVIDADES
          // ------------------------------------------------

          let query =
            supabase
              .from(
                'activities'
              )
              .select('*')
              .order(
                'due_date',
                {
                  ascending: true,
                }
              )
              .order(
                'due_time',
                {
                  ascending: true,
                  nullsFirst: false,
                }
              )


          // ------------------------------------------------
          // EXECUTOR
          // ------------------------------------------------

          if (
            user.role ===
            'executor'
          ) {

            query =
              query.eq(
                'assigned_to',
                user.id
              )

          }


          // ------------------------------------------------
          // CONSULTAS
          // ------------------------------------------------

          const [
            activitiesResult,
            profilesResult,
          ] =
            await Promise.all([

              query,

              supabase
                .from(
                  'user_profiles'
                )
                .select(
                  'id, full_name, role'
                ),

            ])


          // ------------------------------------------------
          // ERROR ACTIVIDADES
          // ------------------------------------------------

          if (
            activitiesResult.error
          ) {

            throw activitiesResult.error

          }


          // ------------------------------------------------
          // PROFILES
          // ------------------------------------------------

          if (
            profilesResult.error
          ) {

            console.error(
              'Error cargando perfiles:',
              profilesResult.error
            )

          }


          const data =
            activitiesResult.data || []


          const profiles =
            profilesResult.data || []


          // ------------------------------------------------
          // MAPA DE USUARIOS
          // ------------------------------------------------

          const nameById =
            new Map<
              string,
              string
            >(
              profiles.map(
                (
                  profile
                ) => [

                  profile.id,

                  profile.full_name,

                ]
              )
            )


          // ------------------------------------------------
          // ACTIVIDADES CON NOMBRES
          // ------------------------------------------------

          const activitiesWithNames =
            data.map(
              (
                activity
              ) => {

                const item =
                  activity as Activity


                return {

                  ...item,

                  assigned_to_name:
                    nameById.get(
                      activity.assigned_to
                    ) ||
                    activity.assigned_to ||
                    'Sin asignar',

                  created_by_name:
                    nameById.get(
                      activity.created_by
                    ) ||
                    activity.created_by ||
                    'Desconocido',

                  approved_by_name:
                    activity.approved_by
                      ? (
                          nameById.get(
                            activity.approved_by
                          ) ||
                          activity.approved_by
                        )
                      : undefined,

                } as ActivityWithUser

              }
            )


          setActivities(
            activitiesWithNames
          )

        } catch (error) {

          console.error(
            'Error cargando actividades:',
            error
          )


          setError(
            error instanceof Error
              ? error.message
              : 'Error cargando actividades.'
          )


          setActivities([])

        } finally {

          setLoading(false)

        }

      },
      [
        mounted,
        user?.id,
        user?.role,
      ]
    )


  // =======================================================
  // CARGA INICIAL + REALTIME
  // =======================================================

  useEffect(() => {

    if (
      !mounted ||
      !user
    ) {
      return
    }


    let isActive = true


    const supabase =
      createClient()


    // -----------------------------------------------------
    // CARGA INICIAL
    // -----------------------------------------------------

    fetchActivities()


    // -----------------------------------------------------
    // CHANNEL
    // -----------------------------------------------------

    const channelName =
      `activities_realtime_${user.id}`


    const channel =
      supabase.channel(
        channelName
      )


    // =====================================================
    // REALTIME
    // =====================================================

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'activities',
      },
      async (
        payload
      ) => {

        if (!isActive) {
          return
        }


        console.log(
          '🔔 Cambio Realtime:',
          payload.eventType
        )


        // =================================================
        // INSERT
        // =================================================

        if (
          payload.eventType ===
          'INSERT'
        ) {

          const newActivity =
            payload.new as Activity


          // -----------------------------------------------
          // EXECUTOR
          // -----------------------------------------------

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


          setNewActivityIds(
            previous => {

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

        }


        // =================================================
        // UPDATE
        // =================================================

        if (
          payload.eventType ===
          'UPDATE'
        ) {

          const oldActivity =
            payload.old as Partial<Activity>


          const updatedActivity =
            payload.new as Activity


          // -----------------------------------------------
          // EXECUTOR
          // -----------------------------------------------

          if (
            user.role ===
            'executor'
          ) {

            const wasAssigned =
              oldActivity.assigned_to ===
              user.id


            const isAssigned =
              updatedActivity.assigned_to ===
              user.id


            // ---------------------------------------------
            // NUEVA ACTIVIDAD ASIGNADA
            // ---------------------------------------------

            if (
              !wasAssigned &&
              isAssigned
            ) {

              const updatedId =
                Number(
                  updatedActivity.id
                )


              setNewActivityIds(
                previous => {

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

            }

          }

        }


        // =================================================
        // DELETE
        // =================================================

        if (
          payload.eventType ===
          'DELETE'
        ) {

          const deleted =
            payload.old as Partial<Activity>


          const deletedId =
            Number(
              deleted.id
            )


          setNewActivityIds(
            previous =>
              previous.filter(
                id =>
                  id !==
                  deletedId
              )
          )

        }


        // =================================================
        // RECARGAR
        // =================================================

        await fetchActivities()

      }
    )


    // -----------------------------------------------------
    // SUBSCRIBE
    // -----------------------------------------------------

    channel.subscribe(
      status => {

        console.log(
          '📡 Activities realtime:',
          status
        )


        if (
          status ===
          'SUBSCRIBED'
        ) {

          console.log(
            '✅ Realtime conectado'
          )

        }


        if (
          status ===
          'CHANNEL_ERROR'
        ) {

          console.error(
            '❌ Error Realtime'
          )

        }


        if (
          status ===
          'TIMED_OUT'
        ) {

          console.error(
            '⏱️ Realtime timeout'
          )

        }

      }
    )


    // -----------------------------------------------------
    // CLEANUP
    // -----------------------------------------------------

    return () => {

      isActive = false

      supabase.removeChannel(
        channel
      )

    }

  }, [
    mounted,
    user?.id,
    user?.role,
    fetchActivities,
  ])


  // =======================================================
  // MARCAR ACTIVIDAD COMO VISTA
  // =======================================================

  const markActivityAsSeen =
    (
      activityId: number
    ) => {

      const id =
        Number(
          activityId
        )


      setNewActivityIds(
        previous =>
          previous.filter(
            existingId =>
              existingId !==
              id
          )
      )

    }


  // =======================================================
  // RETURN
  // =======================================================

  return {

    activities,

    loading,

    error,

    newActivityIds,

    markActivityAsSeen,

    clearNewActivity:
      markActivityAsSeen,

    refetch:
      fetchActivities,

  }

}


// =========================================================
// USUARIOS
// =========================================================

export const useUsers = () => {

  const [
    users,
    setUsers,
  ] =
    useState<UserProfile[]>([])


  const [
    loaded,
    setLoaded,
  ] =
    useState(false)


  const [
    error,
    setError,
  ] =
    useState<string | null>(null)


  useEffect(() => {

    let isActive = true


    const fetchUsers =
      async () => {

        try {

          const supabase =
            createClient()


          const {
            data,
            error,
          } =
            await supabase
              .from(
                'user_profiles'
              )
              .select('*')
              .order(
                'full_name',
                {
                  ascending: true,
                }
              )


          if (!isActive) {
            return
          }


          if (error) {

            console.error(
              'Error fetching users:',
              error
            )


            setError(
              error.message
            )


            return

          }


          setUsers(
            (data || []) as UserProfile[]
          )

        } catch (error) {

          console.error(
            'Error fetching users:',
            error
          )


          if (isActive) {

            setError(
              error instanceof Error
                ? error.message
                : 'Error cargando usuarios.'
            )

          }

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

    error,

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


  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    )


  useEffect(() => {

    if (
      !userId ||
      !reportDate
    ) {

      setLoading(false)

      return

    }


    let isActive = true


    const fetchReport =
      async () => {

        setLoading(true)
        setError(null)


        try {

          const supabase =
            createClient()


          const {
            data,
            error,
          } =
            await supabase
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
              .maybeSingle()


          if (!isActive) {
            return
          }


          if (error) {

            console.error(
              'Error fetching report:',
              error
            )


            setError(
              error.message
            )


            setReport(null)

            return

          }


          setReport(
            data as DailyReport | null
          )

        } catch (error) {

          console.error(
            'Error fetching report:',
            error
          )


          if (isActive) {

            setError(
              error instanceof Error
                ? error.message
                : 'Error cargando reporte.'
            )

          }

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

    error,

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


    const [
      loading,
      setLoading,
    ] =
      useState(true)


    const [
      error,
      setError,
    ] =
      useState<string | null>(
        null
      )


    const {
      user,
      mounted,
    } =
      useCurrentUser()


    const fetchReports =
      useCallback(
        async () => {

          if (
            !mounted ||
            user?.role !==
              'admin'
          ) {

            setLoading(false)

            return

          }


          setLoading(true)
          setError(null)


          try {

            const supabase =
              createClient()


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


            if (error) {

              console.error(
                'Error fetching consolidated reports:',
                error
              )


              setError(
                error.message
              )


              return

            }


            setReports(
              (data || []) as ConsolidatedReport[]
            )

          } catch (error) {

            console.error(
              'Error fetching consolidated reports:',
              error
            )


            setError(
              error instanceof Error
                ? error.message
                : 'Error cargando reportes consolidados.'
            )

          } finally {

            setLoading(false)

          }

        },
        [
          mounted,
          user?.role,
        ]
      )


    useEffect(() => {

      fetchReports()

    }, [
      fetchReports,
    ])


    return {

      reports,

      loading,

      error,

      refetch:
        fetchReports,

    }

  }


// =========================================================
// ROLES
// =========================================================

export type UserRole =
  | 'admin'
  | 'executor'
  | 'viewer'