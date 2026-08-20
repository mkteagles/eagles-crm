'use client'

import {
  ArrowRight,
  ClipboardList,
} from 'lucide-react'

export default function TallerRecentOrders() {
  return (
    <div className="
      overflow-hidden
      rounded-xl
      border
      border-gray-200
      bg-white
      dark:border-gray-800
      dark:bg-gray-900
    ">

      {/* HEADER */}
      <div className="
        flex
        items-center
        justify-between
        border-b
        border-gray-200
        px-5
        py-4
        dark:border-gray-800
      ">

        <div>
          <h2 className="
            text-base
            font-semibold
            text-gray-900
            dark:text-white
          ">
            Órdenes recientes
          </h2>

          <p className="
            mt-1
            text-sm
            text-gray-500
            dark:text-gray-400
          ">
            Últimas órdenes de trabajo
          </p>
        </div>

        <button
          type="button"
          className="
            inline-flex
            items-center
            gap-1
            text-sm
            font-medium
            text-orange-500
            transition
            hover:text-orange-600
          "
        >
          Ver todas

          <ArrowRight className="h-4 w-4" />
        </button>

      </div>

      {/* EMPTY STATE */}
      <div className="
        flex
        min-h-[300px]
        flex-col
        items-center
        justify-center
        px-5
        py-12
        text-center
      ">

        <div className="
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-full
          bg-orange-500/10
        ">
          <ClipboardList className="h-7 w-7 text-orange-500" />
        </div>

        <h3 className="
          mt-4
          text-sm
          font-semibold
          text-gray-900
          dark:text-white
        ">
          No hay órdenes todavía
        </h3>

        <p className="
          mt-1
          max-w-sm
          text-sm
          text-gray-500
          dark:text-gray-400
        ">
          Cuando registremos las primeras órdenes de trabajo,
          aparecerán aquí.
        </p>

        <button
          type="button"
          className="
            mt-5
            rounded-lg
            bg-orange-500
            px-4
            py-2
            text-sm
            font-semibold
            text-white
            transition
            hover:bg-orange-600
          "
        >
          Crear primera orden
        </button>

      </div>
    </div>
  )
}