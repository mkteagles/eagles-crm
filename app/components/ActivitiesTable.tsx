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

  const year =
    date.getFullYear()

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      '0'
    )

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      '0'
    )

  return `${year}-${month}-${day}`
}

// =========================================================
// OBTENER MES
// =========================================================

function getMonthKey(
  date: Date
): string {

  const year =
    date.getFullYear()

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      '0'
    )

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
  ] =
    dateString
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
      return status ||
        'Sin estado'
  }
}

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
  } =
    useActivities()

  // =======================================================
  // USUARIO
  // =======================================================

  const {
    user,
  } =
    useCurrentUser()

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
  ] =
    useState<any | null>(
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
  ] =
    useState(
      today
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
  // CAMBIAR ESTADO
  // =======================================================

  const handleStatusChange =
    async (
      activityId: number,
      newStatus: ActivityStatus
    ) => {

      const previousActivity =
        activities.find(
          (
            activity: any
          ) =>
            Number(
              activity.id
            ) ===
            Number(
              activityId
            )
        )

      try {

        const {
          error,
        } =
          await supabase
            .from(
              'activities'
            )
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

              {/* =====================================
                  ACTIVIDAD
              ===================================== */}

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
                  FECHA / HORA
              ===================================== */}

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

              {/* =====================================
                  PRIORIDAD
              ===================================== */}

              <td className="px-4 py-4">

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
                      border-0
                      px-2.5
                      py-1
                      text-xs
                      font-semibold
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
                      inline-flex
                      items-center
                      gap-1
                      text-sm
                      font-semibold
                      text-blue-500
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
          SELECTOR ÚNICO DE FECHA
      ================================================= */}

      <section>

        <div className="rounded-2xl border border-gray-200 bg-surface p-4 shadow-sm dark:border-gray-800">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            {/* =========================================
                INFORMACIÓN
            ========================================= */}

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

            {/* =========================================
                CONTROLES DE FECHA
            ========================================= */}

            <div className="flex flex-wrap items-center gap-2">

              {/* ANTERIOR */}

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

              {/* FECHA */}

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

              {/* HOY */}

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

              {/* SIGUIENTE */}

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
          CONTADORES
          
          IMPORTANTE:
          YA NO SON BOTONES.
          SOLO INFORMACIÓN.
      ================================================= */}

      <section>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">

          {/* TOTAL */}

          <div className="rounded-xl border border-gray-200 bg-surface p-4 shadow-sm dark:border-gray-800">

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
                  Este día
                </p>

              </div>

              <div className="rounded-lg bg-blue-500/10 p-2">
                <CalendarDays
                  size={20}
                  className="text-blue-500"
                />
              </div>

            </div>

          </div>

          {/* PENDIENTES */}

          <div className="rounded-xl border border-gray-200 bg-surface p-4 shadow-sm dark:border-gray-800">

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
                  Por realizar
                </p>

              </div>

              <div className="rounded-lg bg-orange-500/10 p-2">
                <Circle
                  size={20}
                  className="text-orange-500"
                />
              </div>

            </div>

          </div>

          {/* EN PROGRESO */}

          <div className="rounded-xl border border-gray-200 bg-surface p-4 shadow-sm dark:border-gray-800">

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
                  Trabajando ahora
                </p>

              </div>

              <div className="rounded-lg bg-yellow-500/10 p-2">
                <LoaderCircle
                  size={20}
                  className="text-yellow-500"
                />
              </div>

            </div>

          </div>

          {/* COMPLETADAS */}

          <div className="rounded-xl border border-gray-200 bg-surface p-4 shadow-sm dark:border-gray-800">

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
                  Finalizadas
                </p>

              </div>

              <div className="rounded-lg bg-green-500/10 p-2">
                <CheckCircle2
                  size={20}
                  className="text-green-500"
                />
              </div>

            </div>

          </div>

        </div>

      </section>

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
              selectedDayActivities.length
            }

            {' '}

            {
              selectedDayActivities.length ===
              1
                ? 'actividad'
                : 'actividades'
            }

          </div>

        </div>

        {
          renderTable(
            selectedDayActivities,
            selectedDate ===
              today
              ? 'No tienes actividades programadas para hoy.'
              : `No tienes actividades programadas para el ${formatDate(selectedDate)}.`
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