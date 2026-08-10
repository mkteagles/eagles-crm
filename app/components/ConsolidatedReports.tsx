"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Copy,
  RefreshCw,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Lightbulb,
} from "lucide-react";

interface Profile {
  id: string;
  full_name: string | null;
  role: string;
}

interface Activity {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  due_date: string | null;
  result_notes: string | null;
  assigned_to: string;
  assigned_to_name?: string;
  updated_at?: string;
}

interface Suggestion {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  status: string;
  created_by: string;
  created_at: string;
}

interface DailyReport {
  id: string;
  user_id: string;
  report_date: string;
  report_content: string;
  updated_at?: string;
}

function getLocalDateString() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(dateString: string) {
  return new Date(
    `${dateString}T12:00:00`
  ).toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function statusLabel(status: string) {
  switch (status) {
    case "completed":
      return "Completada";

    case "in_progress":
      return "En progreso";

    case "pending":
      return "Pendiente";

    case "rejected":
      return "Rechazada";

    default:
      return status || "Sin estado";
  }
}

function suggestionStatusLabel(
  status: string
) {
  switch (status) {
    case "approved":
      return "Aprobada";

    case "rejected":
      return "Rechazada";

    case "pending":
      return "Pendiente";

    case "review":
      return "En revisión";

    case "published":
      return "Publicada";

    default:
      return status || "Sin estado";
  }
}

export default function ConsolidatedReports() {
  const supabase = createClient();

  const [profiles, setProfiles] = useState<
    Profile[]
  >([]);

  const [activities, setActivities] =
    useState<Activity[]>([]);

  const [suggestions, setSuggestions] =
    useState<Suggestion[]>([]);

  const [dailyReports, setDailyReports] =
    useState<DailyReport[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [copying, setCopying] =
    useState(false);

  const today = getLocalDateString();

  // =========================================================
  // CARGAR TODO
  // =========================================================

  const loadConsolidatedReport = async () => {
    setLoading(true);

    try {
      const [
        profilesResponse,
        activitiesResponse,
        suggestionsResponse,
        reportsResponse,
      ] = await Promise.all([
        supabase
          .from("user_profiles")
          .select(
            "id, full_name, role"
          )
          .in("role", [
            "executor",
            "admin",
          ]),

        supabase
          .from("activities")
          .select("*")
          .gte(
            "due_date",
            `${today}T00:00:00`
          )
          .lt(
            "due_date",
            `${today}T23:59:59`
          )
          .order("due_date", {
            ascending: true,
          }),

        supabase
          .from("content_suggestions")
          .select(
            `
              id,
              title,
              description,
              content_type,
              status,
              created_by,
              created_at
            `
          )
          .gte(
            "created_at",
            `${today}T00:00:00`
          )
          .lt(
            "created_at",
            `${today}T23:59:59`
          )
          .order("created_at", {
            ascending: true,
          }),

        supabase
          .from("daily_reports")
          .select("*")
          .eq(
            "report_date",
            today
          ),
      ]);

      if (profilesResponse.error) {
        console.error(
          "Error loading profiles:",
          profilesResponse.error
        );
      }

      if (activitiesResponse.error) {
        console.error(
          "Error loading activities:",
          activitiesResponse.error
        );
      }

      if (suggestionsResponse.error) {
        console.error(
          "Error loading suggestions:",
          suggestionsResponse.error
        );
      }

      if (reportsResponse.error) {
        console.error(
          "Error loading daily reports:",
          reportsResponse.error
        );
      }

      const loadedProfiles =
        profilesResponse.data || [];

      const profileMap = new Map(
        loadedProfiles.map((profile) => [
          profile.id,
          profile,
        ])
      );

      const loadedActivities = (
        activitiesResponse.data || []
      ).map((activity: any) => ({
        ...activity,
        assigned_to_name:
          profileMap.get(
            activity.assigned_to
          )?.full_name ||
          activity.assigned_to,
      }));

      setProfiles(
        loadedProfiles
      );

      setActivities(
        loadedActivities
      );

      setSuggestions(
        suggestionsResponse.data || []
      );

      setDailyReports(
        reportsResponse.data || []
      );
    } catch (error) {
      console.error(
        "Error loading consolidated report:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsolidatedReport();
  }, []);

  // =========================================================
  // SOLO EJECUTORES
  // =========================================================

  const executors = profiles.filter(
    (profile) =>
      profile.role === "executor"
  );

  // =========================================================
  // OBTENER ACTIVIDADES POR USUARIO
  // =========================================================

  const getUserActivities = (
    userId: string
  ) => {
    return activities.filter(
      (activity) =>
        activity.assigned_to === userId
    );
  };

  // =========================================================
  // OBTENER SUGERENCIAS POR USUARIO
  // =========================================================

  const getUserSuggestions = (
    userId: string
  ) => {
    return suggestions.filter(
      (suggestion) =>
        suggestion.created_by === userId
    );
  };

  // =========================================================
  // ESTADÍSTICAS
  // =========================================================

  const completedCount =
    activities.filter(
      (activity) =>
        activity.status === "completed"
    ).length;

  const inProgressCount =
    activities.filter(
      (activity) =>
        activity.status === "in_progress"
    ).length;

  const pendingCount =
    activities.filter(
      (activity) =>
        activity.status === "pending"
    ).length;

  const approvedSuggestions =
    suggestions.filter(
      (suggestion) =>
        suggestion.status === "approved"
    ).length;

  const pendingSuggestions =
    suggestions.filter(
      (suggestion) =>
        suggestion.status === "pending"
    ).length;

  const rejectedSuggestions =
    suggestions.filter(
      (suggestion) =>
        suggestion.status === "rejected"
    ).length;

  // =========================================================
  // CREAR TEXTO CONSOLIDADO
  // =========================================================

  const generateConsolidatedText =
    () => {
      const lines: string[] = [];

      lines.push(
        `REPORTE CONSOLIDADO - ${formatDate(
          today
        )}`
      );

      lines.push("");
      lines.push(
        "RESUMEN GENERAL"
      );
      lines.push(
        "═══════════════════════"
      );
      lines.push(
        `• Actividades completadas: ${completedCount}`
      );
      lines.push(
        `• Actividades en progreso: ${inProgressCount}`
      );
      lines.push(
        `• Actividades pendientes: ${pendingCount}`
      );
      lines.push(
        `• Total de actividades: ${activities.length}`
      );
      lines.push("");
      lines.push(
        `• Sugerencias aprobadas: ${approvedSuggestions}`
      );
      lines.push(
        `• Sugerencias pendientes: ${pendingSuggestions}`
      );
      lines.push(
        `• Sugerencias rechazadas: ${rejectedSuggestions}`
      );

      executors.forEach(
        (executor) => {
          const userActivities =
            getUserActivities(
              executor.id
            );

          const userSuggestions =
            getUserSuggestions(
              executor.id
            );

          lines.push("");
          lines.push(
            `👤 ${
              executor.full_name ||
              "Usuario"
            }`
          );
          lines.push(
            "═══════════════════════"
          );

          lines.push("");
          lines.push(
            "ACTIVIDADES"
          );

          if (
            userActivities.length === 0
          ) {
            lines.push(
              "No registró actividades."
            );
          } else {
            userActivities.forEach(
              (activity) => {
                lines.push(
                  `• ${
                    activity.status ===
                    "completed"
                      ? "✅"
                      : activity.status ===
                        "in_progress"
                      ? "🔵"
                      : activity.status ===
                        "pending"
                      ? "🟡"
                      : "🔴"
                  } ${
                    activity.title ||
                    "Sin título"
                  }`
                );

                lines.push(
                  `  Estado: ${statusLabel(
                    activity.status
                  )}`
                );

                if (
                  activity.priority
                ) {
                  lines.push(
                    `  Prioridad: ${activity.priority}`
                  );
                }

                if (
                  activity.result_notes
                ) {
                  lines.push(
                    `  Notas: ${activity.result_notes}`
                  );
                }
              }
            );
          }

          lines.push("");
          lines.push(
            "SUGERENCIAS DE CONTENIDO"
          );

          if (
            userSuggestions.length ===
            0
          ) {
            lines.push(
              "No registró sugerencias."
            );
          } else {
            userSuggestions.forEach(
              (suggestion) => {
                lines.push(
                  `• 💡 ${suggestion.title}`
                );

                lines.push(
                  `  Tipo: ${suggestion.content_type}`
                );

                lines.push(
                  `  Estado: ${suggestionStatusLabel(
                    suggestion.status
                  )}`
                );

                if (
                  suggestion.description
                ) {
                  lines.push(
                    `  Descripción: ${suggestion.description}`
                  );
                }
              }
            );
          }
        }
      );

      lines.push("");
      lines.push(
        "REPORTE GENERADO AUTOMÁTICAMENTE POR EAGLES GEAR CRM"
      );

      return lines.join("\n");
    };

  // =========================================================
  // COPIAR
  // =========================================================

  const copyReport = async () => {
    try {
      setCopying(true);

      await navigator.clipboard.writeText(
        generateConsolidatedText()
      );

      alert(
        "📋 Reporte consolidado copiado."
      );
    } catch (error) {
      console.error(
        "Error copying consolidated report:",
        error
      );

      alert(
        "No se pudo copiar el reporte."
      );
    } finally {
      setCopying(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-8 text-center">

        <RefreshCw
          size={24}
          className="mx-auto animate-spin text-blue-600 mb-3"
        />

        <p className="text-gray-500">
          Generando reporte consolidado...
        </p>

      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <FileText
              size={23}
              className="text-blue-600 dark:text-blue-400"
            />
          </div>

          <div>
            <h2 className="text-2xl font-bold">
              Reporte Consolidado
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(today)}
            </p>
          </div>

        </div>

        <div className="flex gap-2">

          <button
            type="button"
            onClick={loadConsolidatedReport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-semibold"
          >
            <RefreshCw size={17} />
            Actualizar
          </button>

          <button
            type="button"
            onClick={copyReport}
            disabled={copying}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
          >
            <Copy size={17} />
            {copying
              ? "Copiando..."
              : "Copiar reporte"}
          </button>

        </div>

      </div>

      {/* AUTOMÁTICO */}

      <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3">

        <CheckCircle2 size={18} />

        El reporte se construye automáticamente
        con las actividades y sugerencias del día.

      </div>

      {/* STATS */}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">

        <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">

          <CheckCircle2
            size={20}
            className="text-green-600 mb-2"
          />

          <p className="text-xs text-gray-500">
            Completadas
          </p>

          <p className="text-2xl font-bold text-green-600">
            {completedCount}
          </p>

        </div>

        <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">

          <Clock
            size={20}
            className="text-blue-600 mb-2"
          />

          <p className="text-xs text-gray-500">
            En progreso
          </p>

          <p className="text-2xl font-bold text-blue-600">
            {inProgressCount}
          </p>

        </div>

        <div className="bg-yellow-50 dark:bg-yellow-950/30 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">

          <AlertCircle
            size={20}
            className="text-yellow-600 mb-2"
          />

          <p className="text-xs text-gray-500">
            Pendientes
          </p>

          <p className="text-2xl font-bold text-yellow-600">
            {pendingCount}
          </p>

        </div>

        <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg border border-purple-200 dark:border-purple-800">

          <Lightbulb
            size={20}
            className="text-purple-600 mb-2"
          />

          <p className="text-xs text-gray-500">
            Sugerencias aprobadas
          </p>

          <p className="text-2xl font-bold text-purple-600">
            {approvedSuggestions}
          </p>

        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">

          <FileText
            size={20}
            className="text-gray-600 mb-2"
          />

          <p className="text-xs text-gray-500">
            Total actividades
          </p>

          <p className="text-2xl font-bold">
            {activities.length}
          </p>

        </div>

      </div>

      {/* REPORTES INDIVIDUALES */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {executors.map(
          (executor) => {
            const userActivities =
              getUserActivities(
                executor.id
              );

            const userSuggestions =
              getUserSuggestions(
                executor.id
              );

            const savedReport =
              dailyReports.find(
                (report) =>
                  report.user_id ===
                  executor.id
              );

            const completed =
              userActivities.filter(
                (activity) =>
                  activity.status ===
                  "completed"
              ).length;

            const progress =
              userActivities.filter(
                (activity) =>
                  activity.status ===
                  "in_progress"
              ).length;

            const pending =
              userActivities.filter(
                (activity) =>
                  activity.status ===
                  "pending"
              ).length;

            return (
              <div
                key={executor.id}
                className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 p-5"
              >

                <div className="flex items-center justify-between mb-4">

                  <div>
                    <h3 className="text-lg font-bold">
                      {executor.full_name ||
                        "Usuario"}
                    </h3>

                    <p className="text-xs text-gray-500">
                      Reporte individual
                    </p>
                  </div>

                  {savedReport && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle2 size={15} />
                      Guardado
                    </span>
                  )}

                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">

                  <div className="text-center bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
                    <p className="text-xs text-gray-500">
                      Completadas
                    </p>

                    <p className="font-bold text-green-600">
                      {completed}
                    </p>
                  </div>

                  <div className="text-center bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
                    <p className="text-xs text-gray-500">
                      En progreso
                    </p>

                    <p className="font-bold text-blue-600">
                      {progress}
                    </p>
                  </div>

                  <div className="text-center bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-3">
                    <p className="text-xs text-gray-500">
                      Pendientes
                    </p>

                    <p className="font-bold text-yellow-600">
                      {pending}
                    </p>
                  </div>

                </div>

                <div className="text-sm space-y-2">

                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Actividades
                    </span>

                    <strong>
                      {userActivities.length}
                    </strong>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Sugerencias
                    </span>

                    <strong>
                      {userSuggestions.length}
                    </strong>
                  </div>

                </div>

              </div>
            );
          }
        )}

      </div>

      {/* TEXTO COMPLETO */}

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800">

        <div className="p-5 border-b border-gray-200 dark:border-gray-800">

          <h3 className="font-bold text-lg">
            Reporte completo
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            Listo para copiar y compartir.
          </p>

        </div>

        <div className="p-5">

          <pre className="bg-gray-50 dark:bg-gray-800 rounded-lg p-5 text-sm whitespace-pre-wrap font-mono overflow-x-auto">
            {generateConsolidatedText()}
          </pre>

        </div>

      </div>

    </div>
  );
}