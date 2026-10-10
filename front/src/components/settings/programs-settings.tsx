import { useCallback, useEffect, useState } from 'react'
import { TbPencil, TbPlus, TbTrash } from 'react-icons/tb'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/components/hooks/use-toast'
import { FormSheet } from '@/components/crud/form-sheet'
import { ConfirmDialog } from '@/components/crud/confirm-dialog'
import { RowActions } from '@/components/crud/row-actions'
import { IProgram, programService } from '@/services/programService'
import { SettingsCard } from './settings-card'
import { ProgramForm } from './program-form'

// Igual que en leads: un solo panel abierto, para crear o editar
type Panel = { mode: 'create' } | { mode: 'edit', program: IProgram }

export function ProgramsSettings() {
  const [programs, setPrograms] = useState<IProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [panel, setPanel] = useState<Panel | null>(null)
  const [deleting, setDeleting] = useState<IProgram | null>(null)

  const load = useCallback(async () => {
    const response = await programService.all()
    setPrograms(response?.list || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSaved = (response: any) => {
    setPanel(null)
    toast({ title: 'Programa guardado', description: response.object?.name })
    load()
  }

  const toggleStatus = async (program: IProgram, active: boolean) => {
    const response = await programService.upsert({ ...program, status: active ? 'active' : 'inactive' })
    if (response?.code === 200) toast({ title: active ? 'Programa activado' : 'Programa desactivado', description: program.name })
    else toast({ variant: 'destructive', title: 'No se pudo cambiar el estado' })
    load()
  }

  const handleDelete = async () => {
    const response = await programService.remove(deleting._id)
    if (response?.code !== 200) {
      toast({ variant: 'destructive', title: 'No se pudo eliminar el programa' })
      return false
    }
    toast({ title: 'Programa eliminado', description: deleting.name })
    load()
    return true
  }

  return (
    <SettingsCard
      title="Programas"
      description="Catálogo que se ofrece en los formularios. Un programa inactivo deja de aparecer pero conserva sus leads. Los cambios se guardan automáticamente."
      loading={loading}
      action={
        <Button size="sm" onClick={() => setPanel({ mode: 'create' })} className="gap-1 bg-purple-700 hover:bg-purple-800 text-white">
          <TbPlus /> Nuevo programa
        </Button>
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead className="hidden md:table-cell">Descripción</TableHead>
            <TableHead className="text-right">Leads</TableHead>
            <TableHead>Activo</TableHead>
            <TableHead className="w-10"><span className="sr-only">Acciones</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {programs.map((program) => (
            <TableRow key={program._id}>
              <TableCell className="font-medium text-slate-800">{program.name}</TableCell>
              <TableCell className="hidden md:table-cell text-slate-500">{program.description || '—'}</TableCell>
              <TableCell className="text-right tabular-nums text-slate-600">{program.leads}</TableCell>
              <TableCell>
                <Switch
                  checked={program.status === 'active'}
                  onCheckedChange={(active) => toggleStatus(program, active)}
                  aria-label={`Activar ${program.name}`}
                />
              </TableCell>
              <TableCell className="text-right">
                <RowActions actions={[
                  { label: 'Editar', icon: TbPencil, onClick: () => setPanel({ mode: 'edit', program }) },
                  // Con leads no se elimina (perderían su programa): se desactiva
                  {
                    label: program.leads ? 'Tiene leads: desactívalo' : 'Eliminar',
                    icon: TbTrash,
                    onClick: () => setDeleting(program),
                    destructive: true,
                    disabled: !!program.leads,
                  },
                ]} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <FormSheet
        open={!!panel}
        onOpenChange={(open) => !open && setPanel(null)}
        title={panel?.mode === 'edit' ? 'Editar programa' : 'Nuevo programa'}
      >
        {panel ? (
          <ProgramForm
            key={panel.mode === 'edit' ? panel.program._id : 'create'}
            initialData={panel.mode === 'edit' ? panel.program : undefined}
            onSubmit={(data) => programService.upsert(panel.mode === 'edit' ? { ...panel.program, ...data } : data)}
            onSuccess={handleSaved}
          />
        ) : null}
      </FormSheet>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Eliminar programa"
        description={`Se eliminará "${deleting?.name || ''}" del catálogo.`}
        onConfirm={handleDelete}
      />
    </SettingsCard>
  )
}
