"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/marketing-hooks";
import {
  Camera,
  Check,
  ClipboardCopy,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";

type ActivityRow = {
  id: number;
  title: string;
  status: string;
  due_date: string | null;
  updated_at: string | null;
};

type EvidenceRow = {
  id: string;
  user_id: string;
  activity_id: number | null;
  report_date: string;
  note: string | null;
  storage_path: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  expires_at: string;
  signed_url: string | null;
  user_name: string;
  activity_title: string;
  activity_status: string | null;
  activity_due_date: string | null;
};

type PermissionState = {
  canUpload: boolean;
  canViewAll: boolean;
  canConsolidate: boolean;
  isVictoria: boolean;
};

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}


function formatDateTime(value: string) {
  return new Date(value).toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
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

export default function ReportEvidenceCenter() {
  const { user, loading: userLoading } = useCurrentUser();
  const supabase = createClient();

  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [permissions, setPermissions] = useState<PermissionState>({
    canUpload: false,
    canViewAll: false,
    canConsolidate: false,
    isVictoria: false,
  });
  const [loading, setLoading] = useState(true);
  const [uploadingActivity, setUploadingActivity] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [filterUser, setFilterUser] = useState("all");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);

  const loadEvidence = useCallback(async () => {
    try {
      const response = await fetch("/app1/api/report-evidence", {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "No se pudieron cargar las evidencias.");
      setEvidence(payload.evidence || []);
      setActivities(payload.activities || []);
      setPermissions(payload.permissions || permissions);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudieron cargar las evidencias.");
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await loadEvidence();
    setLoading(false);
  }, [loadEvidence]);

  useEffect(() => {
    if (!userLoading && user) void refresh();
    if (!userLoading && !user) setLoading(false);
  }, [userLoading, user?.id]);

  const uploadEvidence = async (activityId: number, file: File | null) => {
    if (!file) return;
    setNotice("");
    setUploadingActivity(activityId);

    try {
      const prepareResponse = await fetch("/app1/api/report-evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "prepare-upload",
          activityId,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      });
      const prepare = await prepareResponse.json().catch(() => ({}));
      if (!prepareResponse.ok) throw new Error(prepare.error || "No se pudo preparar la evidencia.");

      const upload = prepare.upload as { bucket: string; storagePath: string; token: string };
      const { error: uploadError } = await supabase.storage
        .from(upload.bucket)
        .uploadToSignedUrl(upload.storagePath, upload.token, file, {
          contentType: file.type,
          upsert: false,
        });
      if (uploadError) throw uploadError;

      const finalizeResponse = await fetch("/app1/api/report-evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "finalize-upload",
          activityId,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          storagePath: upload.storagePath,
          note: notes[activityId] || "",
        }),
      });
      const finalize = await finalizeResponse.json().catch(() => ({}));
      if (!finalizeResponse.ok) throw new Error(finalize.error || "No se pudo registrar la evidencia.");

      setNotes((prev) => ({ ...prev, [activityId]: "" }));
      setNotice("✅ Evidencia guardada. Se eliminará automáticamente después de 3 días.");
      await loadEvidence();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo subir la evidencia.");
    } finally {
      setUploadingActivity(null);
    }
  };

  const deleteEvidence = async (id: string) => {
    if (!window.confirm("¿Eliminar esta evidencia ahora?")) return;
    setNotice("");
    try {
      const response = await fetch(`/app1/api/report-evidence?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "No se pudo eliminar la evidencia.");
      setEvidence((prev) => prev.filter((item) => item.id !== id));
      setNotice("Evidencia eliminada.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo eliminar la evidencia.");
    }
  };

  const ownEvidenceByActivity = useMemo(() => {
    const map = new Map<number, EvidenceRow[]>();
    evidence
      .filter((item) => item.user_id === user?.id && item.activity_id)
      .forEach((item) => {
        const key = Number(item.activity_id);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(item);
      });
    return map;
  }, [evidence, user?.id]);

  const evidenceUsers = useMemo(() => {
    const map = new Map<string, string>();
    evidence.forEach((item) => map.set(item.user_id, item.user_name));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "es"));
  }, [evidence]);

  const filteredEvidence = useMemo(() => {
    if (filterUser === "all") return evidence;
    return evidence.filter((item) => item.user_id === filterUser);
  }, [evidence, filterUser]);

  const groupedEvidence = useMemo(() => {
    const groups = new Map<string, EvidenceRow[]>();
    filteredEvidence.forEach((item) => {
      const key = `${item.user_id}::${item.activity_id || "none"}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    });
    return [...groups.values()];
  }, [filteredEvidence]);

  const copyConsolidated = async () => {
    const lines: string[] = [
      "📎 CONSOLIDADO DE EVIDENCIAS — EAGLES GEAR CRM",
      `Generado: ${new Date().toLocaleString("es-MX")}`,
      "Retención visible: últimos 3 días",
      "",
    ];

    const byUser = new Map<string, EvidenceRow[]>();
    filteredEvidence.forEach((item) => {
      if (!byUser.has(item.user_name)) byUser.set(item.user_name, []);
      byUser.get(item.user_name)!.push(item);
    });

    [...byUser.entries()].forEach(([name, items]) => {
      lines.push(`👤 ${name}`);
      const byActivity = new Map<string, EvidenceRow[]>();
      items.forEach((item) => {
        const title = item.activity_title || "Actividad";
        if (!byActivity.has(title)) byActivity.set(title, []);
        byActivity.get(title)!.push(item);
      });
      [...byActivity.entries()].forEach(([title, files]) => {
        lines.push(`• ${title} — ${files.length} evidencia(s)`);
        files.forEach((file) => {
          if (file.note) lines.push(`  Nota: ${file.note}`);
        });
      });
      lines.push("");
    });

    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  if (userLoading || loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="animate-spin" size={18} />
          Cargando evidencias...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notice && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
          {notice}
        </div>
      )}

      {permissions.canUpload && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Camera className="text-emerald-600" size={22} />
                <h2 className="text-xl font-bold">Evidencia de mis actividades</h2>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Solo se muestran tus actividades de hoy. Sube captura, foto o PDF; cada archivo dura 3 días y después se elimina para ahorrar espacio.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              title="Actualizar"
            >
              <RefreshCw size={17} />
            </button>
          </div>

          {activities.length === 0 ? (
            <div className="rounded-xl bg-gray-50 p-5 text-sm text-gray-500 dark:bg-gray-950 dark:text-gray-400">
              No tienes actividades asignadas para hoy.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {activities.map((activity) => {
                const attached = ownEvidenceByActivity.get(activity.id) || [];
                return (
                  <div key={activity.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{activity.title}</h3>
                        <p className="mt-1 text-xs text-gray-500">
                          {statusLabel(activity.status)}{activity.due_date ? ` · ${String(activity.due_date).split("T")[0]}` : ""}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {attached.length} evidencia{attached.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    <textarea
                      value={notes[activity.id] || ""}
                      onChange={(event) => setNotes((prev) => ({ ...prev, [activity.id]: event.target.value }))}
                      placeholder="Nota opcional: qué demuestra esta evidencia..."
                      rows={2}
                      className="mt-3 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-gray-700"
                    />

                    <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">
                      {uploadingActivity === activity.id ? (
                        <Loader2 className="animate-spin" size={17} />
                      ) : (
                        <Upload size={17} />
                      )}
                      {uploadingActivity === activity.id ? "Subiendo..." : "Subir evidencia"}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        disabled={uploadingActivity !== null}
                        onChange={(event) => {
                          const file = event.target.files?.[0] || null;
                          void uploadEvidence(activity.id, file);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>

                    {attached.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {attached.slice(0, 4).map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs dark:bg-gray-950">
                            <div className="min-w-0">
                              <p className="truncate font-medium">{item.original_name}</p>
                              <p className="text-gray-500">Se borra: {formatDateTime(item.expires_at)}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              {item.signed_url && (
                                <a href={item.signed_url} target="_blank" rel="noreferrer" className="rounded p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800" title="Ver">
                                  <ExternalLink size={15} />
                                </a>
                              )}
                              <button type="button" onClick={() => void deleteEvidence(item.id)} className="rounded p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30" title="Eliminar">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {permissions.canViewAll && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="text-orange-600" size={22} />
                <h2 className="text-xl font-bold">Evidencias consolidadas</h2>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Evidencias activas de los últimos 3 días. Nancy, Jonathan, Lalo/Eduardo y responsables autorizados pueden consultarlas aquí.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterUser}
                onChange={(event) => setFilterUser(event.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
              >
                <option value="all">Todos los usuarios</option>
                {evidenceUsers.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>

              {permissions.canConsolidate && (
                <button
                  type="button"
                  onClick={() => void copyConsolidated()}
                  className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                >
                  {copied ? <Check size={16} /> : <ClipboardCopy size={16} />}
                  {copied ? "Copiado" : "Copiar consolidado"}
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {groupedEvidence.length === 0 ? (
              <div className="col-span-full rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-500 dark:bg-gray-950 dark:text-gray-400">
                Aún no hay evidencias activas.
              </div>
            ) : (
              groupedEvidence.map((items) => {
                const first = items[0];
                return (
                  <article key={`${first.user_id}-${first.activity_id}`} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                    <div className="mb-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-orange-600">{first.user_name}</p>
                      <h3 className="mt-1 font-semibold">{first.activity_title}</h3>
                      <p className="mt-1 text-xs text-gray-500">
                        {first.activity_status ? statusLabel(first.activity_status) : "Actividad"} · {items.length} evidencia{items.length === 1 ? "" : "s"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {items.map((item) => (
                        <div key={item.id} className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
                          {item.mime_type.startsWith("image/") && item.signed_url ? (
                            <a href={item.signed_url} target="_blank" rel="noreferrer">
                              <img src={item.signed_url} alt={item.original_name} className="h-28 w-full object-cover" />
                            </a>
                          ) : (
                            <a href={item.signed_url || "#"} target="_blank" rel="noreferrer" className="flex h-28 items-center justify-center text-gray-500">
                              <FileText size={30} />
                            </a>
                          )}
                          <div className="p-2">
                            <div className="flex items-center gap-1 text-[11px] font-medium text-gray-700 dark:text-gray-200">
                              {item.mime_type.startsWith("image/") ? <ImageIcon size={12} /> : <FileText size={12} />}
                              <span className="truncate">{item.original_name}</span>
                            </div>
                            {item.note && <p className="mt-1 line-clamp-2 text-[11px] text-gray-500">{item.note}</p>}
                            <p className="mt-1 text-[10px] text-gray-400">Expira {formatDateTime(item.expires_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      )}
    </div>
  );
}
