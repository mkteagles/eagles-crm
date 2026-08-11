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
  CalendarDays,
} from 'lucide-react'

import {
  useMemo,
  useState,
} from 'react'

import ActivityDetailModal from './ActivityDetailModal'


// =========================================================
// TIPOS
// =========================================================

type StatusFilter =
  | 'all'
  | 'pending'
  | 'in_progress'
  | 'completed'

interface ActivitiesTableProps {
  statusFilter?: StatusFilter
}


// =========================================================
// HELPERS
// =========================================================

function getLocalDateString(
  date: Date = new Date()
): string {

  const year =
    date.getFullYear()

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, '0')

  const day =
    String(
      date.getDate()
    ).padStart(2, '0')

  return `${year}-${month}-${day}`
}


function getMonthKey(
  date: Date = new Date()
): string {

  const year =
    date.getFullYear()

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, '0')

  return `${year}-${month}`
}


function formatTime(
  time?: string | null
) {

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

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return time
  }

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


function formatDate(
  date?: string | null
) {

  if (!date) {
    return 'Sin fecha'
  }

  const [
    year,
    month,
    day,
  ] =
    String(date)
      .slice(0, 10)
      .split('-')

  if (
    !year ||
    !month ||
    !day
  ) {
    return date
  }

  return `${day}/${month}/${year}`
}


function formatMonthTitle(
  date: Date
) {

  return date.toLocaleDateString(
    'es-MX',
    {
      month: 'long',
      year: 'numeric',
    }
  )
}


function getStatusLabel(
  status?: string | null
) {

  switch (status) {

    case 'pending':
      return 'Pendiente'

    case 'in_progress':
      return 'En progreso'

    case 'completed':
      return 'Completada'

    case 'rejected':
      return 'Rechazada'

    case 'approved':
      return 'Aprobada'

    default:
      return status || 'Sin estado'
  }
}


