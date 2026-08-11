
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

// =======================================================
// TIPOS
// =======================================================

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

// =======================================================
// FECHA LOCAL
// =======================================================

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

// =======================================================
// FORMATEAR FECHA
// =======================================================

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

// =======================================================
// STATUS ACTIVIDADES
// =======================================================

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

// =======================================================
// STATUS SUGERENCIAS
// =======================================================

function suggestionStatusLabel(status: string) {
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

// =======================================================
// COMPONENTE
// =======================================================

export default function ConsolidatedReports() {
  const supabase = createClient();

  const [profiles, setProfiles] = useState<Profile[]>([]);

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

  const today =
    getLocalDateString();

  // =====================================================
  // CARGAR DATOS
  // =====================================================

  const loadConsolidatedReport =
    async () => {
      setLoading(true);

      try {
        const [
          profilesResponse,
          activitiesResponse,
          suggestionsResponse,
          reportsResponse,
        ] = await Promise.all([
          // -----------------------------------------------
          // USUARIOS
          // -----------------------------------------------

          supabase
            .from("user_profiles")
            .select(
              "id, full_name, role"
            )
            .in("role", [
              "executor",
              "admin",
            ]),

          // -----------------------------------------------
          // ACTIVIDADES DEL DÍA
          // -----------------------------------------------

          supabase
            .from("activities")
            .select("*")
            .eq(
              "due_date",
              today
            )
            .order(
              "due_date",
              {
                ascending: true,
              }
            ),

          // -----------------------------------------------
          // SUGERENCIAS DEL DÍA
          // -----------------------------------------------

          supabase
            .from(
              "content_suggestions"
            )
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
            .order(
              "created_at",
              {
                ascending: true,
              }
            ),

          // -----------------------------------------------
          // REPORTES DIARIOS
          // -----------------------------------------------

          supabase
            .from("daily_reports")
            .select("*")
            .eq(
              "report_date",
              today
            ),
        ]);

        // =================================================
        // ERRORES
        // =================================================

        if (
          profilesResponse.error
        ) {
          console.error(
            "Error loading profiles:",
            profilesResponse.error
          );
        }

        if (
          activitiesResponse.error
        ) {
          console.error(
            "Error loading activities:",
            activitiesResponse.error
          );
        }

        if (
          suggestionsResponse.error
        ) {
          console.error(
            "Error loading suggestions:",
            suggestionsResponse.error
          );
        }

        if (
          reportsResponse.error
        ) {
          console.error(
            "Error loading daily reports:",
            reportsResponse.error
          );
        }

        // =================================================
        // PROFILES
        // =================================================

        const loadedProfiles =
          profilesResponse.data || [];

        const profileMap =
          new Map(
            loadedProfiles.map(
              (profile) => [
                profile.id,
                profile,
              ]
            )
          );

        // =================================================
        // ACTIVIDADES
        // =================================================

        const loadedActivities =
          (
            activitiesResponse.data ||
            []
          ).map(
            (activity: any) => ({
              ...activity,

              assigned_to_name:
                profileMap.get(
                  activity.assigned_to
                )?.full_name ||
                activity.assigned_to,
            })
          );

        // =================================================
        // GUARDAR ESTADO
        // =================================================

        setProfiles(
          loadedProfiles
        );

        setActivities(
          loadedActivities
        );

        setSuggestions(
          suggestionsResponse.data ||
            []
        );

        setDailyReports(
          reportsResponse.data ||
            []
        );

        // =================================================
        // DEBUG
        // =================================================

        console.log(
          "📊 REPORTE CONSOLIDADO",
          {
            fecha: today,

            perfiles:
              loadedProfiles.length,

            actividades:
              loadedActivities.length,

            sugerencias:
              suggestionsResponse.data
                ?.length || 0,

            reportes:
              reportsResponse.data
                ?.length || 0,
          }
        );

        console.log(
          "📋 Reportes diarios:",
          reportsResponse.data
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

  // =====================================================
  // CARGA INICIAL
  // =====================================================

  useEffect(() => {
    loadConsolidatedReport();
  }, []);

  // =====================================================
  // SOLO EJECUTORES
  // =====================================================

  const executors =
    profiles.filter(
      (profile) =>
        profile.role === "executor"
    );

  // =====================================================
  // ACTIVIDADES POR USUARIO
  // =====================================================

  const getUserActivities = (
    userId: string
  ) => {
    return activities.filter(
      (activity) =>
        activity.assigned_to ===
        userId
    );
  };

  // =====================================================
  // SUGERENCIAS POR USUARIO
  // =====================================================

  const getUserSuggestions = (
    userId: string
  ) => {
    return suggestions.filter(
      (suggestion) =>
        suggestion.created_by ===
        userId
    );
  };

  // =====================================================
  // REPORTE GUARDADO POR USUARIO
  // =====================================================

  const getUserDailyReport = (
    userId: string
  ) => {
    return dailyReports.find(
      (report) =>
        report.user_id ===
        userId
    );
  };

  // =====================================================
  // ESTADÍSTICAS GENERALES
  // =====================================================

  const completedCount =
    activities.filter(
      (activity) =>
        activity.status ===
        "completed"
    ).length;

  const inProgressCount =
    activities.filter(
      (activity) =>
        activity.status ===
        "in_progress"
    ).length;

  const pendingCount =
    activities.filter(
      (activity) =>
        activity.status ===
        "pending"
    ).length;

  const approvedSuggestions =
    suggestions.filter(
      (suggestion) =>
        suggestion.status ===
        "approved"
    ).length;

  const pendingSuggestions =
    suggestions.filter(
      (suggestion) =>
        suggestion.status ===
        "pending"
    ).length;

  const rejectedSuggestions =
    suggestions.filter(
      (suggestion) =>
        suggestion.status ===
        "rejected"
    ).length;

  // =====================================================
  // GENERAR REPORTE CONSOLIDADO
  //
  // REPORTE EJECUTIVO:
  // - No incluye reportes diarios completos.
  // - No incluye prioridad.
  // - No incluye fechas repetidas.
  // - Muestra actividades completadas.
  // - Muestra actividades en progreso.
  // - De pendientes solo muestra las primeras 5.
  // =====================================================

  const generateConsolidatedText =
    () => {
      const lines: string[] = [];

      // =================================================
      // ENCABEZADO
      // =================================================

      lines.push(
        `REPORTE CONSOLIDADO — ${formatDate(
          today
        )}`
      );

      lines.push("");

      // =================================================
      // RESUMEN GENERAL
      // =================================================

      lines.push(
        "RESUMEN GENERAL"
      );

      lines.push(
        "━━━━━━━━━━━━━━━━━━━━"
      );

      lines.push(
        `• Total de actividades: ${activities.length}`
      );

      lines.push(
        `• ✅ Completadas: ${completedCount}`
      );

      lines.push(
        `• 🔵 En progreso: ${inProgressCount}`
      );

      lines.push(
        `• 🟡 Pendientes: ${pendingCount}`
      );

      // =================================================
      // SUGERENCIAS
      // =================================================

      if (
        suggestions.length > 0
      ) {
        lines.push("");

        lines.push(
          `💡 Sugerencias: ${suggestions.length}`
        );

        lines.push(
          `• Aprobadas: ${approvedSuggestions}`
        );

        lines.push(
          `• Pendientes: ${pendingSuggestions}`
        );

        lines.push(
          `• Rechazadas: ${rejectedSuggestions}`
        );
      }

      // =================================================
      // REPORTES POR PERSONA
      // =================================================

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

          const completed =
            userActivities.filter(
              (activity) =>
                activity.status ===
                "completed"
            );

          const progress =
            userActivities.filter(
              (activity) =>
                activity.status ===
                "in_progress"
            );

          const pending =
            userActivities.filter(
              (activity) =>
                activity.status ===
                "pending"
            );

          const rejected =
            userActivities.filter(
              (activity) =>
                activity.status ===
                "rejected"
            );

          // =============================================
          // USUARIO
          // =============================================

          lines.push("");

          lines.push(
            `👤 ${(
              executor.full_name ||
              "Usuario"
            ).toUpperCase()}`
          );

          lines.push(
            "━━━━━━━━━━━━━━━━━━━━"
          );

          // =============================================
          // RESUMEN USUARIO
          // =============================================

          const userSummary =
            [
              `${userActivities.length} actividades`,
              completed.length > 0
                ? `${completed.length} completadas`
                : null,
              progress.length > 0
                ? `${progress.length} en progreso`
                : null,
              pending.length > 0
                ? `${pending.length} pendientes`
                : null,
              rejected.length > 0
                ? `${rejected.length} rechazadas`
                : null,
            ]
              .filter(Boolean)
              .join(" · ");

          lines.push(
            userSummary ||
              "Sin actividades registradas."
          );

          // =============================================
          // COMPLETADAS
          // =============================================

          if (
            completed.length > 0
          ) {
            lines.push("");

            lines.push(
              "✅ COMPLETADAS"
            );

            completed.forEach(
              (activity) => {
                lines.push(
                  `• ${
                    activity.title ||
                    "Sin título"
                  }`
                );
              }
            );
          }

          // =============================================
          // EN PROGRESO
          // =============================================

          if (
            progress.length > 0
          ) {
            lines.push("");

            lines.push(
              "🔵 EN PROGRESO"
            );

            progress.forEach(
              (activity) => {
                lines.push(
                  `• ${
                    activity.title ||
                    "Sin título"
                  }`
                );
              }
            );
          }

          // =============================================
          // PENDIENTES
          // =============================================

          if (
            pending.length > 0
          ) {
            lines.push("");

            lines.push(
              `🟡 PENDIENTES — ${pending.length}`
            );

            // Solo mostramos las primeras 5
            const pendingPreview =
              pending.slice(0, 5);

            pendingPreview.forEach(
              (activity) => {
                lines.push(
                  `• ${
                    activity.title ||
                    "Sin título"
                  }`
                );
              }
            );

            const remaining =
              pending.length -
              pendingPreview.length;

            if (
              remaining > 0
            ) {
              lines.push(
                `• ... y ${remaining} más`
              );
            }
          }

          // =============================================
          // RECHAZADAS
          // =============================================

          if (
            rejected.length > 0
          ) {
            lines.push("");

            lines.push(
              `🔴 RECHAZADAS — ${rejected.length}`
            );

            rejected
              .slice(0, 5)
              .forEach(
                (activity) => {
                  lines.push(
                    `• ${
                      activity.title ||
                      "Sin título"
                    }`
                  );
                }
              );

            if (
              rejected.length > 5
            ) {
              lines.push(
                `• ... y ${
                  rejected.length - 5
                } más`
              );
            }
          }

          // =============================================
          // SUGERENCIAS DEL USUARIO
          // =============================================

          if (
            userSuggestions.length > 0
          ) {
            lines.push("");

            lines.push(
              `💡 SUGERENCIAS — ${userSuggestions.length}`
            );

            userSuggestions.forEach(
              (suggestion) => {
                lines.push(
                  `• ${
                    suggestion.title ||
                    "Sin título"
                  } — ${suggestionStatusLabel(
                    suggestion.status
                  )}`
                );
              }
            );
          }
        }
      );

      // =================================================
      // FOOTER
      // =================================================

      lines.push("");

      lines.push(
        "━━━━━━━━━━━━━━━━━━━━"
      );

      lines.push(
        "Generado automáticamente por Eagles Gear CRM."
      );

      return lines.join("\n");
    };

  // =====================================================
  // COPIAR
  // =====================================================

  const copyReport =
    async () => {
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

  // =====================================================
  // LOADING
  // =====================================================

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

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-6">

      {/* =================================================
          HEADER
      ================================================= */}

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
            onClick={
              loadConsolidatedReport
            }
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-semibold"
          >

            <RefreshCw
              size={17}
            />

            Actualizar

          </button>

          <button
            type="button"
            onClick={copyReport}
            disabled={copying}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
          >

            <Copy
              size={17}
            />

            {copying
              ? "Copiando..."
              : "Copiar reporte"}

          </button>

        </div>

      </div>

      {/* =================================================
          AVISO
      ================================================= */}

      <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3">

        <CheckCircle2
          size={18}
        />

        El reporte consolidado muestra un resumen ejecutivo
        de las actividades y sugerencias del día.

      </div>

      {/* =================================================
          STATS
      ================================================= */}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">

        {/* COMPLETADAS */}

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

        {/* EN PROGRESO */}

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

        {/* PENDIENTES */}

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

        {/* SUGERENCIAS */}

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

        {/* TOTAL */}

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

      {/* =================================================
          REPORTES INDIVIDUALES
      ================================================= */}

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
              getUserDailyReport(
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
                key={
                  executor.id
                }
                className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 p-5"
              >

                {/* HEADER */}

                <div className="flex items-center justify-between mb-4">

                  <div>

                    <h3 className="text-lg font-bold">
                      {
                        executor.full_name ||
                        "Usuario"
                      }
                    </h3>

                    <p className="text-xs text-gray-500">
                      Resumen del día
                    </p>

                  </div>

                  {savedReport ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600">

                      <CheckCircle2
                        size={15}
                      />

                      Guardado

                    </span>
                  ) : (
                    <span className="text-xs text-yellow-600">
                      Sin reporte
                    </span>
                  )}

                </div>

                {/* ESTADÍSTICAS */}

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

                {/* INFO */}

                <div className="text-sm space-y-2">

                  <div className="flex justify-between">

                    <span className="text-gray-500">
                      Actividades
                    </span>

                    <strong>
                      {
                        userActivities.length
                      }
                    </strong>

                  </div>

                  <div className="flex justify-between">

                    <span className="text-gray-500">
                      Sugerencias
                    </span>

                    <strong>
                      {
                        userSuggestions.length
                      }
                    </strong>

                  </div>

                  <div className="flex justify-between">

                    <span className="text-gray-500">
                      Reporte diario
                    </span>

                    <strong>
                      {
                        savedReport
                          ? "Sí"
                          : "No"
                      }
                    </strong>

                  </div>

                </div>

              </div>
            );
          }
        )}

      </div>

      {/* =================================================
          TEXTO COMPLETO
      ================================================= */}

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800">

        <div className="p-5 border-b border-gray-200 dark:border-gray-800">

          <h3 className="font-bold text-lg">
            Reporte completo
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            Versión ejecutiva lista para copiar y compartir.
          </p>

        </div>

        <div className="p-5">

          <pre className="bg-gray-50 dark:bg-gray-800 rounded-lg p-5 text-sm whitespace-pre-wrap font-mono overflow-x-auto">
            {
              generateConsolidatedText()
            }
          </pre>

        </div>

      </div>

    </div>
  );
}

