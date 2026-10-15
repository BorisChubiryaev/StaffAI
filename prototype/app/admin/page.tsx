'use client'

import { useState } from 'react'
import Link from 'next/link'

const templates = [
  { id: 1, name: 'Полная команда разработки', desc: 'Команда полного цикла: backend, frontend, QA, DevOps, аналитика', roles: 6, used: 12, popular: true },
  { id: 2, name: 'Поддержка и сопровождение', desc: 'Небольшая команда для поддержки существующей системы', roles: 3, used: 8, popular: false },
  { id: 3, name: 'Команда Data Science', desc: 'Python-разработчики, Data Engineer, аналитики', roles: 4, used: 3, popular: false },
  { id: 4, name: 'DevOps и облако', desc: 'Специалисты по DevOps, SRE, Cloud-архитектура', roles: 3, used: 5, popular: false },
]

const references = [
  { name: 'Каталог ролей', icon: '👥', items: 28, updated: '05.05.2026', desc: 'Нормализованные роли и грейды' },
  { name: 'Каталог подрядчиков', icon: '🏢', items: 15, updated: '28.04.2026', desc: 'Активные договоры и рейтинги' },
  { name: 'Шаблоны договоров', icon: '📄', items: 8, updated: '20.03.2026', desc: 'Типовые договорные форматы' },
  { name: 'CI-коды проектов', icon: '🗂️', items: 156, updated: '01.05.2026', desc: 'Справочник центров инвестиций' },
]

const systemSettings = [
  { title: 'Настройки GigaChat AI', desc: 'Параметры модели, промпты, температура, фильтры', icon: '🤖', tag: 'API v2.1' },
  { title: 'Интеграции', desc: 'Jira/SberTrack, ЛК МИП, Kafka, бюджетная система', icon: '🔗', tag: '5 активных' },
  { title: 'Уведомления', desc: 'Email, Telegram-бот, push, настройки триггеров', icon: '🔔', tag: 'Настроено' },
  { title: 'Аудит и логи', desc: 'Полный журнал событий, трейсинг AI-решений', icon: '📋', tag: '30 дней' },
]

