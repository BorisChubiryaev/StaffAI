'use client'

import { useRouter } from 'next/navigation'
import { useDemoStore, DEMO_STEPS } from '@/lib/demo-store'
import { RequestStatus } from '@/lib/types'

interface Step {
  key: RequestStatus | string
  label: string
  shortLabel: string
}

const STEPS: Step[] = [
  { key: 'ai_intake',              label: 'Сбор запроса AI',       shortLabel: 'Сбор AI' },
  { key: 'submitted_to_staff',     label: 'Передача в штаб',       shortLabel: 'Штаб' },
  { key: 'staff_review',           label: 'Проверка штабом',       shortLabel: 'Проверка' },
  { key: 'contractor_selection',   label: 'Выбор подрядчика',      shortLabel: 'Подрядчик' },
  { key: 'tracker_task_created',   label: 'Epic в СберТрек',       shortLabel: 'Epic' },
  { key: 'specification_drafting', label: 'Спецификация',          shortLabel: 'Спец.' },
  { key: 'lk_approval',            label: 'Согласование в ЛК',     shortLabel: 'ЛК' },
]

const STATUS_TO_STEP: Record<string, number> = {
  draft: 0,
  ai_intake: 0,
  awaiting_customer_clarification: 0,
  awaiting_customer_confirmation: 0,
  structured_request_ready: 0,
  submitted_to_staff: 1,
  staff_review: 2,
  awaiting_staff_clarification: 2,
  contractor_selection: 3,
  tracker_task_creation: 4,
  tracker_task_created: 4,
  specification_drafting: 5,
  customer_approval: 5,
  lk_config_ready: 6,
  lk_approval: 6,
  lk_approval_sent: 6,
  contracting: 6,
  specialists_sourcing: 6,
  completed: 6,
  change_requested: 5,
  cancelled: -1,
}

interface WorkflowStepperProps {
  status: string
  variant?: 'full' | 'compact'
}

export function WorkflowStepper({ status, variant = 'full' }: WorkflowStepperProps) {
  const currentStep = STATUS_TO_STEP[status] ?? 0

  if (variant === 'compact') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflowX: 'auto' }}>
        {STEPS.map((step, i) => {
          const done = i < currentStep
          const active = i === currentStep
          return (
            <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <div style={{
                height: 6, borderRadius: 3, transition: 'all 0.3s',
                width: active ? 24 : 16,
                background: done ? '#2563EB' : active ? '#2563EB' : '#E2E8F0',
                opacity: done || active ? 1 : 0.5,
              }} />
              {i < STEPS.length - 1 && (
                <div style={{ width: 6, height: 1, background: '#E2E8F0' }} />
              )}
            </div>
          )
        })}
        <span style={{ fontSize: 11, color: '#64748B', marginLeft: 8, whiteSpace: 'nowrap' }}>
          {STEPS[Math.min(currentStep, STEPS.length - 1)]?.label}
        </span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      {STEPS.map((step, i) => {
        const done = i < currentStep
        const active = i === currentStep
        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? '1' : undefined }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', border: '2px solid',
                borderColor: done ? '#2563EB' : active ? '#2563EB' : '#E2E8F0',
                background: done ? '#2563EB' : active ? '#EFF6FF' : '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, transition: 'all 0.3s',
                color: done ? '#FFFFFF' : active ? '#2563EB' : '#94A3B8',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: 10, fontWeight: active ? 700 : 500,
                color: done ? '#2563EB' : active ? '#0F172A' : '#94A3B8',
                whiteSpace: 'nowrap',
              }}>
                {step.shortLabel}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: 2, margin: '0 4px', marginBottom: 16,
                background: done ? '#2563EB' : '#E2E8F0', transition: 'background 0.3s',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Demo Checklist (кликабельные шаги для главной страницы) ──────────────────

