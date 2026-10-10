import { TbBrandWhatsapp, TbMail } from 'react-icons/tb'
import { Button } from '@/components/ui/button'
import { useContactLead } from '@/hooks/use-contact-lead'
import { ILead, LeadStatus } from '@/services/leadService'

export interface ContactButtonsProps {
  lead: ILead
  onContacted?: (lead: ILead, status: LeadStatus) => void
}

export function ContactButtons({ lead, onContacted }: ContactButtonsProps) {
  const { contact, contacting } = useContactLead(onContacted)

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        disabled={!!contacting}
        onClick={() => contact(lead, 'whatsapp')}
        className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
      >
        <TbBrandWhatsapp /> {contacting === 'whatsapp' ? 'Abriendo…' : 'WhatsApp'}
      </Button>
      <Button
        variant="outline"
        disabled={!!contacting}
        onClick={() => contact(lead, 'email')}
        className="gap-2 border-sky-200 text-sky-700 hover:bg-sky-50 hover:text-sky-800"
      >
        <TbMail /> {contacting === 'email' ? 'Abriendo…' : 'Correo'}
      </Button>
    </div>
  )
}
