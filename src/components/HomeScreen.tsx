import {
  BookOpenCheck,
  ClipboardList,
  FileCheck2,
  Play,
  RotateCcw,
  SearchCheck,
  Shuffle,
  Sparkles,
} from "lucide-react"

import { ConfirmDialog } from "@/components/ConfirmDialog"
import { ModeCard } from "@/components/ModeCard"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import type {
  AppView,
  PreparationMode,
  QuestionsData,
  QuizSession,
  StoredMistakes,
  StoredStats,
} from "@/types/question"

interface HomeScreenProps {
  data: QuestionsData
  stats: StoredStats
  mistakes: StoredMistakes
  session: QuizSession | null
  onOpenMode: (mode: PreparationMode) => void
  onContinue: () => void
  onStartFresh: () => void
  onNavigate: (view: AppView) => void
}

const modes: Array<{
  mode: PreparationMode
  title: string
  description: string
  badge: string
  icon: typeof BookOpenCheck
}> = [
  {
    mode: "variant",
    title: "Вариативная подготовка",
    description: "Выберите нужный вариант, и система будет давать вопросы по порядку.",
    badge: "по порядку",
    icon: BookOpenCheck,
  },
  {
    mode: "test-rush",
    title: "Тест Раш",
    description: "Случайные вопросы из всех вариантов с мгновенной проверкой.",
    badge: "случайно",
    icon: Shuffle,
  },
  {
    mode: "variant-rush",
    title: "Раш вариантов",
    description: "Выберите несколько вариантов и тренируйтесь по ним вперемешку.",
    badge: "выборочно",
    icon: Sparkles,
  },
  {
    mode: "exam",
    title: "Экзамен",
    description: "Максимально похожий режим: без подсказок до завершения.",
    badge: "без подсказок",
    icon: FileCheck2,
  },
  {
    mode: "mistakes",
    title: "Работа над ошибками",
    description: "Повторите вопросы, на которые раньше отвечали неправильно.",
    badge: "повторение",
    icon: SearchCheck,
  },
]

export function HomeScreen({
  data,
  stats,
  mistakes,
  session,
  onOpenMode,
  onContinue,
  onStartFresh,
  onNavigate,
}: HomeScreenProps) {
  const totalQuestions =
    data.stats?.questionCount ??
    data.variants.reduce((sum, variant) => sum + variant.questions.length, 0)
  const solved = stats.solvedQuestionIds.length
  const percent =
    stats.totalAttempts > 0
      ? Math.round((stats.totalCorrect / stats.totalAttempts) * 100)
      : 0
  const hasUnfinishedSession = session?.status === "in-progress"
  const mistakeCount = Object.keys(mistakes.records).length

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
        <Card className="rounded-lg">
          <CardHeader>
            <Badge className="w-fit" variant="secondary">
              ГОС Helper
            </Badge>
            <CardTitle className="max-w-3xl text-3xl leading-tight md:text-5xl">
              ГОС Helper
            </CardTitle>
            <CardDescription className="max-w-2xl text-base">
              Тренажёр для подготовки к государственным экзаменам
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Вариантов</p>
                <p className="text-3xl font-semibold">{data.variants.length}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Вопросов</p>
                <p className="text-3xl font-semibold">{totalQuestions}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Уже решено</p>
                <p className="text-3xl font-semibold">{solved}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Правильность</p>
                <p className="text-3xl font-semibold">{percent}%</p>
              </div>
            </div>
            <Progress value={(solved / totalQuestions) * 100} />
            <div className="flex flex-wrap gap-2">
              {hasUnfinishedSession ? (
                <Button onClick={onContinue}>
                  <Play data-icon="inline-start" />
                  Продолжить
                </Button>
              ) : null}
              {hasUnfinishedSession ? (
                <ConfirmDialog
                  title="Начать заново?"
                  description="Текущая незавершённая сессия будет удалена, но статистика и список ошибок сохранятся."
                  confirmLabel="Начать заново"
                  onConfirm={onStartFresh}
                >
                  <Button variant="outline">
                    <RotateCcw data-icon="inline-start" />
                    Начать заново
                  </Button>
                </ConfirmDialog>
              ) : null}
              <Button variant="secondary" onClick={() => onNavigate("variants")}>
                <ClipboardList data-icon="inline-start" />
                Все варианты
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Сводка</CardTitle>
            <CardDescription>Сохраняется в localStorage.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Всего попыток</span>
              <Badge variant="secondary">{stats.totalAttempts}</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Правильных ответов</span>
              <Badge>{stats.totalCorrect}</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Ошибок в работе</span>
              <Badge variant={mistakeCount > 0 ? "destructive" : "secondary"}>
                {mistakeCount}
              </Badge>
            </div>
            {hasUnfinishedSession ? (
              <Alert>
                <AlertTitle>Можно продолжить</AlertTitle>
                <AlertDescription>
                  Сохранён режим: {session.mode}. Вопрос{" "}
                  {session.currentIndex + 1} из {session.questionIds.length}.
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {modes.map((mode) => (
          <ModeCard
            key={mode.mode}
            title={mode.title}
            description={mode.description}
            badge={mode.badge}
            icon={mode.icon}
            onOpen={() => onOpenMode(mode.mode)}
          />
        ))}
      </section>
    </div>
  )
}
