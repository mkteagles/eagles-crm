"use client";

import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Users,
  ClipboardList,
  Plus,
  ArrowRight,
  Building2,
} from "lucide-react";

interface AdministrationDashboardProps {
  user: {
    id: string;
    full_name: string | null;
    role: string;
  };
}

interface MockActivity {
  id: number;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  priority: "high" | "medium" | "low";
  date: string;
  time?: string;
  assignedTo: string;
}

const mockActivities: MockActivity[] = [
  {
    id: 1,
    title: "Junta de seguimiento",
    description:
      "Revisión de pendientes y avances del equipo.",
    status: "pending",
    priority: "high",
    date: "Hoy",
    time: "11:00 AM",
    assignedTo: "Dirección",
  },
  {
    id: 2,
    title: "Revisión de pendientes",
    description:
      "Revisar actividades pendientes de la semana.",
    status: "pending",
    priority: "medium",
    date: "Hoy",
    time: "2:00 PM",
    assignedTo: "Dirección",
  },
  {
    id: 3,
    title: "Seguimiento administrativo",
    description:
      "Revisión general de temas administrativos.",
    status: "in_progress",
    priority: "medium",
    date: "13 de agosto",
    assignedTo: "Dirección",
  },
];

const mockUsers = [
  {
    name: "Jonathan",
    role: "Dirección",
    activities: 1,
  },
  {
    name: "Nancy",
    role: "Dirección",
    activities: 1,
  },
  {
    name: "Luis",
    role: "Dirección",
    activities: 0,
  },
];

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Buenos días";
  }

  if (hour < 19) {
    return "Buenas tardes";
  }

  return "Buenas noches";
}

function getStatusLabel(status: MockActivity["status"]) {
  switch (status) {
    case "completed":
      return "Completada";

    case "in_progress":
      return "En progreso";

    case "pending":
      return "Pendiente";

    default:
      return "Pendiente";
  }
}

function getPriorityLabel(
  priority: MockActivity["priority"]
) {
  switch (priority) {
    case "high":
      return "Alta";

    case "medium":
      return "Media";

    case "low":
      return "Baja";

    default:
      return "Media";
  }
}

