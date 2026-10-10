import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@nanostores/react'
import moment from 'moment'
import { TbBell, TbBellOff, TbChecks } from 'react-icons/tb'
import { notifications } from '@/atoms/kuepa'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from '@/components/hooks/use-toast'
import { useSocketEvent } from '@/hooks/use-socket-event'
import { cn } from '@/lib/utils'
import { INotification, notificationService } from '@/services/notificationService'

// El back devuelve como máximo 20; la lista local no crece más que eso
const LIMIT = 20

export function Notifications() {
  const $notifications = useStore(notifications)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    notificationService.list().then((response) => {
      if (response?.code === 200) notifications.set({ list: response.list, unread: response.unread })
    })
  }, [])

  useSocketEvent<INotification>('notification:new', (notification) => {
    const current = notifications.get()
    notifications.set({
      list: [notification, ...current.list].slice(0, LIMIT),
      unread: current.unread + 1,
    })
    toast({ title: notification.title, description: notification.body })
  })

  const markAsRead = async (ids?: string[]) => {
    const response = await notificationService.read(ids)
    if (response?.code !== 200) return
    const now = new Date().toISOString()
    notifications.set({
      unread: response.unread,
      list: notifications.get().list.map((item) =>
        !ids || ids.includes(item._id) ? { ...item, read_at: item.read_at || now } : item
      ),
    })
  }

  const handleSelect = (notification: INotification) => {
    if (!notification.read_at) markAsRead([notification._id])
    setOpen(false)
    navigate('/leads')
  }

  const unread = $notifications.unread

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative flex h-7 w-7" aria-label={`Notificaciones${unread ? `, ${unread} sin leer` : ''}`}>
          <TbBell className="h-4 w-4" />
          {unread ? (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <span className="text-sm font-semibold text-slate-800">Notificaciones</span>
          {unread ? (
            <button onClick={() => markAsRead()} className="flex items-center gap-1 text-xs text-purple-700 hover:underline">
              <TbChecks className="h-3.5 w-3.5" /> Marcar todas como leídas
            </button>
          ) : null}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {!$notifications.list.length ? (
            <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
              <TbBellOff className="h-8 w-8" />
              <span className="text-sm">No tienes notificaciones</span>
            </div>
          ) : null}
          {$notifications.list.map((notification) => (
            <button
              key={notification._id}
              onClick={() => handleSelect(notification)}
              className={cn(
                'flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-50',
                !notification.read_at && 'bg-purple-50/60'
              )}
            >
              <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', notification.read_at ? 'bg-transparent' : 'bg-purple-600')} />
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-medium text-slate-800">{notification.title}</span>
                <span className="truncate text-xs text-slate-600">{notification.body}</span>
                <span className="mt-0.5 text-[11px] text-slate-400">{moment(notification.created_at).fromNow()}</span>
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
