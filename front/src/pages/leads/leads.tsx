import { app } from "@/atoms/kuepa"
import { useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { TbBrandWhatsapp, TbEye, TbMail, TbPencil, TbPlus, TbSearch, TbTrash } from "react-icons/tb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/hooks/use-toast"
import { FormSheet } from "@/components/crud/form-sheet"
import { ConfirmDialog } from "@/components/crud/confirm-dialog"
import { RowAction } from "@/components/crud/row-actions"
import { LeadForm } from "@/components/leads/lead-form"
import { LeadsTable } from "@/components/leads/leads-table"
import { LeadDetail } from "@/components/leads/lead-detail"
import { ILead, leadService } from "@/services/leadService"
import { useSocketEvent } from "@/hooks/use-socket-event"
import { useContactLead } from "@/hooks/use-contact-lead"

export interface LeadsProps {
}

// Un solo panel lateral a la vez: crear, editar o ver el detalle
type Panel =
  | { mode: 'create' }
  | { mode: 'edit', lead: ILead }
  | { mode: 'detail', leadId: string }

export default function Leads (props?: LeadsProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [leads, setLeads] = useState<ILead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [highlightId, setHighlightId] = useState<string | null>(null)
  // /leads?new=1 abre el formulario directamente (acceso rápido desde el Home)
  const [panel, setPanel] = useState<Panel | null>(searchParams.get('new') === '1' ? { mode: 'create' } : null)
  const [deleting, setDeleting] = useState<ILead | null>(null)

  useEffect(() => {
    app.set({
      ...(app.get() || {}),
      app: 'kuepa',
      module: 'leads',
      window: 'crm',
      back: null,
      accent: 'purple',
      breadcrumb:[
        {
          title: 'Leads',
          url: '/leads'
        }
      ]
    })
  }, [])

  // Solo cuenta la última consulta: una búsqueda lenta no pisa el resultado de una más nueva
  const lastRequest = useRef(0)

  const load = useCallback(async (filters?: string) => {
    const request = ++lastRequest.current
    setLoading(true)
    const response = await leadService.list({ filters })
    if (request !== lastRequest.current) return
    setLeads(response?.list || [])
    setLoading(false)
  }, [])

  const reload = () => load(search)

  // Búsqueda con debounce para no consultar en cada tecla
  useEffect(() => {
    const timeout = setTimeout(() => load(search), 300)
    return () => clearTimeout(timeout)
  }, [search, load])

  // Lead nuevo en tiempo real (formulario público u otra pestaña). Con una búsqueda
  // activa no se inserta para no mostrar algo que quizá no coincide con el filtro
  useSocketEvent<ILead>('lead:created', (lead) => {
    if (search) return
    setLeads((current) => current.some((item) => item._id === lead._id) ? current : [lead, ...current])
    setHighlightId(lead._id)
  })

  useEffect(() => {
    if (!highlightId) return
    const timeout = setTimeout(() => setHighlightId(null), 3000)
    return () => clearTimeout(timeout)
  }, [highlightId])

  const { contact } = useContactLead(reload)

  const closePanel = () => {
    setPanel(null)
    if (searchParams.has('new')) setSearchParams({}, { replace: true })
  }

  const handleSaved = (message: string) => (response: any) => {
    closePanel()
    toast({ title: message, description: response.object?.full_name })
    reload()
  }

  const handleDelete = async () => {
    const response = await leadService.remove(deleting._id)
    if (response?.code !== 200) {
      toast({ variant: 'destructive', title: 'No se pudo eliminar el lead' })
      return false
    }
    toast({ title: 'Lead eliminado', description: deleting.full_name })
    reload()
    return true
  }

  const actions = (lead: ILead): RowAction[] => [
    { label: 'Ver detalle', icon: TbEye, onClick: () => setPanel({ mode: 'detail', leadId: lead._id }) },
    { label: 'Editar', icon: TbPencil, onClick: () => setPanel({ mode: 'edit', lead }) },
    { label: 'WhatsApp', icon: TbBrandWhatsapp, onClick: () => contact(lead, 'whatsapp') },
    { label: 'Correo', icon: TbMail, onClick: () => contact(lead, 'email') },
    { label: 'Eliminar', icon: TbTrash, onClick: () => setDeleting(lead), destructive: true },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="flex text-3xl md:text-4xl font-title text-purple-800">Leads</h1>
          <p className="text-sm text-slate-500">
            Prospectos interesados en nuestros programas{!loading ? ` · ${leads.length} ${leads.length === 1 ? 'registro' : 'registros'}` : ''}
          </p>
        </div>
        <Button onClick={() => setPanel({ mode: 'create' })} className="bg-purple-700 hover:bg-purple-800 text-white">
          <TbPlus /> Nuevo lead
        </Button>
      </div>

      <Card>
        <CardContent className="p-3 md:p-4 flex flex-col gap-3">
          <div className="relative max-w-sm">
            <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, email o celular"
              aria-label="Buscar leads"
              className="pl-9"
            />
          </div>
          <LeadsTable
            leads={leads}
            loading={loading}
            highlightId={highlightId}
            actions={actions}
            emptyMessage={search ? 'No hay leads que coincidan con la búsqueda.' : 'Todavía no hay leads registrados.'}
          />
        </CardContent>
      </Card>

      <FormSheet
        open={panel?.mode === 'create'}
        onOpenChange={(open) => !open && closePanel()}
        title="Nuevo lead"
        description="Registra un prospecto interesado en uno de nuestros programas. Quedará asignado a ti."
      >
        <LeadForm onSubmit={leadService.upsert} onSuccess={handleSaved('Lead registrado')} />
      </FormSheet>

      <FormSheet
        open={panel?.mode === 'edit'}
        onOpenChange={(open) => !open && closePanel()}
        title="Editar lead"
        description="Corrige sus datos o actualiza el estado de la gestión."
      >
        {panel?.mode === 'edit' ? (
          <LeadForm
            key={panel.lead._id}
            initialData={panel.lead}
            submitLabel="Guardar cambios"
            onSubmit={(data) => leadService.upsert({ ...data, _id: panel.lead._id })}
            onSuccess={handleSaved('Lead actualizado')}
          />
        ) : null}
      </FormSheet>

      <FormSheet
        open={panel?.mode === 'detail'}
        onOpenChange={(open) => !open && closePanel()}
        title="Detalle del lead"
      >
        {panel?.mode === 'detail' ? (
          <LeadDetail
            key={panel.leadId}
            leadId={panel.leadId}
            onEdit={(lead) => setPanel({ mode: 'edit', lead })}
            onChange={reload}
          />
        ) : null}
      </FormSheet>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Eliminar lead"
        description={`Se eliminará el lead de ${deleting?.full_name || ''}. Esta acción no se puede deshacer desde el CRM.`}
        onConfirm={handleDelete}
      />
    </div>
  )
}
