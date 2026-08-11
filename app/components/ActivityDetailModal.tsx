'use client'

import {
  useEffect,
  useState,
} from 'react'

import {
  createClient,
} from '@/lib/supabase/client'

import {
  X,
  Save,
  Trash2,
  Calendar,
  Clock,
  User,
  Flag,
  FileText,
  Repeat,
} from 'lucide-react'

import {
  ActivityStatus,
} from '@/lib/marketing-types'


// =========================================================
// TIPOS
// =========================================================

type Props = {
  activity: any
  currentUserRole?: string
  currentUserId?: string
  onClose: () => void
}


type RecurrenceType =
  | 'none'
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'


const WEEK_DAYS = [
  {
    value: 1,
    label: 'L',
    name: 'Lunes',
  },
  {
    value: 2,
    label: 'M',
    name: 'Martes',
  },
  {
    value: 3,
    label: 'X',
    name: 'Miércoles',
  },
  {
    value: 4,
    label: 'J',
    name: 'Jueves',
  },
  {
    value: 5,
    label: 'V',
    name: 'Viernes',
  },
  {
    value: 6,
    label: 'S',
    name: 'Sábado',
  },
  {
    value: 0,
    label: 'D',
    name: 'Domingo',
  },
]


// =========================================================
// COMPONENTE
// =========================================================

