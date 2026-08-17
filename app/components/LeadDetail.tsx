'use client'

import {
  useMemo,
  useState,
} from 'react'

import {
  Phone,
  Mail,
  Calendar,
  MessageCircle,
  Pencil,
  Save,
  X,
  CheckCircle2,
} from 'lucide-react'

import type {
  Lead,
  Interaction,
  ProductType,
} from '@/lib/types'

import {
  PRODUCT_CONFIG,
} from '@/lib/hooks'

import {
  createClient,
} from '@/lib/supabase/client'


// =======================================================
// PROPS
// =======================================================

interface LeadDetailProps {
  lead: Lead
  interactions: Interaction[]
  onSaved?: () => void
}


// =======================================================
// COMPONENTE
// =======================================================

export function LeadDetail({
  lead,
  interactions,
  onSaved,
}: LeadDetailProps) {

  // =====================================================
  // SUPABASE
  // =====================================================

  const supabase = useMemo(
    () => createClient(),
    []
  )


  // =====================================================
  // ESTADOS
  // =====================================================

  const [
    editing,
    setEditing,
  ] = useState(false)

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<string | null>(null)

  const [
    saved,
    setSaved,
  ] = useState(false)


  // =====================================================
  // CREAR FORMULARIO
  // =====================================================

  const createFormFromLead = () => ({
    full_name:
      lead.full_name || '',

    phone_number:
      lead.phone_number || '',

    email:
      lead.email || '',

    product:
      lead.product as ProductType,

    amount_paid:
      String(
        lead.amount_paid ?? 0
      ),

    campaign_name:
      lead.campaign_name || '',

    notes:
      lead.notes || '',

    lead_status:
      lead.lead_status || 'new',
  })


  // =====================================================
  // FORM
  // =====================================================

  const [
    form,
    setForm,
  ] = useState(
    createFormFromLead
  )


  // =====================================================
  // CONFIG PRODUCTO
  // =====================================================

  const productConfig =
    PRODUCT_CONFIG[
      form.product
    ]


  // =====================================================
  // PRECIO
  // =====================================================

  const price =
    Number(
      productConfig?.price ??
      lead.product_price ??
      0
    )


  // =====================================================
  // PAGADO
  // =====================================================

  const amountPaid =
    Number(
      form.amount_paid || 0
    )


  // =====================================================
  // SALDO
  // =====================================================

  const balance =
    Math.max(
      price - amountPaid,
      0
    )


  // =====================================================
  // ESTADO DE PAGO
  // =====================================================

  const paymentStatus =
    amountPaid <= 0
      ? 'unpaid'
      : amountPaid >= price
      ? 'paid'
      : 'partial'


  // =====================================================
  // ENGAGEMENT
  // =====================================================

  const engagementLevel =
    useMemo(() => {

      const metrics =
        lead.lead_metrics

      if (!metrics) {
        return 'low'
      }

      if (Array.isArray(metrics)) {

        return (
          metrics[0]?.engagement_level ||
          'low'
        )

      }

      return (
        metrics.engagement_level ||
        'low'
      )

    }, [
      lead.lead_metrics,
    ])


  // =====================================================
  // CAMBIAR FORM
  // =====================================================

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement |
      HTMLSelectElement
    >
  ) {

    const {
      name,
      value,
    } = e.target

    setForm(
      previous => ({
        ...previous,
        [name]: value,
      })
    )
  }


  // =====================================================
  // INICIAR EDICIÓN
  // =====================================================

  function startEditing() {

    setForm(
      createFormFromLead()
    )

    setError(null)
    setSaved(false)

    setEditing(true)
  }


  // =====================================================
  // CANCELAR
  // =====================================================

  function cancelEditing() {

    if (saving) {
      return
    }

    setForm(
      createFormFromLead()
    )

    setError(null)
    setSaved(false)

    setEditing(false)
  }


  // =====================================================
  // GUARDAR
  // =====================================================

  async function handleSave() {

    if (saving) {
      return
    }

    setSaving(true)
    setError(null)
    setSaved(false)

    try {

      // =================================================
      // VALIDAR NOMBRE
      // =================================================

      if (
        !form.full_name.trim()
      ) {

        throw new Error(
          'El nombre es obligatorio.'
        )
      }


      // =================================================
      // VALIDAR TELÉFONO
      // =================================================

      if (
        !form.phone_number.trim()
      ) {

        throw new Error(
          'El teléfono es obligatorio.'
        )
      }


      // =================================================
      // VALIDAR PRODUCTO
      // =================================================

      if (!productConfig) {

        throw new Error(
          'El producto seleccionado no tiene configuración.'
        )
      }


      // =================================================
      // VALIDAR MONTO
      // =================================================

      if (
        !Number.isFinite(
          amountPaid
        )
      ) {

        throw new Error(
          'El monto pagado no es válido.'
        )
      }


      if (
        amountPaid < 0
      ) {

        throw new Error(
          'El monto pagado no puede ser negativo.'
        )
      }


      if (
        amountPaid > price
      ) {

        throw new Error(
          'El monto pagado no puede ser mayor al precio del producto.'
        )
      }


      // =================================================
      // PAYLOAD
      // =================================================

      const updatePayload = {

        full_name:
          form.full_name.trim(),

        phone_number:
          form.phone_number.trim(),

        email:
          form.email.trim() ||
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

        campaign_name:
          form.campaign_name.trim() ||
          null,

        notes:
          form.notes.trim() ||
          null,

        lead_status:
          form.lead_status,

      }


      // =================================================
      // DEBUG
      // =================================================

      console.log(
        '========================================'
      )

      console.log(
        'ACTUALIZANDO LEAD'
      )

      console.log(
        'ID:',
        lead.id
      )

      console.log(
        'PAYLOAD:',
        updatePayload
      )

      console.log(
        '========================================'
      )


      // =================================================
      // UPDATE SUPABASE
      // =================================================

      const {
        data,
        error: updateError,
      } = await supabase
        .from('leads')
        .update(
          updatePayload
        )
        .eq(
          'id',
          lead.id
        )
        .select()
        .single()


      // =================================================
      // ERROR
      // =================================================

      if (updateError) {

        console.error(
          '========================================'
        )

        console.error(
          'ERROR SUPABASE'
        )

        console.error(
          'message:',
          updateError.message
        )

        console.error(
          'details:',
          updateError.details
        )

        console.error(
          'hint:',
          updateError.hint
        )

        console.error(
          'code:',
          updateError.code
        )

        console.error(
          '========================================'
        )

        throw new Error(
          updateError.message ||
          'Supabase rechazó la actualización.'
        )
      }


      // =================================================
      // VALIDAR QUE REALMENTE SE ACTUALIZÓ
      // =================================================

      if (!data) {

        throw new Error(
          'No se encontró el lead después de actualizarlo.'
        )
      }


      // =================================================
      // ÉXITO
      // =================================================

      console.log(
        '✅ LEAD ACTUALIZADO CORRECTAMENTE:',
        data
      )


      setSaved(true)

      setEditing(false)


      // =================================================
      // RECARGAR PADRE
      // =================================================

      if (onSaved) {

        await onSaved()

      }

    } catch (err) {

      console.error(
        '❌ Error completo al guardar lead:',
        err
      )

      setError(
        err instanceof Error
          ? err.message
          : 'No se pudieron guardar los cambios.'
      )

    } finally {

      setSaving(false)

    }

  }


  // =====================================================
  // FORMATO DINERO
  // =====================================================

  function formatMoney(
    amount: number,
    currency: 'MXN' | 'USD'
  ) {

    return new Intl.NumberFormat(
      currency === 'USD'
        ? 'en-US'
        : 'es-MX',
      {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    ).format(amount)

  }


  // =====================================================
  // LABEL PRODUCTO
  // =====================================================

  function getProductLabel(
    product: ProductType
  ) {

    switch (product) {

      case 'workshop_lite':
        return '🎓 Workshop Lite'

      case 'workshop':
        return '🎓 Workshop High Ticket'

      case 'empresarial':
        return '🏢 Empresarial'

      case 'costa_rica':
        return '🇨🇷 Costa Rica'

      default:
        return product

    }

  }


  // =====================================================
  // MONEDA
  // =====================================================

  const currency =
    editing
      ? productConfig?.currency ||
        lead.currency ||
        'MXN'
      : lead.currency ||
        'MXN'


  // =====================================================
  // VALORES VISUALES
  // =====================================================

  const displayedPrice =
    editing
      ? price
      : Number(
          lead.product_price || 0
        )

  const displayedAmountPaid =
    editing
      ? amountPaid
      : Number(
          lead.amount_paid || 0
        )

  const displayedBalance =
    editing
      ? balance
      : Math.max(
          Number(
            lead.product_price || 0
          ) -
          Number(
            lead.amount_paid || 0
          ),
          0
        )

  const displayedPaymentStatus =
    editing
      ? paymentStatus
      : lead.payment_status


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div
      className="
        max-w-3xl
        mx-auto
        p-4
      "
    >

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div
          className="
            mb-4
            bg-red-500/10
            border
            border-red-500/30
            text-red-500
            rounded-xl
            p-4
            text-sm
          "
        >

          {error}

        </div>

      )}


      {/* =================================================
          GUARDADO
      ================================================= */}

      {saved && (

        <div
          className="
            mb-4
            bg-green-500/10
            border
            border-green-500/30
            text-green-600
            dark:text-green-400
            rounded-xl
            p-4
            text-sm
            flex
            items-center
            gap-2
          "
        >

          <CheckCircle2
            size={18}
          />

          Cambios guardados correctamente.

        </div>

      )}


      {/* =================================================
          CARD PRINCIPAL
      ================================================= */}

      <div
        className="
          bg-surface
          border
          border-border-color
          rounded-xl
          p-6
          mb-6
        "
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="
            flex
            flex-col
            md:flex-row
            md:items-start
            md:justify-between
            gap-4
            mb-6
          "
        >

          <div className="flex-1">

            {editing ? (

              <input
                name="full_name"
                value={
                  form.full_name
                }
                onChange={
                  handleChange
                }
                className="
                  w-full
                  text-2xl
                  font-bold
                  bg-background
                  border
                  border-border-color
                  rounded-lg
                  p-2
                  text-foreground
                "
              />

            ) : (

              <h1
                className="
                  text-3xl
                  font-bold
                  text-foreground
                "
              >

                {lead.full_name}

              </h1>

            )}

            <p
              className="
                text-sm
                text-foreground/50
                mt-2
              "
            >

              {getProductLabel(
                editing
                  ? form.product
                  : lead.product
              )}

            </p>

          </div>


          {/* =================================================
              BOTONES
          ================================================= */}

          {!editing ? (

            <button
              type="button"
              onClick={
                startEditing
              }
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                bg-brand-blue
                text-white
                px-4
                py-2
                rounded-lg
                font-semibold
                hover:opacity-90
                transition
              "
            >

              <Pencil
                size={17}
              />

              Editar

            </button>

          ) : (

            <div
              className="
                flex
                gap-2
              "
            >

              <button
                type="button"
                onClick={
                  cancelEditing
                }
                disabled={
                  saving
                }
                className="
                  inline-flex
                  items-center
                  gap-2
                  px-4
                  py-2
                  rounded-lg
                  border
                  border-border-color
                  bg-surface
                  text-foreground
                  font-semibold
                  hover:bg-foreground/5
                  disabled:opacity-50
                "
              >

                <X
                  size={17}
                />

                Cancelar

              </button>


              <button
                type="button"
                onClick={
                  handleSave
                }
                disabled={
                  saving
                }
                className="
                  inline-flex
                  items-center
                  gap-2
                  px-4
                  py-2
                  rounded-lg
                  bg-green-600
                  text-white
                  font-semibold
                  hover:opacity-90
                  disabled:opacity-50
                "
              >

                <Save
                  size={17}
                />

                {saving
                  ? 'Guardando...'
                  : 'Guardar'}

              </button>

            </div>

          )}

        </div>


        {/* =================================================
            CONTACTO
        ================================================= */}

        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-2
            gap-4
            mb-6
          "
        >

          {/* TELÉFONO */}

          <div>

            {editing && (

              <label
                className="
                  block
                  text-xs
                  text-foreground/50
                  mb-1
                "
              >

                Teléfono

              </label>

            )}

            <div
              className="
                flex
                items-center
                gap-2
              "
            >

              <Phone
                size={20}
                className="text-green-500"
              />

              {editing ? (

                <input
                  name="phone_number"
                  value={
                    form.phone_number
                  }
                  onChange={
                    handleChange
                  }
                  className="
                    flex-1
                    bg-background
                    border
                    border-border-color
                    rounded-lg
                    p-2
                    text-foreground
                  "
                />

              ) : (

                <a
                  href={`https://wa.me/${(
                    lead.phone_number || ''
                  ).replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    text-brand-blue
                    hover:underline
                  "
                >

                  {lead.phone_number || '—'}

                </a>

              )}

            </div>

          </div>


          {/* EMAIL */}

          <div>

            {editing && (

              <label
                className="
                  block
                  text-xs
                  text-foreground/50
                  mb-1
                "
              >

                Email

              </label>

            )}

            <div
              className="
                flex
                items-center
                gap-2
              "
            >

              <Mail
                size={20}
                className="text-brand-blue"
              />

              {editing ? (

                <input
                  type="email"
                  name="email"
                  value={
                    form.email
                  }
                  onChange={
                    handleChange
                  }
                  className="
                    flex-1
                    bg-background
                    border
                    border-border-color
                    rounded-lg
                    p-2
                    text-foreground
                  "
                />

              ) : (

                <span>

                  {lead.email || '—'}

                </span>

              )}

            </div>

          </div>


          {/* FECHA */}

          <div
            className="
              flex
              items-center
              gap-2
            "
          >

            <Calendar
              size={20}
              className="text-brand-orange"
            />

            <span>

              {lead.created_at
                ? new Date(
                    lead.created_at
                  ).toLocaleDateString(
                    'es-MX'
                  )
                : '—'}

            </span>

          </div>


          {/* CAMPAÑA */}

          <div>

            {editing ? (

              <>
                <label
                  className="
                    block
                    text-xs
                    text-foreground/50
                    mb-1
                  "
                >

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
                  className="
                    w-full
                    bg-background
                    border
                    border-border-color
                    rounded-lg
                    p-2
                    text-foreground
                  "
                />

              </>

            ) : (

              <>
                <strong>
                  Campaña:
                </strong>{' '}

                {lead.campaign_name ||
                  '—'}

              </>

            )}

          </div>

        </div>


        {/* =================================================
            INFORMACIÓN COMERCIAL
        ================================================= */}

        <div
          className="
            border-t
            border-border-color
            pt-5
            mb-6
          "
        >

          <h2
            className="
              font-bold
              text-lg
              mb-4
            "
          >

            Información comercial

          </h2>


          {/* PRODUCTO */}

          {editing && (

            <div className="mb-5">

              <label
                className="
                  block
                  text-sm
                  font-semibold
                  mb-1
                "
              >

                Producto

              </label>

              <select
                name="product"
                value={
                  form.product
                }
                onChange={
                  handleChange
                }
                className="
                  w-full
                  bg-background
                  border
                  border-border-color
                  rounded-lg
                  p-2.5
                  text-foreground
                "
              >

                <option value="workshop_lite">
                  🎓 Workshop Lite — $14 USD
                </option>

                <option value="workshop">
                  🎓 Workshop High Ticket — $10,000 MXN
                </option>

                <option value="empresarial">
                  🏢 Empresarial — $5,997 MXN
                </option>

                <option value="costa_rica">
                  🇨🇷 Costa Rica — $540 USD
                </option>

              </select>

            </div>

          )}


          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-3
              gap-4
            "
          >

            {/* PRECIO */}

            <div
              className="
                bg-foreground/5
                rounded-lg
                p-4
              "
            >

              <p
                className="
                  text-xs
                  text-foreground/50
                "
              >

                Precio

              </p>

              <p
                className="
                  text-xl
                  font-bold
                "
              >

                {formatMoney(
                  displayedPrice,
                  currency
                )}

              </p>

            </div>


            {/* PAGADO */}

            <div
              className="
                bg-foreground/5
                rounded-lg
                p-4
              "
            >

              <p
                className="
                  text-xs
                  text-foreground/50
                "
              >

                Pagado

              </p>

              {editing ? (

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
                    text-xl
                    font-bold
                    bg-background
                    border
                    border-border-color
                    rounded-lg
                    p-2
                    text-green-600
                  "
                />

              ) : (

                <p
                  className="
                    text-xl
                    font-bold
                    text-green-500
                  "
                >

                  {formatMoney(
                    displayedAmountPaid,
                    currency
                  )}

                </p>

              )}

            </div>


            {/* SALDO */}

            <div
              className="
                bg-foreground/5
                rounded-lg
                p-4
              "
            >

              <p
                className="
                  text-xs
                  text-foreground/50
                "
              >

                Saldo pendiente

              </p>

              <p
                className={`
                  text-xl
                  font-bold
                  ${
                    displayedBalance > 0
                      ? 'text-brand-orange'
                      : 'text-green-500'
                  }
                `}
              >

                {formatMoney(
                  displayedBalance,
                  currency
                )}

              </p>

            </div>

          </div>


          {/* ESTADO PAGO */}

          <div className="mt-4">

            <span
              className={`
                inline-flex
                px-3
                py-1
                rounded-full
                text-xs
                font-bold
                text-white

                ${
                  displayedPaymentStatus ===
                  'paid'

                    ? 'bg-green-500'

                    : displayedPaymentStatus ===
                      'partial'

                    ? 'bg-brand-orange'

                    : 'bg-gray-500'
                }
              `}
            >

              {displayedPaymentStatus ===
              'paid'

                ? 'Pagado'

                : displayedPaymentStatus ===
                  'partial'

                ? 'Pago parcial'

                : 'Sin pago'}

            </span>

          </div>

        </div>


        {/* =================================================
            ESTADO COMERCIAL
        ================================================= */}

        <div
          className="
            border-t
            border-border-color
            pt-5
          "
        >

          <h2
            className="
              font-bold
              text-lg
              mb-4
            "
          >

            Estado comercial

          </h2>


          {editing ? (

            <select
              name="lead_status"
              value={
                form.lead_status
              }
              onChange={
                handleChange
              }
              className="
                w-full
                bg-background
                border
                border-border-color
                rounded-lg
                p-2.5
                text-foreground
              "
            >

              <option value="new">
                Nuevo
              </option>

              <option value="contacted">
                Contactado
              </option>

              <option value="interested">
                Interesado
              </option>

              <option value="qualified">
                Calificado
              </option>

              <option value="lost">
                Perdido
              </option>

            </select>

          ) : (

            <div
              className="
                grid
                grid-cols-3
                gap-4
              "
            >

              <div className="text-center">

                <p
                  className="
                    text-foreground/60
                    text-sm
                  "
                >

                  Estado

                </p>

                <p
                  className="
                    font-bold
                    text-lg
                  "
                >

                  {lead.lead_status || '—'}

                </p>

              </div>


              <div className="text-center">

                <p
                  className="
                    text-foreground/60
                    text-sm
                  "
                >

                  Score

                </p>

                <p
                  className="
                    font-bold
                    text-lg
                    text-brand-orange
                  "
                >

                  {lead.score ?? 0}/100

                </p>

              </div>


              <div className="text-center">

                <p
                  className="
                    text-foreground/60
                    text-sm
                  "
                >

                  Engagement

                </p>

                <p
                  className="
                    font-bold
                    text-lg
                    text-red-500
                  "
                >

                  {engagementLevel}

                </p>

              </div>

            </div>

          )}

        </div>


        {/* =================================================
            NOTAS
        ================================================= */}

        <div className="mt-6">

          {editing ? (

            <>

              <label
                className="
                  block
                  text-sm
                  font-semibold
                  mb-1
                "
              >

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
                rows={5}
                className="
                  w-full
                  bg-background
                  border
                  border-border-color
                  rounded-lg
                  p-3
                  resize-none
                  text-foreground
                "
              />

            </>

          ) : (

            lead.notes && (

              <div
                className="
                  p-4
                  bg-brand-orange/10
                  rounded
                  border-l-4
                  border-brand-orange
                "
              >

                <p className="text-sm">

                  <strong>
                    Notas:
                  </strong>{' '}

                  {lead.notes}

                </p>

              </div>

            )

          )}

        </div>

      </div>


      {/* =================================================
          INTERACCIONES
      ================================================= */}

      <div
        className="
          bg-surface
          border
          border-border-color
          rounded-xl
          p-6
        "
      >

        <h2
          className="
            text-2xl
            font-bold
            mb-4
            flex
            items-center
            gap-2
          "
        >

          <MessageCircle
            size={24}
          />

          Interacciones (
          {interactions.length}
          )

        </h2>


        {interactions.length === 0 ? (

          <p
            className="
              text-foreground/50
            "
          >

            Sin interacciones registradas

          </p>

        ) : (

          <div
            className="
              space-y-3
            "
          >

            {interactions.map(
              interaction => (

                <div
                  key={
                    interaction.id
                  }
                  className="
                    p-3
                    border
                    border-border-color
                    rounded
                    bg-background
                  "
                >

                  <div
                    className="
                      flex
                      justify-between
                      text-sm
                      text-foreground/60
                      mb-1
                    "
                  >

                    <span
                      className="
                        font-semibold
                      "
                    >

                      {interaction.direction ===
                      'inbound'
                        ? '⬅️'
                        : '➡️'}{' '}

                      {interaction.type}

                    </span>

                    <span>

                      {new Date(
                        interaction.created_at
                      ).toLocaleString(
                        'es-MX'
                      )}

                    </span>

                  </div>

                  <p>

                    {interaction.message ||
                      '—'}

                  </p>

                </div>

              )
            )}

          </div>

        )}

      </div>

    </div>

  )
}