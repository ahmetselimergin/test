'use client'

import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useNotificationStore } from '@/lib/stores/notification.store'
import { useIssueStore } from '@/lib/stores/issue.store'
import { NotificationItem } from './NotificationItem'

interface NotificationPanelProps {
  open: boolean
  onClose: () => void
}

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const { notifications, markRead, markAllRead } = useNotificationStore()
  const setSelectedIssue = useIssueStore((s) => s.setSelectedIssue)
  const issues = useIssueStore((s) => s.issues)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open, onClose])

  async function handleClick(id: string, issueId: string | null) {
    const supabase = createClient()
    markRead(id)
    await supabase.from('notifications').update({ read: true }).eq('id', id)

    if (issueId) {
      const issue = issues.find((i) => i.id === issueId)
      if (issue) setSelectedIssue(issue)
    }
    onClose()
  }

  async function handleMarkAllRead() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    markAllRead()
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="absolute right-0 top-full mt-2 w-[320px] rounded-xl border border-border bg-popover shadow-xl overflow-hidden z-50"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-[13px] font-semibold text-foreground">Bildirimler</span>
            {notifications.some((n) => !n.read) && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] text-primary hover:text-primary/80 transition-colors"
              >
                Tümünü okundu işaretle
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-[13px] text-muted-foreground font-medium">Henüz bildirim yok</p>
                <p className="text-[11px] text-muted-foreground/60 mt-1">Issue atandığında burada görünür</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onClick={() => handleClick(n.id, n.issue_id)}
                />
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
