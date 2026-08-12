'use client'

import { useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Palette,
  Users,
} from 'lucide-react'

interface CreativeActivity {
  id: number
  title: string
  date: string
}

const creativeActivities: CreativeActivity[] = [
  // ==============================
  // MARTES 11
  // ==============================

  {
    id: 1,
    title: 'Post-flyer',
    date: '2026-08-11',
  },
  {
    id: 2,
    title: 'Post de ventas',
    date: '2026-08-11',
  },
  {
    id: 3,
    title: 'Calentamiento',
    date: '2026-08-11',
  },
  {
    id: 4,
    title: 'Historias',
    date: '2026-08-11',
  },

  // ==============================
  // MIÉRCOLES 12
  // ==============================

  {
    id: 5,
    title: 'Carrusel',
    date: '2026-08-12',
  },
  {
    id: 6,
    title: 'Video de valor',
    date: '2026-08-12',
  },
  {
    id: 7,
    title: 'Calentamiento',
    date: '2026-08-12',
  },
  {
    id: 8,
    title: 'Historias',
    date: '2026-08-12',
  },
  {
    id: 9,
    title: 'Levantamiento de contenido',
    date: '2026-08-12',
  },

  // ==============================
  // JUEVES 13
  // ==============================

  {
    id: 10,
    title: 'Post-flyer',
    date: '2026-08-13',
  },
  {
    id: 11,
    title: 'Video tendencia',
    date: '2026-08-13',
  },
  {
    id: 12,
    title: 'Calentamiento',
    date: '2026-08-13',
  },
  {
    id: 13,
    title: 'Historias',
    date: '2026-08-13',
  },

  // ==============================
  // VIERNES 14
  // ==============================

  {
    id: 14,
    title: 'Post video viral / robot',
    date: '2026-08-14',
  },
  {
    id: 15,
    title: 'Post de ventas',
    date: '2026-08-14',
  },
  {
    id: 16,
    title: 'Calentamiento',
    date: '2026-08-14',
  },
  {
    id: 17,
    title: 'Historias',
    date: '2026-08-14',
  },

  // ==============================
  // SÁBADO 15
  // ==============================

  {
    id: 18,
    title: 'Evaluación',
    date: '2026-08-15',
  },
  {
    id: 19,
    title: 'Evaluación de contenido',
    date: '2026-08-15',
  },
  {
    id: 20,
    title: 'Calentamiento',
    date: '2026-08-15',
  },
  {
    id: 21,
    title: 'Historias',
    date: '2026-08-15',
  },

  // ==============================
  // LUNES 17
  // ==============================

  {
    id: 22,
    title: 'Carrusel',
    date: '2026-08-17',
  },
  {
    id: 23,
    title: 'Video tendencia',
    date: '2026-08-17',
  },
  {
    id: 24,
    title: 'Calentamiento',
    date: '2026-08-17',
  },
  {
    id: 25,
    title: 'Historias',
    date: '2026-08-17',
  },

  // ==============================
  // MARTES 18
  // ==============================

  {
    id: 26,
    title: 'Post-flyer',
    date: '2026-08-18',
  },
  {
    id: 27,
    title: 'Post de ventas',
    date: '2026-08-18',
  },
  {
    id: 28,
    title: 'Calentamiento',
    date: '2026-08-18',
  },
  {
    id: 29,
    title: 'Historias',
    date: '2026-08-18',
  },

  // ==============================
  // MIÉRCOLES 19
  // ==============================

  {
    id: 30,
    title: 'Carrusel',
    date: '2026-08-19',
  },
  {
    id: 31,
    title: 'Video de valor',
    date: '2026-08-19',
  },
  {
    id: 32,
    title: 'Calentamiento',
    date: '2026-08-19',
  },
  {
    id: 33,
    title: 'Historias',
    date: '2026-08-19',
  },
  {
    id: 34,
    title: 'Levantamiento de contenido',
    date: '2026-08-19',
  },

  // ==============================
  // JUEVES 20
  // ==============================

  {
    id: 35,
    title: 'Post-flyer',
    date: '2026-08-20',
  },
  {
    id: 36,
    title: 'Video tendencia',
    date: '2026-08-20',
  },
  {
    id: 37,
    title: 'Calentamiento',
    date: '2026-08-20',
  },
  {
    id: 38,
    title: 'Historias',
    date: '2026-08-20',
  },

  // ==============================
  // VIERNES 21
  // ==============================

  {
    id: 39,
    title: 'Post video viral / robot',
    date: '2026-08-21',
  },
  {
    id: 40,
    title: 'Post de ventas',
    date: '2026-08-21',
  },
  {
    id: 41,
    title: 'Calentamiento',
    date: '2026-08-21',
  },
  {
    id: 42,
    title: 'Historias',
    date: '2026-08-21',
  },

  // ==============================
  // SÁBADO 22
  // ==============================

  {
    id: 43,
    title: 'Evaluación',
    date: '2026-08-22',
  },
  {
    id: 44,
    title: 'Evaluación de contenido',
    date: '2026-08-22',
  },
  {
    id: 45,
    title: 'Calentamiento',
    date: '2026-08-22',
  },
  {
    id: 46,
    title: 'Historias',
    date: '2026-08-22',
  },

  // ==============================
  // LUNES 24
  // ==============================

  {
    id: 47,
    title: 'Carrusel',
    date: '2026-08-24',
  },
  {
    id: 48,
    title: 'Video tendencia',
    date: '2026-08-24',
  },
  {
    id: 49,
    title: 'Calentamiento',
    date: '2026-08-24',
  },
  {
    id: 50,
    title: 'Historias',
    date: '2026-08-24',
  },

  // ==============================
  // MARTES 25
  // ==============================

  {
    id: 51,
    title: 'Post-flyer',
    date: '2026-08-25',
  },
  {
    id: 52,
    title: 'Post de ventas',
    date: '2026-08-25',
  },
  {
    id: 53,
    title: 'Calentamiento',
    date: '2026-08-25',
  },
  {
    id: 54,
    title: 'Historias',
    date: '2026-08-25',
  },

  // ==============================
  // MIÉRCOLES 26
  // ==============================

  {
    id: 55,
    title: 'Carrusel',
    date: '2026-08-26',
  },
  {
    id: 56,
    title: 'Video de valor',
    date: '2026-08-26',
  },
  {
    id: 57,
    title: 'Calentamiento',
    date: '2026-08-26',
  },
  {
    id: 58,
    title: 'Historias',
    date: '2026-08-26',
  },
  {
    id: 59,
    title: 'Levantamiento de contenido',
    date: '2026-08-26',
  },

  // ==============================
  // JUEVES 27
  // ==============================

  {
    id: 60,
    title: 'Post-flyer',
    date: '2026-08-27',
  },
  {
    id: 61,
    title: 'Video tendencia',
    date: '2026-08-27',
  },
  {
    id: 62,
    title: 'Calentamiento',
    date: '2026-08-27',
  },
  {
    id: 63,
    title: 'Historias',
    date: '2026-08-27',
  },

  // ==============================
  // VIERNES 28
  // ==============================

  {
    id: 64,
    title: 'Post video viral / robot',
    date: '2026-08-28',
  },
  {
    id: 65,
    title: 'Post de ventas',
    date: '2026-08-28',
  },
  {
    id: 66,
    title: 'Calentamiento',
    date: '2026-08-28',
  },
  {
    id: 67,
    title: 'Historias',
    date: '2026-08-28',
  },

  // ==============================
  // SÁBADO 29
  // ==============================

  {
    id: 68,
    title: 'Evaluación',
    date: '2026-08-29',
  },
  {
    id: 69,
    title: 'Evaluación de contenido',
    date: '2026-08-29',
  },
  {
    id: 70,
    title: 'Calentamiento',
    date: '2026-08-29',
  },
  {
    id: 71,
    title: 'Historias',
    date: '2026-08-29',
  },

  // ==============================
  // LUNES 31
  // ==============================

  {
    id: 72,
    title: 'Carrusel',
    date: '2026-08-31',
  },
  {
    id: 73,
    title: 'Video tendencia',
    date: '2026-08-31',
  },
  {
    id: 74,
    title: 'Calentamiento',
    date: '2026-08-31',
  },
  {
    id: 75,
    title: 'Historias',
    date: '2026-08-31',
  },
]

