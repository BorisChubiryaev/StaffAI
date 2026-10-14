'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useDemoStore, STATUS_META } from '@/lib/demo-store'
import { RoleSelector } from '@/components/RoleSelector'
import { ChatDrawer } from '@/components/ChatDrawer'
import { RoleGate } from '@/components/RoleGate'

const STATIC_REQUESTS = [
  {
    id: 'REQ-2026-00504',
    title: 'DevOps-команда для миграции в облако',
    status: 'contractor_selection',
    created: '03.05.2026',
    updatedAt: '06.05.2026, 16:20',
    team: [{ r: 'DevOps Senior', n: 2 }, { r: 'Cloud Architect', n: 1 }, { r: 'SRE', n: 1 }],
    total: 4,
    duration: '5 мес.',
    start: '01 июня 2026',
    confidence: 91,
  },
  {
    id: 'REQ-2026-00489',
    title: 'Аналитики для разработки архитектуры Data Lake',
    status: 'completed',
    created: '15.04.2026',
    updatedAt: '02.05.2026, 09:10',
    team: [{ r: 'Data Engineer', n: 2 }, { r: 'Data Analyst', n: 1 }, { r: 'Python Backend', n: 1 }],
    total: 4,
    duration: '4 мес.',
    start: '20 апр. 2026',
    confidence: 89,
  },
]

