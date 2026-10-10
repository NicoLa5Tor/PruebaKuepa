import { app } from "@/atoms/kuepa"
import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { TbPlus, TbSearch } from "react-icons/tb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { toast } from "@/components/hooks/use-toast"
import { LeadForm } from "@/components/leads/lead-form"
import { LeadsTable } from "@/components/leads/leads-table"
import { ILead, leadService } from "@/services/leadService"
import { useSocketEvent } from "@/hooks/use-socket-event"

export interface LeadsProps {
}

export default function Leads (props?: LeadsProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [leads, setLeads] = useState<ILead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [highlightId, setHighlightId] = useState<string | null>(null)
  // /leads?new=1 abre el formulario directamente (acceso rápido desde el Home)
  const [open, setOpen] = useState(searchParams.get('new') === '1')

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

  const load = useCallback(async (filters?: string) => {
    setLoading(true)
    const response = await leadService.list({ filters })
    setLeads(response?.list || [])
    setLoading(false)
  }, [])

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

  const handleOpenChange = (value: boolean) => {
    setOpen(value)
    if (!value && searchParams.has('new')) setSearchParams({}, { replace: true })
  }

  const handleCreated = (response: any) => {
    handleOpenChange(false)
    toast({
      title: 'Lead registrado',
      description: `${response.object?.full_name} quedó asignado a tu bandeja.`,
    })
    load(search)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="flex text-3xl md:text-4xl font-title text-purple-800">Leads</h1>
          <p className="text-sm text-slate-500">
            Prospectos interesados en nuestros programas{!loading ? ` · ${leads.length} ${leads.length === 1 ? 'registro' : 'registros'}` : ''}
          </p>
        </div>
        <Button onClick={() => handleOpenChange(true)} className="bg-purple-700 hover:bg-purple-800 text-white">
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
            emptyMessage={search ? 'No hay leads que coincidan con la búsqueda.' : 'Todavía no hay leads registrados.'}
          />
        </CardContent>
      </Card>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-purple-800">Nuevo lead</SheetTitle>
            <SheetDescription>
              Registra un prospecto interesado en uno de nuestros programas. Quedará asignado a ti.
            </SheetDescription>
          </SheetHeader>
          <LeadForm onSubmit={leadService.upsert} onSuccess={handleCreated} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
