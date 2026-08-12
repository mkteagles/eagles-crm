'use client'

import {
  useActivities,
  useCurrentUser,
} from '@/lib/marketing-hooks'

import {
  createClient,
} from '@/lib/supabase/client'

import {
  ActivityStatus,
} from '@/lib/marketing-types'

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
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  LoaderCircle,
} from 'lucide-react'

import {
  useMemo,
  useState,
} from 'react'

import ActivityDetailModal from './ActivityDetailModal'


// =========================================================
// HELPERS DE FECHA
// =========================================================

function getLocalDateString(
  date: Date = new Date()
): string {
  const year = date.getFullYear()

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0')

  const day = String(
    date.getDate()
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}


// =========================================================
// OBTENER MES
// =========================================================

function getMonthKey(
  date: Date
): string {
  const year = date.getFullYear()

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0')

  return `${year}-${month}`
}


// =========================================================
// CREAR DATE DESDE YYYY-MM-DD
// SIN PROBLEMAS DE UTC
// =========================================================

function dateFromString(
  dateString: string
): Date {
  const [
    year,
    month,
    day,
  ] = dateString
    .split('-')
    .map(Number)

  return new Date(
    year,
    month - 1,
    day
  )
}


// =========================================================
// FORMATEAR FECHA LARGA
// =========================================================

function formatLongDate(
  dateString: string
) {
  const date =
    dateFromString(
      dateString
    )

  return date.toLocaleDateString(
    'es-MX',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  )
}


// =========================================================
// FORMATEAR HORA
// =========================================================

function formatTime(
  time?: string | null
) {
  if (!time) {
    return ''
  }

  const [
    hours,
    minutes,
  ] = time
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


// =========================================================
// FORMATEAR FECHA CORTA
// =========================================================

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
  ] = String(date)
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


// =========================================================
// FORMATEAR MES
// =========================================================

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


// =========================================================
// STATUS LABEL
// =========================================================

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
// PRIORITY LABEL
// =========================================================

function getPriorityLabel(
  priority?: string | null
) {
  switch (priority) {
    case 'low':
      return 'Baja'

    case 'medium':
      return 'Media'

    case 'high':
      return 'Alta'

    case 'urgent':
      return 'Urgente'

    default:
      return priority || 'Media'
  }
}


// =========================================================
// TIPO FILTRO
// =========================================================

type ActivityFilter =
  | 'all'
  | 'pending'
  | 'in_progress'
  | 'completed'


// =========================================================
// TIPO PRIORIDAD
// =========================================================

type ActivityPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent'


// =========================================================
// COMPONENTE
// =========================================================

export default function ActivitiesTable() {

  // =======================================================
  // ACTIVIDADES
  // =======================================================

  const {
    activities,
    loading,
    newActivityIds,
    markActivityAsSeen,
  } = useActivities()


  // =======================================================
  // USUARIO
  // =======================================================

  const {
    user,
  } = useCurrentUser()


  // =======================================================
  // SUPABASE
  // =======================================================

  const supabase =
    createClient()


  // =======================================================
  // ACTIVIDAD SELECCIONADA
  // =======================================================

  const [
    selectedActivity,
    setSelectedActivity,
  ] = useState<any | null>(
    null
  )


  // =======================================================
  // FECHA ACTUAL
  // =======================================================

  const today =
    getLocalDateString()


  // =======================================================
  // FECHA SELECCIONADA
  // =======================================================

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    today
  )


  // =======================================================
  // FILTRO DE ESTADO
  // =======================================================

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<ActivityFilter>(
    'all'
  )


  // =======================================================
  // ACTIVIDADES EN ACTUALIZACIÓN
  // =======================================================

  const [
    updatingActivities,
    setUpdatingActivities,
  ] = useState<
    Set<number>
  >(
    new Set()
  )


  // =======================================================
  // DATE DE LA FECHA SELECCIONADA
  // =======================================================

  const selectedDateObject =
    useMemo(
      () =>
        dateFromString(
          selectedDate
        ),
      [
        selectedDate,
      ]
    )


  // =======================================================
  // MES SELECCIONADO
  // =======================================================

  const selectedMonth =
    getMonthKey(
      selectedDateObject
    )


  // =======================================================
  // PERMISO PARA EDITAR
  // =======================================================

  const canEditActivity = (
    activity: any
  ) => {

    // Hugo / cualquier ADMIN
    // puede editar cualquier actividad

    if (
      user?.role === 'admin'
    ) {
      return true
    }


    // Executors solamente pueden
    // editar actividades asignadas a ellos

    if (
      user?.role === 'executor' &&
      activity.assigned_to === user.id
    ) {
      return true
    }


    // Viewers no pueden editar

    return false
  }


  // =======================================================
  // CAMBIAR DÍA
  // =======================================================

  const changeDay =
    (
      amount: number
    ) => {

      const current =
        dateFromString(
          selectedDate
        )

      current.setDate(
        current.getDate() +
          amount
      )

      setSelectedDate(
        getLocalDateString(
          current
        )
      )
    }


  // =======================================================
  // IR A HOY
  // =======================================================

  const goToToday =
    () => {

      setSelectedDate(
        getLocalDateString()
      )
    }


  // =======================================================
  // CAMBIAR FECHA MANUALMENTE
  // =======================================================

  const handleDateChange =
    (
      value: string
    ) => {

      if (!value) {
        return
      }

      setSelectedDate(
        value
      )
    }


  // =======================================================
  // ACTIVIDADES DEL DÍA
  // =======================================================

  const selectedDayActivities =
    useMemo(
      () => {

        return activities
          .filter(
            (
              activity: any
            ) =>
              String(
                activity.due_date ||
                  ''
              ).slice(
                0,
                10
              ) ===
              selectedDate
          )
          .sort(
            (
              a: any,
              b: any
            ) => {

              const timeA =
                String(
                  a.due_time ||
                    '23:59:59'
                )

              const timeB =
                String(
                  b.due_time ||
                    '23:59:59'
                )

              return timeA.localeCompare(
                timeB
              )
            }
          )

      },
      [
        activities,
        selectedDate,
      ]
    )


  // =======================================================
  // ESTADÍSTICAS DEL DÍA
  // =======================================================

  const dayStats =
    useMemo(
      () => {

        const total =
          selectedDayActivities.length

        const pending =
          selectedDayActivities.filter(
            (
              activity: any
            ) =>
              activity.status ===
              'pending'
          ).length

        const inProgress =
          selectedDayActivities.filter(
            (
              activity: any
            ) =>
              activity.status ===
              'in_progress'
          ).length

        const completed =
          selectedDayActivities.filter(
            (
              activity: any
            ) =>
              activity.status ===
              'completed'
          ).length

        return {
          total,
          pending,
          inProgress,
          completed,
        }

      },
      [
        selectedDayActivities,
      ]
    )


  // =======================================================
  // ACTIVIDADES FILTRADAS DEL DÍA
  // =======================================================

  const filteredDayActivities =
    useMemo(
      () => {

        if (
          statusFilter ===
          'all'
        ) {
          return selectedDayActivities
        }

        return selectedDayActivities.filter(
          (
            activity: any
          ) =>
            activity.status ===
            statusFilter
        )

      },
      [
        selectedDayActivities,
        statusFilter,
      ]
    )


  // =======================================================
  // ACTIVIDADES DEL MES
  // =======================================================

  const monthActivities =
    useMemo(
      () => {

        return activities
          .filter(
            (
              activity: any
            ) => {

              const date =
                String(
                  activity.due_date ||
                    ''
                ).slice(
                  0,
                  10
                )

              return date.startsWith(
                selectedMonth
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
                  a.due_date ||
                    ''
                )

              const dateB =
                String(
                  b.due_date ||
                    ''
                )

              if (
                dateA !==
                dateB
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
        activities,
        selectedMonth,
      ]
    )


  // =======================================================
  // MARCAR ACTIVIDAD COMO ACTUALIZANDO
  // =======================================================

  const setActivityUpdating = (
    activityId: number,
    updating: boolean
  ) => {

    setUpdatingActivities(
      previous => {

        const next =
          new Set(
            previous
          )

        if (updating) {
          next.add(
            activityId
          )
        } else {
          next.delete(
            activityId
          )
        }

        return next
      }
    )
  }


  // =======================================================
  // CAMBIAR ESTADO
  // =======================================================

  const handleStatusChange =
    async (
      activityId: number,
      newStatus: ActivityStatus
    ) => {

      const activity =
        activities.find(
          (
            item: any
          ) =>
            Number(
              item.id
            ) ===
            Number(
              activityId
            )
        )

      if (!activity) {
        return
      }


      if (
        !canEditActivity(
          activity
        )
      ) {
        alert(
          'No tienes permiso para modificar esta actividad.'
        )

        return
      }


      const previousStatus =
        activity.status


      setActivityUpdating(
        Number(activityId),
        true
      )


      try {

        const now =
          new Date().toISOString()


        const updateData: any = {
          status:
            newStatus,

          updated_at:
            now,
        }


        if (
          newStatus ===
          'completed'
        ) {

          updateData.completed_at =
            now

        } else {

          updateData.completed_at =
            null
        }


        const {
          error,
        } =
          await supabase
            .from(
              'activities'
            )
            .update(
              updateData
            )
            .eq(
              'id',
              activityId
            )


        if (error) {

          console.error(
            'Error actualizando estado:',
            error
          )

          alert(
            `No se pudo actualizar el estado:\n\n${error.message}`
          )

          return
        }


        // Actualizar también el modal
        // si está abierto

        if (
          selectedActivity &&
          Number(
            selectedActivity.id
          ) ===
          Number(
            activityId
          )
        ) {

          setSelectedActivity(
            {
              ...selectedActivity,
              status:
                newStatus,
              updated_at:
                now,
              completed_at:
                newStatus ===
                'completed'
                  ? now
                  : null,
            }
          )
        }


        console.log(
          '✅ Estado actualizado correctamente',
          {
            activityId,
            previousStatus,
            newStatus,
          }
        )

      } catch (
        error
      ) {

        console.error(
          error
        )

        alert(
          'Ocurrió un error inesperado al actualizar el estado.'
        )

      } finally {

        setActivityUpdating(
          Number(activityId),
          false
        )
      }
    }


  // =======================================================
  // CAMBIAR PRIORIDAD
  // =======================================================

  const handlePriorityChange =
    async (
      activityId: number,
      newPriority: ActivityPriority
    ) => {

      const activity =
        activities.find(
          (
            item: any
          ) =>
            Number(
              item.id
            ) ===
            Number(
              activityId
            )
        )

      if (!activity) {
        return
      }


      if (
        !canEditActivity(
          activity
        )
      ) {

        alert(
          'No tienes permiso para modificar esta actividad.'
        )

        return
      }


      const previousPriority =
        activity.priority


      setActivityUpdating(
        Number(activityId),
        true
      )


      try {

        const now =
          new Date().toISOString()


        const {
          error,
        } =
          await supabase
            .from(
              'activities'
            )
            .update({
              priority:
                newPriority,

              updated_at:
                now,
            })
            .eq(
              'id',
              activityId
            )


        if (error) {

          console.error(
            'Error actualizando prioridad:',
            error
          )

          alert(
            `No se pudo actualizar la prioridad:\n\n${error.message}`
          )

          return
        }


        // Actualizar modal

        if (
          selectedActivity &&
          Number(
            selectedActivity.id
          ) ===
          Number(
            activityId
          )
        ) {

          setSelectedActivity(
            {
              ...selectedActivity,
              priority:
                newPriority,
              updated_at:
                now,
            }
          )
        }


        console.log(
          '✅ Prioridad actualizada correctamente',
          {
            activityId,
            previousPriority,
            newPriority,
          }
        )

      } catch (
        error
      ) {

        console.error(
          error
        )

        alert(
          'Ocurrió un error inesperado al actualizar la prioridad.'
        )

      } finally {

        setActivityUpdating(
          Number(activityId),
          false
        )
      }
    }


  // =======================================================
  // ELIMINAR ACTIVIDAD
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
            .from(
              'activities'
            )
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
          Number(
            activityId
          )
        ) {

          setSelectedActivity(
            null
          )
        }

      } catch (
        error
      ) {

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
    (
      activity: any
    ) => {

      markActivityAsSeen(
        Number(
          activity.id
        )
      )

      setSelectedActivity(
        activity
      )
    }


  // =======================================================
  // CAMBIAR FILTRO
  // =======================================================

  const handleFilterChange =
    (
      filter: ActivityFilter
    ) => {

      setStatusFilter(
        filter
      )
    }


  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {

    return (

      <div className="flex items-center justify-center py-12">

        <LoaderCircle
          className="mr-2 animate-spin text-brand-orange"
          size={24}
        />

        <p className="text-gray-500 dark:text-gray-400">
          Cargando actividades...
        </p>

      </div>
    )
  }


  // =======================================================
  // RENDER FILAS
  // =======================================================

  const renderRows =
    (
      list: any[]
    ) => {

      return list.map(
        (
          activity: any
        ) => {

          const isNew =
            newActivityIds.includes(
              Number(
                activity.id
              )
            )


          const canEdit =
            canEditActivity(
              activity
            )


          const isUpdating =
            updatingActivities.has(
              Number(
                activity.id
              )
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
              key={
                activity.id
              }
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

                    <div className="shrink-0">

                      <div className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-1 text-[10px] font-bold uppercase text-white">

                        <Sparkles
                          size={11}
                        />

                        Nueva

                      </div>

                    </div>
                  )}


                  <div className="min-w-0">

                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">

                      {
                        activity.title
                      }

                    </div>


                    {activity.description && (

                      <div className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">

                        {
                          activity.description
                        }

                      </div>
                    )}


                    {activity.recurrence_type &&
                      activity.recurrence_type !==
                        'none' && (

                      <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-[10px] font-semibold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">

                        <CalendarDays
                          size={11}
                        />

                        Fija

                        {activity.recurrence_days?.length
                          ? ' · ' +
                            activity.recurrence_days
                              .map(
                                (
                                  day: number
                                ) =>
                                  [
                                    'D',
                                    'L',
                                    'M',
                                    'X',
                                    'J',
                                    'V',
                                    'S',
                                  ][
                                    day
                                  ]
                              )
                              .join(
                                ', '
                              )
                          : ''}

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


              {/* FECHA / HORA */}

              <td className="px-4 py-4">

                <div className="text-sm text-gray-700 dark:text-gray-300">

                  {
                    formatDate(
                      activity.due_date
                    )
                  }

                </div>


                {activity.due_time && (

                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">

                    <Clock
                      size={12}
                    />

                    {
                      formatTime(
                        activity.due_time
                      )
                    }

                  </div>
                )}

              </td>


              {/* PRIORIDAD */}

              <td className="px-4 py-4">

                {canEdit ? (

                  <select
                    value={
                      activity.priority ||
                      'medium'
                    }
                    disabled={
                      isUpdating
                    }
                    onChange={(
                      e
                    ) =>
                      handlePriorityChange(
                        Number(
                          activity.id
                        ),
                        e.target.value as ActivityPriority
                      )
                    }
                    className={`
                      rounded-full
                      border
                      border-transparent
                      px-2.5
                      py-1
                      text-xs
                      font-semibold
                      outline-none
                      cursor-pointer
                      transition
                      disabled:cursor-wait
                      disabled:opacity-60
                      ${priorityStyles.badge}
                    `}
                  >

                    <option value="low">
                      Baja
                    </option>

                    <option value="medium">
                      Media
                    </option>

                    <option value="high">
                      Alta
                    </option>

                    <option value="urgent">
                      Urgente
                    </option>

                  </select>

                ) : (

                  <span
                    className={`
                      inline-flex
                      rounded-full
                      px-2.5
                      py-1
                      text-xs
                      font-semibold
                      ${priorityStyles.badge}
                    `}
                  >

                    {
                      priorityStyles.label ||
                      getPriorityLabel(
                        activity.priority
                      )
                    }

                  </span>

                )}

              </td>


              {/* ESTADO */}

              <td className="px-4 py-4">

                {canEdit ? (

                  <select
                    value={
                      activity.status ||
                      'pending'
                    }
                    disabled={
                      isUpdating
                    }
                    onChange={(
                      e
                    ) =>
                      handleStatusChange(
                        Number(
                          activity.id
                        ),
                        e.target.value as ActivityStatus
                      )
                    }
                    className={`
                      rounded-full
                      border
                      border-transparent
                      px-2.5
                      py-1
                      text-xs
                      font-semibold
                      outline-none
                      cursor-pointer
                      transition
                      disabled:cursor-wait
                      disabled:opacity-60
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
                      rounded-full
                      px-2.5
                      py-1
                      text-xs
                      font-semibold
                      ${statusStyles.badge}
                    `}
                  >

                    <span
                      className={`
                        h-1.5
                        w-1.5
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
                      inline-flex
                      items-center
                      gap-1
                      text-sm
                      font-semibold
                      text-blue-500
                      hover:text-blue-600
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
                      className="inline-flex items-center gap-1 text-sm font-semibold text-red-500 hover:text-red-600"
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
  // RENDER TABLA
  // =======================================================

  const renderTable =
    (
      list: any[],
      emptyMessage: string
    ) => {

      if (
        list.length === 0
      ) {

        return (

          <div className="rounded-xl border border-gray-200 bg-surface p-8 text-center dark:border-gray-800">

            <div className="mb-2 text-3xl">
              📋
            </div>

            <p className="font-semibold text-gray-900 dark:text-white">
              No hay actividades
            </p>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {
                emptyMessage
              }
            </p>

          </div>
        )
      }


      return (

        <div className="w-full overflow-x-auto rounded-xl border border-gray-200 bg-surface shadow-sm dark:border-gray-800">

          <table className="w-full">

            <thead className="border-b border-gray-200 dark:border-gray-800">

              <tr>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Actividad
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Asignado a
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Fecha / hora
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Prioridad
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Estado
                </th>

                <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-500">
                  Acciones
                </th>

              </tr>

            </thead>


            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">

              {
                renderRows(
                  list
                )
              }

            </tbody>

          </table>

        </div>
      )
    }


  // =======================================================
  // RENDER
  // =======================================================

  return (

    <div className="space-y-8">

      {/* =================================================
          SELECTOR DE FECHA
      ================================================= */}

      <section>

        <div className="rounded-2xl border border-gray-200 bg-surface p-4 shadow-sm dark:border-gray-800">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <CalendarDays
                  size={20}
                  className="text-brand-orange"
                />

                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Actividades
                </h2>

              </div>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Consulta actividades de cualquier día.
              </p>

            </div>


            <div className="flex flex-wrap items-center gap-2">

              <button
                type="button"
                onClick={() =>
                  changeDay(-1)
                }
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >

                <ChevronLeft
                  size={16}
                />

                Anterior

              </button>


              <label className="relative">

                <span className="sr-only">
                  Seleccionar fecha
                </span>

                <input
                  type="date"
                  value={
                    selectedDate
                  }
                  onChange={(
                    e
                  ) =>
                    handleDateChange(
                      e.target.value
                    )
                  }
                  className="rounded-lg border border-gray-200 bg-background px-3 py-2 text-sm font-medium text-gray-900 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 dark:border-gray-700 dark:text-white"
                />

              </label>


              <button
                type="button"
                onClick={
                  goToToday
                }
                className={`
                  rounded-lg
                  px-3
                  py-2
                  text-sm
                  font-semibold
                  transition
                  ${
                    selectedDate ===
                    today
                      ? 'bg-brand-orange text-white'
                      : 'border border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
                  }
                `}
              >
                Hoy
              </button>


              <button
                type="button"
                onClick={() =>
                  changeDay(1)
                }
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >

                Siguiente

                <ChevronRight
                  size={16}
                />

              </button>

            </div>

          </div>

        </div>

      </section>


      {/* =================================================
          CONTADORES / FILTROS
      ================================================= */}

      <section>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">

          {/* TOTAL */}

          <button
            type="button"
            onClick={() =>
              handleFilterChange(
                'all'
              )
            }
            className={`
              rounded-xl
              border
              bg-surface
              p-4
              text-left
              shadow-sm
              transition
              dark:border-gray-800
              ${
                statusFilter ===
                'all'
                  ? 'border-blue-500 ring-2 ring-blue-500/20'
                  : 'border-gray-200 hover:border-blue-300 dark:hover:border-blue-800'
              }
            `}
          >

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total
                </p>

                <p className="mt-1 text-3xl font-bold text-blue-500">
                  {
                    dayStats.total
                  }
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  {
                    statusFilter ===
                    'all'
                      ? 'Mostrando todas'
                      : 'Ver todas'
                  }
                </p>

              </div>


              <div className="rounded-lg bg-blue-500/10 p-2">

                <CalendarDays
                  size={20}
                  className="text-blue-500"
                />

              </div>

            </div>

          </button>


          {/* PENDIENTES */}

          <button
            type="button"
            onClick={() =>
              handleFilterChange(
                'pending'
              )
            }
            className={`
              rounded-xl
              border
              bg-surface
              p-4
              text-left
              shadow-sm
              transition
              dark:border-gray-800
              ${
                statusFilter ===
                'pending'
                  ? 'border-orange-500 ring-2 ring-orange-500/20'
                  : 'border-gray-200 hover:border-orange-300 dark:hover:border-orange-800'
              }
            `}
          >

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Pendientes
                </p>

                <p className="mt-1 text-3xl font-bold text-orange-500">
                  {
                    dayStats.pending
                  }
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  {
                    statusFilter ===
                    'pending'
                      ? 'Mostrando pendientes'
                      : 'Ver pendientes'
                  }
                </p>

              </div>


              <div className="rounded-lg bg-orange-500/10 p-2">

                <Circle
                  size={20}
                  className="text-orange-500"
                />

              </div>

            </div>

          </button>


          {/* EN PROGRESO */}

          <button
            type="button"
            onClick={() =>
              handleFilterChange(
                'in_progress'
              )
            }
            className={`
              rounded-xl
              border
              bg-surface
              p-4
              text-left
              shadow-sm
              transition
              dark:border-gray-800
              ${
                statusFilter ===
                'in_progress'
                  ? 'border-yellow-500 ring-2 ring-yellow-500/20'
                  : 'border-gray-200 hover:border-yellow-300 dark:hover:border-yellow-800'
              }
            `}
          >

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  En progreso
                </p>

                <p className="mt-1 text-3xl font-bold text-yellow-500">
                  {
                    dayStats.inProgress
                  }
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  {
                    statusFilter ===
                    'in_progress'
                      ? 'Mostrando en progreso'
                      : 'Ver en progreso'
                  }
                </p>

              </div>


              <div className="rounded-lg bg-yellow-500/10 p-2">

                <LoaderCircle
                  size={20}
                  className="text-yellow-500"
                />

              </div>

            </div>

          </button>


          {/* COMPLETADAS */}

          <button
            type="button"
            onClick={() =>
              handleFilterChange(
                'completed'
              )
            }
            className={`
              rounded-xl
              border
              bg-surface
              p-4
              text-left
              shadow-sm
              transition
              dark:border-gray-800
              ${
                statusFilter ===
                'completed'
                  ? 'border-green-500 ring-2 ring-green-500/20'
                  : 'border-gray-200 hover:border-green-300 dark:hover:border-green-800'
              }
            `}
          >

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Completadas
                </p>

                <p className="mt-1 text-3xl font-bold text-green-500">
                  {
                    dayStats.completed
                  }
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  {
                    statusFilter ===
                    'completed'
                      ? 'Mostrando completadas'
                      : 'Ver completadas'
                  }
                </p>

              </div>


              <div className="rounded-lg bg-green-500/10 p-2">

                <CheckCircle2
                  size={20}
                  className="text-green-500"
                />

              </div>

            </div>

          </button>

        </div>

      </section>


      {/* =================================================
          INDICADOR DE FILTRO
      ================================================= */}

      {statusFilter !==
        'all' && (

        <div className="flex items-center justify-between rounded-lg border border-brand-orange/20 bg-brand-orange/5 px-4 py-3">

          <div className="text-sm text-gray-700 dark:text-gray-300">

            Mostrando únicamente:

            <span className="ml-1 font-bold text-brand-orange">

              {statusFilter ===
                'pending' &&
                'Pendientes'}

              {statusFilter ===
                'in_progress' &&
                'En progreso'}

              {statusFilter ===
                'completed' &&
                'Completadas'}

            </span>

          </div>


          <button
            type="button"
            onClick={() =>
              handleFilterChange(
                'all'
              )
            }
            className="text-sm font-semibold text-brand-orange hover:underline"
          >
            Ver todas
          </button>

        </div>

      )}


      {/* =================================================
          ACTIVIDADES DEL DÍA
      ================================================= */}

      <section>

        <div className="mb-4 flex items-center justify-between">

          <div>

            <div className="flex items-center gap-2">

              <CalendarDays
                size={20}
                className="text-brand-orange"
              />

              <h2 className="text-xl font-bold capitalize text-gray-900 dark:text-white">

                {
                  selectedDate ===
                  today
                    ? 'Actividades de hoy'
                    : 'Actividades del día'
                }

              </h2>

            </div>


            <p className="mt-1 text-sm capitalize text-gray-500 dark:text-gray-400">

              {
                formatLongDate(
                  selectedDate
                )
              }

            </p>

          </div>


          <div className="rounded-full bg-brand-orange/10 px-3 py-1 text-sm font-semibold text-brand-orange">

            {
              filteredDayActivities.length
            }

            {' '}

            {
              filteredDayActivities.length ===
              1
                ? 'actividad'
                : 'actividades'
            }

          </div>

        </div>


        {
          renderTable(
            filteredDayActivities,
            statusFilter ===
              'all'
              ? (
                  selectedDate ===
                  today
                    ? 'No tienes actividades programadas para hoy.'
                    : `No tienes actividades programadas para el ${formatDate(selectedDate)}.`
                )
              : `No hay actividades con estado "${getStatusLabel(statusFilter)}" para este día.`
          )
        }

      </section>


      {/* =================================================
          ACTIVIDADES DEL MES
      ================================================= */}

      <section>

        <div className="mb-4 flex items-center justify-between">

          <div>

            <div className="flex items-center gap-2">

              <CalendarDays
                size={20}
                className="text-purple-500"
              />

              <h2 className="text-xl font-bold capitalize text-gray-900 dark:text-white">

                Todas las actividades de{' '}

                {
                  formatMonthTitle(
                    selectedDateObject
                  )
                }

              </h2>

            </div>


            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">

              Todas las actividades programadas durante este mes.

            </p>

          </div>


          <div className="rounded-full bg-purple-500/10 px-3 py-1 text-sm font-semibold text-purple-600 dark:text-purple-400">

            {
              monthActivities.length
            }

          </div>

        </div>


        {
          renderTable(
            monthActivities,
            'No hay actividades programadas durante este mes.'
          )
        }

      </section>


      {/* =================================================
          MODAL DETALLE
      ================================================= */}

      {
        selectedActivity && (

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

        )
      }

    </div>
  )
}