'use client'

import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import {
  DemoState, DemoAction, StaffingRequest, AppRole,
  DemoEvent, DemoMessage, SpecificationDraft, DemoArtifact, BacklogEpic, BacklogStory, DemoAttachment,
} from './types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function now() {
  return new Date().toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
}

function uid() { return `${Date.now()}_${Math.random().toString(36).slice(2, 6)}` }

// ─── Default backlog (4 Stories, used in spec and tracker) ───────────────────

export const DEFAULT_STORIES: BacklogStory[] = [
  {
    id: 's1', key: 'SBT-28491-1',
    title: 'Этап 1: аналитика и подготовка backend-контуров',
    description: 'Сформировать требования, уточнить интеграции, подготовить backend backlog.',
    stage: 'Этап 1', priority: 'Критично',
    roles: ['Системный аналитик Middle × 2', 'Java Backend Senior × 1'],
    plannedStart: '01.06.2026', plannedEnd: '30.06.2026',
    url: 'https://sbertrack.example/SBT-28491-1', status: 'draft',
  },
  {
    id: 's2', key: 'SBT-28491-2',
    title: 'Этап 2: разработка backend и frontend-функционала',
    description: 'Реализовать backend-сервисы и frontend-интеграции по платёжным сценариям.',
    stage: 'Этап 2', priority: 'Критично',
    roles: ['Java Backend Middle × 2', 'Java Backend Senior × 1', 'Frontend Senior × 1'],
    plannedStart: '01.07.2026', plannedEnd: '31.08.2026',
    url: 'https://sbertrack.example/SBT-28491-2', status: 'draft',
  },
  {
    id: 's3', key: 'SBT-28491-3',
    title: 'Этап 3: DevOps, интеграции и стабилизация контура',
    description: 'Настроить CI/CD, инфраструктурные пайплайны и интеграционный контур.',
    stage: 'Этап 3', priority: 'Важно',
    roles: ['DevOps Senior × 1', 'Java Backend Senior × 1'],
    plannedStart: '01.09.2026', plannedEnd: '31.10.2026',
    url: 'https://sbertrack.example/SBT-28491-3', status: 'draft',
  },
  {
    id: 's4', key: 'SBT-28491-4',
    title: 'Этап 4: автотесты и приёмочная стабилизация',
    description: 'Подготовить автотесты, регрессионные сценарии и приёмочные проверки.',
    stage: 'Этап 4', priority: 'Важно',
    roles: ['Autotest QA Middle × 2'],
    plannedStart: '01.11.2026', plannedEnd: '31.01.2027',
    url: 'https://sbertrack.example/SBT-28491-4', status: 'draft',
  },
]

export const DEFAULT_BACKLOG: BacklogEpic = {
  id: 'epic-1',
  system: 'sbertrack',
  key: 'SBT-28491',
  title: 'Развитие платёжных backend-сервисов: команда внешней разработки',
  description: 'Epic сформирован AI на основе заявки REQ-2026-00521',
  url: 'https://sbertrack.example/SBT-28491',
  status: 'draft',
  source: 'generated_by_ai',
  stories: DEFAULT_STORIES,
}

// ─── Default specification draft ─────────────────────────────────────────────

