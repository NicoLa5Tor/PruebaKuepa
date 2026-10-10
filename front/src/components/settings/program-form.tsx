import { FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { IProgram } from '@/services/programService'

const RESPONSE_ERRORS: Record<string, string> = {
  'program.duplicate': 'Ya existe un programa con ese nombre.',
  'program.not_found': 'El programa ya no existe.',
}

export interface ProgramFormProps {
  initialData?: IProgram
  // Devuelve la respuesta del back ({ code, message?, fields? })
  onSubmit: (data: Partial<IProgram>) => Promise<any>
  onSuccess: (response: any) => void
}

export function ProgramForm({ initialData, onSubmit, onSuccess }: ProgramFormProps) {
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError('El nombre es obligatorio.')

    setError(null)
    setLoading(true)
    const response = await onSubmit({ name, description })
    setLoading(false)

    if (response?.code === 200) onSuccess(response)
    else setError(RESPONSE_ERRORS[response?.message] || 'No pudimos guardar el programa. Intenta de nuevo.')
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="program_name">Nombre</Label>
        <Input id="program_name" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} autoFocus />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="program_description">Descripción</Label>
        <Textarea id="program_description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} disabled={loading} />
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={loading} className="min-w-40 bg-purple-700 hover:bg-purple-800 text-white">
          {loading ? 'Guardando…' : 'Guardar programa'}
        </Button>
      </div>
    </form>
  )
}
