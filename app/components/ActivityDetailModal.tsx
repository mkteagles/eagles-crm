'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ActivityStatus } from '@/lib/marketing-types'
import { statusConfig } from '@/lib/marketing-ui'

interface ActivityDetailModalProps {
  activity: any
  currentUserRole?: string
  currentUserId?: string
  onClose: () => void
}

interface ActivityComment {
  id: string
  activity_id: string
  user_id: string
  message: string
  created_at: string
  user_name?: string
}

export default function ActivityDetailModal({
  activity,
  currentUserRole,
  currentUserId,
  onClose,
}: ActivityDetailModalProps) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectBox, setShowRejectBox] = useState(false)

  // =========================================================
  // COMENTARIOS
  // =========================================================

  const [comments, setComments] = useState<ActivityComment[]>([])
  const [message, setMessage] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [sendingComment, setSendingComment] = useState(false)

  const supabase = createClient()

  // =========================================================
  // CARGAR COMENTARIOS
  // =========================================================

  const loadComments = async () => {
    if (!activity?.id) return

    setLoadingComments(true)

    try {
      const { data, error } = await supabase
        .from('activity_comments')
        .select('*')
        .eq('activity_id', activity.id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading comments:', error)
        return
      }

      setComments((data || []) as ActivityComment[])
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  useEffect(() => {
    loadComments()
  }, [activity?.id])

  // =========================================================
  // APROBAR ACTIVIDAD
  // =========================================================

  const handleApprove = async () => {
    if (!currentUserId) {
      alert('Debes estar autenticado')
      return
    }

    try {
      const { error } = await supabase
        .from('activities')
        .update({
          approved_by: currentUserId,
          approved_at: new Date().toISOString(),
          rejection_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', activity.id)

      if (error) {
        console.error('Error approving activity:', error)
        alert('Error al aprobar la actividad')
        return
      }

      onClose()
    } catch (error) {
      console.error('Error approving activity:', error)
      alert('Error al aprobar la actividad')
    }
  }

  // =========================================================
  // RECHAZAR ACTIVIDAD
  // =========================================================

  const handleReject = async () => {
    if (!currentUserId) {
      alert('Debes estar autenticado')
      return
    }

    if (!rejectionReason.trim()) {
      alert('Escribe un motivo de rechazo')
      return
    }

    try {
      const { error } = await supabase
        .from('activities')
        .update({
          status: 'rejected' as ActivityStatus,
          approved_by: currentUserId,
          approved_at: new Date().toISOString(),
          rejection_reason: rejectionReason.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', activity.id)

      if (error) {
        console.error('Error rejecting activity:', error)
        alert('Error al rechazar la actividad')
        return
      }

      onClose()
    } catch (error) {
      console.error('Error rejecting activity:', error)
      alert('Error al rechazar la actividad')
    }
  }

  // =========================================================
  // AGREGAR COMENTARIO
  // =========================================================

  const handleAddComment = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    if (!message.trim()) {
      alert('Escribe algo primero')
      return
    }

    if (!currentUserId) {
      alert('Debes estar autenticado')
      return
    }

    if (!activity?.id) {
      alert('No se encontró la actividad')
      return
    }

    setSendingComment(true)

    try {
      const { data, error } = await supabase
        .from('activity_comments')
        .insert({
          activity_id: activity.id,
          user_id: currentUserId,
          message: message.trim(),
        })
        .select('*')
        .single()

      if (error) {
        console.error('Error adding comment:', error)
        alert(`Error al guardar comentario: ${error.message}`)
        return
      }

      if (data) {
        setComments((prev) => [
          ...prev,
          data as ActivityComment,
        ])
      }

      setMessage('')
    } catch (error) {
      console.error('Error adding comment:', error)
      alert('Error al guardar comentario')
    } finally {
      setSendingComment(false)
    }
  }

  // =========================================================
  // PERMISOS DE MODERACIÓN
  // =========================================================

  const canModerate =
    currentUserRole === 'admin' &&
    activity.status === 'completed' &&
    !activity.approved_by

  // =========================================================
  // FORMATEAR FECHA
  // =========================================================

  const formatCommentDate = (date: string) => {
    try {
      return new Date(date).toLocaleString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return date
    }
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      {/* =====================================================
          MODAL
      ===================================================== */}

      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-background border border-border-color shadow-xl">

        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="flex items-start justify-between p-6 border-b border-border-color">

          <div className="pr-4">

            <h2 className="text-xl font-bold text-foreground">
              {activity.title}
            </h2>

            {activity.description && (
              <p className="mt-2 text-sm text-foreground/60">
                {activity.description}
              </p>
            )}

          </div>

          <button
            onClick={onClose}
            className="text-foreground/60 hover:text-foreground text-xl"
            aria-label="Cerrar"
          >
            ✕
          </button>

        </div>

        {/* ===================================================
            CONTENIDO
        =================================================== */}

        <div className="p-6">

          {/* =================================================
              INFORMACIÓN DE LA ACTIVIDAD
          ================================================= */}

          <div className="grid grid-cols-2 gap-4 mb-6">

            {/* ASIGNADO */}

            <div>
              <p className="text-foreground/60 text-sm">
                Asignado a
              </p>

              <p className="font-semibold">
                {activity.assigned_to_name ||
                  activity.assigned_to}
              </p>
            </div>

            {/* VENCIMIENTO */}

            <div>
              <p className="text-foreground/60 text-sm">
                Vencimiento
              </p>

              <p className="font-semibold">
                {activity.due_date}
              </p>
            </div>

            {/* PRIORIDAD */}

            <div>
              <p className="text-foreground/60 text-sm">
                Prioridad
              </p>

              <p className="font-semibold">
                {activity.priority}
              </p>
            </div>

            {/* ESTADO */}

            <div>
              <p className="text-foreground/60 text-sm">
                Estado
              </p>

              {statusConfig[
                activity.status as ActivityStatus
              ] ? (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    statusConfig[
                      activity.status as ActivityStatus
                    ].badge
                  }`}
                >

                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      statusConfig[
                        activity.status as ActivityStatus
                      ].dot
                    }`}
                  />

                  {
                    statusConfig[
                      activity.status as ActivityStatus
                    ].label
                  }

                </span>
              ) : (
                <span className="text-sm">
                  {activity.status}
                </span>
              )}

            </div>

          </div>

          {/* =================================================
              NOTAS
          ================================================= */}

          {activity.result_notes && (
            <div className="p-4 bg-yellow-500/10 rounded border-l-4 border-yellow-400 mb-4">

              <p className="text-sm">
                <strong>Notas:</strong>{' '}
                {activity.result_notes}
              </p>

            </div>
          )}

          {/* =================================================
              MOTIVO DE RECHAZO
          ================================================= */}

          {activity.status === 'rejected' &&
            activity.rejection_reason && (
              <div className="p-4 bg-red-500/10 rounded border-l-4 border-red-400 mb-4">

                <p className="text-sm">
                  <strong>
                    Motivo de rechazo:
                  </strong>{' '}
                  {activity.rejection_reason}
                </p>

              </div>
            )}

          {/* =================================================
              ACTIVIDAD APROBADA
          ================================================= */}

          {activity.approved_by &&
            activity.status !== 'rejected' && (
              <div className="p-4 bg-green-500/10 rounded border-l-4 border-green-400 mb-4">

                <p className="text-sm font-semibold">
                  Aprobada
                  {activity.approved_by_name
                    ? ` por ${activity.approved_by_name}`
                    : ''}
                </p>

              </div>
            )}

          {/* =================================================
              COMENTARIOS / ACTUALIZACIONES
          ================================================= */}

          <div className="mt-6 pt-6 border-t border-border-color">

            {/* TÍTULO */}

            <div className="flex items-center justify-between mb-4">

              <div>

                <h3 className="text-lg font-bold">
                  Actualizaciones
                </h3>

                <p className="text-sm text-foreground/60 mt-1">
                  Historial de comentarios de esta actividad
                </p>

              </div>

              <span className="text-xs bg-foreground/10 px-2 py-1 rounded-full">
                {comments.length}
              </span>

            </div>

            {/* =================================================
                LISTA DE COMENTARIOS
            ================================================= */}

            <div className="space-y-3 mb-5">

              {loadingComments ? (

                <div className="py-6 text-center text-sm text-foreground/60">
                  Cargando actualizaciones...
                </div>

              ) : comments.length === 0 ? (

                <div className="py-6 text-center border border-dashed border-border-color rounded-lg">

                  <p className="text-sm text-foreground/60">
                    No hay actualizaciones todavía.
                  </p>

                  <p className="text-xs text-foreground/40 mt-1">
                    Agrega la primera actualización de esta actividad.
                  </p>

                </div>

              ) : (

                comments.map((comment) => (

                  <div
                    key={comment.id}
                    className="p-3 rounded-lg bg-foreground/5 border border-border-color"
                  >

                    <div className="flex items-center justify-between gap-3 mb-2">

                      <div className="flex items-center gap-2">

                        <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">

                          {(
                            comment.user_name ||
                            comment.user_id ||
                            'U'
                          )
                            .charAt(0)
                            .toUpperCase()}

                        </div>

                        <span className="text-sm font-semibold">

                          {comment.user_name ||
                            (comment.user_id
                              ? `Usuario ${comment.user_id.slice(
                                  0,
                                  8
                                )}`
                              : 'Usuario')}

                        </span>

                      </div>

                      <span className="text-xs text-foreground/50">

                        {formatCommentDate(
                          comment.created_at
                        )}

                      </span>

                    </div>

                    <p className="text-sm text-foreground/80 whitespace-pre-wrap break-words">
                      {comment.message}
                    </p>

                  </div>

                ))

              )}

            </div>

            {/* =================================================
                FORMULARIO PARA NUEVO COMENTARIO
            ================================================= */}

            <form
              onSubmit={handleAddComment}
              className="flex gap-2"
            >

              <input
                type="text"
                name="comment"
                value={message}
                onChange={(e) =>
                  setMessage(e.target.value)
                }
                maxLength={500}
                placeholder="Añade una actualización..."
                disabled={sendingComment}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <button
                type="submit"
                disabled={
                  sendingComment ||
                  !message.trim()
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingComment
                  ? 'Enviando...'
                  : 'Enviar'}
              </button>

            </form>

          </div>

          {/* =================================================
              CAJA DE RECHAZO
          ================================================= */}

          {showRejectBox && (
            <div className="mb-4 mt-6">

              <textarea
                value={rejectionReason}
                onChange={(e) =>
                  setRejectionReason(
                    e.target.value
                  )
                }
                placeholder="Motivo del rechazo..."
                rows={3}
                className="w-full border border-border-color rounded p-2 text-sm bg-background text-foreground"
              />

            </div>
          )}

          {/* =================================================
              BOTONES
          ================================================= */}

          <div className="flex gap-3 justify-end flex-wrap mt-6">

            {canModerate && (
              <>

                {showRejectBox ? (

                  <button
                    onClick={handleReject}
                    disabled={
                      !rejectionReason.trim()
                    }
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold disabled:opacity-50"
                  >
                    Confirmar rechazo
                  </button>

                ) : (

                  <button
                    onClick={() =>
                      setShowRejectBox(true)
                    }
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
                  >
                    Rechazar
                  </button>

                )}

                <button
                  onClick={handleApprove}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
                >
                  Aprobar
                </button>

              </>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-foreground/10 rounded hover:bg-foreground/20 font-semibold"
            >
              Cerrar
            </button>

          </div>

        </div>

      </div>

    </div>
  )
}