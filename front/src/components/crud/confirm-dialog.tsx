import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  // Devuelve true si la acción salió bien; así el diálogo sabe si cerrarse
  onConfirm: () => Promise<boolean>
}

// Confirmación para acciones destructivas (eliminar)
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = 'Eliminar', onConfirm }: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    const done = await onConfirm()
    setLoading(false)
    if (done) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !loading && onOpenChange(value)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" disabled={loading} onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="destructive" disabled={loading} onClick={handleConfirm}>
            {loading ? 'Eliminando…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
