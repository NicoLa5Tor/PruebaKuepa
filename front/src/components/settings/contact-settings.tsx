import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useEditableSetting } from '@/hooks/use-editable-setting'
import { IContactTemplates } from '@/services/globalService'
import { SettingsCard } from './settings-card'

// Variables que el back reemplaza al armar el mensaje (leadService.fillTemplate)
const VARIABLES = ['{first_name}', '{program}', '{adviser}']

export function ContactSettings() {
  const { value, setValue, loading, saving, errors, save, dirty } = useEditableSetting<IContactTemplates>('contact_templates')

  const invalid = (key: string) => errors[key] && 'border-red-400'

  return (
    <SettingsCard
      title="Mensajes de contacto"
      description="Texto inicial al contactar un lead por WhatsApp o correo desde el CRM."
      loading={loading}
      onSave={save}
      saving={saving}
      dirty={dirty}
    >
      {value ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            Variables disponibles:
            {VARIABLES.map((variable) => (
              <code key={variable} className="rounded bg-purple-50 px-1.5 py-0.5 text-purple-800">{variable}</code>
            ))}
          </div>
          <div className="flex flex-col gap-1.5 max-w-40">
            <Label htmlFor="country_code">Indicativo del país</Label>
            <Input
              id="country_code"
              inputMode="numeric"
              value={value.country_code}
              onChange={(e) => setValue({ ...value, country_code: e.target.value })}
              className={cn(invalid('country_code'))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="whatsapp">Mensaje de WhatsApp</Label>
            <Textarea
              id="whatsapp"
              rows={3}
              value={value.whatsapp}
              onChange={(e) => setValue({ ...value, whatsapp: e.target.value })}
              className={cn(invalid('whatsapp'))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email_subject">Asunto del correo</Label>
            <Input
              id="email_subject"
              value={value.email.subject}
              onChange={(e) => setValue({ ...value, email: { ...value.email, subject: e.target.value } })}
              className={cn(invalid('email.subject'))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email_body">Cuerpo del correo</Label>
            <Textarea
              id="email_body"
              rows={6}
              value={value.email.body}
              onChange={(e) => setValue({ ...value, email: { ...value.email, body: e.target.value } })}
              className={cn(invalid('email.body'))}
            />
          </div>
        </div>
      ) : null}
    </SettingsCard>
  )
}
