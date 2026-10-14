import React from 'react'

export interface WorkflowStepCardProps {
  number: number
  title: string
  subtitle: string
  status: 'done' | 'active' | 'pending'
  action?: React.ReactNode
}

/**
 * Карточка одного шага workflow.
 * ВАЖНО: компонент определён на уровне модуля, а не внутри родительского компонента,
 * чтобы React не ремаунтировал его при каждом ре-рендере (фикс потери фокуса input).
 */
export function WorkflowStepCard({ number, title, subtitle, status, action }: WorkflowStepCardProps) {
  const colors = {
    done:    { border: '#BBF7D0', bg: '#F0FDF4', numBg: '#16A34A', textColor: '#14532D' },
    active:  { border: '#BFDBFE', bg: '#EFF6FF', numBg: '#2563EB', textColor: '#1E40AF' },
    pending: { border: '#E2E8F0', bg: '#F8FAFC', numBg: '#E2E8F0', textColor: '#94A3B8' },
  }[status]

  return (
    <div style={{
      display: 'flex',
      gap: 14,
      padding: '14px 16px',
      borderRadius: 10,
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      marginBottom: 10,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: colors.numBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 800, color: '#FFFFFF',
      }}>
        {status === 'done' ? '✓' : number}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 14,
          fontWeight: 700,
          color: status === 'pending' ? '#94A3B8' : '#0F172A',
          marginBottom: 2,
        }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: status === 'pending' ? '#CBD5E1' : '#64748B' }}>
          {subtitle}
        </div>
        {action && status === 'active' && (
          <div style={{ marginTop: 10 }}>{action}</div>
        )}
      </div>
    </div>
  )
}
