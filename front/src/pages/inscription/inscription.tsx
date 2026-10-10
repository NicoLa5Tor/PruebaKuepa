import { useState } from "react"
import { Link } from "react-router-dom"
import { TbCircleCheck, TbClock, TbHeadset, TbSchool } from "react-icons/tb"
import { LeadForm } from "@/components/leads/lead-form"
import { Button } from "@/components/ui/button"
import { ILeadInput, leadService } from "@/services/leadService"

// Página pública: un prospecto deja sus datos y llega al CRM como lead orgánico
function Inscription () {
  const [name, setName] = useState('')
  const [registered, setRegistered] = useState(false)

  // El endpoint público no devuelve datos, así que el nombre se toma de lo enviado
  const handleSubmit = (data: ILeadInput) => {
    setName(data.first_name.trim().split(' ')[0])
    return leadService.external(data)
  }

  const benefits = [
    { icon: TbSchool, text: 'Programas técnicos y bachillerato con enfoque práctico' },
    { icon: TbClock, text: 'Estudia a tu ritmo, 100% virtual' },
    { icon: TbHeadset, text: 'Un asesor te acompaña en todo el proceso' },
  ]

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col justify-between bg-orange-900 p-10 text-white">
        <Link to="/inscripcion" className="flex items-center bg-white w-fit px-4 py-2 rounded-md">
          <img src="/logo.jpeg" alt="Kuepa" className="w-28 h-28" />
        </Link>
        <div className="flex flex-col gap-6 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">Da el siguiente paso en tu educación</h1>
          <ul className="flex flex-col gap-4">
            {benefits.map((benefit) => (
              <li key={benefit.text} className="flex items-center gap-3 text-orange-50">
                <benefit.icon className="h-6 w-6 shrink-0 text-orange-300" />
                <span>{benefit.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <span className="text-xs text-orange-200">kuepa EduTech</span>
      </div>

      <div className="flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-xl">
          <div className="flex lg:hidden justify-center mb-4">
            <img src="/logo.jpeg" alt="Kuepa" className="w-24 h-24" />
          </div>
          {registered ? (
            <div className="flex flex-col items-center text-center gap-4 py-10">
              <TbCircleCheck className="h-16 w-16 text-orange-500" />
              <h2 className="text-3xl font-bold text-orange-900">¡Gracias, {name}!</h2>
              <p className="text-slate-600 max-w-sm">
                Recibimos tus datos. Un asesor de Kuepa se pondrá en contacto contigo muy pronto para contarte todo sobre el programa.
              </p>
              <Button variant="link" onClick={() => setRegistered(false)} className="text-orange-600">
                Registrar a otra persona
              </Button>
            </div>
          ) : (
            <>
              <span className="flex text-5xl mb-2 font-extrabold bg-gradient-to-r from-orange-400 via-orange-600 to-orange-400 text-transparent bg-clip-text animate-gradient">kuepa</span>
              <h2 className="text-2xl font-semibold text-orange-900">Quiero más información</h2>
              <p className="text-sm text-slate-500 mb-6">Déjanos tus datos y un asesor te contactará.</p>
              <LeadForm
                accent="orange"
                submitLabel="Quiero que me contacten"
                onSubmit={handleSubmit}
                onSuccess={() => setRegistered(true)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Inscription
