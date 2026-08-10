
'use client'

import { useActivities, useCurrentUser } from '@/lib/marketing-hooks'
import { createClient } from '@/lib/supabase/client'
import { ActivityStatus } from '@/lib/marketing-types'
import {
  getStatusStyles,
  getPriorityStyles,
} from '@/lib/marketing-ui'
import { Eye, Trash2 } from 'lucide-react'
import { useState } from 'react'
import ActivityDetailModal from './ActivityDetailModal'

export default function ActivitiesTable() {
  const { activities, loading } = useActivities()
  const { user } = useCurrentUser()

  const [selectedActivity, setSelectedActivity] =
    useState<any | null>(null)

  const supabase = createClient()

  // =========================================================
  // CAMBIAR ESTADO
  // =========================================================

  const handleStatusChange = async (
    activityId: number,
    newStatus: ActivityStatus
  ) => {
    const { error } = await supabase
      .from('activities')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', activityId)

    if (error) {
      console.error(
        'Error actualizando actividad:',
        error
      )

      alert(
        `No se pudo actualizar la actividad: ${error.message}`
      )
    }
  }

  // =========================================================
  // ELIMINAR ACTIVIDAD
  // SOLO ADMIN
  // =========================================================

  const handleDeleteActivity = async (
    activityId: number,
    activityTitle: string
  ) => {
    // Seguridad adicional en frontend
    if (user?.role !== 'admin') {
      return
    }

    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar la actividad "${activityTitle}"?\n\nEsta acción no se puede deshacer.`
    )

    if (!confirmed) {
      return
    }

    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId)

      if (error) {
        console.error(
          'Error eliminando actividad:',
          error
        )

        alert(
          `No se pudo eliminar la actividad: ${error.message}`
        )

        return
      }

      // Si la actividad estaba abierta en el modal,
      // cerramos el modal.
      if (selectedActivity?.id === activityId) {
        setSelectedActivity(null)
      }

    } catch (error) {
      console.error(
        'Error eliminando actividad:',
        error
      )

      alert(
        'Ocurrió un error al eliminar la actividad.'
      )
    }
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="py-8 text-center text-foreground/60">
        Cargando actividades...
      </div>
    )
  }

  // =========================================================
  // SIN ACTIVIDADES
  // =========================================================

  if (activities.length === 0) {
    return (
      <div className="py-8 text-center text-foreground/60">
        Sin actividades
      </div>
    )
  }

  // =========================================================
  // TABLA
  // =========================================================

  return (
    <>
      <div className="overflow-x-auto bg-surface rounded-lg shadow mb-6">

        <table className="w-full">

          {/* =================================================
              HEADER
          ================================================= */}

          <thead className="border-b border-gray-200 dark:border-gray-800">

            <tr>

              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Actividad
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Asignado a
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Vencimiento
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Prioridad
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Estado
              </th>

              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">
                Acciones
              </th>

            </tr>

          </thead>

          {/* =================================================
              ACTIVIDADES
          ================================================= */}

          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">

            {activities.map((activity: any) => {

              /*
               * Usamos estas funciones para evitar que un valor
               * inesperado enviado por Supabase rompa la UI.
               */

              const priorityStyles =
                getPriorityStyles(
                  activity.priority
                )

              const statusStyles =
                getStatusStyles(
                  activity.status
                )

              return (
                <tr
                  key={activity.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-900/50"
                >

                  {/* =========================================
                      ACTIVIDAD
                  ========================================= */}

                  <td className="px-4 py-4">

                    <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                      {activity.title}
                    </div>

                    {activity.description && (
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {activity.description}
                      </div>
                    )}

                  </td>

                  {/* =========================================
                      ASIGNADO
                  ========================================= */}

                  <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">

                    {activity.assigned_to_name ||
                      activity.assigned_to ||
                      'Sin asignar'}

                  </td>

                  {/* =========================================
                      VENCIMIENTO
                  ========================================= */}

                  <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">

                    {activity.due_date ||
                      'Sin fecha'}

                  </td>

                  {/* =========================================
                      PRIORIDAD
                  ========================================= */}

                  <td className="px-4 py-4">

                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${priorityStyles.badge}`}
                    >
                      {priorityStyles.label}
                    </span>

                  </td>

                  {/* =========================================
                      ESTADO
                  ========================================= */}

                  <td className="px-4 py-4">

                    {user?.role === 'executor' &&
                    activity.assigned_to === user.id ? (

                      <select
                        value={activity.status}
                        onChange={(e) =>
                          handleStatusChange(
                            activity.id,
                            e.target
                              .value as ActivityStatus
                          )
                        }
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer border-0 outline-none ${statusStyles.badge}`}
                      >

                        <option value="pending">
                          Pendiente
                        </option>

                        <option value="in_progress">
                          En progreso
                        </option>

                        <option value="completed">
                          Completada
                        </option>

                        <option value="rejected">
                          Rechazada
                        </option>

                      </select>

                    ) : (

                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles.badge}`}
                      >

                        <span
                          className={`w-1.5 h-1.5 rounded-full ${statusStyles.dot}`}
                        />

                        {statusStyles.label}

                      </span>

                    )}

                  </td>

                  {/* =========================================
                      ACCIONES
                  ========================================= */}

                  <td className="px-4 py-4 text-center">

                    <div className="flex items-center justify-center gap-3">

                      {/* VER */}

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedActivity(
                            activity
                          )
                        }
                        className="text-blue-500 hover:text-blue-400 text-sm font-semibold inline-flex items-center justify-center gap-1 transition"
                      >

                        <Eye size={16} />

                        Ver

                      </button>

                      {/* =====================================
                          ELIMINAR
                          SOLO ADMIN
                      ===================================== */}

                      {user?.role === 'admin' && (

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteActivity(
                              activity.id,
                              activity.title
                            )
                          }
                          className="text-red-500 hover:text-red-600 dark:hover:text-red-400 text-sm font-semibold inline-flex items-center justify-center gap-1 transition"
                          title="Eliminar actividad"
                        >

                          <Trash2 size={16} />

                          Eliminar

                        </button>

                      )}

                    </div>

                  </td>

                </tr>
              )
            })}

          </tbody>

        </table>

      </div>

      {/* =====================================================
          MODAL DE DETALLE
      ===================================================== */}

      {selectedActivity && (

        <ActivityDetailModal
          activity={selectedActivity}
          currentUserRole={user?.role}
          currentUserId={user?.id}
          onClose={() =>
            setSelectedActivity(null)
          }
        />

      )}

    </>
  )
}

