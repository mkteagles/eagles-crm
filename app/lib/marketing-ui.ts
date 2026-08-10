
export const statusConfig = {
  pending: {
    label: 'Pendiente',
    badge:
      'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100',
    dot: 'bg-gray-500',
    bg: 'bg-gray-100 dark:bg-gray-800',
  },

  in_progress: {
    label: 'En progreso',
    badge:
      'bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-100',
    dot: 'bg-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-950',
  },

  completed: {
    label: 'Completada',
    badge:
      'bg-green-200 text-green-900 dark:bg-green-900 dark:text-green-100',
    dot: 'bg-green-500',
    bg: 'bg-green-100 dark:bg-green-950',
  },

  rejected: {
    label: 'Rechazada',
    badge:
      'bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-100',
    dot: 'bg-red-500',
    bg: 'bg-red-100 dark:bg-red-950',
  },
} as const


export const priorityConfig = {
  low: {
    label: 'Baja',
    badge:
      'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100',
    bg: 'bg-slate-100 dark:bg-slate-800',
  },

  medium: {
    label: 'Media',
    badge:
      'bg-yellow-200 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100',
    bg: 'bg-yellow-100 dark:bg-yellow-950',
  },

  high: {
    label: 'Alta',
    badge:
      'bg-orange-200 text-orange-900 dark:bg-orange-900 dark:text-orange-100',
    bg: 'bg-orange-100 dark:bg-orange-950',
  },

  urgent: {
    label: 'Urgente',
    badge:
      'bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-100',
    bg: 'bg-red-100 dark:bg-red-950',
  },
} as const


// ------------------------------------
// STATUS
// ------------------------------------

export const getStatusStyles = (status: string) => {
  switch (status) {
    case 'pending':
      return statusConfig.pending

    case 'in_progress':
      return statusConfig.in_progress

    case 'completed':
      return statusConfig.completed

    case 'rejected':
      return statusConfig.rejected

    default:
      return statusConfig.pending
  }
}


// ------------------------------------
// PRIORITY
// ------------------------------------

export const getPriorityStyles = (priority: string) => {
  switch (priority) {
    case 'low':
      return priorityConfig.low

    case 'medium':
      return priorityConfig.medium

    case 'high':
      return priorityConfig.high

    case 'urgent':
      return priorityConfig.urgent

    default:
      return priorityConfig.low
  }
}