export default function CustomerRequestsPage() {
  const { state, customerAnswerClarification, customerApprove, customerRequestChanges, completeDemo } = useDemoStore()
  const req = state.request

  const [expandedId, setExpandedId] = useState<string | null>(req?.requestNumber ?? null)
  const [answerInput, setAnswerInput] = useState('')
  const [changesComment, setChangesComment] = useState('')
  const [showChangesInput, setShowChangesInput] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [answerSent, setAnswerSent] = useState(false)

  const allRequests = [
    ...(req ? [{
      id: req.requestNumber,
      title: req.title,
      status: req.status,
      created: req.createdAt.split(',')[0],
      updatedAt: req.updatedAt,
      team: req.structuredRequest.team.map(m => ({ r: `${m.role} ${m.level}`, n: m.count })),
      total: req.structuredRequest.team.reduce((s, m) => s + m.count, 0),
      duration: req.structuredRequest.duration,
      start: req.structuredRequest.startPreference,
      confidence: req.aiAnalysis.confidence,
      isDemo: true,
    }] : []),
    ...STATIC_REQUESTS.map(r => ({ ...r, isDemo: false })),
  ]

  const activeCount = allRequests.filter(r => !['completed', 'cancelled'].includes(r.status)).length
  const completedCount = allRequests.filter(r => r.status === 'completed').length
  const totalPeople = allRequests.reduce((s, r) => s + r.total, 0)

  const handleAnswerClarification = () => {
    if (!answerInput.trim()) return
    customerAnswerClarification(answerInput)
    setAnswerInput('')
    setAnswerSent(true)
    setTimeout(() => setAnswerSent(false), 4000)
  }

  const handleApprove = () => { customerApprove() }

  const handleRequestChanges = () => {
    if (!changesComment.trim()) return
    customerRequestChanges(changesComment)
    setChangesComment('')
    setShowChangesInput(false)
  }

  return (
    <RoleGate expectedRole="customer">
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Top bar */}
      <header style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '0 28px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/" style={{ width: 32, height: 32, borderRadius: 7, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, textDecoration: 'none', color: '#475569' }}>←</Link>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Мои заявки</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>Иван Петров · Команда «Платёжные сервисы»</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <RoleSelector />
          <Link href="/customer/chat" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: '#FFFFFF', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            + Новая заявка
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Всего заявок', value: allRequests.length, color: '#2563EB' },
            { label: 'В работе', value: activeCount, color: '#D97706' },
            { label: 'Выполнено', value: completedCount, color: '#16A34A' },
            { label: 'Человек в процессе', value: totalPeople, color: '#7C3AED' },
          ].map(s => (
            <div key={s.label} style={{ background: '#FFFFFF', borderRadius: 12, padding: '14px 18px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 3 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#64748B' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* SUCCESS FEEDBACK after answering clarification */}
        {answerSent && (
          <div style={{ marginBottom: 20, padding: '14px 18px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>✅</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#14532D' }}>Ответ отправлен в штаб</div>
              <div style={{ fontSize: 13, color: '#16A34A' }}>Заявка вернулась на проверку штаба. Теперь можно переходить к выбору подрядчика.</div>
            </div>
          </div>
        )}

        {/* Attention banner: awaiting clarification */}
        {req && req.status === 'awaiting_staff_clarification' && !answerSent && (
          <div style={{ marginBottom: 20, padding: '14px 18px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>Штаб запрашивает уточнение</div>
              {state.pendingStaffClarification && (
                <div style={{ fontSize: 13, color: '#78350F', marginBottom: 10, padding: '8px 12px', background: '#FEF3C7', borderRadius: 7 }}>
                  «{state.pendingStaffClarification}»
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid #FDE68A', borderRadius: 7, fontSize: 13, background: '#FFFBEB', outline: 'none' }}
                  value={answerInput}
                  onChange={e => setAnswerInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAnswerClarification()}
                  placeholder="Ваш ответ штабу… (напр.: React/TypeScript, старт 1 июня)"
                />
                <button
                  onClick={handleAnswerClarification}
                  style={{ padding: '8px 18px', borderRadius: 7, background: '#D97706', color: '#FFFFFF', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  Ответить →
                </button>
              </div>
              <div style={{ fontSize: 12, color: '#92400E', marginTop: 6 }}>
                После ответа заявка автоматически вернётся штабу для продолжения обработки.
              </div>
            </div>
          </div>
        )}

        {/* Customer approval banner */}
        {req && req.status === 'customer_approval' && (
          <div style={{ marginBottom: 20, padding: '16px 18px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 20 }}>📄</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1E40AF', marginBottom: 4 }}>Спецификация готова к согласованию</div>
              <div style={{ fontSize: 13, color: '#2563EB', marginBottom: 10 }}>Штаб подготовил черновик спецификации SPEC-2026-0017. Ознакомьтесь и согласуйте или запросите изменения.</div>
              {!showChangesInput ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleApprove} style={{ padding: '9px 20px', borderRadius: 8, background: 'linear-gradient(135deg, #16A34A, #15803D)', color: '#FFFFFF', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                    ✅ Согласовать
                  </button>
                  <button onClick={() => setShowChangesInput(true)} style={{ padding: '9px 16px', borderRadius: 8, background: '#F1F5F9', color: '#475569', fontSize: 13, fontWeight: 600, border: '1px solid #E2E8F0', cursor: 'pointer' }}>
                    ✏️ Запросить изменения
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid #BFDBFE', borderRadius: 7, fontSize: 13, outline: 'none' }}
                    value={changesComment}
                    onChange={e => setChangesComment(e.target.value)}
                    placeholder="Опишите необходимые изменения…"
                  />
                  <button onClick={handleRequestChanges} style={{ padding: '8px 14px', borderRadius: 7, background: '#EF4444', color: '#FFFFFF', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                    Отправить
                  </button>
                  <button onClick={() => setShowChangesInput(false)} style={{ padding: '8px 10px', borderRadius: 7, background: '#F1F5F9', color: '#64748B', fontSize: 13, border: 'none', cursor: 'pointer' }}>
                    ✗
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Staff waiting state — customer sees when staff is working */}
        {req && !['awaiting_staff_clarification', 'customer_approval', 'structured_request_ready', 'lk_approval_sent', 'contracting', 'completed'].includes(req.status) && req.currentOwner === 'staff' && !state.isDemoCompleted && (
          <div style={{ marginBottom: 20, padding: '14px 18px', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 20 }}>⏳</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0369A1', marginBottom: 3 }}>Ожидаем действие штаба</div>
              <div style={{ fontSize: 13, color: '#0284C7', marginBottom: 8 }}>
                Ваша заявка сейчас на этапе: <strong>{STATUS_META[req.status]?.label ?? req.status}</strong>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link href="/customer/requests" style={{ padding: '6px 14px', borderRadius: 7, background: '#EFF6FF', color: '#2563EB', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                  Посмотреть историю
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* LK approval status */}
        {req && (req.status === 'lk_config_ready' || req.status === 'lk_approval' || req.status === 'lk_approval_sent') && !state.isDemoCompleted && (
          <div style={{ marginBottom: 20, padding: '16px 18px', background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: req.status === 'lk_approval_sent' ? 12 : 0 }}>
              <span style={{ fontSize: 20 }}>🏛️</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#5B21B6', marginBottom: 3 }}>
                  {req.status === 'lk_approval_sent' ? 'Спецификация отправлена на согласование в ЛК' : 'Подготовка к отправке в ЛК'}
                </div>
                {req.znrNumber && (
                  <div style={{ fontSize: 13, color: '#7C3AED', marginBottom: 3, fontWeight: 600 }}>
                    {req.znrNumber} · Маршрут согласования запущен
                  </div>
                )}
                <div style={{ fontSize: 12, color: '#7C3AED' }}>
                  {req.status === 'lk_approval_sent'
                    ? 'Создана ЗНР-2026-00931. Маршрут согласования подготовлен. Далее процесс продолжается в ЛК и ЕСУП.'
                    : 'Штаб завершает оформление. Вы получите уведомление после завершения согласования.'}
                </div>
              </div>
            </div>
            {req.status === 'lk_approval_sent' && (
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  onClick={() => completeDemo()}
                  style={{
                    padding: '10px 22px', borderRadius: 8, border: 'none',
                    background: 'linear-gradient(135deg, #16A34A, #15803D)',
                    color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
                  }}
                >
                  ✅ Завершить демо
                </button>
                <button
                  style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #DDD6FE', background: '#F5F3FF', color: '#7C3AED', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => {}}
                >
                  🏛️ Открыть квитанцию ЛК
                </button>
              </div>
            )}
          </div>
        )}

        {/* Contracting / completed */}
        {req && (req.status === 'contracting' || req.status === 'completed') && (
          <div style={{ marginBottom: 20, padding: '14px 18px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>🎉</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#14532D' }}>
                {req.status === 'contracting' ? 'Спецификация согласована! Контрактный процесс запущен.' : 'Заявка успешно выполнена!'}
              </div>
              <div style={{ fontSize: 12, color: '#16A34A', marginTop: 2 }}>Специалисты будут выведены согласно согласованному графику.</div>
            </div>
          </div>
        )}

        {/* Request cards */}
        {allRequests.map(r => {
          const sm = STATUS_META[r.status] ?? STATUS_META['submitted_to_staff']
          const isOpen = expandedId === r.id
          const isDemo = (r as { isDemo?: boolean }).isDemo
          const needsAction = isDemo && req && (
            req.status === 'awaiting_staff_clarification' ||
            req.status === 'customer_approval'
          )

          return (
            <div
              key={r.id}
              style={{ background: '#FFFFFF', borderRadius: 12, border: `1px solid ${needsAction ? '#BFDBFE' : '#E2E8F0'}`, marginBottom: 14, overflow: 'hidden', boxShadow: isOpen ? '0 4px 12px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.06)', transition: 'box-shadow 0.2s' }}
            >
              {/* Card header */}
              <div
                style={{ padding: '18px 22px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', cursor: 'pointer' }}
                onClick={() => setExpandedId(isOpen ? null : r.id)}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, letterSpacing: '0.5px' }}>{r.id}</span>
                    {isDemo && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#F5F3FF', color: '#7C3AED', fontWeight: 700 }}>DEMO</span>}
                    {needsAction && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#FEF3C7', color: '#92400E', fontWeight: 700 }}>ТРЕБУЕТ ДЕЙСТВИЯ</span>}
                    {isDemo && req?.znrNumber && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#F5F3FF', color: '#7C3AED', fontWeight: 700 }}>{req.znrNumber}</span>}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>{r.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: sm.color, background: sm.bg }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: sm.dot }} />
                      {sm.label}
                    </span>
                    <span style={{ fontSize: 12, color: '#64748B' }}>Создана: <strong style={{ color: '#0F172A' }}>{r.created}</strong></span>
                    <span style={{ fontSize: 12, color: '#64748B' }}>Команда: <strong style={{ color: '#0F172A' }}>{r.total} чел.</strong></span>
                    <span style={{ fontSize: 12, color: '#64748B' }}>Срок: <strong style={{ color: '#0F172A' }}>{r.duration}</strong></span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: r.confidence >= 90 ? '#F0FDF4' : '#FFFBEB', border: `1px solid ${r.confidence >= 90 ? '#BBF7D0' : '#FDE68A'}`, fontSize: 12, fontWeight: 600, color: r.confidence >= 90 ? '#14532D' : '#92400E' }}>
                    ✦ {r.confidence}%
                  </span>
                  <div style={{ width: 30, height: 30, borderRadius: 7, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontSize: 13 }}>
                    {isOpen ? '↑' : '↓'}
                  </div>
                </div>
              </div>

              {/* Expanded body */}
              {isOpen && (
                <div style={{ padding: '0 22px 18px', borderTop: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: 14, marginBottom: 8 }}>Состав команды</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 14 }}>
                    {r.team.map((t, i) => (
                      <div key={i} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#334155' }}>
                        {t.r}<span style={{ fontWeight: 700, color: '#2563EB', marginLeft: 4 }}>×{t.n}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0', marginBottom: 14 }}>
                    <span style={{ fontSize: 13, color: '#64748B' }}>Итого: <strong style={{ color: '#0F172A' }}>{r.total} человек</strong></span>
                    <span style={{ fontSize: 13, color: '#64748B' }}>Старт: <strong style={{ color: '#0F172A' }}>{r.start}</strong></span>
                  </div>

                  {/* Demo artifacts summary */}
                  {isDemo && req && req.artifacts.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Артефакты заявки</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {req.artifacts.map((a, i) => {
                          const iconMap: Record<string, string> = { tracker_epic: '📋', jira_epic: '📋', specification_draft: '📄', config_json: '⚙️', requirements_summary: '📊', lk_config: '⚙️', lk_submission: '🏛️' }
                          const statusColor = a.status === 'approved' || a.status === 'sent' ? '#14532D' : a.status === 'ready' ? '#0E7490' : '#64748B'
                          const statusBg = a.status === 'approved' || a.status === 'sent' ? '#F0FDF4' : a.status === 'ready' ? '#ECFEFF' : '#F8FAFC'
                          return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, background: statusBg, border: `1px solid ${statusColor}30`, fontSize: 12, color: statusColor }}>
                              {iconMap[a.type] ?? '📄'} {a.title}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Timeline for demo request */}
                  {isDemo && req && req.events.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>История событий</div>
                      {req.events.slice(-4).map((e, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563EB', marginTop: 5, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: 12, color: '#0F172A', fontWeight: 500 }}>{e.description}</div>
                            <div style={{ fontSize: 10, color: '#94A3B8' }}>{e.timestamp}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {isDemo && req && req.status === 'awaiting_staff_clarification' && (
                      <div style={{ padding: '8px 14px', borderRadius: 8, background: '#FFFBEB', border: '1px solid #FDE68A', fontSize: 12, color: '#92400E', fontWeight: 600 }}>
                        ⏳ Ожидается ваш ответ на уточнение (см. выше)
                      </div>
                    )}
                    {isDemo && req && req.status === 'customer_approval' && (
                      <div style={{ padding: '8px 14px', borderRadius: 8, background: '#EFF6FF', border: '1px solid #BFDBFE', fontSize: 12, color: '#1D4ED8', fontWeight: 600 }}>
                        📄 Требуется согласование спецификации (см. выше)
                      </div>
                    )}
                    {isDemo && req && (req.status === 'lk_approval_sent') && req.znrNumber && (
                      <div style={{ padding: '8px 14px', borderRadius: 8, background: '#F5F3FF', border: '1px solid #DDD6FE', fontSize: 12, color: '#5B21B6', fontWeight: 600 }}>
                        🏛️ {req.znrNumber} · Отправлено на согласование в ЛК
                      </div>
                    )}

                    {/* Chat button — always visible for demo request */}
                    {isDemo && req && (
                      <button
                        onClick={() => setShowChat(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 7, border: '1px solid #BFDBFE', background: '#EFF6FF', fontSize: 12, color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }}
                      >
                        💬 Написать штабу
                        {req.messages.filter(m => m.sender === 'staff').length > 0 && (
                          <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#2563EB', color: '#FFFFFF', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {req.messages.filter(m => m.sender === 'staff').length}
                          </span>
                        )}
                      </button>
                    )}
                    {!isDemo && (
                      <button style={{ padding: '8px 14px', borderRadius: 7, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 12, color: '#475569', cursor: 'pointer' }}>
                        💬 Написать штабу
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </main>

      {/* Chat drawer */}
      {showChat && req && (
        <ChatDrawer
          request={req}
          viewerRole="customer"
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
    </RoleGate>
  )
}
