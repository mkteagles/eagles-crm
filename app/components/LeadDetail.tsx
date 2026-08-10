import { Lead, Interaction } from '@/lib/types'
import { Phone, Mail, Calendar, MessageCircle, DollarSign } from 'lucide-react'

export function LeadDetail({ lead, interactions }: { lead: Lead; interactions: Interaction[] }) {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-surface border border-border-color rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-3xl font-bold">{lead.full_name}</h1>
          {lead.has_purchased && (
            <span className="flex items-center gap-1 bg-green-500/10 text-green-500 text-sm font-bold px-3 py-1 rounded-full">
              <DollarSign size={14} /> Comprador
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Phone size={20} className="text-green-500" />
            <a href={`https://wa.me/${lead.phone_number}`} target="_blank" className="text-brand-blue">
              {lead.phone_number}
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Mail size={20} className="text-brand-blue" />
            <span>{lead.email || '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-brand-orange" />
            <span>{new Date(lead.created_at).toLocaleDateString()}</span>
          </div>
          <div>
            <strong>Campaña:</strong> {lead.campaign_name || '—'}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 border-t border-border-color pt-4">
          <div className="text-center">
            <p className="text-foreground/60 text-sm">Estado</p>
            <p className="font-bold text-lg">{lead.lead_status}</p>
          </div>
          <div className="text-center">
            <p className="text-foreground/60 text-sm">Score</p>
            <p className="font-bold text-lg text-brand-orange">{lead.score}/100</p>
          </div>
          <div className="text-center">
            <p className="text-foreground/60 text-sm">Engagement</p>
            <p className="font-bold text-lg text-red-500">
              {lead.lead_metrics?.engagement_level || 'low'}
            </p>
          </div>
        </div>

        {lead.notes && (
          <div className="mt-6 p-4 bg-brand-orange/10 rounded border-l-4 border-brand-orange">
            <p className="text-sm">
              <strong>Notas:</strong> {lead.notes}
            </p>
          </div>
        )}
      </div>

      <div className="bg-surface border border-border-color rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <MessageCircle size={24} /> Interacciones ({interactions.length})
        </h2>

        {interactions.length === 0 ? (
          <p className="text-foreground/50">Sin interacciones registradas</p>
        ) : (
          <div className="space-y-3">
            {interactions.map((int) => (
              <div key={int.id} className="p-3 border border-border-color rounded bg-background">
                <div className="flex justify-between text-sm text-foreground/60 mb-1">
                  <span className="font-semibold">
                    {int.direction === 'inbound' ? '⬅️' : '➡️'} {int.type}
                  </span>
                  <span>{new Date(int.created_at).toLocaleString()}</span>
                </div>
                <p>{int.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}