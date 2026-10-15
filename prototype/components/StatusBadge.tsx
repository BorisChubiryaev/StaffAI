import { RequestStatus, RequestOwner } from '@/lib/types'
import { STATUS_META, OWNER_META } from '@/lib/demo-store'

interface StatusBadgeProps {
  status: RequestStatus
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const meta = STATUS_META[status] ?? STATUS_META['draft']
  const pad = size === 'sm' ? '2px 8px' : '3px 10px'
  const fs = size === 'sm' ? '11px' : '12px'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: pad, borderRadius: '20px', fontSize: fs, fontWeight: 600,
      color: meta.color, background: meta.bg, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.dot, flexShrink: 0 }} />
      {meta.label}
    </span>
  )
}

interface OwnerBadgeProps {
  owner: RequestOwner
  size?: 'sm' | 'md'
}

export function OwnerBadge({ owner, size = 'sm' }: OwnerBadgeProps) {
  const meta = OWNER_META[owner] ?? OWNER_META['system']
  const pad = size === 'sm' ? '2px 8px' : '3px 10px'
  const fs = size === 'sm' ? '11px' : '12px'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: pad, borderRadius: '20px', fontSize: fs, fontWeight: 600,
      color: meta.color, background: meta.color + '14', border: `1px solid ${meta.color}30`,
    }}>
      ▸ {meta.label}
    </span>
  )
}
