'use client'

import { useState } from 'react'
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, ShadingType,
} from 'docx'
import { SpecificationDraft, StaffingRequest, BacklogStory } from '@/lib/types'
import { useDemoStore, DEFAULT_STORIES } from '@/lib/demo-store'

interface Props {
  request: StaffingRequest
  onClose: () => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type SectionId =
  | 'requisites' | 'subject' | 'team' | 'func_req' | 'non_func'
  | 'stages' | 'cost' | 'payment' | 'defects' | 'responsible' | 'other' | 'signatures' | 'stories'

const SECTIONS: { id: SectionId; num: number; label: string; short: string }[] = [
  { id: 'requisites',  num: 1,  label: 'Реквизиты спецификации',               short: '1. Реквизиты' },
  { id: 'subject',     num: 2,  label: 'Предмет спецификации',                  short: '2. Предмет' },
  { id: 'team',        num: 3,  label: 'Состав проектной команды',              short: '3. Команда' },
  { id: 'func_req',    num: 4,  label: 'Функциональные требования',             short: '4. Функц. треб.' },
  { id: 'non_func',    num: 5,  label: 'Нефункциональные требования',           short: '5. НФТ' },
  { id: 'stages',      num: 6,  label: 'Этапы работ',                           short: '6. Этапы' },
  { id: 'cost',        num: 7,  label: 'Стоимость работ',                       short: '7. Стоимость' },
  { id: 'payment',     num: 8,  label: 'График платежей',                       short: '8. Платежи' },
  { id: 'defects',     num: 9,  label: 'Сроки устранения дефектов',             short: '9. Дефекты' },
  { id: 'responsible', num: 10, label: 'Ответственные лица',                    short: '10. Ответств.' },
  { id: 'other',       num: 11, label: 'Иные условия',                          short: '11. Иные усл.' },
  { id: 'signatures',  num: 12, label: 'Подписи сторон',                        short: '12. Подписи' },
  { id: 'stories',     num: 13, label: 'Задачи СберТрек (Story)',               short: '13. СберТрек' },
]

type BadgeType = 'ai' | 'needs_check' | 'verified'
const BADGES: Record<BadgeType, { label: string; color: string; bg: string; border: string }> = {
  ai:          { label: '✦ AI заполнено',        color: '#5B21B6', bg: '#F5F3FF', border: '#DDD6FE' },
  needs_check: { label: '⚠ Требует проверки',    color: '#92400E', bg: '#FFFBEB', border: '#FDE68A' },
  verified:    { label: '✓ Проверено штабом',    color: '#14532D', bg: '#F0FDF4', border: '#BBF7D0' },
}

// Section → default badge (can be overridden by user)
const SECTION_BADGE_DEFAULTS: Record<SectionId, BadgeType> = {
  requisites:  'ai',
  subject:     'ai',
  team:        'ai',
  func_req:    'ai',
  non_func:    'ai',
  stages:      'needs_check',
  cost:        'needs_check',
  payment:     'needs_check',
  defects:     'ai',
  responsible: 'needs_check',
  other:       'ai',
  signatures:  'needs_check',
  stories:     'ai',
}

function Badge({ type }: { type: BadgeType }) {
  const b = BADGES[type]
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
      color: b.color, background: b.bg, border: `1px solid ${b.border}`,
    }}>
      {b.label}
    </span>
  )
}

// ─── Inline editable field ───────────────────────────────────────────────────

