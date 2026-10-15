'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useDemoStore, STATUS_META, DEMO_STEPS } from '@/lib/demo-store'
import { RoleSelector } from '@/components/RoleSelector'
import { ArtifactDrawer } from '@/components/ArtifactDrawer'
import { ChatDrawer } from '@/components/ChatDrawer'
import { LKModal } from '@/components/LKModal'
import { SpecificationEditor } from '@/components/SpecificationEditor'
import { RoleGate, RoleTransitionOverlay } from '@/components/RoleGate'
import { WorkflowStepCard } from '@/components/WorkflowStepCard'
import { DemoArtifact } from '@/lib/types'

export default function StaffReviewPage() {
  const {
    state,
    staffSendClarification,
    selectContractor,
    generateSpecDraft,
    generateLKConfig,
  } = useDemoStore()
  const req = state.request

  const [inputVal, setInputVal] = useState('')
  const [activeTab, setActiveTab] = useState<'workflow' | 'analysis' | 'details' | 'artifacts'>('workflow')
  const [selectedArtifact, setSelectedArtifact] = useState<DemoArtifact | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [showLKModal, setShowLKModal] = useState(false)
  const [showSpecEditor, setShowSpecEditor] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [showTransitionOverlay, setShowTransitionOverlay] = useState(false)
  const [transitionDescription, setTransitionDescription] = useState('')

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  if (!req) {
    return (
      <div style={{ minHeight: '100vh', background: '#F6F8FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40, maxWidth: 440 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Нет активной заявки</h2>
          <p style={{ fontSize: 14, color: '#64748B', lineHeight: '1.6', marginBottom: 24 }}>
            Начните демо-сценарий — создайте заявку как заказчик, затем вернитесь сюда.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link href="/staff/queue" style={{ padding: '10px 20px', background: '#2563EB', color: '#FFFFFF', borderRadius: 8, fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>← Очередь</Link>
            <Link href="/" style={{ padding: '10px 20px', background: '#F1F5F9', color: '#475569', borderRadius: 8, fontWeight: 500, textDecoration: 'none', fontSize: 14 }}>Хаб</Link>
          </div>
        </div>
      </div>
    )
  }

  const sm = STATUS_META[req.status] ?? STATUS_META['staff_review']
  const totalTeam = req.structuredRequest.team.reduce((s, m) => s + m.count, 0)
  const contractor = req.contractorOptions.find(c => c.id === req.selectedContractorId)
  const epicArtifact = req.artifacts.find(a => a.type === 'tracker_epic')
  const specArtifact = req.artifacts.find(a => a.type === 'specification_draft')
  const lkConfigArtifact = req.artifacts.find(a => a.type === 'lk_config')
  const lkSubmissionArtifact = req.artifacts.find(a => a.type === 'lk_submission')

  const PRIORITY_META: Record<string, { label: string; color: string; bg: string }> = {
    critical: { label: 'Критично', color: '#DC2626', bg: '#FEF2F2' },
    high: { label: 'Высокий', color: '#D97706', bg: '#FFFBEB' },
    normal: { label: 'Обычный', color: '#64748B', bg: '#F1F5F9' },
  }

  const isStaff = state.currentRole === 'staff'
  const isViewing = state.viewingStep !== null

  const sendStaffMsg = () => {
    if (!inputVal.trim() || !isStaff) return
    staffSendClarification(inputVal)
    setInputVal('')
    // Overlay: переходим к customer
    const nextStep = DEMO_STEPS[state.demoStep]
    if (nextStep && nextStep.role !== 'staff') {
      setTransitionDescription('Запрос уточнения отправлен заказчику. Теперь процесс ожидает ответа заказчика.')
      setShowTransitionOverlay(true)
    }
  }

  const handleGenerateSpec = () => {
    if (!isStaff) return
    generateSpecDraft()
    showToast('Draft спецификации SPEC-2026-0017 сформирован!')
  }

  const handleGenerateLKConfig = () => {
    if (!isStaff) return
    generateLKConfig()
    showToast('Config для ЛК готов. Скачайте его из раздела Артефакты.')
  }

  const handleLKSent = () => {
    setShowLKModal(false)
    const nextStep = DEMO_STEPS[state.demoStep]
    if (nextStep && nextStep.role !== 'staff') {
      setTransitionDescription('Спецификация отправлена на согласование в ЛК. Создана ЗНР-2026-00931.')
      setShowTransitionOverlay(true)
    }
  }

  // ─── Step logic ───────────────────────────────────────────────────────────
  const canTakeOwnership = req.status === 'submitted_to_staff'
  const canSendClarification = isStaff && !isViewing && req.status === 'staff_review'
  const awaitingCustomer = req.status === 'awaiting_staff_clarification'
  const trackerCreated = !!epicArtifact
  const canSelectContractor = isStaff && !isViewing && (req.status === 'contractor_selection' || req.status === 'tracker_task_created') && !req.selectedContractorId
  const contractorSelected = !!req.selectedContractorId
  const canGenerateSpec = isStaff && !isViewing && req.status === 'specification_drafting' && !specArtifact
  const specGenerated = !!specArtifact
  const lkSent = !!lkSubmissionArtifact

  const nextDemoStep = DEMO_STEPS[state.demoStep]

  return (
    <RoleGate expectedRole="staff">
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>
      {/* Role transition overlay */}
      {showTransitionOverlay && nextDemoStep && nextDemoStep.role !== 'staff' && (
        <RoleTransitionOverlay
          nextRole={nextDemoStep.role as 'customer' | 'staff' | 'admin'}
          actionDescription={transitionDescription}
          nextStepLabel={nextDemoStep.label}
          nextPath={nextDemoStep.path}
          onStay={() => setShowTransitionOverlay(false)}
        />
      )}

      {/* Viewing past step banner */}
      {isViewing && (
        <div style={{
          background: '#FFFBEB', borderBottom: '1px solid #FDE68A',
          padding: '8px 20px', fontSize: 12, color: '#92400E',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>👁 Просмотр шага {(state.viewingStep ?? 0) + 1} — только чтение. Действия недоступны.</span>
        </div>
      )}

      {/* Staff waiting state */}
      {!isViewing && state.currentRole === 'staff' && awaitingCustomer && (
        <div style={{
          background: '#FFFBEB', borderBottom: '1px solid #FDE68A',
          padding: '10px 20px', fontSize: 13, color: '#92400E',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span>⏳</span>
          <div>
            <strong>Ожидаем действие заказчика</strong> — заказчик должен ответить на уточнение.
            {state.pendingStaffClarification && (
              <span style={{ marginLeft: 8, color: '#78350F' }}>«{state.pendingStaffClarification}»</span>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div style={{ position: 'fixed', top: 70, right: 24, zIndex: 9999, padding: '10px 18px', background: '#10B981', color: '#FFFFFF', borderRadius: 10, fontSize: 13, fontWeight: 700, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', maxWidth: 360 }}>
          ✓ {toastMsg}
        </div>
      )}

      {/* Top bar */}
      <header style={{ height: 56, background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 14, flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <Link href="/staff/queue" style={{ width: 32, height: 32, borderRadius: 7, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, textDecoration: 'none', color: '#475569', flexShrink: 0 }}>←</Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Рабочее место штаба · {req.title}
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>{req.requestNumber} · {req.customer.name}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ padding: '4px 12px', borderRadius: 6, background: sm.bg, fontSize: 12, fontWeight: 600, color: sm.color }}>{sm.label}</span>
          <span style={{ padding: '4px 10px', borderRadius: 6, background: '#F5F3FF', border: '1px solid #DDD6FE', fontSize: 12, color: '#7C3AED', fontWeight: 600 }}>
            ✦ AI {req.aiAnalysis.confidence}%
          </span>
          <button
            onClick={() => setShowChat(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 6, background: '#F0FDFA', border: '1px solid #A7F3D0', fontSize: 12, fontWeight: 600, color: '#0E7490', cursor: 'pointer' }}
          >
            💬 Чат
            {req.messages.filter(m => m.sender === 'customer').length > 0 && (
              <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#0E7490', color: '#FFFFFF', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {req.messages.filter(m => m.sender === 'customer').length}
              </span>
            )}
          </button>
          <RoleSelector />
        </div>
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left: main content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, background: '#F1F5F9', borderRadius: 8, padding: 4, flexShrink: 0 }}>
            {([
              ['workflow', '🔄 Процесс'],
              ['analysis', '🤖 AI Анализ'],
              ['details', '📋 Детали'],
              ['artifacts', '📁 Артефакты'],
            ] as [string, string][]).map(([key, label]) => {
              const active = activeTab === key
              return (
                <button key={key} onClick={() => setActiveTab(key as typeof activeTab)} style={{ flex: 1, padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none', textAlign: 'center', background: active ? '#FFFFFF' : 'transparent', color: active ? '#0F172A' : '#64748B', boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
                  {label}
                </button>
              )
            })}
          </div>

          {/* ── WORKFLOW tab ── */}
          {activeTab === 'workflow' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 14, padding: '10px 14px', background: '#F5F3FF', borderRadius: 8, border: '1px solid #DDD6FE' }}>
                ✦ Шаги процесса — нажмите кнопку действия на активном шаге, чтобы продвинуть заявку
              </div>

              {/* Step 1: Take ownership */}
              <WorkflowStepCard
                number={1}
                title="Взять заявку в работу"
                subtitle={canTakeOwnership ? 'Заявка ждёт обработки штаба' : 'Заявка в работе'}
                status={req.status === 'submitted_to_staff' ? 'active' : 'done'}
                action={
                  <Link href="/staff/queue" style={{ display: 'inline-block', padding: '8px 16px', borderRadius: 7, background: '#2563EB', color: '#FFFFFF', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                    ← Перейти в очередь
                  </Link>
                }
              />

              {/* Step 2: Review / clarify */}
              <WorkflowStepCard
                number={2}
                title="Проверка штабом / уточнение"
                subtitle={awaitingCustomer ? 'Ожидаем ответа заказчика…' : canSendClarification ? 'Изучите AI-анализ и запросите уточнение при необходимости' : 'Проверка выполнена'}
                status={req.status === 'submitted_to_staff' ? 'pending' : awaitingCustomer ? 'active' : canSendClarification ? 'active' : 'done'}
                action={
                  canSendClarification ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        style={{ flex: 1, padding: '8px 12px', border: '1px solid #BFDBFE', borderRadius: 7, fontSize: 13, outline: 'none', background: '#FFFFFF' }}
                        value={inputVal}
                        onChange={e => setInputVal(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendStaffMsg()}
                        placeholder="Например: уточните frontend-стек и дату старта"
                      />
                      <button
                        onClick={sendStaffMsg}
                        disabled={!inputVal.trim()}
                        style={{ padding: '8px 16px', borderRadius: 7, background: '#2563EB', color: '#FFFFFF', fontSize: 13, fontWeight: 700, border: 'none', cursor: inputVal.trim() ? 'pointer' : 'default', opacity: inputVal.trim() ? 1 : 0.5 }}
                      >
                        Запросить →
                      </button>
                    </div>
                  ) : awaitingCustomer ? (
                    <div style={{ padding: '8px 12px', background: '#FFFBEB', borderRadius: 7, border: '1px solid #FDE68A', fontSize: 12, color: '#92400E' }}>
                      ⏳ Ожидаем ответа заказчика. Когда он ответит — заявка автоматически перейдёт к выбору подрядчика.
                    </div>
                  ) : null
                }
              />

              {/* Step 3: Epic + 4 Stories */}
              <WorkflowStepCard
                number={3}
                title="Epic и Story в СберТрек"
                subtitle={trackerCreated
                  ? `Epic SBT-28491 + 4 Story созданы · Источник: REQ-2026-00521`
                  : 'Epic и Story будут созданы после подтверждения запроса заказчиком'}
                status={trackerCreated ? 'done' : 'pending'}
                action={
                  trackerCreated ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ padding: '6px 12px', background: '#ECFEFF', borderRadius: 7, border: '1px solid #A5F3FC', fontSize: 12, color: '#0E7490', fontWeight: 600 }}>
                          📋 СберТрек · Epic SBT-28491 ✓
                        </div>
                        <button
                          onClick={() => { setSelectedArtifact(epicArtifact!); setActiveTab('artifacts') }}
                          style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 12, color: '#475569', cursor: 'pointer' }}
                        >
                          Открыть Epic →
                        </button>
                        <button
                          style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 12, color: '#475569', cursor: 'pointer' }}
                          onClick={() => showToast('Связь SBT-28491 ↔ REQ-2026-00521 проверена ✓')}
                        >
                          Проверить связь
                        </button>
                      </div>
                      {/* 4 Stories */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {[
                          { key: 'SBT-28491-1', title: 'Этап 1: аналитика и backend-контуры', period: '01.06–30.06.2026', prio: 'Критично' },
                          { key: 'SBT-28491-2', title: 'Этап 2: разработка backend и frontend', period: '01.07–31.08.2026', prio: 'Критично' },
                          { key: 'SBT-28491-3', title: 'Этап 3: DevOps, интеграции, стабилизация', period: '01.09–31.10.2026', prio: 'Важно' },
                          { key: 'SBT-28491-4', title: 'Этап 4: автотесты и приёмочная', period: '01.11.2026–31.01.2027', prio: 'Важно' },
                        ].map((s, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 11px', borderRadius: 7, background: '#F0FDFA', border: '1px solid #A5F3FC' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#0E7490', minWidth: 100, flexShrink: 0 }}>{s.key}</span>
                            <span style={{ fontSize: 12, color: '#134E4A', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
                            <span style={{ fontSize: 10, color: '#64748B', flexShrink: 0 }}>{s.period}</span>
                            <span style={{ padding: '2px 6px', borderRadius: 4, background: s.prio === 'Критично' ? '#FEF2F2' : '#FFFBEB', color: s.prio === 'Критично' ? '#DC2626' : '#D97706', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{s.prio}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null
                }
              />

              {/* Step 4: Select contractor */}
              <WorkflowStepCard
                number={4}
                title="Выбор подрядчика"
                subtitle={contractorSelected ? `Выбран: ${contractor?.contractorName} · Договор ${contractor?.contractNumber}` : 'Выберите подрядчика из вариантов во вкладке AI Анализ'}
                status={['submitted_to_staff', 'staff_review', 'awaiting_staff_clarification'].includes(req.status) ? 'pending' : contractorSelected ? 'done' : 'active'}
                action={
                  canSelectContractor ? (
                    <button
                      onClick={() => setActiveTab('analysis')}
                      style={{ padding: '9px 20px', borderRadius: 8, background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', color: '#FFFFFF', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}
                    >
                      Выбрать подрядчика →
                    </button>
                  ) : null
                }
              />

              {/* Step 5: Generate spec */}
              <WorkflowStepCard
                number={5}
                title="Сформировать черновик спецификации"
                subtitle={specGenerated ? `SPEC-2026-0017 сформирован из запроса, Epic SBT-28491 и договора ${contractor?.contractNumber ?? ''}` : 'AI сформирует спецификацию из всех собранных данных без повторного ввода'}
                status={!contractorSelected ? 'pending' : specGenerated ? 'done' : 'active'}
                action={
                  canGenerateSpec ? (
                    <button
                      onClick={handleGenerateSpec}
                      style={{ padding: '9px 20px', borderRadius: 8, background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', color: '#FFFFFF', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }}
                    >
                      ✦ Сформировать черновик спецификации →
                    </button>
                  ) : specGenerated ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ padding: '6px 12px', background: '#F5F3FF', borderRadius: 7, border: '1px solid #DDD6FE', fontSize: 12, color: '#7C3AED', fontWeight: 600 }}>
                        SPEC-2026-0017 ✓
                      </div>
                      <button
                        onClick={() => setShowSpecEditor(true)}
                        style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #DDD6FE', background: '#F5F3FF', fontSize: 12, color: '#5B21B6', fontWeight: 700, cursor: 'pointer' }}
                      >
                        📄 Открыть спецификацию →
                      </button>
                    </div>
                  ) : null
                }
              />

              {/* Step 6: LK */}
              <WorkflowStepCard
                number={6}
                title="Передача в ЛК"
                subtitle={lkSent ? `${lkSubmissionArtifact?.znrNumber ?? 'ЗНР-2026-00931'} отправлена на согласование` : 'Сформируйте config и отправьте на согласование в ЛК'}
                status={!specGenerated ? 'pending' : lkSent ? 'done' : 'active'}
                action={
                  !lkSent && specGenerated ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Выберите способ передачи:</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => setShowLKModal(true)}
                          style={{ flex: 1, padding: '9px 12px', borderRadius: 8, background: 'linear-gradient(135deg, #16A34A, #15803D)', color: '#FFFFFF', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(22,163,74,0.3)' }}
                        >
                          🏛️ Создать ЗНР в Личном кабинете
                        </button>
                        {!lkConfigArtifact ? (
                          <button
                            onClick={handleGenerateLKConfig}
                            style={{ flex: 1, padding: '9px 12px', borderRadius: 8, background: '#F0FDFA', color: '#0E7490', fontSize: 13, fontWeight: 700, border: '1px solid #A7F3D0', cursor: 'pointer' }}
                          >
                            ⚙️ Сформировать config
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedArtifact(lkConfigArtifact)}
                            style={{ flex: 1, padding: '9px 12px', borderRadius: 8, background: '#F0FDFA', color: '#0E7490', fontSize: 13, fontWeight: 700, border: '1px solid #A7F3D0', cursor: 'pointer' }}
                          >
                            ⚙️ Скачать config →
                          </button>
                        )}
                      </div>
                    </div>
                  ) : lkSent ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ padding: '6px 12px', background: '#F0FDF4', borderRadius: 7, border: '1px solid #BBF7D0', fontSize: 12, color: '#14532D', fontWeight: 700 }}>
                        🎉 {lkSubmissionArtifact?.znrNumber ?? 'ЗНР-2026-00931'} · На согласовании
                      </div>
                      <button
                        onClick={() => setSelectedArtifact(lkSubmissionArtifact!)}
                        style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 12, color: '#475569', cursor: 'pointer' }}
                      >
                        Открыть →
                      </button>
                    </div>
                  ) : null
                }
              />
            </div>
          )}

          {/* ── AI Analysis tab ── */}
          {activeTab === 'analysis' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'linear-gradient(135deg, #EFF6FF, #F5F3FF)', borderRadius: 10, padding: 16, border: '1px solid #BFDBFE' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: '#2563EB' }}>{req.aiAnalysis.confidence}%</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Уверенность AI</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>{req.aiAnalysis.confidence >= 90 ? 'Высокая · Запрос структурирован' : 'Средняя · Требует проверки'}</div>
                  </div>
                  <div style={{ flex: 1, height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden', marginLeft: 'auto' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #2563EB, #7C3AED)', width: `${req.aiAnalysis.confidence}%`, transition: 'width 0.4s' }} />
                  </div>
                </div>
                <p style={{ fontSize: 13, color: '#1E293B', lineHeight: '1.7', margin: 0 }}>{req.aiAnalysis.summary}</p>
              </div>

              {req.aiAnalysis.gaps.length > 0 && (
                <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>Выявленные пробелы</div>
                  {req.aiAnalysis.gaps.map((g, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 12px', borderRadius: 8, marginBottom: 6, background: '#F0F9FF', border: '1px solid #BAE6FD' }}>
                      <span style={{ fontSize: 14 }}>ℹ️</span>
                      <span style={{ fontSize: 12, color: '#334155' }}>{g}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>Совпадения в реестре</div>
                {req.aiAnalysis.referenceMatches.map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < req.aiAnalysis.referenceMatches.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                    <div>
                      <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: '#F1F5F9', color: '#64748B', marginRight: 6 }}>{m.type}</span>
                      <span style={{ fontSize: 13, color: '#0F172A' }}>{m.value}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: m.confidence > 0.9 ? '#16A34A' : '#D97706' }}>{Math.round(m.confidence * 100)}%</span>
                  </div>
                ))}
              </div>

              {/* Contractor selection */}
              <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 12 }}>Выбор подрядчика</div>
                {req.contractorOptions.map(c => {
                  const isSelected = req.selectedContractorId === c.id
                  const canSelect = !req.selectedContractorId && (req.status === 'contractor_selection' || req.status === 'tracker_task_created' || req.status === 'specification_drafting')
                  const riskColor = c.riskLevel === 'low' ? '#16A34A' : c.riskLevel === 'medium' ? '#D97706' : '#DC2626'
                  return (
                    <div
                      key={c.id}
                      onClick={() => canSelect && selectContractor(c.id)}
                      style={{
                        borderRadius: 10, padding: 14, border: `2px solid ${isSelected ? '#2563EB' : '#E2E8F0'}`,
                        background: isSelected ? '#EFF6FF' : '#FAFAFA',
                        cursor: canSelect ? 'pointer' : 'default',
                        marginBottom: 10, transition: 'all 0.2s',
                        opacity: req.selectedContractorId && !isSelected ? 0.55 : 1,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{c.contractorName}</div>
                          <div style={{ fontSize: 12, color: '#64748B' }}>Договор {c.contractNumber} · Вывод: {c.leadTime}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {c.recommended && <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, color: '#7C3AED', background: '#F5F3FF' }}>✦ AI рек.</span>}
                          <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, color: riskColor, background: c.riskLevel === 'low' ? '#F0FDF4' : c.riskLevel === 'medium' ? '#FFFBEB' : '#FEF2F2' }}>
                            {c.riskLevel === 'low' ? 'Низкий риск' : c.riskLevel === 'medium' ? 'Средний' : 'Высокий риск'}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>{c.estimatedCost}</div>
                      <div style={{ height: 4, background: '#E2E8F0', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
                        <div style={{ height: '100%', borderRadius: 2, background: c.coveragePercent >= 90 ? '#10B981' : '#D97706', width: `${c.coveragePercent}%` }} />
                      </div>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <div>{c.pros.slice(0, 2).map((p, i) => <div key={i} style={{ fontSize: 11, color: '#16A34A' }}>✓ {p}</div>)}</div>
                        <div>{c.cons.slice(0, 1).map((con, i) => <div key={i} style={{ fontSize: 11, color: '#DC2626' }}>✗ {con}</div>)}</div>
                      </div>
                      {isSelected && <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: '#2563EB' }}>✓ Выбран</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Details tab ── */}
          {activeTab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 12 }}>Состав команды — {totalTeam} чел.</div>
                {req.structuredRequest.team.map((m, i) => {
                  const pm = PRIORITY_META[m.priority] ?? PRIORITY_META.normal
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < req.structuredRequest.team.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{m.role}</span>
                        <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: '#EFF6FF', color: '#2563EB', marginLeft: 6 }}>{m.level}</span>
                        <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: pm.bg, color: pm.color, marginLeft: 4 }}>{pm.label}</span>
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#2563EB' }}>× {m.count}</span>
                    </div>
                  )
                })}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, marginTop: 4, borderTop: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Итого</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{totalTeam} чел.</span>
                </div>
              </div>
              <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>Технические требования</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {req.structuredRequest.requirements.map((r, i) => (
                    <span key={i} style={{ padding: '4px 10px', borderRadius: 6, background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: 12, color: '#475569' }}>{r}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Срок', value: req.structuredRequest.duration },
                  { label: 'Старт', value: req.structuredRequest.startPreference },
                ].map((item, i) => (
                  <div key={i} style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', padding: 14 }}>
                    <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Artifacts tab ── */}
          {activeTab === 'artifacts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: '10px 14px', background: '#F5F3FF', borderRadius: 8, border: '1px solid #DDD6FE', fontSize: 12, color: '#5B21B6' }}>
                ✦ Все артефакты сформированы из структурированного запроса без повторного ввода данных
              </div>
              {req.artifacts.length === 0 && (
                <div style={{ padding: 32, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                  Артефакты появятся по мере прохождения шагов процесса
                </div>
              )}
              {req.artifacts.map((a, i) => {
                const iconMap: Record<string, string> = {
                  tracker_epic: '📋', jira_epic: '📋', specification_draft: '📄',
                  config_json: '⚙️', requirements_summary: '📊', lk_config: '⚙️', lk_submission: '🏛️'
                }
                const statusLabel: Record<string, string> = {
                  draft: 'Черновик', ready: 'Готов', approved: 'Согласован', sent: 'Отправлено'
                }
                const statusColor = a.status === 'approved' || a.status === 'sent' ? '#14532D' : a.status === 'ready' ? '#0E7490' : '#64748B'
                const statusBg = a.status === 'approved' || a.status === 'sent' ? '#F0FDF4' : a.status === 'ready' ? '#ECFEFF' : '#F8FAFC'

                const getActions = () => {
                  if (a.type === 'tracker_epic') return [
                    { label: 'Открыть карточку', primary: true },
                    { label: 'Открыть в СберТрек', primary: false },
                  ]
                  if (a.type === 'specification_draft') return [
                    { label: '📄 Открыть спецификацию', primary: true, specEditor: true },
                    { label: 'Скачать DOCX', primary: false },
                  ]
                  if (a.type === 'requirements_summary') return [
                    { label: 'Открыть сводку', primary: true },
                  ]
                  if (a.type === 'lk_config') return [
                    { label: 'Просмотреть JSON', primary: true },
                    { label: 'Скачать config', primary: false },
                  ]
                  if (a.type === 'lk_submission') return [
                    { label: 'Открыть карточку ЛК', primary: true },
                  ]
                  return [{ label: 'Открыть', primary: true }]
                }

                return (
                  <div key={i} style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ fontSize: 28, flexShrink: 0 }}>{iconMap[a.type] ?? '📄'}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{a.title}</div>
                          <span style={{ padding: '3px 8px', borderRadius: 4, background: statusBg, color: statusColor, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                            {statusLabel[a.status] ?? a.status}
                          </span>
                        </div>
                        {a.source && <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8 }}>Источник: {a.source}</div>}
                        {a.createdAt && <div style={{ fontSize: 11, color: '#CBD5E1' }}>Создан: {a.createdAt}</div>}
                        <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                          {getActions().map((act, j) => (
                            <button
                              key={j}
                              onClick={() => (act as { specEditor?: boolean }).specEditor ? setShowSpecEditor(true) : setSelectedArtifact(a)}
                              style={{
                                padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                                background: act.primary ? '#2563EB' : '#F8FAFC',
                                color: act.primary ? '#FFFFFF' : '#475569',
                                border: act.primary ? 'none' : '1px solid #E2E8F0',
                                cursor: 'pointer',
                              }}
                            >
                              {act.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right panel: compact status + mini events */}
        <div style={{ width: 260, borderLeft: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {/* Status card */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Статус заявки</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ padding: '8px 12px', borderRadius: 8, background: sm.bg, border: `1px solid ${sm.dot}30` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: sm.color }}>{sm.label}</div>
              </div>
              {contractor && (
                <div style={{ padding: '8px 12px', borderRadius: 8, background: '#F0FDF4', border: '1px solid #BBF7D0', fontSize: 12, color: '#14532D', fontWeight: 600 }}>
                  ✓ {contractor.contractorName}
                </div>
              )}
              {epicArtifact && (
                <div style={{ padding: '8px 12px', borderRadius: 8, background: '#ECFEFF', border: '1px solid #A5F3FC', fontSize: 12, color: '#0E7490', fontWeight: 600, cursor: 'pointer' }} onClick={() => setSelectedArtifact(epicArtifact)}>
                  📋 СберТрек · PAY-1842
                </div>
              )}
              {req.znrNumber && (
                <div style={{ padding: '8px 12px', borderRadius: 8, background: '#F5F3FF', border: '1px solid #DDD6FE', fontSize: 12, color: '#5B21B6', fontWeight: 700 }}>
                  🏛️ {req.znrNumber}
                </div>
              )}
            </div>
          </div>

          {/* Ownership */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Владелец</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: req.currentOwner === 'staff' ? '#0E7490' : req.currentOwner === 'customer' ? '#2563EB' : '#475569' }}>
              {req.currentOwner === 'staff' ? '🎯 Штаб' : req.currentOwner === 'customer' ? '👤 Заказчик' : '⚙ Система'}
            </div>
          </div>

          {/* Files block */}
          {req.attachments && req.attachments.length > 0 && (
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Файлы заказчика</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {req.attachments.map((att, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 7, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>
                      {att.mimeType?.includes('pdf') ? '📄' : att.mimeType?.includes('word') || att.fileName?.endsWith('.docx') ? '📝' : '📎'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.fileName}</div>
                      {att.extractedSummary && (
                        <div style={{ fontSize: 10, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.extractedSummary}</div>
                      )}
                    </div>
                    <span style={{ fontSize: 10, color: '#94A3B8', flexShrink: 0 }}>
                      {att.uploadedBy === 'customer' ? '👤' : '🎯'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mini events */}
          <div style={{ flex: 1, padding: '12px 14px', overflowY: 'auto' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>События</div>
            {req.events.slice(-6).reverse().map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563EB', marginTop: 4, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 11, color: '#334155', lineHeight: '1.5' }}>{e.description}</div>
                  <div style={{ fontSize: 10, color: '#CBD5E1', marginTop: 1 }}>{e.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals / Drawers */}
      {selectedArtifact && (
        <ArtifactDrawer
          artifact={selectedArtifact}
          request={req}
          onClose={() => setSelectedArtifact(null)}
        />
      )}
      {showChat && (
        <ChatDrawer
          request={req}
          viewerRole="staff"
          onClose={() => setShowChat(false)}
        />
      )}
      {showLKModal && (
        <LKModal
          request={req}
          onClose={handleLKSent}
        />
      )}
      {showSpecEditor && (
        <SpecificationEditor
          request={req}
          onClose={() => setShowSpecEditor(false)}
        />
      )}
    </div>
    </RoleGate>
  )
}
