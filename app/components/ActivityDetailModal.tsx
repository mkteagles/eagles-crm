'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  X,
  Save,
  Trash2,
  Calendar,
  User,
  Flag,
  FileText,
} from 'lucide-react'

import {
  ActivityStatus,
} from '@/lib/marketing-types'

type Props = {
  activity: any
  currentUserRole?: string
  currentUserId?: string
  onClose: () => void
}

export default function ActivityDetailModal({
  activity,
  currentUserRole,
  currentUserId,
  onClose,
}: Props) {

  const supabase = createClient()

  const isAdmin =
    currentUserRole === 'admin'

  // =====================================================
  // ESTADOS
  // =====================================================

  const [title, setTitle] =
    useState(activity?.title || '')

  const [description, setDescription] =
    useState(activity?.description || '')

  const [assignedTo, setAssignedTo] =
    useState(activity?.assigned_to || '')

  const [dueDate, setDueDate] =
    useState(activity?.due_date || '')

  const [priority, setPriority] =
    useState(activity?.priority || 'medium')

  const [status, setStatus] =
    useState<ActivityStatus>(
      activity?.status || 'pending'
    )

  const [users, setUsers] =
    useState<any[]>([])

  const [saving, setSaving] =
    useState(false)

  const [deleting, setDeleting] =
    useState(false)

  // =====================================================
  // CARGAR USUARIOS
  // =====================================================

  useEffect(() => {

    if (!isAdmin) {
      return
    }

    const loadUsers = async () => {

      const {
        data,
        error,
      } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .order('full_name', {
          ascending: true,
        })

      if (error) {
        console.error(
          'Error cargando usuarios:',
          error
        )

        return
      }

      setUsers(data || [])
    }

    loadUsers()

  }, [isAdmin])

  // =====================================================
  // CERRAR CON ESC
  // =====================================================

  useEffect(() => {

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {

      if (event.key === 'Escape') {
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

  }, [onClose])

  // =====================================================
  // GUARDAR
  // =====================================================

  const handleSave = async () => {

    if (!isAdmin) {
      return
    }

    if (!title.trim()) {

      alert(
        'El título de la actividad es obligatorio.'
      )

      return
    }

    setSaving(true)

    try {

      const {
        error,
      } = await supabase
        .from('activities')
        .update({
          title:
            title.trim(),

          description:
            description.trim() ||
            null,

          assigned_to:
            assignedTo ||
            null,

          due_date:
            dueDate ||
            null,

          priority,

          status,

          updated_at:
            new Date().toISOString(),
        })
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
          `No se pudo guardar la actividad: ${error.message}`
        )

        return
      }

      console.log(
        '✅ Actividad actualizada:',
        activity.id
      )

      onClose()

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

  // =====================================================
  // ELIMINAR
  // =====================================================

  const handleDelete = async () => {

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
      } = await supabase
        .from('activities')
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
          `No se pudo eliminar la actividad: ${error.message}`
        )

        return
      }

      console.log(
        '🗑️ Actividad eliminada:',
        activity.id
      )

      onClose()

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

  // =====================================================
  // MODAL
  // =====================================================

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
      onMouseDown={(event) => {

        if (
          event.target ===
          event.currentTarget
        ) {
          onClose()
        }

      }}
    >

      {/* ===============================================
          BACKDROP
      =============================================== */}

      <div
        className="
          absolute
          inset-0
          bg-black/60
          backdrop-blur-sm
        "
      />

      {/* ===============================================
          VENTANA
      =============================================== */}

      <div
        className="
          relative
          z-10
          w-full
          max-w-2xl
          max-h-[90vh]
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

        {/* =============================================
            HEADER
        ============================================= */}

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

            <X size={20} />

          </button>

        </div>

        {/* =============================================
            CONTENIDO
        ============================================= */}

        <div className="p-6 space-y-5">

          {/* ===========================================
              TÍTULO
          =========================================== */}

          <div>

            <label
              className="
                mb-2
                block
                text-sm
                font-semibold
                text-gray-700
                dark:text-gray-300
              "
            >
              Actividad
            </label>

            {isAdmin ? (

              <input
                type="text"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
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

              <div
                className="
                  rounded-lg
                  bg-gray-50
                  dark:bg-gray-800/60
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  text-gray-900
                  dark:text-white
                "
              >
                {activity.title}
              </div>

            )}

          </div>

          {/* ===========================================
              DESCRIPCIÓN
          =========================================== */}

          <div>

            <label
              className="
                mb-2
                flex
                items-center
                gap-2
                text-sm
                font-semibold
                text-gray-700
                dark:text-gray-300
              "
            >

              <FileText size={15} />

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

              <div
                className="
                  rounded-lg
                  bg-gray-50
                  dark:bg-gray-800/60
                  px-4
                  py-3
                  text-sm
                  text-gray-700
                  dark:text-gray-300
                  whitespace-pre-wrap
                "
              >
                {activity.description ||
                  'Sin descripción'}
              </div>

            )}

          </div>

          {/* ===========================================
              GRID
          =========================================== */}

          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-2
              gap-4
            "
          >

            {/* =========================================
                ASIGNADO
            ========================================= */}

            <div>

              <label
                className="
                  mb-2
                  flex
                  items-center
                  gap-2
                  text-sm
                  font-semibold
                  text-gray-700
                  dark:text-gray-300
                "
              >

                <User size={15} />

                Asignado a

              </label>

              {isAdmin ? (

                <select
                  value={assignedTo}
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
                    outline-none
                    focus:ring-2
                    focus:ring-blue-500
                  "
                >

                  <option value="">
                    Sin asignar
                  </option>

                  {users.map(
                    (user) => (

                      <option
                        key={user.id}
                        value={user.id}
                      >
                        {user.full_name}
                      </option>

                    )
                  )}

                </select>

              ) : (

                <div
                  className="
                    rounded-lg
                    bg-gray-50
                    dark:bg-gray-800/60
                    px-4
                    py-2.5
                    text-sm
                    text-gray-700
                    dark:text-gray-300
                  "
                >
                  {activity.assigned_to_name ||
                    activity.assigned_to ||
                    'Sin asignar'}
                </div>

              )}

            </div>

            {/* =========================================
                FECHA
            ========================================= */}

            <div>

              <label
                className="
                  mb-2
                  flex
                  items-center
                  gap-2
                  text-sm
                  font-semibold
                  text-gray-700
                  dark:text-gray-300
                "
              >

                <Calendar size={15} />

                Fecha de vencimiento

              </label>

              {isAdmin ? (

                <input
                  type="date"
                  value={
                    dueDate
                      ? String(
                          dueDate
                        ).slice(
                          0,
                          10
                        )
                      : ''
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
                    outline-none
                    focus:ring-2
                    focus:ring-blue-500
                  "
                />

              ) : (

                <div
                  className="
                    rounded-lg
                    bg-gray-50
                    dark:bg-gray-800/60
                    px-4
                    py-2.5
                    text-sm
                    text-gray-700
                    dark:text-gray-300
                  "
                >
                  {activity.due_date ||
                    'Sin fecha'}
                </div>

              )}

            </div>

            {/* =========================================
                PRIORIDAD
            ========================================= */}

            <div>

              <label
                className="
                  mb-2
                  flex
                  items-center
                  gap-2
                  text-sm
                  font-semibold
                  text-gray-700
                  dark:text-gray-300
                "
              >

                <Flag size={15} />

                Prioridad

              </label>

              {isAdmin ? (

                <select
                  value={priority}
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
                    outline-none
                    focus:ring-2
                    focus:ring-blue-500
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

                <div
                  className="
                    rounded-lg
                    bg-gray-50
                    dark:bg-gray-800/60
                    px-4
                    py-2.5
                    text-sm
                    text-gray-700
                    dark:text-gray-300
                  "
                >
                  {activity.priority}
                </div>

              )}

            </div>

            {/* =========================================
                ESTADO
            ========================================= */}

            <div>

              <label
                className="
                  mb-2
                  block
                  text-sm
                  font-semibold
                  text-gray-700
                  dark:text-gray-300
                "
              >
                Estado
              </label>

              {isAdmin ? (

                <select
                  value={status}
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
                    outline-none
                    focus:ring-2
                    focus:ring-blue-500
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

                <div
                  className="
                    rounded-lg
                    bg-gray-50
                    dark:bg-gray-800/60
                    px-4
                    py-2.5
                    text-sm
                    text-gray-700
                    dark:text-gray-300
                  "
                >
                  {activity.status}
                </div>

              )}

            </div>

          </div>

          {/* ===========================================
              INFORMACIÓN EXTRA
          =========================================== */}

          <div
            className="
              rounded-lg
              border
              border-gray-200
              dark:border-gray-800
              bg-gray-50
              dark:bg-gray-800/40
              p-4
            "
          >

            <div
              className="
                grid
                grid-cols-1
                md:grid-cols-2
                gap-3
                text-xs
              "
            >

              <div>

                <span className="text-gray-500">
                  Creada:
                </span>

                <span
                  className="
                    ml-2
                    text-gray-700
                    dark:text-gray-300
                  "
                >
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

                <span
                  className="
                    ml-2
                    text-gray-700
                    dark:text-gray-300
                  "
                >
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

        {/* =============================================
            FOOTER
        ============================================= */}

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
              onClick={handleDelete}
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
                transition
              "
            >

              <Trash2 size={17} />

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
              onClick={onClose}
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
                disabled:opacity-50
                transition
              "
            >
              Cerrar
            </button>

            {isAdmin && (

              <button
                type="button"
                onClick={handleSave}
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
                  transition
                "
              >

                <Save size={17} />

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