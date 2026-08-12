'use client'

import {
  CalendarDays,
  ClipboardList,
  Palette,
} from 'lucide-react'

import CalendarActivities from './CalendarActivities'

export default function CalendarConsolidated() {
  return (
    <div className="space-y-6">

      {/* ENCABEZADO */}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">

            <CalendarDays
              size={21}
              className="text-indigo-600"
            />

          </div>

          <div>

            <h2 className="text-lg font-bold">
              Calendario consolidado
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Vista general de actividades y planeación creativa.
            </p>

          </div>

        </div>

        <div className="flex flex-wrap gap-3 mt-5">

          <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">
            <ClipboardList size={14} />
            Actividades
          </span>

          <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 text-purple-700 text-xs font-semibold">
            <Palette size={14} />
            Creativo
          </span>

        </div>

      </div>

      {/* CALENDARIO DE ACTIVIDADES */}

      <CalendarActivities />

    </div>
  )
}