export function buildSpecDraft(req: StaffingRequest): SpecificationDraft {
  const contractor = req.contractorOptions.find(c => c.id === req.selectedContractorId) ?? req.contractorOptions[0]
  const stories = req.backlog?.stories ?? DEFAULT_STORIES

  return {
    number: 'SPEC-2026-0017',
    contract: contractor?.contractNumber ?? '45-2024',
    date: '08.05.2026',
    customerName: req.customer.name,
    customerUnit: req.customer.unit,
    contractorName: contractor?.contractorName ?? 'Tech Solutions LLC',
    contractorContract: contractor?.contractNumber ?? '45-2024',
    status: 'draft',
    subject: 'Развитие backend-контура платёжной системы на базе микросервисной архитектуры',
    description: 'Разработка и внедрение комплекса программного обеспечения для автоматизации платёжных процессов банка. В рамках спецификации обеспечивается полный цикл работ: аналитика, backend-разработка, frontend, DevOps и автоматизация тестирования.',
    epicRef: req.backlog?.key ?? 'SBT-28491',
    epicSystem: 'СберТрек',
    stories,
    functionalRequirements: [
      { id: 'FR-01', description: `Реализация backend-сервисов платёжного контура на Java/Spring Boot с поддержкой Apache Kafka (${stories[0]?.key ?? 'SBT-28491-1'})`, priority: 'critical', epicRef: stories[0]?.key ?? 'SBT-28491-1' },
      { id: 'FR-02', description: `Интеграция с внутренними банковскими системами через REST API и BPMN-процессы (${stories[1]?.key ?? 'SBT-28491-2'})`, priority: 'critical', epicRef: stories[1]?.key ?? 'SBT-28491-2' },
      { id: 'FR-03', description: `Разработка frontend-интерфейсов оператора на React/TypeScript с применением дизайн-системы банка (${stories[1]?.key ?? 'SBT-28491-2'})`, priority: 'high', epicRef: stories[1]?.key ?? 'SBT-28491-2' },
      { id: 'FR-04', description: `Настройка CI/CD-контура, инфраструктуры Kubernetes и конфигурации окружений DevOps (${stories[2]?.key ?? 'SBT-28491-3'})`, priority: 'high', epicRef: stories[2]?.key ?? 'SBT-28491-3' },
      { id: 'FR-05', description: `Автоматизация тестирования критичных платёжных сценариев на Selenium/TestNG с покрытием ≥ 80% (${stories[3]?.key ?? 'SBT-28491-4'})`, priority: 'normal', epicRef: stories[3]?.key ?? 'SBT-28491-4' },
    ],
    nonFunctionalRequirements: [
      'Система контроля версий — на стороне заказчика (GitLab); код исполнителя хранится в репозитории заказчика',
      'Соблюдение процесса проектирования и внедрения ПО, принятого в банке',
      'Доступность системы 24/7, допустимый downtime не более 4 ч/год',
      'RTO ≤ 15 минут, RPO ≤ 1 минута для критичных платёжных сервисов',
      'Соответствие требованиям ИБ банка: шифрование at-rest и in-transit, RBAC, аудит-лог',
      'Разработка ведётся на синтетических данных; промышленные данные не используются до стадии приёмки',
    ],
    stages: [
      { id: 1, name: 'Этап 1: Аналитика и проектирование', description: 'Сбор требований, проектирование архитектуры, согласование API-контрактов', startDate: '01.06.2026', endDate: '30.06.2026', roles: ['Системный аналитик × 2', 'Java Backend Senior × 1'], storyKey: stories[0]?.key, reportingDoc: 'Протокол совещания / Техническое задание', payment: 924000 },
      { id: 2, name: 'Этап 2: Backend и интеграции', description: 'Разработка backend-сервисов, интеграция с банковскими системами, unit-тесты', startDate: '01.07.2026', endDate: '31.08.2026', roles: ['Java Backend Middle × 2', 'Java Backend Senior × 1', 'Системный аналитик × 2'], storyKey: stories[1]?.key, reportingDoc: 'Акт сдачи-приёмки Этапа 2', payment: 3300000 },
      { id: 3, name: 'Этап 3: Frontend, DevOps и тестирование', description: 'Frontend-разработка, настройка CI/CD, автоматизация тестирования', startDate: '01.07.2026', endDate: '31.10.2026', roles: ['Frontend Senior × 1', 'DevOps Senior × 1', 'Autotest QA Middle × 2'], storyKey: stories[2]?.key, reportingDoc: 'Акт сдачи-приёмки Этапа 3', payment: 4728000 },
      { id: 4, name: 'Этап 4: Приёмка и стабилизация', description: 'Приёмочное тестирование, исправление дефектов, передача документации', startDate: '01.11.2026', endDate: '31.01.2027', roles: ['Вся команда'], storyKey: stories[3]?.key, reportingDoc: 'Акт финальной приёмки', payment: 200000 },
    ],
    costTable: [
      { stage: 'Этап 1', role: 'Системный аналитик Middle × 2', days: 44, rate: 12000, total: 528000 },
      { stage: 'Этап 1', role: 'Java Backend Senior × 1', days: 22, rate: 18000, total: 396000 },
      { stage: 'Этап 2–3', role: 'Java Backend Middle × 2', days: 88, rate: 12000, total: 2112000 },
      { stage: 'Этап 2–3', role: 'Java Backend Senior × 1', days: 66, rate: 18000, total: 1188000 },
      { stage: 'Этап 3', role: 'Frontend Senior React/TS × 1', days: 88, rate: 15000, total: 1320000 },
      { stage: 'Этап 3', role: 'DevOps Senior × 1', days: 88, rate: 16000, total: 1408000 },
      { stage: 'Этап 3–4', role: 'Autotest QA Middle × 2', days: 110, rate: 10000, total: 2200000 },
    ],
    paymentSchedule: [
      { num: 1, name: 'Платёж за Этап 1', date: '31.07.2026', amount: 924000, basis: 'Акт приёмки Этапа 1' },
      { num: 2, name: 'Платёж за Этап 2', date: '30.09.2026', amount: 3300000, basis: 'Акт приёмки Этапа 2' },
      { num: 3, name: 'Платёж за Этап 3', date: '30.11.2026', amount: 4728000, basis: 'Акт приёмки Этапа 3' },
      { num: 4, name: 'Финальный платёж', date: '28.02.2027', amount: 200000, basis: 'Акт финальной приёмки' },
    ],
    specialists: req.structuredRequest.team.map(m => ({
      role: m.role,
      level: m.level,
      count: m.count,
      startDate: m.id === 't6' ? '01.07.2026' : '01.06.2026',
    })),
    responsibleCustomer: 'Иван Петров',
    responsibleCustomerTitle: 'Руководитель команды «Платёжные сервисы»',
    responsibleCustomerEmail: 'i.petrov@bank.ru',
    responsibleCustomerPhone: '+7 (495) 000-00-01',
    responsibleContractor: 'Будет определено подрядчиком',
    responsibleContractorTitle: 'Будет определено подрядчиком',
    responsibleContractorEmail: 'Будет определено подрядчиком',
    responsibleContractorPhone: 'Будет определено подрядчиком',
    defectDeadlines: {
      critical: '4 рабочих часа',
      high: '2 рабочих дня',
      medium: '5 рабочих дней',
      low: '10 рабочих дней',
    },
    totalCost: 9152000,
    otherConditions: 'Изменения в составе команды или требованиях фиксируются через систему СберТрек. Технические вопросы решаются в рамках установленного договора № ' + (contractor?.contractNumber ?? '45-2024') + '.',
    editedFields: {},
  }
}

// ─── Initial mock request ────────────────────────────────────────────────────

