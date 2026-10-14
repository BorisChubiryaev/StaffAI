'use client'

import Link from 'next/link'
import { useDemoStore, DEMO_STEPS, STATUS_META } from '@/lib/demo-store'
import { RoleSelector } from '@/components/RoleSelector'
import { DemoChecklist } from '@/components/WorkflowStepper'
import { useRouter } from 'next/navigation'

const WORKFLOW_STEPS = [
  { icon: '💬', label: 'Сбор запроса AI',         desc: 'Заказчик описывает потребность, AI структурирует запрос' },
  { icon: '✅', label: 'Подтверждение запроса',    desc: 'Заказчик проверяет структурированный запрос' },
  { icon: '🔍', label: 'Проверка штабом',          desc: 'Штаб получает enriched request, уточняет пробелы' },
  { icon: '📋', label: 'Epic/Story в СберТрек',    desc: 'Система создаёт backlog-артефакт без повторного ввода' },
  { icon: '🏢', label: 'Выбор подрядчика',         desc: 'Штаб выбирает договор и вариант закрытия потребности' },
  { icon: '📄', label: 'Draft спецификации',       desc: 'Система формирует редактируемую спецификацию' },
  { icon: '⚙️', label: 'Config для ЛК',            desc: 'Система собирает параметры для ЗНР без повторного ввода' },
  { icon: '🏛️', label: 'Согласование в ЛК',       desc: 'Спецификация отправляется на маршрут согласования' },
]

