'use client'

import {
  useActivities,
  useCurrentUser,
} from '@/lib/marketing-hooks'

import { createClient } from '@/lib/supabase/client'

import { ActivityStatus } from '@/lib/marketing-types'

import {
  getStatusStyles,
  getPriorityStyles,
} from '@/lib/marketing-ui'

import {
  Eye,
  Trash2,
  Sparkles,
} from 'lucide-react'

import {
  useMemo,
  useState,
} from 'react'

import ActivityDetailModal from './ActivityDetailModal'

// =========================================================
// TIPOS
// =========================================================

type StatusFilter =
  | 'all'
  | 'pending'
  | 'in_progress'
  | 'completed'

interface ActivitiesTableProps {
  statusFilter?: StatusFilter
}

// =========================================================
// COMPONENTE
// =========================================================

export default function ActivitiesTable({
  statusFilter = 'all',
}: ActivitiesTableProps) {

  // =======================================================
  // ACTIVIDADES
  // =======================================================

  const {
    activities,
    loading,
    newActivityIds,
    markActivityAsSeen,
  } = useActivities()

  // =======================================================
  // USUARIO
  // =======================================================

  const {
    user,
  } = useCurrentUser()

  // =======================================================
  // ACTIVIDAD SELECCIONADA
  // =======================================================

  const [
    selectedActivity,
    setSelectedActivity,
  ] = useState<any | null>(null)

  // =======================================================
  // SUPABASE
  // =======================================================

  const supabase = createClient()

  // =======================================================
  // FILTRAR ACTIVIDADES
  // =======================================================

  const filteredActivities = useMemo(() => {

    if (statusFilter === 'all') {
      return activities
    }

    return activities.filter(
      (activity: any) =>
        activity.status === statusFilter
    )

  }, [
    activities,
    statusFilter,
  ])

  // =======================================================
  // CAMBIAR ESTADO
  // =======================================================

  const handleStatusChange = async (
    activityId: number,
    newStatus: ActivityStatus
  ) => {

    const previousActivity =
      activities.find(
        (activity: any) =>
          Number(activity.id) ===
          Number(activityId)
      )

    try {

      const {
        error,
      } = await supabase
        .from('activities')
        .update({
          status: newStatus,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          activityId
        )

      // ===================================================
      // ERROR
      // ===================================================

      if (error) {

        console.error(
          '❌ Error actualizando actividad:',
          error
        )

        alert(
          `No se pudo actualizar la actividad:\n\n${error.message}`
        )

        return
      }

      // ===================================================
      // ÉXITO
      // ===================================================

      console.log(
        '✅ Estado actualizado:',
        {
          activityId,
          oldStatus:
            previousActivity?.status,
          newStatus,
        }
      )

    } catch (error) {

      console.error(
        '❌ Error inesperado actualizando actividad:',
        error
      )

      alert(
        'Ocurrió un error inesperado al actualizar la actividad.'
      )
    }
  }

  // =======================================================
  // ELIMINAR ACTIVIDAD
  // =======================================================

  const handleDeleteActivity = async (
    activityId: number,
    activityTitle: string
  ) => {

    // -----------------------------------------------------
    // SEGURIDAD FRONTEND
    // -----------------------------------------------------

    if (user?.role !== 'admin') {

      console.warn(
        '⛔ Usuario sin permisos para eliminar actividades'
      )

      return
    }

    // -----------------------------------------------------
    // CONFIRMACIÓN
    // -----------------------------------------------------

    const confirmed =
      window.confirm(
        `¿Seguro que quieres eliminar la actividad "${activityTitle}"?\n\nEsta acción no se puede deshacer.`
      )

    if (!confirmed) {
      return
    }

    // -----------------------------------------------------
    // ELIMINAR
    // -----------------------------------------------------

    try {

      console.log(
        '🗑️ Intentando eliminar actividad:',
        activityId
      )

      const {
        data,
        error,
      } = await supabase
        .from('activities')
        .delete()
        .eq(
          'id',
          activityId
        )
        .select('id')

      // ===================================================
      // ERROR SUPABASE
      // ===================================================

      if (error) {

        console.error(
          '❌ Error eliminando actividad:',
          error
        )

        alert(
          `No se pudo eliminar la actividad:\n\n${error.message}`
        )

        return
      }

      // ===================================================
      // NO SE ELIMINÓ NINGUNA FILA
      // ===================================================

      if (
        !data ||
        data.length === 0
      ) {

        console.error(
          '❌ Supabase no eliminó ninguna actividad.',
          {
            activityId,
            userId: user?.id,
            userRole: user?.role,
          }
        )

        alert(
          'La actividad no fue eliminada.\n\n' +
          'Supabase no encontró una actividad que puedas eliminar.'
        )

        return
      }

      // ===================================================
      // ÉXITO
      // ===================================================

      console.log(
        '✅ Actividad eliminada correctamente:',
        data
      )

      // ===================================================
      // CERRAR MODAL SI ESTABA ABIERTO
      // ===================================================

      if (
        Number(
          selectedActivity?.id
        ) ===
        Number(activityId)
      ) {

        setSelectedActivity(
          null
        )
      }

    } catch (error) {

      console.error(
        '❌ Error inesperado eliminando actividad:',
        error
      )

      alert(
        'Ocurrió un error inesperado al eliminar la actividad.'
      )
    }
  }

  // =======================================================
  // ABRIR ACTIVIDAD
  // =======================================================

  const handleOpenActivity = (
    activity: any
  ) => {

    // -----------------------------------------------------
    // QUITAR INDICADOR "NUEVA"
    // -----------------------------------------------------

    markActivityAsSeen(
      Number(activity.id)
    )

    // -----------------------------------------------------
    // ABRIR MODAL
    // -----------------------------------------------------

    setSelectedActivity(
      activity
    )
  }

  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {

    return (
      <div className="flex items-center justify-center py-12">

        <p className="text-gray-500 dark:text-gray-400">
          Cargando actividades...
        </p>

      </div>
    )
  }

  // =======================================================
  // SIN ACTIVIDADES
  // =======================================================

  if (
    filteredActivities.length === 0
  ) {

    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-surface p-10 text-center">

        <div className="text-4xl mb-3">
          📋
        </div>

        <h3 className="font-semibold text-gray-900 dark:text-white">
          No hay actividades
        </h3>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">

          {statusFilter === 'all'
            ? 'Todavía no hay actividades registradas.'
            : 'No hay actividades con este estado.'}

        </p>

      </div>
    )
  }

  // =======================================================
  // TABLA
  // =======================================================

  return (
    <>

      <div className="w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-surface shadow-sm">

        <table className="w-full">

          {/* =================================================
              HEADER
          ================================================= */}

          <thead className="border-b border-gray-200 dark:border-gray-800">

            <tr>

              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Actividad
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Asignado a
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Vencimiento
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Prioridad
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Estado
              </th>

              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">
                Acciones
              </th>

            </tr>

          </thead>

          {/* =================================================
              ACTIVIDADES
          ================================================= */}

          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">

            {filteredActivities.map(
              (
                activity: any
              ) => {

                // -------------------------------------------
                // NUEVA
                // -------------------------------------------

                const isNew =
                  newActivityIds.includes(
                    Number(activity.id)
                  )

                // -------------------------------------------
                // ESTILOS
                // -------------------------------------------

                const priorityStyles =
                  getPriorityStyles(
                    activity.priority
                  )

                const statusStyles =
                  getStatusStyles(
                    activity.status
                  )

                return (

                  <tr
                    key={
                      activity.id
                    }
                    className={`
                      transition-all
                      duration-300
                      ${
                        isNew
                          ? `
                            bg-blue-50
                            dark:bg-blue-950/20
                            ring-1
                            ring-inset
                            ring-blue-400/40
                          `
                          : `
                            hover:bg-gray-50
                            dark:hover:bg-gray-900/50
                          `
                      }
                    `}
                  >

                    {/* =====================================
                        ACTIVIDAD
                    ===================================== */}

                    <td className="px-4 py-4">

                      <div className="flex items-start gap-3">

                        {isNew && (

                          <div className="flex-shrink-0 mt-0.5">

                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wide shadow-sm">

                              <Sparkles
                                size={11}
                              />

                              Nueva

                            </div>

                          </div>

                        )}

                        <div className="min-w-0">

                          <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">

                            {
                              activity.title
                            }

                          </div>

                          {activity.description && (

                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">

                              {
                                activity.description
                              }

                            </div>

                          )}

                        </div>

                      </div>

                    </td>

                    {/* =====================================
                        ASIGNADO
                    ===================================== */}

                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">

                      {
                        activity.assigned_to_name ||
                        activity.assigned_to ||
                        'Sin asignar'
                      }

                    </td>

                    {/* =====================================
                        VENCIMIENTO
                    ===================================== */}

                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">

                      {
                        activity.due_date ||
                        'Sin fecha'
                      }

                    </td>

                    {/* =====================================
                        PRIORIDAD
                    ===================================== */}

                    <td className="px-4 py-4">

                      <span
                        className={`
                          inline-flex
                          items-center
                          px-2.5
                          py-1
                          rounded-full
                          text-xs
                          font-semibold
                          ${priorityStyles.badge}
                        `}
                      >

                        {
                          priorityStyles.label
                        }

                      </span>

                    </td>

                    {/* =====================================
                        ESTADO
                    ===================================== */}

                    <td className="px-4 py-4">

                      {user?.role ===
                        'executor' &&
                      activity.assigned_to ===
                        user.id ? (

                        <select
                          value={
                            activity.status
                          }
                          onChange={(
                            e
                          ) =>
                            handleStatusChange(
                              activity.id,
                              e.target.value as ActivityStatus
                            )
                          }
                          className={`
                            px-2.5
                            py-1
                            rounded-full
                            text-xs
                            font-semibold
                            cursor-pointer
                            border-0
                            outline-none
                            ${statusStyles.badge}
                          `}
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

                        <span
                          className={`
                            inline-flex
                            items-center
                            gap-1.5
                            px-2.5
                            py-1
                            rounded-full
                            text-xs
                            font-semibold
                            ${statusStyles.badge}
                          `}
                        >

                          <span
                            className={`
                              w-1.5
                              h-1.5
                              rounded-full
                              ${statusStyles.dot}
                            `}
                          />

                          {
                            statusStyles.label
                          }

                        </span>

                      )}

                    </td>

                    {/* =====================================
                        ACCIONES
                    ===================================== */}

                    <td className="px-4 py-4 text-center">

                      <div className="flex items-center justify-center gap-3">

                        {/* ---------------------------------
                            VER
                        --------------------------------- */}

                        <button
                          type="button"
                          onClick={() =>
                            handleOpenActivity(
                              activity
                            )
                          }
                          className={`
                            text-blue-500
                            hover:text-blue-400
                            text-sm
                            font-semibold
                            inline-flex
                            items-center
                            justify-center
                            gap-1
                            transition
                            ${
                              isNew
                                ? 'animate-pulse'
                                : ''
                            }
                          `}
                        >

                          <Eye
                            size={16}
                          />

                          Ver

                        </button>

                        {/* ---------------------------------
                            ELIMINAR
                            SOLO ADMIN
                        --------------------------------- */}

                        {user?.role ===
                          'admin' && (

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteActivity(
                                Number(activity.id),
                                activity.title
                              )
                            }
                            className="
                              text-red-500
                              hover:text-red-600
                              dark:hover:text-red-400
                              text-sm
                              font-semibold
                              inline-flex
                              items-center
                              justify-center
                              gap-1
                              transition
                            "
                            title="Eliminar actividad"
                          >

                            <Trash2
                              size={16}
                            />

                            Eliminar

                          </button>

                        )}

                      </div>

                    </td>

                  </tr>

                )
              }
            )}

          </tbody>

        </table>

      </div>

      {/* =====================================================
          MODAL DE DETALLE
      ===================================================== */}

      {selectedActivity && (

        <ActivityDetailModal
          activity={
            selectedActivity
          }

          currentUserRole={
            user?.role
          }

          currentUserId={
            user?.id
          }

          onClose={() =>
            setSelectedActivity(
              null
            )
          }
        />

      )}

    </>
  )
}