'use client'

const STORAGE_PREFIX = 'marketing_activity_seen_'

// =========================================================
// TIPO DE ACTIVIDAD
// =========================================================

export interface ActivityLike {
  id: number | string

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
// GENERAR KEY ÚNICA
// =========================================================
//
// La combinación ID + assigned_to identifica la versión
// de asignación de una actividad.
//
// Si una actividad cambia de responsable,
// vuelve a considerarse nueva.
// =========================================================

export function getActivityNotificationKey(
  activity: ActivityLike
): string {
  return `${activity.id}:${activity.assigned_to || 'unassigned'}`
}

// =========================================================
// OBTENER ACTIVIDADES VISTAS
// =========================================================
//
// IMPORTANTE:
// Esta función está exportada porque otros archivos
// pueden necesitar utilizarla.
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
    const storageKey =
      `${STORAGE_PREFIX}${userId}`

    const stored =
      localStorage.getItem(
        storageKey
      )

    if (!stored) {
      return []
    }

    const parsed =
      JSON.parse(stored)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(
      (item): item is string =>
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
// GUARDAR ACTIVIDAD COMO VISTA
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
      getSeenActivities(userId)

    if (!seen.includes(key)) {
      seen.push(key)
    }

    const storageKey =
      `${STORAGE_PREFIX}${userId}`

    localStorage.setItem(
      storageKey,
      JSON.stringify(seen)
    )

    // =====================================================
    // AVISAR A OTROS COMPONENTES
    // =====================================================

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
      'Error guardando actividad como vista:',
      error
    )
  }
}

// =========================================================
// SABER SI UNA ACTIVIDAD YA FUE VISTA
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

  const seen =
    getSeenActivities(userId)

  return seen.includes(key)
}

// =========================================================
// SABER SI UNA ACTIVIDAD ES NUEVA
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
// LIMPIAR ACTIVIDADES VISTAS
// =========================================================
//
// Útil si después quieres agregar un botón para
// limpiar el historial de notificaciones.
// =========================================================

export function clearSeenActivities(
  userId?: string | null
): void {
  if (
    !userId ||
    typeof window === 'undefined'
  ) {
    return
  }

  try {
    localStorage.removeItem(
      `${STORAGE_PREFIX}${userId}`
    )

    window.dispatchEvent(
      new CustomEvent(
        'activity-seen-cleared'
      )
    )
  } catch (error) {
    console.error(
      'Error limpiando actividades vistas:',
      error
    )
  }
}