function EditableField({
  label, value, fieldPath, multiline = false,
  onSave,
}: {
  label: string
  value: string
  fieldPath: string
  multiline?: boolean
  onSave: (path: string, val: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
        {label}
      </div>
      {editing ? (
        <div>
          {multiline ? (
            <textarea
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={4}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '2px solid #2563EB', fontSize: 13, color: '#0F172A', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
            />
          ) : (
            <input
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '2px solid #2563EB', fontSize: 13, color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
            />
          )}
          <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
            <button onClick={() => { onSave(fieldPath, draft); setEditing(false) }} style={{ padding: '5px 12px', borderRadius: 6, background: '#2563EB', color: '#FFFFFF', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}>Сохранить</button>
            <button onClick={() => { setDraft(value); setEditing(false) }} style={{ padding: '5px 10px', borderRadius: 6, background: '#F1F5F9', color: '#475569', fontSize: 12, border: 'none', cursor: 'pointer' }}>Отмена</button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setEditing(true)}
          title="Нажмите для редактирования"
          style={{
            padding: '8px 12px', borderRadius: 7, border: '1px solid #E2E8F0', background: '#FAFAFA',
            fontSize: 13, color: '#0F172A', cursor: 'text', minHeight: 36,
            whiteSpace: multiline ? 'pre-wrap' : undefined,
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#2563EB')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
        >
          {value || <span style={{ color: '#CBD5E1', fontStyle: 'italic' }}>Нажмите для ввода…</span>}
        </div>
      )}
    </div>
  )
}

// ─── Editable table cell ─────────────────────────────────────────────────────

function EditableCell({
  value, section, rowIdx, colKey, onSave,
}: {
  value: string
  section: string
  rowIdx: number
  colKey: string
  onSave: (section: string, rowIdx: number, colKey: string, val: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  if (editing) {
    return (
      <td style={{ padding: 0, verticalAlign: 'top' }}>
        <textarea
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={() => { onSave(section, rowIdx, colKey, draft); setEditing(false) }}
          onKeyDown={e => { if (e.key === 'Escape') { setDraft(value); setEditing(false) } }}
          rows={2}
          style={{
            width: '100%', padding: '6px 8px', border: '2px solid #2563EB',
            fontSize: 12, color: '#0F172A', resize: 'none', outline: 'none',
            boxSizing: 'border-box', background: '#EFF6FF',
          }}
        />
      </td>
    )
  }
  return (
    <td
      onClick={() => { setDraft(value); setEditing(true) }}
      title="Нажмите для редактирования"
      style={{
        padding: '8px 10px', fontSize: 12, color: '#0F172A',
        cursor: 'text', verticalAlign: 'top', borderBottom: '1px solid #F1F5F9',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
      onMouseLeave={e => (e.currentTarget.style.background = '')}
    >
      {value || <span style={{ color: '#CBD5E1' }}>—</span>}
    </td>
  )
}

// ─── Story badge pill ────────────────────────────────────────────────────────

function StoryPill({ storyKey, url }: { storyKey: string; url?: string }) {
  return (
    <a
      href={url ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => !url && e.preventDefault()}
      style={{
        display: 'inline-block', padding: '2px 8px', borderRadius: 4,
        background: '#ECFEFF', border: '1px solid #A5F3FC',
        fontSize: 11, fontWeight: 700, color: '#0E7490', textDecoration: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {storyKey}
    </a>
  )
}

// ─── DOCX Export ─────────────────────────────────────────────────────────────

function makeDocxTable(headers: string[], rows: string[][], colWidths?: number[]) {
  const hRow = new TableRow({
    children: headers.map((h, i) => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20 })] })],
      width: colWidths ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
      shading: { type: ShadingType.SOLID, color: 'EFF6FF', fill: 'EFF6FF' },
    })),
    tableHeader: true,
  })
  const dataRows = rows.map(row => new TableRow({
    children: row.map(cell => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20 })] })],
    })),
  }))
  return new Table({ rows: [hRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } })
}

