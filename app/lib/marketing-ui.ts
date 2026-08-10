export const statusConfig = {
  pending: {
    label: 'Pendiente',
    badge: 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100',
    dot: 'bg-gray-500',
    bg: 'bg-gray-100 dark:bg-gray-800',
  },

  in_progress: {
    label: 'En progreso',
    badge: 'bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-100',
    dot: 'bg-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-950',
  },

  completed: {
    label: 'Completada',
    badge: 'bg-green-200 text-green-900 dark:bg-green-900 dark:text-green-100',
    dot: 'bg-green-500',
    bg: 'bg-green-100 dark:bg-green-950',
  },

  rejected: {
    label: 'Rechazada',
    badge: 'bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-100',
    dot: 'bg-red-500',
    bg: 'bg-red-100 dark:bg-red-950',
  },
} as const


export const priorityConfig = {
  low: {
    label: 'Baja',
    badge: 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100',
    bg: 'bg-slate-100 dark:bg-slate-800',
  },

  medium: {
    label: 'Media',
    badge: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100',
    bg: 'bg-yellow-100 dark:bg-yellow-950',
  },

  high: {
    label: 'Alta',
    badge: 'bg-orange-200 text-orange-900 dark:bg-orange-900 dark:text-orange-100',
    bg: 'bg-orange-100 dark:bg-orange-950',
  },
} as const


export const getStatusStyles = (status: string) => {
  const styles: Record<string, (typeof statusConfig)[keyof typeof statusConfig]> =
    statusConfig

  return styles[status as keyof typeof statusConfig] ?? statusConfig.pending
}


export const getPriorityStyles = (priority: string) => {
  const styles: Record<string, (typeof priorityConfig)[keyof typeof priorityConfig]> =
    priorityConfig

  return (
    styles[priority as keyof typeof priorityConfig] ??
    priorityConfig.low
  )
}