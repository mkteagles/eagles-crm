
"use client";

import DailyReportGenerator from "@/components/DailyReportGenerator";
import { useCurrentUser } from "@/lib/marketing-hooks";

export default function ReportsPage() {
  const { user } = useCurrentUser();

  if (!user) {
    return (
      <div className="text-gray-700 dark:text-gray-300">
        Cargando...
      </div>
    );
  }

  return (
    <div className="text-gray-900 dark:text-white">
      <h1 className="text-3xl font-bold mb-6">
        📊 Reportes
      </h1>

      {user.role === "executor" && (
        <DailyReportGenerator />
      )}

      {user.role === "admin" && (
        <div className="bg-blue-50 dark:bg-blue-950/40 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-blue-800 dark:text-blue-300 font-semibold">
            👑 Reportes Consolidados
          </p>
        </div>
      )}
    </div>
  );
}