export default function ActivityDetailModal({
  activity,
  currentUserRole,
  currentUserId,
  onClose,
}: Props) {

  const supabase =
    createClient()


  const isAdmin =
    currentUserRole ===
    'admin'


  // =======================================================
  // ESTADOS
  // =======================================================

  const [
    title,
    setTitle,
  ] =
    useState(
      activity?.title ||
      ''
    )


  const [
    description,
    setDescription,
  ] =
    useState(
      activity?.description ||
      ''
    )


  const [
    assignedTo,
    setAssignedTo,
  ] =
    useState(
      activity?.assigned_to ||
      ''
    )


  const [
    dueDate,
    setDueDate,
  ] =
    useState(
      activity?.due_date
        ? String(
            activity.due_date
          ).slice(0, 10)
        : ''
    )


  const [
    dueTime,
    setDueTime,
  ] =
    useState(
      activity?.due_time
        ? String(
            activity.due_time
          ).slice(0, 5)
        : ''
    )


  const [
    priority,
    setPriority,
  ] =
    useState(
      activity?.priority ||
      'medium'
    )


  const [
    status,
    setStatus,
  ] =
    useState<ActivityStatus>(
      activity?.status ||
      'pending'
    )


  const [
    recurrence,
    setRecurrence,
  ] =
    useState<RecurrenceType>(
      activity?.recurrence_type ||
      'none'
    )


  const [
    selectedDays,
    setSelectedDays,
  ] =
    useState<number[]>(
      Array.isArray(
        activity?.recurrence_days
      )
        ? activity.recurrence_days.map(
            (day: any) =>
              Number(day)
          )
        : []
    )


  const [
    recurrenceEndDate,
    setRecurrenceEndDate,
  ] =
    useState(
      activity?.recurrence_end_date
        ? String(
            activity.recurrence_end_date
          ).slice(0, 10)
        : ''
    )


  const [
    users,
    setUsers,
  ] =
    useState<any[]>([])


  const [
    saving,
    setSaving,
  ] =
    useState(false)


  const [
    deleting,
    setDeleting,
  ] =
    useState(false)


  // =======================================================
  // CARGAR USUARIOS
  // =======================================================

  useEffect(() => {

    if (!isAdmin) {
      return
    }


    const loadUsers =
      async () => {

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
                'id, full_name'
              )
              .order(
                'full_name',
                {
                  ascending: true,
                }
              )


          if (error) {

            console.error(
              'Error cargando usuarios:',
              error
            )

            return
          }


          setUsers(
            data || []
          )

        } catch (error) {

          console.error(
            'Error cargando usuarios:',
            error
          )

        }

      }


    loadUsers()

  }, [
    isAdmin,
    supabase,
  ])


  // =======================================================
  // ESC
  // =======================================================

  useEffect(() => {

    const handleKeyDown =
      (
        event: KeyboardEvent
      ) => {

        if (
          event.key ===
          'Escape'
        ) {

          onClose()

        }

      }


    document.addEventListener(
      'keydown',
      handleKeyDown
    )


    return () => {

      document.removeEventListener(
        'keydown',
        handleKeyDown
      )

    }

  }, [
    onClose,
  ])


  // =======================================================
  // CAMBIAR DÍA
  // =======================================================

  const toggleDay =
    (
      day: number
    ) => {

      setSelectedDays(
        previous => {

          if (
            previous.includes(
              day
            )
          ) {

            return previous.filter(
              item =>
                item !== day
            )

          }


          return [
            ...previous,
            day,
          ].sort(
            (a, b) =>
              a - b
          )

        }
      )

    }


  // =======================================================
  // GUARDAR
  // =======================================================

  const handleSave =
    async () => {

      if (!isAdmin) {
        return
      }


      if (
        !title.trim()
      ) {

        alert(
          'El título de la actividad es obligatorio.'
        )

        return

      }


      if (!dueDate) {

        alert(
          'La fecha de la actividad es obligatoria.'
        )

        return

      }


      if (
        (
          recurrence ===
            'weekly' ||
          recurrence ===
            'biweekly'
        ) &&
        selectedDays.length === 0
      ) {

        alert(
          'Selecciona al menos un día de la semana para la actividad fija.'
        )

        return

      }


      if (
        recurrence !==
          'none' &&
        recurrenceEndDate &&
        recurrenceEndDate <
          dueDate
      ) {

        alert(
          'La fecha final de repetición no puede ser anterior a la fecha inicial.'
        )

        return

      }


      setSaving(true)


      try {

        const updateData: Record<
          string,
          any
        > = {

          title:
            title.trim(),

          description:
            description.trim() ||
            null,

          assigned_to:
            assignedTo ||
            null,

          due_date:
            dueDate,

          due_time:
            dueTime ||
            null,

          priority,

          status,

          recurrence_type:
            recurrence,

          recurrence_days:
            (
              recurrence ===
                'weekly' ||
              recurrence ===
                'biweekly'
            ) &&
            selectedDays.length
              ? selectedDays
              : null,

          recurrence_end_date:
            recurrence !==
              'none'
              ? (
                  recurrenceEndDate ||
                  null
                )
              : null,

          updated_at:
            new Date()
              .toISOString(),

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
              activity.id
            )


        if (error) {

          console.error(
            'Error actualizando actividad:',
            error
          )

          alert(
            `No se pudo guardar la actividad:\n\n${error.message}`
          )

          return

        }


        console.log(
          '✅ Actividad actualizada:',
          activity.id
        )


        onClose()

        /*
         * Recargamos la página para que
         * la tabla refleje inmediatamente
         * la nueva fecha/hora.
         */
        window.location.reload()

      } catch (error) {

        console.error(
          'Error actualizando actividad:',
          error
        )

        alert(
          'Ocurrió un error al guardar la actividad.'
        )

      } finally {

        setSaving(false)

      }

    }


  // =======================================================
  // ELIMINAR
  // =======================================================

  const handleDelete =
    async () => {

      if (!isAdmin) {
        return
      }


      const confirmed =
        window.confirm(
          `¿Seguro que quieres eliminar "${activity.title}"?\n\nEsta acción no se puede deshacer.`
        )


      if (!confirmed) {
        return
      }


      setDeleting(true)


      try {

        const {
          error,
        } =
          await supabase
            .from(
              'activities'
            )
            .delete()
            .eq(
              'id',
              activity.id
            )


        if (error) {

          console.error(
            'Error eliminando actividad:',
            error
          )

          alert(
            `No se pudo eliminar la actividad:\n\n${error.message}`
          )

          return

        }


        console.log(
          '🗑️ Actividad eliminada:',
          activity.id
        )


        onClose()

        window.location.reload()

      } catch (error) {

        console.error(
          'Error eliminando actividad:',
          error
        )

        alert(
          'Ocurrió un error al eliminar la actividad.'
        )

      } finally {

        setDeleting(false)

      }

    }


  // =======================================================
  // NOMBRE RECURRENCIA
  // =======================================================

  const recurrenceLabel =
    () => {

      switch (
        recurrence
      ) {

        case 'daily':
          return 'Todos los días'

        case 'weekly':
          return 'Cada semana'

        case 'biweekly':
          return 'Cada 2 semanas'

        case 'monthly':
          return 'Cada mes'

        default:
          return 'No repetir'

      }

    }


  // =======================================================
  // RENDER
  // =======================================================

  return (

    <div
      className="
        fixed
        inset-0
        z-[9999]
        flex
        items-center
        justify-center
        p-4
      "
      onMouseDown={(
        event
      ) => {

        if (
          event.target ===
          event.currentTarget
        ) {

          onClose()

        }

      }}
    >

      {/* BACKDROP */}

      <div
        className="
          absolute
          inset-0
          bg-black/60
          backdrop-blur-sm
        "
      />


      {/* VENTANA */}

      <div
        className="
          relative
          z-10
          w-full
          max-w-2xl
          max-h-[92vh]
          overflow-y-auto
          rounded-2xl
          bg-white
          dark:bg-gray-900
          shadow-2xl
          border
          border-gray-200
          dark:border-gray-800
        "
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="
            sticky
            top-0
            z-20
            flex
            items-center
            justify-between
            px-6
            py-4
            border-b
            border-gray-200
            dark:border-gray-800
            bg-white
            dark:bg-gray-900
          "
        >

          <div>

            <h2
              className="
                text-lg
                font-bold
                text-gray-900
                dark:text-white
              "
            >

              {isAdmin
                ? 'Editar actividad'
                : 'Detalle de actividad'}

            </h2>


            <p
              className="
                mt-0.5
                text-xs
                text-gray-500
              "
            >

              ID: {activity.id}

            </p>

          </div>


          <button
            type="button"
            onClick={onClose}
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              text-gray-500
              hover:bg-gray-100
              hover:text-gray-900
              dark:hover:bg-gray-800
              dark:hover:text-white
              transition
            "
          >

            <X
              size={20}
            />

          </button>

        </div>


        {/* =================================================
            CONTENIDO
        ================================================= */}

        <div className="p-6 space-y-6">

          {/* =================================================
              TÍTULO
          ================================================= */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">

              Actividad

            </label>


            {isAdmin ? (

              <input
                type="text"
                value={title}
                onChange={(e) =>
                  setTitle(
                    e.target.value
                  )
                }
                className="
                  w-full
                  rounded-lg
                  border
                  border-gray-300
                  dark:border-gray-700
                  bg-white
                  dark:bg-gray-800
                  px-3
                  py-2.5
                  text-sm
                  text-gray-900
                  dark:text-white
                  outline-none
                  focus:ring-2
                  focus:ring-blue-500
                "
              />

            ) : (

              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">

                {activity.title}

              </div>

            )}

          </div>


          {/* =================================================
              DESCRIPCIÓN
          ================================================= */}

          <div>

            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">

              <FileText
                size={15}
              />

              Descripción

            </label>


            {isAdmin ? (

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                rows={4}
                className="
                  w-full
                  resize-none
                  rounded-lg
                  border
                  border-gray-300
                  dark:border-gray-700
                  bg-white
                  dark:bg-gray-800
                  px-3
                  py-2.5
                  text-sm
                  text-gray-900
                  dark:text-white
                  outline-none
                  focus:ring-2
                  focus:ring-blue-500
                "
                placeholder="Descripción de la actividad..."
              />

            ) : (

              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">

                {activity.description ||
                  'Sin descripción'}

              </div>

            )}

          </div>


          {/* =================================================
              ASIGNADO / FECHA
          ================================================= */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* ASIGNADO */}

            <div>

              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">

                <User
                  size={15}
                />

                Asignado a

              </label>


              {isAdmin ? (

                <select
                  value={
                    assignedTo
                  }
                  onChange={(e) =>
                    setAssignedTo(
                      e.target.value
                    )
                  }
                  className="
                    w-full
                    rounded-lg
                    border
                    border-gray-300
                    dark:border-gray-700
                    bg-white
                    dark:bg-gray-800
                    px-3
                    py-2.5
                    text-sm
                    text-gray-900
                    dark:text-white
                  "
                >

                  <option value="">
                    Sin asignar
                  </option>


                  {users.map(
                    (
                      user
                    ) => (

                      <option
                        key={
                          user.id
                        }
                        value={
                          user.id
                        }
                      >

                        {
                          user.full_name
                        }

                      </option>

                    )
                  )}

                </select>

              ) : (

                <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300">

                  {
                    activity.assigned_to_name ||
                    activity.assigned_to ||
                    'Sin asignar'
                  }

                </div>

              )}

            </div>


            {/* FECHA */}

            <div>

              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">

                <Calendar
                  size={15}
                />

                Día

              </label>


              {isAdmin ? (

                <input
                  type="date"
                  value={
                    dueDate
                  }
                  onChange={(e) =>
                    setDueDate(
                      e.target.value
                    )
                  }
                  className="
                    w-full
                    rounded-lg
                    border
                    border-gray-300
                    dark:border-gray-700
                    bg-white
                    dark:bg-gray-800
                    px-3
                    py-2.5
                    text-sm
                    text-gray-900
                    dark:text-white
                  "
                />

              ) : (

                <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300">

                  {
                    activity.due_date ||
                    'Sin fecha'
                  }

                </div>

              )}

            </div>


            {/* HORA */}

            <div>

              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">

                <Clock
                  size={15}
                />

                Horario

              </label>


              {isAdmin ? (

                <input
                  type="time"
                  value={
                    dueTime
                  }
                  onChange={(e) =>
                    setDueTime(
                      e.target.value
                    )
                  }
                  className="
                    w-full
                    rounded-lg
                    border
                    border-gray-300
                    dark:border-gray-700
                    bg-white
                    dark:bg-gray-800
                    px-3
                    py-2.5
                    text-sm
                    text-gray-900
                    dark:text-white
                  "
                />

              ) : (

                <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300">

                  {activity.due_time ||
                    'Sin horario'}

                </div>

              )}

            </div>


            {/* PRIORIDAD */}

            <div>

              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">

                <Flag
                  size={15}
                />

                Prioridad

              </label>


              {isAdmin ? (

                <select
                  value={
                    priority
                  }
                  onChange={(e) =>
                    setPriority(
                      e.target.value
                    )
                  }
                  className="
                    w-full
                    rounded-lg
                    border
                    border-gray-300
                    dark:border-gray-700
                    bg-white
                    dark:bg-gray-800
                    px-3
                    py-2.5
                    text-sm
                    text-gray-900
                    dark:text-white
                  "
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

                <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300">

                  {
                    activity.priority
                  }

                </div>

              )}

            </div>

          </div>


          {/* =================================================
              ACTIVIDAD FIJA
          ================================================= */}

          <div className="rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 p-4">

            <div className="mb-4 flex items-center gap-2">

              <Repeat
                size={18}
                className="text-purple-600"
              />

              <div>

                <h3 className="text-sm font-bold text-gray-900 dark:text-white">

                  Horario y día fijo

                </h3>

                <p className="text-xs text-gray-500 dark:text-gray-400">

                  Configura si esta actividad se repite.

                </p>

              </div>

            </div>


            {isAdmin ? (

              <>

                {/* RECURRENCIA */}

                <select
                  value={
                    recurrence
                  }
                  onChange={(e) =>
                    setRecurrence(
                      e.target.value as RecurrenceType
                    )
                  }
                  className="
                    w-full
                    rounded-lg
                    border
                    border-gray-300
                    dark:border-gray-700
                    bg-white
                    dark:bg-gray-800
                    px-3
                    py-2.5
                    text-sm
                    text-gray-900
                    dark:text-white
                  "
                >

                  <option value="none">
                    No repetir
                  </option>

                  <option value="daily">
                    Todos los días
                  </option>

                  <option value="weekly">
                    Cada semana
                  </option>

                  <option value="biweekly">
                    Cada 2 semanas
                  </option>

                  <option value="monthly">
                    Cada mes
                  </option>

                </select>


                {/* DÍAS */}

                {(
                  recurrence ===
                    'weekly' ||
                  recurrence ===
                    'biweekly'
                ) && (

                  <div className="mt-4">

                    <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">

                      Días de la semana

                    </p>


                    <div className="flex flex-wrap gap-2">

                      {WEEK_DAYS.map(
                        (day) => {

                          const active =
                            selectedDays.includes(
                              day.value
                            )


                          return (

                            <button
                              key={
                                day.value
                              }
                              type="button"
                              onClick={() =>
                                toggleDay(
                                  day.value
                                )
                              }
                              title={
                                day.name
                              }
                              className={`
                                h-10
                                w-10
                                rounded-full
                                text-xs
                                font-bold
                                transition
                                ${
                                  active
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                                }
                              `}
                            >

                              {
                                day.label
                              }

                            </button>

                          )

                        }
                      )}

                    </div>

                  </div>

                )}


                {/* FECHA FINAL */}

                {recurrence !==
                  'none' && (

                  <div className="mt-4">

                    <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400">

                      Repetir hasta

                    </label>


                    <input
                      type="date"
                      value={
                        recurrenceEndDate
                      }
                      min={
                        dueDate
                      }
                      onChange={(e) =>
                        setRecurrenceEndDate(
                          e.target.value
                        )
                      }
                      className="
                        w-full
                        rounded-lg
                        border
                        border-gray-300
                        dark:border-gray-700
                        bg-white
                        dark:bg-gray-800
                        px-3
                        py-2.5
                        text-sm
                        text-gray-900
                        dark:text-white
                      "
                    />

                  </div>

                )}

              </>

            ) : (

              <div className="space-y-2 text-sm">

                <div className="flex justify-between">

                  <span className="text-gray-500">
                    Repetición
                  </span>

                  <span className="font-medium text-gray-900 dark:text-white">

                    {
                      recurrenceLabel()
                    }

                  </span>

                </div>


                {selectedDays.length >
                  0 && (

                  <div className="flex justify-between">

                    <span className="text-gray-500">
                      Días
                    </span>

                    <span className="font-medium text-gray-900 dark:text-white">

                      {
                        selectedDays
                          .map(
                            day =>
                              WEEK_DAYS.find(
                                item =>
                                  item.value ===
                                  day
                              )?.name
                          )
                          .join(
                            ', '
                          )
                      }

                    </span>

                  </div>

                )}


                {recurrenceEndDate && (

                  <div className="flex justify-between">

                    <span className="text-gray-500">
                      Hasta
                    </span>

                    <span className="font-medium text-gray-900 dark:text-white">

                      {
                        recurrenceEndDate
                      }

                    </span>

                  </div>

                )}

              </div>

            )}

          </div>


          {/* =================================================
              ESTADO
          ================================================= */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">

              Estado

            </label>


            {isAdmin ? (

              <select
                value={
                  status
                }
                onChange={(e) =>
                  setStatus(
                    e.target.value as ActivityStatus
                  )
                }
                className="
                  w-full
                  rounded-lg
                  border
                  border-gray-300
                  dark:border-gray-700
                  bg-white
                  dark:bg-gray-800
                  px-3
                  py-2.5
                  text-sm
                  text-gray-900
                  dark:text-white
                "
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

              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300">

                {
                  activity.status
                }

              </div>

            )}

          </div>


          {/* =================================================
              INFORMACIÓN
          ================================================= */}

          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 p-4">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">

              <div>

                <span className="text-gray-500">
                  Creada:
                </span>

                <span className="ml-2 text-gray-700 dark:text-gray-300">

                  {activity.created_at
                    ? new Date(
                        activity.created_at
                      ).toLocaleString(
                        'es-MX'
                      )
                    : '—'}

                </span>

              </div>


              <div>

                <span className="text-gray-500">
                  Actualizada:
                </span>

                <span className="ml-2 text-gray-700 dark:text-gray-300">

                  {activity.updated_at
                    ? new Date(
                        activity.updated_at
                      ).toLocaleString(
                        'es-MX'
                      )
                    : '—'}

                </span>

              </div>

            </div>

          </div>

        </div>


        {/* =================================================
            FOOTER
        ================================================= */}

        <div
          className="
            sticky
            bottom-0
            flex
            items-center
            justify-between
            gap-3
            border-t
            border-gray-200
            dark:border-gray-800
            bg-white
            dark:bg-gray-900
            px-6
            py-4
          "
        >

          {/* ELIMINAR */}

          {isAdmin ? (

            <button
              type="button"
              onClick={
                handleDelete
              }
              disabled={
                saving ||
                deleting
              }
              className="
                inline-flex
                items-center
                gap-2
                rounded-lg
                px-4
                py-2.5
                text-sm
                font-semibold
                text-red-600
                hover:bg-red-50
                dark:hover:bg-red-950/30
                disabled:opacity-50
              "
            >

              <Trash2
                size={17}
              />

              {deleting
                ? 'Eliminando...'
                : 'Eliminar'}

            </button>

          ) : (

            <div />

          )}


          {/* BOTONES */}

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={
                onClose
              }
              disabled={
                saving ||
                deleting
              }
              className="
                rounded-lg
                border
                border-gray-300
                dark:border-gray-700
                px-4
                py-2.5
                text-sm
                font-semibold
                text-gray-700
                dark:text-gray-300
                hover:bg-gray-50
                dark:hover:bg-gray-800
              "
            >

              Cerrar

            </button>


            {isAdmin && (

              <button
                type="button"
                onClick={
                  handleSave
                }
                disabled={
                  saving ||
                  deleting
                }
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-lg
                  bg-blue-600
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  hover:bg-blue-700
                  disabled:opacity-50
                "
              >

                <Save
                  size={17}
                />

                {saving
                  ? 'Guardando...'
                  : 'Guardar cambios'}

              </button>

            )}

          </div>

        </div>

      </div>

    </div>

  )

}