function getDaysInMonth(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  ).getDate()
}

function getFirstDayOfMonth(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  ).getDay()
}

export default function CalendarCreative() {
  const [currentDate, setCurrentDate] = useState(
    new Date(2026, 7, 1)
  )

  const days = useMemo(() => {
    const result: Array<number | null> = []

    const firstDay = getFirstDayOfMonth(
      currentDate
    )

    const daysInMonth = getDaysInMonth(
      currentDate
    )

    for (let i = 0; i < firstDay; i++) {
      result.push(null)
    }

    for (let i = 1; i <= daysInMonth; i++) {
      result.push(i)
    }

    return result
  }, [currentDate])

  const groupedActivities = useMemo(() => {
    const grouped: Record<
      string,
      CreativeActivity[]
    > = {}

    creativeActivities.forEach((activity) => {
      if (!grouped[activity.date]) {
        grouped[activity.date] = []
      }

      grouped[activity.date].push(activity)
    })

    return grouped
  }, [])

  return (
    <div className="space-y-6">

      {/* =========================================
          ENCABEZADO
      ========================================= */}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div className="flex items-center gap-4">

            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">

              <Palette
                size={24}
                className="text-purple-600"
              />

            </div>

            <div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Calendario creativo
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Planeación de contenido y actividades creativas.
              </p>

            </div>

          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">

            <Users size={16} />

            Hugo · Úrsula · Marcos · Chuy

          </div>

        </div>

      </div>

      {/* =========================================
          CALENDARIO
      ========================================= */}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">

        {/* NAVEGACIÓN */}

        <div className="flex items-center justify-between mb-6">

          <button
            type="button"
            onClick={() =>
              setCurrentDate(
                new Date(
                  currentDate.getFullYear(),
                  currentDate.getMonth() - 1,
                  1
                )
              )
            }
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <ChevronLeft size={20} />
          </button>

          <h3 className="text-lg font-bold capitalize">
            {currentDate.toLocaleDateString(
              'es-MX',
              {
                month: 'long',
                year: 'numeric',
              }
            )}
          </h3>

          <button
            type="button"
            onClick={() =>
              setCurrentDate(
                new Date(
                  currentDate.getFullYear(),
                  currentDate.getMonth() + 1,
                  1
                )
              )
            }
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <ChevronRight size={20} />
          </button>

        </div>

        {/* DÍAS */}

        <div className="grid grid-cols-7 gap-2 mb-2">

          {[
            'Dom',
            'Lun',
            'Mar',
            'Mié',
            'Jue',
            'Vie',
            'Sáb',
          ].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-gray-500 dark:text-gray-400 py-2"
            >
              {day}
            </div>
          ))}

        </div>

        {/* CALENDARIO */}

        <div className="grid grid-cols-7 gap-2">

          {days.map((day, index) => {

            if (day === null) {
              return (
                <div
                  key={index}
                  className="min-h-[130px]"
                />
              )
            }

            const year =
              currentDate.getFullYear()

            const month = String(
              currentDate.getMonth() + 1
            ).padStart(2, '0')

            const dayNumber = String(
              day
            ).padStart(2, '0')

            const dateStr =
              `${year}-${month}-${dayNumber}`

            const activities =
              groupedActivities[dateStr] || []

            return (
              <div
                key={dateStr}
                className="min-h-[130px] border border-gray-200 dark:border-gray-700 rounded-xl p-2 bg-gray-50 dark:bg-gray-800"
              >

                <div className="flex items-center justify-between mb-2">

                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {day}
                  </span>

                  {activities.length > 0 && (
                    <CalendarDays
                      size={14}
                      className="text-purple-500"
                    />
                  )}

                </div>

                <div className="space-y-1.5">

                  {activities.map(
                    (activity) => (
                      <div
                        key={activity.id}
                        className="text-xs font-medium px-2 py-1.5 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200"
                      >
                        {activity.title}
                      </div>
                    )
                  )}

                </div>

              </div>
            )
          })}

        </div>

      </div>

      {/* =========================================
          NOTA
      ========================================= */}

      <div className="rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/20 p-4">

        <p className="text-sm text-purple-800 dark:text-purple-300">

          <strong>Planeación creativa:</strong>{' '}
          este calendario contiene la programación creativa de agosto.
          Por ahora la planeación es fija y posteriormente podrá
          gestionarse desde el sistema.

        </p>

      </div>

    </div>
  )
}