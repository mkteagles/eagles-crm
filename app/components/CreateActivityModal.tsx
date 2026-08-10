'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  useUsers,
  useCurrentUser,
} from '@/lib/marketing-hooks'

import {
  X,
  ChevronDown,
  Sparkles,
  Plus,
  Repeat,
} from 'lucide-react'


interface CreateActivityModalProps {
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


type ActivityMode =
  | 'fixed'
  | 'custom'


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


export default function CreateActivityModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateActivityModalProps) {

  const supabase = createClient()

  const { user } = useCurrentUser()
  const { users } = useUsers()


  const [mode, setMode] =
    useState<ActivityMode>('fixed')

  const [title, setTitle] =
    useState('')

  const [description, setDescription] =
    useState('')

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

  const [templates, setTemplates] =
    useState<ActivityTemplate[]>([])

  const [templatesLoading, setTemplatesLoading] =
    useState(false)

  const [loading, setLoading] =
    useState(false)


  // =====================================================
  // USUARIOS ASIGNABLES
  // =====================================================
  //
  // Admin + executor.
  //
  // Viewer NO puede recibir actividades.
  //

  const assignableUsers = useMemo(() => {
    return users.filter(
      (u) => u.role !== 'viewer'
    )
  }, [users])


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
              'Error loading activity templates:',
              error
            )

            alert(
              `No se pudieron cargar las actividades fijas: ${error.message}`
            )

            return
          }

          setTemplates(
            data || []
          )

        } catch (error) {

          console.error(
            'Unexpected error loading templates:',
            error
          )

          alert(
            'Ocurrió un error al cargar las actividades fijas.'
          )

        } finally {

          setTemplatesLoading(false)

        }
      }

    loadTemplates()

  }, [isOpen])


  // =====================================================
  // AGRUPAR PLANTILLAS
  // =====================================================

  const templatesByCategory =
    useMemo(() => {

      return templates.reduce(
        (
          groups: Record<
            string,
            ActivityTemplate[]
          >,
          template
        ) => {

          if (
            !groups[template.category]
          ) {
            groups[template.category] = []
          }

          groups[
            template.category
          ].push(template)

          return groups

        },
        {}
      )

    }, [templates])


  // =====================================================
  // CAMBIAR PLANTILLA
  // =====================================================

  const handleTemplateChange =
    (templateId: string) => {

      if (!templateId) {

        setSelectedTemplate(null)
        setTitle('')
        setDescription('')

        return
      }

      const template =
        templates.find(
          (t) =>
            t.id === templateId
        )

      if (!template) return

      setSelectedTemplate(template)

      setTitle(
        template.name
      )

      setDescription(
        template.description || ''
      )
    }


  // =====================================================
  // CAMBIAR MODO
  // =====================================================

  const handleModeChange =
    (newMode: ActivityMode) => {

      if (loading) return

      setMode(newMode)

      setSelectedTemplate(null)
      setTitle('')
      setDescription('')
    }


  // =====================================================
  // USUARIOS
  // =====================================================

  const toggleUser =
    (userId: string) => {

      if (loading) return

      setSelectedUsers(
        (current) => {

          if (
            current.includes(userId)
          ) {

            return current.filter(
              (id) =>
                id !== userId
            )

          }

          return [
            ...current,
            userId,
          ]
        }
      )
    }


  const toggleAllUsers = () => {

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
        (current) => {

          if (
            current.includes(day)
          ) {

            return current.filter(
              (d) => d !== day
            )

          }

          return [
            ...current,
            day,
          ].sort()
        }
      )
    }


  // =====================================================
  // CALCULAR FECHAS
  // =====================================================

  const generateDates = (): string[] => {

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

    const dates: string[] = []

    const cursor =
      new Date(start)

    while (
      cursor <= end &&
      dates.length < 366
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
          selectedDays.includes(day)

      } else if (
        recurrence === 'biweekly'
      ) {

        const diff =
          Math.floor(
            (
              cursor.getTime() -
              start.getTime()
            ) /
            (
              1000 *
              60 *
              60 *
              24
            )
          )

        const week =
          Math.floor(
            diff / 7
          )

        include =
          week % 2 === 0 &&
          selectedDays.includes(day)

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
          ).padStart(2, '0')

        const date =
          String(
            cursor.getDate()
          ).padStart(2, '0')

        dates.push(
          `${year}-${month}-${date}`
        )
      }

      cursor.setDate(
        cursor.getDate() + 1
      )
    }

    return dates
  }


  const generatedDates =
    useMemo(
      () => generateDates(),
      [
        dueDate,
        recurrence,
        selectedDays,
        recurrenceEndDate,
      ]
    )


  // =====================================================
  // VALIDAR RECURRENCIA
  // =====================================================

  const validateRecurrence =
    () => {

      if (
        recurrence === 'weekly' ||
        recurrence === 'biweekly'
      ) {

        if (
          selectedDays.length === 0
        ) {

          alert(
            'Selecciona al menos un día de la semana.'
          )

          return false
        }
      }

      if (
        recurrence !== 'none' &&
        recurrenceEndDate &&
        recurrenceEndDate < dueDate
      ) {

        alert(
          'La fecha final no puede ser anterior a la fecha inicial.'
        )

        return false
      }

      return true
    }


  // =====================================================
  // CREAR ACTIVIDADES
  // =====================================================

  const handleSubmit =
    async (
      e: React.FormEvent
    ) => {

      e.preventDefault()

      if (!title.trim()) {

        alert(
          'El título es obligatorio.'
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

      if (!user?.id) {

        alert(
          'No se pudo identificar al usuario actual.'
        )

        return
      }

      if (
        !validateRecurrence()
      ) {
        return
      }

      if (
        generatedDates.length === 0
      ) {

        alert(
          'No se pudieron generar las fechas.'
        )

        return
      }

      setLoading(true)

      try {

        const recurrenceGroupId =
          recurrence === 'none'
            ? null
            : crypto.randomUUID()


        const activitiesToInsert =
          selectedUsers.flatMap(
            (userId) =>
              generatedDates.map(
                (date) => ({

                  title:
                    title.trim(),

                  description:
                    description.trim(),

                  assigned_to:
                    userId,

                  created_by:
                    user.id,

                  due_date:
                    date,

                  due_time:
                    dueTime || null,

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
            activitiesToInsert
          )


        if (error) {

          console.error(
            'Error creating activities:',
            error
          )

          alert(
            `Error al crear actividad: ${error.message}`
          )

          return
        }


        alert(
          activitiesToInsert.length === 1
            ? 'Actividad asignada correctamente.'
            : `Se crearon ${activitiesToInsert.length} actividades correctamente.`
        )


        resetForm()

        onSuccess()

        onClose()

      } catch (error) {

        console.error(
          'Unexpected error creating activities:',
          error
        )

        alert(
          'Ocurrió un error al crear las actividades.'
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

      setMode('fixed')
      setTitle('')
      setDescription('')
      setSelectedTemplate(null)
      setSelectedUsers([])
      setDueDate('')
      setDueTime('')
      setPriority('medium')
      setRecurrence('none')
      setSelectedDays([])
      setRecurrenceEndDate('')
    }


  // =====================================================
  // CERRAR
  // =====================================================

  const handleClose =
    () => {

      if (loading) return

      resetForm()
      onClose()
    }


  // =====================================================
  // MODAL CERRADO
  // =====================================================

  if (!isOpen) {
    return null
  }


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-xl bg-white dark:bg-gray-900 shadow-xl">

        {/* HEADER */}

        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">

          <div>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Asignar actividad
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Crea una actividad única o repetitiva.
            </p>

          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="p-1 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X size={20} />
          </button>

        </div>


        {/* MODO */}

        <div className="p-6 pb-0">

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tipo de actividad
          </label>

          <div className="grid grid-cols-2 gap-3">

            <button
              type="button"
              onClick={() =>
                handleModeChange('fixed')
              }
              disabled={loading}
              className={`
                flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 font-medium transition
                ${
                  mode === 'fixed'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                }
              `}
            >
              <Sparkles size={18} />
              Actividad fija
            </button>


            <button
              type="button"
              onClick={() =>
                handleModeChange('custom')
              }
              disabled={loading}
              className={`
                flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 font-medium transition
                ${
                  mode === 'custom'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                }
              `}
            >
              <Plus size={18} />
              Nueva actividad
            </button>

          </div>

        </div>


        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5"
        >

          {/* ACTIVIDAD FIJA */}

          {mode === 'fixed' && (

            <div>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Actividad fija *
              </label>

              <div className="relative">

                <select
                  value={
                    selectedTemplate?.id || ''
                  }
                  onChange={(e) =>
                    handleTemplateChange(
                      e.target.value
                    )
                  }
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
                      categoryTemplates,
                    ]) => (

                      <optgroup
                        key={category}
                        label={category}
                      >

                        {categoryTemplates.map(
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

          )}


          {/* TÍTULO */}

          <div>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título *
            </label>

            <input
              type="text"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              required
              disabled={loading}
              placeholder={
                mode === 'custom'
                  ? 'Ej: Revisar campaña de Facebook'
                  : 'Selecciona una actividad fija'
              }
              className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />

          </div>


          {/* DESCRIPCIÓN */}

          <div>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción
            </label>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              disabled={loading}
              rows={3}
              placeholder="Detalles de la actividad..."
              className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
            />

          </div>


          {/* USUARIOS */}

          <div>

            <div className="flex items-center justify-between mb-2">

              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Asignar a *
              </label>

              {assignableUsers.length > 0 && (

                <button
                  type="button"
                  onClick={toggleAllUsers}
                  disabled={loading}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                >
                  {
                    selectedUsers.length ===
                    assignableUsers.length
                      ? 'Quitar todos'
                      : 'Seleccionar todos'
                  }
                </button>

              )}

            </div>


            <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">

              {assignableUsers.map(
                (u) => {

                  const selected =
                    selectedUsers.includes(
                      u.id
                    )

                  return (

                    <label
                      key={u.id}
                      className={`
                        flex items-center gap-3 px-4 py-3 cursor-pointer border-b last:border-b-0 border-gray-200 dark:border-gray-700
                        ${
                          selected
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }
                      `}
                    >

                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          toggleUser(
                            u.id
                          )
                        }
                        disabled={loading}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600"
                      />

                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {u.full_name}
                      </span>

                      <span className="ml-auto text-[10px] uppercase text-gray-400">
                        {u.role}
                      </span>

                    </label>

                  )
                }
              )}

            </div>

          </div>


          {/* FECHA + HORA */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

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
                disabled={loading}
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
                disabled={loading}
                className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />

            </div>

          </div>


          {/* RECURRENCIA */}

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">

            <div className="flex items-center gap-2 mb-3">

              <Repeat
                size={18}
                className="text-blue-600"
              />

              <label className="text-sm font-semibold text-gray-900 dark:text-white">
                Repetición
              </label>

            </div>


            <select
              value={recurrence}
              onChange={(e) =>
                setRecurrence(
                  e.target.value as RecurrenceType
                )
              }
              disabled={loading}
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

                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Días de la semana
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
                            w-9 h-9 rounded-full text-xs font-bold transition
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

                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
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
                  disabled={loading}
                  className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />

                {!recurrenceEndDate && (
                  <p className="mt-1 text-xs text-gray-400">
                    Si no seleccionas una fecha,
                    se generará aproximadamente un mes.
                  </p>
                )}

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
              disabled={loading}
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

          {selectedUsers.length > 0 &&
            generatedDates.length > 0 && (

              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">

                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                  Resumen
                </p>

                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  <strong>
                    {title}
                  </strong>
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

                {dueTime && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Hora: {dueTime}
                  </p>
                )}

              </div>

            )}


          {/* BOTONES */}

          <div className="flex gap-3 pt-2">

            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                templatesLoading ||
                !title.trim() ||
                selectedUsers.length === 0 ||
                !dueDate
              }
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
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