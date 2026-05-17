import { useMemo } from "react"
import { ArrowLeft, ArrowRight, CheckCircle2, Trash2 } from "lucide-react"

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
import { Separator } from "@/components/ui/separator"
import {
  calculateResult,
  createQuizSession,
  getSessionQuestions,
  shuffleQuestions,
  touchSession,
} from "@/lib/quiz"
import type { Question, QuizSession, StoredMistakes } from "@/types/question"

interface MistakesModeProps {
  mistakes: StoredMistakes
  questionMap: Map<string, Question>
  session: QuizSession | null
  onSessionChange: (session: QuizSession) => void
  onRegisterAnswer: (question: Question, selectedOptionId: string) => void
  onRemoveMistake: (questionId: string) => void
  onClearMistakes: () => void
  onHome: () => void
}

export function MistakesMode({
  mistakes,
  questionMap,
  session,
  onSessionChange,
  onRegisterAnswer,
  onRemoveMistake,
  onClearMistakes,
  onHome,
}: MistakesModeProps) {
  const activeSession = session?.mode === "mistakes" ? session : null
  const mistakeQuestions = useMemo(
    () =>
      Object.values(mistakes.records)
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .map((record) => questionMap.get(record.questionId))
        .filter((question): question is Question => Boolean(question)),
    [mistakes.records, questionMap]
  )
  const sessionQuestions = useMemo(
    () => (activeSession ? getSessionQuestions(activeSession, questionMap) : []),
    [activeSession, questionMap]
  )

  function startMistakes(sourceQuestions = mistakeQuestions) {
    onSessionChange(
      createQuizSession({
        mode: "mistakes",
        selectedVariantIds: Array.from(
          new Set(sourceQuestions.map((question) => question.variantId))
        ),
        questionIds: shuffleQuestions(sourceQuestions).map((question) => question.id),
        settings: {
          questionCount: "all",
          mistakesOnly: true,
          title: "Работа над ошибками",
        },
      })
    )
  }

  if (!activeSession) {
    if (mistakeQuestions.length === 0) {
      return (
        <Card className="mx-auto max-w-3xl rounded-lg">
          <CardHeader>
            <Badge className="w-fit" variant="secondary">
              Работа над ошибками
            </Badge>
            <CardTitle className="text-2xl">Ошибок пока нет</CardTitle>
            <CardDescription>
              Как только вы ошибётесь в любом режиме, вопрос появится здесь.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={onHome}>
              На главную
            </Button>
          </CardFooter>
        </Card>
      )
    }

    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <Card className="rounded-lg">
          <CardHeader>
            <Badge className="w-fit" variant="secondary">
              Работа над ошибками
            </Badge>
            <CardTitle className="text-2xl">Ошибочные вопросы</CardTitle>
            <CardDescription>
              Всего в списке: {mistakeQuestions.length}. Можно пройти только их.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {mistakeQuestions.map((question) => (
              <article key={question.id} className="rounded-lg border p-4">
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge variant="secondary">Вариант {question.variantNumber}</Badge>
                  <Badge variant="outline">Вопрос {question.number}</Badge>
                </div>
                <p className="font-medium">{question.question}</p>
              </article>
            ))}
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            <Button onClick={() => startMistakes()}>Пройти ошибки</Button>
            <ConfirmDialog
              title="Очистить ошибки?"
              description="Список ошибочных вопросов будет удалён из localStorage."
              confirmLabel="Очистить"
              destructive
              onConfirm={onClearMistakes}
            >
              <Button variant="outline">
                <Trash2 data-icon="inline-start" />
                Очистить ошибки
              </Button>
            </ConfirmDialog>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (activeSession.status === "completed") {
    const result = calculateResult(activeSession, questionMap)

    return (
      <ResultScreen
        title="Результат работы над ошибками"
        result={result}
        onHome={onHome}
        onRestart={() => startMistakes(sessionQuestions)}
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
  const answeredCorrectly = selectedAnswer === currentQuestion.correctOption
  const isStillMistake = Boolean(mistakes.records[currentQuestion.id])

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
          <h1 className="text-2xl font-semibold">Работа над ошибками</h1>
          <p className="text-sm text-muted-foreground">
            Правильный ответ можно убрать из списка ошибок.
          </p>
        </div>
        <ConfirmDialog
          title="Очистить ошибки?"
          description="Список ошибочных вопросов будет удалён из localStorage."
          confirmLabel="Очистить"
          destructive
          onConfirm={onClearMistakes}
        >
          <Button variant="outline">
            <Trash2 data-icon="inline-start" />
            Очистить ошибки
          </Button>
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

      {answeredCorrectly && isStillMistake ? (
        <Alert>
          <AlertTitle>Ошибка закрыта</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>Ответ верный. Теперь вопрос можно удалить из списка ошибок.</span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onRemoveMistake(currentQuestion.id)}
            >
              Удалить из ошибок
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

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
