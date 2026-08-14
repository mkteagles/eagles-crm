'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Plus,
  X,
  Save,
  Loader,
  Users,
  Clock,
  MapPin,
  Trash2,
} from 'lucide-react'

interface CalendarEvent {
  id: string
  title: string
  description: string | null
  event_date: string
  start_time: string | null
  end_time: string | null
  event_type: string
  area: string
  location: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

interface UserProfile {
  id: string
  full_name: string | null
  role: string | null
}

const AREAS = [
  {
    id: 'marketing',
    label: 'Marketing',
    color:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  },
  {
    id: 'video',
    label: 'Video',
    color:
      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  },
  {
    id: 'admin',
    label: 'Administración',
    color:
      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  },
]

const EVENT_TYPES = [
  {
    id: 'meeting',
    label: 'Reunión',
  },
  {
    id: 'planning',
    label: 'Planeación',
  },
  {
    id: 'review',
    label: 'Revisión',
  },
  {
    id: 'other',
    label: 'Otro',
  },
]

function getAreaColor(area: string) {
  return (
    AREAS.find((item) => item.id === area)?.color ||
    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  )
}

function formatTime(time: string | null) {
  if (!time) {
    return ''
  }

  return time.substring(0, 5)
}

function getDaysInMonth(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  ).getDate()
}

function getFirstDayOfMonth(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  ).getDay()
}

