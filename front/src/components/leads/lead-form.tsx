import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { FieldError, ILeadInput } from '@/services/leadService'
import { IProgram, programService } from '@/services/programService'
import { IDocumentType } from '@/services/globalService'
import { useSetting } from '@/hooks/use-setting'

const EMPTY: ILeadInput = {
  first_name: '',
  last_name: '',
  // Se completa con el primer tipo configurado en la base
  document_type: '',
  document: '',
  email: '',
  mobile_phone: '',
  interestProgram: '',
}

// Mismas reglas que valida leadService en el back
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_REGEX = /^\+?\d{7,15}$/
const DOCUMENT_REGEX = /^[a-zA-Z0-9]{4,20}$/

const MESSAGES: Record<string, Partial<Record<FieldError, string>>> = {
  email: { invalid: 'Ingresa un email válido' },
  mobile_phone: { invalid: 'Ingresa un celular válido (7 a 15 dígitos)' },
  document: { invalid: 'Solo letras y números, entre 4 y 20 caracteres' },
  document_type: { invalid: 'Selecciona un tipo de documento' },
  interestProgram: { invalid: 'Selecciona un programa', not_found: 'Ese programa ya no está disponible' },
}

const RESPONSE_ERRORS: Record<number, string> = {
  409: 'Ya existe un lead abierto para esta persona.',
  404: 'No encontramos la información necesaria para registrar el lead.',
}

const messageFor = (field: string, error: FieldError) =>
  MESSAGES[field]?.[error] || (error === 'required' ? 'Este campo es obligatorio' : 'Valor inválido')

const validate = (data: ILeadInput) => {
  const fields: Record<string, FieldError> = {}
  for (const [field, value] of Object.entries(data)) {
    if (!value.trim()) fields[field] = 'required'
  }
  if (data.email && !EMAIL_REGEX.test(data.email.trim())) fields.email = 'invalid'
  if (data.mobile_phone && !PHONE_REGEX.test(data.mobile_phone.replace(/[\s\-()]/g, ''))) fields.mobile_phone = 'invalid'
  if (data.document && !DOCUMENT_REGEX.test(data.document.replace(/[\s.]/g, ''))) fields.document = 'invalid'
  return fields
}

export interface LeadFormProps {
  // Devuelve la respuesta del back ({ code, fields?, ... })
  onSubmit: (data: ILeadInput) => Promise<any>
  onSuccess?: (response: any) => void
  submitLabel?: string
  accent?: 'purple' | 'orange'
}

export function LeadForm({ onSubmit, onSuccess, submitLabel = 'Guardar lead', accent = 'purple' }: LeadFormProps) {
  const [data, setData] = useState<ILeadInput>(EMPTY)
  const [errors, setErrors] = useState<Record<string, FieldError>>({})
  const [general, setGeneral] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [programs, setPrograms] = useState<IProgram[]>([])
  const { value: documentTypes, loading: loadingSettings } = useSetting<IDocumentType[]>('document_types')

  const defaultDocumentType = documentTypes?.[0]?.value || ''

  useEffect(() => {
    programService.list().then((response) => setPrograms(response?.list || []))
  }, [])

  useEffect(() => {
    if (defaultDocumentType) setData((current) => current.document_type ? current : { ...current, document_type: defaultDocumentType })
  }, [defaultDocumentType])

  const set = (field: keyof ILeadInput) => (value: string) => {
    setData((current) => ({ ...current, [field]: value }))
    if (errors[field]) setErrors(({ [field]: _removed, ...rest }) => rest)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setGeneral(null)

    const fields = validate(data)
    setErrors(fields)
    if (Object.keys(fields).length) return

    setLoading(true)
    const response = await onSubmit(data)
    setLoading(false)

    if (response?.code === 200) {
      setData({ ...EMPTY, document_type: defaultDocumentType })
      onSuccess?.(response)
    } else if (response?.fields) {
      setErrors(response.fields)
    } else {
      setGeneral(RESPONSE_ERRORS[response?.code] || 'No pudimos guardar la información. Intenta de nuevo.')
    }
  }

  const field = (name: keyof ILeadInput, label: string, input: JSX.Element, className?: string) => (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={name} className={errors[name] ? 'text-red-600' : ''}>{label}</Label>
      {input}
      {errors[name] ? (
        <span id={`${name}-error`} className="text-xs text-red-600">{messageFor(name, errors[name])}</span>
      ) : null}
    </div>
  )

  const inputProps = (name: keyof ILeadInput) => ({
    id: name,
    value: data[name],
    disabled: loading,
    onChange: (e: ChangeEvent<HTMLInputElement>) => set(name)(e.target.value),
    'aria-invalid': !!errors[name],
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
    className: errors[name] ? 'border-red-400 focus-visible:ring-red-400' : '',
  })

  const button = accent === 'orange'
    ? 'bg-orange-500 hover:bg-orange-600 text-white'
    : 'bg-purple-700 hover:bg-purple-800 text-white'

  return (
    <form noValidate onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {general ? (
        <Alert variant="destructive" className="sm:col-span-2">
          <AlertDescription>{general}</AlertDescription>
        </Alert>
      ) : null}
      {!loadingSettings && !documentTypes?.length ? (
        <Alert variant="destructive" className="sm:col-span-2">
          <AlertDescription>No pudimos cargar la configuración del formulario. Intenta más tarde.</AlertDescription>
        </Alert>
      ) : null}

      {field('first_name', 'Nombres', <Input {...inputProps('first_name')} autoComplete="given-name" autoFocus />)}
      {field('last_name', 'Apellidos', <Input {...inputProps('last_name')} autoComplete="family-name" />)}

      {field('document_type', 'Tipo de documento',
        <Select value={data.document_type} onValueChange={set('document_type')} disabled={loading}>
          <SelectTrigger id="document_type" aria-invalid={!!errors.document_type}>
            <SelectValue placeholder="Selecciona" />
          </SelectTrigger>
          <SelectContent>
            {(documentTypes || []).map((type) => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {field('document', 'Número de documento', <Input {...inputProps('document')} inputMode="numeric" />)}

      {field('email', 'Email', <Input {...inputProps('email')} type="email" autoComplete="email" />)}
      {field('mobile_phone', 'Celular', <Input {...inputProps('mobile_phone')} type="tel" autoComplete="tel" placeholder="300 123 4567" />)}

      {field('interestProgram', 'Programa de interés',
        <Select value={data.interestProgram} onValueChange={set('interestProgram')} disabled={loading}>
          <SelectTrigger id="interestProgram" aria-invalid={!!errors.interestProgram} className={errors.interestProgram ? 'border-red-400' : ''}>
            <SelectValue placeholder={programs.length ? 'Selecciona un programa' : 'Cargando programas…'} />
          </SelectTrigger>
          <SelectContent>
            {programs.map((program) => (
              <SelectItem key={program._id} value={program._id}>{program.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>,
        'sm:col-span-2'
      )}

      <div className="sm:col-span-2 flex justify-end pt-2">
        <Button type="submit" disabled={loading} className={cn('w-full sm:w-auto min-w-40', button)}>
          {loading ? 'Guardando…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
