
'use client'

import {
  useCurrentUser,
  useActivities,
} from '@/lib/marketing-hooks'

import { useState } from 'react'

import ActivitiesTable from '@/components/ActivitiesTable'
import CreateActivityModal from '@/components/CreateActivityModal'
import FixedActivitiesModal from '@/components/FixedActivitiesModal'
import ContentSuggestions from '@/components/ContentSuggestions'

import {
  Calendar,
  FileText,
  Loader,
  Plus,
  Sparkles,
} from 'lucide-react'

import Link from 'next/link'

export default function MarketingDashboard() {

  // =========================================================
  // USUARIO
  // =========================================================

  const {
    user,
    loading: userLoading,
  } = useCurrentUser()

  // =========================================================
  // ACTIVIDADES
  // =========================================================

  const {
    activities,
    loading: activitiesLoading,
  } = useActivities()

  // =========================================================
  // MODALES
  // =========================================================

  const [
    showCreateModal,
    setShowCreateModal,
  ] = useState(false)

  const [
    showFixedActivitiesModal,
    setShowFixedActivitiesModal,
  ] = useState(false)

  // =========================================================
  // FILTRO ACTUAL
  // =========================================================
  //
  // all
  // pending
  // in_progress
  // completed
  //

  const [
    activeFilter,
    setActiveFilter,
  ] = useState<
    'all' |
    'pending' |
    'in_progress' |
    'completed'
  >('all')

  // =========================================================
  // REFRESH
  // =========================================================

  const [
    refreshKey,
    setRefreshKey,
  ] = useState(0)

  // =========================================================
  // ACTIVIDAD NUEVA CREADA
  // =========================================================

  const handleSuccess = () => {

    setRefreshKey(
      (prev) => prev + 1
    )

    setShowCreateModal(false)
  }

  // =========================================================
  // ACTIVIDAD FIJA CREADA
  // =========================================================

  const handleFixedActivitySuccess = () => {

    setRefreshKey(
      (prev) => prev + 1
    )

    setShowFixedActivitiesModal(false)
  }

  // =========================================================
  // CARGANDO USUARIO
  // =========================================================

  if (userLoading) {

    return (
      <div className="flex items-center justify-center py-12">

        <Loader
          className="animate-spin mr-2"
          size={24}
        />

        <p>
          Cargando datos...
        </p>

      </div>
    )
  }

  // =========================================================
  // SIN USUARIO
  // =========================================================

  if (!user) {

    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">

        <p>
          No autenticado
        </p>

        <Link
          href="/login"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Ir al Login
        </Link>

      </div>
    )
  }

  // =========================================================
  // ESTADÍSTICAS
  // =========================================================

  const stats = {

    total:
      activities.length,

    pending:
      activities.filter(
        (a) =>
          a.status === 'pending'
      ).length,

    inProgress:
      activities.filter(
        (a) =>
          a.status === 'in_progress'
      ).length,

    completed:
      activities.filter(
        (a) =>
          a.status === 'completed'
      ).length,
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          🎯 Marketing - Actividades
        </h1>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">

          Bienvenido,{' '}

          <span className="font-semibold">
            {user.full_name}
          </span>{' '}

          {user.role}

        </p>

      </div>

      {/* =====================================================
          BOTONES
      ===================================================== */}

      <div className="flex gap-3 flex-wrap">

        {/* CREAR ACTIVIDAD */}

        {user.role === 'admin' && (
          <>
            <button
              type="button"
              onClick={() =>
                setShowCreateModal(true)
              }
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold transition"
            >

              <Plus size={20} />

              Crear Actividad

            </button>

            {/* ACTIVIDADES FIJAS */}

            <button
              type="button"
              onClick={() =>
                setShowFixedActivitiesModal(true)
              }
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-semibold transition"
            >

              <Sparkles size={20} />

              Actividades Fijas

            </button>

          </>
        )}

        {/* CALENDARIO */}

        <Link
          href="/app1/marketing/calendar"
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-semibold transition"
        >

          <Calendar size={20} />

          Calendario

        </Link>

        {/* REPORTE EJECUTOR */}

        {user.role === 'executor' && (
          <Link
            href="/app1/marketing/reports"
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold transition"
          >

            <FileText size={20} />

            Generar Reporte

          </Link>
        )}

        {/* REPORTES ADMIN */}

        {user.role === 'admin' && (
          <Link
            href="/app1/marketing/reports"
            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 font-semibold transition"
          >

            <FileText size={20} />

            Reportes

          </Link>
        )}

      </div>

      {/* =====================================================
          ACTIVIDADES
      ===================================================== */}

      {activitiesLoading ? (

        <div className="flex items-center justify-center py-12">

          <Loader
            className="animate-spin mr-2"
            size={24}
          />

          <p>
            Cargando actividades...
          </p>

        </div>

      ) : (

        <>

          {/* =================================================
              ESTADÍSTICAS / FILTROS
          ================================================= */}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            {/* =================================================
                TODAS
            ================================================= */}

            <button
              type="button"
              onClick={() =>
                setActiveFilter('all')
              }
              className={`
                text-left
                rounded-xl
                p-4
                shadow
                transition-all
                border-2
                ${
                  activeFilter === 'all'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                    : 'border-transparent bg-surface hover:shadow-lg'
                }
              `}
            >

              <p className="text-foreground/60 text-sm">
                Total
              </p>

              <p className="text-3xl font-bold text-blue-500">
                {stats.total}
              </p>

              <p className="text-xs text-foreground/50 mt-1">
                Ver todas
              </p>

            </button>

            {/* =================================================
                PENDIENTES
            ================================================= */}

            <button
              type="button"
              onClick={() =>
                setActiveFilter('pending')
              }
              className={`
                text-left
                rounded-xl
                p-4
                shadow
                transition-all
                border-2
                ${
                  activeFilter === 'pending'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                    : 'border-transparent bg-surface hover:shadow-lg'
                }
              `}
            >

              <p className="text-foreground/60 text-sm">
                Pendientes
              </p>

              <p className="text-3xl font-bold text-orange-500">
                {stats.pending}
              </p>

              <p className="text-xs text-foreground/50 mt-1">
                Por realizar
              </p>

            </button>

            {/* =================================================
                EN PROGRESO
            ================================================= */}

            <button
              type="button"
              onClick={() =>
                setActiveFilter('in_progress')
              }
              className={`
                text-left
                rounded-xl
                p-4
                shadow
                transition-all
                border-2
                ${
                  activeFilter === 'in_progress'
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30'
                    : 'border-transparent bg-surface hover:shadow-lg'
                }
              `}
            >

              <p className="text-foreground/60 text-sm">
                En Progreso
              </p>

              <p className="text-3xl font-bold text-yellow-500">
                {stats.inProgress}
              </p>

              <p className="text-xs text-foreground/50 mt-1">
                Trabajando ahora
              </p>

            </button>

            {/* =================================================
                COMPLETADAS
            ================================================= */}

            <button
              type="button"
              onClick={() =>
                setActiveFilter('completed')
              }
              className={`
                text-left
                rounded-xl
                p-4
                shadow
                transition-all
                border-2
                ${
                  activeFilter === 'completed'
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                    : 'border-transparent bg-surface hover:shadow-lg'
                }
              `}
            >

              <p className="text-foreground/60 text-sm">
                Completadas
              </p>

              <p className="text-3xl font-bold text-green-500">
                {stats.completed}
              </p>

              <p className="text-xs text-foreground/50 mt-1">
                Finalizadas
              </p>

            </button>

          </div>

          {/* =================================================
              INDICADOR DE FILTRO
          ================================================= */}

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-lg font-bold text-gray-900 dark:text-white">

                {activeFilter === 'all' &&
                  'Todas las actividades'}

                {activeFilter === 'pending' &&
                  'Actividades pendientes'}

                {activeFilter === 'in_progress' &&
                  'Actividades en progreso'}

                {activeFilter === 'completed' &&
                  'Actividades completadas'}

              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400">

                {activeFilter === 'all' &&
                  `${stats.total} actividades`}

                {activeFilter === 'pending' &&
                  `${stats.pending} actividades pendientes`}

                {activeFilter === 'in_progress' &&
                  `${stats.inProgress} actividades en progreso`}

                {activeFilter === 'completed' &&
                  `${stats.completed} actividades completadas`}

              </p>

            </div>

          </div>

          {/* =================================================
              TABLA FILTRADA
          ================================================= */}

          <ActivitiesTable
            key={refreshKey}
            statusFilter={activeFilter}
          />

        </>

      )}

      {/* =====================================================
          SUGERENCIAS DE CONTENIDO
      ===================================================== */}

      <ContentSuggestions
        refreshKey={refreshKey}
      />

      {/* =====================================================
          MODAL CREAR ACTIVIDAD
      ===================================================== */}

      <CreateActivityModal
        isOpen={showCreateModal}
        onClose={() =>
          setShowCreateModal(false)
        }
        onSuccess={
          handleSuccess
        }
      />

      {/* =====================================================
          MODAL ACTIVIDADES FIJAS
      ===================================================== */}

      <FixedActivitiesModal
        isOpen={
          showFixedActivitiesModal
        }
        onClose={() =>
          setShowFixedActivitiesModal(false)
        }
        onSuccess={
          handleFixedActivitySuccess
        }
      />

    </div>
  )
}

