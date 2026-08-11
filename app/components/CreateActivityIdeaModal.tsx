'use client'

import {
  FormEvent,
  useEffect,
  useState,
} from 'react'

import {
  ActivityIdeaPriority,
  createActivityIdea,
} from '@/lib/activity-ideas-hooks'

import {
  X,
  Loader,
  Lightbulb,
} from 'lucide-react'

import {
  createClient,
} from '@/lib/supabase/client'


interface UserProfile {
  id: string
  full_name: string
  role: string
}


interface CreateActivityIdeaModalProps {

  isOpen: boolean

  onClose: () => void

  onSuccess: () => void

}


export default function CreateActivityIdeaModal({

  isOpen,

  onClose,

  onSuccess,

}: CreateActivityIdeaModalProps) {

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
  ] =
    useState<ActivityIdeaPriority>(
      'medium',
    )

  const [
    users,
    setUsers,
  ] =
    useState<UserProfile[]>([])

  const [
    loadingUsers,
    setLoadingUsers,
  ] =
    useState(false)

  const [
    saving,
    setSaving,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState<string | null>(null)


  // =======================================================
  // CARGAR USUARIOS
  // =======================================================

  useEffect(
    () => {

      if (!isOpen) {
        return
      }

      const loadUsers =
        async () => {

          try {

            setLoadingUsers(true)

            const supabase =
              createClient()

            const {
              data,
              error,
            } =
              await supabase
                .from(
                  'user_profiles',
                )
                .select(
                  'id, full_name, role',
                )
                .order(
                  'full_name',
                )

            if (error) {
              throw error
            }

            setUsers(
              data || [],
            )

          } catch (err) {

            console.error(
              err,
            )

          } finally {

            setLoadingUsers(
              false,
            )

          }

        }

      loadUsers()

    },
    [
      isOpen,
    ],
  )


  // =======================================================
  // RESET
  // =======================================================

  const resetForm =
    () => {

      setTitle('')
      setDescription('')
      setAssignedTo('')
      setDueDate('')
      setDueTime('')
      setPriority('medium')
      setError(null)

    }


  // =======================================================
  // CERRAR
  // =======================================================

  const handleClose =
    () => {

      if (saving) {
        return
      }

      resetForm()

      onClose()

    }


  // =======================================================
  // GUARDAR
  // =======================================================

  const handleSubmit =
    async (
      event: FormEvent,
    ) => {

      event.preventDefault()

      if (!title.trim()) {

        setError(
          'Escribe un título para la idea.',
        )

        return

      }

      try {

        setSaving(true)
        setError(null)

        await createActivityIdea({

          title,

          description,

          assigned_to:
            assignedTo ||
            null,

          due_date:
            dueDate ||
            null,

          due_time:
            dueTime ||
            null,

          priority,

        })

        resetForm()

        onSuccess()

      } catch (err) {

        console.error(
          'Error creando idea:',
          err,
        )

        setError(
          err instanceof Error
            ? err.message
            : 'No se pudo crear la idea.',
        )

      } finally {

        setSaving(false)

      }

    }


  if (!isOpen) {
    return null
  }


  return (

    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black/50
        p-4
      "
    >

      <div
        className="
          w-full max-w-lg
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
            flex items-center justify-between
            border-b
            border-gray-200
            px-6 py-4
            dark:border-gray-700
          "
        >

          <div
            className="
              flex items-center gap-3
            "
          >

            <div
              className="
                flex h-10 w-10
                items-center justify-center
                rounded-lg
                bg-amber-100
                text-amber-600
                dark:bg-amber-900/30
              "
            >

              <Lightbulb
                size={22}
              />

            </div>

            <div>

              <h2
                className="
                  text-lg font-bold
                  text-gray-900
                  dark:text-white
                "
              >
                Nueva idea
              </h2>

              <p
                className="
                  text-sm
                  text-gray-500
                  dark:text-gray-400
                "
              >
                Será enviada a Hugo para aprobación.
              </p>

            </div>

          </div>


          <button
            type="button"
            onClick={
              handleClose
            }
            className="
              rounded-lg
              p-2
              text-gray-500
              hover:bg-gray-100
              dark:hover:bg-gray-800
            "
          >

            <X
              size={20}
            />

          </button>

        </div>


        {/* =================================================
            FORM
        ================================================= */}

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-4 p-6"
        >

          {/* TÍTULO */}

          <div>

            <label
              className="
                mb-1 block
                text-sm font-semibold
                text-gray-700
                dark:text-gray-300
              "
            >
              Título
            </label>

            <input
              value={
                title
              }
              onChange={
                (event) =>
                  setTitle(
                    event.target.value,
                  )
              }
              placeholder="Ej. Grabar video para campaña"
              className="
                w-full rounded-lg
                border border-gray-300
                bg-white
                px-3 py-2
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


          {/* DESCRIPCIÓN */}

          <div>

            <label
              className="
                mb-1 block
                text-sm font-semibold
                text-gray-700
                dark:text-gray-300
              "
            >
              Descripción
            </label>

            <textarea
              value={
                description
              }
              onChange={
                (event) =>
                  setDescription(
                    event.target.value,
                  )
              }
              rows={4}
              placeholder="Explica qué quieres realizar..."
              className="
                w-full resize-none
                rounded-lg
                border border-gray-300
                bg-white
                px-3 py-2
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


          {/* ASIGNAR */}

          <div>

            <label
              className="
                mb-1 block
                text-sm font-semibold
                text-gray-700
                dark:text-gray-300
              "
            >
              Proponer para
            </label>

            <select
              value={
                assignedTo
              }
              onChange={
                (event) =>
                  setAssignedTo(
                    event.target.value,
                  )
              }
              disabled={
                loadingUsers
              }
              className="
                w-full rounded-lg
                border border-gray-300
                bg-white
                px-3 py-2
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
                    key={
                      user.id
                    }
                    value={
                      user.id
                    }
                  >
                    {user.full_name}
                  </option>

                ),
              )}

            </select>

          </div>


          {/* FECHA / HORA */}

          <div
            className="
              grid grid-cols-2
              gap-3
            "
          >

            <div>

              <label
                className="
                  mb-1 block
                  text-sm font-semibold
                  text-gray-700
                  dark:text-gray-300
                "
              >
                Fecha propuesta
              </label>

              <input
                type="date"
                value={
                  dueDate
                }
                onChange={
                  (event) =>
                    setDueDate(
                      event.target.value,
                    )
                }
                className="
                  w-full rounded-lg
                  border border-gray-300
                  bg-white
                  px-3 py-2
                  dark:border-gray-700
                  dark:bg-gray-800
                  dark:text-white
                "
              />

            </div>


            <div>

              <label
                className="
                  mb-1 block
                  text-sm font-semibold
                  text-gray-700
                  dark:text-gray-300
                "
              >
                Hora propuesta
              </label>

              <input
                type="time"
                value={
                  dueTime
                }
                onChange={
                  (event) =>
                    setDueTime(
                      event.target.value,
                    )
                }
                className="
                  w-full rounded-lg
                  border border-gray-300
                  bg-white
                  px-3 py-2
                  dark:border-gray-700
                  dark:bg-gray-800
                  dark:text-white
                "
              />

            </div>

          </div>


          {/* PRIORIDAD */}

          <div>

            <label
              className="
                mb-1 block
                text-sm font-semibold
                text-gray-700
                dark:text-gray-300
              "
            >
              Prioridad
            </label>

            <select
              value={
                priority
              }
              onChange={
                (event) =>
                  setPriority(
                    event.target.value as ActivityIdeaPriority,
                  )
              }
              className="
                w-full rounded-lg
                border border-gray-300
                bg-white
                px-3 py-2
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


          {/* ERROR */}

          {error && (

            <div
              className="
                rounded-lg
                bg-red-50
                p-3
                text-sm
                text-red-700
                dark:bg-red-900/20
                dark:text-red-400
              "
            >
              {error}
            </div>

          )}


          {/* BOTONES */}

          <div
            className="
              flex justify-end
              gap-3
              pt-2
            "
          >

            <button
              type="button"
              onClick={
                handleClose
              }
              disabled={
                saving
              }
              className="
                rounded-lg
                border
                border-gray-300
                px-4 py-2
                font-semibold
                text-gray-700
                hover:bg-gray-50
                dark:border-gray-700
                dark:text-gray-300
                dark:hover:bg-gray-800
              "
            >
              Cancelar
            </button>


            <button
              type="submit"
              disabled={
                saving
              }
              className="
                flex items-center
                gap-2
                rounded-lg
                bg-amber-500
                px-4 py-2
                font-semibold
                text-white
                hover:bg-amber-600
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >

              {saving && (

                <Loader
                  size={18}
                  className="animate-spin"
                />

              )}

              {saving
                ? 'Enviando...'
                : 'Enviar idea'}

            </button>

          </div>

        </form>

      </div>

    </div>

  )

}