@AGENTS.md

## Claude Code

- Команды SDD: `/sdd.specify`, `/sdd.clarify`, `/sdd.plan`, `/sdd.tasks`, `/sdd.implement`, `/sdd.analyze`;
  `/onboard` — ответы о проекте по документации; `/sber-intent` — утренняя сессия Daily Intent.
- Перед работой над фичей загрузите её `spec.md`, `plan.md`, `tasks.md` и `.specify/memory/constitution.md`.
- Если пользователь просит «просто сделать фичу» без спецификации — предложите начать с `/sdd.specify` и объясните почему
  (Статья XIII); для багфиксов и chores спецификация не нужна.
