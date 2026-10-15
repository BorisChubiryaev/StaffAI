'use client'

import { useState, useRef, useEffect } from 'react'
import { StaffingRequest } from '@/lib/types'
import { useDemoStore } from '@/lib/demo-store'

interface Props {
  request: StaffingRequest
  viewerRole: 'customer' | 'staff'
  onClose: () => void
}

export function ChatDrawer({ request, viewerRole, onClose }: Props) {
  const { customerSendMessage, staffSendMessage } = useDemoStore()
  const [inputVal, setInputVal] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [request.messages.length])

  const sendMessage = () => {
    if (!inputVal.trim()) return
    if (viewerRole === 'customer') {
      customerSendMessage(inputVal)
    } else {
      staffSendMessage(inputVal)
    }
    setInputVal('')
  }

  const QUICK_ACTIONS_CUSTOMER = [
    'Добрый день! Когда ожидать выхода специалистов?',
    'Есть ли обновления по статусу заявки?',
    'Можно ли скорректировать дату старта?',
  ]

  const QUICK_ACTIONS_STAFF = [
    'Ваша заявка принята в работу, ведём подбор.',
    'Уточните, пожалуйста, preferred start date.',
    'Всё готово, направляем спецификацию на согласование.',
  ]

  const quickActions = viewerRole === 'customer' ? QUICK_ACTIONS_CUSTOMER : QUICK_ACTIONS_STAFF

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1000 }}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
        background: '#FFFFFF', zIndex: 1001,
        boxShadow: '-8px 0 30px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column',
        borderRadius: '16px 0 0 16px',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: viewerRole === 'customer' ? '#EFF6FF' : '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                💬
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                  {viewerRole === 'customer' ? 'Чат со штабом' : 'Чат с заказчиком'}
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>
                  {request.requestNumber} · {request.messages.length} сообщений
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#F1F5F9', color: '#64748B', cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>

          {/* Status line */}
          <div style={{ marginTop: 10, padding: '7px 12px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
            <span>Единое окно коммуникации по заявке</span>
            <span style={{ marginLeft: 'auto', fontWeight: 600, color: '#0F172A' }}>{request.title}</span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {request.messages.map(m => {
            const isMe = (viewerRole === 'customer' && m.sender === 'customer') ||
              (viewerRole === 'staff' && m.sender === 'staff')
            const isAI = m.sender === 'ai'
            const isSystem = m.sender === 'system'

            if (isSystem) return (
              <div key={m.id} style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8', padding: '4px 0' }}>{m.text}</div>
            )

            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '82%' }}>
                  {!isMe && (
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', marginBottom: 3, textTransform: 'uppercase' }}>
                      {isAI ? 'AI-агент' : m.sender === 'staff' ? '🎯 Штаб' : '👤 Заказчик'}
                    </div>
                  )}
                  <div style={{
                    padding: '9px 13px',
                    borderRadius: 12,
                    fontSize: 13,
                    lineHeight: '1.55',
                    background: isMe ? (viewerRole === 'customer' ? '#2563EB' : '#0E7490') : isAI ? '#F5F3FF' : '#F1F5F9',
                    color: isMe ? '#FFFFFF' : '#0F172A',
                    borderBottomRightRadius: isMe ? 3 : 12,
                    borderBottomLeftRadius: isMe ? 12 : 3,
                    border: `1px solid ${isMe ? 'transparent' : '#E2E8F0'}`,
                  }}>
                    {m.text}
                  </div>
                  <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2, textAlign: isMe ? 'right' : 'left' }}>
                    {m.timestamp}
                  </div>
                </div>
              </div>
            )
          })}

          {request.messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
              <div style={{ fontSize: 13 }}>Начните переписку</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick actions */}
        <div style={{ padding: '8px 14px', borderTop: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Быстрые шаблоны</div>
          {quickActions.map((q, i) => (
            <button
              key={i}
              onClick={() => setInputVal(q)}
              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 12, color: '#475569', cursor: 'pointer', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid #E2E8F0', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ flex: 1, padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 9, fontSize: 13, outline: 'none', background: '#F8FAFC' }}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={viewerRole === 'customer' ? 'Написать в штаб…' : 'Написать заказчику…'}
            />
            <button
              onClick={sendMessage}
              disabled={!inputVal.trim()}
              style={{
                width: 38, height: 38, borderRadius: 9, border: 'none', flexShrink: 0,
                background: inputVal.trim()
                  ? (viewerRole === 'customer' ? '#2563EB' : '#0E7490')
                  : '#CBD5E1',
                color: '#FFFFFF', fontSize: 16,
                cursor: inputVal.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >↑</button>
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 6, textAlign: 'center' }}>
            Сообщение привязано к заявке · видно обеим сторонам
          </div>
        </div>
      </div>
    </>
  )
}