const INITIAL_REQUEST: StaffingRequest = {
  id: 'REQ-2026-00521',
  requestNumber: 'REQ-2026-00521',
  title: 'Команда разработки для платёжной системы',
  status: 'submitted_to_staff',
  currentOwner: 'staff',
  customer: { name: 'Иван Петров', unit: 'Команда «Платёжные сервисы»' },
  rawInput: `Мне нужна команда из 10 человек на 8 месяцев:\n3 Java backend-разработчика — 2 middle и 1 senior,\n2 системных аналитика,\n1 frontend-разработчик senior,\n1 DevOps senior,\n2 autotest QA middle.\nНужен опыт с банковскими backend-системами.\nАналитики и backend нужны срочно, QA могут выйти через месяц.`,
  structuredRequest: {
    team: [
      { id: 't1', role: 'Java Backend-разработчик', level: 'middle', count: 2, priority: 'critical', requiredSkills: ['Spring', 'Kafka', 'PostgreSQL'], desiredSkills: ['BPMN', 'REST API'] },
      { id: 't2', role: 'Java Backend-разработчик', level: 'senior', count: 1, priority: 'critical', requiredSkills: ['Spring', 'Kafka', 'Архитектурные паттерны'], desiredSkills: ['Опыт банковских систем'] },
      { id: 't3', role: 'Системный аналитик', level: 'middle', count: 2, priority: 'critical', requiredSkills: ['REST API', 'BPMN'], desiredSkills: ['Интеграционные решения'] },
      { id: 't4', role: 'Frontend-разработчик', level: 'senior', count: 1, priority: 'high', requiredSkills: ['React', 'TypeScript'], desiredSkills: ['Дизайн-системы', 'Microfrontends'] },
      { id: 't5', role: 'DevOps-инженер', level: 'senior', count: 1, priority: 'high', requiredSkills: ['Kubernetes', 'CI/CD', 'Terraform'], desiredSkills: ['AWS/GCP'] },
      { id: 't6', role: 'Autotest QA', level: 'middle', count: 2, priority: 'normal', requiredSkills: ['Selenium', 'Java', 'TestNG'], desiredSkills: ['API testing'] },
    ],
    duration: '8 месяцев',
    startPreference: 'АСАП — целевая дата уточняется',
    context: 'Разработка новой платёжной системы банка на базе микросервисной архитектуры.',
    requirements: ['Spring Framework', 'Apache Kafka', 'PostgreSQL', 'REST API', 'BPMN', 'Опыт банковских систем'],
  },
  aiAnalysis: {
    confidence: 84,
    summary: 'Запрос структурирован корректно. Все основные роли распознаны. AI выявил 3 gap: точная дата старта, frontend-стек и CI-код проекта. Рекомендуется Tech Solutions LLC — покрывает 100% ролей.',
    gaps: [
      'Точная дата старта не указана',
      'Frontend-стек не уточнён (React/Vue/Angular?)',
      'CI-код проекта не предоставлен',
      'Предпочтительный подрядчик не указан',
    ],
    contradictions: [],
    assumptions: [
      'Аналитики и backend — старт немедленно, QA через 1 месяц',
      'Система — банковский backend, требуются высокие навыки безопасности',
    ],
    recommendedQuestions: [
      'Какой frontend-стек предпочтителен?',
      'Какая точная дата старта?',
      'Каков CI-код проекта?',
    ],
    referenceMatches: [
      { type: 'role', value: 'Java Backend Middle', confidence: 0.97, source: 'role_catalog_v3' },
      { type: 'role', value: 'System Analyst Middle', confidence: 0.95, source: 'role_catalog_v3' },
      { type: 'contract', value: 'Договор 45-2024 (Tech Solutions LLC)', confidence: 0.89, source: 'contract_registry' },
      { type: 'contract', value: 'Договор 52-2024 (DevOps Hub)', confidence: 0.72, source: 'contract_registry' },
    ],
  },
  contractorOptions: [
    {
      id: 'c1', contractorName: 'Tech Solutions LLC', contractNumber: '45-2024',
      coveragePercent: 100, leadTime: '2–3 недели', riskLevel: 'low',
      estimatedCost: '1 240 000 ₽/мес',
      pros: ['Покрытие 100%', 'Рейтинг 4.2★', 'Опыт банков'],
      cons: ['Чуть выше рынка по ставкам'], recommended: true,
    },
    {
      id: 'c2', contractorName: 'DevOps Hub', contractNumber: '52-2024',
      coveragePercent: 40, leadTime: '1–2 недели', riskLevel: 'high',
      estimatedCost: '510 000 ₽/мес (частично)',
      pros: ['Быстрый вывод DevOps', 'Низкие ставки'],
      cons: ['Нет Java backend', 'Нет QA', 'Нужен второй подрядчик'], recommended: false,
    },
    {
      id: 'c3', contractorName: 'Tech Solutions LLC + DevOps Hub', contractNumber: '45-2024 + 52-2024',
      coveragePercent: 100, leadTime: '2–3 недели', riskLevel: 'medium',
      estimatedCost: '1 180 000 ₽/мес',
      pros: ['Экономия ~5%', 'DevOps выходит быстрее'],
      cons: ['Сложнее администрировать', 'Два договора'], recommended: false,
    },
  ],
  artifacts: [
    { id: 'a1', type: 'requirements_summary', title: 'Сводка требований по ролям', status: 'ready', source: 'Структурированный запрос', createdAt: '07.05.2026, 10:52' },
  ],
  attachments: [
    { id: 'att-mock1', fileName: 'requirements_roles.docx', fileSize: 48200, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', uploadedAt: '07.05.2026, 10:48', uploadedBy: 'customer', source: 'ai_chat', extractedSummary: 'Извлечены требования к Java Backend (Spring, Kafka), Frontend (React/TS), QA (Selenium, TestNG)' },
  ],
  messages: [
    { id: 'm1', sender: 'customer', text: 'Добрый день! Когда можно ожидать начало работ?', timestamp: '07.05.2026, 11:20' },
    { id: 'm2', sender: 'ai', text: 'Заявка принята и передана в штаб. Сотрудник свяжется с вами в ближайшее время.', timestamp: '07.05.2026, 11:21' },
  ],
  events: [
    { id: 'e1', eventType: 'request_created', actor: 'customer', timestamp: '07.05.2026, 10:45', description: 'Заказчик создал заявку через AI-чат' },
    { id: 'e2', eventType: 'ai_intake_completed', actor: 'ai', timestamp: '07.05.2026, 10:47', description: 'AI завершил структурирование запроса. Уверенность: 84%' },
    { id: 'e3', eventType: 'structured_request_confirmed', actor: 'customer', timestamp: '07.05.2026, 10:52', description: 'Заказчик подтвердил структурированный запрос. Уверенность AI: 96%' },
    { id: 'e4', eventType: 'request_submitted_to_staff', actor: 'system', timestamp: '07.05.2026, 10:52', description: 'Заявка передана в штаб для обработки' },
  ],
  createdAt: '07.05.2026, 10:45',
  updatedAt: '07.05.2026, 10:52',
  sla: '2 рабочих дня',
}

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL_CHAT: DemoState['chatMessages'] = [
  { id: 'ai-0', role: 'ai', text: 'Привет! Я помогу оформить заявку на подбор IT-специалистов.\n\nПросто расскажите своими словами: кто нужен, сколько человек, на какой срок и для какого проекта.', ts: now() },
]

const INITIAL_STATE: DemoState = {
  currentRole: 'customer',
  request: null,
  demoStep: 0,
  chatMessages: INITIAL_CHAT,
  clarificationsAnswered: 0,
  intakeComplete: false,
  pendingStaffClarification: null,
  isDemoCompleted: false,
  viewingStep: null,
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {

    case 'SET_ROLE':
      return { ...state, currentRole: action.role }

    case 'SET_VIEWING_STEP':
      return { ...state, viewingStep: action.step }

    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatMessages: [...state.chatMessages, action.msg] }

    case 'ANSWER_CLARIFICATION':
      return { ...state, clarificationsAnswered: action.count }

    case 'VOICE_INPUT_TRANSCRIBED':
      // Just returns current state — the UI handles input filling directly
      return state

    case 'ADD_ATTACHMENT_TO_CHAT': {
      if (!state.request) return state
      const attachment = action.attachment
      const req = {
        ...state.request,
        attachments: [...(state.request.attachments ?? []), attachment],
        events: [...state.request.events, {
          id: uid(), eventType: 'attachment_uploaded', actor: 'customer' as const,
          timestamp: now(), description: `Прикреплён файл: ${attachment.fileName}`,
        }],
        updatedAt: now(),
      }
      return { ...state, request: req }
    }

    case 'CONFIRM_STRUCTURED_REQUEST': {
      const req: StaffingRequest = {
        ...INITIAL_REQUEST,
        status: 'structured_request_ready',
        currentOwner: 'customer',
        aiAnalysis: { ...INITIAL_REQUEST.aiAnalysis, confidence: 96 },
        events: [
          ...INITIAL_REQUEST.events,
          { id: uid(), eventType: 'structured_request_confirmed', actor: 'customer', timestamp: now(), description: 'Заказчик подтвердил структурированный запрос. Уверенность AI: 96%' },
        ],
      }
      return { ...state, request: req, intakeComplete: true, demoStep: Math.max(state.demoStep, 3) }
    }

    case 'GENERATE_BACKLOG_DRAFT': {
      if (!state.request) return state
      const req = {
        ...state.request,
        backlog: { ...DEFAULT_BACKLOG, status: 'draft' as const },
        events: [...state.request.events, {
          id: uid(), eventType: 'tracker_backlog_draft_generated', actor: 'ai' as const,
          timestamp: now(), description: 'AI сформировал draft backlog: Epic SBT-28491 + 4 Story по этапам спецификации',
        }],
        updatedAt: now(),
      }
      return { ...state, request: req }
    }

    case 'VERIFY_EXISTING_TRACKER_TASK': {
      if (!state.request) return state
      const req = {
        ...state.request,
        existingEpicKey: action.epicKey,
        events: [...state.request.events, {
          id: uid(), eventType: 'tracker_existing_key_verified', actor: 'ai' as const,
          timestamp: now(), description: `AI проверил задачу ${action.epicKey} в СберТрек — найдена, частичное совпадение данных`,
        }],
        updatedAt: now(),
      }
      return { ...state, request: req }
    }

    case 'EDIT_BACKLOG_STORY': {
      if (!state.request?.backlog) return state
      const updatedStories = state.request.backlog.stories.map(s =>
        s.id === action.storyId ? { ...s, ...action.patch } : s
      )
      const req = {
        ...state.request,
        backlog: { ...state.request.backlog, stories: updatedStories },
        events: [...state.request.events, {
          id: uid(), eventType: 'tracker_backlog_edited_by_customer', actor: 'customer' as const,
          timestamp: now(), description: `Заказчик отредактировал Story ${action.storyId}`,
        }],
        updatedAt: now(),
      }
      return { ...state, request: req }
    }

    case 'CONFIRM_TRACKER_BACKLOG': {
      if (!state.request) return state
      const req = {
        ...state.request,
        events: [...state.request.events, {
          id: uid(), eventType: 'tracker_backlog_confirmed_by_customer', actor: 'customer' as const,
          timestamp: now(), description: 'Заказчик подтвердил backlog — Epic + 4 Story готовы к созданию в СберТрек',
        }],
        updatedAt: now(),
      }
      return { ...state, request: req }
    }

    case 'CREATE_TRACKER_BACKLOG': {
      if (!state.request) return state
      const backlog = state.request.backlog ?? DEFAULT_BACKLOG
      const epicArtifact: DemoArtifact = {
        id: uid(), type: 'tracker_epic',
        title: `СберТрек · Epic ${backlog.key}`,
        status: 'ready', epicKey: backlog.key, epicUrl: backlog.url,
        source: `Подтверждён заказчиком · REQ-2026-00521`, createdAt: now(),
      }
      const storyArtifacts: DemoArtifact[] = backlog.stories.map(s => ({
        id: uid(), type: 'tracker_story' as const,
        title: `${s.key} — ${s.title}`,
        status: 'ready' as const, storyKey: s.key,
        source: `Epic ${backlog.key}`, createdAt: now(),
      }))
      const updatedBacklog: BacklogEpic = {
        ...backlog,
        status: 'created',
        stories: backlog.stories.map(s => ({ ...s, status: 'created' as const })),
      }
      const req = updateRequest(
        { ...state.request, backlog: updatedBacklog, artifacts: [...state.request.artifacts, epicArtifact, ...storyArtifacts] },
        { status: 'structured_request_ready', currentOwner: 'customer' },
        { eventType: 'tracker_epic_created', actor: 'system', description: `Epic ${backlog.key} и 4 Story созданы в СберТрек · Подтверждено заказчиком` }
      )
      return { ...state, request: req, demoStep: Math.max(state.demoStep, 3) }
    }

    case 'CREATE_TRACKER_TASK_AS_SYSTEM': {
      // Legacy path: use DEFAULT_BACKLOG
      if (!state.request) return state
      const backlog = state.request.backlog ?? DEFAULT_BACKLOG
      const epicArtifact: DemoArtifact = {
        id: uid(), type: 'tracker_epic',
        title: `СберТрек · Epic ${backlog.key}`,
        status: 'ready', epicKey: backlog.key, epicUrl: backlog.url,
        source: `Структурированный запрос · REQ-2026-00521`, createdAt: now(),
      }
      const storyArtifacts: DemoArtifact[] = backlog.stories.map(s => ({
        id: uid(), type: 'tracker_story' as const,
        title: `${s.key} — ${s.title}`,
        status: 'ready' as const, storyKey: s.key,
        source: `Epic ${backlog.key}`, createdAt: now(),
      }))
      const req = updateRequest(
        { ...state.request, backlog: { ...backlog, status: 'created' }, artifacts: [...state.request.artifacts, epicArtifact, ...storyArtifacts] },
        { status: 'structured_request_ready', currentOwner: 'customer' },
        { eventType: 'tracker_epic_created', actor: 'system', description: `Epic ${backlog.key} + 4 Story созданы в СберТрек на основе подтверждённого запроса` }
      )
      return { ...state, request: req, demoStep: Math.max(state.demoStep, 3) }
    }

    case 'SUBMIT_TO_STAFF': {
      if (!state.request) return state
      const req = updateRequest(
        state.request,
        { status: 'submitted_to_staff', currentOwner: 'staff' },
        { eventType: 'request_submitted_to_staff', actor: 'customer', description: 'Заказчик передал заявку в штаб. Backlog в СберТрек подтверждён.' }
      )
      return { ...state, request: req, demoStep: Math.max(state.demoStep, 4) }
    }

    case 'STAFF_TAKE_OWNERSHIP': {
      if (!state.request) return state
      const req = updateRequest(state.request,
        { status: 'staff_review', currentOwner: 'staff' },
        { eventType: 'staff_took_ownership', actor: 'staff', description: 'Сотрудник штаба взял заявку в работу' }
      )
      return { ...state, request: req, demoStep: Math.max(state.demoStep, 6) }
    }

    case 'STAFF_SEND_CLARIFICATION': {
      if (!state.request) return state
      const msg: DemoMessage = { id: uid(), sender: 'staff', text: action.text, timestamp: now() }
      const req = updateRequest(
        { ...state.request, messages: [...state.request.messages, msg] },
        { status: 'awaiting_staff_clarification', currentOwner: 'customer' },
        { eventType: 'staff_clarification_requested', actor: 'staff', description: `Штаб запросил уточнение: "${action.text.slice(0, 60)}…"` }
      )
      return { ...state, request: req, pendingStaffClarification: action.text, demoStep: Math.max(state.demoStep, 7) }
    }

    case 'CUSTOMER_ANSWER_CLARIFICATION': {
      if (!state.request) return state
      const msg: DemoMessage = { id: uid(), sender: 'customer', text: action.text, timestamp: now() }
      const updatedTeam = state.request.structuredRequest.team.map(m =>
        m.id === 't4' ? { ...m, requiredSkills: ['React', 'TypeScript', 'Дизайн-системы банка'] } : m
      )
      const req = updateRequest(
        { ...state.request, messages: [...state.request.messages, msg], structuredRequest: { ...state.request.structuredRequest, team: updatedTeam, startPreference: '1 июня 2026' }, aiAnalysis: { ...state.request.aiAnalysis, confidence: 96, gaps: [], summary: 'Все ключевые данные уточнены. Confidence 96%. Рекомендован Tech Solutions LLC.' } },
        { status: 'contractor_selection', currentOwner: 'staff' },
        { eventType: 'customer_answered_clarification', actor: 'customer', description: 'Заказчик ответил на уточнение штаба. AI обновил анализ. Уверенность: 96%' }
      )
      return { ...state, request: req, pendingStaffClarification: null, demoStep: Math.max(state.demoStep, 8) }
    }

    case 'CREATE_TRACKER_TASK': {
      // Legacy compat — Epic already exists from customer side
      if (!state.request) return state
      if (state.request.artifacts.find(a => a.type === 'tracker_epic')) return state
      const backlog = state.request.backlog ?? DEFAULT_BACKLOG
      const epicArtifact: DemoArtifact = {
        id: uid(), type: 'tracker_epic', title: `СберТрек · Epic ${backlog.key}`,
        status: 'ready', epicKey: backlog.key, epicUrl: backlog.url,
        source: 'Структурированный запрос · REQ-2026-00521', createdAt: now(),
      }
      const req = updateRequest(
        { ...state.request, artifacts: [...state.request.artifacts, epicArtifact] },
        { status: 'tracker_task_created', currentOwner: 'staff' },
        { eventType: 'tracker_epic_created', actor: 'system', description: `Epic ${backlog.key} связан с заявкой.` }
      )
      return { ...state, request: req }
    }

    case 'SELECT_CONTRACTOR': {
      if (!state.request) return state
      const req = updateRequest(
        { ...state.request, selectedContractorId: action.contractorId },
        { status: 'specification_drafting', currentOwner: 'staff' },
        { eventType: 'contractor_selected', actor: 'staff', description: `Выбран подрядчик: ${state.request.contractorOptions.find(c => c.id === action.contractorId)?.contractorName ?? action.contractorId}` }
      )
      return { ...state, request: req, demoStep: Math.max(state.demoStep, 9) }
    }

    case 'GENERATE_SPEC_DRAFT':
    case 'GENERATE_SPEC_DRAFT_FROM_TEMPLATE': {
      if (!state.request) return state
      const specDraft = buildSpecDraft(state.request)
      const specArtifact = {
        id: uid(), type: 'specification_draft' as const,
        title: 'Draft спецификации № SPEC-2026-0017',
        status: 'draft' as const, specNumber: 'SPEC-2026-0017',
        source: `Структурированный запрос · Epic ${state.request.backlog?.key ?? 'SBT-28491'} · Договор ${state.request.contractorOptions.find(c => c.id === state.request?.selectedContractorId)?.contractNumber ?? '45-2024'}`,
        createdAt: now(),
      }
      const req = updateRequest(
        { ...state.request, artifacts: [...state.request.artifacts, specArtifact], specificationDraft: specDraft },
        { status: 'customer_approval', currentOwner: 'customer' },
        { eventType: 'specification_template_applied', actor: 'ai', description: 'AI сформировал черновик спецификации SPEC-2026-0017 по шаблону на основе заявки и Epic' }
      )
      return { ...state, request: req, demoStep: Math.max(state.demoStep, 10) }
    }

    case 'UPDATE_SPEC_FIELD': {
      if (!state.request?.specificationDraft) return state
      const spec = { ...state.request.specificationDraft }
      if (action.fieldPath === 'subject') spec.subject = action.value
      else if (action.fieldPath === 'description') spec.description = action.value
      else if (action.fieldPath === 'responsibleCustomer') spec.responsibleCustomer = action.value
      else if (action.fieldPath === 'responsibleContractor') spec.responsibleContractor = action.value
      spec.editedFields = { ...spec.editedFields, [action.fieldPath]: true }
      return { ...state, request: { ...state.request, specificationDraft: spec, updatedAt: now() } }
    }

    case 'UPDATE_SPEC_TABLE_CELL': {
      if (!state.request?.specificationDraft) return state
      const spec = { ...state.request.specificationDraft }
      if (action.section === 'cost' && spec.costTable[action.rowIdx]) {
        const row = { ...spec.costTable[action.rowIdx] }
        if (action.colKey === 'days') row.days = Number(action.value)
        if (action.colKey === 'rate') row.rate = Number(action.value)
        if (action.colKey === 'total') row.total = Number(action.value)
        if (action.colKey === 'stage') row.stage = action.value
        if (action.colKey === 'role') row.role = action.value
        const newTable = [...spec.costTable]
        newTable[action.rowIdx] = row
        spec.costTable = newTable
        spec.totalCost = newTable.reduce((s, r) => s + r.total, 0)
      }
      if (action.section === 'stages' && spec.stages[action.rowIdx]) {
        const stage = { ...spec.stages[action.rowIdx] }
        if (action.colKey === 'startDate') stage.startDate = action.value
        if (action.colKey === 'endDate') stage.endDate = action.value
        if (action.colKey === 'description') stage.description = action.value
        const newStages = [...spec.stages]
        newStages[action.rowIdx] = stage
        spec.stages = newStages
      }
      spec.editedFields = { ...spec.editedFields, [action.section]: true }
      return { ...state, request: { ...state.request, specificationDraft: spec, updatedAt: now() } }
    }

    case 'GENERATE_LK_CONFIG': {
      if (!state.request) return state
      const configArtifact = {
        id: uid(), type: 'lk_config' as const,
        title: 'Config для ЛК', status: 'ready' as const,
        fileName: 'REQ-2026-00521_LK_CONFIG.json',
        source: 'Спецификация SPEC-2026-0017 · Epic SBT-28491', createdAt: now(),
      }
      const req = updateRequest(
        { ...state.request, artifacts: [...state.request.artifacts, configArtifact] },
        { status: 'lk_config_ready', currentOwner: 'staff' },
        { eventType: 'lk_config_generated', actor: 'system', description: 'Config для ЛК сформирован. Файл REQ-2026-00521_LK_CONFIG.json готов к выгрузке.' }
      )
      return { ...state, request: req, demoStep: Math.max(state.demoStep, 10) }
    }

    // Legacy alias — keeps old wiring intact
    case 'SEND_TO_LK_APPROVAL': {
      if (!state.request) return state
      const znr = 'ЗНР-2026-00931'
      const submissionArtifact = {
        id: uid(), type: 'lk_submission' as const,
        title: `${znr} — создана в Личном кабинете`,
        status: 'sent' as const, znrNumber: znr,
        lkUrl: 'https://lk.example/znr/ZNR-2026-00931',
        source: 'REQ-2026-00521 · SPEC-2026-0017 · Config ЛК', createdAt: now(),
      }
      const req = updateRequest(
        { ...state.request, artifacts: [...state.request.artifacts, submissionArtifact], znrNumber: znr },
        { status: 'lk_approval_sent', currentOwner: 'system' },
        { eventType: 'znr_created_in_lk', actor: 'staff', description: `${znr} создана в Личном кабинете и отправлена на маршрут согласования` }
      )
      return { ...state, request: req, demoStep: Math.max(state.demoStep, 11) }
    }

    case 'CREATE_ZNR_IN_LK': {
      if (!state.request) return state
      const znr = 'ЗНР-2026-00931'
      const submissionArtifact = {
        id: uid(), type: 'lk_submission' as const,
        title: `${znr} — создана в Личном кабинете`,
        status: 'sent' as const, znrNumber: znr,
        lkUrl: 'https://lk.example/znr/ZNR-2026-00931',
        source: 'REQ-2026-00521 · SPEC-2026-0017 · Config ЛК', createdAt: now(),
      }
      const req = updateRequest(
        { ...state.request, artifacts: [...state.request.artifacts, submissionArtifact], znrNumber: znr },
        { status: 'lk_approval_sent', currentOwner: 'system' },
        { eventType: 'znr_created_in_lk', actor: 'staff', description: `${znr} создана в Личном кабинете. Маршрут: ${action.approvalRoute}. Утверждающий: ${action.approver}` }
      )
      return { ...state, request: req, demoStep: Math.max(state.demoStep, 11) }
    }

    case 'CUSTOMER_SEND_MESSAGE': {
      if (!state.request) return state
      const msg: DemoMessage = { id: uid(), sender: 'customer', text: action.text, timestamp: now() }
      const req = {
        ...state.request,
        messages: [...state.request.messages, msg],
        events: [...state.request.events, { id: uid(), eventType: 'customer_sent_message', actor: 'customer' as const, timestamp: now(), description: `Заказчик написал в чат: "${action.text.slice(0, 50)}…"` }],
        updatedAt: now(),
      }
      return { ...state, request: req }
    }

    case 'STAFF_SEND_MESSAGE': {
      if (!state.request) return state
      const msg: DemoMessage = { id: uid(), sender: 'staff', text: action.text, timestamp: now() }
      const req = {
        ...state.request,
        messages: [...state.request.messages, msg],
        events: [...state.request.events, { id: uid(), eventType: 'staff_sent_message', actor: 'staff' as const, timestamp: now(), description: `Штаб ответил заказчику: "${action.text.slice(0, 50)}…"` }],
        updatedAt: now(),
      }
      return { ...state, request: req }
    }

    case 'CUSTOMER_APPROVE': {
      if (!state.request) return state
      const updatedArtifacts = state.request.artifacts.map(a =>
        a.type === 'specification_draft' ? { ...a, status: 'approved' as const } : a
      )
      const req = updateRequest(
        { ...state.request, artifacts: updatedArtifacts },
        { status: 'lk_config_ready', currentOwner: 'staff' },
        { eventType: 'customer_approved', actor: 'customer', description: 'Заказчик согласовал спецификацию. Штаб готовит ЗНР в ЛК.' }
      )
      return { ...state, request: req, demoStep: Math.max(state.demoStep, 9) }
    }

    case 'CUSTOMER_REQUEST_CHANGES': {
      if (!state.request) return state
      const req = updateRequest(state.request,
        { status: 'change_requested', currentOwner: 'staff' },
        { eventType: 'change_requested', actor: 'customer', description: `Заказчик вернул на доработку: ${action.comment}` }
      )
      return { ...state, request: req }
    }

    case 'SEND_TO_CUSTOMER_APPROVAL': {
      if (!state.request) return state
      const req = updateRequest(state.request,
        { status: 'customer_approval', currentOwner: 'customer' },
        { eventType: 'sent_to_customer_approval', actor: 'staff', description: 'Черновик спецификации отправлен заказчику на согласование' }
      )
      return { ...state, request: req }
    }

    case 'COMPLETE_DEMO': {
      if (!state.request) return state
      const req = updateRequest(
        state.request,
        { status: 'lk_approval_sent', currentOwner: 'system' },
        { eventType: 'demo_completed', actor: 'customer', description: 'Заказчик просмотрел статус согласования в ЛК. Демо-сценарий завершён.' }
      )
      return { ...state, request: req, isDemoCompleted: true, demoStep: DEMO_STEPS.length }
    }

    case 'ADVANCE_DEMO_STEP':
      return { ...state, demoStep: state.demoStep + 1 }

    case 'RESET_DEMO':
      return { ...INITIAL_STATE, chatMessages: INITIAL_CHAT }

    default:
      return state
  }
}

