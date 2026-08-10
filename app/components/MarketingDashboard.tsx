'use client'

import { useCurrentUser, useActivities } from '@/lib/marketing-hooks'
import { useState } from 'react'
import ActivitiesTable from '@/components/ActivitiesTable'
import CreateActivityModal from '@/components/CreateActivityModal'
import FixedActivitiesModal from '@/components/FixedActivitiesModal'
import {
  Plus,
  Calendar,
  FileText,
  Loader,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'

export default function MarketingDashboard() {
  const { user, loading: userLoading } = useCurrentUser()
  const { activities, loading: activitiesLoading } = useActivities()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showFixedActivitiesModal, setShowFixedActivitiesModal] =
  useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1)
    setShowCreateModal(false)
  }
  const handleFixedActivitySuccess = () => {
  setRefreshKey(prev => prev + 1)
}

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader className="animate-spin" size={32} />
          <p className="text-foreground/60">Cargando datos...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-4">No autenticado</p>
          <Link href="/auth/login" className="bg-blue-600 text-white px-4 py-2 rounded">
            Ir al Login
          </Link>
        </div>
      </div>
    )
  }

  const stats = {
    total: activities.length,
    pending: activities.filter(a => a.status === 'pending').length,
    inProgress: activities.filter(a => a.status === 'in_progress').length,
    completed: activities.filter(a => a.status === 'completed').length,
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">🎯 Marketing - Actividades</h1>
        <p className="text-foreground/60">Bienvenido, <strong>{user.full_name}</strong> <span className="text-xs bg-foreground/10 px-2 py-1 rounded ml-2">{user.role}</span></p>
      </div>

      <div className="flex gap-3 flex-wrap">
      {user.role === 'admin' && (
  <>
    <button
      onClick={() => setShowCreateModal(true)}
      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold transition"
    >
      <Plus size={20} />
      Crear Actividad
    </button>

    <button
      onClick={() => setShowFixedActivitiesModal(true)}
      className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-semibold transition"
    >
      <Sparkles size={20} />
      Actividades Fijas
    </button>
  </>
)}

        <Link href="/app1/marketing/calendar" className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-semibold transition">
          <Calendar size={20} /> Calendario
        </Link>

        {user.role === 'executor' && (
          <Link href="/app1/marketing/reports" className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold transition">
            <FileText size={20} /> Generar Reporte
          </Link>
        )}

        {user.role === 'admin' && (
          <Link href="/app1/marketing/reports" className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 font-semibold transition">
            <FileText size={20} /> Reportes
          </Link>
        )}
      </div>

      {activitiesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin mr-2" size={24} />
          <p>Cargando actividades...</p>
        </div>
      ) : (
        <>
          <ActivitiesTable key={refreshKey} />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-surface rounded-lg p-4 shadow hover:shadow-lg transition">
              <p className="text-foreground/60 text-sm">Total</p>
              <p className="text-3xl font-bold text-blue-500">{stats.total}</p>
            </div>
            <div className="bg-surface rounded-lg p-4 shadow hover:shadow-lg transition">
              <p className="text-foreground/60 text-sm">Pendientes</p>
              <p className="text-3xl font-bold text-orange-500">{stats.pending}</p>
            </div>
            <div className="bg-surface rounded-lg p-4 shadow hover:shadow-lg transition">
              <p className="text-foreground/60 text-sm">En Progreso</p>
              <p className="text-3xl font-bold text-yellow-500">{stats.inProgress}</p>
            </div>
            <div className="bg-surface rounded-lg p-4 shadow hover:shadow-lg transition">
              <p className="text-foreground/60 text-sm">Completadas</p>
              <p className="text-3xl font-bold text-green-500">{stats.completed}</p>
            </div>
          </div>
        </>
      )}

      <CreateActivityModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleSuccess}
      />
      <FixedActivitiesModal
  isOpen={showFixedActivitiesModal}
  onClose={() => setShowFixedActivitiesModal(false)}
  onSuccess={handleFixedActivitySuccess}
/>
    </div>
  )
}