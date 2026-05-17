import { useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, CheckCircle2, Flag } from "lucide-react"

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import {
  calculateResult,
  createQuizSession,
  getSessionQuestions,
  touchSession,
} from "@/lib/quiz"
import type { Question, QuestionsData, QuizSession } from "@/types/question"

interface VariantModeProps {
  data: QuestionsData
  questionMap: Map<string, Question>
  session: QuizSession | null
  onSessionChange: (session: QuizSession) => void
  onRegisterAnswer: (question: Question, selectedOptionId: string) => void
  onHome: () => void
}

export function VariantMode({
  data,
  questionMap,
  session,
  onSessionChange,
  onRegisterAnswer,
  onHome,
}: VariantModeProps) {
  const activeSession = session?.mode === "variant" ? session : null
  const [selectedVariantId, setSelectedVariantId] = useState(
    data.variants[0]?.id ?? ""
  )

  const sessionQuestions = useMemo(
    () => (activeSession ? getSessionQuestions(activeSession, questionMap) : []),
    [activeSession, questionMap]
  )

  if (!activeSession) {
    return (
      <Card className="mx-auto max-w-3xl rounded-lg">
        <CardHeader>
          <Badge className="w-fit" variant="secondary">
            Вариативная подготовка
          </Badge>
          <CardTitle className="text-2xl">Выберите вариант</CardTitle>
          <CardDescription>
            Система будет давать вопросы строго по порядку.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedVariantId}
            onValueChange={setSelectedVariantId}
            className="grid gap-3 sm:grid-cols-2"
          >
            {data.variants.map((variant) => (
              <label
                key={variant.id}
                htmlFor={variant.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border p-3"
              >
                <RadioGroupItem id={variant.id} value={variant.id} />
                <span className="flex flex-col">
                  <span className="font-medium">{variant.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {variant.questions.length} вопросов
                  </span>
                </span>
              </label>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter>
          <Button
            disabled={!selectedVariantId}
            onClick={() => {
              const variant = data.variants.find(
                (item) => item.id === selectedVariantId
              )

              if (!variant) {
                return
              }

              onSessionChange(
                createQuizSession({
                  mode: "variant",
                  selectedVariantIds: [variant.id],
                  questionIds: variant.questions.map((question) => question.id),
                  settings: { title: variant.title, questionCount: "all" },
                })
              )
            }}
          >
            Начать подготовку
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (activeSession.status === "completed") {
    const result = calculateResult(activeSession, questionMap)

    return (
      <ResultScreen
        title="Результат вариативной подготовки"
        result={result}
        onHome={onHome}
        onRestart={() => {
          const variantId = activeSession.selectedVariantIds[0]
          const variant = data.variants.find((item) => item.id === variantId)

          if (!variant) {
            return
          }

          onSessionChange(
            createQuizSession({
              mode: "variant",
              selectedVariantIds: [variant.id],
              questionIds: variant.questions.map((question) => question.id),
              settings: { title: variant.title, questionCount: "all" },
            })
          )
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

  function goToQuestion(index: number) {
    updateSession({
      ...currentSession,
      currentIndex: Math.min(Math.max(index, 0), sessionQuestions.length - 1),
    })
  }

  function finishSession() {
    updateSession({
      ...currentSession,
      status: "completed",
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
          <h1 className="text-2xl font-semibold">Вариативная подготовка</h1>
          <p className="text-sm text-muted-foreground">
            {currentSession.settings?.title ?? "Выбранный вариант"}
          </p>
        </div>
        <ConfirmDialog
          title="Завершить подготовку?"
          description="Вы увидите итог по уже пройденным вопросам. Неотвеченные вопросы попадут в ошибки результата."
          confirmLabel="Завершить"
          onConfirm={finishSession}
        >
          <Button variant="outline">
            <Flag data-icon="inline-start" />
            Завершить
          </Button>
        </ConfirmDialog>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Быстрый переход</CardTitle>
          <CardDescription>
            Можно вернуться к уже пройденным вопросам внутри варианта.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {sessionQuestions.map((question, index) => (
            <Button
              key={question.id}
              size="sm"
              variant={index === currentSession.currentIndex ? "default" : "outline"}
              onClick={() => goToQuestion(index)}
            >
              {question.number}
            </Button>
          ))}
        </CardContent>
      </Card>

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
