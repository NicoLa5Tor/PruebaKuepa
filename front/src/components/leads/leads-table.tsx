import moment from 'moment'
import { TbUserSearch } from 'react-icons/tb'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { ILead } from '@/services/leadService'
import { LeadStatusBadge } from './lead-status'

export interface LeadsTableProps {
  leads: ILead[]
  loading?: boolean
  emptyMessage?: string
  // Fila recién llegada en tiempo real, se resalta brevemente
  highlightId?: string | null
}

export function LeadsTable({ leads, loading, highlightId, emptyMessage = 'Todavía no hay leads registrados.' }: LeadsTableProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3].map((row) => <Skeleton key={row} className="h-10 w-full" />)}
      </div>
    )
  }

  if (!leads.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-500">
        <TbUserSearch className="h-10 w-10 text-purple-300" />
        <span className="text-sm">{emptyMessage}</span>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead className="hidden lg:table-cell">Documento</TableHead>
          <TableHead>Contacto</TableHead>
          <TableHead className="hidden md:table-cell">Programa</TableHead>
          <TableHead className="hidden xl:table-cell">Origen</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="hidden sm:table-cell text-right">Registro</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => (
          <TableRow key={lead._id} className={cn('transition-colors duration-1000', lead._id === highlightId && 'bg-purple-100')}>
            <TableCell className="font-medium text-slate-800">{lead.full_name}</TableCell>
            <TableCell className="hidden lg:table-cell text-slate-600">
              <span className="uppercase text-xs text-slate-400 mr-1">{lead.contact?.document_type}</span>
              {lead.contact?.document}
            </TableCell>
            <TableCell>
              <div className="flex flex-col text-sm">
                <span className="text-slate-700">{lead.email}</span>
                <span className="text-slate-500 text-xs">{lead.mobile_phone}</span>
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell text-slate-600">{lead.interestProgram?.name || '—'}</TableCell>
            <TableCell className="hidden xl:table-cell text-slate-500 text-sm">{lead.adnetwork?.name || '—'}</TableCell>
            <TableCell><LeadStatusBadge status={lead.status} /></TableCell>
            <TableCell className="hidden sm:table-cell text-right text-slate-500 text-sm whitespace-nowrap" title={moment(lead.created_at).format('LLL')}>
              {moment(lead.created_at).fromNow()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
