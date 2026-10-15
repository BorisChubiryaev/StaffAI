# Журнал событий (каталог)

> Источник: ТЗ v3 ФТ-6.3 (перечень — прил. Д, формируется на проектировании), ts-v2 §17. Ниже — **рабочий каталог**,
> пополняется спецификациями. Новое событие добавляется сюда в том же PR, где появляется в коде.

## Контракт события (обязателен для всех)

| Поле | Описание |
|---|---|
| `eventId` | Уникальный идентификатор |
| `requestId` | Заявка (может отсутствовать для событий вне заявки, например `process_question_answered`) |
| `type` | Тип из каталога ниже, `snake_case`, прошедшее время |
| `actor` | `{ type: customer \| staff \| admin \| ai \| system, id }` |
| `occurredAt` | Время (UTC) |
| `payload` | Содержимое (без секретов; чувствительные данные — по правилам маскирования) |
| `correlationId` | Сквозной идентификатор операции (запрос пользователя → вызовы LLM → интеграции) |
| `source` | Сервис/модуль-источник |

События пишутся **с первого дня** (Ф1, задача 1.4): на них строятся аудит (ПС-7) и метрики (scope-mvp §Метрики).

## Каталог

| Группа | События |
|---|---|
| Заявка | `request_created`, `request_status_changed`, `request_transition_rejected`, `request_cancelled`, `request_suspended`, `request_archived`, `change_requested` |
| Ввод | `raw_input_received`, `document_attached`, `document_parsed`, `template_applied` |
| AI | `ai_analysis_started`, `ai_analysis_completed`, `ai_analysis_failed`, `clarification_requested`, `contradiction_detected`, `process_question_answered`, `ai_inference_confirmed`, `ai_inference_corrected` |
| Проверка | `validation_completed`, `validation_errors_explained`, `explanation_loop_escalated` |
| Карточка | `request_card_generated`, `request_card_confirmed`, `request_card_change_requested` |
| Штаб | `request_submitted_to_staff`, `executor_assigned`, `staff_review_started`, `staff_clarification_requested`, `customer_clarification_submitted`, `contractor_options_generated`, `contractor_selected`, `initiative_linked` |
| Спецификация | `specification_draft_generated`, `specification_version_created`, `specification_exported`, `executor_decision_made` |
| Согласование | `approval_dispatched`, `approval_participant_responded`, `approval_completed` |
| Downstream | `lk_config_package_generated`, `lk_config_package_sent`, `znr_status_updated`, `tracker_package_generated` |
| Уведомления | `notification_sent`, `notification_failed` |
| Интеграции | `integration_call_failed`, `integration_sync_deferred`, `integration_sync_completed` |
| Администрирование | `template_changed`, `reference_data_synced`, `validation_rules_changed`, `access_changed` |
