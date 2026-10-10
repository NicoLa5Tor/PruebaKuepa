import { app } from "@/atoms/kuepa"
import { useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProgramsSettings } from "@/components/settings/programs-settings"
import { DocumentTypesSettings } from "@/components/settings/document-types-settings"
import { InscriptionSettings } from "@/components/settings/inscription-settings"
import { ContactSettings } from "@/components/settings/contact-settings"

export interface SettingsProps {
}

const SECTIONS = [
  { value: 'programs', label: 'Programas', content: <ProgramsSettings /> },
  { value: 'documents', label: 'Tipos de documento', content: <DocumentTypesSettings /> },
  { value: 'inscription', label: 'Página de inscripción', content: <InscriptionSettings /> },
  { value: 'contact', label: 'Mensajes de contacto', content: <ContactSettings /> },
]

export default function Settings (props?: SettingsProps) {
  // La pestaña activa queda en la URL (?tab=) para poder recargar o compartir el enlace
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = SECTIONS.some((section) => section.value === searchParams.get('tab')) ? searchParams.get('tab') : SECTIONS[0].value

  useEffect(() => {
    app.set({
      ...(app.get() || {}),
      app: 'kuepa',
      module: 'settings',
      window: 'crm',
      back: null,
      accent: 'purple',
      breadcrumb:[
        {
          title: 'Configuración',
          url: '/settings'
        }
      ]
    })
  }, [])

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div>
        <h1 className="flex text-3xl md:text-4xl font-title text-purple-800">Configuración</h1>
        <p className="text-sm text-slate-500">Datos que usan los formularios y los mensajes del CRM.</p>
      </div>

      <Tabs value={tab} onValueChange={(value) => setSearchParams({ tab: value }, { replace: true })}>
        <TabsList className="flex-wrap h-auto">
          {SECTIONS.map((section) => (
            <TabsTrigger key={section.value} value={section.value}>{section.label}</TabsTrigger>
          ))}
        </TabsList>
        {SECTIONS.map((section) => (
          <TabsContent key={section.value} value={section.value} className="mt-4">
            {section.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