// =========================================================
// COMPONENTE
// =========================================================

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


  // =======================================================
  // FECHA ACTUAL
  // =======================================================

  const today =
    getLocalDateString()

  const currentMonth =
    getMonthKey()


  // =======================================================
  // FILTRO POR ESTADO
  // =======================================================

  const statusFilteredActivities =
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


  // =======================================================
  // ACTIVIDADES DE HOY
  // =======================================================

  const todayActivities =
    useMemo(
      () => {

        return statusFilteredActivities
          .filter(
            (activity: any) =>
              String(
                activity.due_date || ''
              ).slice(0, 10) ===
              today
          )
          .sort(
            (
              a: any,
              b: any
            ) => {

              const timeA =
                a.due_time ||
                '23:59:59'

              const timeB =
                b.due_time ||
                '23:59:59'

              return timeA.localeCompare(
                timeB
              )
            }
          )

      },
      [
        statusFilteredActivities,
        today,
      ]
    )


  // =======================================================
  // ACTIVIDADES DEL MES
  // =======================================================

  const monthActivities =
    useMemo(
      () => {

        return statusFilteredActivities
          .filter(
            (activity: any) => {

              const date =
                String(
                  activity.due_date ||
                  ''
                ).slice(0, 10)

              return date.startsWith(
                currentMonth
              )

            }
          )
          .sort(
            (
              a: any,
              b: any
            ) => {

              const dateA =
                String(
                  a.due_date || ''
                )

              const dateB =
                String(
                  b.due_date || ''
                )

              if (
                dateA !== dateB
              ) {
                return dateA.localeCompare(
                  dateB
                )
              }

              return String(
                a.due_time ||
                '23:59:59'
              ).localeCompare(
                String(
                  b.due_time ||
                  '23:59:59'
                )
              )
            }
          )

      },
      [
        statusFilteredActivities,
        currentMonth,
      ]
    )


  // =======================================================
  // CAMBIAR ESTADO
  // =======================================================

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
                : {
                    completed_at:
                      null,
                  }),

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


  // =======================================================
  // ELIMINAR
  // =======================================================

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


  // =======================================================
  // ABRIR ACTIVIDAD
  // =======================================================

  const handleOpenActivity =
    (activity: any) => {

      /*
       * Conservamos el sistema actual
       * de actividades nuevas.
       */
      markActivityAsSeen(
        Number(activity.id)
      )


      setSelectedActivity(
        activity
      )

    }


  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {

    return (

      <div className="flex items-center justify-center py-12">

        <p className="text-gray-500 dark:text-gray-400">
          Cargando actividades...
        </p>

      </div>

    )

  }


  // =======================================================
  // FUNCIÓN PARA RENDERIZAR FILAS
  // =======================================================

  const renderRows =
    (
      list: any[]
    ) => {

      return list.map(
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

              {/* =====================================
                  ACTIVIDAD
              ===================================== */}

              <td className="px-4 py-4">

                <div className="flex items-start gap-3">

                  {isNew && (

                    <div className="shrink-0">

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


                    {activity.recurrence_type &&
                      activity.recurrence_type !==
                        'none' && (

                      <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-950/40 px-2 py-1 text-[10px] font-semibold text-purple-700 dark:text-purple-300">

                        <CalendarDays
                          size={11}
                        />

                        Fija
                        {activity.recurrence_days?.length
                          ? ' · ' +
                            activity.recurrence_days
                              .map(
                                (day: number) =>
                                  [
                                    'D',
                                    'L',
                                    'M',
                                    'X',
                                    'J',
                                    'V',
                                    'S',
                                  ][day]
                              )
                              .join(', ')
                          : ''}

                      </div>

                    )}

                  </div>

                </div>

              </td>


              {/* =====================================
                  ASIGNADO
              ===================================== */}

              <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">

                {
                  activity.assigned_to_name ||
                  activity.assigned_to ||
                  'Sin asignar'
                }

              </td>


              {/* =====================================
                  FECHA + HORA
              ===================================== */}

              <td className="px-4 py-4">

                <div className="text-sm text-gray-700 dark:text-gray-300">

                  {formatDate(
                    activity.due_date
                  )}

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


              {/* =====================================
                  PRIORIDAD
              ===================================== */}

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


              {/* =====================================
                  ESTADO
              ===================================== */}

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
                        Number(
                          activity.id
                        ),
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
                      statusStyles.label ||
                      getStatusLabel(
                        activity.status
                      )
                    }

                  </span>

                )}

              </td>


              {/* =====================================
                  ACCIONES
              ===================================== */}

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
      )

    }


  // =======================================================
  // TABLA
  // =======================================================

  const renderTable =
    (
      list: any[],
      emptyMessage: string
    ) => {

      if (list.length === 0) {

        return (

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-surface p-8 text-center">

            <div className="text-3xl mb-2">
              📋
            </div>

            <p className="font-semibold text-gray-900 dark:text-white">
              No hay actividades
            </p>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {emptyMessage}
            </p>

          </div>

        )

      }


      return (

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
                  Fecha / hora
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

              {renderRows(list)}

            </tbody>

          </table>

        </div>

      )

    }


  // =======================================================
  // RENDER
  // =======================================================

  return (

    <div className="space-y-10">

      {/* =================================================
          HOY
      ================================================= */}

      <section>

        <div className="mb-4 flex items-center justify-between">

          <div>

            <div className="flex items-center gap-2">

              <CalendarDays
                size={20}
                className="text-brand-orange"
              />

              <h2 className="text-xl font-bold text-gray-900 dark:text-white">

                Actividades de hoy

              </h2>

            </div>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">

              {new Date().toLocaleDateString(
                'es-MX',
                {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }
              )}

            </p>

          </div>


          <div className="rounded-full bg-brand-orange/10 px-3 py-1 text-sm font-semibold text-brand-orange">

            {todayActivities.length}
            {' '}
            {todayActivities.length === 1
              ? 'actividad'
              : 'actividades'}

          </div>

        </div>


        {renderTable(
          todayActivities,
          statusFilter === 'all'
            ? 'No tienes actividades programadas para hoy.'
            : 'No hay actividades de hoy con este estado.'
        )}

      </section>


      {/* =================================================
          RESTO DEL MES
      ================================================= */}

      <section>

        <div className="mb-4 flex items-center justify-between">

          <div>

            <div className="flex items-center gap-2">

              <CalendarDays
                size={20}
                className="text-purple-500"
              />

              <h2 className="text-xl font-bold text-gray-900 dark:text-white">

                Todas las actividades de{' '}
                {formatMonthTitle(
                  new Date()
                )}

              </h2>

            </div>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">

              Aquí puedes consultar todas las actividades programadas durante el mes.

            </p>

          </div>


          <div className="rounded-full bg-purple-500/10 px-3 py-1 text-sm font-semibold text-purple-600 dark:text-purple-400">

            {monthActivities.length}

          </div>

        </div>


        {renderTable(
          monthActivities,
          statusFilter === 'all'
            ? 'No hay actividades programadas para este mes.'
            : 'No hay actividades de este mes con este estado.'
        )}

      </section>


      {/* =================================================
          MODAL
      ================================================= */}

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

    </div>

  )

}