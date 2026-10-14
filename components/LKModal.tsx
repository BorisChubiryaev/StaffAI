'use client'

import { useState, useEffect } from 'react'
import { StaffingRequest } from '@/lib/types'
import { useDemoStore } from '@/lib/demo-store'

interface Props {
  request: StaffingRequest
  onClose: () => void
}

type Phase = 'form' | 'progress' | 'success'

const APPROVAL_ROUTES = [
  'Стандартный (2 уровня согласования)',
  'Ускоренный (1 уровень согласования)',
  'Расширенный (3 уровня согласования)',
  'Только финансовый контроль',
]

const PROGRESS_STEPS = [
  { label: 'Создаём ЗНР в системе…', duration: 900 },
  { label: 'Передаём параметры заявки…', duration: 800 },
  { label: 'Прикрепляем draft спецификации…', duration: 1000 },
  { label: 'Формируем маршрут согласования…', duration: 900 },
]

export function LKModal({ request, onClose }: Props) {
  const { createZnrInLK } = useDemoStore()

  const [phase, setPhase] = useState<Phase>('form')
  const [approvalRoute, setApprovalRoute] = useState(APPROVAL_ROUTES[0])
  const [approver, setApprover] = useState('Иванов Игорь Петрович')
  const [progressStep, setProgressStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const znrNumber = 'ЗНР-2026-00931'
  const znrUrl = 'https://lk.example/znr/ZNR-2026-00931'

  const epic = request.artifacts.find(a => a.type === 'tracker_epic')
  const spec = request.artifacts.find(a => a.type === 'specification_draft')
  const lkConfig = request.artifacts.find(a => a.type === 'lk_config')
  const contractor = request.contractorOptions.find(c => c.id === request.selectedContractorId)

  const checklist = [
    { label: 'Структурированный запрос готов', sub: request.requestNumber, done: true },
    { label: 'Epic в СберТрек создан', sub: epic?.epicKey ?? 'SBT-28491', done: !!epic },
    { label: 'Подрядчик выбран', sub: contractor ? `${contractor.contractorName} · ${contractor.contractNumber}` : 'Не выбран', done: !!contractor },
    { label: 'Draft спецификации сформирован', sub: spec ? 'SPEC-2026-0017' : 'Не создан', done: !!spec },
    { label: 'Config для ЛК подготовлен', sub: lkConfig ? 'REQ-2026-00521_LK_CONFIG.json' : 'Необязательно', done: true },
    { label: 'Обязательные поля заполнены', sub: 'Предмет, состав команды, этапы, стоимость', done: !!request.specificationDraft },
  ]
  const readyCount = checklist.filter(c => c.done).length
  const allReady = checklist.every(c => c.done)

  // Run progress animation when phase === 'progress'
  useEffect(() => {
    if (phase !== 'progress') return
    let step = 0
    const runStep = () => {
      if (step >= PROGRESS_STEPS.length) {
        // All done → dispatch action + show success
        createZnrInLK(approvalRoute, approver)
        setPhase('success')
        return
      }
      setProgressStep(step)
      setTimeout(() => {
        setCompletedSteps(prev => [...prev, step])
        step++
        setTimeout(runStep, 200)
      }, PROGRESS_STEPS[step].duration)
    }
    runStep()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const handleCreate = () => {
    setProgressStep(0)
    setCompletedSteps([])
    setPhase('progress')
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={phase === 'success' ? onClose : undefined}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 2000,
          cursor: phase === 'success' ? 'pointer' : 'default',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 560,
        maxHeight: '92vh',
        overflowY: 'auto',
        background: '#FFFFFF',
        borderRadius: 18,
        boxShadow: '0 24px 72px rgba(0,0,0,0.22)',
        zIndex: 2001,
        padding: '28px 28px 24px',
      }}>

        {/* ── FORM PHASE ── */}
        {phase === 'form' && (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
                  Создание ЗНР в Личном кабинете
                </div>
                <div style={{ fontSize: 13, color: '#64748B' }}>
                  Проверьте комплектность пакета перед созданием заявки на работы
                </div>
              </div>
              <button
                onClick={onClose}
                style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#F1F5F9', color: '#64748B', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}
              >
                ✕
              </button>
            </div>

            {/* Readiness bar */}
            <div style={{ marginBottom: 20, padding: '12px 16px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Готовность пакета</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: allReady ? '#16A34A' : '#D97706' }}>
                  {readyCount}/{checklist.length}
                </span>
              </div>
              <div style={{ height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  background: allReady ? '#10B981' : 'linear-gradient(90deg, #2563EB, #7C3AED)',
                  width: `${(readyCount / checklist.length) * 100}%`,
                  transition: 'width 0.4s',
                }} />
              </div>
            </div>

            {/* Checklist */}
            <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {checklist.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, padding: '9px 13px',
                  borderRadius: 9, border: `1px solid ${item.done ? '#BBF7D0' : '#FDE68A'}`,
                  background: item.done ? '#F0FDF4' : '#FFFBEB',
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                    background: item.done ? '#16A34A' : '#D97706',
                    color: '#FFFFFF', marginTop: 1,
                  }}>
                    {item.done ? '✓' : '!'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: item.done ? '#14532D' : '#92400E' }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: item.done ? '#16A34A' : '#D97706' }}>{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* What will be sent */}
            <div style={{ marginBottom: 20, padding: '13px 16px', background: '#F5F3FF', borderRadius: 10, border: '1px solid #DDD6FE' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#5B21B6', marginBottom: 9 }}>Что будет передано в ЛК:</div>
              {[
                `📋 Epic SBT-28491 + 4 Story (СберТрек)`,
                `📄 Draft спецификации SPEC-2026-0017`,
                `👥 Состав команды: 9 специалистов`,
                `💰 Стоимость: ${request.specificationDraft?.totalCost?.toLocaleString('ru') ?? '9 152 000'} ₽`,
                `📅 Срок: ${request.structuredRequest.duration} с ${request.structuredRequest.startPreference}`,
              ].map((line, i) => (
                <div key={i} style={{ fontSize: 12, color: '#4C1D95', padding: '2px 0', display: 'flex', gap: 8 }}>
                  <span>·</span><span>{line}</span>
                </div>
              ))}
            </div>

            {/* Form: approval route + approver */}
            <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                  Маршрут согласования
                </label>
                <select
                  value={approvalRoute}
                  onChange={e => setApprovalRoute(e.target.value)}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 8,
                    border: '1px solid #CBD5E1', fontSize: 13, color: '#0F172A',
                    background: '#FFFFFF', outline: 'none', cursor: 'pointer',
                    appearance: 'auto',
                  }}
                >
                  {APPROVAL_ROUTES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                  Утверждающее лицо
                </label>
                <input
                  type="text"
                  value={approver}
                  onChange={e => setApprover(e.target.value)}
                  placeholder="ФИО утверждающего лица"
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 8,
                    border: '1px solid #CBD5E1', fontSize: 13, color: '#0F172A',
                    background: '#FFFFFF', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleCreate}
                disabled={!approver.trim()}
                style={{
                  flex: 1, padding: '13px 0', borderRadius: 10,
                  background: approver.trim()
                    ? 'linear-gradient(135deg, #16A34A, #15803D)'
                    : '#CBD5E1',
                  color: '#FFFFFF', fontSize: 14, fontWeight: 800,
                  border: 'none',
                  cursor: approver.trim() ? 'pointer' : 'default',
                  boxShadow: approver.trim() ? '0 2px 10px rgba(22,163,74,0.35)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                🏛️ Создать ЗНР в Личном кабинете →
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: '13px 18px', borderRadius: 10,
                  border: '1px solid #E2E8F0', background: '#F8FAFC',
                  color: '#475569', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Отмена
              </button>
            </div>
          </>
        )}

        {/* ── PROGRESS PHASE ── */}
        {phase === 'progress' && (
          <div style={{ padding: '8px 0' }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🏛️</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
                Создание ЗНР в Личном кабинете…
              </div>
              <div style={{ fontSize: 13, color: '#64748B' }}>Пожалуйста, не закрывайте окно</div>
            </div>

            {/* Animated steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {PROGRESS_STEPS.map((step, i) => {
                const isDone = completedSteps.includes(i)
                const isActive = progressStep === i && !isDone
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', borderRadius: 10,
                    border: `1px solid ${isDone ? '#BBF7D0' : isActive ? '#BFDBFE' : '#E2E8F0'}`,
                    background: isDone ? '#F0FDF4' : isActive ? '#EFF6FF' : '#F8FAFC',
                    transition: 'all 0.3s',
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700,
                      background: isDone ? '#16A34A' : isActive ? '#2563EB' : '#E2E8F0',
                      color: isDone || isActive ? '#FFFFFF' : '#94A3B8',
                      transition: 'all 0.3s',
                    }}>
                      {isDone ? '✓' : isActive ? (
                        <span style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>⟳</span>
                      ) : (i + 1)}
                    </div>
                    <div style={{
                      fontSize: 13, fontWeight: isDone || isActive ? 700 : 500,
                      color: isDone ? '#14532D' : isActive ? '#1E3A8A' : '#94A3B8',
                      transition: 'all 0.3s',
                    }}>
                      {step.label}
                    </div>
                    {isDone && (
                      <div style={{ marginLeft: 'auto', fontSize: 11, color: '#16A34A', fontWeight: 600 }}>готово</div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Progress bar */}
            <div style={{ height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: 'linear-gradient(90deg, #16A34A, #15803D)',
                width: `${((completedSteps.length) / PROGRESS_STEPS.length) * 100}%`,
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        )}

        {/* ── SUCCESS PHASE ── */}
        {phase === 'success' && (
          <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#14532D', marginBottom: 8 }}>
              ЗНР создана!
            </div>

            {/* ZNR card */}
            <div style={{
              background: '#F0FDF4', border: '1px solid #BBF7D0',
              borderRadius: 14, padding: '18px 20px', marginBottom: 20,
              textAlign: 'left',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>Номер ЗНР</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>{znrNumber}</div>
                </div>
                <div style={{ padding: '6px 14px', borderRadius: 8, background: '#16A34A', color: '#FFFFFF', fontSize: 12, fontWeight: 700 }}>
                  На маршруте
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                  { label: 'Статус', value: 'На маршруте согласования' },
                  { label: 'Маршрут', value: approvalRoute },
                  { label: 'Утверждающее лицо', value: approver },
                  { label: 'Спецификация', value: 'SPEC-2026-0017' },
                  { label: 'Подрядчик', value: contractor?.contractorName ?? 'ТехноСофт' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                    <span style={{ color: '#64748B', minWidth: 120, flexShrink: 0 }}>{row.label}:</span>
                    <span style={{ color: '#0F172A', fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 14, padding: '9px 12px', background: '#DCFCE7', borderRadius: 8, border: '1px solid #86EFAC' }}>
                <div style={{ fontSize: 11, color: '#14532D', marginBottom: 3, fontWeight: 700 }}>Ссылка в Личном кабинете:</div>
                <a
                  href={znrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, color: '#2563EB', wordBreak: 'break-all' }}
                >
                  {znrUrl}
                </a>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a
                href={znrUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block', padding: '13px 0', borderRadius: 10,
                  background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  color: '#FFFFFF', fontSize: 14, fontWeight: 800,
                  textDecoration: 'none', textAlign: 'center',
                  boxShadow: '0 2px 10px rgba(37,99,235,0.35)',
                }}
              >
                🔗 Открыть в Личном кабинете →
              </a>
              <button
                onClick={onClose}
                style={{
                  padding: '13px 0', borderRadius: 10,
                  background: '#F0FDF4', border: '1px solid #BBF7D0',
                  color: '#14532D', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Перейти к статусу заказчика →
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