interface DemoChecklistProps {
  /** Индекс текущего активного шага */
  demoStep: number
  /** Завершено ли демо */
  isDemoCompleted: boolean
}

/**
 * Кликабельный чеклист демо-шагов.
 * Выполненные шаги кликабельны — ведут к read-only просмотру.
 * Не меняет demoStep, только viewingStep.
 */
export function DemoChecklist({ demoStep, isDemoCompleted }: DemoChecklistProps) {
  const { setRole, setViewingStep, state } = useDemoStore()
  const router = useRouter()

  const totalSteps = DEMO_STEPS.length

  const handleClickCompleted = (stepIdx: number) => {
    const step = DEMO_STEPS[stepIdx]
    if (!step) return
    setRole(step.role as 'customer' | 'staff' | 'admin')
    setViewingStep(stepIdx)
    router.push(step.path)
  }

  const handleReturnToCurrent = () => {
    setViewingStep(null)
    const activeStep = DEMO_STEPS[demoStep]
    if (activeStep) {
      setRole(activeStep.role as 'customer' | 'staff' | 'admin')
      router.push(activeStep.path)
    }
  }

  return (
    <div>
      {/* Прогресс-бар */}
      <div style={{ height: 4, background: '#E2E8F0', borderRadius: 2, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{
          height: '100%', borderRadius: 2,
          background: isDemoCompleted ? '#16A34A' : 'linear-gradient(90deg, #2563EB, #7C3AED)',
          width: `${Math.min((demoStep / totalSteps) * 100, 100)}%`,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {state.viewingStep !== null && (
        <div style={{
          marginBottom: 10,
          padding: '8px 12px',
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: 8,
          fontSize: 12,
          color: '#92400E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}>
          <span>👁 Просмотр шага {state.viewingStep + 1}</span>
          <button
            onClick={handleReturnToCurrent}
            style={{
              padding: '3px 10px', borderRadius: 5,
              background: '#D97706', color: '#FFFFFF',
              fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer',
            }}
          >
            → Текущий шаг
          </button>
        </div>
      )}

      <div className="space-y-2">
        {DEMO_STEPS.map((step, i) => {
          const done = i < demoStep || isDemoCompleted
          const active = i === demoStep && !isDemoCompleted
          const isViewing = state.viewingStep === i

          return (
            <div
              key={i}
              onClick={done ? () => handleClickCompleted(i) : undefined}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '7px 10px', borderRadius: 8,
                background: isViewing ? '#FFFBEB' : active ? '#EFF6FF' : 'transparent',
                border: `1px solid ${isViewing ? '#FDE68A' : active ? '#BFDBFE' : 'transparent'}`,
                cursor: done ? 'pointer' : 'default',
                transition: 'background 0.15s',
              }}
              onMouseEnter={done ? (e) => {
                if (!isViewing) (e.currentTarget as HTMLElement).style.background = '#F8FAFC'
              } : undefined}
              onMouseLeave={done ? (e) => {
                (e.currentTarget as HTMLElement).style.background =
                  isViewing ? '#FFFBEB' : active ? '#EFF6FF' : 'transparent'
              } : undefined}
            >
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                background: done ? '#2563EB' : active ? '#FFFFFF' : '#F1F5F9',
                border: `1.5px solid ${done ? '#2563EB' : active ? '#2563EB' : '#E2E8F0'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700,
                color: done ? '#FFFFFF' : active ? '#2563EB' : '#94A3B8',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  color: done ? '#64748B' : active ? '#1E40AF' : '#475569',
                  textDecoration: done ? 'line-through' : 'none',
                }}>
                  {step.label}
                </div>
                <div style={{ fontSize: 10, color: '#94A3B8' }}>
                  {step.role === 'customer' ? '👤 Заказчик' : step.role === 'staff' ? '🎯 Штаб' : '⚙ Админ'}
                  {done && <span style={{ marginLeft: 6, color: '#BFDBFE' }}>· нажмите для просмотра</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
