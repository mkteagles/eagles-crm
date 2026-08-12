'use client'

import { useEffect, useState } from 'react'

import {
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  Loader,
  X,
  Save,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { useCurrentUser } from '@/lib/marketing-hooks'

interface CalendarStrategyProps {
  type: 'transmissions' | 'digital_courses'
  title: string
  description: string
}

interface StrategyItem {
  id: string
  title: string
  description: string | null
  strategy_date: string
  strategy_time: string | null
  status: 'planned' | 'in_progress' | 'completed'
}

interface StrategyForm {
  title: string
  description: string
  strategy_date: string
  strategy_time: string
  status: 'planned' | 'in_progress' | 'completed'
}

const emptyForm: StrategyForm = {
  title: '',
  description: '',
  strategy_date: '',
  strategy_time: '',
  status: 'planned',
}

export default function CalendarStrategy({
  type,
  title,
  description,
}: CalendarStrategyProps) {
  const supabase = createClient()

  const { user } = useCurrentUser()

  const [items, setItems] = useState<StrategyItem[]>([])
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)

  const [editingItem, setEditingItem] =
    useState<StrategyItem | null>(null)

  const [form, setForm] =
    useState<StrategyForm>(emptyForm)

  const [saving, setSaving] = useState(false)

  const [deletingId, setDeletingId] =
    useState<string | null>(null)

  // =========================================================
  // PERMISOS
  // =========================================================

  const canEdit =
    user?.role === 'admin' ||
    (
      user?.full_name === 'Hugo' &&
      (
        type === 'transmissions' ||
        type === 'digital_courses'
      )
    ) ||
    (
      user?.full_name === 'Ursula' &&
      (
        type === 'transmissions' ||
        type === 'digital_courses'
      )
    ) ||
    (
      user?.full_name === 'Marcos' &&
      type === 'digital_courses'
    )

  // =========================================================
  // CARGAR ESTRATEGIAS
  // =========================================================

  const loadItems = async () => {
    setLoading(true)

    const { data, error } =
      await supabase
        .from('calendar_strategy_items')
        .select('*')
        .eq('calendar_type', type)
        .order('strategy_date', {
          ascending: true,
        })
        .order('strategy_time', {
          ascending: true,
        })

    if (error) {
      console.error(
        'Error cargando estrategias:',
        error
      )
    }

    setItems(
      (data || []) as StrategyItem[]
    )

    setLoading(false)
  }

  useEffect(() => {
    loadItems()
  }, [type])

  // =========================================================
  // ABRIR MODAL NUEVA
  // =========================================================

  const openCreateModal = () => {
    if (!canEdit) {
      return
    }

    setEditingItem(null)

    setForm({
      ...emptyForm,
      strategy_date:
        new Date()
          .toISOString()
          .split('T')[0],
    })

    setShowModal(true)
  }

  // =========================================================
  // ABRIR MODAL EDITAR
  // =========================================================

  const openEditModal = (
    item: StrategyItem
  ) => {
    if (!canEdit) {
      return
    }

    setEditingItem(item)

    setForm({
      title: item.title,
      description:
        item.description || '',
      strategy_date:
        item.strategy_date,
      strategy_time:
        item.strategy_time
          ? item.strategy_time.slice(0, 5)
          : '',
      status: item.status,
    })

    setShowModal(true)
  }

  // =========================================================
  // CERRAR MODAL
  // =========================================================

  const closeModal = () => {
    if (saving) {
      return
    }

    setShowModal(false)
    setEditingItem(null)
    setForm(emptyForm)
  }

  // =========================================================
  // GUARDAR
  // =========================================================

  const handleSave = async () => {
    if (!canEdit) {
      alert(
        'No tienes permiso para modificar este calendario.'
      )
      return
    }

    if (!form.title.trim()) {
      alert(
        'Escribe un título para la estrategia.'
      )
      return
    }

    if (!form.strategy_date) {
      alert(
        'Selecciona una fecha.'
      )
      return
    }

    setSaving(true)

    try {
      const payload = {
        calendar_type: type,
        title: form.title.trim(),
        description:
          form.description.trim() || null,
        strategy_date:
          form.strategy_date,
        strategy_time:
          form.strategy_time || null,
        status: form.status,
        updated_by:
          user?.id || null,
        updated_at:
          new Date().toISOString(),
      }

      // =====================================================
      // EDITAR
      // =====================================================

      if (editingItem) {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              'calendar_strategy_items'
            )
            .update(payload)
            .eq(
              'id',
              editingItem.id
            )
            .select()
            .single()

        if (error) {
          console.error(
            'Error actualizando estrategia:',
            error
          )

          alert(
            `No se pudo actualizar: ${error.message}`
          )

          return
        }

        setItems((prev) =>
          prev
            .map((item) =>
              item.id ===
              editingItem.id
                ? (data as StrategyItem)
                : item
            )
            .sort((a, b) => {
              const dateCompare =
                a.strategy_date.localeCompare(
                  b.strategy_date
                )

              if (
                dateCompare !== 0
              ) {
                return dateCompare
              }

              return (
                (a.strategy_time || '')
                  .localeCompare(
                    b.strategy_time || ''
                  )
              )
            })
        )
      }

      // =====================================================
      // CREAR
      // =====================================================

      else {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              'calendar_strategy_items'
            )
            .insert({
              ...payload,
              created_by:
                user?.id || null,
            })
            .select()
            .single()

        if (error) {
          console.error(
            'Error creando estrategia:',
            error
          )

          alert(
            `No se pudo crear: ${error.message}`
          )

          return
        }

        setItems((prev) =>
          [
            ...prev,
            data as StrategyItem,
          ].sort((a, b) => {
            const dateCompare =
              a.strategy_date.localeCompare(
                b.strategy_date
              )

            if (
              dateCompare !== 0
            ) {
              return dateCompare
            }

            return (
              (a.strategy_time || '')
                .localeCompare(
                  b.strategy_time || ''
                )
            )
          })
        )
      }

      closeModal()
    } catch (error) {
      console.error(
        'Error guardando estrategia:',
        error
      )

      alert(
        'Ocurrió un error al guardar la estrategia.'
      )
    } finally {
      setSaving(false)
    }
  }

  // =========================================================
  // ELIMINAR
  // =========================================================

  const handleDelete = async (
    item: StrategyItem
  ) => {
    if (!canEdit) {
      return
    }

    const confirmed =
      window.confirm(
        `¿Seguro que quieres eliminar "${item.title}"?`
      )

    if (!confirmed) {
      return
    }

    setDeletingId(item.id)

    try {
      const {
        error,
      } =
        await supabase
          .from(
            'calendar_strategy_items'
          )
          .delete()
          .eq(
            'id',
            item.id
          )

      if (error) {
        console.error(
          'Error eliminando estrategia:',
          error
        )

        alert(
          `No se pudo eliminar: ${error.message}`
        )

        return
      }

      setItems((prev) =>
        prev.filter(
          (current) =>
            current.id !==
            item.id
        )
      )
    } catch (error) {
      console.error(
        'Error eliminando estrategia:',
        error
      )

      alert(
        'Ocurrió un error al eliminar la estrategia.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  // =========================================================
  // ESTADO
  // =========================================================

  const getStatusLabel = (
    status: StrategyItem['status']
  ) => {
    switch (status) {
      case 'planned':
        return 'Planeada'

      case 'in_progress':
        return 'En progreso'

      case 'completed':
        return 'Completada'

      default:
        return 'Planeada'
    }
  }

  const getStatusClasses = (
    status: StrategyItem['status']
  ) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'

      case 'in_progress':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'

      case 'planned':
      default:
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
    }
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">

        {/* HEADER */}

        <div className="p-6 border-b border-gray-200 dark:border-gray-800">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">

                <CalendarDays
                  size={21}
                  className="text-blue-600"
                />

              </div>

              <div>

                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {title}
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {description}
                </p>

              </div>

            </div>

            {canEdit && (
              <button
                type="button"
                onClick={
                  openCreateModal
                }
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
              >
                <Plus size={17} />

                Nueva estrategia
              </button>
            )}

          </div>

        </div>

        {/* CONTENIDO */}

        <div className="p-6">

          {loading ? (

            <div className="flex items-center gap-2 text-gray-500">

              <Loader
                size={18}
                className="animate-spin"
              />

              Cargando...

            </div>

          ) : items.length === 0 ? (

            <div className="text-center py-12">

              <CalendarDays
                size={40}
                className="mx-auto text-gray-300 mb-3"
              />

              <p className="font-semibold text-gray-700 dark:text-gray-300">
                No hay estrategias registradas
              </p>

              {canEdit && (
                <p className="text-sm text-gray-500 mt-1">
                  Puedes comenzar agregando una nueva estrategia.
                </p>
              )}

            </div>

          ) : (

            <div className="space-y-3">

              {items.map(
                (item) => (

                  <div
                    key={item.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {item.title}
                          </h3>

                          <span
                            className={`text-[11px] font-semibold px-2 py-1 rounded-full ${getStatusClasses(
                              item.status
                            )}`}
                          >
                            {getStatusLabel(
                              item.status
                            )}
                          </span>

                        </div>

                        {item.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {item.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">

                          <span>
                            📅{' '}
                            {item.strategy_date}
                          </span>

                          {item.strategy_time && (
                            <span>
                              🕐{' '}
                              {item.strategy_time.slice(
                                0,
                                5
                              )}
                            </span>
                          )}

                        </div>

                      </div>

                      {canEdit && (
                        <div className="flex gap-1 shrink-0">

                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                item
                              )
                            }
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                            title="Editar"
                          >
                            <Pencil
                              size={16}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                item
                              )
                            }
                            disabled={
                              deletingId ===
                              item.id
                            }
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 disabled:opacity-50"
                            title="Eliminar"
                          >
                            {deletingId ===
                            item.id ? (
                              <Loader
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2
                                size={16}
                              />
                            )}
                          </button>

                        </div>
                      )}

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      </div>

      {/* =====================================================
          MODAL CREAR / EDITAR
      ===================================================== */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">

            {/* HEADER MODAL */}

            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">

              <div>

                <h2 className="text-lg font-bold text-gray-900 dark:text-white">

                  {editingItem
                    ? 'Editar estrategia'
                    : 'Nueva estrategia'}

                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">

                  {type ===
                  'transmissions'
                    ? 'Estrategia de transmisiones'
                    : 'Estrategia digital de cursos'}

                </p>

              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={saving}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                <X size={20} />
              </button>

            </div>

            {/* FORMULARIO */}

            <div className="p-5 space-y-4">

              {/* TÍTULO */}

              <div>

                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Título *
                </label>

                <input
                  type="text"
                  value={
                    form.title
                  }
                  onChange={(e) =>
                    setForm(
                      (prev) => ({
                        ...prev,
                        title:
                          e.target.value,
                      })
                    )
                  }
                  placeholder="Ej. Transmisión en vivo"
                  disabled={saving}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

              {/* DESCRIPCIÓN */}

              <div>

                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Descripción
                </label>

                <textarea
                  value={
                    form.description
                  }
                  onChange={(e) =>
                    setForm(
                      (prev) => ({
                        ...prev,
                        description:
                          e.target.value,
                      })
                    )
                  }
                  placeholder="Detalles de la estrategia..."
                  rows={3}
                  disabled={saving}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />

              </div>

              {/* FECHA Y HORA */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>

                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Fecha *
                  </label>

                  <input
                    type="date"
                    value={
                      form.strategy_date
                    }
                    onChange={(e) =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          strategy_date:
                            e.target.value,
                        })
                      )
                    }
                    disabled={saving}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />

                </div>

                <div>

                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Hora
                  </label>

                  <input
                    type="time"
                    value={
                      form.strategy_time
                    }
                    onChange={(e) =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          strategy_time:
                            e.target.value,
                        })
                      )
                    }
                    disabled={saving}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />

                </div>

              </div>

              {/* ESTADO */}

              <div>

                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Estado
                </label>

                <select
                  value={
                    form.status
                  }
                  onChange={(e) =>
                    setForm(
                      (prev) => ({
                        ...prev,
                        status:
                          e.target.value as StrategyForm['status'],
                      })
                    )
                  }
                  disabled={saving}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                >

                  <option value="planned">
                    Planeada
                  </option>

                  <option value="in_progress">
                    En progreso
                  </option>

                  <option value="completed">
                    Completada
                  </option>

                </select>

              </div>

            </div>

            {/* FOOTER */}

            <div className="flex gap-3 p-5 border-t border-gray-200 dark:border-gray-800">

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={
                  handleSave
                }
                disabled={
                  saving ||
                  !form.title.trim() ||
                  !form.strategy_date
                }
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >

                {saving ? (
                  <>
                    <Loader
                      size={17}
                      className="animate-spin"
                    />

                    Guardando...
                  </>
                ) : (
                  <>
                    <Save
                      size={17}
                    />

                    {editingItem
                      ? 'Guardar cambios'
                      : 'Crear estrategia'}
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