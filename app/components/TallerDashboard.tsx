"use client";

import {
  Wrench,
  ClipboardList,
  Users,
  Car,
  Clock3,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

interface TallerDashboardProps {
  accessLevel: string;
  userId: string;
  userEmail: string;
}

export default function TallerDashboard({
  accessLevel,
  userId,
  userEmail,
}: TallerDashboardProps) {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-10">

          <div className="flex items-center gap-3 mb-3">

            <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">

              <Wrench
                size={25}
                className="text-orange-600 dark:text-orange-400"
              />

            </div>

            <div>

              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                OPERACIÓN
              </p>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Taller
              </h1>

            </div>

          </div>

          <p className="text-gray-500 dark:text-gray-400 mt-3">
            Gestión de órdenes de trabajo, clientes y vehículos.
          </p>

        </div>

        {/* =====================================================
            INFO USUARIO
        ===================================================== */}

        <div className="mb-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4">

          <div className="flex items-center justify-between gap-4">

            <div>

              <p className="text-xs uppercase tracking-wide text-gray-400">
                Usuario
              </p>

              <p className="font-semibold text-gray-900 dark:text-white">
                {userEmail}
              </p>

            </div>

            <div className="px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm font-semibold">
              {accessLevel}
            </div>

          </div>

        </div>

        {/* =====================================================
            ESTADÍSTICAS
        ===================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          {/* ÓRDENES */}

          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">

            <div className="flex items-center justify-between">

              <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">

                <ClipboardList
                  size={22}
                  className="text-blue-600 dark:text-blue-400"
                />

              </div>

              <span className="text-xs font-medium text-gray-400">
                TOTAL
              </span>

            </div>

            <p className="mt-5 text-3xl font-bold text-gray-900 dark:text-white">
              0
            </p>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Órdenes de trabajo
            </p>

          </div>

          {/* EN PROCESO */}

          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">

            <div className="flex items-center justify-between">

              <div className="w-11 h-11 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">

                <Clock3
                  size={22}
                  className="text-yellow-600 dark:text-yellow-400"
                />

              </div>

              <span className="text-xs font-medium text-gray-400">
                ACTIVAS
              </span>

            </div>

            <p className="mt-5 text-3xl font-bold text-gray-900 dark:text-white">
              0
            </p>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              En proceso
            </p>

          </div>

          {/* CLIENTES */}

          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">

            <div className="flex items-center justify-between">

              <div className="w-11 h-11 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">

                <Users
                  size={22}
                  className="text-green-600 dark:text-green-400"
                />

              </div>

              <span className="text-xs font-medium text-gray-400">
                CLIENTES
              </span>

            </div>

            <p className="mt-5 text-3xl font-bold text-gray-900 dark:text-white">
              0
            </p>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Clientes registrados
            </p>

          </div>

          {/* VEHÍCULOS */}

          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">

            <div className="flex items-center justify-between">

              <div className="w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">

                <Car
                  size={22}
                  className="text-purple-600 dark:text-purple-400"
                />

              </div>

              <span className="text-xs font-medium text-gray-400">
                VEHÍCULOS
              </span>

            </div>

            <p className="mt-5 text-3xl font-bold text-gray-900 dark:text-white">
              0
            </p>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Vehículos registrados
            </p>

          </div>

        </div>

        {/* =====================================================
            ACCIONES
        ===================================================== */}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">

          <button
            type="button"
            className="group text-left rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-all"
          >

            <div className="flex items-center justify-between">

              <div className="w-11 h-11 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">

                <Wrench
                  size={22}
                  className="text-orange-600 dark:text-orange-400"
                />

              </div>

              <ArrowRight
                size={20}
                className="text-gray-400 group-hover:translate-x-1 transition-transform"
              />

            </div>

            <h2 className="mt-5 font-bold text-lg text-gray-900 dark:text-white">
              Nueva orden de trabajo
            </h2>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Registra una nueva entrada al taller.
            </p>

          </button>

          <button
            type="button"
            className="group text-left rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-all"
          >

            <div className="flex items-center justify-between">

              <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">

                <ClipboardList
                  size={22}
                  className="text-blue-600 dark:text-blue-400"
                />

              </div>

              <ArrowRight
                size={20}
                className="text-gray-400 group-hover:translate-x-1 transition-transform"
              />

            </div>

            <h2 className="mt-5 font-bold text-lg text-gray-900 dark:text-white">
              Órdenes de trabajo
            </h2>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Consulta y administra las órdenes existentes.
            </p>

          </button>

          <button
            type="button"
            className="group text-left rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-all"
          >

            <div className="flex items-center justify-between">

              <div className="w-11 h-11 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">

                <CheckCircle2
                  size={22}
                  className="text-green-600 dark:text-green-400"
                />

              </div>

              <ArrowRight
                size={20}
                className="text-gray-400 group-hover:translate-x-1 transition-transform"
              />

            </div>

            <h2 className="mt-5 font-bold text-lg text-gray-900 dark:text-white">
              Operación
            </h2>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Seguimiento del trabajo realizado en el taller.
            </p>

          </button>

        </div>

      </div>
    </main>
  );
}