'use client'

import {
  ClipboardList,
  Clock3,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ComponentType<{
    className?: string
  }>
}

export default function TallerStats() {
  return (
    <div className="
      grid
      grid-cols-1
      gap-4
      sm:grid-cols-2
      xl:grid-cols-4
    ">

      <StatCard
        title="Órdenes abiertas"
        value="—"
        description="Pendientes de atención"
        icon={ClipboardList}
      />

      <StatCard
        title="En proceso"
        value="—"
        description="Trabajos actualmente activos"
        icon={Clock3}
      />

      <StatCard
        title="Listas"
        value="—"
        description="Órdenes terminadas"
        icon={CheckCircle2}
      />

      <StatCard
        title="Pendientes"
        value="—"
        description="Requieren seguimiento"
        icon={AlertCircle}
      />

    </div>
  )
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: StatCardProps) {
  return (
    <div className="
      rounded-xl
      border
      border-gray-200
      bg-white
      p-5
      dark:border-gray-800
      dark:bg-gray-900
    ">

      <div className="flex items-start justify-between">

        <div>
          <p className="
            text-sm
            font-medium
            text-gray-500
            dark:text-gray-400
          ">
            {title}
          </p>

          <p className="
            mt-2
            text-3xl
            font-bold
            tracking-tight
            text-gray-900
            dark:text-white
          ">
            {value}
          </p>
        </div>

        <div className="
          flex h-10 w-10
          items-center justify-center
          rounded-lg
          bg-orange-500/10
        ">
          <Icon className="h-5 w-5 text-orange-500" />
        </div>

      </div>

      <p className="
        mt-3
        text-xs
        text-gray-500
        dark:text-gray-400
      ">
        {description}
      </p>

    </div>
  )
}