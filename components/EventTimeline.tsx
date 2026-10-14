import { DemoEvent } from '@/lib/types'

const ACTOR_COLOR: Record<string, string> = {
  customer: '#2563EB',
  staff:    '#0E7490',
  ai:       '#7C3AED',
  system:   '#64748B',
}

const ACTOR_ICON: Record<string, string> = {
  customer: '👤',
  staff:    '🎯',
  ai:       '✦',
  system:   '⚙',
}

interface EventTimelineProps {
  events: DemoEvent[]
}

export function EventTimeline({ events }: EventTimelineProps) {
  const sorted = [...events].reverse()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {sorted.map((ev, i) => (
        <div key={ev.id} style={{ display: 'flex', gap: 12 }}>
          {/* Left: dot + line */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: ACTOR_COLOR[ev.actor] + '14',
              border: `1.5px solid ${ACTOR_COLOR[ev.actor]}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12,
            }}>
              {ACTOR_ICON[ev.actor]}
            </div>
            {i < sorted.length - 1 && (
              <div style={{ width: 1, flex: 1, background: '#E2E8F0', margin: '4px 0' }} />
            )}
          </div>
          {/* Right: content */}
          <div style={{ paddingBottom: 16, flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: ACTOR_COLOR[ev.actor], textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {ev.actor === 'ai' ? 'AI-агент' : ev.actor === 'customer' ? 'Заказчик' : ev.actor === 'staff' ? 'Штаб' : 'Система'}
              </span>
              <span style={{ fontSize: 11, color: '#94A3B8', flexShrink: 0, marginLeft: 8 }}>{ev.timestamp}</span>
            </div>
            <p style={{ fontSize: 13, color: '#334155', lineHeight: '1.5' }}>{ev.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
