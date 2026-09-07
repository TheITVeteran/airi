export type InferenceEvent
  = | { type: 'connected', at: number }
    | { type: 'reasoning', text: string, visibility: 'hidden' | 'visible', at: number }
    | { type: 'answer', text: string, at: number }
    | { type: 'special', token: string, at: number }
    | { type: 'tool', phase: 'start' | 'end', at: number }
    | { type: 'finish', reason?: string, at: number }
    | { type: 'error', error: unknown, at: number }
    | { type: 'aside-cue', candidate: AsideCandidate, at: number }

export type ThinkingCategory = 'analytical' | 'memory' | 'emotional' | 'uncertain' | 'generic'

export type PacingState
  = | 'IDLE'
    | 'DISPATCHED'
    | 'STAGING'
    | 'ANSWER_READY'
    | 'FILLER_ARMED'
    | 'FILLER_ACTIVE'
    | 'HANDOFF'
    | 'SETTLED'

export type TurnPhase = 'waiting' | 'answering' | 'draining' | 'canceled' | 'settled'

export type AttemptPhase = 'preparing' | 'ready' | 'committed' | 'playing' | 'ended' | 'discarded'

export interface AsideCandidate {
  cueId: string
  turn: {
    turnId: string
    sessionId?: string
    generation: number
  }
  source: 'explicit' | 'organic'
  text: string
  phraseKey: string
  collectedAtMs: number
  expiresAtMs: number
}

export interface PacingTurnState {
  phase: TurnPhase
  pacingClosed: boolean
  terminalSeen: boolean
  committedCount: number
  spokenCount: number
  attemptsMade: number
  nextEligibleAtMs?: number
  activeAttemptId?: string
  pendingCueId?: string
}

export interface PacingStateLogEntry {
  timestampMs: number
  relTimeMs: number
  state: PacingState
  event: string
  details?: string
}

export type CacheMissFailureReason = 'cache_not_found' | 'synthesis_timeout' | 'synthesis_failed' | 'decode_failed'

export interface CacheMissDetails {
  reason?: CacheMissFailureReason | string
  error?: string
  elapsedMs?: number
}

export interface PacingMetrics {
  turnId: string
  providerKey: string
  ttftMs?: number
  deadlineMs: number
  fillerCandidate?: ThinkingCategory
  fillerOutcome: 'none' | 'cache-miss' | 'canceled' | 'played' | 'rejected'
  fillerStartMs?: number
  fillerEndMs?: number
  answerFirstAudioMs?: number
  handoffGapMs?: number
  interrupted: boolean
  fillersSpokenCount?: number
  categoriesSpoken?: ThinkingCategory[]
  committedCount?: number
  spokenCount?: number
  pacingClosed?: boolean
  cutoffReason?: string
  cacheMissReason?: string
  cacheMissError?: string
  prepareLatencyMs?: number
  dynamicCueSource?: 'explicit' | 'organic'
  stateLog?: PacingStateLogEntry[]
  liveState?: PacingState
  nextOpportunityCountdownSec?: number
  maxFillers?: number
}

export interface PacingPlaybackMeta {
  turnId: string
  role: 'thinking-filler' | 'assistant-answer'
  generation: number
  attemptId?: string
}

export interface Clock {
  now: () => number
  setTimeout: (fn: () => void, delayMs: number) => any
  clearTimeout: (timerId: any) => void
}

export interface PacingPolicyConfig {
  enabled: boolean
  armMinMs: number
  armMaxMs: number
  maxFillerDurationMs: number
  reasoningWindowMs: number
  categoryThreshold: number
  kFast?: number
  maxFillersPerTurn?: number
  pacingIntervalMs?: number
  dynamicAsidesEnabled?: boolean
  semanticExtractorEnabled?: boolean
  dynamicAfterMs?: number
  candidateTtlMs?: number
  maxFillerSynthesisBudgetMs?: number
  maxSynthesisBudgetMs?: number
  pacingProfile?: PacingProfileId
  experimentalOrganicPivots?: boolean
}

export type PacingProfileId = 'snappy' | 'balanced' | 'deep_cot' | 'custom'

export interface PacingProfileSettings {
  armMinMs: number
  armMaxMs: number
  maxFillerDurationMs: number
  pacingIntervalMs: number
  maxFillersPerTurn: number
  maxSynthesisBudgetMs: number
  maxFillerSynthesisBudgetMs: number
  dynamicAsidesEnabled: boolean
  semanticExtractorEnabled: boolean
  dynamicAfterMs: number
  candidateTtlMs: number
}

export interface PacingProfileConfig {
  id: Exclude<PacingProfileId, 'custom'>
  label: string
  subtitle: string
  icon: string
  targetTurnDescription: string
  settings: PacingProfileSettings
}

