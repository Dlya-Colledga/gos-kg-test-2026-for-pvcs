import { ArrowRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { QuestionsData, StoredMistakes, StoredStats } from "@/types/question"

interface VariantsOverviewProps {
  data: QuestionsData
  stats: StoredStats
  mistakes: StoredMistakes
  onOpenVariant: (variantId: string, questionIndex?: number) => void
}

export function VariantsOverview({
  data,
  stats,
  mistakes,
  onOpenVariant,
}: VariantsOverviewProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-semibold">Все варианты</h1>
        <p className="text-muted-foreground">
          Обзор вариантов, прогресса и быстрый переход к конкретному вопросу.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {data.variants.map((variant) => {
          const variantStats = stats.perVariant[variant.id]
          const solved = variantStats?.solvedQuestionIds.length ?? 0
          const errors = Object.values(mistakes.records).filter(
            (record) => record.variantId === variant.id
          ).length
          const progress = (solved / variant.questions.length) * 100

          return (
            <Card key={variant.id} className="rounded-lg">
              <CardHeader>
                <Badge className="w-fit" variant="secondary">
                  {variant.questions.length} вопросов
                </Badge>
                <CardAction>
                  <Badge variant={errors > 0 ? "destructive" : "outline"}>
                    Ошибок: {errors}
                  </Badge>
                </CardAction>
                <CardTitle>{variant.title}</CardTitle>
                <CardDescription>
                  Пройдено {solved} из {variant.questions.length}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Progress value={progress} />
                <div className="flex flex-wrap gap-2">
                  {variant.questions.map((question, index) => (
                    <Button
                      key={question.id}
                      size="sm"
                      variant={
                        variantStats?.solvedQuestionIds.includes(question.id)
                          ? "secondary"
                          : "outline"
                      }
                      onClick={() => onOpenVariant(variant.id, index)}
                    >
                      {question.number}
                    </Button>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => onOpenVariant(variant.id)}>
                  Пройти вариант
                  <ArrowRight data-icon="inline-end" />
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
