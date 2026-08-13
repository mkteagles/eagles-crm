'use client'

import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Users,
  ClipboardList,
  Plus,
  ArrowRight,
  Building2,
  Loader,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useUsers,
} from '@/lib/marketing-hooks'

import {
  createClient,
} from '@/lib/supabase/client'

import CreateActivityModal from '@/components/CreateActivityModal'


// =====================================================
// PROPS
// =====================================================

interface AdministrationDashboardProps {
  user: {
    id: string
    full_name: string | null
    role: string
  }
}


// =====================================================
// ACTIVITY
// =====================================================

interface Activity {
  id: string
  title: string
  description: string | null
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'urgent' | 'high' | 'medium' | 'low'
  due_date: string
  due_time: string | null
  assigned_to: string
  created_by: string
}


// =====================================================
// GREETING
// =====================================================

function getGreeting() {

  const hour =
    new Date().getHours()

  if (hour < 12) {
    return 'Buenos días'
  }

  if (hour < 19) {
    return 'Buenas tardes'
  }

  return 'Buenas noches'
}


// =====================================================
// STATUS
// =====================================================

function getStatusLabel(
  status: Activity['status']
) {

  switch (status) {

    case 'completed':
      return 'Completada'

    case 'in_progress':
      return 'En progreso'

    case 'pending':
    default:
      return 'Pendiente'

  }

}


// =====================================================
// PRIORITY
// =====================================================

function getPriorityLabel(
  priority: Activity['priority']
) {

  switch (priority) {

    case 'urgent':
      return 'Urgente'

    case 'high':
      return 'Alta'

    case 'low':
      return 'Baja'

    case 'medium':
    default:
      return 'Media'

  }

}


// =====================================================
// DATE
// =====================================================

function formatDate(
  date: string
) {

  const parsed =
    new Date(
      `${date}T12:00:00`
    )

  return parsed.toLocaleDateString(
    'es-MX',
    {
      day: 'numeric',
      month: 'long',
    }
  )

}


// =====================================================
// TIME
// =====================================================

function formatTime(
  time: string | null
) {

  if (!time) {
    return null
  }

  const [
    hour,
    minute,
  ] = time.split(':')

  const date =
    new Date()

  date.setHours(
    Number(hour),
    Number(minute),
    0,
    0
  )

  return date.toLocaleTimeString(
    'es-MX',
    {
      hour: 'numeric',
      minute: '2-digit',
    }
  )

}


// =====================================================
// COMPONENTE
// =====================================================

