
'use client'

import { useActivities, useCurrentUser } from '@/lib/marketing-hooks'
import { createClient } from '@/lib/supabase/client'
import { ActivityStatus } from '@/lib/marketing-types'
import { getStatusStyles, getPriorityStyles } from '@/lib/marketing-ui'
import { Eye } from 'lucide-react'
import { useState } from 'react'
import ActivityDetailModal from './ActivityDetailModal'

export default function ActivitiesTable() {
  const { activities, loading } = useActivities()
  const { user } = useCurrentUser()
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null)

  const supabase = createClient()

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
      console.error('Error actualizando actividad:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Cargando actividades...
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Sin actividades
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                Actividad
              </th>

              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                Asignado a
              </th>

              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                Vencimiento
              </th>

              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                Prioridad
              </th>

              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                Estado
              </th>

              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {activities.map((activity: any) => {
              /*
               * IMPORTANTE:
               * Usamos estas funciones en lugar de acceder directamente
               * a priorityConfig/statusConfig.
               *
               * Así, si Supabase manda:
               * priority = "urgent"
               * o un valor inesperado,
               * la aplicación no se rompe.
               */
              const priorityStyles = getPriorityStyles(
                activity.priority
              )

              const statusStyles = getStatusStyles(
                activity.status
              )

              return (
                <tr
                  key={activity.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-900/50"
                >
                  {/* ACTIVIDAD */}
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

                  {/* ASIGNADO */}
                  <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {activity.assigned_to_name ||
                      activity.assigned_to ||
                      'Sin asignar'}
                  </td>

                  {/* VENCIMIENTO */}
                  <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {activity.due_date || 'Sin fecha'}
                  </td>

                  {/* PRIORIDAD */}
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${priorityStyles.badge}`}
                    >
                      {priorityStyles.label}
                    </span>
                  </td>

                  {/* ESTADO */}
                  <td className="px-4 py-4">
                    {user?.role === 'executor' &&
                    activity.assigned_to === user.id ? (
                      <select
                        value={activity.status}
                        onChange={(e) =>
                          handleStatusChange(
                            activity.id,
                            e.target.value as ActivityStatus
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

                  {/* ACCIONES */}
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() =>
                        setSelectedActivity(activity)
                      }
                      className="text-blue-500 hover:text-blue-400 text-sm font-semibold inline-flex items-center justify-center gap-1"
                    >
                      <Eye size={16} />
                      Ver
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {selectedActivity && (
        <ActivityDetailModal
          activity={selectedActivity}
          currentUserRole={user?.role}
          currentUserId={user?.id}
          onClose={() => setSelectedActivity(null)}
        />
      )}
    </>
  )
}

