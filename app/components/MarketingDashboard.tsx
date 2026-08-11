'use client'

import {
  useCurrentUser,
} from '@/lib/marketing-hooks'

import {
  useState,
} from 'react'

import ActivitiesTable from '@/components/ActivitiesTable'
import CreateActivityModal from '@/components/CreateActivityModal'
import FixedActivitiesModal from '@/components/FixedActivitiesModal'
import ContentSuggestions from '@/components/ContentSuggestions'
import ActivityIdeas from '@/components/ActivityIdeas'

import {
  Calendar,
  FileText,
  Loader,
  Plus,
  Sparkles,
  Lightbulb,
} from 'lucide-react'

import Link from 'next/link'


// =========================================================
// COMPONENTE
// =========================================================

export default function MarketingDashboard() {


  // =======================================================
  // USUARIO
  // =======================================================

  const {
    user,
    loading: userLoading,
  } =
    useCurrentUser()


  // =======================================================
  // MODAL CREAR ACTIVIDAD
  // =======================================================

  const [
    showCreateModal,
    setShowCreateModal,
  ] =
    useState(false)


  // =======================================================
  // MODAL ACTIVIDADES FIJAS
  // =======================================================

  const [
    showFixedActivitiesModal,
    setShowFixedActivitiesModal,
  ] =
    useState(false)


  // =======================================================
  // REFRESH
  // =======================================================

  const [
    refreshKey,
    setRefreshKey,
  ] =
    useState(0)


  // =======================================================
  // IDEAS ABIERTAS / CERRADAS
  // =======================================================

  const [
    showIdeas,
    setShowIdeas,
  ] =
    useState(false)


  // =======================================================
  // SUGERENCIAS ABIERTAS / CERRADAS
  // =======================================================

  const [
    showSuggestions,
    setShowSuggestions,
  ] =
    useState(false)


  // =======================================================
  // ACTIVIDAD CREADA
  // =======================================================

  const handleSuccess =
    () => {

      setRefreshKey(
        (prev) =>
          prev + 1,
      )

      setShowCreateModal(
        false,
      )

    }


  // =======================================================
  // ACTIVIDAD FIJA CREADA
  // =======================================================

  const handleFixedActivitySuccess =
    () => {

      setRefreshKey(
        (prev) =>
          prev + 1,
      )

      setShowFixedActivitiesModal(
        false,
      )

    }


  // =======================================================
  // CARGANDO USUARIO
  // =======================================================

  if (userLoading) {

    return (

      <div
        className="
          flex
          items-center
          justify-center
          py-12
        "
      >

        <Loader
          className="
            mr-2
            animate-spin
          "
          size={24}
        />

        <p>
          Cargando datos...
        </p>

      </div>

    )

  }


  // =======================================================
  // SIN USUARIO
  // =======================================================

  if (!user) {

    return (

      <div
        className="
          flex
          flex-col
          items-center
          justify-center
          gap-4
          py-12
        "
      >

        <p>
          No autenticado
        </p>

        <Link
          href="/login"
          className="
            rounded-lg
            bg-blue-600
            px-4 py-2
            text-white
            transition
            hover:bg-blue-700
          "
        >
          Ir al Login
        </Link>

      </div>

    )

  }


  // =======================================================
  // PERMISOS
  // =======================================================

  const canCreateIdeas =
    [
      'marcos',
      'ursula',
      'úrsula',
    ].includes(
      user.full_name
        .trim()
        .toLowerCase(),
    )


  const isAdmin =
    user.role === 'admin'


  // =======================================================
  // RENDER
  // =======================================================

  return (

    <div
      className="
        space-y-6
      "
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <div>

        <h1
          className="
            text-2xl
            font-bold
            text-gray-900
            dark:text-white
          "
        >
          🎯 Marketing - Actividades
        </h1>


        <p
          className="
            mt-1
            text-sm
            text-gray-500
            dark:text-gray-400
          "
        >

          Bienvenido,{' '}

          <span
            className="
              font-semibold
            "
          >
            {user.full_name}
          </span>{' '}

          {user.role}

        </p>

      </div>


      {/* =================================================
          BOTONES
      ================================================= */}

      <div
        className="
          flex
          flex-wrap
          gap-3
        "
      >

        {/* CREAR ACTIVIDAD */}

        {isAdmin && (

          <button
            type="button"
            onClick={() =>
              setShowCreateModal(
                true,
              )
            }
            className="
              flex
              items-center
              gap-2
              rounded-lg
              bg-blue-600
              px-4 py-2
              font-semibold
              text-white
              transition
              hover:bg-blue-700
            "
          >

            <Plus
              size={20}
            />

            Crear Actividad

          </button>

        )}


        {/* ACTIVIDADES FIJAS */}

        {isAdmin && (

          <button
            type="button"
            onClick={() =>
              setShowFixedActivitiesModal(
                true,
              )
            }
            className="
              flex
              items-center
              gap-2
              rounded-lg
              bg-indigo-600
              px-4 py-2
              font-semibold
              text-white
              transition
              hover:bg-indigo-700
            "
          >

            <Sparkles
              size={20}
            />

            Actividades Fijas

          </button>

        )}


        {/* IDEAS */}

        {(canCreateIdeas ||
          isAdmin) && (

          <button
            type="button"
            onClick={() =>
              setShowIdeas(
                (prev) =>
                  !prev,
              )
            }
            className="
              flex
              items-center
              gap-2
              rounded-lg
              bg-amber-500
              px-4 py-2
              font-semibold
              text-white
              transition
              hover:bg-amber-600
            "
          >

            <Lightbulb
              size={20}
            />

            Ideas

          </button>

        )}


        {/* SUGERENCIAS */}

        <button
          type="button"
          onClick={() =>
            setShowSuggestions(
              (prev) =>
                !prev,
            )
          }
          className="
            flex
            items-center
            gap-2
            rounded-lg
            bg-pink-600
            px-4 py-2
            font-semibold
            text-white
            transition
            hover:bg-pink-700
          "
        >

          <Sparkles
            size={20}
          />

          Sugerencias

        </button>


        {/* CALENDARIO */}

        <Link
          href="/app1/marketing/calendar"
          className="
            flex
            items-center
            gap-2
            rounded-lg
            bg-purple-600
            px-4 py-2
            font-semibold
            text-white
            transition
            hover:bg-purple-700
          "
        >

          <Calendar
            size={20}
          />

          Calendario

        </Link>


        {/* REPORTE EJECUTOR */}

        {user.role ===
          'executor' && (

          <Link
            href="/app1/marketing/reports"
            className="
              flex
              items-center
              gap-2
              rounded-lg
              bg-green-600
              px-4 py-2
              font-semibold
              text-white
              transition
              hover:bg-green-700
            "
          >

            <FileText
              size={20}
            />

            Generar Reporte

          </Link>

        )}


        {/* REPORTES ADMIN */}

        {isAdmin && (

          <Link
            href="/app1/marketing/reports"
            className="
              flex
              items-center
              gap-2
              rounded-lg
              bg-orange-600
              px-4 py-2
              font-semibold
              text-white
              transition
              hover:bg-orange-700
            "
          >

            <FileText
              size={20}
            />

            Reportes

          </Link>

        )}

      </div>


      {/* =================================================
          IDEAS
      ================================================= */}

      {showIdeas && (

        <ActivityIdeas
          userId={
            user.id
          }
          userName={
            user.full_name
          }
          role={
            user.role
          }
          refreshKey={
            refreshKey
          }
        />

      )}


      {/* =================================================
          SUGERENCIAS
      ================================================= */}

      {showSuggestions && (

        <section
          id="content-suggestions"
        >

          <ContentSuggestions
            refreshKey={
              refreshKey
            }
          />

        </section>

      )}


      {/* =================================================
          ACTIVIDADES
      ================================================= */}

      <ActivitiesTable
        key={
          refreshKey
        }
      />


      {/* =================================================
          MODAL CREAR ACTIVIDAD
      ================================================= */}

      <CreateActivityModal
        isOpen={
          showCreateModal
        }
        onClose={() =>
          setShowCreateModal(
            false,
          )
        }
        onSuccess={
          handleSuccess
        }
      />


      {/* =================================================
          MODAL ACTIVIDADES FIJAS
      ================================================= */}

      <FixedActivitiesModal
        isOpen={
          showFixedActivitiesModal
        }
        onClose={() =>
          setShowFixedActivitiesModal(
            false,
          )
        }
        onSuccess={
          handleFixedActivitySuccess
        }
      />

    </div>

  )

}