import { useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, FileCheck2 } from "lucide-react"

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
import { Separator } from "@/components/ui/separator"
import {
  calculateResult,
  createQuizSession,
  getQuestionsByVariants,
  getSessionQuestions,
  touchSession,
} from "@/lib/quiz"
import type { Question, QuestionsData, QuizSession } from "@/types/question"

interface ExamModeProps {
  data: QuestionsData
  questions: Question[]
  questionMap: Map<string, Question>
  session: QuizSession | null
  onSessionChange: (session: QuizSession) => void
  onRegisterAnswer: (question: Question, selectedOptionId: string) => void
  onHome: () => void
}

export function ExamMode({
  data,
  questions,
  questionMap,
  session,
  onSessionChange,
  onRegisterAnswer,
  onHome,
}: ExamModeProps) {
  const activeSession = session?.mode === "exam" ? session : null
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([])

  const selectedQuestions = useMemo(
    () => getQuestionsByVariants(questions, selectedVariantIds),
    [questions, selectedVariantIds]
  )
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

  if (!activeSession) {
    return (
      <Card className="mx-auto max-w-4xl rounded-lg">
        <CardHeader>
          <Badge className="w-fit" variant="secondary">
            Экзамен
          </Badge>
          <CardTitle className="text-2xl">Выберите варианты</CardTitle>
          <CardDescription>
            Ответы можно менять до завершения. Подсказки появятся только в конце.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.variants.map((variant) => (
              <label
                key={variant.id}
                htmlFor={`exam-${variant.id}`}
                className="flex cursor-pointer items-center gap-3 rounded-lg border p-3"
              >
                <Checkbox
                  id={`exam-${variant.id}`}
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
              <AlertTitle>Выберите хотя бы один вариант</AlertTitle>
              <AlertDescription>
                Экзамен соберётся из всех вопросов выбранных вариантов.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertTitle>Готово к старту</AlertTitle>
              <AlertDescription>
                В экзамене будет {selectedQuestions.length} вопросов.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button
            disabled={selectedVariantIds.length === 0}
            onClick={() => {
              onSessionChange(
                createQuizSession({
                  mode: "exam",
                  selectedVariantIds,
                  questionIds: selectedQuestions.map((question) => question.id),
                  settings: { questionCount: "all", title: "Экзамен" },
                })
              )
            }}
          >
            <FileCheck2 data-icon="inline-start" />
            Начать экзамен
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (activeSession.status === "completed") {
    const result = calculateResult(activeSession, questionMap)

    return (
      <ResultScreen
        title="Результат экзамена"
        result={result}
        onHome={onHome}
        onRestart={() => {
          const sourceQuestions = getQuestionsByVariants(
            questions,
            activeSession.selectedVariantIds
          )

          onSessionChange(
            createQuizSession({
              mode: "exam",
              selectedVariantIds: activeSession.selectedVariantIds,
              questionIds: sourceQuestions.map((question) => question.id),
              settings: { questionCount: "all", title: "Экзамен" },
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

  function updateSession(next: QuizSession) {
    onSessionChange(touchSession(next))
  }

  function goToQuestion(index: number) {
    updateSession({
      ...currentSession,
      currentIndex: Math.min(Math.max(index, 0), sessionQuestions.length - 1),
    })
  }

  function finishExam() {
    Object.entries(currentSession.answers).forEach(([questionId, optionId]) => {
      const question = questionMap.get(questionId)

      if (question) {
        onRegisterAnswer(question, optionId)
      }
    })

    updateSession({
      ...currentSession,
      status: "completed",
    })
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Экзамен</h1>
          <p className="text-sm text-muted-foreground">
            Проверка появится только после завершения.
          </p>
        </div>
        <ConfirmDialog
          title="Завершить экзамен?"
          description="После завершения ответы будут проверены, а статистика обновится. Вернуться к изменению ответов уже нельзя."
          confirmLabel="Завершить экзамен"
          onConfirm={finishExam}
        >
          <Button>
            <FileCheck2 data-icon="inline-start" />
            Завершить экзамен
          </Button>
        </ConfirmDialog>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Навигация по вопросам</CardTitle>
          <CardDescription>
            Отвеченные вопросы отмечены заливкой. Ответ можно изменить.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {sessionQuestions.map((question, index) => (
            <Button
              key={question.id}
              size="sm"
              variant={
                index === currentSession.currentIndex
                  ? "default"
                  : currentSession.answers[question.id]
                    ? "secondary"
                    : "outline"
              }
              onClick={() => goToQuestion(index)}
            >
              {index + 1}
            </Button>
          ))}
        </CardContent>
      </Card>

      <QuestionCard
        question={currentQuestion}
        selectedOptionId={currentSession.answers[currentQuestion.id]}
        currentIndex={currentSession.currentIndex}
        total={sessionQuestions.length}
        revealAnswer={false}
        locked={false}
        onSelect={(optionId) => {
          updateSession({
            ...currentSession,
            answers: {
              ...currentSession.answers,
              [currentQuestion.id]: optionId,
            },
          })
        }}
        onEnter={() => {
          if (currentSession.currentIndex < sessionQuestions.length - 1) {
            goToQuestion(currentSession.currentIndex + 1)
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
        <Button
          variant="outline"
          disabled={currentSession.currentIndex === sessionQuestions.length - 1}
          onClick={() => goToQuestion(currentSession.currentIndex + 1)}
        >
          Дальше
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>
    </div>
  )
}