const stats = [
  { label: 'Заявок за месяц', value: '34', trend: '+12%', up: true },
  { label: 'Среднее время обработки', value: '2.1д', trend: '-18%', up: true },
  { label: 'Точность AI', value: '91%', trend: '+3%', up: true },
  { label: 'Активных подрядчиков', value: '15', trend: '0', up: null },
]

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState<'overview' | 'templates' | 'references' | 'settings'>('overview')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_editingTemplate, _setEditingTemplate] = useState<number | null>(null)

  const C = {
    page: { minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' as const },
    topbar: {
      background: '#FFFFFF', borderBottom: '1px solid #E2E8F0',
      padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      position: 'sticky' as const, top: 0, zIndex: 10, flexShrink: 0,
    },
    backBtn: {
      width: '36px', height: '36px', borderRadius: '8px', display: 'flex',
      alignItems: 'center', justifyContent: 'center', background: '#F1F5F9',
      fontSize: '16px', textDecoration: 'none', color: '#475569',
    },
    topTitle: { fontSize: '18px', fontWeight: '700', color: '#0F172A' },
    topSub: { fontSize: '13px', color: '#64748B', marginTop: '1px' },
    content: { display: 'flex', flex: 1 },
    sidebar: { width: '220px', background: '#FFFFFF', borderRight: '1px solid #E2E8F0', padding: '24px 12px', flexShrink: 0 },
    navLabel: { fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.8px', padding: '0 8px', marginBottom: '6px', marginTop: '16px' },
    navItem: (active: boolean) => ({
      display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px',
      fontSize: '13px', fontWeight: '500', cursor: 'pointer', marginBottom: '2px', border: 'none',
      background: active ? '#EFF6FF' : 'transparent',
      color: active ? '#1D4ED8' : '#475569',
      width: '100%', textAlign: 'left' as const,
    }),
    main: { flex: 1, padding: '32px', overflowY: 'auto' as const },
    sectionTitle: { fontSize: '22px', fontWeight: '800', color: '#0F172A', marginBottom: '6px' },
    sectionSub: { fontSize: '14px', color: '#64748B', marginBottom: '28px' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' },
    statCard: { background: '#FFFFFF', borderRadius: '12px', padding: '18px 20px', border: '1px solid #E2E8F0' },
    statVal: { fontSize: '28px', fontWeight: '800', color: '#0F172A', lineHeight: 1 },
    statLabel: { fontSize: '12px', color: '#64748B', marginTop: '4px' },
    statTrend: (up: boolean | null) => ({ fontSize: '12px', fontWeight: '600', color: up === true ? '#16A34A' : up === false ? '#DC2626' : '#94A3B8', marginTop: '2px' }),
    grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' },
    card: { background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
    cardTitle: { fontSize: '15px', fontWeight: '700', color: '#0F172A', marginBottom: '4px' },
    cardDesc: { fontSize: '13px', color: '#64748B', marginBottom: '16px', lineHeight: '1.5' },
    cardMeta: { display: 'flex', gap: '16px' },
    metaItem: { fontSize: '12px', color: '#64748B' },
    metaVal: { fontWeight: '700', color: '#0F172A' },
    popularBadge: { padding: '3px 8px', borderRadius: '4px', background: '#FEF3C7', color: '#92400E', fontSize: '11px', fontWeight: '600', display: 'inline-flex' },
    cardActions: { display: 'flex', gap: '8px', marginTop: '14px' },
    btnEdit: { padding: '6px 14px', borderRadius: '6px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '12px', fontWeight: '500', color: '#475569', cursor: 'pointer' },
    btnUse: { padding: '6px 14px', borderRadius: '6px', background: '#EFF6FF', border: '1px solid #BFDBFE', fontSize: '12px', fontWeight: '600', color: '#1D4ED8', cursor: 'pointer' },
    newBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', background: '#2563EB', color: '#FFFFFF', fontSize: '13px', fontWeight: '600', cursor: 'pointer', border: 'none' },
    refCard: { background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '14px' },
    refIcon: { width: '44px', height: '44px', borderRadius: '10px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 },
    refTitle: { fontSize: '14px', fontWeight: '700', color: '#0F172A', marginBottom: '2px' },
    refDesc: { fontSize: '12px', color: '#64748B' },
    refMeta: { fontSize: '12px', color: '#94A3B8', marginTop: '6px' },
    sysCard: { background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '10px' },
    sysIcon: { fontSize: '24px', width: '44px', height: '44px', borderRadius: '10px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    sysTag: { padding: '3px 8px', borderRadius: '4px', background: '#F0FDF4', color: '#14532D', fontSize: '11px', fontWeight: '600', marginLeft: 'auto', flexShrink: 0 },
    configBtn: { padding: '7px 14px', borderRadius: '6px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '12px', fontWeight: '500', color: '#475569', cursor: 'pointer', flexShrink: 0 },
    toastBox: { position: 'fixed' as const, bottom: '24px', right: '24px', background: '#0F172A', color: '#F8FAFC', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 99 },
  }

  const navItems = [
    { key: 'overview', icon: '📊', label: 'Обзор' },
    { key: 'templates', icon: '📝', label: 'Шаблоны запросов' },
    { key: 'references', icon: '🗂️', label: 'Справочники' },
    { key: 'settings', icon: '⚙️', label: 'Настройки системы' },
  ]

  return (
    <div style={C.page}>
      {/* Topbar */}
      <header style={C.topbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/" style={C.backBtn}>←</Link>
          <div>
            <div style={C.topTitle}>Администрирование</div>
            <div style={C.topSub}>StaffAI Platform · Управление системой</div>
          </div>
        </div>
        <div style={{ padding: '4px 12px', borderRadius: '6px', background: '#F0FDF4', border: '1px solid #BBF7D0', fontSize: '12px', color: '#14532D', fontWeight: '600' }}>
          ● Система в норме
        </div>
      </header>

      <div style={C.content}>
        {/* Sidebar */}
        <nav style={C.sidebar}>
          <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600', padding: '0 8px', marginBottom: '12px' }}>
            МЕНЮ
          </div>
          {navItems.map(item => (
            <button key={item.key} style={C.navItem(activeSection === item.key)} onClick={() => setActiveSection(item.key as typeof activeSection)}>
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div style={{ marginTop: '24px', padding: '14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Версия</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>StaffAI 2.0</div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>GigaChat AI v2.1</div>
          </div>
        </nav>

        {/* Main content */}
        <main style={C.main}>

          {/* Overview */}
          {activeSection === 'overview' && (
            <>
              <div style={C.sectionTitle}>Обзор системы</div>
              <div style={C.sectionSub}>Ключевые метрики платформы за последние 30 дней</div>

              <div style={C.statsGrid}>
                {stats.map(s => (
                  <div key={s.label} style={C.statCard}>
                    <div style={C.statVal}>{s.value}</div>
                    <div style={C.statLabel}>{s.label}</div>
                    {s.trend !== '0' && <div style={C.statTrend(s.up)}>{s.trend} vs прошлый месяц</div>}
                  </div>
                ))}
              </div>

              <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px', marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', marginBottom: '16px' }}>Статусы активных заявок</div>
                {[
                  { label: 'AI-диалог / ожидание ввода', count: 2, color: '#7C3AED' },
                  { label: 'Ожидает подтверждения заказчика', count: 3, color: '#D97706' },
                  { label: 'На проверке штаба', count: 8, color: '#2563EB' },
                  { label: 'Выбор подрядчика', count: 5, color: '#0EA5E9' },
                  { label: 'Подготовка спецификации', count: 4, color: '#10B981' },
                  { label: 'Согласование заказчиком', count: 7, color: '#F59E0B' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <div style={{ fontSize: '13px', color: '#475569', width: '260px', flexShrink: 0 }}>{item.label}</div>
                    <div style={{ flex: 1, height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(item.count / 34) * 100}%`, background: item.color, borderRadius: '3px' }} />
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', width: '24px', textAlign: 'right' }}>{item.count}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Templates */}
          {activeSection === 'templates' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                <div>
                  <div style={C.sectionTitle}>Шаблоны запросов</div>
                  <div style={{ fontSize: '14px', color: '#64748B' }}>Предустановленные конфигурации команд для быстрого старта</div>
                </div>
                <button style={C.newBtn}>+ Создать шаблон</button>
              </div>
              <div style={C.grid}>
                {templates.map(t => (
                  <div key={t.id} style={C.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={C.cardTitle}>{t.name}</div>
                      {t.popular && <span style={C.popularBadge}>🔥 Популярный</span>}
                    </div>
                    <div style={C.cardDesc}>{t.desc}</div>
                    <div style={C.cardMeta}>
                      <div style={C.metaItem}>
                        Ролей: <span style={C.metaVal}>{t.roles}</span>
                      </div>
                      <div style={C.metaItem}>
                        Использований: <span style={C.metaVal}>{t.used}</span>
                      </div>
                    </div>
                    <div style={C.cardActions}>
                      <button style={C.btnEdit}>✏️ Редактировать</button>
                      <button style={C.btnUse}>Использовать →</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* References */}
          {activeSection === 'references' && (
            <>
              <div style={C.sectionTitle}>Справочники</div>
              <div style={C.sectionSub}>Управление нормативными данными системы</div>
              <div style={C.grid}>
                {references.map((r, i) => (
                  <div key={i} style={C.refCard}>
                    <div style={C.refIcon}>{r.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={C.refTitle}>{r.name}</div>
                      <div style={C.refDesc}>{r.desc}</div>
                      <div style={C.refMeta}>
                        {r.items} записей · Обновлено: {r.updated}
                      </div>
                      <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                        <button style={C.btnEdit}>Просмотр</button>
                        <button style={C.btnUse}>Редактировать</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Settings */}
          {activeSection === 'settings' && (
            <>
              <div style={C.sectionTitle}>Настройки системы</div>
              <div style={C.sectionSub}>Конфигурация AI, интеграций и уведомлений</div>
              {systemSettings.map((s, i) => (
                <div key={i} style={C.sysCard}>
                  <div style={C.sysIcon}>{s.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>{s.title}</div>
                    <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>{s.desc}</div>
                  </div>
                  <div style={C.sysTag}>{s.tag}</div>
                  <button style={C.configBtn}>Настроить</button>
                </div>
              ))}

              <div style={{ marginTop: '24px', padding: '16px 20px', background: '#FFF7ED', borderRadius: '10px', border: '1px solid #FED7AA' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#9A3412', marginBottom: '6px' }}>⚠️ Опасная зона</div>
                <div style={{ fontSize: '12px', color: '#7C2D12', marginBottom: '12px' }}>
                  Следующие операции необратимы и требуют подтверждения
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={{ padding: '7px 14px', borderRadius: '6px', border: '1px solid #FCA5A5', background: '#FEF2F2', fontSize: '12px', fontWeight: '500', color: '#DC2626', cursor: 'pointer' }}>
                    Очистить кэш AI
                  </button>
                  <button style={{ padding: '7px 14px', borderRadius: '6px', border: '1px solid #FCA5A5', background: '#FEF2F2', fontSize: '12px', fontWeight: '500', color: '#DC2626', cursor: 'pointer' }}>
                    Сбросить промпты
                  </button>
                </div>
              </div>
            </>
          )}

        </main>
      </div>
    </div>
  )
}