export default function AdministrationDashboard({
  user,
}: AdministrationDashboardProps) {
  const isAdmin = user.role === "admin";

  const firstName =
    user.full_name?.split(" ")[0] || "Usuario";

  const userActivities = isAdmin
    ? mockActivities
    : mockActivities.filter(
        (activity) =>
          activity.assignedTo === "Dirección"
      );

  const completed = userActivities.filter(
    (activity) =>
      activity.status === "completed"
  ).length;

  const inProgress = userActivities.filter(
    (activity) =>
      activity.status === "in_progress"
  ).length;

  const pending = userActivities.filter(
    (activity) =>
      activity.status === "pending"
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* =========================================
            HEADER
        ========================================= */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">

          {/* SALUDO */}

          <div className="flex-1">

            <div className="flex items-center gap-2 mb-2">

              <Building2
                size={18}
                className="text-purple-600"
              />

              <span className="text-sm font-medium text-purple-600">
                Administración
              </span>

            </div>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {getGreeting()}, {firstName} 👋
            </h1>

            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {isAdmin
                ? "Gestiona las actividades y pendientes administrativos."
                : "Aquí puedes consultar tus actividades administrativas."}
            </p>

          </div>


          {/* =========================================
              LOGOS + BOTÓN
          ========================================= */}

          <div className="flex items-center gap-5">

            {/* LOGOS */}

            <div className="flex items-center gap-3">

              <div className="h-14 w-14 flex items-center justify-center">
                <img
                  src="/public/logo-1.png"
                  alt="Logo 1"
                  className="max-h-14 max-w-14 object-contain"
                />
              </div>

              <div className="h-14 w-px bg-gray-200 dark:bg-gray-800" />

              <div className="h-14 w-14 flex items-center justify-center">
                <img
                  src="/public/logo-2.png"
                  alt="Logo 2"
                  className="max-h-14 max-w-14 object-contain"
                />
              </div>

            </div>


            {/* NUEVA ACTIVIDAD */}

            {isAdmin && (
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-sm transition"
              >
                <Plus size={18} />

                Nueva actividad
              </button>
            )}

          </div>

        </div>


        {/* =========================================
            STATS
        ========================================= */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

          {/* TOTAL */}

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">

            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">

              <ClipboardList
                size={20}
                className="text-purple-600"
              />

            </div>

            <p className="text-sm text-gray-500">
              Total actividades
            </p>

            <p className="text-2xl font-bold mt-1">
              {userActivities.length}
            </p>

          </div>


          {/* PENDIENTES */}

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">

            <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mb-3">

              <Clock
                size={20}
                className="text-yellow-600"
              />

            </div>

            <p className="text-sm text-gray-500">
              Pendientes
            </p>

            <p className="text-2xl font-bold mt-1 text-yellow-600">
              {pending}
            </p>

          </div>


          {/* EN PROGRESO */}

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">

            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">

              <ArrowRight
                size={20}
                className="text-blue-600"
              />

            </div>

            <p className="text-sm text-gray-500">
              En progreso
            </p>

            <p className="text-2xl font-bold mt-1 text-blue-600">
              {inProgress}
            </p>

          </div>


          {/* COMPLETADAS */}

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">

            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">

              <CheckCircle2
                size={20}
                className="text-green-600"
              />

            </div>

            <p className="text-sm text-gray-500">
              Completadas
            </p>

            <p className="text-2xl font-bold mt-1 text-green-600">
              {completed}
            </p>

          </div>

        </div>


        {/* =========================================
            CONTENIDO
        ========================================= */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ACTIVIDADES */}

          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">

            <div className="p-5 border-b border-gray-200 dark:border-gray-800">

              <div className="flex items-center justify-between">

                <div>

                  <h2 className="text-lg font-bold">
                    {isAdmin
                      ? "Actividades administrativas"
                      : "Mis actividades"}
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Pendientes y actividades asignadas
                  </p>

                </div>

                <ClipboardList
                  size={22}
                  className="text-purple-600"
                />

              </div>

            </div>


            <div className="divide-y divide-gray-100 dark:divide-gray-800">

              {userActivities.map(
                (activity) => (

                  <div
                    key={activity.id}
                    className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                  >

                    <div className="flex items-start gap-4">

                      {/* ICONO */}

                      <div
                        className={`
                          w-10 h-10 rounded-xl
                          flex items-center justify-center
                          shrink-0
                          ${
                            activity.status ===
                            "completed"
                              ? "bg-green-100 text-green-600"
                              : activity.status ===
                                "in_progress"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-yellow-100 text-yellow-600"
                          }
                        `}
                      >

                        {activity.status ===
                        "completed" ? (
                          <CheckCircle2
                            size={19}
                          />
                        ) : activity.status ===
                          "in_progress" ? (
                          <ArrowRight
                            size={19}
                          />
                        ) : (
                          <Clock size={19} />
                        )}

                      </div>


                      {/* INFO */}

                      <div className="flex-1 min-w-0">

                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">

                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {activity.title}
                          </h3>

                          <span
                            className={`
                              text-xs font-semibold
                              px-2.5 py-1 rounded-full
                              w-fit
                              ${
                                activity.status ===
                                "completed"
                                  ? "bg-green-100 text-green-700"
                                  : activity.status ===
                                    "in_progress"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }
                            `}
                          >
                            {getStatusLabel(
                              activity.status
                            )}
                          </span>

                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {activity.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">

                          <span className="inline-flex items-center gap-1.5">

                            <CalendarDays
                              size={14}
                            />

                            {activity.date}

                          </span>

                          {activity.time && (
                            <span className="inline-flex items-center gap-1.5">

                              <Clock
                                size={14}
                              />

                              {activity.time}

                            </span>
                          )}

                          <span>
                            Prioridad:{" "}
                            <strong>
                              {getPriorityLabel(
                                activity.priority
                              )}
                            </strong>
                          </span>

                        </div>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          </div>


          {/* LATERAL */}

          <div className="space-y-6">

            {/* JUNTA */}

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">

              <div className="p-5 border-b border-gray-200 dark:border-gray-800">

                <div className="flex items-center gap-3">

                  <div className="w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">

                    <CalendarDays
                      size={21}
                      className="text-purple-600"
                    />

                  </div>

                  <div>

                    <h3 className="font-bold">
                      Próxima junta
                    </h3>

                    <p className="text-xs text-gray-500">
                      Administración
                    </p>

                  </div>

                </div>

              </div>

              <div className="p-5">

                <p className="text-2xl font-bold">
                  Hoy · 11:00 AM
                </p>

                <p className="text-sm text-gray-500 mt-2">
                  Junta de seguimiento del equipo.
                </p>

                <div className="mt-5 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">

                  <Users size={16} />

                  Dirección + equipo

                </div>

              </div>

            </div>


            {/* USUARIOS */}

            {isAdmin && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">

                <div className="p-5 border-b border-gray-200 dark:border-gray-800">

                  <div className="flex items-center justify-between">

                    <div>

                      <h3 className="font-bold">
                        Dirección
                      </h3>

                      <p className="text-xs text-gray-500 mt-1">
                        Usuarios con acceso de vista
                      </p>

                    </div>

                    <Users
                      size={20}
                      className="text-purple-600"
                    />

                  </div>

                </div>

                <div className="p-4 space-y-2">

                  {mockUsers.map(
                    (member) => (

                      <div
                        key={member.name}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                      >

                        <div>

                          <p className="font-medium text-sm">
                            {member.name}
                          </p>

                          <p className="text-xs text-gray-500">
                            {member.role}
                          </p>

                        </div>

                        <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          {member.activities}
                        </span>

                      </div>

                    )
                  )}

                </div>

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}