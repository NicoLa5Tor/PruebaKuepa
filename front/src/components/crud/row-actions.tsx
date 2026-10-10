import { IconType } from 'react-icons'
import { TbDots } from 'react-icons/tb'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export interface RowAction {
  label: string
  icon: IconType
  onClick: () => void
  destructive?: boolean
  disabled?: boolean
}

export interface RowActionsProps {
  actions: RowAction[]
  label?: string
}

// Menú "⋯" de una fila; las acciones destructivas van al final, separadas
export function RowActions({ actions, label = 'Acciones' }: RowActionsProps) {
  const regular = actions.filter((action) => !action.destructive)
  const destructive = actions.filter((action) => action.destructive)

  const item = (action: RowAction) => (
    <DropdownMenuItem
      key={action.label}
      disabled={action.disabled}
      onSelect={action.onClick}
      className={cn('gap-2 cursor-pointer', action.destructive && 'text-red-600 focus:text-red-700')}
    >
      <action.icon className="h-4 w-4" />
      {action.label}
    </DropdownMenuItem>
  )

  // modal={false}: las acciones abren un Sheet o Dialog; con un menú modal Radix puede
  // dejar el body con pointer-events: none al encadenar ambos (problema conocido de Radix)
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={label}>
          <TbDots className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {regular.map(item)}
        {regular.length && destructive.length ? <DropdownMenuSeparator /> : null}
        {destructive.map(item)}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
