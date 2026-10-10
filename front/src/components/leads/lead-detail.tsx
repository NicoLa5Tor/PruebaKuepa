import { useCallback, useEffect, useState } from 'react'
import moment from 'moment'
import { IconType } from 'react-icons'
import { TbBrandWhatsapp, TbForms, TbMail, TbMessage, TbPencil } from 'react-icons/tb'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { IInteraction, ILead, leadService } from '@/services/leadService'
import { LeadStatusBadge } from './lead-status'
import { ContactButtons } from './contact-buttons'

const INTERACTION: Partial<Record<IInteraction['type'], { label: string, icon: IconType }>> = {
  whatsapp: { label: 'Contactado por WhatsApp', icon: TbBrandWhatsapp },
  email: { label: 'Contactado por correo', icon: TbMail },
  form: { label: 'Se registró desde el formulario web', icon: TbForms },
}

export interface LeadDetailProps {
  leadId: string
  onEdit: (lead: ILead) => void
  // Se llama cuando el lead cambia (p. ej. el estado al contactarlo) para refrescar la lista
  onChange?: () => void
}

export function LeadDetail({ leadId, onEdit, onChange }: LeadDetailProps) {
  const [lead, setLead] = useState<ILead | null>(null)
  const [interactions, setInteractions] = useState<IInteraction[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const response = await leadService.get({ _id: leadId })
    if (response?.code === 200) {
      setLead(response.lead)
      setInteractions(response.interactions || [])
    }
    setLoading(false)
  }, [leadId])

  useEffect(() => { load() }, [load])

  if (loading) return <Skeleton className="h-64 w-full" />
  if (!lead) return <span className="text-sm text-slate-500">No encontramos este lead.</span>

  const rows = [
    { label: 'Documento', value: `${lead.contact?.document_type?.toUpperCase() || ''} ${lead.contact?.document || ''}`.trim() },
    { label: 'Email', value: lead.email },
    { label: 'Celular', value: lead.mobile_phone },
    { label: 'Programa', value: lead.interestProgram?.name },
    { label: 'Registro', value: moment(lead.created_at).format('LLL') },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xl font-semibold text-slate-800">{lead.full_name}</span>
          <LeadStatusBadge status={lead.status} />
        </div>
        <Button variant="outline" size="sm" onClick={() => onEdit(lead)} className="gap-2">
          <TbPencil /> Editar
        </Button>
      </div>

      <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-slate-500">{row.label}</dt>
            <dd className="text-slate-800 break-all">{row.value || '—'}</dd>
          </div>
        ))}
      </dl>

      <ContactButtons lead={lead} onContacted={() => { load(); onChange?.() }} />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-slate-800">Historial</span>
        {!interactions.length ? <span className="text-sm text-slate-500">Todavía no hay interacciones.</span> : null}
        <ol className="flex flex-col gap-3 border-l border-slate-200 pl-4">
          {interactions.map((interaction) => {
            const config = INTERACTION[interaction.type] || { label: interaction.type, icon: TbMessage }
            return (
              <li key={interaction._id} className="flex items-center gap-3 text-sm">
                <config.icon className="h-4 w-4 shrink-0 text-purple-700" />
                <span className="grow text-slate-700">{config.label}</span>
                <span className="text-xs text-slate-400" title={moment(interaction.created_at).format('LLL')}>
                  {moment(interaction.created_at).fromNow()}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
