
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUsers, useCurrentUser } from '@/lib/marketing-hooks'
import {
  X,
  ChevronDown,
  Sparkles,
} from 'lucide-react'

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

export default function FixedActivitiesModal({
  isOpen,
  onClose,
  onSuccess,
}: FixedActivitiesModalProps) {
  const [templates, setTemplates] = useState<ActivityTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)

  const [selectedTemplate, setSelectedTemplate] =
    useState<ActivityTemplate | null>(null)

  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('medium')

  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const { user } = useCurrentUser()
  const { users } = useUsers()

  // =========================================================
  // OBTENER ACTIVIDADES FIJAS
  // =========================================================

  useEffect(() => {
    if (!isOpen) return

    const loadTemplates = async () => {
      setTemplatesLoading(true)

      try {
        const { data, error } = await supabase
          .from('activity_templates')
          .select(
            'id, name, description, category, active'
          )
          .eq('active', true)
          .order('category', {
            ascending: true,
          })
          .order('name', {
            ascending: true,
          })

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

        setTemplates(data || [])
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

  // =========================================================
  // EJECUTORES
  // =========================================================

  const executors = users.filter(
    (u) => u.role === 'executor'
  )

  // =========================================================
  // AGRUPAR PLANTILLAS
  // =========================================================

  const templatesByCategory =
    templates.reduce(
      (
        groups: Record<
          string,
          ActivityTemplate[]
        >,
        template
      ) => {
        if (!groups[template.category]) {
          groups[template.category] = []
        }

        groups[template.category].push(template)

        return groups
      },
      {}
    )

  // =========================================================
  // SELECCIONAR ACTIVIDAD FIJA
  // =========================================================

  const handleTemplateChange = (
    templateId: string
  ) => {
    const template = templates.find(
      (t) => t.id === templateId
    )

    if (!template) {
      setSelectedTemplate(null)
      return
    }

    setSelectedTemplate(template)
  }

  // =========================================================
  // SELECCIONAR / QUITAR USUARIO
  // =========================================================

  const toggleUser = (userId: string) => {
    if (loading) return

    setSelectedUsers((current) => {
      if (current.includes(userId)) {
        return current.filter(
          (id) => id !== userId
        )
      }

      return [...current, userId]
    })
  }

  // =========================================================
  // SELECCIONAR TODOS
  // =========================================================

  const toggleAllUsers = () => {
    if (loading) return

    if (
      selectedUsers.length ===
      executors.length
    ) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(
        executors.map((u) => u.id)
      )
    }
  }

  // =========================================================
  // CREAR ACTIVIDADES
  // =========================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault()

    if (!selectedTemplate) {
      alert(
        'Selecciona una actividad fija.'
      )
      return
    }

    if (selectedUsers.length === 0) {
      alert(
        'Selecciona al menos una persona.'
      )
      return
    }

    if (!dueDate) {
      alert(
        'Selecciona una fecha de vencimiento.'
      )
      return
    }

    if (!user?.id) {
      alert(
        'No se pudo identificar al usuario actual.'
      )
      return
    }

    setLoading(true)

    try {
      const activitiesToInsert =
        selectedUsers.map((userId) => ({
          title: selectedTemplate.name,
          description:
            selectedTemplate.description || '',
          assigned_to: userId,
          created_by: user.id,
          due_date: dueDate,
          priority,
          status: 'pending',
        }))

      const { error } = await supabase
        .from('activities')
        .insert(activitiesToInsert)

      if (error) {
        console.error(
          'Error creating fixed activities:',
          error
        )

        alert(
          `Error al asignar actividad: ${error.message}`
        )

        return
      }

      alert(
        selectedUsers.length === 1
          ? 'Actividad asignada correctamente.'
          : `Actividad asignada a ${selectedUsers.length} personas correctamente.`
      )

      resetForm()

      onSuccess()
      onClose()
    } catch (error) {
      console.error(
        'Unexpected error creating fixed activities:',
        error
      )

      alert(
        'Ocurrió un error al asignar la actividad.'
      )
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // RESETEAR
  // =========================================================

  const resetForm = () => {
    setSelectedTemplate(null)
    setSelectedUsers([])
    setDueDate('')
    setPriority('medium')
  }

  // =========================================================
  // CERRAR
  // =========================================================

  const handleClose = () => {
    if (loading) return

    resetForm()
    onClose()
  }

  // =========================================================
  // MODAL CERRADO
  // =========================================================

  if (!isOpen) return null

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-gray-900 shadow-xl">

        {/* HEADER */}

        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">

          <div>
            <div className="flex items-center gap-2">

              <Sparkles
                size={22}
                className="text-blue-600"
              />

              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Actividades fijas
              </h2>

            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Selecciona una actividad y asígnala.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="p-1 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>

        </div>

        {/* FORMULARIO */}

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5"
        >

          {/* ACTIVIDAD */}

          <div>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ¿Qué actividad quieres asignar?
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
                className="w-full appearance-none px-3 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >

                <option value="">
                  {templatesLoading
                    ? 'Cargando actividades...'
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

            {selectedTemplate?.description && (
              <div className="mt-2 rounded-lg bg-gray-50 dark:bg-gray-800 p-3">

                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Descripción
                </p>

                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {selectedTemplate.description}
                </p>

              </div>
            )}

            {templates.length === 0 &&
              !templatesLoading && (
                <p className="mt-2 text-xs text-orange-500">
                  No hay actividades fijas disponibles.
                </p>
              )}

          </div>

          {/* ASIGNAR A */}

          <div>

            <div className="flex items-center justify-between mb-2">

              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                ¿A quién se la asignamos?
              </label>

              {executors.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAllUsers}
                  disabled={loading}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                >
                  {selectedUsers.length ===
                  executors.length
                    ? 'Quitar todos'
                    : 'Seleccionar todos'}
                </button>
              )}

            </div>

            <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">

              {executors.map((u) => {

                const selected =
                  selectedUsers.includes(
                    u.id
                  )

                return (
                  <label
                    key={u.id}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b last:border-b-0 border-gray-200 dark:border-gray-700 transition ${
                      selected
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >

                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() =>
                        toggleUser(u.id)
                      }
                      disabled={loading}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />

                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {u.full_name}
                    </span>

                  </label>
                )
              })}

              {executors.length === 0 && (
                <p className="p-4 text-xs text-red-500">
                  No hay ejecutores disponibles.
                </p>
              )}

            </div>

            {selectedUsers.length > 0 && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {selectedUsers.length === 1
                  ? '1 persona seleccionada'
                  : `${selectedUsers.length} personas seleccionadas`}
              </p>
            )}

          </div>

          {/* FECHA Y PRIORIDAD */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha
              </label>

              <input
                type="date"
                value={dueDate}
                onChange={(e) =>
                  setDueDate(e.target.value)
                }
                required
                disabled={loading}
                className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />

            </div>

            <div>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prioridad
              </label>

              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value)
                }
                disabled={loading}
                className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
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

          </div>

          {/* RESUMEN */}

          {selectedTemplate &&
            selectedUsers.length > 0 && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">

                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                  Resumen
                </p>

                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  <strong>
                    {selectedTemplate.name}
                  </strong>
                </p>

                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Se asignará a{' '}
                  {selectedUsers.length === 1
                    ? '1 persona'
                    : `${selectedUsers.length} personas`}
                  {dueDate
                    ? ` para el ${dueDate}`
                    : ''}
                  .
                </p>

              </div>
            )}

          {/* BOTONES */}

          <div className="flex gap-3 pt-2">

            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                templatesLoading ||
                !selectedTemplate ||
                selectedUsers.length === 0 ||
                !dueDate
              }
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
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
