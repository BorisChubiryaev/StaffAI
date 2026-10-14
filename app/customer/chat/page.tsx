'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useDemoStore, DEMO_STEPS, DEFAULT_BACKLOG, DEFAULT_STORIES } from '@/lib/demo-store'
import { WorkflowStepper } from '@/components/WorkflowStepper'
import { RoleGate, RoleTransitionOverlay } from '@/components/RoleGate'
import { BacklogStory, DemoAttachment } from '@/lib/types'

const SAMPLE_INPUT = `Мне нужна команда из 10 человек на 8 месяцев:
3 Java backend-разработчика — 2 middle и 1 senior,
2 системных аналитика,
1 frontend-разработчик senior,
1 DevOps senior,
2 autotest QA middle.
Нужен опыт с банковскими backend-системами.
Аналитики и backend нужны срочно, QA могут выйти через месяц.`

const VOICE_SAMPLE = `Нам нужна команда на 8 месяцев для развития платёжных backend-сервисов. Аналитики и backend нужны с июня, QA можно подключить на месяц позже.`

const CLARIFICATIONS = [
  { question: 'Какой frontend-стек предпочтителен?', hint: 'React, Vue, Angular или другой?', answer: 'React + TypeScript, желательно опыт с дизайн-системами банка', field: 'frontend_stack', confidenceGain: 6 },
  { question: 'Какая точная дата старта?', hint: 'Или "как можно скорее" — тоже ОК', answer: 'Старт — 1 июня 2026, QA могут выйти позже — 1 июля', field: 'start_date', confidenceGain: 5 },
  { question: 'Каков CI-код проекта для бюджетирования?', hint: 'Можно уточнить позже — не блокирует создание заявки', answer: 'CI-код — 77412-PAY. Если нужно, уточню у своего руководителя.', field: 'ci_code', confidenceGain: 5 },
]

const CONFIRMED_TEAM = [
  { role: 'Java Backend-разработчик', level: 'Middle', count: 2, priority: 'critical' },
  { role: 'Java Backend-разработчик', level: 'Senior', count: 1, priority: 'critical' },
  { role: 'Системный аналитик', level: 'Middle', count: 2, priority: 'critical' },
  { role: 'Frontend-разработчик (React/TS)', level: 'Senior', count: 1, priority: 'high' },
  { role: 'DevOps-инженер', level: 'Senior', count: 1, priority: 'high' },
  { role: 'Autotest QA', level: 'Middle', count: 2, priority: 'normal' },
]

const PRIORITY_COLOR: Record<string, { color: string; bg: string }> = {
  critical: { color: '#DC2626', bg: '#FEF2F2' },
  high:     { color: '#D97706', bg: '#FFFBEB' },
  normal:   { color: '#64748B', bg: '#F1F5F9' },
}

type Phase = 'empty' | 'typing' | 'ai_processing' | 'clarifications' | 'confirmation' | 'tracker_wizard' | 'tracker_existing_check' | 'tracker_existing_result' | 'tracker_new_draft' | 'tracker_confirmed' | 'tracker_created' | 'done'


function uid() { return `${Date.now()}_${Math.random().toString(36).slice(2, 6)}` }
function fmtSize(bytes: number) { return bytes > 1024 ? `${Math.round(bytes / 1024)} KB` : `${bytes} B` }