export default function AdministrationDashboard({
  user,
}: AdministrationDashboardProps) {

  const supabase =
    createClient()

  const {
    users,
  } = useUsers()


  // ===================================================
  // MODAL
  // ===================================================

  const [
    showCreateModal,
    setShowCreateModal,
  ] = useState(false)


  // ===================================================
  // ACTIVIDADES
  // ===================================================

  const [
    activities,
    setActivities,
  ] = useState<Activity[]>([])


  const [
    loading,
    setLoading,
  ] = useState(true)


  // ===================================================
  // PERMISOS
  // ===================================================

  const isAdmin =
    user.role === 'admin'


  // ===================================================
  // NOMBRE
  // ===================================================

  const firstName =
    user.full_name
      ?.split(' ')[0] ||
    'Usuario'


  // ===================================================
  // CARGAR ACTIVIDADES
  // ===================================================

  const loadActivities =
    async () => {

      setLoading(true)

      try {

        const {
          data,
          error,
        } = await supabase
          .from('activities')
          .select(`
            id,
            title,
            description,
            status,
            priority,
            due_date,
            due_time,
            assigned_to,
            created_by
          `)
          .eq(
            'area',
            'administration'
          )
          .order(
            'due_date',
            {
              ascending: true,
            }
          )
          .order(
            'due_time',
            {
              ascending: true,
            }
          )


        if (error) {

          console.error(
            'Error loading administration activities:',
            error
          )

          alert(
            `Error al cargar actividades administrativas: ${error.message}`
          )

          return

        }


        setActivities(
          (data || []) as Activity[]
        )

      } catch (error) {

        console.error(
          error
        )

      } finally {

        setLoading(false)

      }

    }


  // ===================================================
  // CARGAR AL INICIAR
  // ===================================================

  useEffect(() => {

    loadActivities()

  }, [])


  // ===================================================
  // REFRESH
  // ===================================================

  const handleActivityCreated =
    async () => {

      await loadActivities()

      setShowCreateModal(false)

    }


  // ===================================================
  // ACTIVIDADES VISIBLES
  // ===================================================

  const visibleActivities =
    useMemo(() => {

      /*
       * ADMIN:
       * ve todas las actividades administrativas.
       *
       * RESTO:
       * solo las que tiene asignadas.
       */

      if (isAdmin) {

        return activities

      }


      return activities.filter(
        (activity) =>
          activity.assigned_to ===
          user.id
      )

    }, [
      activities,
      isAdmin,
      user.id,
    ])


  // ===================================================
  // STATS
  // ===================================================

  const completed =
    visibleActivities.filter(
      (activity) =>
        activity.status ===
        'completed'
    ).length


  const inProgress =
    visibleActivities.filter(
      (activity) =>
        activity.status ===
        'in_progress'
    ).length


  const pending =
    visibleActivities.filter(
      (activity) =>
        activity.status ===
        'pending'
    ).length


  // ===================================================
  // PRÓXIMA ACTIVIDAD
  // ===================================================

  const nextActivity =
    visibleActivities.find(
      (activity) =>
        activity.status !==
        'completed'
    )


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      <div className="max-w-7xl mx-auto px-6 py-8">


        {/* =========================================
            HEADER
        ========================================= */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">


          <div className="flex-1">

            <div className="flex items-center gap-2 mb-2">

              <Building2
                size={18}
                className="text-purple-600"
              />

              <span className="text-sm font-medium text-purple-600">

                Administración

              </span>

            </div>


            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">

              {getGreeting()}, {firstName} 👋

            </h1>


            <p className="mt-1 text-gray-500 dark:text-gray-400">

              {isAdmin
                ? 'Gestiona las actividades y pendientes administrativos.'
                : 'Aquí puedes consultar tus actividades administrativas.'
              }

            </p>

          </div>


          {/* BOTÓN */}

          <div className="flex items-center gap-4">

            {isAdmin && (

              <button
                type="button"
                onClick={() =>
                  setShowCreateModal(true)
                }
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-sm transition"
              >

                <Plus
                  size={18}
                />

                Nueva actividad

              </button>

            )}

          </div>

        </div>


        {/* =========================================
            STATS
        ========================================= */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">


          {/* TOTAL */}

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">

            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">

              <ClipboardList
                size={20}
                className="text-purple-600"
              />

            </div>

            <p className="text-sm text-gray-500">

              Total actividades

            </p>

            <p className="text-2xl font-bold mt-1">

              {visibleActivities.length}

            </p>

          </div>


          {/* PENDIENTES */}

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">

            <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mb-3">

              <Clock
                size={20}
                className="text-yellow-600"
              />

            </div>

            <p className="text-sm text-gray-500">

              Pendientes

            </p>

            <p className="text-2xl font-bold mt-1 text-yellow-600">

              {pending}

            </p>

          </div>


          {/* EN PROGRESO */}

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">

            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">

              <ArrowRight
                size={20}
                className="text-blue-600"
              />

            </div>

            <p className="text-sm text-gray-500">

              En progreso

            </p>

            <p className="text-2xl font-bold mt-1 text-blue-600">

              {inProgress}

            </p>

          </div>


          {/* COMPLETADAS */}

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">

            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">

              <CheckCircle2
                size={20}
                className="text-green-600"
              />

            </div>

            <p className="text-sm text-gray-500">

              Completadas

            </p>

            <p className="text-2xl font-bold mt-1 text-green-600">

              {completed}

            </p>

          </div>

        </div>


        {/* =========================================
            CONTENIDO
        ========================================= */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">


          {/* =========================================
              ACTIVIDADES
          ========================================= */}

          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">


            <div className="p-5 border-b border-gray-200 dark:border-gray-800">

              <div className="flex items-center justify-between">

                <div>

                  <h2 className="text-lg font-bold">

                    {isAdmin
                      ? 'Actividades administrativas'
                      : 'Mis actividades'
                    }

                  </h2>


                  <p className="text-sm text-gray-500 mt-1">

                    Pendientes y actividades asignadas

                  </p>

                </div>


                <ClipboardList
                  size={22}
                  className="text-purple-600"
                />

              </div>

            </div>


            {loading ? (

              <div className="flex items-center justify-center py-12">

                <Loader
                  size={24}
                  className="animate-spin text-purple-600"
                />

                <span className="ml-2 text-sm text-gray-500">

                  Cargando actividades...

                </span>

              </div>

            ) : visibleActivities.length === 0 ? (

              <div className="py-12 text-center">

                <ClipboardList
                  size={40}
                  className="mx-auto text-gray-300"
                />

                <p className="mt-3 text-sm text-gray-500">

                  No hay actividades administrativas.

                </p>

              </div>

            ) : (

              <div className="divide-y divide-gray-100 dark:divide-gray-800">

                {visibleActivities.map(
                  (activity) => (

                    <div
                      key={activity.id}
                      className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                    >

                      <div className="flex items-start gap-4">


                        {/* ICONO */}

                        <div
                          className={`
                            w-10 h-10 rounded-xl
                            flex items-center justify-center
                            shrink-0
                            ${
                              activity.status ===
                              'completed'
                                ? 'bg-green-100 text-green-600'
                                : activity.status ===
                                  'in_progress'
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-yellow-100 text-yellow-600'
                            }
                          `}
                        >

                          {activity.status ===
                          'completed' ? (

                            <CheckCircle2
                              size={19}
                            />

                          ) : activity.status ===
                            'in_progress' ? (

                            <ArrowRight
                              size={19}
                            />

                          ) : (

                            <Clock
                              size={19}
                            />

                          )}

                        </div>


                        {/* INFO */}

                        <div className="flex-1 min-w-0">

                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">

                            <h3 className="font-semibold text-gray-900 dark:text-white">

                              {activity.title}

                            </h3>


                            <span
                              className={`
                                text-xs font-semibold
                                px-2.5 py-1 rounded-full
                                w-fit
                                ${
                                  activity.status ===
                                  'completed'
                                    ? 'bg-green-100 text-green-700'
                                    : activity.status ===
                                      'in_progress'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }
                              `}
                            >

                              {getStatusLabel(
                                activity.status
                              )}

                            </span>

                          </div>


                          {activity.description && (

                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">

                              {activity.description}

                            </p>

                          )}


                          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">


                            <span className="inline-flex items-center gap-1.5">

                              <CalendarDays
                                size={14}
                              />

                              {formatDate(
                                activity.due_date
                              )}

                            </span>


                            {activity.due_time && (

                              <span className="inline-flex items-center gap-1.5">

                                <Clock
                                  size={14}
                                />

                                {formatTime(
                                  activity.due_time
                                )}

                              </span>

                            )}


                            <span>

                              Prioridad:{' '}

                              <strong>

                                {getPriorityLabel(
                                  activity.priority
                                )}

                              </strong>

                            </span>

                          </div>

                        </div>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </div>


          {/* =========================================
              LATERAL
          ========================================= */}

          <div className="space-y-6">


            {/* PRÓXIMA ACTIVIDAD */}

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">


              <div className="p-5 border-b border-gray-200 dark:border-gray-800">

                <div className="flex items-center gap-3">

                  <div className="w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">

                    <CalendarDays
                      size={21}
                      className="text-purple-600"
                    />

                  </div>


                  <div>

                    <h3 className="font-bold">

                      Próxima actividad

                    </h3>

                    <p className="text-xs text-gray-500">

                      Administración

                    </p>

                  </div>

                </div>

              </div>


              <div className="p-5">

                {nextActivity ? (

                  <>

                    <p className="text-lg font-bold">

                      {nextActivity.title}

                    </p>


                    <p className="text-sm text-gray-500 mt-2">

                      {formatDate(
                        nextActivity.due_date
                      )}

                      {nextActivity.due_time
                        ? ` · ${formatTime(nextActivity.due_time)}`
                        : ''
                      }

                    </p>

                  </>

                ) : (

                  <p className="text-sm text-gray-500">

                    No hay actividades pendientes.

                  </p>

                )}

              </div>

            </div>


            {/* USUARIOS */}

            {isAdmin && (

              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">


                <div className="p-5 border-b border-gray-200 dark:border-gray-800">

                  <div className="flex items-center justify-between">

                    <div>

                      <h3 className="font-bold">

                        Usuarios

                      </h3>

                      <p className="text-xs text-gray-500 mt-1">

                        Usuarios disponibles

                      </p>

                    </div>


                    <Users
                      size={20}
                      className="text-purple-600"
                    />

                  </div>

                </div>


                <div className="p-4 space-y-2">

                  {(users || [])
                    .filter(
                      (member) =>
                        member.role !==
                        'viewer'
                    )
                    .map(
                      (member) => {

                        const count =
                          activities.filter(
                            (activity) =>
                              activity.assigned_to ===
                              member.id
                          ).length


                        return (

                          <div
                            key={member.id}
                            className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                          >

                            <div>

                              <p className="font-medium text-sm">

                                {member.full_name}

                              </p>

                              <p className="text-xs text-gray-500">

                                {member.role}

                              </p>

                            </div>


                            <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-1 rounded-full">

                              {count}

                            </span>

                          </div>

                        )

                      }
                    )}

                </div>

              </div>

            )}

          </div>

        </div>

      </div>


      {/* =========================================
          MODAL CREAR ACTIVIDAD
      ========================================= */}

      {isAdmin && (

        <CreateActivityModal
          isOpen={showCreateModal}
          defaultArea="administration"
          onClose={() =>
            setShowCreateModal(false)
          }
          onSuccess={
            handleActivityCreated
          }
        />

      )}

    </div>

  )

}