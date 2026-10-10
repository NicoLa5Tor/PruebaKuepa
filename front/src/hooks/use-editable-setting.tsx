import { useEffect, useState } from "react"
import { toast } from "@/components/hooks/use-toast"
import { globalService } from "@/services/globalService"

/**
* Carga una configuración para editarla (incluye las privadas) y la guarda validada por el back.
* errors trae los campos que rechazó el back, p. ej. { 'benefits.0.text': 'required' }.
*/
export function useEditableSetting<T>(key: string) {
  const [value, setValue] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    globalService.editSetting(key).then((response) => {
      setValue(response?.code === 200 ? response.value : null)
      setLoading(false)
    })
  }, [key])

  const save = async () => {
    setSaving(true)
    const response = await globalService.updateSetting(key, value)
    setSaving(false)

    if (response?.code === 200) {
      setErrors({})
      setValue(response.value)
      toast({ title: 'Cambios guardados' })
    } else {
      setErrors(response?.fields || {})
      toast({ variant: 'destructive', title: 'No se pudieron guardar los cambios', description: response?.fields ? 'Revisa los campos marcados.' : undefined })
    }
  }

  return { value, setValue, loading, saving, errors, save }
}
