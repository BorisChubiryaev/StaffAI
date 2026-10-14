'use client'

import { useState } from 'react'
import { DemoMessage } from '@/lib/types'

interface ChatPanelProps {
  messages: DemoMessage[]
  currentSender: 'customer' | 'staff'
  placeholder?: string
  onSend: (text: string) => void
  quickReplies?: { label: string; text: string }[]
}

const BUBBLE_COLORS = {
  customer: { bg: '#EFF6FF', border: '#BFDBFE', color: '#1E40AF' },
  staff:    { bg: '#F0FDFA', border: '#99F6E4', color: '#0E7490' },
  ai:       { bg: '#FFFFFF', border: '#E2E8F0', color: '#334155' },
  system:   { bg: '#F8FAFC', border: '#E2E8F0', color: '#64748B' },
}

const SENDER_LABEL: Record<string, string> = {
  customer: 'Заказчик', staff: 'Штаб', ai: 'AI-агент', system: 'Система',
}

export function ChatPanel({ messages, currentSender, placeholder, onSend, quickReplies }: ChatPanelProps) {
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (!input.trim()) return
    onSend(input)
    setInput('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map(msg => {
          const c = BUBBLE_COLORS[msg.sender] ?? BUBBLE_COLORS.ai
          const isOwn = msg.sender === currentSender
          return (
            <div key={msg.id} style={{ maxWidth: '88%', alignSelf: isOwn ? 'flex-end' : 'flex-start' }}>
              {!isOwn && (
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {SENDER_LABEL[msg.sender]}
                </div>
              )}
              <div style={{
                padding: '9px 13px', borderRadius: 10, fontSize: 13, lineHeight: '1.55',
                background: isOwn ? '#2563EB' : c.bg,
                border: `1px solid ${isOwn ? '#1D4ED8' : c.border}`,
                color: isOwn ? '#FFFFFF' : c.color,
                borderBottomRightRadius: isOwn ? 3 : 10,
                borderBottomLeftRadius: isOwn ? 10 : 3,
              }}>
                {msg.text}
              </div>
              <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2, textAlign: isOwn ? 'right' : 'left' }}>
                {msg.timestamp}
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick replies */}
      {quickReplies && quickReplies.length > 0 && (
        <div style={{ padding: '8px 16px', borderTop: '1px solid #F1F5F9', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {quickReplies.map((qr, i) => (
            <button
              key={i}
              onClick={() => setInput(qr.text)}
              style={{
                padding: '4px 10px', borderRadius: 6, border: '1px solid #E2E8F0',
                background: '#F8FAFC', fontSize: 12, color: '#475569', cursor: 'pointer',
              }}
            >
              {qr.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '12px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 8 }}>
        <input
          style={{
            flex: 1, padding: '8px 12px', border: '1px solid #E2E8F0',
            borderRadius: 8, fontSize: 13, background: '#F8FAFC', outline: 'none',
          }}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={placeholder ?? 'Написать сообщение…'}
          onFocus={e => (e.target.style.borderColor = '#93C5FD')}
          onBlur={e => (e.target.style.borderColor = '#E2E8F0')}
        />
        <button
          onClick={handleSend}
          style={{
            width: 36, height: 36, borderRadius: 8, border: 'none', flexShrink: 0,
            background: input.trim() ? '#2563EB' : '#CBD5E1',
            color: '#FFFFFF', fontSize: 14, cursor: input.trim() ? 'pointer' : 'default',
            transition: 'background 0.2s',
          }}
        >
          ↑
        </button>
      </div>
    </div>
  )
}
