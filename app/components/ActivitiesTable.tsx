'use client'

import { useActivities, useCurrentUser } from '@/lib/marketing-hooks'
import { createClient } from '@/lib/supabase/client'
import { Activity, ActivityStatus } from '@/lib/marketing-types'
import { statusConfig, priorityConfig } from '@/lib/marketing-ui'
import { Eye } from 'lucide-react'
import { useState } from 'react'
import ActivityDetailModal from './ActivityDetailModal'

export default function ActivitiesTable() {
  const { activities, loading } = useActivities()
  const { user } = useCurrentUser()
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null)
  const supabase = createClient()

  const handleStatusChange = async (activityId: number, newStatus: ActivityStatus) => {
    await supabase
      .from('activities')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', activityId)
  }

  if (loading) return <div className="p-4 text-center">Cargando actividades...</div>
  if (activities.length === 0) return <div className="p-4 text-center text-foreground/50">Sin actividades</div>

  return (
    <div className="bg-surface rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-foreground/5 border-b border-border-color">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Actividad</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Asignado a</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Vencimiento</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Prioridad</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Estado</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity: any) => (
              <tr key={activity.id} className="border-b border-border-color hover:bg-foreground/5">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-semibold text-sm">{activity.title}</p>
                    <p className="text-foreground/60 text-xs truncate">{activity.description}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">{activity.assigned_to_name || activity.assigned_to}</td>
                <td className="px-4 py-3 text-sm">{activity.due_date}</td>
                <td className={`px-4 py-3 text-sm font-semibold ${priorityConfig[activity.priority as keyof typeof priorityConfig].className}`}>
                  {priorityConfig[activity.priority as keyof typeof priorityConfig].label}
                </td>
                <td className="px-4 py-3">
                  {user?.role === 'executor' && activity.assigned_to === user.id ? (
                    <select
                      value={activity.status}
                      onChange={(e) => handleStatusChange(activity.id, e.target.value as ActivityStatus)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer ${statusConfig[activity.status as ActivityStatus].badge}`}
                    >
                      <option value="pending">Pendiente</option>
                      <option value="in_progress">En progreso</option>
                      <option value="completed">Completada</option>
                    </select>
                  ) : (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig[activity.status as ActivityStatus].badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[activity.status as ActivityStatus].dot}`} />
                      {statusConfig[activity.status as ActivityStatus].label}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => setSelectedActivity(activity)}
                    className="text-blue-500 hover:text-blue-400 text-sm font-semibold flex items-center justify-center gap-1 mx-auto"
                  >
                    <Eye size={16} /> Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedActivity && (
        <ActivityDetailModal
          activity={selectedActivity}
          currentUserRole={user?.role}
          currentUserId={user?.id}
          onClose={() => setSelectedActivity(null)}
        />
      )}
    </div>
  )
}
