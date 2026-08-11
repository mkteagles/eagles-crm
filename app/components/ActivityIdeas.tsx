'use client'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  ActivityIdea,
  rejectActivityIdea,
  useActivityIdeas,
} from '@/lib/activity-ideas-hooks'

import CreateActivityIdeaModal from '@/components/CreateActivityIdeaModal'
import ReviewActivityIdeaModal from '@/components/ReviewActivityIdeaModal'

import {
  Check,
  Clock,
  Lightbulb,
  Loader,
  Plus,
  X,
} from 'lucide-react'

// =========================================================
// PROPS
// =========================================================

interface ActivityIdeasProps {
  userId: string
  userName: string
  role: string
  refreshKey?: number
}

// =========================================================
// COMPONENTE PRINCIPAL
// =========================================================

export default function ActivityIdeas({
  userId,
  userName,
  role,
  refreshKey = 0,
}: ActivityIdeasProps) {

  // =======================================================
  // PERMISOS
  // =======================================================

  const isAdmin =
    role === 'admin'

  const normalizedUserName =
    userName
      .trim()
      .toLowerCase()

  const canCreate =
    [
      'marcos',
      'ursula',
      'úrsula',
    ].includes(
      normalizedUserName,
    )

  // =======================================================
  // IDEAS
  // =======================================================

  const {
    ideas,
    loading,
    error,
    refresh,
  } = useActivityIdeas()

  // =======================================================
  // MODAL CREAR IDEA
  // =======================================================

  const [
    showCreateModal,
    setShowCreateModal,
  ] = useState(false)

  // =======================================================
  // MODAL REVISAR IDEA
  // =======================================================

  const [
    reviewIdea,
    setReviewIdea,
  ] = useState<ActivityIdea | null>(
    null,
  )

  // =======================================================
  // PROCESANDO
  // =======================================================

  const [
    processingId,
    setProcessingId,
  ] = useState<string | null>(
    null,
  )

  // =======================================================
  // RECHAZO
  // =======================================================

  const [
    rejectionIdea,
    setRejectionIdea,
  ] = useState<ActivityIdea | null>(
    null,
  )

  const [
    rejectionReason,
    setRejectionReason,
  ] = useState('')

  // =======================================================
  // REFRESH EXTERNO
  //
  // Esto permite que MarketingDashboard fuerce la
  // actualización de las ideas cuando cambia refreshKey.
  // =======================================================

  useEffect(() => {

    if (refreshKey > 0) {
      refresh()
    }

  }, [
    refreshKey,
    refresh,
  ])

  // =======================================================
  // FILTRAR IDEAS VISIBLES
  // =======================================================

  const visibleIdeas =
    useMemo(
      () => {

        // -------------------------------------------------
        // SOLO MOSTRAMOS IDEAS PENDIENTES
        //
        // approved -> ya se convirtió en actividad
        // rejected -> ya fue rechazada
        // -------------------------------------------------

        const pendingIdeas =
          ideas.filter(
            (idea) =>
              idea.status === 'pending',
          )

        // -------------------------------------------------
        // ADMIN / HUGO
        //
        // Ve todas las ideas pendientes.
        // -------------------------------------------------

        if (isAdmin) {
          return pendingIdeas
        }

        // -------------------------------------------------
        // USUARIOS NORMALES
        //
        // Marcos / Úrsula solamente ven sus propias
        // ideas pendientes.
        // -------------------------------------------------

        return pendingIdeas.filter(
          (idea) =>
            idea.created_by === userId,
        )
      },
      [
        ideas,
        isAdmin,
        userId,
      ],
    )

  // =======================================================
  // ABRIR REVISIÓN
  // =======================================================

  const handleApprove = (
    idea: ActivityIdea,
  ) => {

    setReviewIdea(
      idea,
    )
  }

  // =======================================================
  // CERRAR REVISIÓN
  // =======================================================

  const handleReviewClose = () => {

    setReviewIdea(
      null,
    )
  }

  // =======================================================
  // REVISIÓN COMPLETADA
  // =======================================================

  const handleReviewSuccess =
    async () => {

      setReviewIdea(
        null,
      )

      await refresh()
    }

  // =======================================================
  // ABRIR RECHAZO
  // =======================================================

  const openReject = (
    idea: ActivityIdea,
  ) => {

    setRejectionIdea(
      idea,
    )

    setRejectionReason('')
  }

  // =======================================================
  // RECHAZAR
  // =======================================================

  const handleReject =
    async () => {

      if (!rejectionIdea) {
        return
      }

      try {

        setProcessingId(
          rejectionIdea.id,
        )

        await rejectActivityIdea(
          rejectionIdea.id,
          rejectionReason,
        )

        setRejectionIdea(
          null,
        )

        setRejectionReason('')

        await refresh()

      } catch (err) {

        console.error(
          'Error rechazando idea:',
          err,
        )

        window.alert(
          err instanceof Error
            ? err.message
            : 'No se pudo rechazar la idea.',
        )

      } finally {

        setProcessingId(
          null,
        )
      }
    }

  // =======================================================
  // SIN PERMISOS
  // =======================================================

  if (
    !isAdmin &&
    !canCreate
  ) {
    return null
  }

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <section
      className="
        overflow-hidden
        rounded-2xl
        border
        border-amber-200
        bg-white
        shadow-sm
        dark:border-amber-900/50
        dark:bg-gray-900
      "
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <div
        className="
          flex flex-col
          gap-3
          border-b
          border-amber-100
          bg-amber-50/70
          px-5 py-4
          sm:flex-row
          sm:items-center
          sm:justify-between
          dark:border-amber-900/40
          dark:bg-amber-900/10
        "
      >

        <div
          className="
            flex items-center
            gap-3
          "
        >

          <div
            className="
              flex h-10 w-10
              items-center
              justify-center
              rounded-lg
              bg-amber-100
              text-amber-600
              dark:bg-amber-900/30
              dark:text-amber-400
            "
          >

            <Lightbulb
              size={21}
            />

          </div>

          <div>

            <h2
              className="
                font-bold
                text-gray-900
                dark:text-white
              "
            >

              {isAdmin
                ? 'Ideas pendientes de aprobación'
                : 'Mis ideas'}

            </h2>

            <p
              className="
                text-sm
                text-gray-500
                dark:text-gray-400
              "
            >

              {isAdmin
                ? 'Revisa las propuestas del equipo.'
                : 'Propón actividades para el equipo.'}

            </p>

          </div>

        </div>

        {/* =================================================
            NUEVA IDEA
        ================================================= */}

        {canCreate && (

          <button
            type="button"
            onClick={() =>
              setShowCreateModal(
                true,
              )
            }
            className="
              flex items-center
              justify-center
              gap-2
              rounded-lg
              bg-amber-500
              px-4 py-2
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-amber-600
            "
          >

            <Plus
              size={18}
            />

            Nueva idea

          </button>

        )}

      </div>

      {/* =================================================
          CONTENIDO
      ================================================= */}

      <div
        className="p-5"
      >

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (

          <div
            className="
              flex
              items-center
              justify-center
              py-8
              text-gray-500
            "
          >

            <Loader
              size={22}
              className="
                mr-2
                animate-spin
              "
            />

            Cargando ideas...

          </div>

        ) : error ? (

          /* =================================================
             ERROR
          ================================================= */

          <div
            className="
              rounded-lg
              bg-red-50
              p-4
              text-sm
              text-red-700
              dark:bg-red-900/20
              dark:text-red-400
            "
          >

            {error}

          </div>

        ) : visibleIdeas.length === 0 ? (

          /* =================================================
             VACÍO
          ================================================= */

          <div
            className="
              rounded-xl
              border
              border-dashed
              border-gray-300
              p-8
              text-center
              dark:border-gray-700
            "
          >

            <Lightbulb
              size={30}
              className="
                mx-auto
                mb-3
                text-gray-400
              "
            />

            <p
              className="
                font-medium
                text-gray-600
                dark:text-gray-300
              "
            >

              {isAdmin
                ? 'No hay ideas pendientes.'
                : 'No tienes ideas pendientes.'}

            </p>

            {!isAdmin &&
              canCreate && (

                <button
                  type="button"
                  onClick={() =>
                    setShowCreateModal(
                      true,
                    )
                  }
                  className="
                    mt-4
                    text-sm
                    font-semibold
                    text-amber-600
                    hover:text-amber-700
                  "
                >

                  Crear una nueva idea

                </button>

              )}

          </div>

        ) : (

          /* =================================================
             LISTA
          ================================================= */

          <div
            className="
              space-y-3
            "
          >

            {visibleIdeas.map(
              (
                idea,
              ) => (

                <IdeaCard
                  key={
                    idea.id
                  }
                  idea={
                    idea
                  }
                  isAdmin={
                    isAdmin
                  }
                  processing={
                    processingId ===
                    idea.id
                  }
                  onApprove={
                    handleApprove
                  }
                  onReject={
                    openReject
                  }
                />

              ),
            )}

          </div>

        )}

      </div>

      {/* =================================================
          MODAL CREAR IDEA
      ================================================= */}

      <CreateActivityIdeaModal
        isOpen={
          showCreateModal
        }
        onClose={() =>
          setShowCreateModal(
            false,
          )
        }
        onSuccess={
          async () => {

            setShowCreateModal(
              false,
            )

            await refresh()
          }
        }
      />

      {/* =================================================
          MODAL REVISAR IDEA
      ================================================= */}

      <ReviewActivityIdeaModal
        isOpen={
          !!reviewIdea
        }
        idea={
          reviewIdea
        }
        onClose={
          handleReviewClose
        }
        onSuccess={
          handleReviewSuccess
        }
      />

      {/* =================================================
          MODAL RECHAZO
      ================================================= */}

      {rejectionIdea && (

        <div
          className="
            fixed inset-0
            z-[60]
            flex items-center
            justify-center
            bg-black/50
            p-4
          "
        >

          <div
            className="
              w-full max-w-md
              rounded-2xl
              bg-white
              p-6
              shadow-2xl
              dark:bg-gray-900
            "
          >

            <h3
              className="
                text-lg
                font-bold
                text-gray-900
                dark:text-white
              "
            >

              Rechazar idea

            </h3>

            <p
              className="
                mt-1
                text-sm
                text-gray-500
                dark:text-gray-400
              "
            >

              {rejectionIdea.title}

            </p>

            <textarea
              value={
                rejectionReason
              }
              onChange={
                (event) =>
                  setRejectionReason(
                    event.target.value,
                  )
              }
              rows={4}
              placeholder="Motivo del rechazo (opcional)"
              className="
                mt-4
                w-full
                resize-none
                rounded-lg
                border
                border-gray-300
                px-3 py-2
                outline-none
                focus:border-red-500
                focus:ring-2
                focus:ring-red-500/20
                dark:border-gray-700
                dark:bg-gray-800
                dark:text-white
              "
            />

            <div
              className="
                mt-4
                flex
                justify-end
                gap-3
              "
            >

              <button
                type="button"
                onClick={() =>
                  setRejectionIdea(
                    null,
                  )
                }
                disabled={
                  processingId ===
                  rejectionIdea.id
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
                type="button"
                onClick={
                  handleReject
                }
                disabled={
                  processingId ===
                  rejectionIdea.id
                }
                className="
                  flex items-center
                  gap-2
                  rounded-lg
                  bg-red-600
                  px-4 py-2
                  font-semibold
                  text-white
                  hover:bg-red-700
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >

                {processingId ===
                  rejectionIdea.id && (

                  <Loader
                    size={17}
                    className="
                      animate-spin
                    "
                  />

                )}

                Rechazar

              </button>

            </div>

          </div>

        </div>

      )}

    </section>
  )
}

