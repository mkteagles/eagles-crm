'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCurrentUser, useUsers } from '@/lib/marketing-hooks'
import {
  Lightbulb,
  Plus,
  X,
  Send,
  Loader,
  Video,
  Image,
  MessageCircle,
  MoreHorizontal,
  Clock,
} from 'lucide-react'

interface ContentSuggestion {
  id: string
  title: string
  description: string | null
  content_type: string
  status: string
  created_by: string
  created_at: string
}

interface ContentSuggestionsProps {
  refreshKey?: number
}

const CONTENT_TYPES = [
  {
    value: 'Reel',
    label: 'Reel',
    icon: Video,
  },
  {
    value: 'Video',
    label: 'Video',
    icon: Video,
  },
  {
    value: 'Post',
    label: 'Post',
    icon: Image,
  },
  {
    value: 'Historia',
    label: 'Historia',
    icon: MessageCircle,
  },
  {
    value: 'Facebook',
    label: 'Facebook',
    icon: MessageCircle,
  },
  {
    value: 'Otro',
    label: 'Otro',
    icon: MoreHorizontal,
  },
]

export default function ContentSuggestions({
  refreshKey = 0,
}: ContentSuggestionsProps) {
  const supabase = createClient()

  const { user } = useCurrentUser()
  const { users } = useUsers()

  const [suggestions, setSuggestions] = useState<
    ContentSuggestion[]
  >([])

  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [contentType, setContentType] = useState('Reel')

  // =========================================================
  // CARGAR SUGERENCIAS
  // =========================================================

  const loadSuggestions = async () => {
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('content_suggestions')
        .select(`
          id,
          title,
          description,
          content_type,
          status,
          created_by,
          created_at
        `)
        .order('created_at', {
          ascending: false,
        })

      if (error) {
        console.error(
          'Error loading content suggestions:',
          error
        )

        alert(
          `No se pudieron cargar las sugerencias: ${error.message}`
        )

        return
      }

      setSuggestions(data || [])
    } catch (error) {
      console.error(
        'Unexpected error loading suggestions:',
        error
      )

      alert(
        'Ocurrió un error al cargar las sugerencias.'
      )
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // CARGAR AL INICIAR
  // =========================================================

  useEffect(() => {
    loadSuggestions()
  }, [refreshKey])

  // =========================================================
  // ABRIR MODAL
  // =========================================================

  const openModal = () => {
    setTitle('')
    setDescription('')
    setContentType('Reel')
    setShowModal(true)
  }

  // =========================================================
  // CERRAR MODAL
  // =========================================================

  const closeModal = () => {
    if (saving) return

    setTitle('')
    setDescription('')
    setContentType('Reel')
    setShowModal(false)
  }

  // =========================================================
  // CREAR SUGERENCIA
  // =========================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault()

    if (!title.trim()) {
      alert('Escribe el título de la sugerencia.')
      return
    }

    if (!user?.id) {
      alert(
        'No se pudo identificar al usuario actual.'
      )
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from('content_suggestions')
        .insert({
          title: title.trim(),
          description:
            description.trim() || null,
          content_type: contentType,
          status: 'pending',
          created_by: user.id,
        })

      if (error) {
        console.error(
          'Error creating suggestion:',
          error
        )

        alert(
          `No se pudo guardar la sugerencia: ${error.message}`
        )

        return
      }

      setTitle('')
      setDescription('')
      setContentType('Reel')
      setShowModal(false)

      await loadSuggestions()
    } catch (error) {
      console.error(
        'Unexpected error creating suggestion:',
        error
      )

      alert(
        'Ocurrió un error al guardar la sugerencia.'
      )
    } finally {
      setSaving(false)
    }
  }

  // =========================================================
  // ESTADO
  // =========================================================

  const getStatusLabel = (
    status: string
  ) => {
    switch (status) {
      case 'pending':
        return 'Pendiente'

      case 'review':
        return 'En revisión'

      case 'approved':
        return 'Aprobada'

      case 'rejected':
        return 'Rechazada'

      case 'published':
        return 'Publicada'

      default:
        return status
    }
  }

  // =========================================================
  // CLASE DEL ESTADO
  // =========================================================

  const getStatusClass = (
    status: string
  ) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'

      case 'rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'

      case 'published':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'

      case 'review':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'

      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  // =========================================================
  // OBTENER NOMBRE DEL CREADOR
  // =========================================================

  const getCreatorName = (
    suggestion: ContentSuggestion
  ) => {
    const creator = users.find(
      (u) => u.id === suggestion.created_by
    )

    if (creator?.full_name) {
      return creator.full_name
    }

    if (suggestion.created_by === user?.id) {
      return user.full_name
    }

    return 'Usuario'
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <>
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="flex items-center justify-between mb-4">

        <div className="flex items-center gap-3">

          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
            <Lightbulb
              size={22}
              className="text-yellow-600 dark:text-yellow-400"
            />
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Sugerencias de contenido
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ideas para crear nuevo contenido
            </p>
          </div>

        </div>

        {/* BOTÓN NUEVA SUGERENCIA */}

        <button
          type="button"
          onClick={openModal}
          className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 font-semibold transition"
        >
          <Plus size={18} />
          Sugerir contenido
        </button>

      </div>

      {/* ===================================================
          CONTENIDO
      =================================================== */}

      {loading ? (

        <div className="flex items-center justify-center py-10 bg-surface rounded-lg shadow">

          <Loader
            className="animate-spin mr-2"
            size={22}
          />

          <p>
            Cargando sugerencias...
          </p>

        </div>

      ) : suggestions.length === 0 ? (

        <div className="bg-surface rounded-lg shadow p-8 text-center">

          <Lightbulb
            size={40}
            className="mx-auto text-yellow-500 mb-3"
          />

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Todavía no hay sugerencias
          </h3>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Sé el primero en proponer una idea de contenido.
          </p>

          <button
            type="button"
            onClick={openModal}
            className="mt-4 inline-flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 font-medium transition"
          >
            <Plus size={18} />
            Proponer idea
          </button>

        </div>

      ) : (

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {suggestions.map(
            (suggestion) => {

              const type =
                CONTENT_TYPES.find(
                  (item) =>
                    item.value ===
                    suggestion.content_type
                )

              const TypeIcon =
                type?.icon ||
                MoreHorizontal

              return (
                <div
                  key={suggestion.id}
                  className="bg-surface rounded-lg shadow p-5 hover:shadow-lg transition"
                >

                  {/* TIPO + ESTADO */}

                  <div className="flex items-center justify-between gap-2 mb-3">

                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">

                      <TypeIcon size={13} />

                      {suggestion.content_type}

                    </span>

                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusClass(
                        suggestion.status
                      )}`}
                    >
                      {getStatusLabel(
                        suggestion.status
                      )}
                    </span>

                  </div>

                  {/* TÍTULO */}

                  <h3 className="font-bold text-gray-900 dark:text-white text-base">
                    {suggestion.title}
                  </h3>

                  {/* DESCRIPCIÓN */}

                  {suggestion.description && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                      {suggestion.description}
                    </p>
                  )}

                  {/* AUTOR */}

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">

                    <div>

                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Propuesta por
                      </p>

                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {getCreatorName(
                          suggestion
                        )}
                      </p>

                    </div>

                    <div className="flex items-center gap-1 text-xs text-gray-400">

                      <Clock size={13} />

                      {new Date(
                        suggestion.created_at
                      ).toLocaleDateString(
                        'es-MX'
                      )}

                    </div>

                  </div>

                </div>
              )
            }
          )}

        </div>

      )}

      {/* =====================================================
          MODAL NUEVA SUGERENCIA
      ===================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-gray-900 shadow-xl">

            {/* HEADER */}

            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">

              <div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Sugerir contenido
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Comparte una idea para crear contenido.
                </p>

              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
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

              {/* TÍTULO */}

              <div>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ¿Qué contenido propones? *
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  disabled={saving}
                  required
                  placeholder="Ej: Video sobre los 5 errores que dañan una transmisión"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:opacity-50"
                />

              </div>

              {/* DESCRIPCIÓN */}

              <div>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cuéntanos un poco más
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  disabled={saving}
                  rows={4}
                  placeholder="Explica cómo te imaginas el contenido, qué podríamos enseñar, qué mensaje tendría, etc."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none disabled:opacity-50"
                />

              </div>

              {/* TIPO */}

              <div>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de contenido
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">

                  {CONTENT_TYPES.map(
                    (type) => {

                      const Icon =
                        type.icon

                      const selected =
                        contentType ===
                        type.value

                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() =>
                            setContentType(
                              type.value
                            )
                          }
                          disabled={saving}
                          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition text-sm font-medium ${
                            selected
                              ? 'border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-yellow-300'
                          }`}
                        >

                          <Icon size={16} />

                          {type.label}

                        </button>
                      )
                    }
                  )}

                </div>

              </div>

              {/* BOTONES */}

              <div className="flex gap-3 pt-2">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    !title.trim()
                  }
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >

                  {saving ? (
                    <>
                      <Loader
                        size={18}
                        className="animate-spin"
                      />

                      Guardando...
                    </>
                  ) : (
                    <>
                      <Send size={18} />

                      Enviar sugerencia
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </>
  )
}