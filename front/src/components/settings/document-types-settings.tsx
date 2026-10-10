import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { moveItem } from '@/util/utils'
import { useEditableSetting } from '@/hooks/use-editable-setting'
import { IDocumentType } from '@/services/globalService'
import { SettingsCard } from './settings-card'
import { ReorderButtons } from './reorder-buttons'

export function DocumentTypesSettings() {
  const { value, setValue, loading, saving, errors, save, dirty } = useEditableSetting<IDocumentType[]>('document_types')
  const types = value || []

  const update = (index: number, changes: Partial<IDocumentType>) =>
    setValue(types.map((type, i) => i === index ? { ...type, ...changes } : type))

  return (
    <SettingsCard
      title="Tipos de documento"
      description="Los códigos los define el sistema; aquí cambias su nombre, el orden y cuáles se ofrecen. El primero activo es el valor por defecto del formulario."
      loading={loading}
      onSave={save}
      saving={saving}
      dirty={dirty}
    >
      <ul className="flex flex-col divide-y divide-slate-100">
        {types.map((type, index) => (
          <li key={type.value} className="flex items-center gap-3 py-2">
            <span className="w-10 shrink-0 text-xs font-semibold uppercase text-slate-400">{type.value}</span>
            <Input
              value={type.label}
              onChange={(e) => update(index, { label: e.target.value })}
              aria-label={`Nombre de ${type.value}`}
              className={cn('grow', errors[`${index}.label`] && 'border-red-400')}
            />
            <label className="flex items-center gap-2 text-xs text-slate-500">
              <Switch checked={type.active} onCheckedChange={(active) => update(index, { active })} />
              Activo
            </label>
            <ReorderButtons index={index} total={types.length} onMove={(direction) => setValue(moveItem(types, index, direction))} />
          </li>
        ))}
      </ul>
      {errors.active ? <span className="text-xs text-red-600">Debe quedar al menos un tipo activo.</span> : null}
    </SettingsCard>
  )
}
