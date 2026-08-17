'use client'

import {
  Bell,
  Check,
  CheckCheck,
  X,
  ExternalLink,
} from 'lucide-react'

import {
  useActivityNotifications,
  type NotificationItem,
} from '@/lib/use-activity-notifications'

import { useRouter } from 'next/navigation'

// =========================================================
// USUARIO
// =========================================================

interface User {
  id: string
  full_name?: string | null
  role?: string | null
}

// =========================================================
// PROPS
// =========================================================

interface ActivityNotificationsProps {
  user: User | null
}

// =========================================================
// COMPONENTE
// =========================================================

export default function ActivityNotifications({
  user,
}: ActivityNotificationsProps) {

  const router = useRouter()

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useActivityNotifications(user)

  // =======================================================
  // SIN USUARIO
  // =======================================================

  if (!user) {
    return null
  }

  // =======================================================
  // ABRIR ACTIVIDAD
  // =======================================================

  function handleNotificationClick(
    notification: NotificationItem
  ) {

    // -----------------------------------------------------
    // MARCAR COMO LEÍDA
    // -----------------------------------------------------

    if (!notification.read) {
      markAsRead(notification)
    }

    // -----------------------------------------------------
    // OBTENER ID DE ACTIVIDAD
    // -----------------------------------------------------

    const activityId =
      String(
        notification.activityId
      )

    // -----------------------------------------------------
    // CERRAR EL DETAILS
    // -----------------------------------------------------

    const details =
      document.querySelector(
        'details[data-activity-notifications]'
      ) as HTMLDetailsElement | null

    if (details) {
      details.open = false
    }

    // -----------------------------------------------------
    // IR A MARKETING
    // -----------------------------------------------------

    router.push(
      `/app1/marketing?activityId=${encodeURIComponent(
        activityId
      )}`
    )
  }

  return (
    <div className="relative">

      <details
        className="relative"
        data-activity-notifications
      >

        {/* =================================================
            CAMPANA
        ================================================= */}

        <summary
          className="
            relative
            flex
            h-9
            w-9
            cursor-pointer
            list-none
            items-center
            justify-center
            rounded-md
            text-foreground/70
            transition-colors
            hover:bg-foreground/5
            hover:text-foreground
          "
          title="Notificaciones"
        >

          <Bell size={19} />

          {/* =================================================
              CONTADOR
          ================================================= */}

          {unreadCount > 0 && (
            <span
              className="
                absolute
                -right-1
                -top-1
                flex
                h-5
                min-w-5
                items-center
                justify-center
                rounded-full
                bg-red-500
                px-1
                text-[10px]
                font-bold
                text-white
              "
            >

              {unreadCount > 99
                ? '99+'
                : unreadCount}

            </span>
          )}

        </summary>

        {/* =================================================
            PANEL
        ================================================= */}

        <div
          className="
            absolute
            right-0
            z-50
            mt-2
            w-96
            overflow-hidden
            rounded-xl
            border
            border-border-color
            bg-surface
            shadow-xl
          "
        >

          {/* =================================================
              HEADER
          ================================================= */}

          <div
            className="
              flex
              items-center
              justify-between
              border-b
              border-border-color
              px-4
              py-3
            "
          >

            <div>

              <h3
                className="
                  font-semibold
                  text-foreground
                "
              >
                Notificaciones
              </h3>

              <p
                className="
                  text-xs
                  text-foreground/50
                "
              >

                {unreadCount === 0
                  ? 'No tienes pendientes'
                  : `${unreadCount} sin leer`}

              </p>

            </div>

            {unreadCount > 0 && (

              <button
                type="button"
                onClick={
                  markAllAsRead
                }
                className="
                  flex
                  items-center
                  gap-1
                  text-xs
                  text-blue-600
                  hover:text-blue-800
                "
              >

                <CheckCheck
                  className="h-4 w-4"
                />

                Marcar todas

              </button>

            )}

          </div>

          {/* =================================================
              LISTA
          ================================================= */}

          <div
            className="
              max-h-[420px]
              overflow-y-auto
            "
          >

            {notifications.length === 0 ? (

              /* =================================================
                  SIN NOTIFICACIONES
              ================================================= */

              <div
                className="
                  flex
                  flex-col
                  items-center
                  justify-center
                  px-6
                  py-12
                  text-center
                "
              >

                <Bell
                  className="
                    mb-3
                    h-10
                    w-10
                    text-foreground/20
                  "
                />

                <p
                  className="
                    font-medium
                    text-foreground/60
                  "
                >
                  Sin notificaciones
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    text-foreground/40
                  "
                >
                  Aquí aparecerán los
                  cambios importantes
                  de tus actividades.
                </p>

              </div>

            ) : (

              /* =================================================
                  NOTIFICACIONES
              ================================================= */

              notifications.map(
                (
                  notification: NotificationItem
                ) => (

                  <div
                    key={
                      notification.id
                    }
                    className={`
                      border-b
                      border-border-color
                      px-4
                      py-4
                      transition
                      ${
                        notification.read
                          ? 'bg-surface'
                          : 'bg-blue-50 dark:bg-blue-950/20'
                      }
                    `}
                  >

                    <div
                      className="
                        flex
                        gap-3
                      "
                    >

                      {/* =========================================
                          ICONO
                      ========================================= */}

                      <div
                        className="
                          mt-1
                          shrink-0
                        "
                      >

                        {notification.type ===
                          'completed' && (

                          <div
                            className="
                              flex
                              h-8
                              w-8
                              items-center
                              justify-center
                              rounded-full
                              bg-green-100
                            "
                          >

                            <Check
                              className="
                                h-4
                                w-4
                                text-green-600
                              "
                            />

                          </div>

                        )}

                        {notification.type ===
                          'approved' && (

                          <div
                            className="
                              flex
                              h-8
                              w-8
                              items-center
                              justify-center
                              rounded-full
                              bg-green-100
                            "
                          >

                            <CheckCheck
                              className="
                                h-4
                                w-4
                                text-green-600
                              "
                            />

                          </div>

                        )}

                        {notification.type ===
                          'rejected' && (

                          <div
                            className="
                              flex
                              h-8
                              w-8
                              items-center
                              justify-center
                              rounded-full
                              bg-red-100
                            "
                          >

                            <X
                              className="
                                h-4
                                w-4
                                text-red-600
                              "
                            />

                          </div>

                        )}

                        {notification.type ===
                          'assigned' && (

                          <div
                            className="
                              flex
                              h-8
                              w-8
                              items-center
                              justify-center
                              rounded-full
                              bg-blue-100
                            "
                          >

                            <Bell
                              className="
                                h-4
                                w-4
                                text-blue-600
                              "
                            />

                          </div>

                        )}

                        {notification.type ===
                          'updated' && (

                          <div
                            className="
                              flex
                              h-8
                              w-8
                              items-center
                              justify-center
                              rounded-full
                              bg-gray-100
                            "
                          >

                            <Bell
                              className="
                                h-4
                                w-4
                                text-gray-600
                              "
                            />

                          </div>

                        )}

                      </div>

                      {/* =========================================
                          CONTENIDO
                      ========================================= */}

                      <div
                        className="
                          min-w-0
                          flex-1
                        "
                      >

                        {/* =======================================
                            NOTIFICACIÓN CLICKEABLE
                        ======================================= */}

                        <button
                          type="button"
                          onClick={() =>
                            handleNotificationClick(
                              notification
                            )
                          }
                          className="
                            -m-2
                            w-[calc(100%+1rem)]
                            rounded-lg
                            p-2
                            text-left
                            transition
                            hover:bg-foreground/5
                          "
                        >

                          <div
                            className="
                              flex
                              items-start
                              justify-between
                              gap-2
                            "
                          >

                            <p
                              className={`
                                text-sm
                                ${
                                  notification.read
                                    ? 'text-foreground/60'
                                    : 'font-medium text-foreground'
                                }
                              `}
                            >
                              {
                                notification.message
                              }
                            </p>

                            <ExternalLink
                              className="
                                mt-0.5
                                h-4
                                w-4
                                shrink-0
                                text-blue-500
                              "
                            />

                          </div>

                          <p
                            className="
                              mt-1
                              text-xs
                              text-foreground/40
                            "
                          >

                            {new Date(
                              notification.createdAt
                            ).toLocaleString(
                              'es-MX',
                              {
                                dateStyle:
                                  'short',

                                timeStyle:
                                  'short',
                              }
                            )}

                          </p>

                          <p
                            className="
                              mt-2
                              text-xs
                              font-medium
                              text-blue-600
                            "
                          >
                            Abrir actividad →
                          </p>

                        </button>

                        {/* =======================================
                            ACCIONES
                        ======================================= */}

                        <div
                          className="
                            mt-3
                            flex
                            items-center
                            gap-3
                          "
                        >

                          {!notification.read && (

                            <button
                              type="button"
                              onClick={() =>
                                markAsRead(
                                  notification
                                )
                              }
                              className="
                                text-xs
                                font-medium
                                text-blue-600
                                hover:text-blue-800
                              "
                            >
                              Marcar como
                              leída
                            </button>

                          )}

                          <button
                            type="button"
                            onClick={() =>
                              removeNotification(
                                notification.id
                              )
                            }
                            className="
                              text-xs
                              text-foreground/40
                              hover:text-foreground/70
                            "
                          >
                            Ocultar
                          </button>

                        </div>

                      </div>

                    </div>

                  </div>

                )
              )

            )}

          </div>

        </div>

      </details>

    </div>
  )
}