'use client'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  X,
  ChevronDown,
  Sparkles,
  Repeat,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'

import {
  useUsers,
  useCurrentUser,
} from '@/lib/marketing-hooks'


interface FixedActivitiesModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}


interface ActivityTemplate {
  id: string
  name: string
  description: string | null
  category: string
  active: boolean
}


type RecurrenceType =
  | 'none'
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'


const WEEK_DAYS = [
  { value: 1, label: 'L' },
  { value: 2, label: 'M' },
  { value: 3, label: 'X' },
  { value: 4, label: 'J' },
  { value: 5, label: 'V' },
  { value: 6, label: 'S' },
  { value: 0, label: 'D' },
]


export default function FixedActivitiesModal({
  isOpen,
  onClose,
  onSuccess,
}: FixedActivitiesModalProps) {

  const supabase = createClient()

  const { user } =
    useCurrentUser()

  const { users } =
    useUsers()


  const [templates, setTemplates] =
    useState<ActivityTemplate[]>([])

  const [templatesLoading, setTemplatesLoading] =
    useState(false)

  const [selectedTemplate, setSelectedTemplate] =
    useState<ActivityTemplate | null>(null)

  const [selectedUsers, setSelectedUsers] =
    useState<string[]>([])

  const [dueDate, setDueDate] =
    useState('')

  const [dueTime, setDueTime] =
    useState('')

  const [priority, setPriority] =
    useState('medium')

  const [recurrence, setRecurrence] =
    useState<RecurrenceType>('none')

  const [selectedDays, setSelectedDays] =
    useState<number[]>([])

  const [recurrenceEndDate, setRecurrenceEndDate] =
    useState('')

  const [loading, setLoading] =
    useState(false)


  // =====================================================
  // USUARIOS ASIGNABLES
  // =====================================================

  const assignableUsers =
    useMemo(
      () =>
        users.filter(
          (u) =>
            u.role !== 'viewer'
        ),
      [users]
    )


  // =====================================================
  // CARGAR PLANTILLAS
  // =====================================================

  useEffect(() => {

    if (!isOpen) return

    const loadTemplates =
      async () => {

        setTemplatesLoading(true)

        try {

          const {
            data,
            error,
          } = await supabase
            .from('activity_templates')
            .select(
              'id, name, description, category, active'
            )
            .eq(
              'active',
              true
            )
            .order(
              'category',
              {
                ascending: true,
              }
            )
            .order(
              'name',
              {
                ascending: true,
              }
            )

          if (error) {

            console.error(
              error
            )

            alert(
              `No se pudieron cargar las actividades: ${error.message}`
            )

            return
          }

          setTemplates(
            data || []
          )

        } finally {

          setTemplatesLoading(false)

        }
      }

    loadTemplates()

  }, [isOpen])


  // =====================================================
  // AGRUPAR
  // =====================================================

  const templatesByCategory =
    useMemo(
      () => {

        return templates.reduce(
          (
            groups: Record<
              string,
              ActivityTemplate[]
            >,
            template
          ) => {

            if (
              !groups[
                template.category
              ]
            ) {

              groups[
                template.category
              ] = []

            }

            groups[
              template.category
            ].push(template)

            return groups

          },
          {}
        )

      },
      [templates]
    )


  // =====================================================
  // FECHAS
  // =====================================================

  const generateDates =
    () => {

      if (!dueDate) {
        return []
      }

      if (
        recurrence === 'none'
      ) {

        return [dueDate]

      }

      const start =
        new Date(
          `${dueDate}T12:00:00`
        )

      const end =
        recurrenceEndDate
          ? new Date(
              `${recurrenceEndDate}T12:00:00`
            )
          : new Date(start)

      if (
        !recurrenceEndDate
      ) {

        end.setMonth(
          end.getMonth() + 1
        )
      }

      const result: string[] = []

      const cursor =
        new Date(start)

      while (
        cursor <= end &&
        result.length < 366
      ) {

        const day =
          cursor.getDay()

        let include = false

        if (
          recurrence === 'daily'
        ) {

          include = true

        } else if (
          recurrence === 'weekly'
        ) {

          include =
            selectedDays.includes(
              day
            )

        } else if (
          recurrence === 'biweekly'
        ) {

          const diff =
            Math.floor(
              (
                cursor.getTime() -
                start.getTime()
              ) /
              86400000
            )

          const week =
            Math.floor(
              diff / 7
            )

          include =
            week % 2 === 0 &&
            selectedDays.includes(
              day
            )

        } else if (
          recurrence === 'monthly'
        ) {

          include =
            cursor.getDate() ===
            start.getDate()

        }

        if (include) {

          const year =
            cursor.getFullYear()

          const month =
            String(
              cursor.getMonth() + 1
            ).padStart(
              2,
              '0'
            )

          const dayNumber =
            String(
              cursor.getDate()
            ).padStart(
              2,
              '0'
            )

          result.push(
            `${year}-${month}-${dayNumber}`
          )
        }

        cursor.setDate(
          cursor.getDate() + 1
        )
      }

      return result
    }


  const generatedDates =
    useMemo(
      () =>
        generateDates(),
      [
        dueDate,
        recurrence,
        selectedDays,
        recurrenceEndDate,
      ]
    )


  // =====================================================
  // USUARIOS
  // =====================================================

  const toggleUser =
    (id: string) => {

      if (loading) return

      setSelectedUsers(
        (current) =>
          current.includes(id)
            ? current.filter(
                (x) => x !== id
              )
            : [
                ...current,
                id,
              ]
      )
    }


  const toggleAll =
    () => {

      if (loading) return

      if (
        selectedUsers.length ===
        assignableUsers.length
      ) {

        setSelectedUsers([])

      } else {

        setSelectedUsers(
          assignableUsers.map(
            (u) => u.id
          )
        )
      }
    }


  // =====================================================
  // DÍAS
  // =====================================================

  const toggleDay =
    (day: number) => {

      setSelectedDays(
        (current) =>
          current.includes(day)
            ? current.filter(
                (d) => d !== day
              )
            : [
                ...current,
                day,
              ].sort()
      )
    }


  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit =
    async (
      e: React.FormEvent
    ) => {

      e.preventDefault()

      if (!selectedTemplate) {

        alert(
          'Selecciona una actividad fija.'
        )

        return
      }

      if (
        selectedUsers.length === 0
      ) {

        alert(
          'Selecciona al menos una persona.'
        )

        return
      }

      if (!dueDate) {

        alert(
          'Selecciona una fecha.'
        )

        return
      }

      if (
        (
          recurrence === 'weekly' ||
          recurrence === 'biweekly'
        ) &&
        selectedDays.length === 0
      ) {

        alert(
          'Selecciona al menos un día de la semana.'
        )

        return
      }

      if (
        !user?.id
      ) {

        alert(
          'No se pudo identificar al usuario actual.'
        )

        return
      }

      setLoading(true)

      try {

        const recurrenceGroupId =
          recurrence === 'none'
            ? null
            : crypto.randomUUID()


        const activities =
          selectedUsers.flatMap(
            (userId) =>
              generatedDates.map(
                (date) => ({

                  title:
                    selectedTemplate.name,

                  description:
                    selectedTemplate.description ||
                    '',

                  assigned_to:
                    userId,

                  created_by:
                    user.id,

                  due_date:
                    date,

                  due_time:
                    dueTime ||
                    null,

                  priority,

                  status:
                    'pending',

                  recurrence_type:
                    recurrence,

                  recurrence_days:
                    selectedDays.length
                      ? selectedDays
                      : null,

                  recurrence_end_date:
                    recurrence !== 'none'
                      ? (
                          recurrenceEndDate ||
                          null
                        )
                      : null,

                  recurrence_group_id:
                    recurrenceGroupId,

                })
              )
          )


        const {
          error,
        } = await supabase
          .from('activities')
          .insert(
            activities
          )


        if (error) {

          console.error(
            error
          )

          alert(
            `Error al asignar actividad: ${error.message}`
          )

          return
        }


        alert(
          activities.length === 1
            ? 'Actividad asignada correctamente.'
            : `Se crearon ${activities.length} actividades correctamente.`
        )


        resetForm()

        onSuccess()
        onClose()

      } catch (error) {

        console.error(
          error
        )

        alert(
          'Ocurrió un error al asignar las actividades.'
        )

      } finally {

        setLoading(false)

      }
    }


  // =====================================================
  // RESET
  // =====================================================

  const resetForm =
    () => {

      setSelectedTemplate(null)
      setSelectedUsers([])
      setDueDate('')
      setDueTime('')
      setPriority('medium')
      setRecurrence('none')
      setSelectedDays([])
      setRecurrenceEndDate('')
    }


  if (!isOpen) {
    return null
  }


  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-xl bg-white dark:bg-gray-900 shadow-xl">

        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">

          <div className="flex items-center gap-2">

            <Sparkles
              size={22}
              className="text-blue-600"
            />

            <div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Actividades fijas
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Asigna y programa actividades.
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={() => {
              resetForm()
              onClose()
            }}
            disabled={loading}
            className="p-1 rounded-md text-gray-500 hover:text-gray-900"
          >
            <X size={20} />
          </button>

        </div>


        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5"
        >

          {/* ACTIVIDAD */}

          <div>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Actividad fija *
            </label>

            <div className="relative">

              <select
                value={
                  selectedTemplate?.id || ''
                }
                onChange={(e) => {

                  const template =
                    templates.find(
                      (t) =>
                        t.id ===
                        e.target.value
                    )

                  setSelectedTemplate(
                    template || null
                  )
                }}
                required
                disabled={
                  loading ||
                  templatesLoading
                }
                className="w-full appearance-none px-3 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >

                <option value="">
                  {templatesLoading
                    ? 'Cargando...'
                    : 'Selecciona una actividad fija'}
                </option>

                {Object.entries(
                  templatesByCategory
                ).map(
                  ([
                    category,
                    items,
                  ]) => (

                    <optgroup
                      key={category}
                      label={category}
                    >

                      {items.map(
                        (template) => (

                          <option
                            key={template.id}
                            value={template.id}
                          >
                            {template.name}
                          </option>

                        )
                      )}

                    </optgroup>

                  )
                )}

              </select>

              <ChevronDown
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"
              />

            </div>

          </div>


          {/* ASIGNAR */}

          <div>

            <div className="flex justify-between mb-2">

              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                ¿A quién se la asignamos?
              </label>

              <button
                type="button"
                onClick={toggleAll}
                disabled={loading}
                className="text-xs text-blue-600 font-medium"
              >
                {
                  selectedUsers.length ===
                  assignableUsers.length
                    ? 'Quitar todos'
                    : 'Seleccionar todos'
                }
              </button>

            </div>


            <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">

              {assignableUsers.map(
                (u) => {

                  const checked =
                    selectedUsers.includes(
                      u.id
                    )

                  return (

                    <label
                      key={u.id}
                      className={`
                        flex items-center gap-3 px-4 py-3 border-b last:border-b-0 cursor-pointer
                        ${
                          checked
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }
                      `}
                    >

                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          toggleUser(
                            u.id
                          )
                        }
                        disabled={loading}
                        className="w-4 h-4"
                      />

                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {u.full_name}
                      </span>

                    </label>

                  )
                }
              )}

            </div>

          </div>


          {/* FECHA + HORA */}

          <div className="grid grid-cols-2 gap-4">

            <div>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha *
              </label>

              <input
                type="date"
                value={dueDate}
                onChange={(e) =>
                  setDueDate(
                    e.target.value
                  )
                }
                required
                className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />

            </div>

            <div>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora
              </label>

              <input
                type="time"
                value={dueTime}
                onChange={(e) =>
                  setDueTime(
                    e.target.value
                  )
                }
                className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />

            </div>

          </div>


          {/* REPETICIÓN */}

          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">

            <div className="flex items-center gap-2 mb-3">

              <Repeat
                size={18}
                className="text-blue-600"
              />

              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Repetición
              </span>

            </div>


            <select
              value={recurrence}
              onChange={(e) =>
                setRecurrence(
                  e.target.value as RecurrenceType
                )
              }
              className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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


            {(recurrence === 'weekly' ||
              recurrence === 'biweekly') && (

              <div className="mt-4">

                <p className="text-xs text-gray-500 mb-2">
                  Días
                </p>

                <div className="flex gap-2">

                  {WEEK_DAYS.map(
                    (day) => {

                      const active =
                        selectedDays.includes(
                          day.value
                        )

                      return (

                        <button
                          key={day.value}
                          type="button"
                          onClick={() =>
                            toggleDay(
                              day.value
                            )
                          }
                          className={`
                            w-9 h-9 rounded-full text-xs font-bold
                            ${
                              active
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                            }
                          `}
                        >
                          {day.label}
                        </button>

                      )
                    }
                  )}

                </div>

              </div>

            )}


            {recurrence !== 'none' && (

              <div className="mt-4">

                <label className="block text-xs text-gray-500 mb-2">
                  Repetir hasta
                </label>

                <input
                  type="date"
                  value={
                    recurrenceEndDate
                  }
                  min={dueDate}
                  onChange={(e) =>
                    setRecurrenceEndDate(
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />

              </div>

            )}

          </div>


          {/* PRIORIDAD */}

          <div>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prioridad
            </label>

            <select
              value={priority}
              onChange={(e) =>
                setPriority(
                  e.target.value
                )
              }
              className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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

          </div>


          {/* RESUMEN */}

          {selectedTemplate &&
            selectedUsers.length > 0 &&
            generatedDates.length > 0 && (

              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">

                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                  Resumen
                </p>

                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {selectedTemplate.name}
                </p>

                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Se crearán{' '}
                  <strong>
                    {
                      generatedDates.length *
                      selectedUsers.length
                    }
                  </strong>{' '}
                  actividades.
                </p>

              </div>

            )}


          {/* BOTONES */}

          <div className="flex gap-3">

            <button
              type="button"
              onClick={() => {
                resetForm()
                onClose()
              }}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                !selectedTemplate ||
                selectedUsers.length === 0 ||
                !dueDate
              }
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {loading
                ? 'Asignando...'
                : 'Asignar actividad'}
            </button>

          </div>

        </form>

      </div>

    </div>
  )
}