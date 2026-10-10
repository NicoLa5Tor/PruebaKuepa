import { app, user } from "@/atoms/kuepa"
import { useEffect, useState } from "react"
import { useStore } from "@nanostores/react"
import { Link } from "react-router-dom"
import moment from "moment"
import { TbArrowRight, TbExternalLink, TbListDetails, TbSchool, TbTrendingUp, TbUserPlus, TbUsers } from "react-icons/tb"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { LeadStatusBadge } from "@/components/leads/lead-status"
import { ILeadStats, leadService } from "@/services/leadService"

export interface HomeProps {
}

const greeting = () => {
  const hour = moment().hour()
  if (hour < 12) return 'Buenos días'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export default function Home (props?: HomeProps) {
  const $user = useStore(user)
  const [stats, setStats] = useState<ILeadStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    app.set({
      ...(app.get() || {}),
      app: 'kuepa',
      module: 'home',
      window: 'crm',
      back: null,
      accent: 'slate',
      breadcrumb:[
        {
          title: 'Home',
          url: '/home'
        }
      ]
    })
    leadService.stats().then((response) => {
      if (response?.code === 200) setStats(response)
      setLoading(false)
    })
  }, [])

  const sold = stats?.by_status.find((_s) => _s.status === 'sold')?.total || 0
  const topProgram = stats?.by_program[0]
  const maxProgram = Math.max(1, ...(stats?.by_program.map((_p) => _p.total) || []))

  const kpis = [
    { label: 'Leads totales', value: stats?.total ?? 0, icon: TbUsers, tone: 'text-purple-700 bg-purple-50' },
    { label: 'Últimos 7 días', value: stats?.last_week ?? 0, icon: TbTrendingUp, tone: 'text-sky-700 bg-sky-50' },
    { label: 'Matriculados', value: sold, icon: TbSchool, tone: 'text-emerald-700 bg-emerald-50' },
  ]

  return (
    <div className="flex flex-col gap-5 pb-6">
      <div>
        <h1 className="flex text-3xl md:text-4xl font-title text-slate-800">
          {greeting()}, {$user?.profile?.first_name || 'equipo'}
        </h1>
        <p className="text-sm text-slate-500 first-letter:uppercase">{moment().format('dddd, D [de] MMMM')} · así va tu bandeja de prospectos</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${kpi.tone}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-500">{kpi.label}</span>
                {loading ? <Skeleton className="h-7 w-12 mt-1" /> : <span className="text-2xl font-semibold text-slate-800 tabular-nums">{kpi.value}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardContent className="p-4 flex flex-col">
            <span className="text-xs text-slate-500">Programa más solicitado</span>
            {loading
              ? <Skeleton className="h-5 w-40 mt-2" />
              : <span className="text-sm font-semibold text-slate-800 mt-1 line-clamp-2">{topProgram?.name || 'Sin datos aún'}</span>}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-slate-800">Leads por programa</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {loading ? <Skeleton className="h-24 w-full" /> : null}
            {!loading && !stats?.by_program.length ? <span className="text-sm text-slate-500">Aún no hay leads registrados.</span> : null}
            {stats?.by_program.map((program) => (
              <div key={program.name} className="flex flex-col gap-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700">{program.name}</span>
                  <span className="text-slate-500 tabular-nums">{program.total}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-purple-600" style={{ width: `${(program.total / maxProgram) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-slate-800">Accesos rápidos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link to="/leads?new=1" className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-purple-50 hover:border-purple-200 transition-colors">
              <TbUserPlus className="h-5 w-5 text-purple-700" />
              <span className="text-sm font-medium text-slate-700 grow">Registrar un lead</span>
              <TbArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
            <Link to="/leads" className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-purple-50 hover:border-purple-200 transition-colors">
              <TbListDetails className="h-5 w-5 text-purple-700" />
              <span className="text-sm font-medium text-slate-700 grow">Ver todos los leads</span>
              <TbArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
            <a href="/inscripcion" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-orange-50 hover:border-orange-200 transition-colors">
              <TbExternalLink className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-medium text-slate-700 grow">Formulario público de inscripción</span>
              <TbArrowRight className="h-4 w-4 text-slate-400" />
            </a>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base text-slate-800">Últimos registros</CardTitle>
            <Link to="/leads" className="text-xs text-purple-700 hover:underline">Ver todos</Link>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-slate-100">
            {loading ? <Skeleton className="h-24 w-full" /> : null}
            {!loading && !stats?.recent.length ? <span className="text-sm text-slate-500">Cuando registres leads aparecerán aquí.</span> : null}
            {stats?.recent.map((lead) => (
              <div key={lead._id} className="flex items-center justify-between gap-3 py-2">
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-slate-800 truncate">{lead.full_name}</span>
                  <span className="text-xs text-slate-500 truncate">{lead.interestProgram?.name || lead.email}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <LeadStatusBadge status={lead.status} />
                  <span className="hidden sm:inline text-xs text-slate-400 w-24 text-right">{moment(lead.created_at).fromNow()}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-slate-800">Por estado</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {loading ? <Skeleton className="h-20 w-full" /> : null}
            {!loading && !stats?.by_status.length ? <span className="text-sm text-slate-500">Sin datos aún.</span> : null}
            {stats?.by_status.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <LeadStatusBadge status={item.status} />
                <span className="text-sm text-slate-600 tabular-nums">{item.total}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <footer className="pt-2 text-center text-xs text-slate-400">
        Prueba técnica Kuepa · Nicolás Rodríguez Torres
      </footer>
    </div>
  )
}
