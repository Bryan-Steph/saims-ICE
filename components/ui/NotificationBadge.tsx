'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

export function NotificationBadge() {
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    const supabase = createClient()
    const { count: n } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('read', false)
    setCount(n ?? 0)
  }, [])

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 30_000)
    return () => clearInterval(t)
  }, [refresh])

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