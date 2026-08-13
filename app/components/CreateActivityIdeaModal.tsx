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


// =======================================================
// USUARIO
// =======================================================

interface UserProfile {
  id: string
  full_name: string
  role: string
}


// =======================================================
// PROPS
// =======================================================

interface CreateActivityIdeaModalProps {

  isOpen: boolean

  onClose: () => void

  onSuccess: () => void

}


// =======================================================
// COMPONENTE
// =======================================================

export default function CreateActivityIdeaModal({

  isOpen,

  onClose,

  onSuccess,

}: CreateActivityIdeaModalProps) {


  // =====================================================
  // ESTADOS
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


  // =====================================================
  // CARGAR USUARIOS
  // =====================================================

  useEffect(
    () => {

      if (!isOpen) {
        return
      }


      const loadUsers =
        async () => {

          try {

            setLoadingUsers(true)

            setError(null)


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


            setError(
              err instanceof Error
                ? err.message
                : 'No se pudieron cargar los usuarios.',
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


  // =====================================================
  // RESET
  // =====================================================

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


  // =====================================================
  // CERRAR
  // =====================================================

  const handleClose =
    () => {

      if (saving) {
        return
      }


      resetForm()

      onClose()

    }


  // =====================================================
  // GUARDAR
  // =====================================================

  const handleSubmit =
    async (
      event: FormEvent,
    ) => {

      event.preventDefault()


      // -------------------------------------------------
      // VALIDAR TÍTULO
      // -------------------------------------------------

      if (!title.trim()) {

        setError(
          'Escribe un título para la idea.',
        )

        return

      }


      try {

        setSaving(true)

        setError(null)


        // -------------------------------------------------
        // CREAR IDEA
        // -------------------------------------------------

        await createActivityIdea({

          title:
            title.trim(),

          description:
            description.trim(),

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


        // -------------------------------------------------
        // LIMPIAR
        // -------------------------------------------------

        resetForm()


        // -------------------------------------------------
        // ACTUALIZAR LISTA
        // -------------------------------------------------

        onSuccess()


        // -------------------------------------------------
        // CERRAR MODAL
        // -------------------------------------------------

        onClose()


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


  // =====================================================
  // NO MOSTRAR
  // =====================================================

  if (!isOpen) {
    return null
  }


  // =====================================================
  // RENDER
  // =====================================================

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
          max-h-[92vh]
          overflow-y-auto
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
            disabled={
              saving
            }
            className="
              rounded-lg
              p-2
              text-gray-500
              hover:bg-gray-100
              hover:text-gray-900
              disabled:cursor-not-allowed
              disabled:opacity-50
              dark:text-gray-400
              dark:hover:bg-gray-800
              dark:hover:text-white
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
          className="
            space-y-4
            p-6
          "
        >


          {/* =================================================
              TÍTULO
          ================================================= */}

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
              disabled={
                saving
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
                disabled:cursor-not-allowed
                disabled:opacity-60
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
              disabled={
                saving
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
                disabled:cursor-not-allowed
                disabled:opacity-60
                dark:border-gray-700
                dark:bg-gray-800
                dark:text-white
              "
            />

          </div>


          {/* =================================================
              ASIGNAR / PROPONER PARA
          ================================================= */}

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
                loadingUsers ||
                saving
              }
              className="
                w-full rounded-lg
                border border-gray-300
                bg-white
                px-3 py-2
                outline-none
                focus:border-amber-500
                focus:ring-2
                focus:ring-amber-500/20
                disabled:cursor-not-allowed
                disabled:opacity-60
                dark:border-gray-700
                dark:bg-gray-800
                dark:text-white
              "
            >

              <option value="">
                {loadingUsers
                  ? 'Cargando usuarios...'
                  : 'Sin asignar'}
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


            <p
              className="
                mt-1
                text-xs
                text-gray-400
                dark:text-gray-500
              "
            >
              Puedes dejarla sin asignar para que Hugo decida después.
            </p>

          </div>


          {/* =================================================
              FECHA / HORA
          ================================================= */}

          <div
            className="
              grid grid-cols-2
              gap-3
            "
          >


            {/* FECHA */}

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
                disabled={
                  saving
                }
                className="
                  w-full rounded-lg
                  border border-gray-300
                  bg-white
                  px-3 py-2
                  outline-none
                  focus:border-amber-500
                  focus:ring-2
                  focus:ring-amber-500/20
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                  dark:border-gray-700
                  dark:bg-gray-800
                  dark:text-white
                "
              />

            </div>


            {/* HORA */}

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
                disabled={
                  saving
                }
                className="
                  w-full rounded-lg
                  border border-gray-300
                  bg-white
                  px-3 py-2
                  outline-none
                  focus:border-amber-500
                  focus:ring-2
                  focus:ring-amber-500/20
                  disabled:cursor-not-allowed
                  disabled:opacity-60
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
              disabled={
                saving
              }
              className="
                w-full rounded-lg
                border border-gray-300
                bg-white
                px-3 py-2
                outline-none
                focus:border-amber-500
                focus:ring-2
                focus:ring-amber-500/20
                disabled:cursor-not-allowed
                disabled:opacity-60
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
                dark:border-red-800
                dark:bg-red-900/20
                dark:text-red-400
              "
            >

              {error}

            </div>

          )}


          {/* =================================================
              BOTONES
          ================================================= */}

          <div
            className="
              flex justify-end
              gap-3
              pt-2
            "
          >


            {/* CANCELAR */}

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
                transition
                hover:bg-gray-50
                disabled:cursor-not-allowed
                disabled:opacity-50
                dark:border-gray-700
                dark:text-gray-300
                dark:hover:bg-gray-800
              "
            >
              Cancelar
            </button>


            {/* ENVIAR */}

            <button
              type="submit"
              disabled={
                saving ||
                !title.trim()
              }
              className="
                flex items-center
                gap-2
                rounded-lg
                bg-amber-500
                px-4 py-2
                font-semibold
                text-white
                transition
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