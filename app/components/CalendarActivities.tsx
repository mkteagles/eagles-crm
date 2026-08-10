
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useActivities } from "@/lib/marketing-hooks";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarActivities() {
  const router = useRouter();
  const { activities, loading } = useActivities();
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    return new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    ).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      1
    ).getDay();
  };

  const handleActivityClick = (activityId: unknown) => {
    const id = String(activityId);

    router.push(
      "/app1/marketing/activities/" + id
    );
  };

  const days: Array<number | null> = [];

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  // Espacios antes del primer día del mes
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Días del mes
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // Agrupar actividades por fecha
  const groupedActivities: Record<string, any[]> = {};

  activities.forEach((activity: any) => {
    if (!activity || !activity.due_date) {
      return;
    }

    const dateStr = String(activity.due_date).split("T")[0];

    if (!dateStr) {
      return;
    }

    if (!groupedActivities[dateStr]) {
      groupedActivities[dateStr] = [];
    }

    groupedActivities[dateStr].push(activity);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* CALENDARIO */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-lg shadow p-6">

        {/* ENCABEZADO */}
        <div className="flex items-center justify-between mb-6">

          <button
            type="button"
            onClick={() => {
              setCurrentDate(
                new Date(
                  currentDate.getFullYear(),
                  currentDate.getMonth() - 1,
                  1
                )
              );
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
            {currentDate.toLocaleDateString("es-MX", {
              month: "long",
              year: "numeric",
            })}
          </h2>

          <button
            type="button"
            onClick={() => {
              setCurrentDate(
                new Date(
                  currentDate.getFullYear(),
                  currentDate.getMonth() + 1,
                  1
                )
              );
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

        </div>

        {/* DIAS DE LA SEMANA */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {[
            "Dom",
            "Lun",
            "Mar",
            "Mié",
            "Jue",
            "Vie",
            "Sab",
          ].map((dayName) => (
            <div
              key={dayName}
              className="text-center font-semibold text-gray-600 dark:text-gray-400 text-sm py-2"
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* DIAS DEL MES */}
        <div className="grid grid-cols-7 gap-2">

          {days.map((day, index) => {
            let dateStr = "";

            if (day !== null) {
              const year = currentDate.getFullYear();

              const month = String(
                currentDate.getMonth() + 1
              ).padStart(2, "0");

              const dayNumber = String(day).padStart(2, "0");

              dateStr =
                String(year) +
                "-" +
                month +
                "-" +
                dayNumber;
            }

            const dayActivities =
              dateStr !== ""
                ? groupedActivities[dateStr] || []
                : [];

            return (
              <div
                key={index}
                className="aspect-square border border-gray-200 dark:border-gray-700 rounded-lg p-2 flex flex-col bg-gray-50 dark:bg-gray-800"
              >

                {day !== null && (
                  <>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {day}
                    </span>

                    {dayActivities.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          handleActivityClick(
                            dayActivities[0].id
                          );
                        }}
                        className="text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 text-xs font-medium mt-1 cursor-pointer transition text-left"
                      >
                        {dayActivities.length} actividad
                        {dayActivities.length > 1 ? "es" : ""}
                      </button>
                    )}
                  </>
                )}

              </div>
            );
          })}

        </div>
      </div>

      {/* PANEL DERECHO */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">

        <h3 className="font-bold text-gray-900 dark:text-white mb-4">
          Actividades
        </h3>

        <div className="space-y-3">

          {loading ? (

            <p className="text-gray-500 dark:text-gray-400">
              Cargando...
            </p>

          ) : Object.keys(groupedActivities).length === 0 ? (

            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Sin actividades
            </p>

          ) : (

            Object.entries(groupedActivities)
              .slice(0, 5)
              .map(([date, acts]) => (

                <div
                  key={date}
                  className="space-y-2"
                >

                  {acts.map((activity: any) => (

                    <button
                      type="button"
                      key={String(activity.id)}
                      onClick={() => {
                        handleActivityClick(
                          activity.id
                        );
                      }}
                      className="w-full text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >

                      <div className="font-medium text-gray-900 dark:text-white text-sm">
                        {activity.title || "Sin título"}
                      </div>

                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {date}
                      </div>

                    </button>

                  ))}

                </div>

              ))

          )}

        </div>
      </div>

    </div>
  );
}

