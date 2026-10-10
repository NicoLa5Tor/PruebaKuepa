import { TbPlus, TbTrash } from 'react-icons/tb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { moveItem } from '@/util/utils'
import { useEditableSetting } from '@/hooks/use-editable-setting'
import { IInscriptionPage } from '@/services/globalService'
import { BENEFIT_ICONS } from '@/components/inscription/benefit-icons'
import { SettingsCard } from './settings-card'
import { ReorderButtons } from './reorder-buttons'

type Benefit = IInscriptionPage['benefits'][number]

const DEFAULT_ICON = Object.keys(BENEFIT_ICONS)[0]

export function InscriptionSettings() {
  const { value, setValue, loading, saving, errors, save } = useEditableSetting<IInscriptionPage>('inscription_page')

  const invalid = (key: string) => errors[key] && 'border-red-400'

  const setBenefits = (benefits: Benefit[]) => setValue({ ...value, benefits })
  const updateBenefit = (index: number, changes: Partial<Benefit>) =>
    setBenefits(value.benefits.map((benefit, i) => i === index ? { ...benefit, ...changes } : benefit))

  return (
    <SettingsCard
      title="Página de inscripción"
      description="Contenido que ve un prospecto en /inscripcion."
      loading={loading}
      onSave={save}
      saving={saving}
      action={
        <a href="/inscripcion" target="_blank" rel="noreferrer" className="text-xs text-purple-700 hover:underline whitespace-nowrap">
          Ver página
        </a>
      }
    >
      {value ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="heading">Título</Label>
            <Input
              id="heading"
              value={value.heading}
              onChange={(e) => setValue({ ...value, heading: e.target.value })}
              className={cn(invalid('heading'))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descripción del formulario</Label>
            <Textarea
              id="description"
              rows={2}
              value={value.description}
              onChange={(e) => setValue({ ...value, description: e.target.value })}
              className={cn(invalid('description'))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Beneficios</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => setBenefits([...value.benefits, { icon: DEFAULT_ICON, text: '' }])}
              >
                <TbPlus /> Agregar
              </Button>
            </div>
            {!value.benefits.length ? <span className="text-sm text-slate-500">Sin beneficios.</span> : null}
            <ul className="flex flex-col gap-2">
              {value.benefits.map((benefit, index) => {
                const Icon = BENEFIT_ICONS[benefit.icon]?.icon
                return (
                  <li key={index} className="flex items-center gap-2">
                    <Select value={benefit.icon} onValueChange={(icon) => updateBenefit(index, { icon })}>
                      <SelectTrigger className="w-40 shrink-0" aria-label="Ícono">
                        {Icon ? <Icon className="h-4 w-4 text-purple-700" /> : null}
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(BENEFIT_ICONS).map(([name, option]) => (
                          <SelectItem key={name} value={name}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={benefit.text}
                      onChange={(e) => updateBenefit(index, { text: e.target.value })}
                      aria-label={`Beneficio ${index + 1}`}
                      className={cn('grow', invalid(`benefits.${index}.text`))}
                    />
                    <ReorderButtons index={index} total={value.benefits.length} onMove={(direction) => setBenefits(moveItem(value.benefits, index, direction))} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                      onClick={() => setBenefits(value.benefits.filter((_, i) => i !== index))}
                      aria-label="Quitar beneficio"
                    >
                      <TbTrash />
                    </Button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      ) : null}
    </SettingsCard>
  )
}
