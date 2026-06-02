'use client'

import { useState }    from 'react'
import { useRouter }   from 'next/navigation'
import { createClient } from '@/lib/supabase'

type NotifItem = {
  id:         string
  type:       string
  title:      string
  message:    string
  read:       boolean
  created_at: string
}

const TYPE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  application_accepted:     { color: '#10B981', bg: 'rgba(16,185,129,0.12)',  label: 'Accepted'        },
  application_declined:     { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   label: 'Declined'        },
  application_under_review: { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', label: 'Under Review'    },
  application_pending:      { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'Pending'         },
  new_application:          { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', label: 'New Application' },
  report_feedback:          { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', label: 'Report'          },
  system:                   { color: '#6B7280', bg: 'rgba(107,114,128,0.12)',label: 'System'          },
}

function cfg(type: string) {
  return TYPE_CONFIG[type] ?? {
    color: '#6B7280', bg: 'rgba(107,114,128,0.12)',
    label: type.replace(/_/g, ' '),
  }
}

function timeAgo(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  < 1)  return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  < 7)  return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

const BELL_PATH = 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0'

interface Props { notifications: NotifItem[] }

export function NotificationFeed({ notifications }: Props) {
  const router         = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const unread          = notifications.filter(n => !n.read)

  async function markOne(id: string) {
    setBusy(id)
    const sb = createClient()
    await sb.from('notifications').update({ read: true }).eq('id', id)
    router.refresh()
    setBusy(null)
  }

  async function markAll() {
    if (unread.length === 0) return
    setBusy('all')
    const sb = createClient()
    await sb.from('notifications')
      .update({ read: true })
      .in('id', unread.map(n => n.id))
    router.refresh()
    setBusy(null)
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <p className="text-[10px] font-semibold tracking-widest mb-1.5"
            style={{ color: '#3B82F6', fontFamily: 'var(--font-mono)' }}>
            NOTIFICATIONS
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
            Notifications
          </h1>
          {unread.length > 0 && (
            <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
              {unread.length} unread {unread.length === 1 ? 'notification' : 'notifications'}
            </p>
          )}
        </div>

        {unread.length > 0 && (
          <button
            onClick={markAll}
            disabled={busy === 'all'}
            className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity"
            style={{
              background: 'rgba(59,130,246,0.1)', color: '#3B82F6',
              border: '1px solid rgba(59,130,246,0.2)',
              cursor: busy === 'all' ? 'not-allowed' : 'pointer',
              opacity: busy === 'all' ? 0.5 : 1,
            }}>
            {busy === 'all' ? 'Marking…' : `Mark all as read (${unread.length})`}
          </button>
        )}
      </div>

      {/* ── Empty state ── */}
      {notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl"
          style={{ background: '#101A2E', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(59,130,246,0.1)' }}>
            <svg className="w-7 h-7" style={{ color: '#3B82F6' }} fill="none"
              viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={BELL_PATH} />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-semibold mb-1"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-tx)' }}>
              No notifications yet
            </p>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              You willl be notified about important updates here.
            </p>
          </div>
        </div>
      )}

      {/* ── Notification list ── */}
      {notifications.length > 0 && (
        <div className="flex flex-col gap-2">
          {notifications.map(notif => {
            const c      = cfg(notif.type)
            const isBusy = busy === notif.id
            return (
              <div key={notif.id}
                className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl"
                style={{
                  background: notif.read ? '#101A2E' : 'rgba(59,130,246,0.04)',
                  border: notif.read
                    ? '0.5px solid rgba(255,255,255,0.06)'
                    : '0.5px solid rgba(59,130,246,0.2)',
                }}>

                {/* Unread dot */}
                <div className="flex items-center justify-center w-2 shrink-0"
                  style={{ paddingTop: 6 }}>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full"
                      style={{ background: '#3B82F6', flexShrink: 0 }} />
                  )}
                </div>

                {/* Type icon */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: c.bg }}>
                  <svg className="w-4 h-4" style={{ color: c.color }} fill="none"
                    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={BELL_PATH} />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <p className="text-sm font-semibold leading-snug"
                      style={{ color: 'var(--color-tx)', fontFamily: 'var(--font-heading)' }}>
                      {notif.title}
                    </p>
                    <span className="text-[10px] shrink-0 tabular-nums"
                      style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                      {timeAgo(notif.created_at)}
                    </span>
                  </div>

                  <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                    {notif.message}
                  </p>

                  <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                    {/* Type pill */}
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: c.bg, color: c.color, fontFamily: 'var(--font-mono)' }}>
                      {c.label}
                    </span>

                    {!notif.read && (
                      <button
                        onClick={() => markOne(notif.id)}
                        disabled={isBusy}
                        className="text-xs hover:opacity-70 transition-opacity"
                        style={{
                          color: '#3B82F6', background: 'none', border: 'none',
                          cursor: isBusy ? 'not-allowed' : 'pointer',
                          padding: 0, opacity: isBusy ? 0.5 : 1,
                        }}>
                        {isBusy ? 'Marking…' : 'Mark as read'}
                      </button>
                    )}

                    {notif.read && (
                      <span className="text-[10px]"
                        style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                        ✓ Read
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}