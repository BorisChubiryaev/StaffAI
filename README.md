# StaffAI

**Сервис автоматизации заказа внешних ИТ-специалистов с AI-агентом.**
Заказчик описывает потребность один раз простым языком в диалоге — StaffAI уточняет, проверяет по договорам и справочникам,
готовит карточку для штаба, проект спецификации и данные для ЗНР. Все значимые решения — за человеком.

> Заказчик говорит — система делает — человек решает.

**Статус:** старт проекта (Ф0 — подготовка). Требования систематизированы, процесс SDD настроен, есть демо-прототип.
Код продукта ещё не начат; стек не выбран ([ОВ-01](docs/open-questions.md)).

## С чего начать

| Вы… | Читайте |
|---|---|
| Новый участник команды | [Визуальный онбординг](docs/onboarding.html) (открыть в браузере) · [StaffAI за 10 минут](docs/onboarding.md) → [видение](docs/product/vision.md) → [процесс](docs/domain/process.md) |
| Аналитик / штаб | [Границы MVP](docs/product/scope-mvp.md) · [статусы](docs/domain/request-lifecycle.md) · [открытые вопросы](docs/open-questions.md) |
| Разработчик | [Процесс SDD](docs/sdd-process.md) · [конституция](.specify/memory/constitution.md) · [спецификации](specs/README.md) · [архитектура](docs/architecture/overview.md) |
| ИИ-агент | [AGENTS.md](AGENTS.md) |
| Хотите увидеть продукт | [Прототип](prototype/README.md): `cd prototype && npm ci && npm run dev` |

## Структура

```text
├── AGENTS.md / CLAUDE.md      # контекст и правила для ИИ-агентов
├── docs/
│   ├── onboarding.md          # проект за 10 минут
│   ├── onboarding.html        # то же визуально — открыть в браузере
│   ├── product/               # видение, MVP, дорожная карта, глоссарий
│   ├── domain/                # процесс, статусы, роли, данные, события
│   ├── ai/                    # правила AI-агента продукта
│   ├── architecture/          # обзор, интеграции, НФТ, ADR
│   ├── requirements/          # трассировка ТЗ → спецификации
│   ├── intents/               # Daily Intent Briefs
│   ├── sources/               # первичные документы + иерархия источников
│   ├── open-questions.md      # реестр открытых вопросов
│   └── sdd-process.md         # как мы работаем
├── .specify/                  # конституция и шаблоны SDD (совместимо со Spec Kit)
├── .claude/                   # команды /sdd.* и навык /sber-intent
├── specs/                     # спецификации фич NNN-name/{spec,plan,tasks}.md
└── prototype/                 # демо-прототип Next.js (моки, не основа продукта)
```

## Как делается фича

```text
/sber-intent → /sdd.specify → /sdd.clarify → ревью → /sdd.plan → /sdd.tasks → /sdd.implement → /sdd.analyze
```

Подробно — [docs/sdd-process.md](docs/sdd-process.md). Эталон спецификации — [001-request-lifecycle](specs/001-request-lifecycle/spec.md).

## Ключевые документы-первоисточники

[ТЗ v3 (MVP)](docs/sources/01-tz-v3-mvp.md) · [Этапы разработки](docs/sources/04-roadmap-phases.md) ·
[Видение продукта](docs/sources/05-product-vision.md) · [Схема процесса](docs/sources/02-process-scheme.md) ·
[Схема агента](docs/sources/03-agent-scheme.md) — оригиналы в [docs/sources/](docs/sources/README.md).

*Внутренний проект банка.*
