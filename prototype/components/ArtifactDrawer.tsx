'use client'

import { useState } from 'react'
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, ShadingType,
} from 'docx'
import { DemoArtifact, SpecificationDraft, StaffingRequest } from '@/lib/types'
import { useDemoStore } from '@/lib/demo-store'

interface Props {
  artifact: DemoArtifact | null
  onClose: () => void
  request: StaffingRequest
}

// ─── LK Config builder ───────────────────────────────────────────────────────

function buildLKConfig(req: StaffingRequest) {
  const contractor = req.contractorOptions.find(c => c.id === req.selectedContractorId)
  const epic = req.artifacts.find(a => a.type === 'tracker_epic')
  return {
    requestNumber: req.requestNumber,
    znrType: 'IT_RESOURCE_SPECIFICATION',
    customer: { name: req.customer.name, unit: req.customer.unit },
    contractor: {
      name: contractor?.contractorName ?? 'Tech Solutions LLC',
      contractNumber: contractor?.contractNumber ?? '45-2024',
    },
    tracker: {
      system: 'СберТрек',
      epicKey: epic?.epicKey ?? 'PAY-1842',
      url: epic?.epicUrl ?? 'https://sbertrack.example/PAY-1842',
    },
    team: req.structuredRequest.team.map(m => ({
      role: m.role,
      level: m.level,
      count: m.count,
      startDate: m.id === 't6' ? '01.07.2026' : '01.06.2026',
    })),
    specification: {
      subject: req.specificationDraft?.subject ?? 'Развитие backend-контура платёжной системы',
      specNumber: req.specificationDraft?.number ?? 'SPEC-2026-0017',
      stages: req.specificationDraft?.stages.map(s => s.name) ?? [],
      functionalRequirements: req.specificationDraft?.functionalRequirements.map(f => f.description) ?? [],
      nonFunctionalRequirements: req.specificationDraft?.nonFunctionalRequirements ?? [],
      totalCost: req.specificationDraft?.totalCost ?? 9152000,
    },
    approvalRoute: { system: 'ЛК', target: 'ЗНР' },
  }
}

function downloadJSON(data: object, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function heading(text: string, level: typeof HeadingLevel[keyof typeof HeadingLevel] = HeadingLevel.HEADING_2) {
  return new Paragraph({
    text,
    heading: level,
    spacing: { before: 240, after: 120 },
  })
}

function bodyText(text: string, bold = false) {
  return new Paragraph({
    children: [new TextRun({ text, bold, size: 22 })],
    spacing: { after: 60 },
  })
}

function labelValue(label: string, value: string) {
  return new Paragraph({
    children: [
      new TextRun({ text: label + ': ', bold: true, size: 22 }),
      new TextRun({ text: value, size: 22 }),
    ],
    spacing: { after: 60 },
  })
}

function makeTable(headers: string[], rows: string[][], colWidths?: number[]) {
  const headerRow = new TableRow({
    children: headers.map((h, i) => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20 })] })],
      width: colWidths ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
      shading: { type: ShadingType.SOLID, color: 'EFF6FF', fill: 'EFF6FF' },
    })),
    tableHeader: true,
  })
  const dataRows = rows.map(row => new TableRow({
    children: row.map((cell) => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20 })] })],
    })),
  }))
  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  })
}

