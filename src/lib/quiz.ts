import type {
  PreparationMode,
  Question,
  QuestionsData,
  QuizResult,
  QuizSession,
  RawQuestion,
  Variant,
} from "@/types/question"

const countChoices = [10, 20, 30, 50]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function assertString(value: unknown, message: string): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(message)
  }
}

function assertNumber(value: unknown, message: string): asserts value is number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(message)
  }
}

function validateQuestion(value: unknown, variantTitle: string): RawQuestion {
  if (!isRecord(value)) {
    throw new Error(`Некорректный вопрос в ${variantTitle}`)
  }

  assertString(value.id, `У вопроса в ${variantTitle} нет id`)
  assertNumber(value.number, `У вопроса ${value.id} нет номера`)
  assertString(value.question, `У вопроса ${value.id} нет текста`)
  assertString(value.correctOption, `У вопроса ${value.id} нет correctOption`)
  assertString(value.correctAnswer, `У вопроса ${value.id} нет correctAnswer`)

  if (!Array.isArray(value.options) || value.options.length === 0) {
    throw new Error(`У вопроса ${value.id} нет вариантов ответа`)
  }

  const options = value.options.map((option, index) => {
    if (!isRecord(option)) {
      throw new Error(`Ответ ${index + 1} у вопроса ${value.id} некорректен`)
    }

    assertString(option.id, `У ответа ${index + 1} вопроса ${value.id} нет id`)
    assertString(option.label, `У ответа ${option.id} вопроса ${value.id} нет label`)
    assertString(option.text, `У ответа ${option.id} вопроса ${value.id} нет text`)

    return {
      id: option.id,
      label: option.label,
      text: option.text,
      originalLabel:
        typeof option.originalLabel === "string" ? option.originalLabel : undefined,
    }
  })

  if (!options.some((option) => option.id === value.correctOption)) {
    throw new Error(`correctOption вопроса ${value.id} не найден среди options`)
  }

  return {
    id: value.id,
    number: value.number,
    question: value.question,
    options,
    correctOption: value.correctOption,
    correctOptionOriginal:
      typeof value.correctOptionOriginal === "string"
        ? value.correctOptionOriginal
        : undefined,
    correctAnswer: value.correctAnswer,
  }
}

function validateVariant(value: unknown): Variant {
  if (!isRecord(value)) {
    throw new Error("Некорректная запись варианта")
  }

  assertString(value.id, "У варианта нет id")
  assertNumber(value.variantNumber, `У варианта ${value.id} нет variantNumber`)
  assertString(value.title, `У варианта ${value.id} нет title`)

  const title = value.title

  if (!Array.isArray(value.questions) || value.questions.length === 0) {
    throw new Error(`В варианте ${title} нет вопросов`)
  }

  return {
    id: value.id,
    variantNumber: value.variantNumber,
    title,
    questions: value.questions.map((question) => validateQuestion(question, title)),
  }
}

export function validateQuestionsData(raw: unknown): QuestionsData {
  if (!isRecord(raw) || !Array.isArray(raw.variants)) {
    throw new Error("questions.json должен содержать массив variants")
  }

  return {
    schemaVersion:
      typeof raw.schemaVersion === "string" ? raw.schemaVersion : undefined,
    stats: isRecord(raw.stats) ? (raw.stats as QuestionsData["stats"]) : undefined,
    variants: raw.variants.map(validateVariant),
  }
}

export function getAllQuestions(data: QuestionsData): Question[] {
  return data.variants.flatMap((variant) =>
    variant.questions.map((question) => ({
      ...question,
      variantId: variant.id,
      variantNumber: variant.variantNumber,
      variantTitle: variant.title,
    }))
  )
}

export function getQuestionMap(questions: Question[]) {
  return new Map(questions.map((question) => [question.id, question]))
}

export function getQuestionsByVariants(
  questions: Question[],
  variantIds: string[]
): Question[] {
  const selected = new Set(variantIds)
  return questions.filter((question) => selected.has(question.variantId))
}

export function shuffleQuestions<T>(items: T[]): T[] {
  const shuffled = [...items]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const current = shuffled[index]
    shuffled[index] = shuffled[randomIndex]
    shuffled[randomIndex] = current
  }

  return shuffled
}

export function getCountOptions(total: number): Array<number | "all"> {
  const available = countChoices.filter((count) => count < total)
  return [...available, "all"]
}

export function labelCountOption(option: number | "all", total: number): string {
  return option === "all" ? `Все ${total}` : String(option)
}

export function limitQuestionIds(
  questions: Question[],
  option: number | "all"
): string[] {
  const ids = questions.map((question) => question.id)
  return option === "all" ? ids : ids.slice(0, option)
}

export function createQuizSession(params: {
  mode: PreparationMode
  selectedVariantIds: string[]
  questionIds: string[]
  currentIndex?: number
  settings?: QuizSession["settings"]
}): QuizSession {
  const now = Date.now()

  return {
    id: `${params.mode}-${now.toString(36)}`,
    mode: params.mode,
    status: "in-progress",
    selectedVariantIds: params.selectedVariantIds,
    questionIds: params.questionIds,
    currentIndex: params.currentIndex ?? 0,
    answers: {},
    createdAt: now,
    updatedAt: now,
    settings: params.settings,
  }
}

export function touchSession(session: QuizSession): QuizSession {
  return {
    ...session,
    updatedAt: Date.now(),
  }
}

export function getSessionQuestions(
  session: QuizSession,
  questionMap: Map<string, Question>
): Question[] {
  return session.questionIds
    .map((questionId) => questionMap.get(questionId))
    .filter((question): question is Question => Boolean(question))
}

export function calculateResult(
  session: QuizSession,
  questionMap: Map<string, Question>
): QuizResult {
  const questions = getSessionQuestions(session, questionMap)
  let correct = 0
  let answered = 0

  const mistakes = questions.flatMap((question) => {
    const answerId = session.answers[question.id]
    const selectedOption = question.options.find((option) => option.id === answerId)
    const correctOption = question.options.find(
      (option) => option.id === question.correctOption
    )

    if (!answerId) {
      return [{ question, correctOption, unanswered: true }]
    }

    answered += 1

    if (answerId === question.correctOption) {
      correct += 1
      return []
    }

    return [{ question, selectedOption, correctOption, unanswered: false }]
  })

  const total = questions.length
  const wrong = total - correct

  return {
    total,
    answered,
    correct,
    wrong,
    unanswered: total - answered,
    percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
    mistakes,
  }
}
