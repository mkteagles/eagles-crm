'use client'

import { useState } from 'react'

import Link from 'next/link'

import {
  ArrowLeft,
  Video,
  Film,
  Plus,
} from 'lucide-react'

import ActivitiesTable from '@/components/ActivitiesTable'
import CreateActivityModal from '@/components/CreateActivityModal'


export default function EdicionVideoPage() {

  const [
    showCreateModal,
    setShowCreateModal,
  ] = useState(false)


  const [
    refreshKey,
    setRefreshKey,
  ] = useState(0)


  // =====================================================
  // ACTIVIDAD CREADA
  // =====================================================

  const handleActivityCreated = () => {

    setRefreshKey(
      (current) => current + 1
    )

  }


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div
      className="
        min-h-screen
        bg-gray-50
        dark:bg-gray-950
      "
    >

      <div
        className="
          mx-auto
          max-w-7xl
          px-6
          py-10
        "
      >


        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-8">


          {/* VOLVER */}

          <Link
            href="/app1"
            className="
              inline-flex
              items-center
              gap-2
              text-sm
              font-semibold
              text-gray-500
              transition
              hover:text-gray-900
              dark:text-gray-400
              dark:hover:text-white
            "
          >

            <ArrowLeft
              size={18}
            />

            Volver al inicio

          </Link>


          {/* TITULO */}

          <div
            className="
              mt-6
              flex
              items-center
              justify-between
              gap-4
            "
          >

            <div
              className="
                flex
                items-center
                gap-4
              "
            >

              <div
                className="
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-2xl
                  bg-orange-100
                  dark:bg-orange-900/30
                "
              >

                <Video
                  size={28}
                  className="
                    text-orange-600
                    dark:text-orange-400
                  "
                />

              </div>


              <div>

                <p
                  className="
                    text-sm
                    font-semibold
                    text-orange-600
                    dark:text-orange-400
                  "
                >
                  PRODUCCIÓN
                </p>


                <h1
                  className="
                    text-3xl
                    font-bold
                    text-gray-900
                    dark:text-white
                  "
                >
                  Edición de Video
                </h1>

              </div>

            </div>


            {/* =====================================================
                NUEVA ACTIVIDAD
            ===================================================== */}

            <button
              type="button"
              onClick={() =>
                setShowCreateModal(true)
              }
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-blue-600
                px-5
                py-3
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-blue-700
              "
            >

              <Plus
                size={18}
              />

              Nueva actividad

            </button>

          </div>


          <p
            className="
              mt-4
              text-gray-500
              dark:text-gray-400
            "
          >
            Gestiona las actividades de edición de video que Hugo asigne a Chuy.
          </p>

        </div>


        {/* =====================================================
            ACTIVIDADES DE CHUY
        ===================================================== */}

        <div
          className="
            overflow-hidden
            rounded-2xl
            border
            border-gray-200
            bg-white
            shadow-sm
            dark:border-gray-800
            dark:bg-gray-900
          "
        >

          {/* HEADER TABLA */}

          <div
            className="
              border-b
              border-gray-200
              p-6
              dark:border-gray-800
            "
          >

            <div
              className="
                flex
                items-center
                gap-3
              "
            >

              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-orange-100
                  dark:bg-orange-900/30
                "
              >

                <Film
                  size={20}
                  className="
                    text-orange-600
                    dark:text-orange-400
                  "
                />

              </div>


              <div>

                <h2
                  className="
                    text-lg
                    font-bold
                    text-gray-900
                    dark:text-white
                  "
                >
                  Actividades de Chuy
                </h2>


                <p
                  className="
                    text-sm
                    text-gray-500
                    dark:text-gray-400
                  "
                >
                  Actividades asignadas para edición de video.
                </p>

              </div>

            </div>

          </div>


          {/* TABLA */}

          <div className="p-6">

            <ActivitiesTable
              key={refreshKey}
              area="video_editing"
            />

          </div>

        </div>


        {/* =====================================================
            PRODUCCIÓN
        ===================================================== */}

        <div
          className="
            mt-6
            rounded-2xl
            border
            border-gray-200
            bg-white
            p-7
            shadow-sm
            dark:border-gray-800
            dark:bg-gray-900
          "
        >

          <div
            className="
              mb-5
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-xl
              bg-blue-100
              dark:bg-blue-900/30
            "
          >

            <Film
              size={24}
              className="
                text-blue-600
                dark:text-blue-400
              "
            />

          </div>


          <h2
            className="
              text-xl
              font-bold
              text-gray-900
              dark:text-white
            "
          >
            Producción
          </h2>


          <p
            className="
              mt-2
              text-sm
              text-gray-500
              dark:text-gray-400
            "
          >
            Aquí construiremos el flujo de edición y entrega de videos.
          </p>

        </div>

      </div>


      {/* =====================================================
          MODAL
      ===================================================== */}

      <CreateActivityModal
        isOpen={
          showCreateModal
        }

        onClose={() =>
          setShowCreateModal(false)
        }

        onSuccess={
          handleActivityCreated
        }
      />

    </div>

  )

}