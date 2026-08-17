'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  createClient,
} from '@/lib/supabase/client'


// =========================================================
// ACTIVIDAD
// =========================================================

export interface ActivityLike {

  id:
    number |
    string

  title?: string | null

  description?: string | null

  assigned_to?: string | null

  created_by?: string | null

  approved_by?: string | null

  status?: string | null

  created_at?: string | null

  updated_at?: string | null
}


// =========================================================
// IDEA
// =========================================================

export interface ActivityIdeaLike {

  id: string

  title?: string | null

  description?: string | null

  created_by?: string | null

  assigned_to?: string | null

  status?: string | null

  priority?: string | null

  due_date?: string | null

  due_time?: string | null

  reviewed_by?: string | null

  reviewed_at?: string | null

  rejection_reason?: string | null

  created_at?: string | null

  updated_at?: string | null
}


// =========================================================
// PAYLOAD REALTIME
// =========================================================

interface RealtimePayload {

  eventType:
    | 'INSERT'
    | 'UPDATE'
    | 'DELETE'

  new:
    ActivityLike |
    ActivityIdeaLike |
    Record<string, unknown>

  old:
    ActivityLike |
    ActivityIdeaLike |
    Record<string, unknown>

}


// =========================================================
// TIPOS
// =========================================================

export type NotificationType =
  | 'assigned'
  | 'completed'
  | 'approved'
  | 'rejected'
  | 'updated'


// =========================================================
// NOTIFICACIÓN
// =========================================================

export interface NotificationItem {

  id: string

  type: NotificationType

  activityId:
    number |
    string

  title: string

  message: string

  activity:
    ActivityLike

  createdAt: string

  notificationKey: string

  read: boolean
}


// =========================================================
// STORAGE
// =========================================================

const STORAGE_PREFIX =
  'marketing_activity_seen_'


// =========================================================
// KEY
// =========================================================

export function getActivityNotificationKey(
  activity: ActivityLike
): string {

  return `${activity.id}:${
    activity.assigned_to ||
    'unassigned'
  }`

}


// =========================================================
// ACTIVIDADES VISTAS
// =========================================================

export function getSeenActivities(
  userId?: string | null
): string[] {

  if (
    !userId ||
    typeof window === 'undefined'
  ) {

    return []

  }


  try {

    const stored =
      localStorage.getItem(
        `${STORAGE_PREFIX}${userId}`
      )


    if (!stored) {

      return []

    }


    const parsed: unknown =
      JSON.parse(stored)


    if (
      !Array.isArray(parsed)
    ) {

      return []

    }


    return parsed.filter(
      (
        item
      ): item is string =>
        typeof item === 'string'
    )

  } catch (error) {

    console.error(
      'Error leyendo actividades vistas:',
      error
    )

    return []

  }

}


// =========================================================
// MARCAR COMO VISTA
// =========================================================

export function markActivityAsSeen(
  activity: ActivityLike,
  userId?: string | null
): void {

  if (
    !userId ||
    typeof window === 'undefined'
  ) {

    return

  }


  try {

    const key =
      getActivityNotificationKey(
        activity
      )


    const seen =
      getSeenActivities(
        userId
      )


    if (
      !seen.includes(key)
    ) {

      seen.push(key)

    }


    localStorage.setItem(
      `${STORAGE_PREFIX}${userId}`,
      JSON.stringify(seen)
    )


    window.dispatchEvent(
      new CustomEvent(
        'activity-seen',
        {
          detail: {
            activityId:
              activity.id,

            notificationKey:
              key,
          },
        }
      )
    )

  } catch (error) {

    console.error(
      'Error guardando actividad vista:',
      error
    )

  }

}


// =========================================================
// SABER SI FUE VISTA
// =========================================================

export function isActivitySeen(
  activity: ActivityLike,
  userId?: string | null
): boolean {

  if (
    !userId ||
    typeof window === 'undefined'
  ) {

    return false

  }


  const key =
    getActivityNotificationKey(
      activity
    )


  return getSeenActivities(
    userId
  ).includes(key)

}


// =========================================================
// SABER SI ES NUEVA
// =========================================================

