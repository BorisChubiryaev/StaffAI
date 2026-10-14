export type RequestStatus =
  | 'draft'
  | 'ai_intake'
  | 'awaiting_customer_clarification'
  | 'awaiting_customer_confirmation'
  | 'structured_request_ready'
  | 'submitted_to_staff'
  | 'staff_review'
  | 'awaiting_staff_clarification'
  | 'contractor_selection'
  | 'tracker_task_creation'
  | 'tracker_backlog_review'
  | 'tracker_backlog_confirmed'
  | 'tracker_task_created'
  | 'specification_drafting'
  | 'customer_approval'
  | 'lk_config_ready'
  | 'lk_approval'
  | 'lk_approval_sent'
  | 'znr_created'
  | 'contracting'
  | 'specialists_sourcing'
  | 'completed'
  | 'change_requested'
  | 'cancelled'

export type RequestOwner = 'customer' | 'ai' | 'staff' | 'system'

export type AppRole = 'customer' | 'staff' | 'admin'

export interface TeamMember {
  id: string
  role: string
  level: 'junior' | 'middle' | 'senior' | 'mixed'
  count: number
  startDate?: string
  priority: 'critical' | 'high' | 'normal'
  requiredSkills: string[]
  desiredSkills: string[]
}

export interface ContractorOption {
  id: string
  contractorName: string
  contractNumber: string
  coveragePercent: number
  leadTime: string
  riskLevel: 'low' | 'medium' | 'high'
  estimatedCost: string
  pros: string[]
  cons: string[]
  recommended: boolean
}

export interface ReferenceMatch {
  type: 'role' | 'contract' | 'ci' | 'product' | 'budget'
  value: string
  confidence: number
  source: string
}

export interface AIAnalysis {
  confidence: number
  summary: string
  gaps: string[]
  contradictions: string[]
  assumptions: string[]
  recommendedQuestions: string[]
  referenceMatches: ReferenceMatch[]
}

// ─── Attachments ─────────────────────────────────────────────────────────────

export interface DemoAttachment {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  uploadedAt: string
  uploadedBy: 'customer' | 'staff'
  source: 'ai_chat' | 'staff_chat'
  extractedSummary?: string
}

export interface DemoMessage {
  id: string
  sender: 'customer' | 'staff' | 'ai' | 'system'
  text: string
  timestamp: string
  relatedField?: string
  attachments?: DemoAttachment[]
}

// ─── Backlog / СберТрек ───────────────────────────────────────────────────────

export interface BacklogVerificationResult {
  checkedAt: string
  status: 'matched' | 'partial_mismatch' | 'not_found'
  matchedFields: string[]
  mismatches: Array<{
    field: string
    requestValue: string
    trackerValue: string
    recommendation: string
  }>
}

export interface BacklogStory {
  id: string
  key: string
  title: string
  description: string
  stage: string
  priority: 'Критично' | 'Важно' | 'Средне'
  plannedStart: string
  plannedEnd: string
  roles: string[]
  url: string
  status: 'draft' | 'created' | 'linked'
}

export interface BacklogEpic {
  id: string
  system: 'sbertrack' | 'jira'
  key: string
  title: string
  description: string
  url: string
  status: 'draft' | 'existing_verified' | 'created' | 'linked'
  source: 'existing' | 'generated_by_ai'
  verification?: BacklogVerificationResult
  stories: BacklogStory[]
}

// ─── Artifacts ────────────────────────────────────────────────────────────────

export interface DemoEvent {
  id: string
  eventType: string
  actor: RequestOwner
  timestamp: string
  description: string
}

export interface DemoArtifact {
  id: string
  type:
    | 'tracker_epic'
    | 'tracker_story'
    | 'jira_epic'
    | 'specification_draft'
    | 'config_json'
    | 'requirements_summary'
    | 'lk_config'
    | 'lk_submission'
    | 'uploaded_file'
  title: string
  status: 'draft' | 'ready' | 'approved' | 'sent'
  epicKey?: string
  epicUrl?: string
  specNumber?: string
  znrNumber?: string
  lkUrl?: string
  fileName?: string
  source?: string
  createdAt?: string
  storyKey?: string
}

export interface FunctionalRequirement {
  id: string
  description: string
  priority: 'critical' | 'high' | 'normal'
  epicRef: string
}

export interface SpecStage {
  id: number
  name: string
  description: string
  startDate: string
  endDate: string
  roles: string[]
  storyKey?: string
  reportingDoc?: string
  payment?: number
}

export interface CostRow {
  stage: string
  role: string
  days: number
  rate: number
  total: number
}

