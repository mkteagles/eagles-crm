'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useActivities, useCurrentUser } from '@/lib/marketing-hooks'
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  X,
  Save,
  Loader,
  Pencil,
} from 'lucide-react'
import ActivityDetailModal from './ActivityDetailModal'

export default function CalendarActivities() {
  const supabase = createClient()

  const { activities, loading } = useActivities()
  const { user } = useCurrentUser()

  const [currentDate, setCurrentDate] = useState(new Date())

  const [selectedActivity, setSelectedActivity] =
    useState<any | null>(null)

  const [showDateModal, setShowDateModal] =
    useState(false)

  const [newDate, setNewDate] = useState('')

  const [savingDate, setSavingDate] =
    useState(false)

  // =========================================================
  // PERMISOS PARA CAMBIAR FECHA
  // =========================================================

  /*
   * Hugo = admin
   * Ursula = executor
   *
   * Hugo puede cambiar cualquier actividad.
   *
   * Ursula únicamente puede cambiar actividades
   * que estén asignadas a ella.
   *
   * Marcos NO puede modificar fechas.
   */

  const canEditActivityDate = (
    activity: any
  ) => {
    if (!user) return false

    // Hugo
    if (user.role === 'admin') {
      return true
    }

    // Ursula
    if (
      user.role === 'executor' &&
      user.full_name === 'Ursula' &&
      activity.assigned_to === user.id
    ) {
      return true
    }

    return false
  }

  // =========================================================
  // DÍAS DEL MES
  // =========================================================

  const getDaysInMonth = (date: Date) => {
    return new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    ).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      1
    ).getDay()
  }

  // =========================================================
  // ABRIR ACTIVIDAD
  // =========================================================

  const handleActivityClick = (
    activity: any
  ) => {
    setSelectedActivity(activity)
  }

  // =========================================================
  // ABRIR MODAL PARA CAMBIAR FECHA
  // =========================================================

  const openDateModal = (
    activity: any
  ) => {
    if (!canEditActivityDate(activity)) {
      return
    }

    setSelectedActivity(activity)

    const currentDueDate =
      activity.due_date
        ? String(activity.due_date).split('T')[0]
        : ''

    setNewDate(currentDueDate)

    setShowDateModal(true)
  }

  // =========================================================
  // CERRAR MODAL DE FECHA
  // =========================================================

  const closeDateModal = () => {
    if (savingDate) return

    setShowDateModal(false)
    setNewDate('')
  }

  // =========================================================
  // GUARDAR NUEVA FECHA
  // =========================================================

  const handleSaveDate = async () => {
    if (!selectedActivity?.id) {
      alert('No se encontró la actividad.')
      return
    }

    if (!newDate) {
      alert('Selecciona una fecha.')
      return
    }

    if (
      !canEditActivityDate(
        selectedActivity
      )
    ) {
      alert(
        'No tienes permiso para cambiar la fecha de esta actividad.'
      )
      return
    }

    setSavingDate(true)

    try {
      const { error } = await supabase
        .from('activities')
        .update({
          due_date: newDate,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          selectedActivity.id
        )

      if (error) {
        console.error(
          'Error actualizando fecha:',
          error
        )

        alert(
          `No se pudo actualizar la fecha: ${error.message}`
        )

        return
      }

      // Actualizar actividad seleccionada
      setSelectedActivity(
        (prev: any) =>
          prev
            ? {
                ...prev,
                due_date: newDate,
              }
            : null
      )

      setShowDateModal(false)
      setNewDate('')

      /*
       * useActivities tiene realtime,
       * por lo que el calendario se actualizará
       * automáticamente después del UPDATE.
       */
    } catch (error) {
      console.error(
        'Error actualizando fecha:',
        error
      )

      alert(
        'Ocurrió un error al actualizar la fecha.'
      )
    } finally {
      setSavingDate(false)
    }
  }

  // =========================================================
  // CONSTRUIR CALENDARIO
  // =========================================================

  const days: Array<number | null> = []

  const daysInMonth =
    getDaysInMonth(currentDate)

  const firstDay =
    getFirstDayOfMonth(currentDate)

  for (
    let i = 0;
    i < firstDay;
    i++
  ) {
    days.push(null)
  }

  for (
    let i = 1;
    i <= daysInMonth;
    i++
  ) {
    days.push(i)
  }

  // =========================================================
  // AGRUPAR ACTIVIDADES POR FECHA
  // =========================================================

  const groupedActivities: Record<
    string,
    any[]
  > = {}

  activities.forEach(
    (activity: any) => {
      if (
        !activity ||
        !activity.due_date
      ) {
        return
      }

      const dateStr = String(
        activity.due_date
      ).split('T')[0]

      if (!dateStr) {
        return
      }

      if (!groupedActivities[dateStr]) {
        groupedActivities[dateStr] = []
      }

      groupedActivities[
        dateStr
      ].push(activity)
    }
  )

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* =================================================
            CALENDARIO
        ================================================= */}

        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-lg shadow p-6">

          {/* ENCABEZADO */}

          <div className="flex items-center justify-between mb-6">

            <button
              type="button"
              onClick={() => {
                setCurrentDate(
                  new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() - 1,
                    1
                  )
                )
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
              {currentDate.toLocaleDateString(
                'es-MX',
                {
                  month: 'long',
                  year: 'numeric',
                }
              )}
            </h2>

            <button
              type="button"
              onClick={() => {
                setCurrentDate(
                  new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() + 1,
                    1
                  )
                )
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

          </div>

          {/* DÍAS DE LA SEMANA */}

          <div className="grid grid-cols-7 gap-2 mb-2">

            {[
              'Dom',
              'Lun',
              'Mar',
              'Mié',
              'Jue',
              'Vie',
              'Sab',
            ].map((dayName) => (

              <div
                key={dayName}
                className="text-center font-semibold text-gray-600 dark:text-gray-400 text-sm py-2"
              >
                {dayName}
              </div>

            ))}

          </div>

          {/* DÍAS DEL MES */}

          <div className="grid grid-cols-7 gap-2">

            {days.map(
              (day, index) => {

                let dateStr = ''

                if (
                  day !== null
                ) {
                  const year =
                    currentDate.getFullYear()

                  const month =
                    String(
                      currentDate.getMonth() +
                        1
                    ).padStart(2, '0')

                  const dayNumber =
                    String(
                      day
                    ).padStart(
                      2,
                      '0'
                    )

                  dateStr =
                    `${year}-${month}-${dayNumber}`
                }

                const dayActivities =
                  dateStr !== ''
                    ? groupedActivities[
                        dateStr
                      ] || []
                    : []

                return (
                  <div
                    key={index}
                    className="min-h-[120px] border border-gray-200 dark:border-gray-700 rounded-lg p-2 flex flex-col bg-gray-50 dark:bg-gray-800"
                  >

                    {day !== null && (
                      <>

                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {day}
                        </span>

                        <div className="space-y-1 overflow-y-auto">

                          {dayActivities.map(
                            (
                              activity: any
                            ) => {

                              const canEdit =
                                canEditActivityDate(
                                  activity
                                )

                              return (
                                <div
                                  key={String(
                                    activity.id
                                  )}
                                  className="group"
                                >

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleActivityClick(
                                        activity
                                      )
                                    }
                                    className="w-full text-left text-xs font-medium px-2 py-1.5 rounded-md bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition truncate"
                                    title={
                                      activity.title ||
                                      'Sin título'
                                    }
                                  >
                                    {activity.title ||
                                      'Sin título'}
                                  </button>

                                  {canEdit && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openDateModal(
                                          activity
                                        )
                                      }
                                      className="mt-1 w-full flex items-center justify-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition"
                                    >
                                      <Pencil
                                        size={
                                          11
                                        }
                                      />

                                      Cambiar fecha
                                    </button>
                                  )}

                                </div>
                              )
                            }
                          )}

                        </div>

                      </>
                    )}

                  </div>
                )
              }
            )}

          </div>

        </div>

        {/* =================================================
            PANEL DERECHO
        ================================================= */}

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">

          <div className="flex items-center gap-2 mb-4">

            <CalendarDays
              size={20}
              className="text-blue-500"
            />

            <h3 className="font-bold text-gray-900 dark:text-white">
              Actividades
            </h3>

          </div>

          {loading ? (

            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">

              <Loader
                size={18}
                className="animate-spin"
              />

              <p>
                Cargando...
              </p>

            </div>

          ) : Object.keys(
              groupedActivities
            ).length === 0 ? (

            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Sin actividades
            </p>

          ) : (

            <div className="space-y-3">

              {Object.entries(
                groupedActivities
              )
                .sort(
                  ([dateA], [dateB]) =>
                    dateA.localeCompare(
                      dateB
                    )
                )
                .slice(0, 8)
                .map(
                  ([date, acts]) => (

                    <div
                      key={date}
                      className="space-y-2"
                    >

                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        {date}
                      </div>

                      {acts.map(
                        (
                          activity: any
                        ) => {

                          const canEdit =
                            canEditActivityDate(
                              activity
                            )

                          return (
                            <div
                              key={String(
                                activity.id
                              )}
                              className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3"
                            >

                              <button
                                type="button"
                                onClick={() =>
                                  handleActivityClick(
                                    activity
                                  )
                                }
                                className="w-full text-left"
                              >

                                <div className="font-medium text-gray-900 dark:text-white text-sm">
                                  {activity.title ||
                                    'Sin título'}
                                </div>

                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {activity.assigned_to_name ||
                                    'Sin asignar'}
                                </div>

                              </button>

                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openDateModal(
                                      activity
                                    )
                                  }
                                  className="mt-2 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  <Pencil
                                    size={
                                      12
                                    }
                                  />

                                  Cambiar fecha
                                </button>
                              )}

                            </div>
                          )
                        }
                      )}

                    </div>

                  )
                )}

            </div>

          )}

        </div>

      </div>

      {/* =====================================================
          MODAL DETALLE DE ACTIVIDAD
      ===================================================== */}

      {selectedActivity &&
        !showDateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

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

          </div>
        )}

      {/* =====================================================
          MODAL CAMBIAR FECHA
      ===================================================== */}

      {showDateModal &&
        selectedActivity && (

          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">

            <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-700">

              {/* HEADER */}

              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">

                <div>

                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Cambiar fecha
                  </h2>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {selectedActivity.title}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={
                    closeDateModal
                  }
                  disabled={
                    savingDate
                  }
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
                >
                  <X size={20} />
                </button>

              </div>

              {/* CONTENIDO */}

              <div className="p-5">

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nueva fecha
                </label>

                <input
                  type="date"
                  value={newDate}
                  onChange={(e) =>
                    setNewDate(
                      e.target.value
                    )
                  }
                  disabled={
                    savingDate
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-sm text-blue-700 dark:text-blue-300">
                  La actividad se moverá a la nueva fecha en el calendario.
                </div>

              </div>

              {/* BOTONES */}

              <div className="flex gap-3 p-5 border-t border-gray-200 dark:border-gray-700">

                <button
                  type="button"
                  onClick={
                    closeDateModal
                  }
                  disabled={
                    savingDate
                  }
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold transition disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    handleSaveDate
                  }
                  disabled={
                    savingDate ||
                    !newDate
                  }
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >

                  {savingDate ? (
                    <>
                      <Loader
                        size={17}
                        className="animate-spin"
                      />

                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={17} />

                      Guardar fecha
                    </>
                  )}

                </button>

              </div>

            </div>

          </div>
        )}

    </>
  )
}