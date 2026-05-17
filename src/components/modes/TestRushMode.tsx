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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import {
  calculateResult,
  createQuizSession,
  getCountOptions,
  getSessionQuestions,
  labelCountOption,
  limitQuestionIds,
  shuffleQuestions,
  touchSession,
} from "@/lib/quiz"
import type { Question, QuizSession } from "@/types/question"

interface TestRushModeProps {
  questions: Question[]
  questionMap: Map<string, Question>
  session: QuizSession | null
  onSessionChange: (session: QuizSession) => void
  onRegisterAnswer: (question: Question, selectedOptionId: string) => void
  onHome: () => void
}

export function TestRushMode({
  questions,
  questionMap,
  session,
  onSessionChange,
  onRegisterAnswer,
  onHome,
}: TestRushModeProps) {
  const activeSession = session?.mode === "test-rush" ? session : null
  const [countOption, setCountOption] = useState<number | "all">(10)
  const countOptions = getCountOptions(questions.length)

  const sessionQuestions = useMemo(
    () => (activeSession ? getSessionQuestions(activeSession, questionMap) : []),
    [activeSession, questionMap]
  )

  function startRush(option: number | "all", sourceQuestions = questions) {
    const shuffled = shuffleQuestions(sourceQuestions)
    const questionIds = limitQuestionIds(shuffled, option)

    onSessionChange(
      createQuizSession({
        mode: "test-rush",
        selectedVariantIds: Array.from(
          new Set(sourceQuestions.map((question) => question.variantId))
        ),
        questionIds,
        settings: {
          questionCount: option,
          mistakesOnly: sourceQuestions.length !== questions.length,
          title: "Тест Раш",
        },
      })
    )
  }

  if (!activeSession) {
    return (
      <Card className="mx-auto max-w-3xl rounded-lg">
        <CardHeader>
          <Badge className="w-fit" variant="secondary">
            Тест Раш
          </Badge>
          <CardTitle className="text-2xl">Случайные вопросы</CardTitle>
          <CardDescription>
            Система перемешает вопросы из всех вариантов.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <RadioGroup
            value={String(countOption)}
            onValueChange={(value) =>
              setCountOption(value === "all" ? "all" : Number(value))
            }
            className="grid gap-3 sm:grid-cols-3"
          >
            {countOptions.map((option) => (
              <label
                key={String(option)}
                htmlFor={`rush-${option}`}
                className="flex cursor-pointer items-center gap-3 rounded-lg border p-3"
              >
                <RadioGroupItem id={`rush-${option}`} value={String(option)} />
                <span>{labelCountOption(option, questions.length)}</span>
              </label>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter>
          <Button onClick={() => startRush(countOption)}>
            <Shuffle data-icon="inline-start" />
            Начать
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (activeSession.status === "completed") {
    const result = calculateResult(activeSession, questionMap)
    const mistakeQuestions = result.mistakes.map((mistake) => mistake.question)

    return (
      <ResultScreen
        title="Результат Тест Раш"
        result={result}
        onHome={onHome}
        onRestart={() =>
          startRush(activeSession.settings?.questionCount ?? "all", questions)
        }
        onRepeatMistakes={
          mistakeQuestions.length > 0
            ? () => startRush("all", mistakeQuestions)
            : undefined
        }
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
          <h1 className="text-2xl font-semibold">Тест Раш</h1>
          <p className="text-sm text-muted-foreground">
            Случайный порядок из всех вариантов.
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