export default function CustomerChatPage() {
  const { state, dispatch, confirmStructuredRequest, submitToStaff, generateBacklogDraft, confirmTrackerBacklog, createTrackerBacklog, addAttachmentToChat } = useDemoStore()
  const [inputValue, setInputValue] = useState('')
  const [phase, setPhase] = useState<Phase>('empty')
  const [clarIdx, setClarIdx] = useState(0)
  const [confidence, setConfidence] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [showTransitionOverlay, setShowTransitionOverlay] = useState(false)

  // Voice mock
  const [voiceListening, setVoiceListening] = useState(false)
  const [voiceHint, setVoiceHint] = useState('')

  // File upload
  const [pendingAttachments, setPendingAttachments] = useState<DemoAttachment[]>([])
  const [aiAnalyzingFile, setAiAnalyzingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // СберТрек wizard
  const [existingKey, setExistingKey] = useState('PAY-1842')
  const [checkingTracker, setCheckingTracker] = useState(false)
  const [editingStory, setEditingStory] = useState<string | null>(null)
  const [localStories, setLocalStories] = useState<BacklogStory[]>(DEFAULT_STORIES)
  const [creatingTasks, setCreatingTasks] = useState(false)

  const messagesRef = useRef<HTMLDivElement>(null)
  const chatMessages = state.chatMessages

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight
  }, [chatMessages, phase])

  const addMsg = useCallback((role: 'user' | 'ai', text: string) => {
    const ts = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    dispatch({ type: 'ADD_CHAT_MESSAGE', msg: { id: `m${Date.now()}`, role, text, ts } })
  }, [dispatch])

  // ─── Voice dictation ───────────────────────────────────────────────────────
  const handleVoiceDictation = () => {
    if (voiceListening) return
    setVoiceListening(true)
    setVoiceHint('Слушаю…')
    setTimeout(() => {
      setInputValue(VOICE_SAMPLE)
      setVoiceHint('Голос распознан и преобразован в текст')
      setVoiceListening(false)
      if (phase === 'empty') setPhase('typing')
      setTimeout(() => setVoiceHint(''), 3000)
      dispatch({ type: 'VOICE_INPUT_TRANSCRIBED', text: VOICE_SAMPLE })
    }, 1800)
  }

  // ─── File upload ───────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const att: DemoAttachment = {
      id: uid(), fileName: file.name, fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
      uploadedAt: new Date().toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
      uploadedBy: 'customer', source: 'ai_chat',
    }
    setPendingAttachments(prev => [...prev, att])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemoveAttachment = (id: string) => {
    setPendingAttachments(prev => prev.filter(a => a.id !== id))
  }

  const sendMessageWithAttachments = (text: string) => {
    const ts = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    dispatch({ type: 'ADD_CHAT_MESSAGE', msg: { id: `m${Date.now()}`, role: 'user', text: text || '(прикреплён файл)', ts } })
    pendingAttachments.forEach(att => addAttachmentToChat(att))

    if (pendingAttachments.length > 0) {
      const fileNames = pendingAttachments.map(a => a.fileName).join(', ')
      setAiAnalyzingFile(true)
      setTimeout(() => {
        addMsg('ai', `Файл получен: ${fileNames}\n\nЯ извлёк из него требования к ролям и добавил их в структурированный запрос.\n\nНайдено:\n- Java Backend: Spring, PostgreSQL, опыт банковских backend-систем\n- Frontend: React, TypeScript, дизайн-система\n- QA: автотесты API и регрессионные сценарии\n\nДанные учтены при формировании заявки.`)
        setAiAnalyzingFile(false)
        dispatch({ type: 'ADD_CHAT_MESSAGE', msg: { id: uid(), role: 'ai', text: '', ts } })
      }, 1500)
    }
    setPendingAttachments([])
  }

  // ─── Initial flow ──────────────────────────────────────────────────────────
  const handleSendInitial = (text: string) => {
    if (!text.trim() && pendingAttachments.length === 0) return
    setInputValue('')
    setPhase('ai_processing')
    sendMessageWithAttachments(text)
    if (text.trim()) {
      setTimeout(() => {
        addMsg('ai', 'Принял! Анализирую запрос…\n\nРаспознал состав команды: 10 человек, 6 ролей, срок 8 месяцев. Базовая уверенность: 72%. Задам 3 уточняющих вопроса, чтобы повысить точность.')
        setConfidence(72)
        setPhase('clarifications')
        setClarIdx(0)
      }, 1200)
    }
  }

  const handleSend = () => {
    if (phase === 'empty' || phase === 'typing') {
      handleSendInitial(inputValue)
    } else if (inputValue.trim() || pendingAttachments.length > 0) {
      sendMessageWithAttachments(inputValue)
      setInputValue('')
    }
  }

  const handleAnswerClarification = (idx: number) => {
    const clar = CLARIFICATIONS[idx]
    addMsg('user', clar.answer)
    const newConf = Math.min(96, confidence + clar.confidenceGain)
    setConfidence(newConf)
    dispatch({ type: 'ANSWER_CLARIFICATION', count: idx + 1 })
    setTimeout(() => {
      const nextIdx = idx + 1
      if (nextIdx < CLARIFICATIONS.length) {
        addMsg('ai', `Понял! Обновил запрос. Уверенность: ${newConf}%.\n\nСледующий вопрос:`)
        setClarIdx(nextIdx)
      } else {
        addMsg('ai', `Отлично! Все данные собраны.\n\n✅ Уверенность AI: ${newConf}%\n\nStructured request готов к подтверждению.`)
        setPhase('confirmation')
      }
    }, 700)
  }

  const handleConfirm = () => {
    setShowModal(false)
    confirmStructuredRequest()
    addMsg('ai', '✅ Структурированный запрос REQ-2026-00521 подтверждён!\n\nТеперь нужно связать заявку с задачами в СберТрек.')
    setTimeout(() => {
      generateBacklogDraft()
      setPhase('tracker_wizard')
    }, 600)
  }

  // ─── СберТрек wizard ───────────────────────────────────────────────────────
  const handleTrackerExistingCheck = () => {
    if (!existingKey.trim()) return
    setCheckingTracker(true)
    dispatch({ type: 'VERIFY_EXISTING_TRACKER_TASK', epicKey: existingKey })
    setTimeout(() => {
      setCheckingTracker(false)
      setPhase('tracker_existing_result')
    }, 1800)
  }

  const handleUseExistingTask = () => {
    addMsg('ai', `✅ Задача ${existingKey} привязана к заявке REQ-2026-00521.\n\nДанные из СберТрек синхронизированы. Вы можете передать заявку в штаб.`)
    confirmTrackerBacklog()
    // Use existing key as epic
    dispatch({ type: 'CREATE_TRACKER_BACKLOG' })
    setPhase('tracker_created')
  }

  const handleCreateNewBacklog = () => {
    setLocalStories([...DEFAULT_STORIES])
    setPhase('tracker_new_draft')
    addMsg('ai', '📋 AI сформировал draft backlog для СберТрек на основе данных заявки.\n\nПроверьте формулировки Story и подтвердите создание задач.')
  }

  const handleConfirmCreateTasks = () => {
    setCreatingTasks(true)
    confirmTrackerBacklog()
    setTimeout(() => {
      createTrackerBacklog()
      addMsg('ai', `✅ Epic SBT-28491 и 4 Story созданы в СберТрек!\n\nИсточник: REQ-2026-00521. Задачи связаны с этапами спецификации. Теперь вы можете передать заявку в штаб.`)
      setCreatingTasks(false)
      setPhase('tracker_created')
    }, 1800)
  }

  const handleSubmitToStaff = () => {
    submitToStaff()
    addMsg('ai', '🎯 Заявка REQ-2026-00521 передана в штаб!\n\nBacklog в СберТрек подтверждён. Вы получите уведомление, когда сотрудник начнёт обработку.')
    setPhase('done')
    setShowTransitionOverlay(true)
  }

  const formatText = (t: string) => t.split('\n').map((l, i) => <span key={i}>{l}{i < t.split('\n').length - 1 && <br />}</span>)
  const nextStep = DEMO_STEPS[state.demoStep]
  const priorityBadge = (p: string) => ({ 'Критично': { bg: '#FEF2F2', color: '#DC2626' }, 'Важно': { bg: '#FFFBEB', color: '#D97706' }, 'Средне': { bg: '#F1F5F9', color: '#64748B' } }[p] ?? { bg: '#F1F5F9', color: '#64748B' })

  return (
    <RoleGate expectedRole="customer">
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#F6F8FB' }}>

      {showTransitionOverlay && nextStep && nextStep.role !== 'customer' && (
        <RoleTransitionOverlay
          nextRole={nextStep.role as 'customer' | 'staff' | 'admin'}
          actionDescription="Заявка передана в штаб. Backlog в СберТрек подтверждён."
          nextStepLabel={nextStep.label}
          nextPath={nextStep.path}
          onStay={() => setShowTransitionOverlay(false)}
        />
      )}

      {/* Topbar */}
      <header style={{ height: 56, background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Link href="/" style={{ width: 32, height: 32, borderRadius: 8, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: 14, textDecoration: 'none' }}>←</Link>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Создать заявку</div>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>AI-ассистент · GigaChat</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {confidence > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, background: confidence >= 90 ? '#F0FDF4' : '#EFF6FF', border: `1px solid ${confidence >= 90 ? '#BBF7D0' : '#BFDBFE'}` }}>
              <div style={{ width: 40, height: 4, background: '#E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${confidence}%`, background: confidence >= 90 ? '#16A34A' : '#2563EB', borderRadius: 2, transition: 'width 0.4s' }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: confidence >= 90 ? '#14532D' : '#1D4ED8' }}>{confidence}%</span>
            </div>
          )}
          <div style={{ padding: '4px 10px', borderRadius: 6, background: '#F5F3FF', border: '1px solid #DDD6FE', fontSize: 11, fontWeight: 700, color: '#7C3AED' }}>✦ AI</div>
        </div>
      </header>

      {/* Workflow stepper */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '10px 24px' }}>
        <WorkflowStepper status={state.request?.status ?? 'ai_intake'} variant="full" />
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Chat area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }} ref={messagesRef}>
          <div style={{ maxWidth: 660, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {chatMessages.filter(m => m.text).map(msg => (
              <div key={msg.id}>
                {msg.role === 'ai' ? (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #7C3AED, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, color: '#fff' }}>✦</div>
                    <div>
                      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, borderTopLeftRadius: 3, padding: '11px 15px', fontSize: 13, color: '#0F172A', lineHeight: '1.6', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        {formatText(msg.text)}
                      </div>
                      <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 3 }}>{msg.ts}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ maxWidth: '85%', alignSelf: 'flex-end', marginLeft: 'auto' }}>
                    <div style={{ background: '#2563EB', borderRadius: 12, borderTopRightRadius: 3, padding: '11px 15px', fontSize: 13, color: '#FFFFFF', lineHeight: '1.6' }}>
                      {formatText(msg.text)}
                    </div>
                    <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 3, textAlign: 'right' }}>{msg.ts}</div>
                  </div>
                )}
              </div>
            ))}

            {aiAnalyzingFile && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #7C3AED, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', flexShrink: 0 }}>✦</div>
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '11px 15px', fontSize: 13, color: '#94A3B8' }}>Анализирую файл…</div>
              </div>
            )}

            {/* Clarification question */}
            {phase === 'clarifications' && clarIdx < CLARIFICATIONS.length && (
              <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0369A1', marginBottom: 10 }}>💬 Вопрос {clarIdx + 1} из {CLARIFICATIONS.length}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>{CLARIFICATIONS[clarIdx].question}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>{CLARIFICATIONS[clarIdx].hint}</div>
                <button onClick={() => handleAnswerClarification(clarIdx)}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #BFDBFE', background: '#FFFFFF', fontSize: 13, color: '#1E40AF', cursor: 'pointer', textAlign: 'left', lineHeight: '1.5' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#EFF6FF')} onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}>
                  «{CLARIFICATIONS[clarIdx].answer}»
                  <span style={{ display: 'block', fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Нажмите для отправки этого ответа</span>
                </button>
              </div>
            )}

            {/* Confirm CTA */}
            {phase === 'confirmation' && (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>✅ Structured Request готов</div>
                <div style={{ fontSize: 12, color: '#166534', marginBottom: 12 }}>AI собрал все данные с уверенностью {confidence}%. Проверьте запрос и подтвердите.</div>
                <button onClick={() => setShowModal(true)} style={{ padding: '10px 20px', borderRadius: 8, background: '#16A34A', color: '#FFFFFF', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Просмотреть и подтвердить →
                </button>
              </div>
            )}

            {/* ── СберТрек wizard ── */}
            {phase === 'tracker_wizard' && (
              <div style={{ background: '#F0F9FF', border: '2px solid #BAE6FD', borderRadius: 14, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0369A1', marginBottom: 6 }}>📋 Подготовка backlog в СберТрек</div>
                <div style={{ fontSize: 13, color: '#475569', marginBottom: 16, lineHeight: '1.6' }}>
                  AI собрал данные заявки и должен связать её с задачами в СберТрек.<br />
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>Задачи не создаются автоматически — вам нужно подтвердить создание.</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button onClick={() => { setPhase('tracker_existing_check') }}
                    style={{ padding: '12px 16px', borderRadius: 10, border: '2px solid #BFDBFE', background: '#FFFFFF', fontSize: 13, fontWeight: 600, color: '#1E40AF', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>🔗</span>
                    <div>
                      <div>У меня уже есть Epic/Story в СберТрек</div>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 400 }}>Введите номер задачи — AI проверит совпадение с заявкой</div>
                    </div>
                  </button>
                  <button onClick={handleCreateNewBacklog}
                    style={{ padding: '12px 16px', borderRadius: 10, border: '2px solid #A7F3D0', background: '#FFFFFF', fontSize: 13, fontWeight: 600, color: '#065F46', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>✨</span>
                    <div>
                      <div>Нужно создать новые задачи на основе заявки</div>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 400 }}>AI сформирует Epic + 4 Story по этапам — вы проверяете и подтверждаете</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Existing epic check */}
            {phase === 'tracker_existing_check' && (
              <div style={{ background: '#FAFAFA', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>🔍 Введите номер задачи в СберТрек</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input value={existingKey} onChange={e => setExistingKey(e.target.value)}
                    style={{ flex: 1, padding: '9px 12px', border: '1px solid #BFDBFE', borderRadius: 8, fontSize: 14, fontWeight: 700, outline: 'none', color: '#0F172A' }}
                    placeholder="PAY-1842 / SBT-28491" />
                  <button onClick={handleTrackerExistingCheck} disabled={checkingTracker || !existingKey.trim()}
                    style={{ padding: '9px 18px', borderRadius: 8, background: checkingTracker ? '#CBD5E1' : '#2563EB', color: '#FFFFFF', fontSize: 13, fontWeight: 700, border: 'none', cursor: checkingTracker ? 'default' : 'pointer' }}>
                    {checkingTracker ? '⟳ Проверяем…' : 'Проверить задачу'}
                  </button>
                </div>
                {checkingTracker && (
                  <div style={{ fontSize: 12, color: '#64748B' }}>Проверяем задачу {existingKey} в СберТрек…</div>
                )}
              </div>
            )}

            {/* Existing epic result */}
            {phase === 'tracker_existing_result' && (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#14532D', marginBottom: 12 }}>
                  ✅ Задача найдена: {existingKey}
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Совпадает:</div>
                  {['срок: 8 месяцев', 'роли: Java Backend, SA, Frontend, DevOps, QA', 'количество специалистов: 10', 'приоритет: высокий'].map((item, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#16A34A', padding: '3px 0' }}>✓ {item}</div>
                  ))}
                </div>
                <div style={{ marginBottom: 14, padding: '10px 12px', background: '#FFFBEB', borderRadius: 8, border: '1px solid #FDE68A' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>Требует уточнения:</div>
                  <div style={{ fontSize: 12, color: '#78350F' }}>⚠ QA стартует через месяц — в СберТрек не указана календаризация</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={handleUseExistingTask}
                    style={{ padding: '9px 16px', borderRadius: 8, background: '#16A34A', color: '#FFFFFF', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                    Использовать эту задачу ✓
                  </button>
                  <button onClick={handleCreateNewBacklog}
                    style={{ padding: '9px 16px', borderRadius: 8, background: '#F0F9FF', color: '#0369A1', fontSize: 13, fontWeight: 600, border: '1px solid #BAE6FD', cursor: 'pointer' }}>
                    Создать новые Story
                  </button>
                </div>
              </div>
            )}

            {/* New backlog draft */}
            {phase === 'tracker_new_draft' && (
              <div style={{ background: '#FAFAFA', border: '1px solid #E2E8F0', borderRadius: 14, padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>AI подготовил draft backlog для СберТрек</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Перед созданием задач проверьте формулировки. Задачи будут использованы в спецификации.</div>
                  </div>
                </div>

                {/* Epic row */}
                <div style={{ padding: '10px 14px', background: '#EFF6FF', borderRadius: 8, border: '1px solid #BFDBFE', marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, background: '#DBEAFE', color: '#1E40AF', fontWeight: 700 }}>Epic</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginLeft: 8 }}>{DEFAULT_BACKLOG.key}</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#64748B' }}>СберТрек · AI-генерация</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#334155', marginTop: 4 }}>{DEFAULT_BACKLOG.title}</div>
                </div>

                {/* Stories */}
                {localStories.map((story) => {
                  const pb = priorityBadge(story.priority)
                  const isEditing = editingStory === story.id
                  return (
                    <div key={story.id} style={{ marginBottom: 8, padding: '12px 14px', background: '#FFFFFF', borderRadius: 8, border: `1px solid ${isEditing ? '#BFDBFE' : '#E2E8F0'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: '#F1F5F9', color: '#475569', fontWeight: 700 }}>Story</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#0E7490' }}>{story.key}</span>
                            <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: pb.bg, color: pb.color, fontWeight: 700 }}>{story.priority}</span>
                          </div>
                          {isEditing ? (
                            <input value={story.title}
                              onChange={e => setLocalStories(prev => prev.map(s => s.id === story.id ? { ...s, title: e.target.value } : s))}
                              style={{ width: '100%', padding: '6px 10px', border: '1px solid #BFDBFE', borderRadius: 6, fontSize: 13, outline: 'none', marginBottom: 6 }} />
                          ) : (
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>{story.title}</div>
                          )}
                          <div style={{ fontSize: 11, color: '#64748B' }}>{story.plannedStart} — {story.plannedEnd} · {story.roles.join(', ')}</div>
                        </div>
                        <button onClick={() => setEditingStory(isEditing ? null : story.id)}
                          style={{ marginLeft: 10, padding: '4px 10px', borderRadius: 6, border: '1px solid #E2E8F0', background: isEditing ? '#EFF6FF' : '#F8FAFC', fontSize: 11, color: '#64748B', cursor: 'pointer', flexShrink: 0 }}>
                          {isEditing ? '✓' : '✏️'}
                        </button>
                      </div>
                    </div>
                  )
                })}

                <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                  <button onClick={handleConfirmCreateTasks} disabled={creatingTasks}
                    style={{ flex: 1, padding: '11px 0', borderRadius: 9, background: creatingTasks ? '#CBD5E1' : 'linear-gradient(135deg, #16A34A, #15803D)', color: '#FFFFFF', fontSize: 13, fontWeight: 800, border: 'none', cursor: creatingTasks ? 'default' : 'pointer', boxShadow: creatingTasks ? 'none' : '0 2px 8px rgba(22,163,74,0.3)' }}>
                    {creatingTasks ? '⟳ Создаём задачи в СберТрек…' : '✅ Создать задачи в СберТрек'}
                  </button>
                  <button onClick={() => setPhase('tracker_wizard')}
                    style={{ padding: '11px 14px', borderRadius: 9, background: '#F1F5F9', color: '#475569', fontSize: 13, border: 'none', cursor: 'pointer' }}>
                    ←
                  </button>
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: '#94A3B8', textAlign: 'center' }}>
                  Задачи будут созданы только после нажатия кнопки выше
                </div>
              </div>
            )}

            {/* Tracker created — step 3 */}
            {phase === 'tracker_created' && (
              <div style={{ background: '#ECFEFF', border: '1px solid #A5F3FC', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0E7490', marginBottom: 10 }}>
                  📋 Backlog в СберТрек подтверждён
                </div>
                <div style={{ padding: '10px 14px', background: '#F0FDFA', borderRadius: 8, border: '1px solid #A7F3D0', marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{state.request?.backlog?.key ?? 'SBT-28491'} — {DEFAULT_BACKLOG.title}</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>4 Story · Источник: REQ-2026-00521 · Подтверждено заказчиком</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleSubmitToStaff}
                    style={{ flex: 1, padding: '9px 0', borderRadius: 8, background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: '#FFFFFF', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
                    🎯 Передать заявку в штаб →
                  </button>
                </div>
              </div>
            )}

            {/* Done */}
            {phase === 'done' && (
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>🎉</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1E40AF', marginBottom: 4 }}>Заявка REQ-2026-00521 передана в штаб!</div>
                <div style={{ fontSize: 12, color: '#3B82F6', marginBottom: 12 }}>Backlog СберТрек подтверждён · Штаб получил уведомление</div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <Link href="/customer/requests" style={{ padding: '8px 16px', borderRadius: 7, background: '#2563EB', color: '#FFFFFF', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                    Мои заявки →
                  </Link>
                  <Link href="/" style={{ padding: '8px 16px', borderRadius: 7, background: '#F1F5F9', color: '#475569', fontSize: 12, fontWeight: 500, textDecoration: 'none' }}>
                    На главную
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ width: 280, background: '#FFFFFF', borderLeft: '1px solid #E2E8F0', overflowY: 'auto', padding: 16, flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>Что понял AI</div>

          {confidence > 0 && (
            <div style={{ marginBottom: 14, padding: 12, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: '#64748B' }}>Уверенность AI</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: confidence >= 90 ? '#16A34A' : '#2563EB' }}>{confidence}%</span>
              </div>
              <div style={{ height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${confidence}%`, borderRadius: 3, background: `linear-gradient(90deg, #2563EB, ${confidence >= 90 ? '#16A34A' : '#7C3AED'})`, transition: 'width 0.5s' }} />
              </div>
            </div>
          )}

          {phase !== 'empty' && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Состав команды</div>
              {CONFIRMED_TEAM.map((m, i) => {
                const pc = PRIORITY_COLOR[m.priority]
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F8FAFC' }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#0F172A', fontWeight: 500 }}>{m.role}</div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                        <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: '#EFF6FF', color: '#2563EB' }}>{m.level}</span>
                        <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: pc.bg, color: pc.color }}>{m.priority}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#2563EB' }}>×{m.count}</span>
                  </div>
                )
              })}
              <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Итого</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>10 человек</span>
              </div>
            </div>
          )}

          {/* Files block */}
          {(state.request?.attachments?.length ?? 0) > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Файлы заявки</div>
              {state.request!.attachments!.map((att, i) => (
                <div key={i} style={{ padding: '8px 10px', background: '#F8FAFC', borderRadius: 7, border: '1px solid #E2E8F0', marginBottom: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>📎 {att.fileName}</div>
                  <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{fmtSize(att.fileSize)} · {att.uploadedAt}</div>
                  {att.extractedSummary && <div style={{ fontSize: 10, color: '#0E7490', marginTop: 3 }}>✦ {att.extractedSummary}</div>}
                </div>
              ))}
            </div>
          )}

          {phase === 'empty' && (
            <div style={{ padding: '20px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
              <div style={{ fontSize: 12, color: '#94A3B8', lineHeight: '1.6' }}>
                Опишите, кто нужен в вашу команду — AI начнёт структурировать запрос в реальном времени
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      {phase !== 'done' && (
        <div style={{ background: '#FFFFFF', borderTop: '1px solid #E2E8F0', padding: 16, flexShrink: 0 }}>
          <div style={{ maxWidth: 660, margin: '0 auto' }}>
            {phase === 'empty' && (
              <div style={{ marginBottom: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button onClick={() => setInputValue(SAMPLE_INPUT)}
                  style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #BFDBFE', background: '#EFF6FF', fontSize: 12, fontWeight: 500, color: '#1E40AF', cursor: 'pointer' }}>
                  Использовать пример →
                </button>
                <span style={{ fontSize: 11, color: '#94A3B8', alignSelf: 'center' }}>или напишите своими словами</span>
              </div>
            )}

            {/* Pending attachments */}
            {pendingAttachments.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {pendingAttachments.map(att => (
                  <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: '#EFF6FF', border: '1px solid #BFDBFE', fontSize: 12, color: '#1E40AF' }}>
                    <span>📎</span>
                    <span style={{ fontWeight: 600 }}>{att.fileName}</span>
                    <span style={{ color: '#94A3B8' }}>{fmtSize(att.fileSize)}</span>
                    <button onClick={() => handleRemoveAttachment(att.id)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 2px' }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Voice hint */}
            {voiceHint && (
              <div style={{ marginBottom: 6, fontSize: 11, color: voiceListening ? '#7C3AED' : '#16A34A', display: 'flex', alignItems: 'center', gap: 5 }}>
                {voiceListening ? <span style={{ display: 'inline-block', animation: 'pulse 1s infinite' }}>🎙</span> : '✓'} {voiceHint}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              {/* Voice button */}
              <button onClick={handleVoiceDictation} disabled={voiceListening}
                title="Диктовка голосом"
                style={{ width: 42, height: 42, borderRadius: 10, border: `1px solid ${voiceListening ? '#DDD6FE' : '#E2E8F0'}`, background: voiceListening ? '#F5F3FF' : '#F8FAFC', fontSize: 18, cursor: voiceListening ? 'default' : 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                🎙
              </button>

              {/* File upload button */}
              <button onClick={() => fileInputRef.current?.click()}
                title="Прикрепить файл"
                style={{ width: 42, height: 42, borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 18, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                📎
              </button>
              <input ref={fileInputRef} type="file" accept=".docx,.pdf,.txt,.md" style={{ display: 'none' }} onChange={handleFileSelect} />

              <textarea
                style={{ flex: 1, padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 13, background: '#F8FAFC', outline: 'none', resize: 'none', height: phase === 'empty' ? 80 : 42, lineHeight: '1.5' }}
                value={inputValue}
                onChange={e => { setInputValue(e.target.value); if (phase === 'empty') setPhase('typing') }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder={phase === 'empty' || phase === 'typing' ? 'Опишите потребность в специалистах…' : 'Напишите уточнение…'}
                onFocus={e => (e.target.style.borderColor = '#93C5FD')}
                onBlur={e => (e.target.style.borderColor = '#E2E8F0')}
              />
              <button onClick={handleSend} disabled={!inputValue.trim() && pendingAttachments.length === 0}
                style={{ width: 42, height: 42, borderRadius: 10, border: 'none', background: (inputValue.trim() || pendingAttachments.length > 0) ? '#2563EB' : '#CBD5E1', color: '#FFFFFF', fontSize: 16, cursor: (inputValue.trim() || pendingAttachments.length > 0) ? 'pointer' : 'default', flexShrink: 0, alignSelf: 'flex-end', transition: 'background 0.2s' }}>
                ↑
              </button>
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>
              🎙 Диктовка · 📎 Прикрепить файл · Enter — отправить · Shift+Enter — новая строка
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '22px 24px', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 20, background: '#F0FDF4', border: '1px solid #BBF7D0', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 8 }}>
                ✅ Уверенность AI: {confidence}%
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Подтвердите запрос</h2>
              <p style={{ fontSize: 13, color: '#64748B' }}>Проверьте что AI правильно понял вашу потребность</p>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>Состав команды — 10 человек</div>
                {CONFIRMED_TEAM.map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F8FAFC' }}>
                    <div style={{ fontSize: 13, color: '#0F172A' }}>
                      {r.role}<span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: '#EFF6FF', color: '#2563EB', marginLeft: 6 }}>{r.level}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#2563EB' }}>× {r.count}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[['Длительность', '8 месяцев'], ['Старт', '1 июня 2026'], ['Приоритет Backend+SA', 'Немедленно'], ['Приоритет QA', 'Через 1 месяц']].map(([k, v]) => (
                  <div key={k} style={{ padding: '10px 12px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 2 }}>{k.toUpperCase()}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: 12, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, fontSize: 12, color: '#92400E' }}>
                ℹ️ После подтверждения AI предложит связать заявку с backlog в СберТрек. Задачи создаются только с вашего согласия.
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 10 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 13, fontWeight: 500, color: '#475569', cursor: 'pointer' }}>
                ← Изменить
              </button>
              <button onClick={handleConfirm} style={{ flex: 1, padding: '9px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #16A34A, #15803D)', fontSize: 13, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', boxShadow: '0 2px 8px rgba(21,128,61,0.3)' }}>
                ✅ Подтвердить запрос REQ-2026-00521
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </RoleGate>
  )
}
