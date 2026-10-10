import { useState } from "react"
import { toast } from "@/components/hooks/use-toast"
import { ContactChannel, ILead, LeadStatus, leadService } from "@/services/leadService"

const CHANNEL_LABEL: Record<ContactChannel, string> = {
  whatsapp: 'WhatsApp',
  email: 'correo',
}

/**
* Registra el contacto en el back y abre WhatsApp o el correo con el link que devuelve.
* onContacted recibe el nuevo estado del lead (contactar un lead nuevo lo pasa a "En gestión").
*/
export function useContactLead(onContacted?: (lead: ILead, status: LeadStatus) => void) {
  const [contacting, setContacting] = useState<ContactChannel | null>(null)

  const contact = async (lead: ILead, channel: ContactChannel) => {
    // Se abre antes del await: después el navegador la bloquearía como popup
    const tab = channel === 'whatsapp' ? window.open('', '_blank') : null

    setContacting(channel)
    const response = await leadService.contact(lead._id, channel)
    setContacting(null)

    if (response?.code !== 200) {
      tab?.close()
      toast({ variant: 'destructive', title: 'No se pudo registrar el contacto' })
      return
    }

    // mailto abre el cliente de correo sin salir de la página
    if (tab) tab.location.href = response.url
    else window.location.href = response.url

    toast({ title: `Contacto por ${CHANNEL_LABEL[channel]} registrado`, description: lead.full_name })
    onContacted?.(lead, response.status)
  }

  return { contact, contacting }
}
