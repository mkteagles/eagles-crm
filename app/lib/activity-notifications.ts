'use client'

const STORAGE_PREFIX = 'marketing_activity_seen_'

interface ActivityLike {
  id: number | string
  assigned_to?: string | null
  created_at?: string | null
}

/**
 * Genera una firma única para la versión/asignación
 * de una actividad.
 *
 * Si Hugo cambia assigned_to, la firma cambia y
 * la actividad vuelve a considerarse nueva.
 */
export function getActivityNotificationKey(
  activity: ActivityLike
) {
  return `${activity.id}:${activity.assigned_to || 'unassigned'}`
}

/**
 * Obtiene las actividades que el usuario ya abrió.
 */
function getSeenActivities(userId?: string | null): string[] {
  if (!userId || typeof window === 'undefined') {
    return []
  }

  try {
    const stored = localStorage.getItem(
      `${STORAGE_PREFIX}${userId}`
    )

    if (!stored) {
      return []
    }

    const parsed = JSON.parse(stored)

    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error(
      'Error leyendo actividades vistas:',
      error
    )

    return []
  }
}

/**
 * Guarda una actividad como vista.
 */
export function markActivityAsSeen(
  activity: ActivityLike,
  userId?: string | null
) {
  if (!userId || typeof window === 'undefined') {
    return
  }

  try {
    const key = getActivityNotificationKey(activity)

    const seen = getSeenActivities(userId)

    if (!seen.includes(key)) {
      seen.push(key)
    }

    localStorage.setItem(
      `${STORAGE_PREFIX}${userId}`,
      JSON.stringify(seen)
    )

    // Avisamos a otros componentes de la misma página.
    window.dispatchEvent(
      new CustomEvent('activity-seen', {
        detail: {
          activityId: activity.id,
          notificationKey: key,
        },
      })
    )
  } catch (error) {
    console.error(
      'Error guardando actividad como vista:',
      error
    )
  }
}

/**
 * Determina si una actividad ya fue abierta por el usuario.
 */
export function isActivitySeen(
  activity: ActivityLike,
  userId?: string | null
) {
  if (!userId || typeof window === 'undefined') {
    return false
  }

  const key = getActivityNotificationKey(activity)

  return getSeenActivities(userId).includes(key)
}

/**
 * Una actividad es nueva si el usuario todavía
 * no ha abierto esa combinación actividad/asignación.
 */
export function isActivityNew(
  activity: ActivityLike,
  userId?: string | null
) {
  return !isActivitySeen(activity, userId)
}