export interface SpecificationDraft {
  number: string
  contract: string
  date: string
  customerName: string
  customerUnit: string
  contractorName: string
  contractorContract: string
  status: 'draft' | 'ready' | 'approved'
  subject: string
  description: string
  epicRef: string
  epicSystem: string
  stories?: BacklogStory[]
  functionalRequirements: FunctionalRequirement[]
  nonFunctionalRequirements: string[]
  stages: SpecStage[]
  costTable: CostRow[]
  specialists: Array<{ role: string; level: string; count: number; startDate: string }>
  responsibleCustomer: string
  responsibleCustomerTitle?: string
  responsibleCustomerEmail?: string
  responsibleCustomerPhone?: string
  responsibleContractor: string
  responsibleContractorTitle?: string
  responsibleContractorEmail?: string
  responsibleContractorPhone?: string
  defectDeadlines: { critical: string; high: string; medium: string; low: string }
  totalCost: number
  paymentSchedule?: Array<{ num: number; name: string; date: string; amount: number; basis: string }>
  otherConditions?: string
  editedFields: Record<string, boolean>
}

export interface StaffingRequest {
  id: string
  requestNumber: string
  title: string
  status: RequestStatus
  currentOwner: RequestOwner
  customer: { name: string; unit: string }
  rawInput: string
  structuredRequest: {
    team: TeamMember[]
    duration: string
    startPreference: string
    context: string
    requirements: string[]
  }
  aiAnalysis: AIAnalysis
  contractorOptions: ContractorOption[]
  selectedContractorId?: string
  artifacts: DemoArtifact[]
  specificationDraft?: SpecificationDraft
  backlog?: BacklogEpic
  existingEpicKey?: string
  attachments?: DemoAttachment[]
  znrNumber?: string
  messages: DemoMessage[]
  events: DemoEvent[]
  createdAt: string
  updatedAt: string
  sla?: string
}

export interface DemoState {
  currentRole: AppRole
  request: StaffingRequest | null
  demoStep: number
  chatMessages: Array<{ id: string; role: 'user' | 'ai'; text: string; ts: string }>
  clarificationsAnswered: number
  intakeComplete: boolean
  pendingStaffClarification: string | null
  isDemoCompleted: boolean
  viewingStep: number | null
}

export type DemoAction =
  | { type: 'SET_ROLE'; role: AppRole }
  | { type: 'ADD_CHAT_MESSAGE'; msg: DemoState['chatMessages'][0] }
  | { type: 'ANSWER_CLARIFICATION'; count: number }
  | { type: 'CONFIRM_STRUCTURED_REQUEST' }
  | { type: 'CREATE_TRACKER_TASK_AS_SYSTEM' }
  | { type: 'SUBMIT_TO_STAFF' }
  | { type: 'STAFF_TAKE_OWNERSHIP' }
  | { type: 'STAFF_SEND_CLARIFICATION'; text: string }
  | { type: 'CUSTOMER_ANSWER_CLARIFICATION'; text: string }
  | { type: 'CREATE_TRACKER_TASK' }
  | { type: 'SELECT_CONTRACTOR'; contractorId: string }
  | { type: 'GENERATE_SPEC_DRAFT' }
  | { type: 'UPDATE_SPEC_FIELD'; fieldPath: string; value: string }
  | { type: 'EXPORT_SPEC_DOCX' }
  | { type: 'GENERATE_LK_CONFIG' }
  | { type: 'SEND_TO_LK_APPROVAL' }
  | { type: 'CREATE_ZNR_IN_LK'; approvalRoute: string; approver: string }
  | { type: 'CUSTOMER_SEND_MESSAGE'; text: string }
  | { type: 'STAFF_SEND_MESSAGE'; text: string }
  | { type: 'SEND_TO_CUSTOMER_APPROVAL' }
  | { type: 'CUSTOMER_APPROVE' }
  | { type: 'CUSTOMER_REQUEST_CHANGES'; comment: string }
  | { type: 'COMPLETE_DEMO' }
  | { type: 'SET_VIEWING_STEP'; step: number | null }
  | { type: 'RESET_DEMO' }
  | { type: 'ADVANCE_DEMO_STEP' }
  | { type: 'ADD_ATTACHMENT_TO_CHAT'; attachment: DemoAttachment }
  | { type: 'VOICE_INPUT_TRANSCRIBED'; text: string }
  | { type: 'GENERATE_BACKLOG_DRAFT' }
  | { type: 'VERIFY_EXISTING_TRACKER_TASK'; epicKey: string }
  | { type: 'EDIT_BACKLOG_STORY'; storyId: string; patch: Partial<BacklogStory> }
  | { type: 'CONFIRM_TRACKER_BACKLOG' }
  | { type: 'CREATE_TRACKER_BACKLOG' }
  | { type: 'GENERATE_SPEC_DRAFT_FROM_TEMPLATE' }
  | { type: 'UPDATE_SPEC_TABLE_CELL'; section: string; rowIdx: number; colKey: string; value: string }
