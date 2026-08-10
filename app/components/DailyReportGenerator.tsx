"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser, useActivities } from "@/lib/marketing-hooks";
import {
  Copy,
  Check,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface DailyReport {
  id: string;
  user_id: string;
  report_date: string;
  report_content: string;
  created_at?: string;
}

interface ContentSuggestion {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  status: string;
  created_by: string;
  created_at: string;
}

// =========================================================
// FECHA LOCAL
// =========================================================

function getLocalDateString() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// =========================================================
// FORMATEAR FECHA
// =========================================================

function formatDate(dateString: string) {
  try {
    return new Date(`${dateString}T12:00:00`).toLocaleDateString(
      "es-MX",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  } catch {
    return dateString;
  }
}

// =========================================================
// ESTADOS DE ACTIVIDADES
// =========================================================

function getStatusLabel(status: string) {
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

// =========================================================
// ESTADOS DE SUGERENCIAS
// =========================================================

function getSuggestionStatusLabel(status: string) {
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

// =========================================================
// COMPONENTE
// =========================================================

export default function DailyReportGenerator() {
  const { user } = useCurrentUser();
  const { activities } = useActivities();

  const supabase = createClient();

  // =========================================================
  // ESTADOS
  // =========================================================

  const [suggestions, setSuggestions] = useState<
    ContentSuggestion[]
  >([]);

  const [currentReport, setCurrentReport] =
    useState<DailyReport | null>(null);

  const [reportContent, setReportContent] =
    useState("");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [copying, setCopying] = useState(false);

  const [showHistory, setShowHistory] =
    useState(false);

  const [history, setHistory] =
    useState<DailyReport[]>([]);

  const [loadingHistory, setLoadingHistory] =
    useState(false);

  const [showHistoryReport, setShowHistoryReport] =
    useState<DailyReport | null>(null);

  const today = useMemo(
    () => getLocalDateString(),
    []
  );

  // =========================================================
  // ACTIVIDADES DEL DÍA
  // =========================================================

  const todayActivities = useMemo(() => {
    if (!user) return [];

    return activities.filter((activity: any) => {
      if (!activity) return false;

      const dueDate = activity?.due_date
        ? String(activity.due_date).split("T")[0]
        : "";

      const updatedAt = activity?.updated_at
        ? String(activity.updated_at).split("T")[0]
        : "";

      return (
        dueDate === today ||
        updatedAt === today
      );
    });
  }, [activities, today, user]);

  // =========================================================
  // ESTADÍSTICAS
  // =========================================================

  const completedCount =
    todayActivities.filter(
      (activity: any) =>
        activity.status === "completed"
    ).length;

  const pendingCount =
    todayActivities.filter(
      (activity: any) =>
        activity.status === "pending"
    ).length;

  const inProgressCount =
    todayActivities.filter(
      (activity: any) =>
        activity.status === "in_progress"
    ).length;

  // =========================================================
  // CARGAR SUGERENCIAS
  // =========================================================

  const loadSuggestions = async (): Promise<
    ContentSuggestion[]
  > => {
    if (!user?.id) return [];

    try {
      const { data, error } = await supabase
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
        .eq("created_by", user.id)
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
        });

      if (error) {
        console.error(
          "Error loading suggestions:",
          error
        );

        return [];
      }

      const loadedSuggestions =
        data || [];

      setSuggestions(
        loadedSuggestions
      );

      return loadedSuggestions;
    } catch (error) {
      console.error(
        "Unexpected error loading suggestions:",
        error
      );

      return [];
    }
  };

  // =========================================================
  // CARGAR REPORTE DEL DÍA
  // =========================================================

  const loadTodayReport = async () => {
    if (!user?.id) return;

    try {
      const { data, error } =
        await supabase
          .from("daily_reports")
          .select("*")
          .eq("user_id", user.id)
          .eq("report_date", today)
          .maybeSingle();

      if (error) {
        console.error(
          "Error loading daily report:",
          error
        );

        return;
      }

      if (data) {
        setCurrentReport(data);

        setReportContent(
          data.report_content || ""
        );
      }
    } catch (error) {
      console.error(
        "Unexpected error loading report:",
        error
      );
    }
  };

  // =========================================================
  // CARGAR HISTORIAL
  // =========================================================

  const loadHistory = async () => {
    if (!user?.id) return;

    setLoadingHistory(true);

    try {
      const { data, error } =
        await supabase
          .from("daily_reports")
          .select("*")
          .eq("user_id", user.id)
          .order("report_date", {
            ascending: false,
          })
          .limit(30);

      if (error) {
        console.error(
          "Error loading report history:",
          error
        );

        return;
      }

      setHistory(data || []);
    } catch (error) {
      console.error(
        "Unexpected error loading history:",
        error
      );
    } finally {
      setLoadingHistory(false);
    }
  };

  // =========================================================
  // GENERAR REPORTE
  // =========================================================

  const generateReport = (
    reportSuggestions: ContentSuggestion[] = suggestions
  ) => {
    if (!user) return "";

    const formattedDate =
      formatDate(today);

    // =======================================================
    // ACTIVIDADES
    // =======================================================

    const activitiesText =
      todayActivities.length > 0
        ? todayActivities
            .map((activity: any) => {
              return `📋 ${
                activity.title ||
                "Sin título"
              }

Estado: ${getStatusLabel(
                activity.status
              )}

Prioridad: ${
                activity.priority ||
                "Sin prioridad"
              }

Vencimiento: ${
                activity.due_date ||
                "Sin fecha"
              }${
                activity.result_notes
                  ? `\nNotas: ${activity.result_notes}`
                  : ""
              }`;
            })
            .join("\n\n")
        : "No se registraron actividades durante el día.";

    // =======================================================
    // SUGERENCIAS
    // =======================================================

    const suggestionsText =
      reportSuggestions.length > 0
        ? reportSuggestions
            .map((suggestion) => {
              return `💡 ${
                suggestion.title
              }

Tipo: ${
                suggestion.content_type
              }

Estado: ${getSuggestionStatusLabel(
                suggestion.status
              )}${
                suggestion.description
                  ? `\nDescripción: ${suggestion.description}`
                  : ""
              }`;
            })
            .join("\n\n")
        : "No se registraron sugerencias de contenido durante el día.";

    // =======================================================
    // REPORTE FINAL
    // =======================================================

    const autoReport = `REPORTE DIARIO - ${formattedDate}

Reportado por: ${
      user.full_name || "Usuario"
    }

RESUMEN DE ACTIVIDADES
═══════════════════════
• Actividades Completadas: ${completedCount}
• Actividades en Progreso: ${inProgressCount}
• Actividades Pendientes: ${pendingCount}
• Total de actividades: ${
      todayActivities.length
    }

ACTIVIDADES DEL DÍA
═══════════════════════
${activitiesText}

SUGERENCIAS DE CONTENIDO
═══════════════════════
${suggestionsText}

PRÓXIMAS ACCIONES
═══════════════════════
[Agrega aquí cualquier comentario o próxima acción relevante]

Generado automáticamente por Eagles Gear CRM.`;

    setReportContent(autoReport);

    return autoReport;
  };

  // =========================================================
  // GUARDAR REPORTE
  // =========================================================

  const saveReport = async (
    content?: string,
    silent = false
  ) => {
    if (!user?.id) return;

    const finalContent =
      content ?? reportContent;

    if (!finalContent.trim()) {
      if (!silent) {
        alert(
          "El reporte no puede estar vacío."
        );
      }

      return;
    }

    if (!silent) {
      setSaving(true);
    }

    try {
      /*
       * IMPORTANTE:
       *
       * NO usamos updated_at porque la tabla
       * daily_reports no tiene esa columna.
       */

      const { data, error } =
        await supabase
          .from("daily_reports")
          .upsert(
            {
              user_id: user.id,
              report_date: today,
              report_content: finalContent,
            },
            {
              onConflict:
                "user_id,report_date",
            }
          )
          .select("*")
          .single();

      if (error) {
        throw error;
      }

      if (data) {
        setCurrentReport(data);

        setReportContent(
          data.report_content || ""
        );
      }

      if (!silent) {
        alert(
          "✅ Reporte guardado correctamente."
        );
      }
    } catch (error: any) {
      console.error(
        "Error saving report:",
        error
      );

      if (!silent) {
        alert(
          `❌ Error al guardar el reporte: ${
            error?.message ||
            "Error desconocido"
          }`
        );
      }
    } finally {
      if (!silent) {
        setSaving(false);
      }
    }
  };

  // =========================================================
  // GENERAR Y GUARDAR AUTOMÁTICAMENTE
  // =========================================================

  const generateAndSaveAutomatically =
    async () => {
      if (!user?.id) return;

      setLoading(true);

      try {
        /*
         * Obtenemos las sugerencias directamente
         * para asegurarnos de usar la información
         * más reciente.
         */

        const latestSuggestions =
          await loadSuggestions();

        const generated =
          generateReport(
            latestSuggestions
          );

        if (generated) {
          await saveReport(
            generated,
            true
          );
        }
      } catch (error) {
        console.error(
          "Error generating automatic report:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

  // =========================================================
  // INICIALIZAR
  // =========================================================

  useEffect(() => {
    if (
      !user?.id ||
      user.role !== "executor"
    ) {
      return;
    }

    const initialize = async () => {
      setLoading(true);

      await loadSuggestions();

      await loadTodayReport();

      setLoading(false);
    };

    initialize();
  }, [user?.id, today]);

  // =========================================================
  // ACTUALIZAR AUTOMÁTICAMENTE
  //
  // Cuando cambian:
  // - Actividades
  // - Sugerencias
  //
  // se vuelve a generar el reporte.
  // =========================================================

  useEffect(() => {
    if (
      !user?.id ||
      user.role !== "executor" ||
      loading
    ) {
      return;
    }

    const timer = setTimeout(
      async () => {
        const generated =
          generateReport(
            suggestions
          );

        if (generated) {
          await saveReport(
            generated,
            true
          );
        }
      },
      700
    );

    return () =>
      clearTimeout(timer);
  }, [
    activities,
    suggestions,
    user?.id,
    loading,
  ]);

  // =========================================================
  // COPIAR REPORTE
  // =========================================================

  const copyReport = async (
    content: string
  ) => {
    try {
      setCopying(true);

      await navigator.clipboard.writeText(
        content
      );

      alert(
        "📋 Reporte copiado. Ya puedes pegarlo donde quieras."
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

  // =========================================================
  // HISTORIAL
  // =========================================================

  const toggleHistory = async () => {
    const next = !showHistory;

    setShowHistory(next);

    if (
      next &&
      history.length === 0
    ) {
      await loadHistory();
    }
  };

  // =========================================================
  // PERMISOS
  // =========================================================

  if (!user) {
    return (
      <div className="p-6 text-center text-gray-500">
        Cargando...
      </div>
    );
  }

  if (user.role !== "executor") {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          No tienes permisos para generar
          reportes individuales.
        </p>
      </div>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-6">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>
          <div className="flex items-center gap-3">

            <div className="w-11 h-11 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">

              <FileText
                size={23}
                className="text-blue-600 dark:text-blue-400"
              />

            </div>

            <div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Mi Reporte Diario
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {formatDate(today)}
              </p>

            </div>

          </div>
        </div>

        <div className="flex gap-2 flex-wrap">

          <button
            type="button"
            onClick={
              generateAndSaveAutomatically
            }
            disabled={
              loading || saving
            }
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition disabled:opacity-50"
          >

            <RefreshCw
              size={17}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Actualizar reporte

          </button>

          <button
            type="button"
            onClick={() =>
              copyReport(reportContent)
            }
            disabled={
              copying ||
              !reportContent.trim()
            }
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-semibold transition disabled:opacity-50"
          >

            {copying ? (
              "Copiando..."
            ) : (
              <>
                <Copy size={17} />
                Copiar
              </>
            )}

          </button>

        </div>

      </div>

      {/* ===================================================
          ESTADO AUTOMÁTICO
      =================================================== */}

      <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3">

        <Check size={18} />

        <span>
          Este reporte se genera y actualiza
          automáticamente con tus actividades
          y sugerencias del día.
        </span>

      </div>

      {/* ===================================================
          ESTADÍSTICAS
      =================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

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

      {/* ===================================================
          REPORTE ACTUAL
      =================================================== */}

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-800">

        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">

          <div>

            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              Reporte del día
            </h3>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">

              {currentReport
                ? "Guardado automáticamente"
                : "Generando reporte..."}

            </p>

          </div>

          {currentReport && (
            <Check
              size={20}
              className="text-green-500"
            />
          )}

        </div>

        <div className="p-4">

          {loading ? (
            <div className="py-12 text-center text-gray-500">
              Generando reporte...
            </div>
          ) : (
            <pre className="bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 p-5 rounded-lg text-sm whitespace-pre-wrap font-mono overflow-x-auto">
              {reportContent ||
                "No hay información para generar el reporte."}
            </pre>
          )}

        </div>

      </div>

      {/* ===================================================
          HISTORIAL
      =================================================== */}

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-800">

        <button
          type="button"
          onClick={toggleHistory}
          className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >

          <div className="flex items-center gap-3">

            <FileText
              size={20}
              className="text-gray-500"
            />

            <div className="text-left">

              <h3 className="font-bold text-gray-900 dark:text-white">
                Mis reportes anteriores
              </h3>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Consulta y comparte reportes anteriores.
              </p>

            </div>

          </div>

          {showHistory ? (
            <ChevronUp size={20} />
          ) : (
            <ChevronDown size={20} />
          )}

        </button>

        {showHistory && (
          <div className="border-t border-gray-200 dark:border-gray-800 p-4">

            {loadingHistory ? (
              <div className="py-6 text-center text-gray-500">
                Cargando historial...
              </div>
            ) : history.length === 0 ? (
              <div className="py-6 text-center text-gray-500">
                No hay reportes anteriores.
              </div>
            ) : (
              <div className="space-y-2">

                {history.map(
                  (report) => (
                    <div
                      key={report.id}
                      className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800"
                    >

                      <div>

                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatDate(
                            report.report_date
                          )}
                        </p>

                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">

                          Creado:
                          {" "}
                          {report.created_at
                            ? new Date(
                                report.created_at
                              ).toLocaleString(
                                "es-MX"
                              )
                            : "Sin información"}

                        </p>

                      </div>

                      <div className="flex gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            setShowHistoryReport(
                              report
                            )
                          }
                          className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                        >
                          Ver
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            copyReport(
                              report.report_content
                            )
                          }
                          className="inline-flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                        >
                          <Copy size={15} />
                          Copiar
                        </button>

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </div>
        )}

      </div>

      {/* ===================================================
          MODAL HISTORIAL
      =================================================== */}

      {showHistoryReport && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">

            {/* HEADER MODAL */}

            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">

              <div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Reporte del{" "}
                  {formatDate(
                    showHistoryReport.report_date
                  )}
                </h3>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowHistoryReport(
                    null
                  )
                }
                className="text-gray-500 hover:text-gray-900 dark:hover:text-white text-xl"
              >
                ✕
              </button>

            </div>

            {/* CONTENIDO */}

            <div className="p-5 overflow-y-auto max-h-[70vh]">

              <pre className="bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-5 rounded-lg text-sm whitespace-pre-wrap font-mono">
                {
                  showHistoryReport.report_content
                }
              </pre>

            </div>

            {/* FOOTER */}

            <div className="flex justify-end gap-2 p-5 border-t border-gray-200 dark:border-gray-800">

              <button
                type="button"
                onClick={() =>
                  copyReport(
                    showHistoryReport.report_content
                  )
                }
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >

                <Copy size={17} />

                Copiar reporte

              </button>

              <button
                type="button"
                onClick={() =>
                  setShowHistoryReport(
                    null
                  )
                }
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-semibold text-gray-900 dark:text-white"
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