export const PACING_PROFILES: Record<Exclude<PacingProfileId, 'custom'>, PacingProfileConfig> = {
  snappy: {
    id: 'snappy',
    label: 'Snappy Chat',
    subtitle: 'Fast 2–5s TTFT',
    icon: 'i-solar:bolt-bold-duotone',
    targetTurnDescription: 'Standard chat models, fast banter (Gemini Flash, Haiku, small local LLMs)',
    settings: {
      armMinMs: 800,
      armMaxMs: 2500,
      maxFillerDurationMs: 1800,
      pacingIntervalMs: 8000,
      maxFillersPerTurn: 2,
      maxSynthesisBudgetMs: 2000,
      maxFillerSynthesisBudgetMs: 2000,
      dynamicAsidesEnabled: false,
      semanticExtractorEnabled: false,
      dynamicAfterMs: 8000,
      candidateTtlMs: 8000,
    },
  },
  balanced: {
    id: 'balanced',
    label: 'Balanced',
    subtitle: 'Everyday 10–25s CoT',
    icon: 'i-solar:scale-bold-duotone',
    targetTurnDescription: 'Everyday reasoning models (DeepSeek 4 Pro, GPT-4o, Sonnet 3.5, Gemini Pro)',
    settings: {
      armMinMs: 1200,
      armMaxMs: 3500,
      maxFillerDurationMs: 3000,
      pacingIntervalMs: 15000,
      maxFillersPerTurn: 3,
      maxSynthesisBudgetMs: 3200,
      maxFillerSynthesisBudgetMs: 3200,
      dynamicAsidesEnabled: true,
      semanticExtractorEnabled: true,
      dynamicAfterMs: 15000,
      candidateTtlMs: 15000,
    },
  },
  deep_cot: {
    id: 'deep_cot',
    label: 'Deep CoT Explorer',
    subtitle: 'Extended 40–90s CoT',
    icon: 'i-solar:atom-bold-duotone',
    targetTurnDescription: 'Heavy chain-of-thought models (Kimi k3, DeepSeek R1, Glyph Deep CoT)',
    settings: {
      armMinMs: 1500,
      armMaxMs: 4000,
      maxFillerDurationMs: 4800,
      pacingIntervalMs: 18000,
      maxFillersPerTurn: 5,
      maxSynthesisBudgetMs: 5000,
      maxFillerSynthesisBudgetMs: 5000,
      dynamicAsidesEnabled: true,
      semanticExtractorEnabled: true,
      dynamicAfterMs: 15000,
      candidateTtlMs: 20000,
    },
  },
}

export function detectActivePacingProfile(settings: Partial<PacingProfileSettings>): PacingProfileId {
  for (const profile of Object.values(PACING_PROFILES)) {
    const s = profile.settings
    if (
      settings.maxFillerDurationMs === s.maxFillerDurationMs
      && settings.pacingIntervalMs === s.pacingIntervalMs
      && settings.maxFillersPerTurn === s.maxFillersPerTurn
      && settings.maxSynthesisBudgetMs === s.maxSynthesisBudgetMs
      && settings.dynamicAsidesEnabled === s.dynamicAsidesEnabled
      && settings.semanticExtractorEnabled === s.semanticExtractorEnabled
    ) {
      return profile.id
    }
  }
  return 'custom'
}

export interface ThinkingFillerPhrase {
  text: string
  category: ThinkingCategory
  enabled: boolean
}

export const DEFAULT_PACING_FILLERS: ThinkingFillerPhrase[] = [
  { text: 'Hmm...', category: 'generic', enabled: true },
  { text: 'Let me see...', category: 'generic', enabled: true },
  { text: 'Let me think about that...', category: 'generic', enabled: true },
  { text: 'Working through the steps...', category: 'analytical', enabled: true },
  { text: 'Let me calculate that...', category: 'analytical', enabled: true },
  { text: 'Let me think back...', category: 'memory', enabled: true },
  { text: 'Recalling earlier details...', category: 'memory', enabled: true },
  { text: 'I hear you, taking that in...', category: 'emotional', enabled: true },
  { text: 'Hmm, that is a tricky one...', category: 'uncertain', enabled: true },
]

export const DEFAULT_PACING_POLICY: PacingPolicyConfig = {
  enabled: false,
  armMinMs: 900,
  armMaxMs: 3500,
  maxFillerDurationMs: 3000,
  reasoningWindowMs: 900,
  categoryThreshold: 2,
  kFast: 0.5,
  maxFillersPerTurn: 3,
  pacingIntervalMs: 15000,
  dynamicAsidesEnabled: false,
  semanticExtractorEnabled: false,
  dynamicAfterMs: 15000,
  candidateTtlMs: 15000,
  maxFillerSynthesisBudgetMs: 3200,
  maxSynthesisBudgetMs: 3200,
  pacingProfile: 'balanced',
  experimentalOrganicPivots: false,
}
