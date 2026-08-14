"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

import {
  Copy,
  RefreshCw,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Lightbulb,
  CalendarDays,
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
  created_at?: string;
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
  created_at?: string;
}

// =======================================================
// PERIODOS
// =======================================================

type ReportPeriod =
  | "today"
  | "last_3_days"
  | "week"
  | "month"
  | "custom";

// =======================================================
// FECHA LOCAL
// =======================================================

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// =======================================================
// SUMAR / RESTAR DÍAS
// =======================================================

function addDays(
  dateString: string,
  amount: number
) {
  const date = new Date(
    `${dateString}T12:00:00`
  );

  date.setDate(
    date.getDate() + amount
  );

  return getLocalDateString(date);
}

// =======================================================
// INICIO DE SEMANA
// LUNES
// =======================================================

function getStartOfWeek(
  dateString: string
) {
  const date = new Date(
    `${dateString}T12:00:00`
  );

  const day = date.getDay();

  const difference =
    day === 0 ? -6 : 1 - day;

  date.setDate(
    date.getDate() + difference
  );

  return getLocalDateString(date);
}

// =======================================================
// INICIO DE MES
// =======================================================

function getStartOfMonth(
  dateString: string
) {
  const date = new Date(
    `${dateString}T12:00:00`
  );

  date.setDate(1);

  return getLocalDateString(date);
}

// =======================================================
// FORMATEAR FECHA
// =======================================================

function formatDate(
  dateString: string
) {
  return new Date(
    `${dateString}T12:00:00`
  ).toLocaleDateString(
    "es-MX",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );
}

// =======================================================
// FORMATEAR FECHA CORTA
// =======================================================

