'use client'

import { useState } from 'react'

import CalendarSelector, {
  CalendarType,
} from '@/components/CalendarSelector'

import CalendarActivities from '@/components/CalendarActivities'
import CalendarCreative from '@/components/CalendarCreative'
import CalendarConsolidated from '@/components/CalendarConsolidated'
import CalendarStrategy from '@/components/CalendarStrategy'
import CalendarMeetings from '@/components/CalendarMeetings'

export default function CalendarPage() {
  const [selectedCalendar, setSelectedCalendar] =
    useState<CalendarType>('consolidated')

  return (
    <div className="max-w-7xl mx-auto">

      {/* =========================================
          HEADER
      ========================================= */}

      <div className="mb-6">

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          📅 Calendario
        </h1>

        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Consulta y organiza la planeación del equipo.
        </p>

      </div>

      {/* =========================================
          SELECTOR DE CALENDARIOS
      ========================================= */}

      <CalendarSelector
        selected={selectedCalendar}
        onChange={(calendar) =>
          setSelectedCalendar(calendar)
        }
      />

      {/* =========================================
          CALENDARIO CONSOLIDADO
      ========================================= */}

      {selectedCalendar === 'consolidated' && (
        <CalendarConsolidated />
      )}

      {/* =========================================
          CALENDARIO DE ACTIVIDADES
      ========================================= */}

      {selectedCalendar === 'activities' && (
        <CalendarActivities />
      )}

      {/* =========================================
          CALENDARIO CREATIVO
      ========================================= */}

      {selectedCalendar === 'creative' && (
        <CalendarCreative />
      )}

      {/* =========================================
          CALENDARIO DE REUNIONES
      ========================================= */}

      {selectedCalendar === 'meetings' && (
        <CalendarMeetings />
      )}

      {/* =========================================
          CALENDARIO ESTRATEGIAS DE TRANSMISIONES
      ========================================= */}

      {selectedCalendar === 'transmissions' && (
        <CalendarStrategy
          type="transmissions"
          title="Estrategias de transmisiones"
          description="Planeación y seguimiento de las estrategias de transmisiones."
        />
      )}

      {/* =========================================
          CALENDARIO ESTRATEGIAS DIGITALES
      ========================================= */}

      {selectedCalendar === 'digital' && (
        <CalendarStrategy
          type="digital_courses"
          title="Estrategias digitales"
          description="Planeación de estrategias digitales para los cursos."
        />
      )}

    </div>
  )
}