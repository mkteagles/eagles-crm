
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser, useActivities } from "@/lib/marketing-hooks";

export default function DailyReportGenerator() {
  const { user } = useCurrentUser();
  const { activities } = useActivities();

  const [reportContent, setReportContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const supabase = createClient();

  if (!user || user.role !== "executor") {
    return (
      <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-6">
        <p className="font-semibold text-red-700 dark:text-red-300">
          No tienes permisos para generar reportes.
        </p>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  const todayActivities = activities.filter((activity: any) => {
    const dueDate = activity?.due_date
      ? String(activity.due_date).split("T")[0]
      : "";

    const updatedAt = activity?.updated_at
      ? String(activity.updated_at).split("T")[0]
      : "";

    return dueDate === today || updatedAt === today;
  });

  const completedCount = todayActivities.filter(
    (activity: any) => activity.status === "completed"
  ).length;

  const pendingCount = todayActivities.filter(
    (activity: any) => activity.status === "pending"
  ).length;

  const inProgressCount = todayActivities.filter(
    (activity: any) => activity.status === "in_progress"
  ).length;

  const generateAutoReport = () => {
    const formattedDate = new Date().toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const activitiesText =
      todayActivities.length > 0
        ? todayActivities
            .map((activity: any) => {
              return `📋 ${activity.title || "Sin título"}
   Estado: ${activity.status || "Sin estado"}
   Prioridad: ${activity.priority || "Sin prioridad"}
   ${
     activity.result_notes
       ? `Notas: ${activity.result_notes}`
       : "Sin notas"
   }`;
            })
            .join("\n\n")
        : "No se registraron actividades durante el día.";

    const autoReport = `REPORTE DIARIO - ${formattedDate}

Reportado por: ${user.full_name || "Usuario"}

RESUMEN DE ACTIVIDADES
═══════════════════════
• Actividades Completadas: ${completedCount}
• Actividades en Progreso: ${inProgressCount}
• Actividades Pendientes: ${pendingCount}
• Total de actividades: ${todayActivities.length}

ACTIVIDADES DEL DÍA
═══════════════════════
${activitiesText}

PRÓXIMAS ACCIONES
═══════════════════════
[Escribe aquí las próximas acciones o comentarios adicionales]

Generado automáticamente por Eagles CRM`;

    setReportContent(autoReport);
  };

  const handleSaveReport = async () => {
    if (!reportContent.trim()) {
      alert("El reporte no puede estar vacío.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("daily_reports")
        .upsert([
          {
            user_id: user.id,
            report_date: today,
            report_content: reportContent,
            updated_at: new Date().toISOString(),
          },
        ]);

      if (error) {
        throw error;
      }

      alert("✅ Reporte guardado correctamente.");

      setReportContent("");
      setShowPreview(false);
    } catch (error) {
      console.error("Error saving report:", error);
      alert("❌ Error al guardar el reporte.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg shadow p-6">

      {/* ENCABEZADO */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">
          Generar Reporte Diario
        </h2>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Registra y guarda las actividades realizadas durante el día.
        </p>
      </div>

      {/* QUICK ACTIONS */}
      <div className="mb-6 flex gap-3 flex-wrap">

        <button
          type="button"
          onClick={generateAutoReport}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
        >
          🤖 Auto-generar desde actividades
        </button>

        <button
          type="button"
          onClick={() => setReportContent("")}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold transition"
        >
          🗑️ Limpiar
        </button>

      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">

        {/* COMPLETADAS */}
        <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Completadas Hoy
          </p>

          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {completedCount}
          </p>
        </div>

        {/* EN PROGRESO */}
        <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            En Progreso
          </p>

          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {inProgressCount}
          </p>
        </div>

        {/* PENDIENTES */}
        <div className="bg-yellow-50 dark:bg-yellow-950/30 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Pendientes
          </p>

          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {pendingCount}
          </p>
        </div>

      </div>

      {/* TEXT AREA */}
      <div className="mb-6">

        <label
          htmlFor="report-content"
          className="block text-sm font-semibold mb-2 text-gray-900 dark:text-gray-200"
        >
          Contenido del Reporte
        </label>

        <textarea
          id="report-content"
          value={reportContent}
          onChange={(event) => setReportContent(event.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400 dark:placeholder-gray-500 font-mono text-sm h-96 resize-y"
          placeholder="Escribe tu reporte aquí... o usa el botón Auto-generar."
        />

      </div>

      {/* BUTTONS */}
      <div className="flex gap-3 justify-end flex-wrap">

        <button
          type="button"
          onClick={() => setShowPreview(true)}
          disabled={!reportContent.trim()}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold transition disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
        >
          👁️ Vista Previa
        </button>

        <button
          type="button"
          onClick={handleSaveReport}
          disabled={loading || !reportContent.trim()}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
        >
          {loading ? "Guardando..." : "💾 Guardar Reporte"}
        </button>

      </div>

      {/* PREVIEW MODAL */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">

          <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-xl border border-gray-200 dark:border-gray-700">

            <div className="flex items-center justify-between mb-4">

              <h3 className="text-xl font-bold">
                Vista Previa del Reporte
              </h3>

              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white text-xl"
                aria-label="Cerrar"
              >
                ✕
              </button>

            </div>

            <pre className="bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 p-4 rounded-lg text-sm whitespace-pre-wrap font-mono overflow-x-auto">
              {reportContent}
            </pre>

            <div className="flex justify-end mt-4">

              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
              >
                Cerrar
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

