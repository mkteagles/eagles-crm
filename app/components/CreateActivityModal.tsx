
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUsers, useCurrentUser } from '@/lib/marketing-hooks'
import { X, ChevronDown, Sparkles, Plus } from 'lucide-react'

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

type ActivityMode = 'fixed' | 'custom'

export default function CreateActivityModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateActivityModalProps) {
  const [mode, setMode] = useState<ActivityMode>('fixed')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTemplate, setSelectedTemplate] =
    useState<ActivityTemplate | null>(null)

  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('medium')

  const [templates, setTemplates] = useState<ActivityTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
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
          .select('id, name, description, category, active')
          .eq('active', true)
          .order('category', { ascending: true })
          .order('name', { ascending: true })

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
          'Unexpected error loading activity templates:',
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
  // SELECCIONAR ACTIVIDAD FIJA
  // =========================================================

  const handleTemplateChange = (
    templateId: string
  ) => {
    if (!templateId) {
      setSelectedTemplate(null)
      setTitle('')
      setDescription('')
      return
    }

    const template = templates.find(
      (t) => t.id === templateId
    )

    if (!template) return

    setSelectedTemplate(template)
    setTitle(template.name)
    setDescription(template.description || '')
  }

  // =========================================================
  // CAMBIAR MODO
  // =========================================================

  const handleModeChange = (
    newMode: ActivityMode
  ) => {
    if (loading) return

    setMode(newMode)

    // Al cambiar a actividad nueva
    if (newMode === 'custom') {
      setSelectedTemplate(null)
      setTitle('')
      setDescription('')
    }

    // Al cambiar a actividad fija
    if (newMode === 'fixed') {
      setSelectedTemplate(null)
      setTitle('')
      setDescription('')
    }
  }

  // =========================================================
  // SELECCIONAR / DESELECCIONAR USUARIO
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
      selectedUsers.length === executors.length
    ) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(
        executors.map((u) => u.id)
      )
    }
  }

  // =========================================================
  // CREAR ACTIVIDAD
  // =========================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault()

    if (!title.trim()) {
      alert('El título es obligatorio')
      return
    }

    if (selectedUsers.length === 0) {
      alert('Selecciona al menos un usuario')
      return
    }

    if (!dueDate) {
      alert(
        'Selecciona una fecha de vencimiento'
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
      // =====================================================
      // CREAR UNA ACTIVIDAD POR CADA USUARIO SELECCIONADO
      // =====================================================

      const activitiesToInsert =
        selectedUsers.map((userId) => ({
          title: title.trim(),
          description: description.trim(),
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
          'Error creating activities:',
          error
        )

        alert(
          `Error al crear actividad: ${error.message}`
        )

        return
      }

      // =====================================================
      // LIMPIAR FORMULARIO
      // =====================================================

      resetForm()

      // =====================================================
      // AVISAR AL COMPONENTE PADRE
      // =====================================================

      onSuccess()

      // =====================================================
      // CERRAR MODAL
      // =====================================================

      onClose()
    } catch (error) {
      console.error(
        'Unexpected error creating activities:',
        error
      )

      alert(
        'Ocurrió un error al crear la actividad.'
      )
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // RESETEAR FORMULARIO
  // =========================================================

  const resetForm = () => {
    setMode('fixed')
    setTitle('')
    setDescription('')
    setSelectedTemplate(null)
    setSelectedUsers([])
    setDueDate('')
    setPriority('medium')
  }

  // =========================================================
  // CERRAR MODAL
  // =========================================================

  const handleClose = () => {
    if (loading) return

    resetForm()
    onClose()
  }

  // =========================================================
  // AGRUPAR PLANTILLAS POR CATEGORÍA
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

        groups[template.category].push(
          template
        )

        return groups
      },
      {}
    )

  // =========================================================
  // SI EL MODAL ESTÁ CERRADO
  // =========================================================

  if (!isOpen) return null

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-gray-900 shadow-xl">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">

          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Asignar actividad
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Selecciona una actividad fija o crea una nueva.
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

        {/* =====================================================
            TIPO DE ACTIVIDAD
        ===================================================== */}

        <div className="p-6 pb-0">

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tipo de actividad
          </label>

          <div className="grid grid-cols-2 gap-3">

            {/* ACTIVIDAD FIJA */}

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
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-300'
                }
              `}
            >
              <Sparkles size={18} />
              Actividad fija
            </button>

            {/* ACTIVIDAD NUEVA */}

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
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-300'
                }
              `}
            >
              <Plus size={18} />
              Nueva actividad
            </button>

          </div>

        </div>

        {/* =====================================================
            FORMULARIO
        ===================================================== */}

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5"
        >

          {/* ===================================================
              ACTIVIDAD FIJA
          =================================================== */}

          {mode === 'fixed' && (
            <div>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  className="w-full appearance-none px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
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

              {templates.length === 0 &&
                !templatesLoading && (
                  <p className="mt-2 text-xs text-orange-500">
                    No hay actividades fijas
                    disponibles.
                  </p>
                )}

            </div>
          )}

          {/* ===================================================
              TÍTULO
          =================================================== */}

          <div>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              placeholder={
                mode === 'fixed'
                  ? 'Selecciona una actividad fija'
                  : 'Ej: Contactar leads de FB'
              }
            />

            {mode === 'fixed' &&
              selectedTemplate && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Puedes modificar el título si
                  necesitas personalizar esta
                  actividad.
                </p>
              )}

          </div>

          {/* ===================================================
              DESCRIPCIÓN
          =================================================== */}

          <div>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción
            </label>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
              rows={3}
              placeholder="Detalles de la actividad..."
            />

            {mode === 'fixed' &&
              selectedTemplate && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  La descripción se cargó desde la
                  plantilla, pero puedes editarla.
                </p>
              )}

          </div>

          {/* ===================================================
              ASIGNAR + FECHA
          =================================================== */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* ASIGNAR A */}

            <div>

              <div className="flex items-center justify-between mb-1">

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Asignar a *
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

              <div className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 overflow-hidden">

                {executors.map((u) => {

                  const selected =
                    selectedUsers.includes(
                      u.id
                    )

                  return (
                    <label
                      key={u.id}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 cursor-pointer border-b last:border-b-0 border-gray-200 dark:border-gray-700 transition
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
                          toggleUser(u.id)
                        }
                        disabled={loading}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />

                      <span className="text-sm text-gray-900 dark:text-white">
                        {u.full_name}
                      </span>

                    </label>
                  )
                })}

                {executors.length === 0 && (
                  <p className="p-3 text-xs text-red-500">
                    No hay ejecutores disponibles.
                  </p>
                )}

              </div>

              {selectedUsers.length > 0 && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {selectedUsers.length === 1
                    ? '1 persona seleccionada'
                    : `${selectedUsers.length} personas seleccionadas`}
                </p>
              )}

            </div>

            {/* VENCIMIENTO */}

            <div>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Vencimiento *
              </label>

              <input
                type="date"
                value={dueDate}
                onChange={(e) =>
                  setDueDate(e.target.value)
                }
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />

            </div>

          </div>

          {/* ===================================================
              PRIORIDAD
          =================================================== */}

          <div>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Prioridad
            </label>

            <select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value)
              }
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
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

          {/* ===================================================
              RESUMEN DE ASIGNACIÓN
          =================================================== */}

          {selectedUsers.length > 0 && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">

              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Esta actividad se creará para:
              </p>

              <div className="mt-1 flex flex-wrap gap-1">

                {selectedUsers.map((userId) => {

                  const selectedUser =
                    executors.find(
                      (u) => u.id === userId
                    )

                  return (
                    <span
                      key={userId}
                      className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full"
                    >
                      {selectedUser?.full_name ||
                        'Usuario'}
                    </span>
                  )
                })}

              </div>

              {selectedUsers.length > 1 && (
                <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                  Se creará una actividad
                  independiente para cada
                  persona seleccionada.
                </p>
              )}

            </div>
          )}

          {/* ===================================================
              BOTONES
          =================================================== */}

          <div className="flex gap-3 pt-4">

            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                templatesLoading ||
                selectedUsers.length === 0 ||
                !title.trim() ||
                !dueDate
              }
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Asignando...'
                : selectedUsers.length > 1
                ? `Asignar a ${selectedUsers.length} personas`
                : 'Asignar actividad'}
            </button>

          </div>

        </form>

      </div>

    </div>
  )
}