export default function CalendarMeetings() {
  const supabase = createClient()

  const [currentDate, setCurrentDate] =
    useState(new Date())

  const [events, setEvents] =
    useState<CalendarEvent[]>([])

  const [users, setUsers] =
    useState<UserProfile[]>([])

  const [loading, setLoading] =
    useState(true)

  const [showModal, setShowModal] =
    useState(false)

  const [saving, setSaving] =
    useState(false)

  const [selectedEvent, setSelectedEvent] =
    useState<CalendarEvent | null>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    event_date: '',
    start_time: '',
    end_time: '',
    event_type: 'meeting',
    area: 'marketing',
    location: '',
    participants: [] as string[],
  })

  // =========================================================
  // CARGAR EVENTOS
  // =========================================================

  const loadEvents = async () => {
    setLoading(true)

    try {
      const {
        data,
        error,
      } = await supabase
        .from('calendar_events')
        .select('*')
        .order('event_date', {
          ascending: true,
        })
        .order('start_time', {
          ascending: true,
        })

      if (error) {
        console.error(
          'Error cargando eventos:',
          error
        )

        return
      }

      setEvents(
        (data || []) as CalendarEvent[]
      )
    } catch (error) {
      console.error(
        'Error cargando eventos:',
        error
      )
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // CARGAR USUARIOS
  // =========================================================

  const loadUsers = async () => {
    const {
      data,
      error,
    } = await supabase
      .from('user_profiles')
      .select(
        'id, full_name, role'
      )
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

    setUsers(
      (data || []) as UserProfile[]
    )
  }

  // =========================================================
  // CARGA INICIAL
  // =========================================================

  useEffect(() => {
    loadEvents()
    loadUsers()
  }, [])

  // =========================================================
  // AGRUPAR EVENTOS POR FECHA
  // =========================================================

  const groupedEvents = useMemo(() => {
    const grouped: Record<
      string,
      CalendarEvent[]
    > = {}

    events.forEach((event) => {
      if (!grouped[event.event_date]) {
        grouped[event.event_date] = []
      }

      grouped[event.event_date].push(event)
    })

    return grouped
  }, [events])

  // =========================================================
  // DÍAS DEL MES
  // =========================================================

  const days = useMemo(() => {
    const result: Array<number | null> = []

    const firstDay =
      getFirstDayOfMonth(
        currentDate
      )

    const daysInMonth =
      getDaysInMonth(
        currentDate
      )

    for (
      let i = 0;
      i < firstDay;
      i++
    ) {
      result.push(null)
    }

    for (
      let i = 1;
      i <= daysInMonth;
      i++
    ) {
      result.push(i)
    }

    return result
  }, [currentDate])

  // =========================================================
  // ABRIR MODAL PARA CREAR
  // =========================================================

  const openCreateModal = (
    date?: string
  ) => {
    setSelectedEvent(null)

    setForm({
      title: '',
      description: '',
      event_date:
        date ||
        new Date()
          .toISOString()
          .split('T')[0],
      start_time: '',
      end_time: '',
      event_type: 'meeting',
      area: 'marketing',
      location: '',
      participants: [],
    })

    setShowModal(true)
  }

  // =========================================================
  // ABRIR MODAL PARA EDITAR
  // =========================================================

  const openEditModal = async (
    event: CalendarEvent
  ) => {
    setSelectedEvent(event)

    const {
      data,
      error,
    } = await supabase
      .from(
        'calendar_event_participants'
      )
      .select('user_id')
      .eq(
        'event_id',
        event.id
      )

    if (error) {
      console.error(
        'Error cargando participantes:',
        error
      )
    }

    setForm({
      title:
        event.title,

      description:
        event.description || '',

      event_date:
        event.event_date,

      start_time:
        formatTime(
          event.start_time
        ),

      end_time:
        formatTime(
          event.end_time
        ),

      event_type:
        event.event_type,

      area:
        event.area,

      location:
        event.location || '',

      participants:
        data?.map(
          (item) =>
            item.user_id
        ) || [],
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
    setSelectedEvent(null)
  }

  // =========================================================
  // CAMBIAR PARTICIPANTE
  // =========================================================

  const toggleParticipant = (
    userId: string
  ) => {
    setForm((prev) => ({
      ...prev,

      participants:
        prev.participants.includes(
          userId
        )
          ? prev.participants.filter(
              (id) =>
                id !== userId
            )
          : [
              ...prev.participants,
              userId,
            ],
    }))
  }

  // =========================================================
  // GUARDAR EVENTO
  // =========================================================

  const handleSave = async () => {
    if (!form.title.trim()) {
      alert(
        'Escribe un título para la reunión.'
      )

      return
    }

    if (!form.event_date) {
      alert(
        'Selecciona una fecha.'
      )

      return
    }

    setSaving(true)

    try {
      let eventId =
        selectedEvent?.id

      // =====================================================
      // EDITAR
      // =====================================================

      if (selectedEvent) {
        const {
          error,
        } = await supabase
          .from(
            'calendar_events'
          )
          .update({
            title:
              form.title.trim(),

            description:
              form.description.trim() ||
              null,

            event_date:
              form.event_date,

            start_time:
              form.start_time ||
              null,

            end_time:
              form.end_time ||
              null,

            event_type:
              form.event_type,

            area:
              form.area,

            location:
              form.location.trim() ||
              null,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            'id',
            selectedEvent.id
          )

        if (error) {
          throw error
        }

        // Borrar participantes anteriores
        const {
          error:
            deleteParticipantsError,
        } = await supabase
          .from(
            'calendar_event_participants'
          )
          .delete()
          .eq(
            'event_id',
            selectedEvent.id
          )

        if (
          deleteParticipantsError
        ) {
          throw deleteParticipantsError
        }
      }

      // =====================================================
      // CREAR
      // =====================================================

      else {
        const {
          data: {
            user,
          },
        } = await supabase.auth.getUser()

        if (!user) {
          throw new Error(
            'No se encontró el usuario actual.'
          )
        }

        const {
          data,
          error,
        } = await supabase
          .from(
            'calendar_events'
          )
          .insert({
            title:
              form.title.trim(),

            description:
              form.description.trim() ||
              null,

            event_date:
              form.event_date,

            start_time:
              form.start_time ||
              null,

            end_time:
              form.end_time ||
              null,

            event_type:
              form.event_type,

            area:
              form.area,

            location:
              form.location.trim() ||
              null,

            created_by:
              user.id,
          })
          .select()
          .single()

        if (error) {
          throw error
        }

        eventId =
          data.id
      }

      // =====================================================
      // PARTICIPANTES
      // =====================================================

      if (
        eventId &&
        form.participants.length > 0
      ) {
        const participantRows =
          form.participants.map(
            (userId) => ({
              event_id:
                eventId,

              user_id:
                userId,
            })
          )

        const {
          error,
        } = await supabase
          .from(
            'calendar_event_participants'
          )
          .insert(
            participantRows
          )

        if (error) {
          throw error
        }
      }

      // Recargar eventos
      await loadEvents()

      // Cerrar modal
      setShowModal(false)
      setSelectedEvent(null)
    } catch (error: any) {
      console.error(
        'Error guardando evento:',
        error
      )

      alert(
        `No se pudo guardar el evento: ${
          error?.message ||
          'Error desconocido'
        }`
      )
    } finally {
      setSaving(false)
    }
  }

  // =========================================================
  // ELIMINAR EVENTO
  // =========================================================

  const handleDelete = async (
    event: CalendarEvent
  ) => {
    const confirmed =
      window.confirm(
        `¿Eliminar la reunión "${event.title}"?`
      )

    if (!confirmed) {
      return
    }

    setSaving(true)

    try {
      const {
        error,
      } = await supabase
        .from(
          'calendar_events'
        )
        .delete()
        .eq(
          'id',
          event.id
        )

      if (error) {
        throw error
      }

      setEvents((prev) =>
        prev.filter(
          (item) =>
            item.id !== event.id
        )
      )

      setSelectedEvent(null)
      setShowModal(false)
    } catch (error: any) {
      console.error(
        'Error eliminando evento:',
        error
      )

      alert(
        `No se pudo eliminar: ${
          error?.message ||
          'Error desconocido'
        }`
      )
    } finally {
      setSaving(false)
    }
  }

  // =========================================================
  // CAMBIAR MES
  // =========================================================

  const previousMonth = () => {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      )
    )
  }

  const nextMonth = () => {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
      )
    )
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div className="flex items-center gap-4">

            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">

              <CalendarDays
                size={24}
                className="text-indigo-600"
              />

            </div>

            <div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Reuniones
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Calendario compartido de Marketing, Video y Administración.
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              openCreateModal()
            }
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
          >

            <Plus size={18} />

            Nueva reunión

          </button>

        </div>

        {/* ===================================================
            ÁREAS
        =================================================== */}

        <div className="flex flex-wrap gap-2 mt-5">

          {AREAS.map((area) => (
            <span
              key={area.id}
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${area.color}`}
            >
              {area.label}
            </span>
          ))}

        </div>

      </div>

      {/* =====================================================
          CALENDARIO
      ===================================================== */}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">

        {/* NAVEGACIÓN */}

        <div className="flex items-center justify-between mb-6">

          <button
            type="button"
            onClick={
              previousMonth
            }
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >

            <ChevronLeft size={20} />

          </button>

          <h3 className="text-lg font-bold text-gray-900 dark:text-white capitalize">

            {currentDate.toLocaleDateString(
              'es-MX',
              {
                month: 'long',
                year: 'numeric',
              }
            )}

          </h3>

          <button
            type="button"
            onClick={
              nextMonth
            }
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >

            <ChevronRight size={20} />

          </button>

        </div>

        {/* DÍAS DE LA SEMANA */}

        <div className="grid grid-cols-7 gap-2 mb-2">

          {[
            'Dom',
            'Lun',
            'Mar',
            'Mié',
            'Jue',
            'Vie',
            'Sáb',
          ].map(
            (day) => (
              <div
                key={day}
                className="text-center text-sm font-semibold text-gray-500 dark:text-gray-400 py-2"
              >
                {day}
              </div>
            )
          )}

        </div>

        {/* CALENDARIO */}

        {loading ? (

          <div className="flex items-center justify-center py-20 text-gray-500">

            <Loader
              size={22}
              className="animate-spin mr-2"
            />

            Cargando reuniones...

          </div>

        ) : (

          <div className="grid grid-cols-7 gap-2">

            {days.map(
              (day, index) => {

                if (
                  day === null
                ) {
                  return (
                    <div
                      key={index}
                      className="min-h-[130px]"
                    />
                  )
                }

                const year =
                  currentDate.getFullYear()

                const month =
                  String(
                    currentDate.getMonth() +
                      1
                  ).padStart(
                    2,
                    '0'
                  )

                const dayNumber =
                  String(day).padStart(
                    2,
                    '0'
                  )

                const dateStr =
                  `${year}-${month}-${dayNumber}`

                const dayEvents =
                  groupedEvents[
                    dateStr
                  ] || []

                return (
                  <div
                    key={
                      dateStr
                    }
                    className="min-h-[130px] border border-gray-200 dark:border-gray-700 rounded-xl p-2 bg-gray-50 dark:bg-gray-800"
                  >

                    {/* DÍA */}

                    <div className="flex items-center justify-between mb-2">

                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {day}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          openCreateModal(
                            dateStr
                          )
                        }
                        className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
                        title="Agregar reunión"
                      >

                        <Plus
                          size={14}
                        />

                      </button>

                    </div>

                    {/* EVENTOS */}

                    <div className="space-y-1.5">

                      {dayEvents.map(
                        (
                          event
                        ) => (

                          <button
                            key={
                              event.id
                            }
                            type="button"
                            onClick={() =>
                              openEditModal(
                                event
                              )
                            }
                            className={`w-full text-left rounded-md px-2 py-1.5 text-xs font-medium transition hover:opacity-80 ${getAreaColor(
                              event.area
                            )}`}
                          >

                            <div className="font-semibold truncate">

                              {
                                event.title
                              }

                            </div>

                            {event.start_time && (

                              <div className="flex items-center gap-1 mt-0.5 opacity-80">

                                <Clock
                                  size={
                                    10
                                  }
                                />

                                {
                                  formatTime(
                                    event.start_time
                                  )
                                }

                                {event.end_time && (
                                  <>
                                    {' - '}
                                    {formatTime(
                                      event.end_time
                                    )}
                                  </>
                                )}

                              </div>

                            )}

                          </button>

                        )
                      )}

                    </div>

                  </div>
                )
              }
            )}

          </div>

        )}

      </div>

      {/* =====================================================
          MODAL
      ===================================================== */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-700">

            {/* HEADER */}

            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">

              <div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white">

                  {selectedEvent
                    ? 'Editar reunión'
                    : 'Nueva reunión'}

                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Agenda una reunión para las áreas del equipo.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >

                <X
                  size={20}
                />

              </button>

            </div>

            {/* FORMULARIO */}

            <div className="p-5 space-y-5">

              {/* TÍTULO */}

              <div>

                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Título
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
                          e.target
                            .value,
                      })
                    )
                  }
                  placeholder="Ej. Reunión semanal de marketing"
                  disabled={saving}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />

              </div>

              {/* DESCRIPCIÓN */}

              <div>

                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                          e.target
                            .value,
                      })
                    )
                  }
                  rows={3}
                  placeholder="Detalles de la reunión..."
                  disabled={saving}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                />

              </div>

              {/* FECHA / HORARIOS */}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* FECHA */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Fecha
                  </label>

                  <input
                    type="date"
                    value={
                      form.event_date
                    }
                    onChange={(e) =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          event_date:
                            e.target
                              .value,
                        })
                      )
                    }
                    disabled={saving}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />

                </div>

                {/* INICIO */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Inicio
                  </label>

                  <input
                    type="time"
                    value={
                      form.start_time
                    }
                    onChange={(e) =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          start_time:
                            e.target
                              .value,
                        })
                      )
                    }
                    disabled={saving}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />

                </div>

                {/* FIN */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Fin
                  </label>

                  <input
                    type="time"
                    value={
                      form.end_time
                    }
                    onChange={(e) =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          end_time:
                            e.target
                              .value,
                        })
                      )
                    }
                    disabled={saving}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />

                </div>

              </div>

              {/* ÁREA / TIPO */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* ÁREA */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Área
                  </label>

                  <select
                    value={
                      form.area
                    }
                    onChange={(e) =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          area:
                            e.target
                              .value,
                        })
                      )
                    }
                    disabled={saving}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >

                    {AREAS.map(
                      (area) => (
                        <option
                          key={
                            area.id
                          }
                          value={
                            area.id
                          }
                        >
                          {
                            area.label
                          }
                        </option>
                      )
                    )}

                  </select>

                </div>

                {/* TIPO */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Tipo
                  </label>

                  <select
                    value={
                      form.event_type
                    }
                    onChange={(e) =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          event_type:
                            e.target
                              .value,
                        })
                      )
                    }
                    disabled={saving}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >

                    {EVENT_TYPES.map(
                      (type) => (
                        <option
                          key={
                            type.id
                          }
                          value={
                            type.id
                          }
                        >
                          {
                            type.label
                          }
                        </option>
                      )
                    )}

                  </select>

                </div>

              </div>

              {/* UBICACIÓN */}

              <div>

                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Ubicación
                </label>

                <div className="relative">

                  <MapPin
                    size={17}
                    className="absolute left-3 top-3 text-gray-400"
                  />

                  <input
                    type="text"
                    value={
                      form.location
                    }
                    onChange={(e) =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          location:
                            e.target
                              .value,
                        })
                      )
                    }
                    placeholder="Ej. Oficina / Google Meet / Zoom"
                    disabled={saving}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />

                </div>

              </div>

              {/* PARTICIPANTES */}

              <div>

                <div className="flex items-center gap-2 mb-2">

                  <Users
                    size={17}
                    className="text-indigo-500"
                  />

                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Participantes
                  </label>

                </div>

                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">

                  {users.length ===
                  0 ? (

                    <p className="text-sm text-gray-500">
                      No hay usuarios disponibles.
                    </p>

                  ) : (

                    users.map(
                      (
                        user
                      ) => {

                        const checked =
                          form.participants.includes(
                            user.id
                          )

                        return (
                          <label
                            key={
                              user.id
                            }
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                          >

                            <input
                              type="checkbox"
                              checked={
                                checked
                              }
                              onChange={() =>
                                toggleParticipant(
                                  user.id
                                )
                              }
                              disabled={
                                saving
                              }
                              className="w-4 h-4 rounded"
                            />

                            <div>

                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.full_name ||
                                  'Sin nombre'}
                              </div>

                              {user.role && (
                                <div className="text-xs text-gray-500">
                                  {
                                    user.role
                                  }
                                </div>
                              )}

                            </div>

                          </label>
                        )
                      }
                    )

                  )}

                </div>

              </div>

            </div>

            {/* FOOTER */}

            <div className="flex items-center justify-between gap-3 p-5 border-t border-gray-200 dark:border-gray-700">

              {/* ELIMINAR */}

              <div>

                {selectedEvent && (

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(
                        selectedEvent
                      )
                    }
                    disabled={
                      saving
                    }
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold text-sm disabled:opacity-50"
                  >

                    <Trash2
                      size={16}
                    />

                    Eliminar

                  </button>

                )}

              </div>

              {/* ACCIONES */}

              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                  className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold disabled:opacity-50"
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
                    !form.event_date
                  }
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-semibold disabled:opacity-50"
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

                      Guardar reunión

                    </>
                  )}

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}