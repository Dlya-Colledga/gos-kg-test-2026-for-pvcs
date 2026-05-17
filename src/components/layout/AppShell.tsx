import { Moon, RotateCcw, Sun } from "lucide-react"

import { ConfirmDialog } from "@/components/ConfirmDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ThemeMode } from "@/lib/storage"
import type { AppView, QuizSession } from "@/types/question"

interface AppShellProps {
  view: AppView
  session: QuizSession | null
  theme: ThemeMode
  children: React.ReactNode
  onNavigate: (view: AppView) => void
  onContinue: () => void
  onResetAll: () => void
  onToggleTheme: () => void
}

const tabViews = new Set<AppView>(["home", "variants", "search"])

export function AppShell({
  view,
  session,
  theme,
  children,
  onNavigate,
  onContinue,
  onResetAll,
  onToggleTheme,
}: AppShellProps) {
  const isTrainingView = !tabViews.has(view)
  const tabValue = tabViews.has(view) ? view : ""
  const hasUnfinishedSession = session?.status === "in-progress"
  const ThemeIcon = theme === "dark" ? Sun : Moon

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:px-6">
          {!isTrainingView ? (
            <>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start justify-between gap-3">
                  <button
                    className="min-w-0 text-left"
                    onClick={() => onNavigate("home")}
                    type="button"
                  >
                    <span className="block truncate text-lg font-semibold leading-tight">
                      ГОС Helper
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      Тренажёр для подготовки
                    </span>
                  </button>

                  <Button
                    className="md:hidden"
                    variant="outline"
                    size="icon"
                    onClick={onToggleTheme}
                  >
                    <ThemeIcon data-icon="inline-start" />
                    <span className="sr-only">Переключить тему</span>
                  </Button>
                </div>

                <div className="grid w-full grid-cols-[1fr_auto] gap-2 md:flex md:w-auto md:items-center md:justify-end">
                  {hasUnfinishedSession ? (
                    <Badge className="h-8 min-w-0 justify-center rounded-lg px-2" variant="secondary">
                      <span className="truncate sm:hidden">Сессия сохранена</span>
                      <span className="hidden sm:inline">
                        Есть незавершённая сессия
                      </span>
                    </Badge>
                  ) : null}

                  {hasUnfinishedSession ? (
                    <Button
                      className="min-w-28 px-3"
                      variant="secondary"
                      onClick={onContinue}
                    >
                      Продолжить
                    </Button>
                  ) : null}

                  <Button
                    className="hidden md:inline-flex"
                    variant="outline"
                    size="icon"
                    onClick={onToggleTheme}
                  >
                    <ThemeIcon data-icon="inline-start" />
                    <span className="sr-only">Переключить тему</span>
                  </Button>

                  <ConfirmDialog
                    title="Сбросить весь прогресс?"
                    description="Будут удалены текущая сессия, ответы, ошибки и вся статистика в localStorage. Если вам нужно сбросить только сессию, то эта кнопка 'Начать заново' на главной странице."
                    confirmLabel="Сбросить"
                    destructive
                    onConfirm={onResetAll}
                  >
                    <Button className="col-span-2 w-full md:col-span-1 md:w-auto" variant="outline">
                      <RotateCcw data-icon="inline-start" />
                      <span className="sm:hidden">Сбросить</span>
                      <span className="hidden sm:inline">Сбросить прогресс</span>
                    </Button>
                  </ConfirmDialog>
                </div>
              </div>

              <Separator />
            </>
          ) : null}

          <Tabs
            value={tabValue}
            onValueChange={(value) => {
              if (value === "home" || value === "variants" || value === "search") {
                onNavigate(value)
              }
            }}
          >
            <TabsList className="w-full overflow-x-auto">
              <TabsTrigger value="home">Главная</TabsTrigger>
              <TabsTrigger value="variants">Все варианты</TabsTrigger>
              <TabsTrigger value="search">Поиск</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <div key={view} className="page-enter">
          {children}
        </div>
      </main>
    </div>
  )
}
