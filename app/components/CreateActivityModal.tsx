'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUsers, useCurrentUser } from '@/lib/marketing-hooks'
import { X } from 'lucide-react'

interface CreateActivityModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateActivityModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateActivityModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('medium')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const { user } = useCurrentUser()
  const { users } = useUsers()

  // =========================================================
  // CREAR ACTIVIDAD
  // =========================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      alert('El título es obligatorio')
      return
    }

    if (!assignedTo) {
      alert('Selecciona un usuario')
      return
    }

    if (!dueDate) {
      alert('Selecciona una fecha de vencimiento')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('activities')
        .insert([
          {
            title: title.trim(),
            description: description.trim(),
            assigned_to: assignedTo,
            created_by: user?.id,
            due_date: dueDate,
            priority,
            status: 'pending',
          },
        ])

      if (error) {
        console.error('Error creating activity:', error)
        alert(`Error al crear actividad: ${error.message}`)
        return
      }

      // Limpiar formulario
      setTitle('')
      setDescription('')
      setAssignedTo('')
      setDueDate('')
      setPriority('medium')

      // Avisar al componente padre
      onSuccess()

      // Cerrar modal
      onClose()
    } catch (error) {
      console.error('Error creating activity:', error)
      alert('Error al crear actividad')
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // CERRAR MODAL
  // =========================================================

  const handleClose = () => {
    if (loading) return

    setTitle('')
    setDescription('')
    setAssignedTo('')
    setDueDate('')
    setPriority('medium')

    onClose()
  }

  // =========================================================
  // SI EL MODAL ESTÁ CERRADO
  // =========================================================

  if (!isOpen) return null

  // =========================================================
  // FILTRAR EJECUTORES
  // =========================================================

  const executors = users.filter(
    (u) => u.role === 'executor'
  )

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

          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Crear Actividad
          </h2>

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
            FORMULARIO
        ===================================================== */}

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4"
        >

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
              placeholder="Ej: Contactar leads de FB"
            />
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
          </div>

          {/* ===================================================
              ASIGNAR + FECHA
          =================================================== */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* ASIGNAR A */}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Asignar a *
              </label>

              <select
                value={assignedTo}
                onChange={(e) =>
                  setAssignedTo(e.target.value)
                }
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >

                <option value="">
                  Selecciona usuario
                </option>

                {executors.map((u) => (
                  <option
                    key={u.id}
                    value={u.id}
                  >
                    {u.full_name}
                  </option>
                ))}

              </select>

              {executors.length === 0 && (
                <p className="mt-1 text-xs text-red-500">
                  No hay ejecutores disponibles.
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
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Creando...'
                : 'Crear Actividad'}
            </button>

          </div>

        </form>

      </div>

    </div>
  )
}