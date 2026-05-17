import { useEffect } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { Question } from "@/types/question"

interface QuestionCardProps {
  question: Question
  selectedOptionId?: string
  currentIndex: number
  total: number
  revealAnswer: boolean
  locked?: boolean
  showVariant?: boolean
  onSelect: (optionId: string) => void
  onEnter?: () => void
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  const tagName = target.tagName.toLowerCase()
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  )
}

export function QuestionCard({
  question,
  selectedOptionId,
  currentIndex,
  total,
  revealAnswer,
  locked,
  showVariant = true,
  onSelect,
  onEnter,
}: QuestionCardProps) {
  const progressValue = total > 0 ? ((currentIndex + 1) / total) * 100 : 0
  const selectedOption = question.options.find(
    (option) => option.id === selectedOptionId
  )
  const isAnswered = Boolean(selectedOptionId)
  const isCorrect = selectedOptionId === question.correctOption
  const shouldLock = Boolean(locked && isAnswered)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) {
        return
      }

      if (event.key >= "1" && event.key <= "4") {
        const option = question.options[Number(event.key) - 1]

        if (option && !shouldLock) {
          event.preventDefault()
          onSelect(option.id)
        }
      }

      if (event.key === "Enter" && onEnter) {
        event.preventDefault()
        onEnter()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onEnter, onSelect, question.options, shouldLock])

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            {currentIndex + 1}/{total}
          </Badge>
          {showVariant ? (
            <Badge variant="secondary">Вариант {question.variantNumber}</Badge>
          ) : null}
          <Badge variant={isAnswered ? "default" : "secondary"}>
            {isAnswered ? "Ответ выбран" : "Нет ответа"}
          </Badge>
        </div>
        <CardAction className="min-w-28">
          <Progress value={progressValue} />
        </CardAction>
        <CardTitle className="text-lg leading-snug md:text-xl">
          {question.question}
        </CardTitle>
        <CardDescription>
          Горячие клавиши: 1/2/3/4 для ответа, Enter для перехода дальше.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <RadioGroup
          value={selectedOptionId ?? ""}
          onValueChange={(value) => {
            if (!shouldLock) {
              onSelect(value)
            }
          }}
          className="grid gap-3"
        >
          {question.options.map((option, index) => {
            const optionIsCorrect = option.id === question.correctOption
            const optionIsSelected = option.id === selectedOptionId

            return (
              <label
                key={option.id}
                htmlFor={`${question.id}-${option.id}`}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-3 text-left transition-colors",
                  optionIsSelected && "border-primary bg-primary/5",
                  revealAnswer &&
                    optionIsCorrect &&
                    "border-[color:var(--success)] bg-[color:var(--success-soft)]",
                  revealAnswer &&
                    optionIsSelected &&
                    !optionIsCorrect &&
                    "border-destructive bg-destructive/10",
                  shouldLock && "cursor-default"
                )}
              >
                <RadioGroupItem
                  id={`${question.id}-${option.id}`}
                  value={option.id}
                  disabled={shouldLock}
                  aria-label={`Ответ ${index + 1}`}
                />
                <span className="flex flex-col gap-1">
                  <span className="font-medium">
                    {index + 1}. {option.label}
                  </span>
                  <span className="text-sm leading-relaxed text-muted-foreground">
                    {option.text}
                  </span>
                </span>
              </label>
            )
          })}
        </RadioGroup>

        {revealAnswer && isAnswered ? (
          <>
            <Separator />
            <Alert variant={isCorrect ? "default" : "destructive"}>
              <AlertTitle>{isCorrect ? "Верно" : "Есть ошибка"}</AlertTitle>
              {!isCorrect ? (
                <AlertDescription>
                  Правильный ответ: {question.correctAnswer}
                </AlertDescription>
              ) : null}
            </Alert>
          </>
        ) : null}

        {revealAnswer && !isAnswered ? (
          <>
            <Separator />
            <Alert variant="destructive">
              <AlertTitle>Вопрос пропущен</AlertTitle>
              <AlertDescription>
                Правильный ответ: {question.correctAnswer}
              </AlertDescription>
            </Alert>
          </>
        ) : null}

        {selectedOption && !revealAnswer ? (
          <p className="text-sm text-muted-foreground">
            Выбран ответ: {selectedOption.label}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
