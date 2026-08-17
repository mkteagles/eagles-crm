'use client'

import {
  useState,
} from 'react'

import {
  useRouter,
} from 'next/navigation'

import {
  createClient,
} from '@/lib/supabase/client'

import {
  PRODUCT_CONFIG,
} from '@/lib/hooks'

import {
  ProductType,
} from '@/lib/types'

export default function NuevoLeadPage() {

  const router = useRouter()

  const supabase =
    createClient()

  const [
    form,
    setForm,
  ] = useState({

    full_name: '',
    phone_number: '',
    email: '',

    platform:
      'fb',

    campaign_name:
      '',

    product:
      'costa_rica' as ProductType,

    amount_paid:
      '0',

    notes:
      '',
  })

  const [
    submitting,
    setSubmitting,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<string | null>(null)


  /**
   * PRODUCTO ACTUAL
   */

  const productConfig =
    PRODUCT_CONFIG[
      form.product
    ]

  const price =
    productConfig.price

  const amountPaid =
    Number(
      form.amount_paid || 0
    )

  const balance =
    Math.max(
      price - amountPaid,
      0
    )


  /**
   * ESTADO DE PAGO
   */

  const paymentStatus =
    amountPaid <= 0
      ? 'unpaid'
      : amountPaid < price
      ? 'partial'
      : 'paid'


  /**
   * CAMBIOS DEL FORM
   */

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement |
      HTMLSelectElement
    >
  ) => {

    setForm({
      ...form,
      [e.target.name]:
        e.target.value,
    })
  }


  /**
   * CREAR LEAD
   */

  const handleSubmit =
    async (
      e: React.FormEvent
    ) => {

      e.preventDefault()

      setSubmitting(true)
      setError(null)


      if (
        amountPaid >
        price
      ) {

        setError(
          'El apartado no puede ser mayor que el precio del producto.'
        )

        setSubmitting(false)

        return
      }


      try {

        /**
         * Obtener usuario
         */

        const {
          data: {
            user,
          },
        } =
          await supabase.auth.getUser()


        if (!user) {

          throw new Error(
            'No hay una sesión activa.'
          )

        }


        /**
         * Crear lead
         */

        const {
          error:
            insertError,
        } =
          await supabase
            .from('leads')
            .insert({

              full_name:
                form.full_name,

              phone_number:
                form.phone_number,

              email:
                form.email ||
                null,

              platform:
                form.platform,

              campaign_name:
                form.campaign_name ||
                null,

              product:
                form.product,

              product_price:
                price,

              currency:
                productConfig.currency,

              amount_paid:
                amountPaid,

              payment_status:
                paymentStatus,

              notes:
                form.notes ||
                null,

              source:
                'manual',

              lead_status:
                'new',

              score:
                0,

            })


        if (insertError) {

          throw new Error(
            insertError.message
          )

        }


        /**
         * REGRESAR A VENTAS
         */

        router.push(
          `/app1/leads?product=${form.product}`
        )

        router.refresh()

      } catch (err) {

        setError(
          err instanceof Error
            ? err.message
            : 'No se pudo crear el lead.'
        )

      } finally {

        setSubmitting(false)

      }
    }


  return (

    <div className="max-w-2xl mx-auto p-6">

      {/* HEADER */}

      <div className="mb-6">

        <h1 className="text-2xl font-bold text-foreground">

          Nuevo lead

        </h1>

        <p className="text-sm text-foreground/60 mt-1">

          Agrega un nuevo prospecto al área de ventas.

        </p>

      </div>


      {/* FORM */}

      <form
        onSubmit={
          handleSubmit
        }
        className="
          bg-surface
          border
          border-border-color
          rounded-xl
          shadow-sm
          p-6
          space-y-5
        "
      >

        {/* NOMBRE */}

        <div>

          <label className="block text-sm font-medium mb-1 text-foreground">

            Nombre completo *

          </label>

          <input
            name="full_name"
            required
            value={
              form.full_name
            }
            onChange={
              handleChange
            }
            placeholder="Nombre del prospecto"
            className="
              w-full
              bg-background
              text-foreground
              border
              border-border-color
              rounded-lg
              p-2.5
              outline-none
              focus:ring-2
              focus:ring-brand-blue/30
            "
          />

        </div>


        {/* TELÉFONO */}

        <div>

          <label className="block text-sm font-medium mb-1 text-foreground">

            Teléfono (WhatsApp) *

          </label>

          <input
            name="phone_number"
            required
            value={
              form.phone_number
            }
            onChange={
              handleChange
            }
            placeholder="506..."
            className="
              w-full
              bg-background
              text-foreground
              border
              border-border-color
              rounded-lg
              p-2.5
              outline-none
              focus:ring-2
              focus:ring-brand-blue/30
            "
          />

          <p className="text-xs text-foreground/50 mt-1">

            Incluye el código de país.

          </p>

        </div>


        {/* EMAIL */}

        <div>

          <label className="block text-sm font-medium mb-1 text-foreground">

            Email

          </label>

          <input
            type="email"
            name="email"
            value={
              form.email
            }
            onChange={
              handleChange
            }
            placeholder="correo@ejemplo.com"
            className="
              w-full
              bg-background
              text-foreground
              border
              border-border-color
              rounded-lg
              p-2.5
            "
          />

        </div>


        {/* PLATAFORMA */}

        <div>

          <label className="block text-sm font-medium mb-1 text-foreground">

            Plataforma

          </label>

          <select
            name="platform"
            value={
              form.platform
            }
            onChange={
              handleChange
            }
            className="
              w-full
              bg-background
              text-foreground
              border
              border-border-color
              rounded-lg
              p-2.5
            "
          >

            <option value="fb">
              Facebook
            </option>

            <option value="ig">
              Instagram
            </option>

            <option value="whatsapp">
              WhatsApp
            </option>

            <option value="hotmart">
              Hotmart
            </option>

            <option value="manychat">
              ManyChat
            </option>

            <option value="other">
              Otro
            </option>

          </select>

        </div>


        {/* PRODUCTO */}

        <div>

          <label className="block text-sm font-medium mb-1 text-foreground">

            Producto *

          </label>

          <select
            name="product"
            value={
              form.product
            }
            onChange={
              handleChange
            }
            required
            className="
              w-full
              bg-background
              text-foreground
              border
              border-border-color
              rounded-lg
              p-2.5
            "
          >

            <option value="costa_rica">
              🇨🇷 Costa Rica
            </option>

            <option value="workshop">
              🎓 Workshop
            </option>

            <option value="empresarial">
              🏢 Empresarial
            </option>

          </select>

        </div>


        {/* INFORMACIÓN DE PAGO */}

        <div
          className="
            bg-foreground/5
            border
            border-border-color
            rounded-xl
            p-5
            space-y-4
          "
        >

          <div>

            <h2 className="font-bold text-foreground">

              Información comercial

            </h2>

            <p className="text-xs text-foreground/50 mt-1">

              El precio se asigna automáticamente según el producto.

            </p>

          </div>


          {/* PRECIO */}

          <div className="grid grid-cols-2 gap-4">

            <div>

              <p className="text-xs text-foreground/50">

                Precio

              </p>

              <p className="text-xl font-bold text-foreground">

                {new Intl.NumberFormat(
                  'es-MX',
                  {
                    style:
                      'currency',
                    currency:
                      productConfig.currency,
                  }
                ).format(price)}

              </p>

            </div>


            <div>

              <label className="text-xs text-foreground/50">

                Apartado / pagado

              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                name="amount_paid"
                value={
                  form.amount_paid
                }
                onChange={
                  handleChange
                }
                className="
                  w-full
                  mt-1
                  bg-background
                  text-foreground
                  border
                  border-border-color
                  rounded-lg
                  p-2
                "
              />

            </div>

          </div>


          {/* SALDO */}

          <div
            className="
              border-t
              border-border-color
              pt-4
              flex
              items-center
              justify-between
            "
          >

            <div>

              <p className="text-xs text-foreground/50">

                Saldo pendiente

              </p>

              <p
                className={`
                  text-xl
                  font-bold
                  ${
                    balance > 0
                      ? 'text-brand-orange'
                      : 'text-green-500'
                  }
                `}
              >

                {new Intl.NumberFormat(
                  'es-MX',
                  {
                    style:
                      'currency',
                    currency:
                      productConfig.currency,
                  }
                ).format(balance)}

              </p>

            </div>


            <span
              className={`
                px-3
                py-1
                rounded-full
                text-xs
                font-bold
                text-white
                ${
                  paymentStatus ===
                  'paid'
                    ? 'bg-green-500'
                    : paymentStatus ===
                      'partial'
                    ? 'bg-brand-orange'
                    : 'bg-gray-500'
                }
              `}
            >

              {
                paymentStatus ===
                'paid'
                  ? 'Pagado'
                  : paymentStatus ===
                    'partial'
                  ? 'Pago parcial'
                  : 'Sin pago'
              }

            </span>

          </div>

        </div>


        {/* CAMPAÑA */}

        <div>

          <label className="block text-sm font-medium mb-1 text-foreground">

            Campaña

          </label>

          <input
            name="campaign_name"
            value={
              form.campaign_name
            }
            onChange={
              handleChange
            }
            placeholder="Nombre de la campaña"
            className="
              w-full
              bg-background
              text-foreground
              border
              border-border-color
              rounded-lg
              p-2.5
            "
          />

        </div>


        {/* NOTAS */}

        <div>

          <label className="block text-sm font-medium mb-1 text-foreground">

            Notas

          </label>

          <textarea
            name="notes"
            value={
              form.notes
            }
            onChange={
              handleChange
            }
            rows={4}
            placeholder="Información adicional..."
            className="
              w-full
              bg-background
              text-foreground
              border
              border-border-color
              rounded-lg
              p-2.5
            "
          />

        </div>


        {/* ERROR */}

        {error && (

          <div
            className="
              bg-red-500/10
              border
              border-red-500/30
              text-red-500
              rounded-lg
              p-3
              text-sm
            "
          >

            {error}

          </div>

        )}


        {/* BOTÓN */}

        <button
          type="submit"
          disabled={
            submitting
          }
          className="
            w-full
            bg-brand-blue
            text-white
            p-3
            rounded-lg
            font-bold
            hover:opacity-90
            disabled:opacity-50
            disabled:cursor-not-allowed
          "
        >

          {submitting
            ? 'Guardando...'
            : 'Crear lead'}

        </button>

      </form>

    </div>

  )
}