function formatShortDate(
  dateString: string
) {
  return new Date(
    `${dateString}T12:00:00`
  ).toLocaleDateString(
    "es-MX",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
}

// =======================================================
// STATUS
// =======================================================

function statusLabel(
  status: string
) {
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
// STATUS ICON
// =======================================================

function statusIcon(
  status: string
) {
  switch (status) {
    case "completed":
      return "✅";

    case "in_progress":
      return "🔵";

    case "pending":
      return "🟡";

    case "rejected":
      return "🔴";

    default:
      return "•";
  }
}

// =======================================================
// SUGERENCIAS
// =======================================================

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

// =======================================================
// NOMBRE DEL PERIODO
// =======================================================

function getPeriodLabel(
  period: ReportPeriod
) {
  switch (period) {
    case "today":
      return "Hoy";

    case "last_3_days":
      return "Últimos 3 días";

    case "week":
      return "Esta semana";

    case "month":
      return "Este mes";

    case "custom":
      return "Histórico";

    default:
      return "Reporte";
  }
}

// =======================================================
// COMPONENTE
// =======================================================

export default function ConsolidatedReports() {
  const supabase = createClient();

  // =====================================================
  // ESTADOS
  // =====================================================

  const [profiles, setProfiles] =
    useState<Profile[]>([]);

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

  const [period, setPeriod] =
    useState<ReportPeriod>("today");

  const today = useMemo(
    () => getLocalDateString(),
    []
  );

  // =====================================================
  // FECHAS DEL REPORTE
  // =====================================================

  const defaultStartDate = useMemo(() => {
    if (period === "today") {
      return today;
    }

    if (period === "last_3_days") {
      return addDays(today, -2);
    }

    if (period === "week") {
      return getStartOfWeek(today);
    }

    if (period === "month") {
      return getStartOfMonth(today);
    }

    return today;
  }, [period, today]);

  const defaultEndDate = today;

  const [customStartDate, setCustomStartDate] =
    useState(defaultStartDate);

  const [customEndDate, setCustomEndDate] =
    useState(defaultEndDate);

  // =====================================================
  // FECHAS ACTIVAS
  // =====================================================

  const reportStartDate =
    period === "custom"
      ? customStartDate
      : defaultStartDate;

  const reportEndDate =
    period === "custom"
      ? customEndDate
      : defaultEndDate;

  // =====================================================
  // ACTUALIZAR FECHAS CUSTOM AL CAMBIAR PERIODO
  // =====================================================

  useEffect(() => {
    if (period !== "custom") {
      setCustomStartDate(
        defaultStartDate
      );

      setCustomEndDate(
        defaultEndDate
      );
    }
  }, [
    period,
    defaultStartDate,
    defaultEndDate,
  ]);

  // =====================================================
  // VALIDAR FECHAS
  // =====================================================

  const validDateRange =
    reportStartDate <= reportEndDate;

  // =====================================================
  // CARGAR DATOS
  // =====================================================

  const loadConsolidatedReport =
    async () => {
      setLoading(true);

      try {
        if (!validDateRange) {
          setLoading(false);
          return;
        }

        // -------------------------------------------------
        // FECHA FINAL EXCLUSIVA
        // -------------------------------------------------

        const exclusiveEndDate =
          addDays(
            reportEndDate,
            1
          );

        // -------------------------------------------------
        // CARGAR TODO
        // -------------------------------------------------

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
          // ACTIVIDADES
          // -----------------------------------------------

          supabase
            .from("activities")
            .select("*")
            .gte(
              "due_date",
              reportStartDate
            )
            .lt(
              "due_date",
              exclusiveEndDate
            )
            .order("due_date", {
              ascending: true,
            }),

          // -----------------------------------------------
          // SUGERENCIAS
          // -----------------------------------------------

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
              `${reportStartDate}T00:00:00`
            )
            .lt(
              "created_at",
              `${exclusiveEndDate}T00:00:00`
            )
            .order("created_at", {
              ascending: true,
            }),

          // -----------------------------------------------
          // REPORTES DIARIOS
          // -----------------------------------------------

          supabase
            .from("daily_reports")
            .select("*")
            .gte(
              "report_date",
              reportStartDate
            )
            .lte(
              "report_date",
              reportEndDate
            )
            .order("report_date", {
              ascending: false,
            }),
        ]);

        // =================================================
        // ERRORES
        // =================================================

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
        // GUARDAR
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
          reportsResponse.data || []
        );

        console.log(
          "📊 REPORTE CONSOLIDADO",
          {
            periodo:
              getPeriodLabel(period),

            desde:
              reportStartDate,

            hasta:
              reportEndDate,

            perfiles:
              loadedProfiles.length,

            actividades:
              loadedActivities.length,

            sugerencias:
              suggestionsResponse
                .data?.length || 0,

            reportes:
              reportsResponse.data
                ?.length || 0,
          }
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
  // CARGA INICIAL / CAMBIO DE PERIODO
  // =====================================================

  useEffect(() => {
    loadConsolidatedReport();
  }, [
    period,
    customStartDate,
    customEndDate,
  ]);

  // =====================================================
  // USUARIOS
  // =====================================================

  const executors =
    profiles.filter(
      (profile) =>
        profile.role ===
        "executor"
    );

  const hugo = profiles.find(
    (profile) =>
      profile.role === "admin"
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
  // REPORTES DIARIOS POR USUARIO
  // =====================================================

  const getUserDailyReports = (
    userId: string
  ) => {
    return dailyReports.filter(
      (report) =>
        report.user_id ===
        userId
    );
  };

  // =====================================================
  // ESTADÍSTICAS
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

  const rejectedCount =
    activities.filter(
      (activity) =>
        activity.status ===
        "rejected"
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
  // ACTIVIDADES POR DÍA
  // =====================================================

  const activitiesByDate =
    useMemo(() => {
      const map =
        new Map<
          string,
          Activity[]
        >();

      activities.forEach(
        (activity) => {
          if (
            !activity.due_date
          ) {
            return;
          }

          const date =
            String(
              activity.due_date
            ).split("T")[0];

          if (!map.has(date)) {
            map.set(date, []);
          }

          map
            .get(date)!
            .push(activity);
        }
      );

      return map;
    }, [activities]);

  // =====================================================
  // GENERAR RESUMEN USUARIO
  // =====================================================

  const generateUserSummary = (
    userId: string
  ) => {
    const userActivities =
      getUserActivities(
        userId
      );

    const completed =
      userActivities.filter(
        (activity) =>
          activity.status ===
          "completed"
      );

    const inProgress =
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

    return {
      userActivities,
      completed,
      inProgress,
      pending,
      rejected,
    };
  };

  // =====================================================
  // GENERAR TEXTO CONSOLIDADO
  // =====================================================

  const generateConsolidatedText =
    () => {
      const lines: string[] = [];

      // -------------------------------------------------
      // HEADER
      // -------------------------------------------------

      lines.push(
        `📊 REPORTE ${getPeriodLabel(
          period
        ).toUpperCase()} — EAGLES GEAR CRM`
      );

      lines.push("");

      lines.push(
        `Periodo: ${formatShortDate(
          reportStartDate
        )} al ${formatShortDate(
          reportEndDate
        )}`
      );

      lines.push("");

      // -------------------------------------------------
      // RESUMEN GENERAL
      // -------------------------------------------------

      lines.push(
        "RESUMEN GENERAL"
      );

      lines.push(
        "═══════════════════════"
      );

      lines.push(
        `• ${activities.length} actividades totales`
      );

      lines.push(
        `• ${completedCount} completadas`
      );

      lines.push(
        `• ${inProgressCount} en progreso`
      );

      lines.push(
        `• ${pendingCount} pendientes`
      );

      if (rejectedCount > 0) {
        lines.push(
          `• ${rejectedCount} rechazadas`
        );
      }

      lines.push("");

      lines.push(
        "SUGERENCIAS DE CONTENIDO"
      );

      lines.push(
        `• ${suggestions.length} sugerencias totales`
      );

      lines.push(
        `• ${approvedSuggestions} aprobadas`
      );

      lines.push(
        `• ${pendingSuggestions} pendientes`
      );

      lines.push(
        `• ${rejectedSuggestions} rechazadas`
      );

      // -------------------------------------------------
      // ACTIVIDAD POR DÍA
      // -------------------------------------------------

      if (
        period !== "today" &&
        activities.length > 0
      ) {
        lines.push("");

        lines.push(
          "ACTIVIDAD POR DÍA"
        );

        lines.push(
          "═══════════════════════"
        );

        const sortedDates =
          Array.from(
            activitiesByDate.keys()
          ).sort();

        sortedDates.forEach(
          (date) => {
            const dayActivities =
              activitiesByDate.get(
                date
              ) || [];

            const completed =
              dayActivities.filter(
                (activity) =>
                  activity.status ===
                  "completed"
              ).length;

            lines.push(
              `• ${formatShortDate(
                date
              )}: ${
                dayActivities.length
              } actividades — ${completed} completadas`
            );
          }
        );
      }

      // -------------------------------------------------
      // HUGO
      // -------------------------------------------------

      if (hugo) {
        const summary =
          generateUserSummary(
            hugo.id
          );

        lines.push("");

        lines.push(
          "────────────────────"
        );

        lines.push("");

        lines.push(
          `👤 ${
            hugo.full_name ||
            "Hugo"
          }`
        );

        lines.push(
          "REPORTE DE ACTIVIDADES"
        );

        lines.push(
          `Actividades: ${summary.userActivities.length}`
        );

        lines.push(
          `✅ ${summary.completed.length} completadas`
        );

        lines.push(
          `🔵 ${summary.inProgress.length} en progreso`
        );

        lines.push(
          `🟡 ${summary.pending.length} pendientes`
        );

        if (
          summary.rejected.length >
          0
        ) {
          lines.push(
            `🔴 ${summary.rejected.length} rechazadas`
          );
        }

        if (
          summary.completed.length >
          0
        ) {
          lines.push("");

          lines.push(
            "Completadas:"
          );

          summary.completed.forEach(
            (activity) => {
              lines.push(
                `• ${activity.title}`
              );
            }
          );
        }

        if (
          summary.inProgress.length >
          0
        ) {
          lines.push("");

          lines.push(
            "En progreso:"
          );

          summary.inProgress.forEach(
            (activity) => {
              lines.push(
                `• ${activity.title}`
              );
            }
          );
        }

        if (
          summary.pending.length >
          0
        ) {
          lines.push("");

          lines.push(
            "Pendientes:"
          );

          summary.pending.forEach(
            (activity) => {
              lines.push(
                `• ${activity.title}`
              );
            }
          );
        }
      }

      // -------------------------------------------------
      // EJECUTORES
      // -------------------------------------------------

      executors.forEach(
        (executor) => {
          const summary =
            generateUserSummary(
              executor.id
            );

          const userSuggestions =
            getUserSuggestions(
              executor.id
            );

          const userReports =
            getUserDailyReports(
              executor.id
            );

          lines.push("");

          lines.push(
            "────────────────────"
          );

          lines.push("");

          lines.push(
            `👤 ${
              executor.full_name ||
              "Usuario"
            }`
          );

          lines.push(
            "REPORTE DE ACTIVIDADES"
          );

          lines.push(
            `Actividades: ${summary.userActivities.length}`
          );

          lines.push(
            `✅ ${summary.completed.length} completadas`
          );

          lines.push(
            `🔵 ${summary.inProgress.length} en progreso`
          );

          lines.push(
            `🟡 ${summary.pending.length} pendientes`
          );

          if (
            summary.rejected.length >
            0
          ) {
            lines.push(
              `🔴 ${summary.rejected.length} rechazadas`
            );
          }

          // ---------------------------------------------
          // COMPLETADAS
          // ---------------------------------------------

          if (
            summary.completed.length >
            0
          ) {
            lines.push("");

            lines.push(
              "Completadas:"
            );

            summary.completed.forEach(
              (activity) => {
                lines.push(
                  `• ${activity.title}`
                );
              }
            );
          }

          // ---------------------------------------------
          // EN PROGRESO
          // ---------------------------------------------

          if (
            summary.inProgress.length >
            0
          ) {
            lines.push("");

            lines.push(
              "En progreso:"
            );

            summary.inProgress.forEach(
              (activity) => {
                lines.push(
                  `• ${activity.title}`
                );
              }
            );
          }

          // ---------------------------------------------
          // PENDIENTES
          // ---------------------------------------------

          if (
            summary.pending.length >
            0
          ) {
            lines.push("");

            lines.push(
              "Pendientes:"
            );

            summary.pending.forEach(
              (activity) => {
                lines.push(
                  `• ${activity.title}`
                );
              }
            );
          }

          // ---------------------------------------------
          // SUGERENCIAS
          // ---------------------------------------------

          if (
            userSuggestions.length >
            0
          ) {
            lines.push("");

            lines.push(
              "Sugerencias:"
            );

            userSuggestions.forEach(
              (suggestion) => {
                lines.push(
                  `• 💡 ${suggestion.title} — ${suggestionStatusLabel(
                    suggestion.status
                  )}`
                );
              }
            );
          }

          // ---------------------------------------------
          // REPORTES DIARIOS
          // ---------------------------------------------

          if (
            userReports.length >
            0
          ) {
            lines.push("");

            lines.push(
              `Reportes diarios registrados: ${userReports.length}`
            );
          }
        }
      );

      // -------------------------------------------------
      // FOOTER
      // -------------------------------------------------

      lines.push("");

      lines.push(
        "────────────────────"
      );

      lines.push("");

      lines.push(
        "Generado automáticamente por Eagles Gear CRM."
      );

      return lines.join("\n");
    };

  // =====================================================
  // COPIAR
  // =====================================================

  const copyReport = async () => {
    try {
      setCopying(true);

      await navigator.clipboard.writeText(
        generateConsolidatedText()
      );

      alert(
        "📋 Reporte copiado correctamente."
      );
    } catch (error) {
      console.error(
        "Error copying report:",
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
          Generando reporte...
        </p>

      </div>
    );
  }

  // =====================================================
  // FECHA INVALIDA
  // =====================================================

  if (!validDateRange) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-red-200 dark:border-red-800 p-6">

        <div className="flex items-center gap-3 text-red-600">

          <AlertCircle size={22} />

          <div>

            <p className="font-bold">
              Rango de fechas inválido
            </p>

            <p className="text-sm">
              La fecha inicial no puede
              ser posterior a la fecha
              final.
            </p>

          </div>

        </div>

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

      <div className="flex flex-col gap-4">

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
                {getPeriodLabel(
                  period
                )}{" "}
                ·{" "}
                {formatShortDate(
                  reportStartDate
                )}{" "}
                al{" "}
                {formatShortDate(
                  reportEndDate
                )}
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

      </div>

      {/* =================================================
          SELECTOR DE PERIODO
      ================================================= */}

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 p-5">

        <div className="flex items-center gap-2 mb-4">

          <CalendarDays
            size={20}
            className="text-blue-600"
          />

          <div>

            <h3 className="font-bold">
              Periodo del reporte
            </h3>

            <p className="text-xs text-gray-500">
              Selecciona qué información
              quieres consultar.
            </p>

          </div>

        </div>

        <div className="flex flex-col lg:flex-row gap-4">

          {/* SELECT */}

          <div className="flex-1">

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de reporte
            </label>

            <select
              value={period}
              onChange={(event) =>
                setPeriod(
                  event.target.value as ReportPeriod
                )
              }
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >

              <option value="today">
                Hoy
              </option>

              <option value="last_3_days">
                Últimos 3 días
              </option>

              <option value="week">
                Esta semana
              </option>

              <option value="month">
                Este mes
              </option>

              <option value="custom">
                Históricos
              </option>

            </select>

          </div>

          {/* FECHAS HISTÓRICAS */}

          {period ===
            "custom" && (
            <>

              <div className="flex-1">

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Desde
                </label>

                <input
                  type="date"
                  value={
                    customStartDate
                  }
                  onChange={(event) =>
                    setCustomStartDate(
                      event.target.value
                    )
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />

              </div>

              <div className="flex-1">

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hasta
                </label>

                <input
                  type="date"
                  value={
                    customEndDate
                  }
                  onChange={(event) =>
                    setCustomEndDate(
                      event.target.value
                    )
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />

              </div>

            </>
          )}

        </div>

      </div>

      {/* =================================================
          AVISO
      ================================================= */}

      <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3">

        <CheckCircle2 size={18} />

        Reporte consolidado de{" "}
        <strong>
          {getPeriodLabel(
            period
          )}
        </strong>
        , incluyendo actividades,
        sugerencias y reportes diarios
        disponibles.

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

        {/* PROGRESO */}

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
          HUGO
      ================================================= */}

      {hugo &&
        (() => {
          const userActivities =
            getUserActivities(
              hugo.id
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
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 p-5">

              <div className="flex items-center justify-between mb-4">

                <div>

                  <h3 className="text-lg font-bold">
                    👤{" "}
                    {hugo.full_name ||
                      "Hugo"}
                  </h3>

                  <p className="text-xs text-gray-500">
                    Actividades de{" "}
                    {getPeriodLabel(
                      period
                    ).toLowerCase()}
                  </p>

                </div>

                <span className="text-xs font-medium text-gray-500">
                  Admin
                </span>

              </div>

              <div className="grid grid-cols-4 gap-2 mb-4">

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

                <div className="text-center bg-gray-50 dark:bg-gray-800 rounded-lg p-3">

                  <p className="text-xs text-gray-500">
                    Total
                  </p>

                  <p className="font-bold">
                    {
                      userActivities.length
                    }
                  </p>

                </div>

              </div>

              <div className="space-y-2">

                {userActivities
                  .slice(0, 8)
                  .map(
                    (activity) => (
                      <div
                        key={
                          activity.id
                        }
                        className="flex items-center gap-2 text-sm"
                      >

                        <span>
                          {statusIcon(
                            activity.status
                          )}
                        </span>

                        <span className="flex-1">
                          {
                            activity.title
                          }
                        </span>

                        <span className="text-xs text-gray-400">
                          {statusLabel(
                            activity.status
                          )}
                        </span>

                      </div>
                    )
                  )}

                {userActivities.length >
                  8 && (
                  <p className="text-xs text-gray-400 pt-2">
                    -{" "}
                    {userActivities.length -
                      8}{" "}
                    actividades más
                  </p>
                )}

                {userActivities.length ===
                  0 && (
                  <p className="text-sm text-gray-400">
                    Hugo no tiene actividades
                    en este periodo.
                  </p>
                )}

              </div>

            </div>
          );
        })()}

      {/* =================================================
          EJECUTORES
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

            const savedReports =
              getUserDailyReports(
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

                <div className="flex items-center justify-between mb-4">

                  <div>

                    <h3 className="text-lg font-bold">
                      {
                        executor.full_name ||
                        "Usuario"
                      }
                    </h3>

                    <p className="text-xs text-gray-500">
                      Reporte individual
                    </p>

                  </div>

                  {savedReports.length >
                  0 ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600">

                      <CheckCircle2
                        size={15}
                      />

                      {
                        savedReports.length
                      }{" "}
                      reportes

                    </span>
                  ) : (
                    <span className="text-xs text-yellow-600">
                      Sin reportes
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
                      Reportes diarios
                    </span>

                    <strong>
                      {
                        savedReports.length
                      }
                    </strong>

                  </div>

                </div>

                {/* SUGERENCIAS */}

                {userSuggestions.length >
                  0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">

                    <p className="text-xs font-semibold text-gray-500 mb-2">
                      Sugerencias
                    </p>

                    <div className="space-y-1">

                      {userSuggestions
                        .slice(0, 5)
                        .map(
                          (
                            suggestion
                          ) => (
                            <div
                              key={
                                suggestion.id
                              }
                              className="text-sm"
                            >

                              💡{" "}
                              {
                                suggestion.title
                              }{" "}

                              <span className="text-xs text-gray-400">
                                —{" "}
                                {suggestionStatusLabel(
                                  suggestion.status
                                )}
                              </span>

                            </div>
                          )
                        )}

                    </div>

                  </div>
                )}

              </div>
            );
          }
        )}

      </div>

      {/* =================================================
          REPORTE PARA COMPARTIR
      ================================================= */}

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800">

        <div className="p-5 border-b border-gray-200 dark:border-gray-800">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

            <div>

              <h3 className="font-bold text-lg">
                Reporte para compartir
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Versión resumida de{" "}
                {getPeriodLabel(
                  period
                ).toLowerCase()}
                .
              </p>

            </div>

            <button
              type="button"
              onClick={copyReport}
              disabled={copying}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
            >

              <Copy size={17} />

              {copying
                ? "Copiando..."
                : "Copiar reporte"}

            </button>

          </div>

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