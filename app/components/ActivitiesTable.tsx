'use client'

import {
  useActivities,
  useCurrentUser,
} from '@/lib/marketing-hooks'

import { createClient } from '@/lib/supabase/client'

import { ActivityStatus } from '@/lib/marketing-types'

import {
  getStatusStyles,
  getPriorityStyles,
} from '@/lib/marketing-ui'

import {
  Eye,
  Trash2,
  Sparkles,
  Clock,
} from 'lucide-react'

import {
  useMemo,
  useState,
} from 'react'

import ActivityDetailModal from './ActivityDetailModal'


type StatusFilter =
  | 'all'
  | 'pending'
  | 'in_progress'
  | 'completed'


interface ActivitiesTableProps {
  statusFilter?: StatusFilter
}


export default function ActivitiesTable({
  statusFilter = 'all',
}: ActivitiesTableProps) {

  const {
    activities,
    loading,
    newActivityIds,
    markActivityAsSeen,
  } =
    useActivities()


  const {
    user,
  } =
    useCurrentUser()


  const [
    selectedActivity,
    setSelectedActivity,
  ] =
    useState<any | null>(null)


  const supabase =
    createClient()


  // =====================================================
  // FILTRAR
  // =====================================================

  const filteredActivities =
    useMemo(
      () => {

        if (
          statusFilter === 'all'
        ) {
          return activities
        }

        return activities.filter(
          (activity: any) =>
            activity.status ===
            statusFilter
        )

      },
      [
        activities,
        statusFilter,
      ]
    )


  // =====================================================
  // FORMATEAR HORA
  // =====================================================

  const formatTime =
    (
      time?: string | null
    ) => {

      if (!time) {
        return ''
      }

      const [
        hours,
        minutes,
      ] =
        time
          .split(':')
          .map(Number)

      const date =
        new Date()

      date.setHours(
        hours,
        minutes,
        0,
        0
      )

      return date.toLocaleTimeString(
        'es-MX',
        {
          hour: 'numeric',
          minute: '2-digit',
        }
      )
    }


  // =====================================================
  // CAMBIAR ESTADO
  // =====================================================

  const handleStatusChange =
    async (
      activityId: number,
      newStatus: ActivityStatus
    ) => {

      const previousActivity =
        activities.find(
          (activity: any) =>
            Number(activity.id) ===
            Number(activityId)
        )


      try {

        const {
          error,
        } =
          await supabase
            .from('activities')
            .update({
              status:
                newStatus,

              updated_at:
                new Date()
                  .toISOString(),

              ...(newStatus ===
                'completed'
                ? {
                    completed_at:
                      new Date()
                        .toISOString(),
                  }
                : {}),
            })
            .eq(
              'id',
              activityId
            )


        if (error) {

          console.error(
            error
          )

          alert(
            `No se pudo actualizar la actividad:\n\n${error.message}`
          )

          return
        }


        console.log(
          '✅ Estado actualizado:',
          {
            activityId,
            oldStatus:
              previousActivity?.status,
            newStatus,
          }
        )

      } catch (error) {

        console.error(
          error
        )

        alert(
          'Ocurrió un error inesperado al actualizar la actividad.'
        )

      }

    }


  // =====================================================
  // ELIMINAR
  // =====================================================

  const handleDeleteActivity =
    async (
      activityId: number,
      activityTitle: string
    ) => {

      if (
        user?.role !==
        'admin'
      ) {
        return
      }


      const confirmed =
        window.confirm(
          `¿Seguro que quieres eliminar la actividad "${activityTitle}"?\n\nEsta acción no se puede deshacer.`
        )


      if (!confirmed) {
        return
      }


      try {

        const {
          data,
          error,
        } =
          await supabase
            .from('activities')
            .delete()
            .eq(
              'id',
              activityId
            )
            .select('id')


        if (error) {

          alert(
            `No se pudo eliminar la actividad:\n\n${error.message}`
          )

          return
        }


        if (
          !data ||
          data.length === 0
        ) {

          alert(
            'La actividad no fue eliminada.'
          )

          return
        }


        if (
          Number(
            selectedActivity?.id
          ) ===
          Number(activityId)
        ) {

          setSelectedActivity(
            null
          )

        }

      } catch (error) {

        console.error(
          error
        )

        alert(
          'Ocurrió un error inesperado al eliminar la actividad.'
        )

      }

    }


  // =====================================================
  // ABRIR
  // =====================================================

  const handleOpenActivity =
    (activity: any) => {

      markActivityAsSeen(
        Number(activity.id)
      )

      setSelectedActivity(
        activity
      )

    }


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (

      <div className="flex items-center justify-center py-12">

        <p className="text-gray-500 dark:text-gray-400">
          Cargando actividades...
        </p>

      </div>

    )

  }


  // =====================================================
  // VACÍO
  // =====================================================

  if (
    filteredActivities.length === 0
  ) {

    return (

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-surface p-10 text-center">

        <div className="text-4xl mb-3">
          📋
        </div>

        <h3 className="font-semibold text-gray-900 dark:text-white">
          No hay actividades
        </h3>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {statusFilter === 'all'
            ? 'Todavía no hay actividades registradas.'
            : 'No hay actividades con este estado.'}
        </p>

      </div>

    )

  }


  // =====================================================
  // TABLA
  // =====================================================

  return (

    <>

      <div className="w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-surface shadow-sm">

        <table className="w-full">

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


          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">

            {filteredActivities.map(
              (activity: any) => {

                const isNew =
                  newActivityIds.includes(
                    Number(activity.id)
                  )


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
                    className={`
                      transition-all
                      duration-300
                      ${
                        isNew
                          ? 'bg-blue-50 dark:bg-blue-950/20 ring-1 ring-inset ring-blue-400/40'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-900/50'
                      }
                    `}
                  >

                    {/* ACTIVIDAD */}

                    <td className="px-4 py-4">

                      <div className="flex items-start gap-3">

                        {isNew && (

                          <div>

                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase">

                              <Sparkles
                                size={11}
                              />

                              Nueva

                            </div>

                          </div>

                        )}

                        <div className="min-w-0">

                          <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                            {activity.title}
                          </div>

                          {activity.description && (

                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                              {activity.description}
                            </div>

                          )}

                        </div>

                      </div>

                    </td>


                    {/* ASIGNADO */}

                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">

                      {
                        activity.assigned_to_name ||
                        activity.assigned_to ||
                        'Sin asignar'
                      }

                    </td>


                    {/* FECHA + HORA */}

                    <td className="px-4 py-4">

                      <div className="text-sm text-gray-700 dark:text-gray-300">

                        {activity.due_date ||
                          'Sin fecha'}

                      </div>

                      {activity.due_time && (

                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">

                          <Clock
                            size={12}
                          />

                          {formatTime(
                            activity.due_time
                          )}

                        </div>

                      )}

                    </td>


                    {/* PRIORIDAD */}

                    <td className="px-4 py-4">

                      <span
                        className={`
                          inline-flex
                          px-2.5
                          py-1
                          rounded-full
                          text-xs
                          font-semibold
                          ${priorityStyles.badge}
                        `}
                      >
                        {
                          priorityStyles.label
                        }
                      </span>

                    </td>


                    {/* ESTADO */}

                    <td className="px-4 py-4">

                      {user?.role ===
                        'executor' &&
                      activity.assigned_to ===
                        user.id ? (

                        <select
                          value={
                            activity.status
                          }
                          onChange={(e) =>
                            handleStatusChange(
                              activity.id,
                              e.target.value as ActivityStatus
                            )
                          }
                          className={`
                            px-2.5
                            py-1
                            rounded-full
                            text-xs
                            font-semibold
                            border-0
                            outline-none
                            ${statusStyles.badge}
                          `}
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
                          className={`
                            inline-flex
                            items-center
                            gap-1.5
                            px-2.5
                            py-1
                            rounded-full
                            text-xs
                            font-semibold
                            ${statusStyles.badge}
                          `}
                        >

                          <span
                            className={`
                              w-1.5
                              h-1.5
                              rounded-full
                              ${statusStyles.dot}
                            `}
                          />

                          {
                            statusStyles.label
                          }

                        </span>

                      )}

                    </td>


                    {/* ACCIONES */}

                    <td className="px-4 py-4 text-center">

                      <div className="flex items-center justify-center gap-3">

                        <button
                          type="button"
                          onClick={() =>
                            handleOpenActivity(
                              activity
                            )
                          }
                          className={`
                            text-blue-500
                            text-sm
                            font-semibold
                            inline-flex
                            items-center
                            gap-1
                            ${
                              isNew
                                ? 'animate-pulse'
                                : ''
                            }
                          `}
                        >

                          <Eye
                            size={16}
                          />

                          Ver

                        </button>


                        {user?.role ===
                          'admin' && (

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteActivity(
                                Number(
                                  activity.id
                                ),
                                activity.title
                              )
                            }
                            className="text-red-500 hover:text-red-600 text-sm font-semibold inline-flex items-center gap-1"
                          >

                            <Trash2
                              size={16}
                            />

                            Eliminar

                          </button>

                        )}

                      </div>

                    </td>

                  </tr>

                )

              }
            )}

          </tbody>

        </table>

      </div>


      {selectedActivity && (

        <ActivityDetailModal
          activity={
            selectedActivity
          }

          currentUserRole={
            user?.role
          }

          currentUserId={
            user?.id
          }

          onClose={() =>
            setSelectedActivity(
              null
            )
          }
        />

      )}

    </>

  )
}