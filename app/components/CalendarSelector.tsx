'use client'

import {
  LayoutDashboard,
  ClipboardList,
  Palette,
  Radio,
  Monitor,
} from 'lucide-react'

export type CalendarType =
  | 'consolidated'
  | 'activities'
  | 'creative'
  | 'transmissions'
  | 'digital'

interface CalendarSelectorProps {
  selected: CalendarType
  onChange: (calendar: CalendarType) => void
}

const calendars = [
  {
    id: 'consolidated' as CalendarType,
    label: 'Consolidado',
    icon: LayoutDashboard,
  },
  {
    id: 'activities' as CalendarType,
    label: 'Actividades',
    icon: ClipboardList,
  },
  {
    id: 'creative' as CalendarType,
    label: 'Creativo',
    icon: Palette,
  },
  {
    id: 'transmissions' as CalendarType,
    label: 'Transmisiones',
    icon: Radio,
  },
  {
    id: 'digital' as CalendarType,
    label: 'Estrategias digitales',
    icon: Monitor,
  },
]

export default function CalendarSelector({
  selected,
  onChange,
}: CalendarSelectorProps) {
  return (
    <div className="mb-6">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-2 shadow-sm">
        <div className="flex flex-wrap gap-2">

          {calendars.map((calendar) => {
            const Icon = calendar.icon
            const active = selected === calendar.id

            return (
              <button
                key={calendar.id}
                type="button"
                onClick={() => onChange(calendar.id)}
                className={`
                  flex items-center gap-2
                  px-4 py-2.5
                  rounded-xl
                  text-sm font-semibold
                  transition
                  ${
                    active
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
              >
                <Icon size={17} />

                {calendar.label}
              </button>
            )
          })}

        </div>
      </div>
    </div>
  )
}