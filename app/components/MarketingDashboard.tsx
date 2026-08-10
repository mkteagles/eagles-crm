'use client'

import { useCurrentUser, useActivities } from '@/lib/marketing-hooks'
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
  const { user, loading: userLoading } = useCurrentUser()
  const {
    activities,
    loading: activitiesLoading,
  } = useActivities()

  const [showCreateModal, setShowCreateModal] =
    useState(false)

  const [showFixedActivitiesModal, setShowFixedActivitiesModal] =
    useState(false)

  const [refreshKey, setRefreshKey] = useState(0)

  // =========================================================
  // ACTIVIDAD NUEVA CREADA
  // =========================================================

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1)
    setShowCreateModal(false)
  }

  // =========================================================
  // ACTIVIDAD FIJA CREADA
  // =========================================================

  const handleFixedActivitySuccess = () => {
    setRefreshKey((prev) => prev + 1)
    setShowFixedActivitiesModal(false)
  }

  // =========================================================
  // CARGANDO USUARIO
  // =========================================================

  if (userLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader
          className="animate-spin mr-2"
          size={24}
        />

        <p>Cargando datos...</p>
      </div>
    )
  }

  // =========================================================
  // SIN USUARIO
  // =========================================================

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-lg font-semibold">
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
    total: activities.length,

    pending: activities.filter(
      (a) => a.status === 'pending'
    ).length,

    inProgress: activities.filter(
      (a) => a.status === 'in_progress'
    ).length,

    completed: activities.filter(
      (a) => a.status === 'completed'
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

        {/* ACTIVIDADES ADMIN */}

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

          <p>Cargando actividades...</p>

        </div>

      ) : (

        <>
          <ActivitiesTable key={refreshKey} />

          {/* =================================================
              ESTADÍSTICAS
          ================================================= */}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            <div className="bg-surface rounded-lg p-4 shadow hover:shadow-lg transition">

              <p className="text-foreground/60 text-sm">
                Total
              </p>

              <p className="text-3xl font-bold text-blue-500">
                {stats.total}
              </p>

            </div>

            <div className="bg-surface rounded-lg p-4 shadow hover:shadow-lg transition">

              <p className="text-foreground/60 text-sm">
                Pendientes
              </p>

              <p className="text-3xl font-bold text-orange-500">
                {stats.pending}
              </p>

            </div>

            <div className="bg-surface rounded-lg p-4 shadow hover:shadow-lg transition">

              <p className="text-foreground/60 text-sm">
                En Progreso
              </p>

              <p className="text-3xl font-bold text-yellow-500">
                {stats.inProgress}
              </p>

            </div>

            <div className="bg-surface rounded-lg p-4 shadow hover:shadow-lg transition">

              <p className="text-foreground/60 text-sm">
                Completadas
              </p>

              <p className="text-3xl font-bold text-green-500">
                {stats.completed}
              </p>

            </div>

          </div>
        </>

      )}

      {/* =====================================================
          SUGERENCIAS DE CONTENIDO
          Hugo, Ursula y Marcos
      ===================================================== */}

      <ContentSuggestions
        refreshKey={refreshKey}
      />

      {/* =====================================================
          MODAL ACTIVIDAD NUEVA
      ===================================================== */}

      <CreateActivityModal
        isOpen={showCreateModal}
        onClose={() =>
          setShowCreateModal(false)
        }
        onSuccess={handleSuccess}
      />

      {/* =====================================================
          MODAL ACTIVIDADES FIJAS
      ===================================================== */}

      <FixedActivitiesModal
        isOpen={showFixedActivitiesModal}
        onClose={() =>
          setShowFixedActivitiesModal(false)
        }
        onSuccess={handleFixedActivitySuccess}
      />

    </div>
  )
}