function updateRequest(
  req: StaffingRequest,
  patch: Partial<Pick<StaffingRequest, 'status' | 'currentOwner'>>,
  event: { eventType: string; actor: StaffingRequest['currentOwner']; description: string }
): StaffingRequest {
  const newEvent: DemoEvent = { id: uid(), eventType: event.eventType, actor: event.actor, timestamp: now(), description: event.description }
  return { ...req, ...patch, updatedAt: now(), events: [...req.events, newEvent] }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface DemoContextValue {
  state: DemoState
  dispatch: React.Dispatch<DemoAction>
  setRole: (role: AppRole) => void
  confirmStructuredRequest: () => void
  createTrackerTaskAsSystem: () => void
  submitToStaff: () => void
  staffTakeOwnership: () => void
  staffSendClarification: (text: string) => void
  customerAnswerClarification: (text: string) => void
  createTrackerTask: () => void
  selectContractor: (id: string) => void
  generateSpecDraft: () => void
  updateSpecField: (fieldPath: string, value: string) => void
  updateSpecTableCell: (section: string, rowIdx: number, colKey: string, value: string) => void
  generateLKConfig: () => void
  sendToLKApproval: () => void
  createZnrInLK: (approvalRoute: string, approver: string) => void
  customerSendMessage: (text: string) => void
  staffSendMessage: (text: string) => void
  customerApprove: () => void
  customerRequestChanges: (comment: string) => void
  completeDemo: () => void
  setViewingStep: (step: number | null) => void
  resetDemo: () => void
  generateBacklogDraft: () => void
  confirmTrackerBacklog: () => void
  createTrackerBacklog: () => void
  addAttachmentToChat: (att: DemoAttachment) => void
}

const DemoContext = createContext<DemoContextValue | null>(null)

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(demoReducer, INITIAL_STATE)

  const value: DemoContextValue = {
    state, dispatch,
    setRole: (role) => dispatch({ type: 'SET_ROLE', role }),
    confirmStructuredRequest: () => dispatch({ type: 'CONFIRM_STRUCTURED_REQUEST' }),
    createTrackerTaskAsSystem: () => dispatch({ type: 'CREATE_TRACKER_TASK_AS_SYSTEM' }),
    submitToStaff: () => dispatch({ type: 'SUBMIT_TO_STAFF' }),
    staffTakeOwnership: () => dispatch({ type: 'STAFF_TAKE_OWNERSHIP' }),
    staffSendClarification: (text) => dispatch({ type: 'STAFF_SEND_CLARIFICATION', text }),
    customerAnswerClarification: (text) => dispatch({ type: 'CUSTOMER_ANSWER_CLARIFICATION', text }),
    createTrackerTask: () => dispatch({ type: 'CREATE_TRACKER_TASK' }),
    selectContractor: (id) => dispatch({ type: 'SELECT_CONTRACTOR', contractorId: id }),
    generateSpecDraft: () => dispatch({ type: 'GENERATE_SPEC_DRAFT' }),
    updateSpecField: (fieldPath, value) => dispatch({ type: 'UPDATE_SPEC_FIELD', fieldPath, value }),
    updateSpecTableCell: (section, rowIdx, colKey, value) => dispatch({ type: 'UPDATE_SPEC_TABLE_CELL', section, rowIdx, colKey, value }),
    generateLKConfig: () => dispatch({ type: 'GENERATE_LK_CONFIG' }),
    sendToLKApproval: () => dispatch({ type: 'SEND_TO_LK_APPROVAL' }),
    createZnrInLK: (approvalRoute, approver) => dispatch({ type: 'CREATE_ZNR_IN_LK', approvalRoute, approver }),
    customerSendMessage: (text) => dispatch({ type: 'CUSTOMER_SEND_MESSAGE', text }),
    staffSendMessage: (text) => dispatch({ type: 'STAFF_SEND_MESSAGE', text }),
    customerApprove: () => dispatch({ type: 'CUSTOMER_APPROVE' }),
    customerRequestChanges: (comment) => dispatch({ type: 'CUSTOMER_REQUEST_CHANGES', comment }),
    completeDemo: () => dispatch({ type: 'COMPLETE_DEMO' }),
    setViewingStep: (step) => dispatch({ type: 'SET_VIEWING_STEP', step }),
    resetDemo: () => dispatch({ type: 'RESET_DEMO' }),
    generateBacklogDraft: () => dispatch({ type: 'GENERATE_BACKLOG_DRAFT' }),
    confirmTrackerBacklog: () => dispatch({ type: 'CONFIRM_TRACKER_BACKLOG' }),
    createTrackerBacklog: () => dispatch({ type: 'CREATE_TRACKER_BACKLOG' }),
    addAttachmentToChat: (att) => dispatch({ type: 'ADD_ATTACHMENT_TO_CHAT', attachment: att }),
  }

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemoStore(): DemoContextValue {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error('useDemoStore must be used inside DemoProvider')
  return ctx
}

export function getNextDemoStep(demoStep: number) { return DEMO_STEPS[demoStep] ?? null }
export function shouldShowRoleTransition(demoStep: number, pageRole: AppRole) {
  const next = getNextDemoStep(demoStep)
  return !!(next && next.role !== pageRole)
}

// ─── Status metadata ──────────────────────────────────────────────────────────

export const STATUS_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  draft:                           { label: 'Черновик',                          color: '#475569', bg: '#F1F5F9', dot: '#94A3B8' },
  ai_intake:                       { label: 'Сбор запроса AI',                   color: '#5B21B6', bg: '#F5F3FF', dot: '#7C3AED' },
  awaiting_customer_clarification: { label: 'Уточнение от заказчика',           color: '#92400E', bg: '#FEF3C7', dot: '#D97706' },
  awaiting_customer_confirmation:  { label: 'Ожидает подтверждения',            color: '#92400E', bg: '#FEF3C7', dot: '#D97706' },
  structured_request_ready:        { label: 'Запрос готов',                     color: '#065F46', bg: '#D1FAE5', dot: '#10B981' },
  submitted_to_staff:              { label: 'Передано в штаб',                  color: '#1E40AF', bg: '#DBEAFE', dot: '#2563EB' },
  staff_review:                    { label: 'Проверка штабом',                  color: '#1E40AF', bg: '#DBEAFE', dot: '#2563EB' },
  awaiting_staff_clarification:    { label: 'Ожидается ответ заказчика',        color: '#92400E', bg: '#FEF3C7', dot: '#D97706' },
  contractor_selection:            { label: 'Выбор подрядчика',                 color: '#4C1D95', bg: '#EDE9FE', dot: '#7C3AED' },
  tracker_task_creation:           { label: 'Создание backlog в СберТрек',      color: '#0E7490', bg: '#ECFEFF', dot: '#06B6D4' },
  tracker_backlog_review:          { label: 'Проверка backlog',                 color: '#0E7490', bg: '#ECFEFF', dot: '#06B6D4' },
  tracker_backlog_confirmed:       { label: 'Backlog подтверждён',              color: '#065F46', bg: '#D1FAE5', dot: '#10B981' },
  tracker_task_created:            { label: 'Epic в СберТрек создан',           color: '#065F46', bg: '#D1FAE5', dot: '#10B981' },
  specification_drafting:          { label: 'Подготовка спецификации',          color: '#0E7490', bg: '#ECFEFF', dot: '#06B6D4' },
  customer_approval:               { label: 'Согласование заказчиком',          color: '#92400E', bg: '#FEF3C7', dot: '#D97706' },
  lk_config_ready:                 { label: 'Готово к созданию ЗНР',            color: '#0E7490', bg: '#ECFEFF', dot: '#06B6D4' },
  lk_approval:                     { label: 'Создание ЗНР в ЛК',               color: '#4C1D95', bg: '#EDE9FE', dot: '#7C3AED' },
  lk_approval_sent:                { label: 'ЗНР создана в ЛК',                color: '#065F46', bg: '#D1FAE5', dot: '#10B981' },
  znr_created:                     { label: 'ЗНР на согласовании',              color: '#065F46', bg: '#D1FAE5', dot: '#10B981' },
  contracting:                     { label: 'Контрактный процесс',              color: '#065F46', bg: '#D1FAE5', dot: '#10B981' },
  specialists_sourcing:            { label: 'Подбор специалистов',              color: '#065F46', bg: '#D1FAE5', dot: '#10B981' },
  completed:                       { label: 'Завершено',                        color: '#14532D', bg: '#DCFCE7', dot: '#16A34A' },
  change_requested:                { label: 'Возвращено на доработку',          color: '#7F1D1D', bg: '#FEE2E2', dot: '#DC2626' },
  cancelled:                       { label: 'Отменено',                         color: '#374151', bg: '#F3F4F6', dot: '#9CA3AF' },
}

