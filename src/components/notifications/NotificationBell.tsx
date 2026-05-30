'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNotificationStore } from '@/lib/stores/notification.store'
import { NotificationPanel } from './NotificationPanel'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const unreadCount = useNotificationStore((s) => s.unreadCount())

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="size-7 text-muted-foreground relative"
        aria-label="Bildirimler"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
      <NotificationPanel open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
