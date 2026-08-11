
'use client'

import {
  FormEvent,
  useEffect,
  useState,
} from 'react'

import {
  ActivityIdea,
  approveActivityIdea,
} from '@/lib/activity-ideas-hooks'

import {
  X,
  Loader,
  Check,
  CalendarDays,
  User,
  Flag,
} from 'lucide-react'

import {
  createClient,
} from '@/lib/supabase/client'

// =======================================================
// TIPOS
// =======================================================

type ActivityIdeaPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent'

interface UserProfile {
  id: string
  full_name: string
  role: string
}

interface ReviewActivityIdeaModalProps {
  isOpen: boolean
  idea: ActivityIdea | null
  onClose: () => void
  onSuccess: () => void
}

// =======================================================
// COMPONENTE
// =======================================================

export default function ReviewActivityIdeaModal({
  isOpen,
  idea,
  onClose,
  onSuccess,
}: ReviewActivityIdeaModalProps) {

  // =====================================================
  // FORMULARIO
  // =====================================================

  const [
    title,
    setTitle,
  ] = useState('')

  const [
    description,
    setDescription,
  ] = useState('')

  const [
    assignedTo,
    setAssignedTo,
  ] = useState('')

  const [
    dueDate,
    setDueDate,
  ] = useState('')

  const [
    dueTime,
    setDueTime,
  ] = useState('')

  const [
    priority,
    setPriority,
  ] = useState<ActivityIdeaPriority>('medium')

  // =====================================================
  // USUARIOS
  // =====================================================

  const [
    users,
    setUsers,
  ] = useState<UserProfile[]>([])

  const [
    loadingUsers,
    setLoadingUsers,
  ] = useState(false)

  // =====================================================
  // ESTADOS
  // =====================================================

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<string | null>(null)

  // =====================================================
  // CARGAR IDEA
  // =====================================================

  useEffect(() => {
    if (!isOpen || !idea) {
      return
    }

    setTitle(
      idea.title || '',
    )

    setDescription(
      idea.description || '',
    )

    /*
     * IMPORTANTE:
     *
     * Si la idea ya tiene assigned_to,
     * usamos ese responsable.
     *
     * Si no tiene assigned_to,
     * usamos created_by como responsable
     * por defecto.
     *
     * Esto hace que:
     *
     * Marcos crea idea
     *        ↓
     * Hugo aprueba
     *        ↓
     * actividad para Marcos
     *
     * Úrsula crea idea
     *        ↓
     * Hugo aprueba
     *        ↓
     * actividad para Úrsula
     */
    setAssignedTo(
      idea.assigned_to ||
      idea.created_by ||
      '',
    )

    setDueDate(
      idea.due_date || '',
    )

    setDueTime(
      idea.due_time
        ? idea.due_time.slice(0, 5)
        : '',
    )

    setPriority(
      (idea.priority as ActivityIdeaPriority) ||
      'medium',
    )

    setError(null)

  }, [
    isOpen,
    idea,
  ])

  // =====================================================
  // CARGAR USUARIOS
  // =====================================================

  useEffect(() => {

    if (!isOpen) {
      return
    }

    const loadUsers = async () => {

      try {

        setLoadingUsers(true)

        const supabase =
          createClient()

        const {
          data,
          error,
        } =
          await supabase
            .from('user_profiles')
            .select(
              'id, full_name, role',
            )
            .order(
              'full_name',
              {
                ascending: true,
              },
            )

        if (error) {
          throw error
        }

        setUsers(
          data || [],
        )

      } catch (err) {

        console.error(
          'Error cargando usuarios:',
          err,
        )

      } finally {

        setLoadingUsers(false)

      }
    }

    loadUsers()

  }, [
    isOpen,
  ])

  // =====================================================
  // CERRAR
  // =====================================================

  const handleClose = () => {

    if (saving) {
      return
    }

    setError(null)

    onClose()
  }

  // =====================================================
  // APROBAR Y CREAR ACTIVIDAD
  // =====================================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {

    event.preventDefault()

    if (!idea) {
      return
    }

    if (!title.trim()) {

      setError(
        'El título es obligatorio.',
      )

      return
    }

    /*
     * Si por alguna razón assignedTo está vacío,
     * intentamos utilizar al creador de la idea.
     */
    const finalAssignedTo =
      assignedTo ||
      idea.created_by ||
      null

    try {

      setSaving(true)
      setError(null)

      await approveActivityIdea({

        ideaId:
          idea.id,

        title:
          title.trim(),

        description:
          description.trim() ||
          null,

        assigned_to:
          finalAssignedTo,

        due_date:
          dueDate ||
          null,

        due_time:
          dueTime ||
          null,

        priority,

      })

      /*
       * El hook debe encargarse de:
       *
       * 1. Crear la actividad.
       * 2. Marcar la idea como approved.
       *
       * Después avisamos al dashboard para
       * actualizar la información.
       */
      onSuccess()

    } catch (err) {

      console.error(
        'Error aprobando idea:',
        err,
      )

      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo aprobar la idea.',
      )

    } finally {

      setSaving(false)

    }
  }

  // =====================================================
  // NO MOSTRAR MODAL
  // =====================================================

  if (!isOpen || !idea) {
    return null
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div
      className="
        fixed inset-0
        z-[70]
        flex items-center
        justify-center
        bg-black/60
        p-4
      "
    >

      <div
        className="
          flex
          max-h-[90vh]
          w-full
          max-w-2xl
          flex-col
          overflow-hidden
          rounded-2xl
          bg-white
          shadow-2xl
          dark:bg-gray-900
        "
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="
            flex
            shrink-0
            items-center
            justify-between
            border-b
            border-gray-200
            px-6
            py-4
            dark:border-gray-700
          "
        >

          <div>

            <div
              className="
                flex
                items-center
                gap-2
              "
            >

              <div
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  bg-green-100
                  text-green-600
                  dark:bg-green-900/30
                  dark:text-green-400
                "
              >

                <Check
                  size={19}
                />

              </div>

              <h2
                className="
                  text-lg
                  font-bold
                  text-gray-900
                  dark:text-white
                "
              >
                Revisar actividad
              </h2>

            </div>

            <p
              className="
                mt-1
                text-sm
                text-gray-500
                dark:text-gray-400
              "
            >
              Modifica los datos antes de convertir la idea en actividad.
            </p>

          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="
              rounded-lg
              p-2
              text-gray-500
              transition
              hover:bg-gray-100
              dark:hover:bg-gray-800
              disabled:cursor-not-allowed
              disabled:opacity-50
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

        <form
          onSubmit={handleSubmit}
          className="
            overflow-y-auto
            p-6
          "
        >

          <div
            className="
              space-y-5
            "
          >

            {/* =================================================
                AVISO
            ================================================= */}

            <div
              className="
                rounded-xl
                border
                border-amber-200
                bg-amber-50
                p-4
                text-sm
                text-amber-800
                dark:border-amber-900/50
                dark:bg-amber-900/20
                dark:text-amber-300
              "
            >

              <strong>
                Revisión de Hugo
              </strong>

              <p className="mt-1">
                Estos valores serán los que se utilizarán para crear la actividad.
              </p>

            </div>

            {/* =================================================
                TÍTULO
            ================================================= */}

            <div>

              <label
                className="
                  mb-1
                  block
                  text-sm
                  font-semibold
                  text-gray-700
                  dark:text-gray-300
                "
              >
                Título
              </label>

              <input
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(
                    event.target.value,
                  )
                }
                disabled={saving}
                className="
                  w-full
                  rounded-lg
                  border
                  border-gray-300
                  bg-white
                  px-3
                  py-2
                  text-sm
                  outline-none
                  focus:border-amber-500
                  focus:ring-2
                  focus:ring-amber-500/20
                  dark:border-gray-700
                  dark:bg-gray-800
                  dark:text-white
                "
              />

            </div>

            {/* =================================================
                DESCRIPCIÓN
            ================================================= */}

            <div>

              <label
                className="
                  mb-1
                  block
                  text-sm
                  font-semibold
                  text-gray-700
                  dark:text-gray-300
                "
              >
                Descripción
              </label>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value,
                  )
                }
                disabled={saving}
                rows={4}
                className="
                  w-full
                  resize-none
                  rounded-lg
                  border
                  border-gray-300
                  bg-white
                  px-3
                  py-2
                  text-sm
                  outline-none
                  focus:border-amber-500
                  focus:ring-2
                  focus:ring-amber-500/20
                  dark:border-gray-700
                  dark:bg-gray-800
                  dark:text-white
                "
              />

            </div>

            {/* =================================================
                RESPONSABLE
            ================================================= */}

            <div>

              <label
                className="
                  mb-1
                  flex
                  items-center
                  gap-1
                  text-sm
                  font-semibold
                  text-gray-700
                  dark:text-gray-300
                "
              >

                <User
                  size={14}
                />

                Responsable

              </label>

              <select
                value={assignedTo}
                onChange={(event) =>
                  setAssignedTo(
                    event.target.value,
                  )
                }
                disabled={
                  saving ||
                  loadingUsers
                }
                className="
                  w-full
                  rounded-lg
                  border
                  border-gray-300
                  bg-white
                  px-3
                  py-2
                  text-sm
                  outline-none
                  focus:border-amber-500
                  focus:ring-2
                  focus:ring-amber-500/20
                  dark:border-gray-700
                  dark:bg-gray-800
                  dark:text-white
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

                  ),
                )}

              </select>

              {idea.created_by && (

                <p
                  className="
                    mt-1
                    text-xs
                    text-gray-500
                    dark:text-gray-400
                  "
                >
                  Por defecto se asigna al creador de la idea.
                </p>

              )}

            </div>

            {/* =================================================
                FECHA / HORA
            ================================================= */}

            <div
              className="
                grid
                grid-cols-1
                gap-4
                sm:grid-cols-2
              "
            >

              <div>

                <label
                  className="
                    mb-1
                    flex
                    items-center
                    gap-1
                    text-sm
                    font-semibold
                    text-gray-700
                    dark:text-gray-300
                  "
                >

                  <CalendarDays
                    size={14}
                  />

                  Fecha

                </label>

                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) =>
                    setDueDate(
                      event.target.value,
                    )
                  }
                  disabled={saving}
                  className="
                    w-full
                    rounded-lg
                    border
                    border-gray-300
                    bg-white
                    px-3
                    py-2
                    text-sm
                    outline-none
                    focus:border-amber-500
                    focus:ring-2
                    focus:ring-amber-500/20
                    dark:border-gray-700
                    dark:bg-gray-800
                    dark:text-white
                  "
                />

              </div>

              <div>

                <label
                  className="
                    mb-1
                    block
                    text-sm
                    font-semibold
                    text-gray-700
                    dark:text-gray-300
                  "
                >
                  Hora
                </label>

                <input
                  type="time"
                  value={dueTime}
                  onChange={(event) =>
                    setDueTime(
                      event.target.value,
                    )
                  }
                  disabled={saving}
                  className="
                    w-full
                    rounded-lg
                    border
                    border-gray-300
                    bg-white
                    px-3
                    py-2
                    text-sm
                    outline-none
                    focus:border-amber-500
                    focus:ring-2
                    focus:ring-amber-500/20
                    dark:border-gray-700
                    dark:bg-gray-800
                    dark:text-white
                  "
                />

              </div>

            </div>

            {/* =================================================
                PRIORIDAD
            ================================================= */}

            <div>

              <label
                className="
                  mb-1
                  flex
                  items-center
                  gap-1
                  text-sm
                  font-semibold
                  text-gray-700
                  dark:text-gray-300
                "
              >

                <Flag
                  size={14}
                />

                Prioridad

              </label>

              <select
                value={priority}
                onChange={(event) =>
                  setPriority(
                    event.target.value as ActivityIdeaPriority,
                  )
                }
                disabled={saving}
                className="
                  w-full
                  rounded-lg
                  border
                  border-gray-300
                  bg-white
                  px-3
                  py-2
                  text-sm
                  outline-none
                  focus:border-amber-500
                  focus:ring-2
                  focus:ring-amber-500/20
                  dark:border-gray-700
                  dark:bg-gray-800
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

            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

              <div
                className="
                  rounded-lg
                  border
                  border-red-200
                  bg-red-50
                  p-3
                  text-sm
                  text-red-700
                  dark:border-red-900/50
                  dark:bg-red-900/20
                  dark:text-red-400
                "
              >
                {error}
              </div>

            )}

          </div>

          {/* =================================================
              BOTONES
          ================================================= */}

          <div
            className="
              mt-6
              flex
              justify-end
              gap-3
              border-t
              border-gray-200
              pt-5
              dark:border-gray-700
            "
          >

            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="
                rounded-lg
                border
                border-gray-300
                px-4
                py-2
                text-sm
                font-semibold
                text-gray-700
                transition
                hover:bg-gray-50
                dark:border-gray-700
                dark:text-gray-300
                dark:hover:bg-gray-800
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="
                flex
                items-center
                gap-2
                rounded-lg
                bg-green-600
                px-4
                py-2
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-green-700
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >

              {saving && (

                <Loader
                  size={17}
                  className="animate-spin"
                />

              )}

              {saving
                ? 'Creando actividad...'
                : 'Aprobar y crear actividad'}

            </button>

          </div>

        </form>

      </div>

    </div>
  )
}

