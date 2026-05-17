import { useMemo, useState } from "react"
import { Search } from "lucide-react"

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
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import type { Question } from "@/types/question"

interface SearchScreenProps {
  questions: Question[]
  onOpenQuestion: (variantId: string, questionIndex: number) => void
}

export function SearchScreen({ questions, onOpenQuestion }: SearchScreenProps) {
  const [query, setQuery] = useState("")
  const normalizedQuery = query.trim().toLowerCase()

  const results = useMemo(() => {
    if (!normalizedQuery) {
      return []
    }

    return questions.filter((question) => {
      const haystack = [
        question.question,
        question.correctAnswer,
        question.variantTitle,
        ...question.options.map((option) => option.text),
      ]
        .join(" ")
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [normalizedQuery, questions])

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <div>
        <h1 className="text-3xl font-semibold">Поиск по вопросам</h1>
        <p className="text-muted-foreground">
          Ищите по тексту вопроса, вариантам ответа или правильному ответу.
        </p>
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="pl-9"
          placeholder="Например: расмий иш кагаздары"
        />
      </div>

      {!normalizedQuery ? (
        <Alert>
          <AlertTitle>Введите запрос</AlertTitle>
          <AlertDescription>
            Результаты появятся сразу. Поиск работает по всем 100 вопросам.
          </AlertDescription>
        </Alert>
      ) : null}

      {normalizedQuery && results.length === 0 ? (
        <Alert variant="destructive">
          <AlertTitle>Ничего не найдено</AlertTitle>
          <AlertDescription>
            Попробуйте другое слово или часть ответа.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-3">
        {results.map((question) => (
          <Card key={question.id} className="rounded-lg">
            <CardHeader>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Вариант {question.variantNumber}</Badge>
                <Badge variant="outline">Вопрос {question.number}</Badge>
              </div>
              <CardTitle>{question.question}</CardTitle>
              <CardDescription>
                Правильный ответ: {question.correctAnswer}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {question.options.map((option) => (
                <p key={option.id} className="text-sm text-muted-foreground">
                  {option.label}. {option.text}
                </p>
              ))}
            </CardContent>
            <Separator />
            <CardFooter>
              <Button
                variant="secondary"
                onClick={() => onOpenQuestion(question.variantId, question.number - 1)}
              >
                Перейти к вопросу
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
