"use client";

import DailyReportGenerator from "@/components/DailyReportGenerator";
import ConsolidatedReports from "@/components/ConsolidatedReports";
import { useCurrentUser } from "@/lib/marketing-hooks";

export default function ReportsPage() {
  const { user, loading } =
    useCurrentUser();

  if (loading) {
    return (
      <div className="p-6">
        Cargando reportes...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        No se encontró el usuario.
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div>
        <h1 className="text-3xl font-bold">
          📊 Reportes
        </h1>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Reportes automáticos de Eagles Gear CRM
        </p>
      </div>

      {/* =====================================================
          EJECUTORES
      ===================================================== */}

      {user.role === "executor" && (
        <DailyReportGenerator />
      )}

      {/* =====================================================
          HUGO / ADMIN
      ===================================================== */}

      {user.role === "admin" && (
        <ConsolidatedReports />
      )}

      {/* =====================================================
          OTROS USUARIOS
      ===================================================== */}

      {user.role !== "executor" &&
        user.role !== "admin" && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-8 text-center">

            <p className="text-gray-500 dark:text-gray-400">
              No tienes acceso al módulo
              de reportes.
            </p>

          </div>
        )}

    </div>
  );
}