async function exportDocx(spec: SpecificationDraft, requestNumber: string, stories: BacklogStory[]) {
  const h2 = (text: string) => new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } })
  const body = (text: string, bold = false) => new Paragraph({ children: [new TextRun({ text, bold, size: 22 })], spacing: { after: 60 } })
  const lv = (label: string, value: string) => new Paragraph({
    children: [new TextRun({ text: label + ': ', bold: true, size: 22 }), new TextRun({ text: value, size: 22 })],
    spacing: { after: 60 },
  })

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun({ text: `СПЕЦИФИКАЦИЯ № ${spec.number}`, bold: true, size: 36, color: '1E40AF' })],
          heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, spacing: { after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `к Договору ${spec.contract} от ${spec.date}`, size: 22, italics: true })],
          alignment: AlignmentType.CENTER, spacing: { after: 400 },
        }),

        // 1. Реквизиты
        h2('1. Реквизиты спецификации'),
        lv('Номер', spec.number), lv('Дата', spec.date), lv('Договор', spec.contract),
        lv('Заказчик', spec.customerName), lv('Подразделение', spec.customerUnit),
        lv('Исполнитель', spec.contractorName), lv('Договор исполнителя', spec.contractorContract),

        // 2. Предмет
        h2('2. Предмет спецификации'),
        body(spec.subject, true), body(spec.description),
        lv('Epic в ' + spec.epicSystem, spec.epicRef),

        // 3. Состав команды
        h2('3. Состав проектной команды'),
        makeDocxTable(
          ['Роль', 'Уровень', 'Кол-во', 'Дата старта'],
          spec.specialists.map(s => [s.role, s.level, `${s.count}`, s.startDate]),
          [45, 20, 12, 23]
        ),
        new Paragraph({ spacing: { after: 200 } }),

        // 4. Функциональные требования
        h2('4. Функциональные требования'),
        makeDocxTable(
          ['ID', 'Описание', 'Приоритет', 'Story'],
          spec.functionalRequirements.map(f => [f.id, f.description, f.priority, f.epicRef]),
          [10, 55, 15, 20]
        ),
        new Paragraph({ spacing: { after: 200 } }),

        // 5. Нефункциональные требования
        h2('5. Нефункциональные требования'),
        ...spec.nonFunctionalRequirements.map((r, i) => body(`${i + 1}. ${r}`)),

        // 6. Этапы работ
        h2('6. Этапы работ'),
        makeDocxTable(
          ['Этап', 'Описание', 'Начало', 'Конец', 'Роли', 'Story'],
          spec.stages.map(s => [s.name, s.description, s.startDate, s.endDate, s.roles.join(', '), s.storyKey ?? '']),
          [16, 25, 10, 10, 28, 11]
        ),
        new Paragraph({ spacing: { after: 200 } }),

        // 7. Стоимость
        h2('7. Стоимость работ'),
        makeDocxTable(
          ['Этап', 'Роль / Специалист', 'Чел/дн', 'Ставка, ₽/дн', 'Сумма, ₽'],
          [
            ...spec.costTable.map(r => [r.stage, r.role, `${r.days}`, `${r.rate.toLocaleString('ru')}`, `${r.total.toLocaleString('ru')}`]),
            ['', 'ИТОГО', '', '', `${spec.totalCost.toLocaleString('ru')}`],
          ],
          [15, 38, 10, 15, 22]
        ),
        new Paragraph({ spacing: { after: 200 } }),

        // 8. График платежей
        h2('8. График платежей'),
        spec.paymentSchedule && spec.paymentSchedule.length > 0
          ? makeDocxTable(
              ['№', 'Наименование платежа', 'Дата', 'Сумма, ₽', 'Основание'],
              spec.paymentSchedule.map(p => [`${p.num}`, p.name, p.date, `${p.amount.toLocaleString('ru')}`, p.basis]),
              [5, 35, 15, 20, 25]
            )
          : body('График платежей определяется в соответствии с договором.'),
        new Paragraph({ spacing: { after: 200 } }),

        // 9. Сроки дефектов
        h2('9. Сроки устранения дефектов'),
        lv('Критические', spec.defectDeadlines.critical),
        lv('Высокие', spec.defectDeadlines.high),
        lv('Средние', spec.defectDeadlines.medium),
        lv('Незначительные', spec.defectDeadlines.low),

        // 10. Ответственные
        h2('10. Ответственные лица'),
        lv('Ответственный заказчика', `${spec.responsibleCustomer}${spec.responsibleCustomerTitle ? ', ' + spec.responsibleCustomerTitle : ''}`),
        lv('Email заказчика', spec.responsibleCustomerEmail ?? ''),
        lv('Ответственный исполнителя', `${spec.responsibleContractor}${spec.responsibleContractorTitle ? ', ' + spec.responsibleContractorTitle : ''}`),
        lv('Email исполнителя', spec.responsibleContractorEmail ?? ''),

        // 11. Иные условия
        h2('11. Иные условия'),
        body(spec.otherConditions ?? 'Иные условия определяются договором.'),

        // 12. Подписи
        h2('12. Подписи сторон'),
        new Paragraph({ spacing: { before: 400 } }),
        new Paragraph({
          children: [new TextRun({ text: 'Заказчик: ________________________________  ', size: 22 }), new TextRun({ text: spec.responsibleCustomer, size: 22, bold: true })],
          spacing: { after: 240 },
        }),
        new Paragraph({
          children: [new TextRun({ text: 'Исполнитель: _____________________________  ', size: 22 }), new TextRun({ text: spec.responsibleContractor, size: 22, bold: true })],
          spacing: { after: 240 },
        }),
        new Paragraph({ children: [new TextRun({ text: 'Дата: _______________________________', size: 22 })] }),

        // 13. Приложение — Stories
        h2('13. Задачи СберТрек (Story)'),
        makeDocxTable(
          ['Ключ', 'Название', 'Этап', 'Начало', 'Конец', 'Приоритет'],
          stories.map(s => [s.key, s.title, s.stage, s.plannedStart, s.plannedEnd, s.priority]),
          [14, 36, 12, 12, 12, 14]
        ),
        new Paragraph({ spacing: { after: 200 } }),

        // Footer
        new Paragraph({
          children: [new TextRun({ text: `Документ сформирован автоматически · Источник: ${requestNumber} · StaffAI v2.3`, size: 18, color: '94A3B8', italics: true })],
          alignment: AlignmentType.CENTER, spacing: { before: 600 },
        }),
      ],
    }],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${spec.number}_${requestNumber}.docx`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── SpecificationEditor ─────────────────────────────────────────────────────

export function SpecificationEditor({ request, onClose }: Props) {
  const { updateSpecField, updateSpecTableCell } = useDemoStore()
  const spec = request.specificationDraft

  const [activeSection, setActiveSection] = useState<SectionId>('requisites')
  const [badgeOverrides, setBadgeOverrides] = useState<Partial<Record<SectionId, BadgeType>>>({})
  const [toast, setToast] = useState('')
  const [exporting, setExporting] = useState(false)

  const stories: BacklogStory[] = request.backlog?.stories ?? DEFAULT_STORIES

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const handleSaveField = (path: string, val: string) => {
    updateSpecField(path, val)
    showToast('Изменение сохранено')
  }

  const handleSaveCell = (section: string, rowIdx: number, colKey: string, val: string) => {
    updateSpecTableCell(section, rowIdx, colKey, val)
    showToast('Ячейка обновлена')
  }

  const handleExport = async () => {
    if (!spec) return
    setExporting(true)
    try {
      await exportDocx(spec, request.requestNumber, stories)
      showToast('DOCX скачан ✓')
    } finally {
      setExporting(false)
    }
  }

  const cycleBadge = (sectionId: SectionId) => {
    const current = badgeOverrides[sectionId] ?? SECTION_BADGE_DEFAULTS[sectionId]
    const cycle: BadgeType[] = ['ai', 'needs_check', 'verified']
    const next = cycle[(cycle.indexOf(current) + 1) % cycle.length]
    setBadgeOverrides(prev => ({ ...prev, [sectionId]: next }))
  }

  const getBadge = (sectionId: SectionId): BadgeType =>
    badgeOverrides[sectionId] ?? SECTION_BADGE_DEFAULTS[sectionId]

  const curSection = SECTIONS.find(s => s.id === activeSection)!

  if (!spec) {
    return (
      <>
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000 }} />
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          background: '#FFFFFF', borderRadius: 16, padding: 40, zIndex: 3001, textAlign: 'center', maxWidth: 400,
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Черновик не сформирован</div>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>Нажмите «Сформировать черновик спецификации» в рабочем месте штаба.</div>
          <button onClick={onClose} style={{ padding: '9px 24px', borderRadius: 8, background: '#2563EB', color: '#FFFFFF', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>Закрыть</button>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 3000 }} />

      {/* Full-screen editor */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 3001,
        display: 'flex', flexDirection: 'column',
        background: '#F8FAFC',
        overflow: 'hidden',
      }}>

        {/* ── Header bar ── */}
        <div style={{
          height: 56, background: '#FFFFFF', borderBottom: '1px solid #E2E8F0',
          display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <span style={{ fontSize: 18 }}>📄</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                Спецификация {spec.number}
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>
                к Договору {spec.contract} · {spec.customerName} · {spec.contractorName}
              </div>
            </div>
            <span style={{ marginLeft: 8, padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' }}>
              ЧЕРНОВИК
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: '#64748B' }}>
              Итого: <strong style={{ color: '#0F172A' }}>{spec.totalCost.toLocaleString('ru')} ₽</strong>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                background: exporting ? '#CBD5E1' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                color: '#FFFFFF', border: 'none', cursor: exporting ? 'default' : 'pointer',
                boxShadow: exporting ? 'none' : '0 2px 6px rgba(37,99,235,0.3)',
              }}
            >
              {exporting ? '⟳ Генерация…' : '⬇ Скачать DOCX'}
            </button>
            <button
              onClick={onClose}
              style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: '#F1F5F9', color: '#64748B', cursor: 'pointer', fontSize: 18 }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Body: left nav + content ── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left nav */}
          <div style={{
            width: 220, background: '#FFFFFF', borderRight: '1px solid #E2E8F0',
            display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0,
          }}>
            <div style={{ padding: '14px 12px 6px', fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Разделы
            </div>
            {SECTIONS.map(s => {
              const isActive = activeSection === s.id
              const badge = getBadge(s.id)
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  style={{
                    width: '100%', padding: '9px 12px', textAlign: 'left', border: 'none',
                    background: isActive ? '#EFF6FF' : 'transparent',
                    borderLeft: `3px solid ${isActive ? '#2563EB' : 'transparent'}`,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? '#1E40AF' : '#475569' }}>
                    {s.short}
                  </div>
                  <div style={{ marginTop: 2 }}>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                      color: BADGES[badge].color, background: BADGES[badge].bg,
                    }}>
                      {BADGES[badge].label}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Content area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>

              {/* Section header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {curSection.num}. {curSection.label}
                </h2>
                <button
                  onClick={() => cycleBadge(activeSection)}
                  title="Нажмите для смены статуса"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <Badge type={getBadge(activeSection)} />
                </button>
              </div>

              {/* ── Section content ── */}

              {activeSection === 'requisites' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <EditableField label="Номер спецификации" value={spec.number} fieldPath="number" onSave={handleSaveField} />
                  <EditableField label="Дата" value={spec.date} fieldPath="date" onSave={handleSaveField} />
                  <EditableField label="Договор (основание)" value={spec.contract} fieldPath="contract" onSave={handleSaveField} />
                  <EditableField label="Договор исполнителя" value={spec.contractorContract} fieldPath="contractorContract" onSave={handleSaveField} />
                  <EditableField label="Заказчик" value={spec.customerName} fieldPath="customerName" onSave={handleSaveField} />
                  <EditableField label="Подразделение заказчика" value={spec.customerUnit} fieldPath="customerUnit" onSave={handleSaveField} />
                  <EditableField label="Исполнитель" value={spec.contractorName} fieldPath="contractorName" onSave={handleSaveField} />
                  <div style={{ padding: '10px 12px', borderRadius: 7, border: '1px solid #BBF7D0', background: '#F0FDF4', fontSize: 13, color: '#14532D', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 700 }}>Статус:</span> ЧЕРНОВИК
                  </div>
                </div>
              )}

              {activeSection === 'subject' && (
                <div>
                  <EditableField label="Предмет спецификации" value={spec.subject} fieldPath="subject" onSave={handleSaveField} />
                  <EditableField label="Описание" value={spec.description} fieldPath="description" multiline onSave={handleSaveField} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                    <EditableField label="Epic в трекере" value={spec.epicRef} fieldPath="epicRef" onSave={handleSaveField} />
                    <EditableField label="Система" value={spec.epicSystem} fieldPath="epicSystem" onSave={handleSaveField} />
                  </div>
                  <div style={{ marginTop: 16, padding: '10px 14px', background: '#ECFEFF', borderRadius: 8, border: '1px solid #A5F3FC', fontSize: 12, color: '#0E7490' }}>
                    🔗 СберТрек: <strong>{spec.epicRef}</strong> · <a href="https://sbertrack.example/SBT-28491" target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB' }}>Открыть →</a>
                  </div>
                </div>
              )}

              {activeSection === 'team' && (
                <div>
                  <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#EFF6FF' }}>
                          {['Роль / Специалист', 'Уровень', 'Кол-во', 'Дата старта'].map(h => (
                            <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#1E40AF', borderBottom: '2px solid #BFDBFE', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {spec.specialists.map((s, i) => (
                          <tr key={i}>
                            <EditableCell value={s.role}      section="specialists" rowIdx={i} colKey="role"      onSave={handleSaveCell} />
                            <EditableCell value={s.level}     section="specialists" rowIdx={i} colKey="level"     onSave={handleSaveCell} />
                            <EditableCell value={`${s.count}`} section="specialists" rowIdx={i} colKey="count"   onSave={handleSaveCell} />
                            <EditableCell value={s.startDate} section="specialists" rowIdx={i} colKey="startDate" onSave={handleSaveCell} />
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ borderTop: '2px solid #E2E8F0', background: '#F8FAFC' }}>
                          <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Итого</td>
                          <td />
                          <td style={{ padding: '10px 12px', fontSize: 14, fontWeight: 800, color: '#2563EB' }}>
                            {spec.specialists.reduce((s, m) => s + m.count, 0)} чел.
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {activeSection === 'func_req' && (
                <div>
                  <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#EFF6FF' }}>
                          {['ID', 'Описание требования', 'Приоритет', 'Epic / Story'].map(h => (
                            <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#1E40AF', borderBottom: '2px solid #BFDBFE' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {spec.functionalRequirements.map((f, i) => {
                          const story = stories.find(s => s.key === f.epicRef)
                          return (
                            <tr key={i}>
                              <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, color: '#475569', whiteSpace: 'nowrap', borderBottom: '1px solid #F1F5F9', verticalAlign: 'top' }}>{f.id}</td>
                              <EditableCell value={f.description} section="functionalRequirements" rowIdx={i} colKey="description" onSave={handleSaveCell} />
                              <td style={{ padding: '8px 10px', fontSize: 11, verticalAlign: 'top', borderBottom: '1px solid #F1F5F9' }}>
                                <span style={{
                                  padding: '2px 7px', borderRadius: 4, fontWeight: 700,
                                  background: f.priority === 'critical' ? '#FEF2F2' : f.priority === 'high' ? '#FFFBEB' : '#F1F5F9',
                                  color: f.priority === 'critical' ? '#DC2626' : f.priority === 'high' ? '#D97706' : '#64748B',
                                }}>
                                  {f.priority === 'critical' ? 'Критично' : f.priority === 'high' ? 'Важно' : 'Средне'}
                                </span>
                              </td>
                              <td style={{ padding: '8px 10px', verticalAlign: 'top', borderBottom: '1px solid #F1F5F9' }}>
                                {story
                                  ? <StoryPill storyKey={story.key} url={story.url} />
                                  : <span style={{ fontSize: 11, color: '#94A3B8' }}>{f.epicRef}</span>
                                }
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeSection === 'non_func' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {spec.nonFunctionalRequirements.map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', background: '#FFFFFF', borderRadius: 9, border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', minWidth: 24, flexShrink: 0 }}>{i + 1}.</span>
                      <span style={{ fontSize: 13, color: '#0F172A' }}>{r}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeSection === 'stages' && (
                <div>
                  <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#EFF6FF' }}>
                          {['Этап', 'Описание', 'Начало', 'Конец', 'Роли', 'Story', 'Сдача'].map(h => (
                            <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#1E40AF', borderBottom: '2px solid #BFDBFE', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {spec.stages.map((s, i) => {
                          const story = stories.find(st => st.key === s.storyKey)
                          return (
                            <tr key={i}>
                              <EditableCell value={s.name}        section="stages" rowIdx={i} colKey="name"        onSave={handleSaveCell} />
                              <EditableCell value={s.description} section="stages" rowIdx={i} colKey="description" onSave={handleSaveCell} />
                              <EditableCell value={s.startDate}   section="stages" rowIdx={i} colKey="startDate"   onSave={handleSaveCell} />
                              <EditableCell value={s.endDate}     section="stages" rowIdx={i} colKey="endDate"     onSave={handleSaveCell} />
                              <td style={{ padding: '8px 10px', fontSize: 11, color: '#475569', verticalAlign: 'top', borderBottom: '1px solid #F1F5F9' }}>
                                {s.roles.join(', ')}
                              </td>
                              <td style={{ padding: '8px 10px', verticalAlign: 'top', borderBottom: '1px solid #F1F5F9' }}>
                                {story ? <StoryPill storyKey={story.key} url={story.url} /> : <span style={{ fontSize: 11, color: '#94A3B8' }}>—</span>}
                              </td>
                              <td style={{ padding: '8px 10px', fontSize: 11, color: '#64748B', verticalAlign: 'top', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>
                                {s.reportingDoc ?? '—'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeSection === 'cost' && (
                <div>
                  <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#EFF6FF' }}>
                          {['Этап', 'Роль / Специалист', 'Чел/дн', 'Ставка, ₽/дн', 'Сумма, ₽'].map(h => (
                            <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#1E40AF', borderBottom: '2px solid #BFDBFE', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {spec.costTable.map((r, i) => (
                          <tr key={i}>
                            <EditableCell value={r.stage}                             section="costTable" rowIdx={i} colKey="stage" onSave={handleSaveCell} />
                            <EditableCell value={r.role}                              section="costTable" rowIdx={i} colKey="role"  onSave={handleSaveCell} />
                            <EditableCell value={`${r.days}`}                         section="costTable" rowIdx={i} colKey="days"  onSave={handleSaveCell} />
                            <EditableCell value={`${r.rate.toLocaleString('ru')}`}    section="costTable" rowIdx={i} colKey="rate"  onSave={handleSaveCell} />
                            <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: '#0F172A', verticalAlign: 'top', borderBottom: '1px solid #F1F5F9' }}>
                              {r.total.toLocaleString('ru')} ₽
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ borderTop: '2px solid #E2E8F0', background: '#F5F3FF' }}>
                          <td colSpan={3} style={{ padding: '12px', fontSize: 13, fontWeight: 700, color: '#5B21B6' }}>ИТОГО</td>
                          <td />
                          <td style={{ padding: '12px', fontSize: 15, fontWeight: 800, color: '#5B21B6' }}>
                            {spec.totalCost.toLocaleString('ru')} ₽
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {activeSection === 'payment' && (
                <div>
                  {spec.paymentSchedule && spec.paymentSchedule.length > 0 ? (
                    <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#EFF6FF' }}>
                            {['№', 'Наименование платежа', 'Дата', 'Сумма, ₽', 'Основание / Story'].map(h => (
                              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#1E40AF', borderBottom: '2px solid #BFDBFE' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {spec.paymentSchedule.map((p, i) => {
                            const story = stories[i]
                            return (
                              <tr key={i}>
                                <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, color: '#475569', borderBottom: '1px solid #F1F5F9', verticalAlign: 'top' }}>{p.num}</td>
                                <EditableCell value={p.name}   section="paymentSchedule" rowIdx={i} colKey="name"  onSave={handleSaveCell} />
                                <EditableCell value={p.date}   section="paymentSchedule" rowIdx={i} colKey="date"  onSave={handleSaveCell} />
                                <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: '#0F172A', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                                  {p.amount.toLocaleString('ru')} ₽
                                </td>
                                <td style={{ padding: '8px 10px', fontSize: 11, borderBottom: '1px solid #F1F5F9', verticalAlign: 'top' }}>
                                  <div style={{ fontSize: 11, color: '#64748B', marginBottom: 3 }}>{p.basis}</div>
                                  {story && <StoryPill storyKey={story.key} url={story.url} />}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                        <tfoot>
                          <tr style={{ borderTop: '2px solid #E2E8F0', background: '#F8FAFC' }}>
                            <td colSpan={3} style={{ padding: '12px', fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Итого</td>
                            <td style={{ padding: '12px', fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                              {spec.paymentSchedule.reduce((s, p) => s + p.amount, 0).toLocaleString('ru')} ₽
                            </td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: 24, background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', color: '#64748B', fontSize: 13 }}>
                      График платежей определяется в соответствии с договором и актами приёмки по этапам.
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'defects' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {[
                    { label: 'Критические дефекты', key: 'defectDeadlines.critical', val: spec.defectDeadlines.critical, color: '#DC2626', bg: '#FEF2F2' },
                    { label: 'Высокие дефекты',     key: 'defectDeadlines.high',     val: spec.defectDeadlines.high,     color: '#D97706', bg: '#FFFBEB' },
                    { label: 'Средние дефекты',     key: 'defectDeadlines.medium',   val: spec.defectDeadlines.medium,   color: '#0E7490', bg: '#ECFEFF' },
                    { label: 'Незначительные',       key: 'defectDeadlines.low',      val: spec.defectDeadlines.low,      color: '#475569', bg: '#F1F5F9' },
                  ].map(f => (
                    <div key={f.key} style={{ padding: '14px 16px', borderRadius: 10, background: f.bg, border: `1px solid ${f.color}30` }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: f.color, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{f.label}</div>
                      <EditableField label="" value={f.val} fieldPath={f.key} onSave={handleSaveField} />
                    </div>
                  ))}
                </div>
              )}

              {activeSection === 'responsible' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ padding: '16px', background: '#F0F9FF', borderRadius: 10, border: '1px solid #BAE6FD' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#075985', marginBottom: 12 }}>👤 Заказчик</div>
                    <EditableField label="ФИО"       value={spec.responsibleCustomer}             fieldPath="responsibleCustomer"      onSave={handleSaveField} />
                    <EditableField label="Должность"  value={spec.responsibleCustomerTitle ?? ''}  fieldPath="responsibleCustomerTitle"  onSave={handleSaveField} />
                    <EditableField label="Email"      value={spec.responsibleCustomerEmail ?? ''}  fieldPath="responsibleCustomerEmail"  onSave={handleSaveField} />
                    <EditableField label="Телефон"    value={spec.responsibleCustomerPhone ?? ''}  fieldPath="responsibleCustomerPhone"  onSave={handleSaveField} />
                  </div>
                  <div style={{ padding: '16px', background: '#F0FDF4', borderRadius: 10, border: '1px solid #BBF7D0' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#14532D', marginBottom: 12 }}>🏢 Исполнитель</div>
                    <EditableField label="ФИО"       value={spec.responsibleContractor}             fieldPath="responsibleContractor"      onSave={handleSaveField} />
                    <EditableField label="Должность"  value={spec.responsibleContractorTitle ?? ''}  fieldPath="responsibleContractorTitle"  onSave={handleSaveField} />
                    <EditableField label="Email"      value={spec.responsibleContractorEmail ?? ''}  fieldPath="responsibleContractorEmail"  onSave={handleSaveField} />
                    <EditableField label="Телефон"    value={spec.responsibleContractorPhone ?? ''}  fieldPath="responsibleContractorPhone"  onSave={handleSaveField} />
                  </div>
                </div>
              )}

              {activeSection === 'other' && (
                <div>
                  <EditableField label="Иные условия" value={spec.otherConditions ?? ''} fieldPath="otherConditions" multiline onSave={handleSaveField} />
                  <div style={{ marginTop: 16, padding: '12px 16px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12, color: '#64748B' }}>
                    Иные условия, не предусмотренные настоящей Спецификацией, регулируются действующим Договором {spec.contract}.
                  </div>
                </div>
              )}

              {activeSection === 'signatures' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  {[
                    { title: 'Заказчик', name: spec.responsibleCustomer, org: spec.customerName },
                    { title: 'Исполнитель', name: spec.responsibleContractor, org: spec.contractorName },
                  ].map((party, i) => (
                    <div key={i} style={{ padding: '20px 20px 16px', background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', textAlign: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 }}>{party.title}</div>
                      <div style={{ height: 1, background: '#E2E8F0', marginBottom: 8 }} />
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 2 }}>{party.name}</div>
                      <div style={{ fontSize: 11, color: '#64748B', marginBottom: 16 }}>{party.org}</div>
                      <div style={{ padding: '10px 0', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0', color: '#CBD5E1', fontSize: 12 }}>
                        (подпись)
                      </div>
                      <div style={{ marginTop: 10, fontSize: 11, color: '#94A3B8' }}>
                        «____» ________________ 2026 г.
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeSection === 'stories' && (
                <div>
                  <div style={{ padding: '10px 14px', background: '#ECFEFF', borderRadius: 8, border: '1px solid #A5F3FC', marginBottom: 16, fontSize: 12, color: '#0E7490' }}>
                    📋 Story в СберТрек привязаны к этапам спецификации. Ссылки формируются автоматически.
                  </div>
                  <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#ECFEFF' }}>
                          {['Ключ', 'Название Story', 'Этап', 'Начало', 'Конец', 'Приоритет', 'Роли'].map(h => (
                            <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#0E7490', borderBottom: '2px solid #A5F3FC', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {stories.map((s, i) => (
                          <tr key={i}>
                            <td style={{ padding: '10px 12px', borderBottom: '1px solid #F0FDFA', verticalAlign: 'top' }}>
                              <StoryPill storyKey={s.key} url={s.url} />
                            </td>
                            <td style={{ padding: '10px 12px', fontSize: 12, color: '#0F172A', fontWeight: 600, borderBottom: '1px solid #F0FDFA', verticalAlign: 'top' }}>{s.title}</td>
                            <td style={{ padding: '10px 12px', fontSize: 11, color: '#475569', borderBottom: '1px solid #F0FDFA', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{s.stage}</td>
                            <td style={{ padding: '10px 12px', fontSize: 11, color: '#64748B', borderBottom: '1px solid #F0FDFA', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{s.plannedStart}</td>
                            <td style={{ padding: '10px 12px', fontSize: 11, color: '#64748B', borderBottom: '1px solid #F0FDFA', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{s.plannedEnd}</td>
                            <td style={{ padding: '10px 12px', borderBottom: '1px solid #F0FDFA', verticalAlign: 'top' }}>
                              <span style={{
                                padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                                background: s.priority === 'Критично' ? '#FEF2F2' : '#FFFBEB',
                                color: s.priority === 'Критично' ? '#DC2626' : '#D97706',
                              }}>
                                {s.priority}
                              </span>
                            </td>
                            <td style={{ padding: '10px 12px', fontSize: 11, color: '#64748B', borderBottom: '1px solid #F0FDFA', verticalAlign: 'top' }}>
                              {s.roles.join(', ')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 72, right: 24, zIndex: 3100,
          padding: '10px 18px', background: '#10B981', color: '#FFFFFF',
          borderRadius: 10, fontSize: 13, fontWeight: 700,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}>
          ✓ {toast}
        </div>
      )}
    </>
  )
}
