import { useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, CheckCircle2, Shuffle } from "lucide-react"

import { ConfirmDialog } from "@/components/ConfirmDialog"
import { QuestionCard } from "@/components/QuestionCard"
import { ResultScreen } from "@/components/ResultScreen"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import {
  calculateResult,
  createQuizSession,
  getCountOptions,
  getQuestionsByVariants,
  getSessionQuestions,
  labelCountOption,
  limitQuestionIds,
  shuffleQuestions,
  touchSession,
} from "@/lib/quiz"
import type { Question, QuestionsData, QuizSession } from "@/types/question"

interface VariantRushModeProps {
  data: QuestionsData
  questions: Question[]
  questionMap: Map<string, Question>
  session: QuizSession | null
  onSessionChange: (session: QuizSession) => void
  onRegisterAnswer: (question: Question, selectedOptionId: string) => void
  onHome: () => void
}

export function VariantRushMode({
  data,
  questions,
  questionMap,
  session,
  onSessionChange,
  onRegisterAnswer,
  onHome,
}: VariantRushModeProps) {
  const activeSession = session?.mode === "variant-rush" ? session : null
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([])
  const [countOption, setCountOption] = useState<number | "all">("all")

  const selectedQuestions = useMemo(
    () => getQuestionsByVariants(questions, selectedVariantIds),
    [questions, selectedVariantIds]
  )
  const countOptions = getCountOptions(selectedQuestions.length)
  const sessionQuestions = useMemo(
    () => (activeSession ? getSessionQuestions(activeSession, questionMap) : []),
    [activeSession, questionMap]
  )

  function toggleVariant(variantId: string, checked: boolean) {
    setSelectedVariantIds((current) =>
      checked
        ? Array.from(new Set([...current, variantId]))
        : current.filter((id) => id !== variantId)
    )
  }

  function startRush(option: number | "all", sourceQuestions = selectedQuestions) {
    const shuffled = shuffleQuestions(sourceQuestions)

    onSessionChange(
      createQuizSession({
        mode: "variant-rush",
        selectedVariantIds: Array.from(
          new Set(sourceQuestions.map((question) => question.variantId))
        ),
        questionIds: limitQuestionIds(shuffled, option),
        settings: { questionCount: option, title: "Раш вариантов" },
      })
    )
  }

  if (!activeSession) {
    return (
      <Card className="mx-auto max-w-4xl rounded-lg">
        <CardHeader>
          <Badge className="w-fit" variant="secondary">
            Раш вариантов
          </Badge>
          <CardTitle className="text-2xl">Выберите варианты</CardTitle>
          <CardDescription>
            Вопросы из выбранных вариантов будут перемешаны.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.variants.map((variant) => (
              <label
                key={variant.id}
                htmlFor={`variant-rush-${variant.id}`}
                className="flex cursor-pointer items-center gap-3 rounded-lg border p-3"
              >
                <Checkbox
                  id={`variant-rush-${variant.id}`}
                  checked={selectedVariantIds.includes(variant.id)}
                  onCheckedChange={(checked) =>
                    toggleVariant(variant.id, checked === true)
                  }
                />
                <span className="flex flex-col">
                  <span className="font-medium">{variant.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {variant.questions.length} вопросов
                  </span>
                </span>
              </label>
            ))}
          </div>

          {selectedVariantIds.length === 0 ? (
            <Alert>
              <AlertTitle>Пока ничего не выбрано</AlertTitle>
              <AlertDescription>
                Отметьте один или несколько вариантов, чтобы собрать тренировку.
              </AlertDescription>
            </Alert>
          ) : (
            <RadioGroup
              value={String(countOption)}
              onValueChange={(value) =>
                setCountOption(value === "all" ? "all" : Number(value))
              }
              className="grid gap-3 sm:grid-cols-4"
            >
              {countOptions.map((option) => (
                <label
                  key={String(option)}
                  htmlFor={`variant-rush-count-${option}`}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border p-3"
                >
                  <RadioGroupItem
                    id={`variant-rush-count-${option}`}
                    value={String(option)}
                  />
                  <span>{labelCountOption(option, selectedQuestions.length)}</span>
                </label>
              ))}
            </RadioGroup>
          )}
        </CardContent>
        <CardFooter>
          <Button
            disabled={selectedVariantIds.length === 0}
            onClick={() => startRush(countOption)}
          >
            <Shuffle data-icon="inline-start" />
            Начать
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (activeSession.status === "completed") {
    const result = calculateResult(activeSession, questionMap)

    return (
      <ResultScreen
        title="Результат раша вариантов"
        result={result}
        onHome={onHome}
        onRestart={() => {
          const sourceQuestions = getQuestionsByVariants(
            questions,
            activeSession.selectedVariantIds
          )
          startRush(activeSession.settings?.questionCount ?? "all", sourceQuestions)
        }}
      />
    )
  }

  const currentSession = activeSession!
  const currentQuestion = sessionQuestions[currentSession.currentIndex]

  if (!currentQuestion) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Сессия повреждена</AlertTitle>
        <AlertDescription>
          Не удалось найти текущий вопрос. Вернитесь на главную и начните заново.
        </AlertDescription>
      </Alert>
    )
  }

  const selectedAnswer = currentSession.answers[currentQuestion.id]
  const isLastQuestion = currentSession.currentIndex === sessionQuestions.length - 1

  function updateSession(next: QuizSession) {
    onSessionChange(touchSession(next))
  }

  function finishSession() {
    updateSession({
      ...currentSession,
      status: "completed",
    })
  }

  function goToQuestion(index: number) {
    updateSession({
      ...currentSession,
      currentIndex: Math.min(Math.max(index, 0), sessionQuestions.length - 1),
    })
  }

  function goNext() {
    if (isLastQuestion) {
      finishSession()
      return
    }

    goToQuestion(currentSession.currentIndex + 1)
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Раш вариантов</h1>
          <p className="text-sm text-muted-foreground">
            Случайные вопросы только из выбранных вариантов.
          </p>
        </div>
        <ConfirmDialog
          title="Завершить сессию?"
          description="Результат будет рассчитан по текущим ответам."
          confirmLabel="Завершить"
          onConfirm={finishSession}
        >
          <Button variant="outline">Завершить</Button>
        </ConfirmDialog>
      </div>

      <QuestionCard
        question={currentQuestion}
        selectedOptionId={selectedAnswer}
        currentIndex={currentSession.currentIndex}
        total={sessionQuestions.length}
        revealAnswer={Boolean(selectedAnswer)}
        locked
        onSelect={(optionId) => {
          if (currentSession.answers[currentQuestion.id]) {
            return
          }

          onRegisterAnswer(currentQuestion, optionId)
          updateSession({
            ...currentSession,
            answers: {
              ...currentSession.answers,
              [currentQuestion.id]: optionId,
            },
          })
        }}
        onEnter={() => {
          if (selectedAnswer) {
            goNext()
          }
        }}
      />

      <Separator />

      <div className="flex flex-wrap justify-between gap-2">
        <Button
          variant="outline"
          disabled={currentSession.currentIndex === 0}
          onClick={() => goToQuestion(currentSession.currentIndex - 1)}
        >
          <ArrowLeft data-icon="inline-start" />
          Назад
        </Button>
        <Button disabled={!selectedAnswer} onClick={goNext}>
          {isLastQuestion ? (
            <>
              <CheckCircle2 data-icon="inline-start" />
              Завершить
            </>
          ) : (
            <>
              Дальше
              <ArrowRight data-icon="inline-end" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
