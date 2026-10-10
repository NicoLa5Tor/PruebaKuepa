import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export interface SettingsCardProps {
  title: string
  description: string
  loading?: boolean
  // Sin onSave no se muestra el pie con el botón (p. ej. secciones que guardan por fila)
  onSave?: () => void
  saving?: boolean
  action?: ReactNode
  children: ReactNode
}

// Contenedor común de cada sección de la configuración
export function SettingsCard({ title, description, loading, onSave, saving, action, children }: SettingsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base text-slate-800">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {action}
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-40 w-full" /> : children}
      </CardContent>
      {onSave && !loading ? (
        <CardFooter className="justify-end border-t border-slate-100 pt-4">
          <Button onClick={onSave} disabled={saving} className="bg-purple-700 hover:bg-purple-800 text-white">
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  )
}
