'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NuevoLeadPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    platform: 'fb',
    campaign_name: '',
    product: 'costa_rica',
    notes: '',
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/app1/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          source: 'manual',
        }),
      })

      if (!res.ok) {
        const body = await res.json()

        throw new Error(
          body.error || 'No se pudo crear el lead'
        )
      }

      router.push('/app1/leads')
      router.refresh()

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error desconocido'
      )

    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto p-6">

      {/* HEADER */}
      <div className="mb-6">

        <h1 className="text-2xl font-bold">
          Nuevo lead manual
        </h1>

        <p className="text-sm text-foreground/60 mt-1">
          Agrega un nuevo prospecto al área de ventas.
        </p>

      </div>

      {/* FORMULARIO */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-sm space-y-4"
      >

        {/* NOMBRE */}
        <div>

          <label className="block text-sm font-medium mb-1">
            Nombre completo *
          </label>

          <input
            name="full_name"
            required
            value={form.full_name}
            onChange={handleChange}
            placeholder="Nombre del prospecto"
            className="w-full border rounded p-2"
          />

        </div>

        {/* TELÉFONO */}
        <div>

          <label className="block text-sm font-medium mb-1">
            Teléfono (WhatsApp) *
          </label>

          <input
            name="phone_number"
            required
            placeholder="52155..."
            value={form.phone_number}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />

          <p className="text-xs text-foreground/50 mt-1">
            Incluye código de país.
          </p>

        </div>

        {/* EMAIL */}
        <div>

          <label className="block text-sm font-medium mb-1">
            Email
          </label>

          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="correo@ejemplo.com"
            className="w-full border rounded p-2"
          />

        </div>

        {/* PLATAFORMA */}
        <div>

          <label className="block text-sm font-medium mb-1">
            Plataforma
          </label>

          <select
            name="platform"
            value={form.platform}
            onChange={handleChange}
            className="w-full border rounded p-2"
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

          <label className="block text-sm font-medium mb-1">
            Producto *
          </label>

          <select
            name="product"
            value={form.product}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
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

          <p className="text-xs text-foreground/50 mt-1">
            Este producto determina en qué sección de Ventas aparecerá el lead.
          </p>

        </div>

        {/* CAMPAÑA */}
        <div>

          <label className="block text-sm font-medium mb-1">
            Campaña
          </label>

          <input
            name="campaign_name"
            value={form.campaign_name}
            onChange={handleChange}
            placeholder="Nombre de la campaña"
            className="w-full border rounded p-2"
          />

        </div>

        {/* NOTAS */}
        <div>

          <label className="block text-sm font-medium mb-1">
            Notas
          </label>

          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Información adicional del lead..."
            className="w-full border rounded p-2"
            rows={4}
          />

        </div>

        {/* ERROR */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded p-3">
            {error}
          </div>
        )}

        {/* BOTÓN */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white p-2.5 rounded font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >

          {submitting
            ? 'Guardando...'
            : 'Crear lead'}

        </button>

      </form>

    </div>
  )
}