export function isActivityNew(
  activity: ActivityLike,
  userId?: string | null
): boolean {

  return !isActivitySeen(
    activity,
    userId
  )

}


// =========================================================
// USUARIO
// =========================================================

interface UserProfile {

  id: string

  full_name?: string | null

  role?: string | null
}


// =========================================================
// HOOK
// =========================================================

export function useActivityNotifications(
  user?: UserProfile | null
) {

  // =====================================================
  // SUPABASE ESTABLE
  // =====================================================

  const supabase = useMemo(
    () => createClient(),
    []
  )


  // =====================================================
  // STATE
  // =====================================================

  const [
    notifications,
    setNotifications,
  ] = useState<
    NotificationItem[]
  >([])


  const [
    loading,
    setLoading,
  ] = useState(true)


  // =====================================================
  // NOMBRE USUARIO
  // =====================================================

  const getUserName =
    useCallback(
      async (
        userId?: string | null
      ): Promise<string> => {

        if (!userId) {

          return 'Usuario'

        }


        try {

          const {
            data,
            error,
          } =
            await supabase
              .from(
                'user_profiles'
              )
              .select(
                'full_name'
              )
              .eq(
                'id',
                userId
              )
              .maybeSingle()


          if (error) {

            console.error(
              'Error obteniendo nombre:',
              error
            )

            return 'Usuario'

          }


          return (
            data?.full_name ||
            'Usuario'
          )

        } catch (error) {

          console.error(
            'Error obteniendo nombre:',
            error
          )

          return 'Usuario'

        }

      },
      [
        supabase,
      ]
    )


  // =====================================================
  // NOTIFICACIÓN DEL NAVEGADOR
  // =====================================================

  const showBrowserNotification =
    useCallback(
      (
        title: string,
        message: string,
        notificationId: string
      ) => {

        if (
          typeof window === 'undefined'
        ) {

          return

        }


        if (
          !('Notification' in window)
        ) {

          return

        }


        if (
          Notification.permission !==
          'granted'
        ) {

          return

        }


        try {

          new Notification(
            title,
            {
              body:
                message,

              tag:
                notificationId,
            }
          )

        } catch (error) {

          console.error(
            'Error creando notificación del navegador:',
            error
          )

        }

      },
      []
    )


  // =====================================================
  // CREAR NOTIFICACIÓN
  // =====================================================

  const createNotification =
    useCallback(
      async (
        type: NotificationType,
        activity: ActivityLike,
        actorId?: string | null
      ) => {

        if (!user?.id) {

          return

        }


        // -------------------------------------------------
        // NO NOTIFICARSE A SÍ MISMO
        // -------------------------------------------------

        if (
          actorId &&
          actorId === user.id
        ) {

          return

        }


        let shouldNotify = false

        let message = ''


        const actorName =
          await getUserName(
            actorId
          )


        // -------------------------------------------------
        // ASIGNADA
        // -------------------------------------------------

        if (
          type === 'assigned' &&
          activity.assigned_to ===
            user.id
        ) {

          shouldNotify = true

          message =
            `${actorName} te asignó la actividad "${activity.title || 'Sin título'}"`

        }


        // -------------------------------------------------
        // COMPLETADA
        // -------------------------------------------------

        if (
          type === 'completed' &&
          activity.created_by ===
            user.id
        ) {

          shouldNotify = true

          message =
            `${actorName} completó la actividad "${activity.title || 'Sin título'}"`

        }


        // -------------------------------------------------
        // APROBADA
        // -------------------------------------------------

        if (
          type === 'approved' &&
          activity.assigned_to ===
            user.id
        ) {

          shouldNotify = true

          message =
            `${actorName} aprobó la actividad "${activity.title || 'Sin título'}"`

        }


        // -------------------------------------------------
        // RECHAZADA
        // -------------------------------------------------

        if (
          type === 'rejected' &&
          activity.assigned_to ===
            user.id
        ) {

          shouldNotify = true

          message =
            `${actorName} rechazó la actividad "${activity.title || 'Sin título'}"`


          if (
            activity.description
          ) {

            message +=
              `: ${activity.description}`

          }

        }


        // -------------------------------------------------
        // ACTUALIZADA
        // -------------------------------------------------

        if (
          type === 'updated' &&
          activity.assigned_to ===
            user.id
        ) {

          shouldNotify = true

          message =
            `${actorName} actualizó la actividad "${activity.title || 'Sin título'}"`

        }


        // -------------------------------------------------
        // NO NOTIFICAR
        // -------------------------------------------------

        if (!shouldNotify) {

          return

        }


        // -------------------------------------------------
        // KEY
        // -------------------------------------------------

        const notificationKey =
          getActivityNotificationKey(
            activity
          )


        // -------------------------------------------------
        // OBJETO
        // -------------------------------------------------

        const notification:
          NotificationItem =
          {

            id:
              `${notificationKey}:${type}:${Date.now()}`,

            type,

            activityId:
              activity.id,

            title:
              activity.title ||
              'Actividad',

            message,

            activity,

            createdAt:
              new Date().toISOString(),

            notificationKey,

            read:
              isActivitySeen(
                activity,
                user.id
              ),

          }


        // -------------------------------------------------
        // EVITAR DUPLICADOS
        // -------------------------------------------------

        setNotifications(
          previous => {

            const exists =
              previous.some(
                item =>
                  item.activityId ===
                    notification.activityId &&
                  item.type ===
                    notification.type &&
                  item.notificationKey ===
                    notification.notificationKey
              )


            if (exists) {

              return previous

            }


            return [
              notification,
              ...previous,
            ]

          }
        )


        // -------------------------------------------------
        // BROWSER
        // -------------------------------------------------

        showBrowserNotification(
          'Nueva actividad',
          message,
          notification.id
        )

      },
      [
        user?.id,
        getUserName,
        showBrowserNotification,
      ]
    )


  // =====================================================
  // IDEA
  // =====================================================

  const createIdeaNotification =
    useCallback(
      async (
        idea: ActivityIdeaLike
      ) => {

        if (!user?.id) {

          return

        }


        if (
          idea.assigned_to !==
          user.id
        ) {

          return

        }


        if (
          idea.created_by ===
          user.id
        ) {

          return

        }


        const actorName =
          await getUserName(
            idea.created_by
          )


        const activity:
          ActivityLike =
          {

            id:
              idea.id,

            title:
              idea.title,

            description:
              idea.description,

            assigned_to:
              idea.assigned_to,

            created_by:
              idea.created_by,

            status:
              idea.status,

            created_at:
              idea.created_at,

            updated_at:
              idea.updated_at,

          }


        const notificationKey =
          `idea:${idea.id}:${idea.assigned_to}`


        const message =
          `${actorName} te envió la idea "${idea.title || 'Sin título'}"`


        const notification:
          NotificationItem =
          {

            id:
              `${notificationKey}:assigned:${Date.now()}`,

            type:
              'assigned',

            activityId:
              idea.id,

            title:
              idea.title ||
              'Nueva idea',

            message,

            activity,

            createdAt:
              new Date().toISOString(),

            notificationKey,

            read:
              isActivitySeen(
                activity,
                user.id
              ),

          }


        setNotifications(
          previous => {

            const exists =
              previous.some(
                item =>
                  item.notificationKey ===
                  notificationKey
              )


            if (exists) {

              return previous

            }


            return [
              notification,
              ...previous,
            ]

          }
        )


        showBrowserNotification(
          'Nueva idea',
          message,
          notification.id
        )

      },
      [
        user?.id,
        getUserName,
        showBrowserNotification,
      ]
    )


  // =====================================================
  // PROCESAR CAMBIO
  // =====================================================

  const processActivityChange =
    useCallback(
      async (
        payload:
          RealtimePayload
      ) => {

        if (!user?.id) {

          return

        }


        const eventType =
          payload.eventType


        // =================================================
        // INSERT
        // =================================================

        if (
          eventType ===
          'INSERT'
        ) {

          const activity =
            payload.new as ActivityLike


          if (
            activity.assigned_to ===
            user.id
          ) {

            await createNotification(
              'assigned',
              activity,
              activity.created_by
            )

          }


          return

        }


        // =================================================
        // SOLO UPDATE
        // =================================================

        if (
          eventType !==
          'UPDATE'
        ) {

          return

        }


        const oldActivity =
          payload.old as ActivityLike


        const newActivity =
          payload.new as ActivityLike


        // =================================================
        // ASIGNACIÓN
        // =================================================

        const wasAssigned =
          oldActivity.assigned_to ===
          user.id


        const isAssigned =
          newActivity.assigned_to ===
          user.id


        if (
          !wasAssigned &&
          isAssigned
        ) {

          await createNotification(
            'assigned',
            newActivity,
            newActivity.created_by
          )

        }


        // =================================================
        // COMPLETADA
        // =================================================

        const wasCompleted =
          oldActivity.status ===
          'completed'


        const isCompleted =
          newActivity.status ===
          'completed'


        if (
          !wasCompleted &&
          isCompleted
        ) {

          await createNotification(
            'completed',
            newActivity,
            newActivity.assigned_to
          )

        }


        // =================================================
        // APROBADA
        // =================================================

        const wasApproved =
          oldActivity.status ===
          'approved'


        const isApproved =
          newActivity.status ===
          'approved'


        if (
          !wasApproved &&
          isApproved
        ) {

          await createNotification(
            'approved',
            newActivity,
            newActivity.approved_by
          )

        }


        // =================================================
        // RECHAZADA
        // =================================================

        const wasRejected =
          oldActivity.status ===
          'rejected'


        const isRejected =
          newActivity.status ===
          'rejected'


        if (
          !wasRejected &&
          isRejected
        ) {

          await createNotification(
            'rejected',
            newActivity,
            newActivity.approved_by
          )

        }


        // =================================================
        // ACTUALIZADA
        // =================================================

        const statusChanged =
          oldActivity.status !==
          newActivity.status


        const titleChanged =
          oldActivity.title !==
          newActivity.title


        const descriptionChanged =
          oldActivity.description !==
          newActivity.description


        const assignmentChanged =
          oldActivity.assigned_to !==
          newActivity.assigned_to


        const specialStatusChange =
          (
            !wasCompleted &&
            isCompleted
          ) ||
          (
            !wasApproved &&
            isApproved
          ) ||
          (
            !wasRejected &&
            isRejected
          )


        if (
          isAssigned &&
          !specialStatusChange &&
          !(
            !wasAssigned &&
            isAssigned
          ) &&
          (
            statusChanged ||
            titleChanged ||
            descriptionChanged ||
            assignmentChanged
          )
        ) {

          await createNotification(
            'updated',
            newActivity,
            newActivity.created_by
          )

        }

      },
      [
        user?.id,
        createNotification,
      ]
    )


  // =====================================================
  // REALTIME
  // =====================================================

  useEffect(() => {

    // ---------------------------------------------------
    // SIN USUARIO
    // ---------------------------------------------------

    if (!user?.id) {

      setNotifications([])

      setLoading(false)

      return

    }


    let active = true

    let retryTimer:
      ReturnType<typeof setTimeout> |
      null = null


    const channelName =
      `activity_notifications_${user.id}`


    console.log(
      '📡 Iniciando Realtime:',
      channelName
    )


    // ---------------------------------------------------
    // CREAR CANAL
    // ---------------------------------------------------

    const channel =
      supabase.channel(
        channelName,
        {
          config: {
            broadcast: {
              self: false,
            },

            presence: {
              key: user.id,
            },
          },
        }
      )


    // ===================================================
    // ACTIVIDADES
    // ===================================================

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

        if (!active) {

          return

        }


        try {

          console.log(
            '🔔 Cambio de actividad:',
            payload
          )


          await processActivityChange(
            payload as unknown as RealtimePayload
          )

        } catch (error) {

          console.error(
            'Error procesando actividad realtime:',
            error
          )

        }

      }
    )


    // ===================================================
    // IDEAS
    // ===================================================

    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_ideas',
      },
      async (
        payload
      ) => {

        if (!active) {

          return

        }


        try {

          console.log(
            '💡 Nueva idea recibida:',
            payload
          )


          const idea =
            payload.new as ActivityIdeaLike


          await createIdeaNotification(
            idea
          )

        } catch (error) {

          console.error(
            'Error procesando idea realtime:',
            error
          )

        }

      }
    )


    // ===================================================
    // SUBSCRIBE
    // ===================================================

    channel.subscribe(
      (
        status,
        error
      ) => {

        if (!active) {

          return

        }


        console.log(
          '📡 Notifications realtime:',
          status
        )


        // ------------------------------------------------
        // CONECTADO
        // ------------------------------------------------

        if (
          status ===
          'SUBSCRIBED'
        ) {

          console.log(
            '✅ Notificaciones Realtime conectadas'
          )

          return

        }


        // ------------------------------------------------
        // ERROR
        // ------------------------------------------------

        if (
          status ===
          'CHANNEL_ERROR'
        ) {

          console.warn(
            '⚠️ Realtime de notificaciones no disponible.',
            {
              channel:
                channelName,

              userId:
                user.id,

              error,
            }
          )


          // ----------------------------------------------
          // NO LANZAR ERROR
          // ----------------------------------------------

          // IMPORTANTE:
          // Realtime NO debe romper la aplicación.
          //
          // La aplicación sigue funcionando aunque
          // Realtime esté temporalmente deshabilitado.
          // ----------------------------------------------


          if (
            active
          ) {

            retryTimer =
              setTimeout(
                () => {

                  if (
                    !active
                  ) {

                    return

                  }


                  console.log(
                    '🔄 Reintentando conexión Realtime...'
                  )


                  supabase
                    .removeChannel(
                      channel
                    )


                  // Recargar el efecto creando
                  // nuevamente el canal.
                  //
                  // No modificamos estado aquí para
                  // evitar loops innecesarios.

                },
                5000
              )

          }

          return

        }


        // ------------------------------------------------
        // TIMEOUT
        // ------------------------------------------------

        if (
          status ===
          'TIMED_OUT'
        ) {

          console.warn(
            '⏱️ Realtime de notificaciones agotó el tiempo.'
          )

          return

        }


        // ------------------------------------------------
        // CLOSED
        // ------------------------------------------------

        if (
          status ===
          'CLOSED'
        ) {

          console.log(
            '📴 Canal Realtime cerrado.'
          )

        }

      }
    )


    // ===================================================
    // LOADING
    // ===================================================

    setLoading(false)


    // ===================================================
    // CLEANUP
    // ===================================================

    return () => {

      active = false


      if (
        retryTimer
      ) {

        clearTimeout(
          retryTimer
        )

      }


      console.log(
        '🧹 Cerrando Realtime:',
        channelName
      )


      supabase.removeChannel(
        channel
      )

    }

  }, [
    user?.id,
    processActivityChange,
    createIdeaNotification,
    supabase,
  ])


  // =====================================================
  // MARCAR UNA
  // =====================================================

  const markAsRead =
    useCallback(
      (
        notification:
          NotificationItem
      ) => {

        if (!user?.id) {

          return

        }


        markActivityAsSeen(
          notification.activity,
          user.id
        )


        setNotifications(
          previous =>
            previous.map(
              item =>
                item.id ===
                notification.id
                  ? {
                      ...item,
                      read: true,
                    }
                  : item
            )
        )

      },
      [
        user?.id,
      ]
    )


  // =====================================================
  // MARCAR TODAS
  // =====================================================

  const markAllAsRead =
    useCallback(
      () => {

        if (!user?.id) {

          return

        }


        notifications.forEach(
          notification => {

            markActivityAsSeen(
              notification.activity,
              user.id
            )

          }
        )


        setNotifications(
          previous =>
            previous.map(
              item => ({
                ...item,
                read: true,
              })
            )
        )

      },
      [
        user?.id,
        notifications,
      ]
    )


  // =====================================================
  // OCULTAR
  // =====================================================

  const removeNotification =
    useCallback(
      (
        notificationId: string
      ) => {

        setNotifications(
          previous =>
            previous.filter(
              item =>
                item.id !==
                notificationId
            )
        )

      },
      []
    )


  // =====================================================
  // CONTADOR
  // =====================================================

  const unreadCount =
    useMemo(
      () =>
        notifications.filter(
          notification =>
            !notification.read
        ).length,
      [
        notifications,
      ]
    )


  // =====================================================
  // RETURN
  // =====================================================

  return {

    notifications,

    loading,

    unreadCount,

    markAsRead,

    markAllAsRead,

    removeNotification,

  }

}