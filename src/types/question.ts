export type PreparationMode =
  | "variant"
  | "test-rush"
  | "variant-rush"
  | "exam"
  | "mistakes"

export type AppView = "home" | "variants" | "search" | PreparationMode

export type SessionStatus = "in-progress" | "completed"

export interface QuestionOption {
  id: string
  label: string
  text: string
  originalLabel?: string
}

export interface RawQuestion {
  id: string
  number: number
  question: string
  options: QuestionOption[]
  correctOption: string
  correctOptionOriginal?: string
  correctAnswer: string
}

export interface Variant {
  id: string
  variantNumber: number
  title: string
  questions: RawQuestion[]
}

export interface QuestionsData {
  schemaVersion?: string
  stats?: {
    variantCount?: number
    questionCount?: number
    questionsPerVariant?: Record<string, number>
  }
  variants: Variant[]
}

export interface Question extends RawQuestion {
  variantId: string
  variantNumber: number
  variantTitle: string
}

export interface QuizSession {
  id: string
  mode: PreparationMode
  status: SessionStatus
  selectedVariantIds: string[]
  questionIds: string[]
  currentIndex: number
  answers: Record<string, string>
  createdAt: number
  updatedAt: number
  settings?: {
    questionCount?: number | "all"
    mistakesOnly?: boolean
    title?: string
  }
}

export interface VariantStats {
  attempts: number
  correct: number
  solvedQuestionIds: string[]
}

export interface StoredStats {
  totalAttempts: number
  totalCorrect: number
  solvedQuestionIds: string[]
  perVariant: Record<string, VariantStats>
}

export interface MistakeRecord {
  questionId: string
  variantId: string
  wrongOptionId: string
  attempts: number
  addedAt: number
  updatedAt: number
}

export interface StoredMistakes {
  records: Record<string, MistakeRecord>
}

export interface ResultMistake {
  question: Question
  selectedOption?: QuestionOption
  correctOption?: QuestionOption
  unanswered: boolean
}

export interface QuizResult {
  total: number
  answered: number
  correct: number
  wrong: number
  unanswered: number
  percentage: number
  mistakes: ResultMistake[]
}