// =========================================================
// PROPS IDEA CARD
// =========================================================

interface IdeaCardProps {
  idea: ActivityIdea
  isAdmin: boolean
  processing: boolean

  onApprove: (
    idea: ActivityIdea,
  ) => void

  onReject: (
    idea: ActivityIdea,
  ) => void
}

// =========================================================
// IDEA CARD
// =========================================================

function IdeaCard({
  idea,
  isAdmin,
  processing,
  onApprove,
  onReject,
}: IdeaCardProps) {

  return (
    <div
      className="
        rounded-xl
        border
        border-gray-200
        p-4
        transition
        hover:border-amber-300
        hover:shadow-sm
        dark:border-gray-700
        dark:hover:border-amber-800
      "
    >

      <div
        className="
          flex flex-col
          gap-4
          md:flex-row
          md:items-start
          md:justify-between
        "
      >

        {/* =================================================
            INFORMACIÓN
        ================================================= */}

        <div
          className="
            min-w-0
            flex-1
          "
        >

          <div
            className="
              flex flex-wrap
              items-center
              gap-2
            "
          >

            <h3
              className="
                font-semibold
                text-gray-900
                dark:text-white
              "
            >

              {idea.title}

            </h3>

            <span
              className="
                inline-flex
                items-center
                gap-1
                rounded-full
                bg-amber-100
                px-2 py-1
                text-xs
                font-semibold
                text-amber-700
                dark:bg-amber-900/30
                dark:text-amber-400
              "
            >

              <Clock
                size={12}
              />

              Pendiente

            </span>

          </div>

          {/* DESCRIPCIÓN */}

          {idea.description && (

            <p
              className="
                mt-2
                whitespace-pre-wrap
                text-sm
                text-gray-600
                dark:text-gray-400
              "
            >

              {idea.description}

            </p>

          )}

          {/* INFORMACIÓN */}

          <div
            className="
              mt-3
              flex flex-wrap
              gap-x-4
              gap-y-2
              text-xs
              text-gray-500
              dark:text-gray-400
            "
          >

            {/* CREADOR */}

            {idea.creator && (

              <span>

                Propuesta por:{' '}

                <strong
                  className="
                    text-gray-700
                    dark:text-gray-300
                  "
                >

                  {
                    idea.creator.full_name
                  }

                </strong>

              </span>

            )}

            {/* RESPONSABLE */}

            {idea.assignee && (

              <span>

                Para:{' '}

                <strong
                  className="
                    text-gray-700
                    dark:text-gray-300
                  "
                >

                  {
                    idea.assignee.full_name
                  }

                </strong>

              </span>

            )}

            {/* FECHA */}

            {idea.due_date && (

              <span>

                Fecha:{' '}

                <strong
                  className="
                    text-gray-700
                    dark:text-gray-300
                  "
                >

                  {
                    formatDate(
                      idea.due_date,
                    )
                  }

                </strong>

              </span>

            )}

            {/* HORA */}

            {idea.due_time && (

              <span>

                Hora:{' '}

                <strong
                  className="
                    text-gray-700
                    dark:text-gray-300
                  "
                >

                  {
                    idea.due_time.slice(
                      0,
                      5,
                    )
                  }

                </strong>

              </span>

            )}

            {/* PRIORIDAD */}

            <span>

              Prioridad:{' '}

              <strong
                className="
                  text-gray-700
                  dark:text-gray-300
                "
              >

                {
                  getPriorityLabel(
                    idea.priority,
                  )
                }

              </strong>

            </span>

          </div>

        </div>

        {/* =================================================
            ACCIONES ADMIN
        ================================================= */}

        {isAdmin &&
          idea.status ===
            'pending' && (

            <div
              className="
                flex
                shrink-0
                gap-2
              "
            >

              {/* APROBAR */}

              <button
                type="button"
                onClick={() =>
                  onApprove(
                    idea,
                  )
                }
                disabled={
                  processing
                }
                title="Revisar y aprobar"
                className="
                  flex items-center
                  gap-1
                  rounded-lg
                  bg-green-600
                  px-3 py-2
                  text-sm
                  font-semibold
                  text-white
                  hover:bg-green-700
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >

                {processing ? (

                  <Loader
                    size={16}
                    className="
                      animate-spin
                    "
                  />

                ) : (

                  <Check
                    size={16}
                  />

                )}

                Aprobar

              </button>

              {/* RECHAZAR */}

              <button
                type="button"
                onClick={() =>
                  onReject(
                    idea,
                  )
                }
                disabled={
                  processing
                }
                title="Rechazar"
                className="
                  flex items-center
                  gap-1
                  rounded-lg
                  bg-red-600
                  px-3 py-2
                  text-sm
                  font-semibold
                  text-white
                  hover:bg-red-700
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >

                <X
                  size={16}
                />

                Rechazar

              </button>

            </div>

          )}

      </div>

    </div>
  )
}

// =========================================================
// FECHA
// =========================================================

function formatDate(
  date: string,
) {

  const [
    year,
    month,
    day,
  ] =
    date
      .slice(0, 10)
      .split('-')

  if (
    !year ||
    !month ||
    !day
  ) {
    return date
  }

  return `${day}/${month}/${year}`
}

// =========================================================
// PRIORIDAD
// =========================================================

function getPriorityLabel(
  priority: string,
) {

  switch (priority) {

    case 'low':
      return 'Baja'

    case 'medium':
      return 'Media'

    case 'high':
      return 'Alta'

    case 'urgent':
      return 'Urgente'

    default:
      return priority
  }
}