export const OWNER_META: Record<string, { label: string; color: string }> = {
  customer: { label: 'Заказчик', color: '#2563EB' },
  ai:       { label: 'AI-агент', color: '#7C3AED' },
  staff:    { label: 'Штаб',     color: '#0E7490' },
  system:   { label: 'Система',  color: '#475569' },
}

// ─── Demo scenario steps ──────────────────────────────────────────────────────

export const DEMO_STEPS = [
  { step: 0,  label: 'Создать заявку как заказчик',                       role: 'customer', path: '/customer/chat' },
  { step: 1,  label: 'Ответить на уточняющие вопросы AI',                 role: 'customer', path: '/customer/chat' },
  { step: 2,  label: 'Подтвердить структурированный запрос',              role: 'customer', path: '/customer/chat' },
  { step: 3,  label: 'Проверить или создать Epic/Story в СберТрек',       role: 'customer', path: '/customer/chat' },
  { step: 4,  label: 'Передать заявку в штаб',                            role: 'customer', path: '/customer/chat' },
  { step: 5,  label: 'Штаб: принять заявку из очереди',                   role: 'staff',    path: '/staff/queue' },
  { step: 6,  label: 'Взять заявку в работу',                             role: 'staff',    path: '/staff/review' },
  { step: 7,  label: 'Запросить уточнение у заказчика',                   role: 'staff',    path: '/staff/review' },
  { step: 8,  label: 'Ответить на уточнение штаба',                       role: 'customer', path: '/customer/requests' },
  { step: 9,  label: 'Выбрать подрядчика',                                role: 'staff',    path: '/staff/review' },
  { step: 10, label: 'Сформировать черновик спецификации',                role: 'staff',    path: '/staff/review' },
  { step: 11, label: 'Создать ЗНР в Личном кабинете',                    role: 'staff',    path: '/staff/review' },
  { step: 12, label: 'Посмотреть статус согласования в ЛК',               role: 'customer', path: '/customer/requests' },
]
