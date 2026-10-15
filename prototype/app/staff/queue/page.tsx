'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDemoStore, STATUS_META } from '@/lib/demo-store'
import { RoleSelector } from '@/components/RoleSelector'

const QUEUE_MOCK = [
  { id: 'REQ-2026-00518', title: 'Разработчик мобильных приложений', customer: 'А. Смирнова', unit: 'Дирекция цифровых каналов', status: 'submitted_to_staff', created: '06.05.2026, 09:12', sla: '1 р.д.', urgent: false },
  { id: 'REQ-2026-00519', title: 'Data Science команда', customer: 'М. Волков', unit: 'Аналитика данных', status: 'staff_review', created: '06.05.2026, 14:30', sla: '2 р.д.', urgent: false },
  { id: 'REQ-2026-00520', title: 'Аудит безопасности', customer: 'Н. Козлова', unit: 'ИБ', status: 'contractor_selection', created: '07.05.2026, 08:00', sla: 'SLA нарушен', urgent: true },
]

export default function StaffQueuePage() {
  const { state, staffTakeOwnership } = useDemoStore()
  const router = useRouter()
  const req = state.request

  const handleTakeOwnership = () => {
    staffTakeOwnership()
    router.push('/staff/review')
  }

  const allRequests = req ? [
    {
      id: req.requestNumber,
      title: req.title,
      customer: req.customer.name,
      unit: req.customer.unit,
      status: req.status,
      created: req.createdAt,
      sla: req.sla ?? '2 р.д.',
      urgent: false,
      isDemo: true,
    },
    ...QUEUE_MOCK,
  ] : QUEUE_MOCK

  return (
    <div style={{ minHeight: '100vh', background: '#F6F8FB' }}>
      {/* Top bar */}
      <header style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: 'linear-gradient(135deg, #2563EB, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff' }}>✦</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>StaffAI</span>
          </Link>
          <span style={{ color: '#CBD5E1' }}>|</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>Очередь штаба</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <RoleSelector />
            <Link href="/" style={{ fontSize: 12, color: '#94A3B8', textDecoration: 'none', border: '1px solid #E2E8F0', padding: '4px 12px', borderRadius: 6 }}>← Хаб</Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'В очереди', value: allRequests.length, color: '#2563EB', bg: '#EFF6FF' },
            { label: 'Срочных', value: allRequests.filter(r => r.urgent).length, color: '#DC2626', bg: '#FEF2F2' },
            { label: 'На проверке', value: allRequests.filter(r => r.status === 'staff_review').length, color: '#0E7490', bg: '#F0FDFA' },
            { label: 'SLA нарушен', value: allRequests.filter(r => typeof r.sla === 'string' && r.sla.includes('нарушен')).length, color: '#D97706', bg: '#FFFBEB' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Queue table */}
        <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 160px 90px 120px 110px', gap: 0, padding: '10px 20px', borderBottom: '2px solid #F1F5F9', background: '#F8FAFC' }}>
            {['Заявка / Заказчик', 'Статус', 'Подразделение', 'SLA', 'Создана', 'Действие'].map((h, i) => (
              <div key={i} style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {allRequests.map((r, idx) => {
            const sm = STATUS_META[r.status] ?? STATUS_META['submitted_to_staff']
            const isDemo = (r as { isDemo?: boolean }).isDemo
            const canTake = isDemo && (r.status === 'submitted_to_staff' || r.status === 'staff_review')
            return (
              <div
                key={r.id}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 140px 160px 90px 120px 110px',
                  gap: 0, padding: '14px 20px',
                  borderBottom: idx < allRequests.length - 1 ? '1px solid #F1F5F9' : 'none',
                  background: isDemo ? '#FAFBFF' : '#FFFFFF',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFF')}
                onMouseLeave={e => (e.currentTarget.style.background = isDemo ? '#FAFBFF' : '#FFFFFF')}
              >
                {/* Title */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {r.urgent && <span style={{ fontSize: 10, fontWeight: 700, color: '#DC2626', background: '#FEE2E2', padding: '2px 6px', borderRadius: 4 }}>СРОЧНО</span>}
                    {isDemo && <span style={{ fontSize: 10, fontWeight: 700, color: '#7C3AED', background: '#F5F3FF', padding: '2px 6px', borderRadius: 4 }}>DEMO</span>}
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{r.title}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{r.id} · {r.customer}</div>
                </div>

                {/* Status */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, background: sm.bg, border: `1px solid ${sm.bg}`, fontSize: 11, fontWeight: 600, color: sm.color }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: sm.dot, flexShrink: 0 }} />
                    {sm.label}
                  </span>
                </div>

                {/* Unit */}
                <div style={{ fontSize: 12, color: '#475569', alignSelf: 'center' }}>{r.unit}</div>

                {/* SLA */}
                <div style={{ alignSelf: 'center' }}>
                  <span style={{
                    fontSize: 12, fontWeight: 600,
                    color: r.sla?.includes('нарушен') ? '#DC2626' : '#64748B',
                  }}>{r.sla}</span>
                </div>

                {/* Created */}
                <div style={{ fontSize: 12, color: '#94A3B8', alignSelf: 'center' }}>{r.created}</div>

                {/* Action */}
                <div style={{ alignSelf: 'center' }}>
                  {canTake ? (
                    <button
                      onClick={handleTakeOwnership}
                      style={{ padding: '7px 14px', borderRadius: 7, background: '#2563EB', color: '#FFFFFF', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}
                    >
                      Взять →
                    </button>
                  ) : isDemo ? (
                    <Link
                      href="/staff/review"
                      style={{ padding: '7px 14px', borderRadius: 7, background: '#EFF6FF', color: '#2563EB', fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}
                    >
                      Открыть →
                    </Link>
                  ) : (
                    <button style={{ padding: '7px 14px', borderRadius: 7, background: '#F1F5F9', color: '#94A3B8', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'not-allowed' }}>
                      Открыть
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {allRequests.length === 0 && (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94A3B8' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Очередь пуста</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Новые заявки появятся здесь автоматически</div>
            </div>
          )}
        </div>

        {/* Demo hint */}
        {req && (req.status === 'submitted_to_staff') && (
          <div style={{ marginTop: 16, padding: '14px 18px', background: '#EFF6FF', borderRadius: 10, border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 18 }}>💡</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1E40AF' }}>Демо-подсказка</div>
              <div style={{ fontSize: 12, color: '#2563EB', marginTop: 2 }}>Нажмите «Взять →» напротив {req.requestNumber}, чтобы перейти к рабочему месту штаба и продолжить сценарий.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
