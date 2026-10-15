'use client'

import { useRouter } from 'next/navigation'
import { useDemoStore, DEMO_STEPS } from '@/lib/demo-store'
import { AppRole } from '@/lib/types'

interface RoleGateProps {
  expectedRole: AppRole
  children: React.ReactNode
}

/**
 * Если currentRole не совпадает с expectedRole — показывает RoleMismatchScreen.
 * Исключение: если пользователь в режиме просмотра прошлого шага (viewingStep != null).
 */
export function RoleGate({ expectedRole, children }: RoleGateProps) {
  const { state, setRole } = useDemoStore()
  const router = useRouter()

  const isViewing = state.viewingStep !== null
  if (isViewing || state.currentRole === expectedRole) {
    return <>{children}</>
  }

  const activeStep = DEMO_STEPS[state.demoStep]
  const roleLabel = expectedRole === 'customer' ? 'Заказчик' : expectedRole === 'staff' ? 'Штаб' : 'Администратор'
  const currentLabel = state.currentRole === 'customer' ? 'Заказчик' : state.currentRole === 'staff' ? 'Штаб' : 'Администратор'
  const icon = expectedRole === 'customer' ? '👤' : expectedRole === 'staff' ? '🎯' : '⚙'

  const handleSwitch = () => {
    setRole(expectedRole)
    if (activeStep && activeStep.role === expectedRole) {
      router.push(activeStep.path)
    }
    // Если активный шаг не этой роли — просто переключаем роль, остаёмся на странице
  }

  const handleGoHome = () => {
    router.push('/')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F6F8FB',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #E2E8F0',
        padding: 40,
        maxWidth: 480,
        width: '100%',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
          Эта область — для роли «{roleLabel}»
        </h2>
        <p style={{ fontSize: 14, color: '#64748B', lineHeight: '1.6', marginBottom: 8 }}>
          Сейчас вы в роли <strong style={{ color: '#334155' }}>«{currentLabel}»</strong>.
        </p>
        {activeStep && activeStep.role === expectedRole && (
          <div style={{
            margin: '16px 0',
            padding: '12px 16px',
            background: '#EFF6FF',
            borderRadius: 10,
            border: '1px solid #BFDBFE',
            fontSize: 13,
            color: '#1E40AF',
          }}>
            Активный шаг демо требует роли <strong>«{roleLabel}»</strong>:<br />
            <span style={{ fontWeight: 700 }}>«{activeStep.label}»</span>
          </div>
        )}
        {activeStep && activeStep.role !== expectedRole && (
          <div style={{
            margin: '16px 0',
            padding: '12px 16px',
            background: '#F8FAFC',
            borderRadius: 10,
            border: '1px solid #E2E8F0',
            fontSize: 13,
            color: '#64748B',
          }}>
            Активный шаг демо: <strong>«{activeStep.label}»</strong><br />
            Переключитесь на «{roleLabel}» для просмотра этой области.
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24 }}>
          <button
            onClick={handleSwitch}
            style={{
              padding: '10px 22px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {icon} Переключиться на «{roleLabel}»
          </button>
          <button
            onClick={handleGoHome}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              color: '#475569',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            На главную
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Role Transition Overlay ──────────────────────────────────────────────────

interface RoleTransitionOverlayProps {
  /** Роль следующего активного шага */
  nextRole: AppRole
  /** Текст описания того, что произошло */
  actionDescription: string
  /** Текст шага, который нужно сделать следующим */
  nextStepLabel: string
  /** Путь следующего шага */
  nextPath: string
  /** Callback при закрытии overlay */
  onStay: () => void
}

/**
 * Overlay, который появляется после завершения шага, когда владелец процесса меняется.
 * Предлагает переключиться на нужную роль.
 */
export function RoleTransitionOverlay({
  nextRole, actionDescription, nextStepLabel, nextPath, onStay,
}: RoleTransitionOverlayProps) {
  const { setRole } = useDemoStore()
  const router = useRouter()

  const roleLabel = nextRole === 'customer' ? 'Заказчик' : nextRole === 'staff' ? 'Штаб' : 'Администратор'
  const icon = nextRole === 'customer' ? '👤' : nextRole === 'staff' ? '🎯' : '⚙'

  const handleSwitch = () => {
    setRole(nextRole)
    router.push(nextPath)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15,23,42,0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: 24,
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        padding: '32px 36px',
        maxWidth: 460,
        width: '100%',
        boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
        textAlign: 'center',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, #10B981, #059669)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, margin: '0 auto 16px',
        }}>
          ✓
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
          Шаг выполнен
        </h3>
        <p style={{ fontSize: 14, color: '#475569', lineHeight: '1.6', marginBottom: 16 }}>
          {actionDescription}
        </p>
        <div style={{
          padding: '12px 16px',
          background: '#EFF6FF',
          borderRadius: 10,
          border: '1px solid #BFDBFE',
          fontSize: 13,
          color: '#1E40AF',
          marginBottom: 24,
        }}>
          Теперь процесс ожидает действия роли <strong>«{roleLabel}»</strong>.<br />
          <span style={{ fontWeight: 700 }}>Следующий шаг: «{nextStepLabel}»</span>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={handleSwitch}
            style={{
              padding: '11px 24px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
            }}
          >
            {icon} Переключиться на «{roleLabel}» и продолжить
          </button>
          <button
            onClick={onStay}
            style={{
              padding: '11px 16px',
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              color: '#64748B',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Остаться
          </button>
        </div>
      </div>
    </div>
  )
}
