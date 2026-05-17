import type {
  MistakeRecord,
  Question,
  QuizSession,
  StoredMistakes,
  StoredStats,
  VariantStats,
} from "@/types/question"

const sessionKey = "gos-helper.session.v1"
const statsKey = "gos-helper.stats.v1"
const mistakesKey = "gos-helper.mistakes.v1"
const themeKey = "gos-helper.theme.v1"

export type ThemeMode = "light" | "dark"

const emptyStats: StoredStats = {
  totalAttempts: 0,
  totalCorrect: 0,
  solvedQuestionIds: [],
  perVariant: {},
}

const emptyMistakes: StoredMistakes = {
  records: {},
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) {
    return fallback
  }

  try {
    const stored = window.localStorage.getItem(key)
    return stored ? (JSON.parse(stored) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

function unique(values: string[]) {
  return Array.from(new Set(values))
}

function normalizeVariantStats(value?: Partial<VariantStats>): VariantStats {
  return {
    attempts: value?.attempts ?? 0,
    correct: value?.correct ?? 0,
    solvedQuestionIds: Array.isArray(value?.solvedQuestionIds)
      ? unique(value.solvedQuestionIds)
      : [],
  }
}

export function loadSession(): QuizSession | null {
  const session = readJson<QuizSession | null>(sessionKey, null)

  if (!session || !Array.isArray(session.questionIds) || !session.mode) {
    return null
  }

  return session
}

export function saveSession(session: QuizSession) {
  writeJson(sessionKey, session)
}

export function clearSession() {
  if (canUseStorage()) {
    window.localStorage.removeItem(sessionKey)
  }
}

export function loadStats(): StoredStats {
  const stats = readJson<StoredStats>(statsKey, emptyStats)
  const perVariant = Object.fromEntries(
    Object.entries(stats.perVariant ?? {}).map(([variantId, value]) => [
      variantId,
      normalizeVariantStats(value),
    ])
  )

  return {
    totalAttempts: stats.totalAttempts ?? 0,
    totalCorrect: stats.totalCorrect ?? 0,
    solvedQuestionIds: Array.isArray(stats.solvedQuestionIds)
      ? unique(stats.solvedQuestionIds)
      : [],
    perVariant,
  }
}

export function saveStats(stats: StoredStats) {
  writeJson(statsKey, stats)
}

export function loadMistakes(): StoredMistakes {
  const mistakes = readJson<StoredMistakes>(mistakesKey, emptyMistakes)
  return {
    records: isMistakeRecordMap(mistakes.records) ? mistakes.records : {},
  }
}

function isMistakeRecordMap(value: unknown): value is Record<string, MistakeRecord> {
  return typeof value === "object" && value !== null
}

export function saveMistakes(mistakes: StoredMistakes) {
  writeJson(mistakesKey, mistakes)
}

export function recordAnswerInStats(
  stats: StoredStats,
  question: Question,
  selectedOptionId: string
): StoredStats {
  const variantStats = normalizeVariantStats(stats.perVariant[question.variantId])
  const correct = selectedOptionId === question.correctOption

  return {
    totalAttempts: stats.totalAttempts + 1,
    totalCorrect: stats.totalCorrect + (correct ? 1 : 0),
    solvedQuestionIds: unique([...stats.solvedQuestionIds, question.id]),
    perVariant: {
      ...stats.perVariant,
      [question.variantId]: {
        attempts: variantStats.attempts + 1,
        correct: variantStats.correct + (correct ? 1 : 0),
        solvedQuestionIds: unique([...variantStats.solvedQuestionIds, question.id]),
      },
    },
  }
}

export function recordMistake(
  mistakes: StoredMistakes,
  question: Question,
  wrongOptionId: string
): StoredMistakes {
  if (wrongOptionId === question.correctOption) {
    return mistakes
  }

  const now = Date.now()
  const current = mistakes.records[question.id]

  return {
    records: {
      ...mistakes.records,
      [question.id]: {
        questionId: question.id,
        variantId: question.variantId,
        wrongOptionId,
        attempts: (current?.attempts ?? 0) + 1,
        addedAt: current?.addedAt ?? now,
        updatedAt: now,
      },
    },
  }
}

export function removeMistake(
  mistakes: StoredMistakes,
  questionId: string
): StoredMistakes {
  const nextRecords = { ...mistakes.records }
  delete nextRecords[questionId]
  return { records: nextRecords }
}

export function clearMistakes() {
  saveMistakes(emptyMistakes)
}

export function loadTheme(): ThemeMode {
  const theme = readJson<ThemeMode>(themeKey, "light")
  return theme === "dark" ? "dark" : "light"
}

export function saveTheme(theme: ThemeMode) {
  writeJson(themeKey, theme)
}

export function resetAllStorage() {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.removeItem(sessionKey)
  window.localStorage.removeItem(statsKey)
  window.localStorage.removeItem(mistakesKey)
}
