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
} from 'lucide-react'

type MeetingArea =
  | 'marketing'
  | 'video'
  | 'admin'

interface Meeting {
  id: string
  title: string
  description: string | null
  area: MeetingArea
  meeting_date: string
  start_time: string
  end_time: string | null
  created_by: string
  created_at: string
}

interface UserProfile {
  id: string
  full_name: string
  role: string
}

export default function MeetingsCalendar() {
  const supabase = createClient()

  const [currentDate, setCurrentDate] = useState(
    new Date()
  )

  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [showModal, setShowModal] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [area, setArea] =
    useState<MeetingArea>('marketing')

  const [meetingDate, setMeetingDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  const [selectedUsers, setSelectedUsers] =
    useState<string[]>([])

  // =========================================================
  // CARGAR REUNIONES
  // =========================================================

  const loadMeetings = async () => {
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .order('meeting_date', {
          ascending: true,
        })
        .order('start_time', {
          ascending: true,
        })

      if (error) {
        console.error(
          'Error cargando reuniones:',
          error
        )
        return
      }

      setMeetings(
        (data || []) as Meeting[]
      )
    } catch (error) {
      console.error(
        'Error cargando reuniones:',
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
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, full_name, role')
      .order('full_name')

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

  useEffect(() => {
    loadMeetings()
    loadUsers()
  }, [])

  // =========================================================
  // DÍAS DEL MES
  // =========================================================

  const days = useMemo(() => {
    const result: Array<number | null> = []

    const firstDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    ).getDay()

    const daysInMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    ).getDate()

    for (let i = 0; i < firstDay; i++) {
      result.push(null)
    }

    for (let i = 1; i <= daysInMonth; i++) {
      result.push(i)
    }

    return result
  }, [currentDate])

  // =========================================================
  // AGRUPAR REUNIONES
  // =========================================================

  const groupedMeetings = useMemo(() => {
    const grouped: Record<
      string,
      Meeting[]
    > = {}

    meetings.forEach((meeting) => {
      if (!grouped[meeting.meeting_date]) {
        grouped[meeting.meeting_date] = []
      }

      grouped[
        meeting.meeting_date
      ].push(meeting)
    })

    return grouped
  }, [meetings])

  // =========================================================
  // COLOR POR ÁREA
  // =========================================================

  const getAreaStyles = (
    meetingArea: MeetingArea
  ) => {
    switch (meetingArea) {
      case 'marketing':
        return {
          container:
            'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
          dot: 'bg-purple-500',
          label: 'Marketing',
        }

      case 'video':
        return {
          container:
            'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
          dot: 'bg-blue-500',
          label: 'Video',
        }

      case 'admin':
        return {
          container:
            'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
          dot: 'bg-green-500',
          label: 'Administración',
        }
    }
  }

  // =========================================================
  // ABRIR MODAL
  // =========================================================

  const openCreateModal = (
    selectedDate?: string
  ) => {
    const date =
      selectedDate ||
      new Date().toISOString().split('T')[0]

    setMeetingDate(date)
    setTitle('')
    setDescription('')
    setArea('marketing')
    setStartTime('')
    setEndTime('')
    setSelectedUsers([])

    setShowModal(true)
  }

  // =========================================================
  // CERRAR MODAL
  // =========================================================

  const closeModal = () => {
    if (saving) return

    setShowModal(false)
  }

  // =========================================================
  // PARTICIPANTES
  // =========================================================

  const toggleUser = (
    userId: string
  ) => {
    setSelectedUsers((current) =>
      current.includes(userId)
        ? current.filter(
            (id) => id !== userId
          )
        : [...current, userId]
    )
  }

  // =========================================================
  // GUARDAR REUNIÓN
  // =========================================================

  const handleSaveMeeting =
    async () => {
      if (!title.trim()) {
        alert(
          'Escribe el nombre de la reunión.'
        )
        return
      }

      if (!meetingDate) {
        alert(
          'Selecciona una fecha.'
        )
        return
      }

      if (!startTime) {
        alert(
          'Selecciona una hora de inicio.'
        )
        return
      }

      setSaving(true)

      try {
        const {
          data: {
            user,
          },
        } = await supabase.auth.getUser()

        if (!user) {
          alert(
            'No se encontró el usuario actual.'
          )
          return
        }

        const {
          data: meeting,
          error,
        } = await supabase
          .from('meetings')
          .insert({
            title: title.trim(),
            description:
              description.trim() ||
              null,
            area,
            meeting_date: meetingDate,
            start_time: startTime,
            end_time:
              endTime || null,
            created_by: user.id,
          })
          .select()
          .single()

        if (error) {
          console.error(
            'Error creando reunión:',
            error
          )

          alert(
            `No se pudo crear la reunión: ${error.message}`
          )

          return
        }

        // =====================================================
        // PARTICIPANTES
        // =====================================================

        if (
          selectedUsers.length > 0 &&
          meeting?.id
        ) {
          const participants =
            selectedUsers.map(
              (userId) => ({
                meeting_id:
                  meeting.id,
                user_id:
                  userId,
              })
            )

          const {
            error:
              participantsError,
          } =
            await supabase
              .from(
                'meeting_participants'
              )
              .insert(
                participants
              )

          if (
            participantsError
          ) {
            console.error(
              'Error agregando participantes:',
              participantsError
            )

            alert(
              'La reunión se creó, pero hubo un problema agregando los participantes.'
            )
          }
        }

        setShowModal(false)

        await loadMeetings()
      } catch (error) {
        console.error(
          'Error creando reunión:',
          error
        )

        alert(
          'Ocurrió un error al crear la reunión.'
        )
      } finally {
        setSaving(false)
      }
    }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-6">

      {/* =====================================================
          ENCABEZADO
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
                Agenda reuniones entre Marketing,
                Video y Administración.
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
            <Plus size={17} />
            Nueva reunión
          </button>

        </div>

        {/* ÁREAS */}

        <div className="flex flex-wrap gap-3 mt-5">

          <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            Marketing
          </span>

          <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Video
          </span>

          <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Administración
          </span>

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
            onClick={() =>
              setCurrentDate(
                new Date(
                  currentDate.getFullYear(),
                  currentDate.getMonth() - 1,
                  1
                )
              )
            }
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <ChevronLeft size={20} />
          </button>

          <h3 className="text-lg font-bold capitalize text-gray-900 dark:text-white">
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
            onClick={() =>
              setCurrentDate(
                new Date(
                  currentDate.getFullYear(),
                  currentDate.getMonth() + 1,
                  1
                )
              )
            }
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <ChevronRight size={20} />
          </button>

        </div>

        {/* DÍAS */}

        <div className="grid grid-cols-7 gap-2 mb-2">

          {[
            'Dom',
            'Lun',
            'Mar',
            'Mié',
            'Jue',
            'Vie',
            'Sáb',
          ].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-gray-500 dark:text-gray-400 py-2"
            >
              {day}
            </div>
          ))}

        </div>

        {/* CALENDARIO */}

        <div className="grid grid-cols-7 gap-2">

          {days.map(
            (day, index) => {

              if (day === null) {
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

              const dayMeetings =
                groupedMeetings[
                  dateStr
                ] || []

              return (
                <div
                  key={dateStr}
                  className="min-h-[130px] border border-gray-200 dark:border-gray-700 rounded-xl p-2 bg-gray-50 dark:bg-gray-800"
                >

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
                      className="p-1 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-gray-700 transition"
                      title="Crear reunión"
                    >
                      <Plus size={14} />
                    </button>

                  </div>

                  <div className="space-y-1.5">

                    {dayMeetings.map(
                      (meeting) => {

                        const styles =
                          getAreaStyles(
                            meeting.area
                          )

                        return (
                          <div
                            key={
                              meeting.id
                            }
                            className={`text-xs font-medium px-2 py-1.5 rounded-md ${styles.container}`}
                          >

                            <div className="truncate font-semibold">
                              {
                                meeting.title
                              }
                            </div>

                            <div className="mt-0.5 opacity-75">
                              {
                                meeting.start_time?.slice(
                                  0,
                                  5
                                )
                              }

                              {' · '}

                              {
                                styles.label
                              }
                            </div>

                          </div>
                        )
                      }
                    )}

                  </div>

                </div>
              )
            }
          )}

        </div>

      </div>

      {/* =====================================================
          MODAL NUEVA REUNIÓN
      ===================================================== */}

      {showModal && (

        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">

            {/* HEADER */}

            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">

              <div>

                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Nueva reunión
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Agenda una reunión con el equipo.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={saving}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
              >
                <X size={20} />
              </button>

            </div>

            {/* CONTENIDO */}

            <div className="p-5 space-y-5">

              {/* TÍTULO */}

              <div>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre de la reunión
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) =>
                    setTitle(
                      e.target.value
                    )
                  }
                  placeholder="Ej. Revisión de campaña"
                  disabled={saving}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />

              </div>

              {/* ÁREA */}

              <div>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Área
                </label>

                <select
                  value={area}
                  onChange={(e) =>
                    setArea(
                      e.target
                        .value as MeetingArea
                    )
                  }
                  disabled={saving}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >

                  <option value="marketing">
                    Marketing
                  </option>

                  <option value="video">
                    Video
                  </option>

                  <option value="admin">
                    Administración
                  </option>

                </select>

              </div>

              {/* FECHA + HORA */}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                <div>

                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha
                  </label>

                  <input
                    type="date"
                    value={
                      meetingDate
                    }
                    onChange={(e) =>
                      setMeetingDate(
                        e.target.value
                      )
                    }
                    disabled={saving}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />

                </div>

                <div>

                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Inicio
                  </label>

                  <input
                    type="time"
                    value={
                      startTime
                    }
                    onChange={(e) =>
                      setStartTime(
                        e.target.value
                      )
                    }
                    disabled={saving}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />

                </div>

                <div>

                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fin
                  </label>

                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) =>
                      setEndTime(
                        e.target.value
                      )
                    }
                    disabled={saving}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />

                </div>

              </div>

              {/* DESCRIPCIÓN */}

              <div>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción
                </label>

                <textarea
                  value={
                    description
                  }
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  rows={3}
                  placeholder="Detalles de la reunión..."
                  disabled={saving}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                />

              </div>

              {/* PARTICIPANTES */}

              <div>

                <div className="flex items-center gap-2 mb-2">

                  <Users
                    size={16}
                    className="text-gray-500"
                  />

                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Participantes
                  </label>

                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">

                  {users.length === 0 ? (

                    <p className="text-sm text-gray-500 p-2">
                      No hay usuarios disponibles.
                    </p>

                  ) : (

                    users.map(
                      (user) => {

                        const selected =
                          selectedUsers.includes(
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
                                selected
                              }
                              onChange={() =>
                                toggleUser(
                                  user.id
                                )
                              }
                              disabled={
                                saving
                              }
                              className="w-4 h-4"
                            />

                            <div>

                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {
                                  user.full_name
                                }
                              </div>

                              <div className="text-xs text-gray-500">
                                {
                                  user.role
                                }
                              </div>

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

            <div className="flex gap-3 p-5 border-t border-gray-200 dark:border-gray-700">

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={
                  handleSaveMeeting
                }
                disabled={
                  saving ||
                  !title.trim() ||
                  !meetingDate ||
                  !startTime
                }
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-semibold transition disabled:opacity-50"
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
                    <Save size={17} />
                    Guardar reunión
                  </>
                )}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}