async function downloadDocx(spec: SpecificationDraft | undefined, requestNumber: string) {
  if (!spec) {
    // Fallback if no spec
    const blob = new Blob([`Спецификация ${requestNumber}\n[Черновик]`], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${requestNumber}.docx`; a.click()
    URL.revokeObjectURL(url)
    return
  }

  // Cost table rows
  const costRows = spec.costTable.map(r => [
    r.stage, r.role, `${r.days} чел/дн`,
    `${r.rate.toLocaleString('ru')} ₽/дн`,
    `${r.total.toLocaleString('ru')} ₽`,
  ])
  costRows.push(['', 'ИТОГО', '', '', `${spec.totalCost.toLocaleString('ru')} ₽`])

  // Stages table
  const stagesRows = spec.stages.map(s => [
    s.name, s.description, s.startDate, s.endDate, s.roles.join(', '),
  ])

  // Specialists table
  const specialistsRows = spec.specialists.map(s => [
    s.role, s.level, `${s.count}`, s.startDate,
  ])

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Title
        new Paragraph({
          children: [new TextRun({ text: `СПЕЦИФИКАЦИЯ № ${spec.number}`, bold: true, size: 36, color: '1E40AF' })],
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `Черновик · ${spec.date}`, size: 22, color: '64748B', italics: true })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),

        // 1. Реквизиты
        heading('1. Реквизиты спецификации'),
        labelValue('Номер спецификации', spec.number),
        labelValue('Договор', spec.contract),
        labelValue('Дата', spec.date),
        labelValue('Заказчик', spec.customerName),
        labelValue('Подразделение заказчика', spec.customerUnit),
        labelValue('Исполнитель', spec.contractorName),
        labelValue('Договор исполнителя', spec.contractorContract),
        labelValue('Источник заявки', requestNumber),

        // 2. Предмет
        heading('2. Предмет спецификации'),
        bodyText(spec.subject, true),
        bodyText(spec.description),
        labelValue('Epic в ' + spec.epicSystem, spec.epicRef),

        // 3. Функциональные требования
        heading('3. Функциональные требования'),
        ...spec.functionalRequirements.map((f, i) =>
          new Paragraph({
            children: [
              new TextRun({ text: `${i + 1}. [${f.id}] `, bold: true, size: 22 }),
              new TextRun({ text: f.description, size: 22 }),
              new TextRun({ text: ` (Приоритет: ${f.priority}, Epic: ${f.epicRef})`, size: 20, color: '64748B' }),
            ],
            spacing: { after: 80 },
          })
        ),

        // 4. Нефункциональные требования
        heading('4. Нефункциональные требования'),
        ...spec.nonFunctionalRequirements.map((r, i) => bodyText(`${i + 1}. ${r}`)),

        // 5. Стоимость работ
        heading('5. Стоимость работ'),
        makeTable(
          ['Этап', 'Роль / Специалист', 'Объём', 'Ставка', 'Сумма'],
          costRows,
          [15, 40, 12, 15, 18]
        ),
        new Paragraph({ spacing: { after: 200 } }),

        // 6. Ответственные лица
        heading('6. Ответственные лица'),
        labelValue('Ответственный со стороны заказчика', spec.responsibleCustomer),
        labelValue('Ответственный со стороны исполнителя', spec.responsibleContractor),

        // 7. Период выполнения работ
        heading('7. Период выполнения работ'),
        spec.stages.length > 0
          ? makeTable(
              ['Этап', 'Описание', 'Начало', 'Конец', 'Роли'],
              stagesRows,
              [20, 30, 10, 10, 30]
            )
          : bodyText('Уточняется'),
        new Paragraph({ spacing: { after: 200 } }),

        // 8. График платежей
        heading('8. График платежей'),
        bodyText('График платежей определяется в соответствии с договором и актами приёмки по этапам.'),

        // 9. Перечень специалистов
        heading('9. Перечень специалистов проектной команды'),
        makeTable(
          ['Роль', 'Уровень', 'Кол-во', 'Дата старта'],
          specialistsRows,
          [40, 20, 15, 25]
        ),
        new Paragraph({ spacing: { after: 200 } }),

        // 10. Иные условия
        heading('10. Иные условия'),
        labelValue('Epic в СберТрек', spec.epicRef),
        labelValue('Критические дефекты', spec.defectDeadlines.critical),
        labelValue('Высокие дефекты', spec.defectDeadlines.high),
        labelValue('Средние дефекты', spec.defectDeadlines.medium),
        labelValue('Незначительные дефекты', spec.defectDeadlines.low),

        // 11. Подписи
        heading('11. Подписи сторон'),
        new Paragraph({ spacing: { before: 400 } }),
        new Paragraph({
          children: [new TextRun({ text: 'Заказчик: ________________________ ', size: 22 }), new TextRun({ text: spec.responsibleCustomer, size: 22, bold: true })],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: 'Исполнитель: _____________________ ', size: 22 }), new TextRun({ text: spec.responsibleContractor, size: 22, bold: true })],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: 'Дата: ______________________', size: 22 })],
        }),

        // Footer note
        new Paragraph({
          children: [new TextRun({ text: `Документ сформирован автоматически на основе запроса ${requestNumber} · StaffAI v2.3`, size: 18, color: '94A3B8', italics: true })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 600 },
        }),
      ],
    }],
  })

  const buffer = await Packer.toBlob(doc)
  const url = URL.createObjectURL(buffer)
  const a = document.createElement('a')
  a.href = url
  a.download = `SPEC-2026-0017_${requestNumber}.docx`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── EPIC VIEWER ─────────────────────────────────────────────────────────────

function EpicView({ artifact }: { artifact: DemoArtifact }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '12px 16px', background: '#F0FDF4', borderRadius: 10, border: '1px solid #BBF7D0' }}>
        <span style={{ fontSize: 22 }}>🟢</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#14532D' }}>Epic создан в СберТрек</div>
          <div style={{ fontSize: 12, color: '#16A34A' }}>Создан автоматически из структурированного запроса · Повторный ввод не требовался</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Система', value: 'СберТрек' },
          { label: 'Ключ', value: artifact.epicKey ?? 'PAY-1842' },
          { label: 'Статус', value: 'Open' },
          { label: 'Тип', value: 'Epic' },
        ].map((item, i) => (
          <div key={i} style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{item.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Название Epic</div>
        <div style={{ padding: '10px 14px', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 14, fontWeight: 600, color: '#0F172A' }}>
          Развитие backend-контура платёжной системы
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Связанные Story</div>
        {['PAY-1842-1: Backend-сервисы платёжного контура', 'PAY-1842-2: Интеграции с банковскими системами', 'PAY-1842-3: Frontend React/TypeScript', 'PAY-1842-4: CI/CD и DevOps', 'PAY-1842-5: Автотестирование'].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', marginBottom: 5, background: '#F8FAFC', borderRadius: 7, border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, background: '#EFF6FF', color: '#2563EB', fontWeight: 700 }}>Story</span>
            <span style={{ fontSize: 13, color: '#334155' }}>{s}</span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Сроки</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ padding: '8px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 2 }}>Старт</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>01.06.2026</div>
          </div>
          <div style={{ padding: '8px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 2 }}>Завершение</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>31.01.2027</div>
          </div>
        </div>
      </div>

      {artifact.source && (
        <div style={{ padding: '10px 14px', background: '#F5F3FF', borderRadius: 8, border: '1px solid #DDD6FE', fontSize: 12, color: '#5B21B6' }}>
          ✦ Источник данных: {artifact.source}
        </div>
      )}

      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <a href="#" onClick={e => e.preventDefault()} style={{ flex: 1, padding: '9px 0', borderRadius: 8, background: '#2563EB', color: '#FFFFFF', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', textAlign: 'center', textDecoration: 'none', display: 'block' }}>
          Открыть в СберТрек →
        </a>
      </div>
    </div>
  )
}

// ─── REQUIREMENTS SUMMARY ────────────────────────────────────────────────────

function RequirementsView({ request }: { request: StaffingRequest }) {
  const PRIORITY_META: Record<string, { label: string; color: string; bg: string }> = {
    critical: { label: 'Критично', color: '#DC2626', bg: '#FEF2F2' },
    high: { label: 'Высокий', color: '#D97706', bg: '#FFFBEB' },
    normal: { label: 'Обычный', color: '#64748B', bg: '#F1F5F9' },
  }
  return (
    <div>
      <div style={{ padding: '12px 14px', background: '#EFF6FF', borderRadius: 8, border: '1px solid #BFDBFE', marginBottom: 16, fontSize: 12, color: '#1E40AF' }}>
        ✦ Сформировано автоматически из структурированного запроса. Готово к отправке подрядчику.
      </div>
      <div style={{ marginBottom: 6, fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Состав команды — {request.structuredRequest.team.reduce((s, m) => s + m.count, 0)} чел.
      </div>
      {request.structuredRequest.team.map((m, i) => {
        const pm = PRIORITY_META[m.priority] ?? PRIORITY_META.normal
        return (
          <div key={i} style={{ marginBottom: 10, padding: '12px 14px', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{m.role}</span>
                <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, background: '#EFF6FF', color: '#2563EB', fontWeight: 600 }}>{m.level}</span>
                <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, background: pm.bg, color: pm.color, fontWeight: 600 }}>{pm.label}</span>
              </div>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#2563EB' }}>×{m.count}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {m.requiredSkills.map((s, j) => (
                <span key={j} style={{ padding: '2px 8px', borderRadius: 4, background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: 11, color: '#475569' }}>{s}</span>
              ))}
            </div>
          </div>
        )
      })}
      <div style={{ marginTop: 16 }}>
        <button style={{ width: '100%', padding: '9px', borderRadius: 8, background: '#2563EB', color: '#FFFFFF', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
          Отправить подрядчику →
        </button>
      </div>
    </div>
  )
}

// ─── LK CONFIG VIEW ──────────────────────────────────────────────────────────

function LKConfigView({ request }: { request: StaffingRequest }) {
  const config = buildLKConfig(request)
  return (
    <div>
      <div style={{ padding: '10px 14px', background: '#F0FDF4', borderRadius: 8, border: '1px solid #BBF7D0', marginBottom: 16, fontSize: 12, color: '#14532D' }}>
        ✅ Config сформирован из спецификации и Epic PAY-1842. Готов для загрузки в ЛК.
      </div>
      <div style={{ background: '#1E293B', borderRadius: 10, padding: 16, marginBottom: 16, overflowX: 'auto' }}>
        <pre style={{ fontSize: 11, color: '#94A3B8', lineHeight: '1.7', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {JSON.stringify(config, null, 2)}
        </pre>
      </div>
      <button
        onClick={() => downloadJSON(config, 'REQ-2026-00521_LK_CONFIG.json')}
        style={{ width: '100%', padding: '10px', borderRadius: 8, background: 'linear-gradient(135deg, #0E7490, #0891B2)', color: '#FFFFFF', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}
      >
        ⬇ Скачать config для ЛК
      </button>
    </div>
  )
}

// ─── LK SUBMISSION VIEW ──────────────────────────────────────────────────────

function LKSubmissionView({ artifact }: { artifact: DemoArtifact }) {
  return (
    <div>
      <div style={{ padding: '14px 16px', background: '#F0FDF4', borderRadius: 10, border: '1px solid #BBF7D0', marginBottom: 20, display: 'flex', gap: 12 }}>
        <span style={{ fontSize: 24 }}>🎉</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#14532D', marginBottom: 4 }}>ЗНР создана и отправлена на согласование</div>
          <div style={{ fontSize: 13, color: '#16A34A' }}>{artifact.znrNumber} · Маршрут согласования запущен в ЛК</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Номер ЗНР', value: artifact.znrNumber ?? 'ЗНР-2026-00931' },
          { label: 'Статус', value: 'На согласовании' },
          { label: 'Система', value: 'Личный Кабинет ЛК' },
          { label: 'Создана', value: artifact.createdAt ?? 'Только что' },
        ].map((item, i) => (
          <div key={i} style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{item.label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Состав пакета ЗНР</div>
        {[
          { icon: '✅', label: 'Структурированный запрос', sub: 'REQ-2026-00521' },
          { icon: '✅', label: 'Epic в СберТрек', sub: 'PAY-1842' },
          { icon: '✅', label: 'Подрядчик выбран', sub: 'Tech Solutions LLC · Договор 45-2024' },
          { icon: '✅', label: 'Draft спецификации', sub: 'SPEC-2026-0017' },
          { icon: '✅', label: 'Config для ЛК', sub: 'REQ-2026-00521_LK_CONFIG.json' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 5, background: '#F0FDF4', borderRadius: 7, border: '1px solid #BBF7D0' }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#14532D' }}>{item.label}</div>
              <div style={{ fontSize: 11, color: '#16A34A' }}>{item.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '10px 14px', background: '#F5F3FF', borderRadius: 8, border: '1px solid #DDD6FE', fontSize: 12, color: '#5B21B6' }}>
        Источник: {artifact.source ?? 'Спецификация SPEC-2026-0017 · Config ЛК'}
      </div>
    </div>
  )
}

// ─── SPEC EDITOR (light in-drawer version) ────────────────────────────────────

function SpecDraftView({ request }: { request: StaffingRequest }) {
  const { updateSpecField } = useDemoStore()
  const spec = request.specificationDraft
  const [activeSection, setActiveSection] = useState('header')
  const [editingField, setEditingField] = useState<string | null>(null)
  const [localValues, setLocalValues] = useState<Record<string, string>>({})
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  const sections = [
    { id: 'header', label: 'Шапка' },
    { id: 'subject', label: 'Предмет' },
    { id: 'func', label: 'Функц. требования' },
    { id: 'nonfunc', label: 'НФТ' },
    { id: 'cost', label: 'Стоимость / Этапы' },
    { id: 'specialists', label: 'Специалисты' },
    { id: 'defects', label: 'Дефекты' },
  ]

  const fieldVal = (key: string, def: string) => localValues[key] ?? def

  const saveField = (key: string, val: string) => {
    updateSpecField(key, val)
    setLocalValues(prev => ({ ...prev, [key]: val }))
    setEditingField(null)
    showToast('Изменение сохранено')
  }

  if (!spec) return (
    <div style={{ padding: 24, textAlign: 'center', color: '#64748B' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
      <div>Черновик ещё не сформирован.<br />Нажмите «Сформировать черновик спецификации» в рабочем месте штаба.</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}>
      {toast && (
        <div style={{ position: 'fixed', top: 70, right: 24, zIndex: 9999, padding: '8px 16px', background: '#10B981', color: '#FFFFFF', borderRadius: 8, fontSize: 13, fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          ✓ {toast}
        </div>
      )}
      {/* AI source badge */}
      <div style={{ padding: '10px 14px', background: '#F5F3FF', borderRadius: 8, border: '1px solid #DDD6FE', marginBottom: 12, fontSize: 12, color: '#5B21B6' }}>
        ✦ Черновик сформирован автоматически на основании структурированного запроса, выбранного подрядчика и Epic PAY-1842 в СберТрек.
      </div>

      {/* Section nav */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
            padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: activeSection === s.id ? 700 : 500,
            background: activeSection === s.id ? '#2563EB' : '#F1F5F9',
            color: activeSection === s.id ? '#FFFFFF' : '#475569',
            border: 'none', cursor: 'pointer',
          }}>{s.label}</button>
        ))}
      </div>

      {/* Section content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {activeSection === 'header' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Номер спецификации', val: spec.number, key: 'number', editable: false },
              { label: 'Дата', val: spec.date, key: 'date', editable: false },
              { label: 'Договор', val: spec.contract, key: 'contract', editable: false },
              { label: 'Заказчик', val: spec.customerName, key: 'customerName', editable: false },
              { label: 'Подразделение', val: spec.customerUnit, key: 'customerUnit', editable: false },
              { label: 'Исполнитель', val: spec.contractorName, key: 'contractorName', editable: false },
              { label: 'Статус', val: 'ЧЕРНОВИК', key: 'status', editable: false },
            ].map((f, i) => (
              <div key={i} style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{f.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{f.val}</div>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'subject' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Предмет спецификации', key: 'subject', val: spec.subject, multiline: false },
              { label: 'Описание результата работ', key: 'description', val: spec.description, multiline: true },
            ].map((f, i) => (
              <div key={i} style={{ padding: '12px 14px', background: '#FFFFFF', borderRadius: 8, border: `1px solid ${spec.editedFields[f.key] ? '#BFDBFE' : '#E2E8F0'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.label}</div>
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                    {spec.editedFields[f.key] && <span style={{ fontSize: 10, color: '#2563EB', fontWeight: 700 }}>изменено</span>}
                    <button onClick={() => setEditingField(editingField === f.key ? null : f.key)} style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, background: '#F1F5F9', border: 'none', cursor: 'pointer', color: '#475569' }}>
                      {editingField === f.key ? '✗ отмена' : '✏️ редактировать'}
                    </button>
                  </div>
                </div>
                {editingField === f.key ? (
                  <div>
                    {f.multiline ? (
                      <textarea
                        autoFocus
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #BFDBFE', borderRadius: 7, fontSize: 13, outline: 'none', minHeight: 80, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                        value={fieldVal(f.key, f.val)}
                        onChange={e => setLocalValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                      />
                    ) : (
                      <input
                        autoFocus
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #BFDBFE', borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                        value={fieldVal(f.key, f.val)}
                        onChange={e => setLocalValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                      />
                    )}
                    <button onClick={() => saveField(f.key, fieldVal(f.key, f.val))} style={{ marginTop: 6, padding: '6px 14px', borderRadius: 6, background: '#2563EB', color: '#FFFFFF', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                      Сохранить
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: '#334155', lineHeight: '1.6' }}>{fieldVal(f.key, f.val)}</div>
                )}
              </div>
            ))}
            <div style={{ padding: '10px 14px', background: '#ECFEFF', borderRadius: 8, border: '1px solid #A5F3FC' }}>
              <div style={{ fontSize: 11, color: '#0E7490', fontWeight: 700, marginBottom: 4 }}>Привязка к Epic</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{spec.epicSystem} · {spec.epicRef}</div>
            </div>
          </div>
        )}

        {activeSection === 'func' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>Требования связаны с Epic {spec.epicRef} и вложенными Story</div>
            {spec.functionalRequirements.map((f, i) => {
              const pc = f.priority === 'critical' ? { bg: '#FEF2F2', color: '#DC2626', label: 'Критично' } : f.priority === 'high' ? { bg: '#FFFBEB', color: '#D97706', label: 'Высокий' } : { bg: '#F1F5F9', color: '#64748B', label: 'Обычный' }
              return (
                <div key={i} style={{ padding: '12px 14px', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{f.id}</span>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: pc.bg, color: pc.color, fontWeight: 700 }}>{pc.label}</span>
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#ECFEFF', color: '#0E7490', fontWeight: 700 }}>{f.epicRef}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: '#334155', lineHeight: '1.6' }}>{f.description}</div>
                </div>
              )
            })}
          </div>
        )}

        {activeSection === 'nonfunc' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {spec.nonFunctionalRequirements.map((r, i) => (
              <div key={i} style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', display: 'flex', gap: 10 }}>
                <span style={{ color: '#2563EB', flexShrink: 0, marginTop: 1 }}>▸</span>
                <div style={{ fontSize: 13, color: '#334155', lineHeight: '1.6' }}>{r}</div>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'cost' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Этапы выполнения</div>
              {spec.stages.map((s, i) => (
                <div key={i} style={{ marginBottom: 10, padding: '12px 14px', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: '#64748B', marginBottom: 6 }}>{s.description}</div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>Старт: <strong style={{ color: '#0F172A' }}>{s.startDate}</strong></span>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>Финиш: <strong style={{ color: '#0F172A' }}>{s.endDate}</strong></span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {s.roles.map((r, j) => <span key={j} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, background: '#EFF6FF', color: '#2563EB' }}>{r}</span>)}
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Стоимость работ</div>
              <div style={{ background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      {['Этап', 'Роль', 'Чел/дн', 'Ставка', 'Сумма'].map((h, i) => (
                        <th key={i} style={{ padding: '8px 10px', textAlign: 'left', color: '#64748B', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {spec.costTable.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '7px 10px', color: '#64748B' }}>{row.stage}</td>
                        <td style={{ padding: '7px 10px', color: '#334155', fontWeight: 500 }}>{row.role}</td>
                        <td style={{ padding: '7px 10px', color: '#0F172A', fontWeight: 600 }}>{row.days}</td>
                        <td style={{ padding: '7px 10px', color: '#64748B' }}>{row.rate.toLocaleString('ru')} ₽</td>
                        <td style={{ padding: '7px 10px', color: '#0F172A', fontWeight: 700 }}>{row.total.toLocaleString('ru')} ₽</td>
                      </tr>
                    ))}
                    <tr style={{ background: '#F5F3FF' }}>
                      <td colSpan={4} style={{ padding: '8px 10px', fontWeight: 700, color: '#4C1D95' }}>Итого по спецификации</td>
                      <td style={{ padding: '8px 10px', fontWeight: 800, color: '#4C1D95', fontSize: 14 }}>{spec.totalCost.toLocaleString('ru')} ₽</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'specialists' && (
          <div>
            <div style={{ padding: '10px 14px', background: '#FFFBEB', borderRadius: 8, border: '1px solid #FDE68A', marginBottom: 14, fontSize: 12, color: '#92400E' }}>
              ⚠ ФИО специалистов будут заполнены после подтверждения исполнителем
            </div>
            {spec.specialists.map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{s.role}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                    <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, background: '#EFF6FF', color: '#2563EB' }}>{s.level}</span>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>Старт: {s.startDate}</span>
                  </div>
                </div>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#2563EB' }}>×{s.count}</span>
              </div>
            ))}
            <div style={{ marginTop: 8, padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12, color: '#64748B' }}>
              <strong>Ответственный от заказчика:</strong> {spec.responsibleCustomer}
            </div>
          </div>
        )}

        {activeSection === 'defects' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Критические', val: spec.defectDeadlines.critical, color: '#DC2626', bg: '#FEF2F2' },
              { label: 'Важные', val: spec.defectDeadlines.high, color: '#D97706', bg: '#FFFBEB' },
              { label: 'Средние', val: spec.defectDeadlines.medium, color: '#2563EB', bg: '#EFF6FF' },
              { label: 'Незначительные', val: spec.defectDeadlines.low, color: '#64748B', bg: '#F8FAFC' },
            ].map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: d.bg, borderRadius: 8, border: `1px solid ${d.color}30` }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: d.color }}>{d.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{d.val}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ marginTop: 14, display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={() => downloadDocx(spec, request.requestNumber)}
          style={{ flex: 1, padding: '9px 0', borderRadius: 8, background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', color: '#FFFFFF', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}
        >
          ⬇ Демо-выгрузка DOCX
        </button>
      </div>
    </div>
  )
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────

export function ArtifactDrawer({ artifact, onClose, request }: Props) {
  if (!artifact) return null

  const ICON_MAP: Record<string, string> = {
    tracker_epic: '📋',
    jira_epic: '📋',
    specification_draft: '📄',
    config_json: '⚙️',
    requirements_summary: '📊',
    lk_config: '⚙️',
    lk_submission: '🏛️',
  }

  const TITLE_MAP: Record<string, string> = {
    tracker_epic: `СберТрек · Epic ${artifact.epicKey ?? 'PAY-1842'}`,
    jira_epic: 'Jira Epic',
    specification_draft: `Draft спецификации ${artifact.specNumber ?? 'SPEC-2026-0017'}`,
    config_json: 'Config для ЛК',
    requirements_summary: 'Сводка требований по ролям',
    lk_config: 'Config для ЛК',
    lk_submission: `ЗНР ${artifact.znrNumber ?? 'ЗНР-2026-00931'}`,
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000 }}
      />
      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 520,
        background: '#FFFFFF', zIndex: 1001,
        boxShadow: '-8px 0 30px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column',
        borderRadius: '16px 0 0 16px',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>{ICON_MAP[artifact.type] ?? '📄'}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{TITLE_MAP[artifact.type] ?? artifact.title}</div>
                {artifact.source && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>Источник: {artifact.source}</div>}
                {artifact.createdAt && <div style={{ fontSize: 11, color: '#94A3B8' }}>Создан: {artifact.createdAt}</div>}
              </div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#F1F5F9', color: '#64748B', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {(artifact.type === 'tracker_epic' || artifact.type === 'jira_epic') && (
            <EpicView artifact={artifact} />
          )}
          {artifact.type === 'requirements_summary' && (
            <RequirementsView request={request} />
          )}
          {artifact.type === 'specification_draft' && (
            <SpecDraftView request={request} />
          )}
          {(artifact.type === 'lk_config' || artifact.type === 'config_json') && (
            <LKConfigView request={request} />
          )}
          {artifact.type === 'lk_submission' && (
            <LKSubmissionView artifact={artifact} />
          )}
        </div>
      </div>
    </>
  )
}
