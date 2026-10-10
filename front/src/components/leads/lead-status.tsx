import { cn } from '@/lib/utils'
import { LeadStatus } from '@/services/leadService'

export const LEAD_STATUS: Record<LeadStatus, { label: string, className: string }> = {
  active: { label: 'Nuevo', className: 'bg-sky-50 text-sky-800 ring-sky-200' },
  grading: { label: 'En gestión', className: 'bg-amber-50 text-amber-800 ring-amber-200' },
  sold: { label: 'Matriculado', className: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  dropped: { label: 'Descartado', className: 'bg-rose-50 text-rose-800 ring-rose-200' },
  inactive: { label: 'Inactivo', className: 'bg-slate-100 text-slate-700 ring-slate-200' },
}

export interface LeadStatusBadgeProps {
  status: LeadStatus
}

export function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  const config = LEAD_STATUS[status] || LEAD_STATUS.inactive
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap', config.className)}>
      {config.label}
    </span>
  )
}
