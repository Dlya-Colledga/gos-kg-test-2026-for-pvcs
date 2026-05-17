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
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import type { QuizResult } from "@/types/question"

interface ResultScreenProps {
  title: string
  result: QuizResult
  restartLabel?: string
  onRestart?: () => void
  onHome: () => void
  onRepeatMistakes?: () => void
}

export function ResultScreen({
  title,
  result,
  restartLabel = "Пройти заново",
  onRestart,
  onHome,
  onRepeatMistakes,
}: ResultScreenProps) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>
            Итог по сессии: {result.correct} правильных из {result.total}.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Правильно</p>
              <p className="text-3xl font-semibold">{result.correct}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Ошибки</p>
              <p className="text-3xl font-semibold">{result.wrong}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Пропущено</p>
              <p className="text-3xl font-semibold">{result.unanswered}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Процент</p>
              <p className="text-3xl font-semibold">{result.percentage}%</p>
            </div>
          </div>
          <Progress value={result.percentage} />
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          {onRestart ? <Button onClick={onRestart}>{restartLabel}</Button> : null}
          {onRepeatMistakes && result.mistakes.length > 0 ? (
            <Button variant="secondary" onClick={onRepeatMistakes}>
              Повторить только ошибки
            </Button>
          ) : null}
          <Button variant="outline" onClick={onHome}>
            На главную
          </Button>
        </CardFooter>
      </Card>

      {result.mistakes.length > 0 ? (
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Список ошибок</CardTitle>
            <CardDescription>
              Вопросы, которые стоит повторить перед экзаменом.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {result.mistakes.map((mistake) => (
              <article
                key={mistake.question.id}
                className="rounded-lg border p-4 text-left"
              >
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    Вариант {mistake.question.variantNumber}
                  </Badge>
                  <Badge variant="outline">Вопрос {mistake.question.number}</Badge>
                  {mistake.unanswered ? (
                    <Badge variant="destructive">Пропущено</Badge>
                  ) : null}
                </div>
                <p className="font-medium">{mistake.question.question}</p>
                <Separator className="my-3" />
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <p>
                    Ваш ответ:{" "}
                    {mistake.unanswered
                      ? "не выбран"
                      : mistake.selectedOption?.text ?? "не найден"}
                  </p>
                  <p>Правильный ответ: {mistake.correctOption?.text}</p>
                </div>
              </article>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Alert>
          <AlertTitle>Отличный результат</AlertTitle>
          <AlertDescription>
            Ошибок в этой сессии нет. Можно переходить к следующему режиму.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
