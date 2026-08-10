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
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/app1/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'manual' }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'No se pudo crear el lead')
      }

      router.push('/app1/leads')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Nuevo lead manual</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre completo *</label>
          <input
            name="full_name"
            required
            value={form.full_name}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Teléfono (WhatsApp) *</label>
          <input
            name="phone_number"
            required
            placeholder="52155..."
            value={form.phone_number}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Plataforma</label>
          <select name="platform" value={form.platform} onChange={handleChange} className="w-full border rounded p-2">
            <option value="fb">Facebook</option>
            <option value="ig">Instagram</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Campaña</label>
          <input
            name="campaign_name"
            value={form.campaign_name}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notas</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} className="w-full border rounded p-2" rows={3} />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Guardando...' : 'Crear lead'}
        </button>
      </form>
    </div>
  )
}
