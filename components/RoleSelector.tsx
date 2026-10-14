'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDemoStore, DEMO_STEPS } from '@/lib/demo-store'
import { AppRole } from '@/lib/types'

const ROLES: { role: AppRole; label: string; icon: string; defaultPath: string }[] = [
  { role: 'customer', label: 'Заказчик', icon: '👤', defaultPath: '/customer/requests' },
  { role: 'staff',    label: 'Штаб',     icon: '🎯', defaultPath: '/staff/queue' },
  { role: 'admin',    label: 'Админ',    icon: '⚙',  defaultPath: '/admin' },
]

export function RoleSelector() {
  const { state, setRole, setViewingStep } = useDemoStore()
  const router = useRouter()
  const [tooltip, setTooltip] = useState<string | null>(null)

  const handleRoleClick = (r: typeof ROLES[0]) => {
    setRole(r.role)
    setViewingStep(null) // сбрасываем просмотр прошлого шага

    const activeStep = DEMO_STEPS[state.demoStep]

    // Вариант B: если выбранная роль совпадает с активным шагом — переходим туда
    if (activeStep && activeStep.role === r.role) {
      router.push(activeStep.path)
    } else {
      // Иначе — переходим на dashboard роли
      router.push(r.defaultPath)
    }

    // Показываем пояснение
    if (activeStep && activeStep.role !== r.role) {
      setTooltip(
        `Вы переключились на роль «${r.label}». ` +
        `Активный шаг принадлежит роли «${activeStep.role === 'customer' ? 'Заказчик' : 'Штаб'}». ` +
        `Доступны просмотр статуса и история.`
      )
    } else if (activeStep && activeStep.role === r.role) {
      setTooltip(
        `Вы переключились на роль «${r.label}». Процесс ожидает: «${activeStep.label}».`
      )
    }
    setTimeout(() => setTooltip(null), 4000)
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 11, color: '#94A3B8', marginRight: 4 }}>Роль:</span>
        {ROLES.map(r => (
          <button
            key={r.role}
            onClick={() => handleRoleClick(r)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
              border: `1px solid ${state.currentRole === r.role ? '#2563EB' : '#E2E8F0'}`,
              background: state.currentRole === r.role ? '#EFF6FF' : '#FFFFFF',
              color: state.currentRole === r.role ? '#1D4ED8' : '#64748B',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {r.icon} {r.label}
          </button>
        ))}
      </div>
      {tooltip && (
        <div style={{
          position: 'absolute',
          top: 36,
          right: 0,
          zIndex: 999,
          background: '#1E293B',
          color: '#FFFFFF',
          fontSize: 12,
          padding: '8px 12px',
          borderRadius: 8,
          maxWidth: 300,
          lineHeight: '1.5',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          whiteSpace: 'normal',
        }}>
          {tooltip}
        </div>
      )}
    </div>
  )
}
