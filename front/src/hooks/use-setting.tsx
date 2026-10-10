import { useEffect, useState } from "react"
import { globalService } from "@/services/globalService"

// Lee una configuración pública de la base (GET /api/global/setting/:key)
export function useSetting<T>(key: string) {
  const [value, setValue] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    globalService.setting(key).then((response) => {
      if (!active) return
      setValue(response?.code === 200 ? response.value : null)
      setLoading(false)
    })
    return () => { active = false }
  }, [key])

  return { value, loading }
}