export default function DemoHubPage() {
  const { state, setRole, resetDemo } = useDemoStore()
  const router = useRouter()
  const req = state.request

  const handleStartDemo = () => {
    setRole('customer')
    router.push('/customer/chat')
  }

  const handleContinueDemo = () => {
    const nextStep = DEMO_STEPS[state.demoStep]
    if (nextStep) {
      setRole(nextStep.role as 'customer' | 'staff' | 'admin')
      router.push(nextStep.path)
    }
  }

  const completedSteps = state.demoStep
  const totalSteps = DEMO_STEPS.length
  const sm = req ? (STATUS_META[req.status] ?? STATUS_META['submitted_to_staff']) : null
  const isDone = state.isDemoCompleted

  return (
    <div className="min-h-screen" style={{ background: '#F6F8FB' }}>

      {/* Top bar */}
      <header className="bg-white border-b border-slate-200" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #2563EB, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
              ✦
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900">StaffAI</span>
              <span className="text-xs text-slate-400 ml-2">Demo v2.3</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <RoleSelector />
            <button
              onClick={resetDemo}
              className="text-xs text-slate-400 hover:text-slate-600 border border-slate-200 px-3 py-1 rounded-lg transition-colors"
            >
              ↺ Сбросить демо
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-3 gap-6">

          {/* Left: Hero + CTA */}
          <div className="col-span-2 space-y-6">
            {/* Hero card */}
            <div className="bg-white rounded-xl border border-slate-200 p-8" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
                style={{ background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE' }}>
                ✦ AI-assisted Operational Workflow Platform
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 mb-3 leading-tight">
                Привлечение IT-специалистов<br />
                <span style={{ color: '#2563EB' }}>без форм и переписки</span>
              </h1>
              <p className="text-slate-500 text-base mb-6 max-w-lg leading-relaxed">
                Заказчик один раз описывает потребность — AI превращает её в структурированный запрос, данные автоматически переиспользуются для Epic/Story, спецификации, config-файла и отправки в ЛК. Штаб управляет процессом, а не собирает данные вручную.
              </p>

              {/* Demo completed success panel */}
              {isDone && (
                <div style={{
                  marginBottom: 20, padding: '16px 20px',
                  background: 'linear-gradient(135deg, #F0FDF4, #ECFEFF)',
                  border: '1px solid #BBF7D0', borderRadius: 12,
                }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#14532D', marginBottom: 6 }}>
                    🎉 Демо-сценарий завершён!
                  </div>
                  <div style={{ fontSize: 13, color: '#166534', lineHeight: '1.6', marginBottom: 10 }}>
                    Заявка REQ-2026-00521 прошла полный путь:<br />
                    AI-интервью → Epic PAY-1842 в СберТрек → штаб → подрядчик → спецификация → ЛК (ЗНР-2026-00931)
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={resetDemo}
                      style={{ padding: '8px 18px', borderRadius: 7, background: '#16A34A', color: '#FFFFFF', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}
                    >
                      ↺ Сбросить и запустить снова
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                {!isDone && (
                  <button
                    onClick={handleStartDemo}
                    style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', padding: '10px 24px', borderRadius: 8, fontWeight: 700, color: '#FFFFFF', fontSize: 14, border: 'none', cursor: 'pointer' }}
                  >
                    ▶ Запустить демо-сценарий
                  </button>
                )}
                {!isDone && completedSteps > 0 && completedSteps < totalSteps && (
                  <button
                    onClick={handleContinueDemo}
                    style={{ padding: '10px 18px', borderRadius: 8, fontWeight: 600, color: '#2563EB', fontSize: 14, border: '1px solid #BFDBFE', background: '#EFF6FF', cursor: 'pointer' }}
                  >
                    → Продолжить (шаг {completedSteps + 1}/{totalSteps})
                  </button>
                )}
              </div>
            </div>

            {/* Workflow overview */}
            <div className="bg-white rounded-xl border border-slate-200 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">END-TO-END WORKFLOW</h2>
              <div className="grid grid-cols-4 gap-3">
                {WORKFLOW_STEPS.map((step, i) => (
                  <div key={i} style={{
                    padding: '12px 14px', borderRadius: 8,
                    background: '#F8FAFC', border: '1px solid #E2E8F0',
                    position: 'relative',
                  }}>
                    {i < WORKFLOW_STEPS.length - 1 && (
                      <div style={{ position: 'absolute', top: '50%', right: -10, transform: 'translateY(-50%)', fontSize: 12, color: '#CBD5E1', zIndex: 1 }}>→</div>
                    )}
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{step.icon}</div>
                    <div className="text-sm font-bold text-slate-800 mb-1">{step.label}</div>
                    <div className="text-xs text-slate-500 leading-relaxed">{step.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, padding: '10px 14px', background: '#F5F3FF', borderRadius: 8, border: '1px solid #DDD6FE', fontSize: 12, color: '#5B21B6' }}>
                ✦ Данные переиспользуются сквозь все шаги — заказчик вводит информацию один раз
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Demo scenario checklist */}
            <div className="bg-white rounded-xl border border-slate-200 p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <h2 className="text-sm font-bold text-slate-800 mb-1">Сценарий демо</h2>
              <p className="text-xs text-slate-400 mb-4">
                {isDone ? '✓ Завершён' : `${completedSteps}/${totalSteps} шагов`}
                {!isDone && ' · выполненные шаги кликабельны'}
              </p>
              <DemoChecklist demoStep={completedSteps} isDemoCompleted={isDone} />
            </div>

            {/* Role navigation */}
            <div className="bg-white rounded-xl border border-slate-200 p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Перейти как</h2>
              <div className="space-y-2">
                {[
                  { role: 'customer', label: 'Заказчик', icon: '👤', sub: 'AI-чат, Мои заявки', path: '/customer/chat', color: '#2563EB', bg: '#EFF6FF' },
                  { role: 'staff', label: 'Штаб', icon: '🎯', sub: 'Очередь, Рабочее место', path: '/staff/queue', color: '#0E7490', bg: '#F0FDFA' },
                  { role: 'admin', label: 'Администратор', icon: '⚙', sub: 'Шаблоны, Справочники', path: '/admin', color: '#7C3AED', bg: '#F5F3FF' },
                ].map(r => (
                  <Link
                    key={r.role}
                    href={r.path}
                    onClick={() => setRole(r.role as 'customer' | 'staff' | 'admin')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                      borderRadius: 8, border: `1px solid ${r.bg}`,
                      background: state.currentRole === r.role ? r.bg : '#F8FAFC',
                      textDecoration: 'none', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = r.bg)}
                    onMouseLeave={e => (e.currentTarget.style.background = state.currentRole === r.role ? r.bg : '#F8FAFC')}
                  >
                    <span style={{ fontSize: 20 }}>{r.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{r.label}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>{r.sub}</div>
                    </div>
                    <span style={{ marginLeft: 'auto', color: '#CBD5E1', fontSize: 14 }}>→</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Request status */}
            {req && sm && (
              <div className="bg-white rounded-xl border border-slate-200 p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Текущая заявка</div>
                <div className="text-sm font-bold text-slate-900 mb-1">{req.requestNumber}</div>
                <div className="text-xs text-slate-500 mb-3">{req.title}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: sm.color, background: sm.bg }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: sm.dot }} />
                  {sm.label}
                </div>
                {req.znrNumber && (
                  <div style={{ marginTop: 8, padding: '6px 10px', background: '#F0FDF4', borderRadius: 7, border: '1px solid #BBF7D0', fontSize: 12, color: '#14532D', fontWeight: 600 }}>
                    🏛️ {req.znrNumber} · На согласовании в ЛК
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
