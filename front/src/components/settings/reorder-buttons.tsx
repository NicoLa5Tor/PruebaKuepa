import { TbArrowDown, TbArrowUp } from 'react-icons/tb'
import { Button } from '@/components/ui/button'

export interface ReorderButtonsProps {
  index: number
  total: number
  onMove: (direction: -1 | 1) => void
}

export function ReorderButtons({ index, total, onMove }: ReorderButtonsProps) {
  return (
    <div className="flex">
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={index === 0} onClick={() => onMove(-1)} aria-label="Subir">
        <TbArrowUp />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={index === total - 1} onClick={() => onMove(1)} aria-label="Bajar">
        <TbArrowDown />
      </Button>
    </div>
  )
}
