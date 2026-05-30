'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useNotificationStore, type AppNotification } from '@/lib/stores/notification.store'

export function NotificationsProvider({ userId }: { userId: string }) {
  const { setNotifications, addNotification } = useNotificationStore()

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('notifications')
      .select('*, actor:profiles!actor_id(full_name, avatar_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setNotifications(data as AppNotification[])
      })

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          addNotification(payload.new as AppNotification)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, setNotifications, addNotification])

  return null
}
