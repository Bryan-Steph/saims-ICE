'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export function NotificationBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function fetchCount() {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      const { count: n } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (!cancelled) setCount(n ?? 0)
    }

    fetchCount()
    const t = setInterval(fetchCount, 30_000)

    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

  if (count === 0) return null

  return (
    <span style={{
      minWidth:       18,
      height:         18,
      borderRadius:   9,
      background:     '#EF4444',
      color:          '#fff',
      fontSize:       9,
      fontWeight:     700,
      display:        'inline-flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '0 4px',
      fontFamily:     'var(--font-mono)',
      lineHeight:     1,
    }}>
      {count > 9 ? '9+' : count}
    </span>
  )
}