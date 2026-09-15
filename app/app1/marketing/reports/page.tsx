"use client";

import DailyReportGenerator from "@/components/DailyReportGenerator";
import ConsolidatedReports from "@/components/ConsolidatedReports";
import ReportEvidenceCenter from "@/components/ReportEvidenceCenter";
import { useCurrentUser } from "@/lib/marketing-hooks";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export default function ReportsPage() {
  const { user, loading } = useCurrentUser();

  if (loading) {
    return <div className="p-6">Cargando reportes...</div>;
  }

  if (!user) {
    return <div className="p-6">No se encontró el usuario.</div>;
  }

  const name = normalize(user.full_name || "");
  const email = normalize(user.email || "");

  const isVictoria = name.includes("victoria") || email.includes("victoria");
  const isLuis = name.includes("luis") || email.includes("luis");
  const isMarcos = name.includes("marcos") || email === "marcosc@eagles.com";
  const isUrsula = name.includes("ursula") || email === "ursula@eagles.com";
  const isNancy = name.includes("nancy") || email.includes("nancy");
  const isJonathan = name.includes("jonathan") || email.includes("jonathan");
  const isLaloEduardo =
    name.includes("lalo") ||
    name.includes("eduardo") ||
    email.includes("lalo") ||
    email.includes("eduardo");
  const isEvidenceViewer = isNancy || isJonathan || isLaloEduardo;

  const canUploadEvidence = user.role === "executor" || isLuis || isMarcos || isVictoria || isUrsula;

  // Victoria arma el consolidado operativo con evidencias. Los visores
  // (Nancy, Jonathan y Lalo/Eduardo) entran a Reportes en modo consulta
  // y no montan el consolidado histórico, evitando mezclar permisos y vistas.
  // Los demás admins conservan el consolidado anterior.
  const canSeeConsolidatedReports =
    isVictoria || (user.role === "admin" && !isEvidenceViewer);

  const canSeeEvidenceModule =
    canUploadEvidence || user.role === "admin" || isEvidenceViewer || isVictoria;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">📊 Reportes</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Reportes y evidencias de actividades de Eagles Gear CRM
        </p>
      </div>

      {canSeeEvidenceModule && <ReportEvidenceCenter />}

      {isMarcos && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900/50 dark:bg-green-900/10 dark:text-green-300">
          📲 Tu reporte diario se prepara automáticamente y se envía por WhatsApp a las 5:00 PM, de lunes a sábado, desde la instancia WORKSHOP.
        </div>
      )}

      {(user.role === "executor" || isMarcos) && <DailyReportGenerator />}

      {canSeeConsolidatedReports && <ConsolidatedReports />}

      {!canSeeEvidenceModule && user.role !== "executor" && !isMarcos && !canSeeConsolidatedReports && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-gray-500 dark:text-gray-400">No tienes acceso al módulo de reportes.</p>
        </div>
      )}
    </div>
  );
}
