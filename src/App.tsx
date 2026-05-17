import { useEffect, useMemo, useState } from "react"

import rawQuestions from "@/data/questions.json"
import { HomeScreen } from "@/components/HomeScreen"
import { SearchScreen } from "@/components/SearchScreen"
import { VariantsOverview } from "@/components/VariantsOverview"
import { AppShell } from "@/components/layout/AppShell"
import { ExamMode } from "@/components/modes/ExamMode"
import { MistakesMode } from "@/components/modes/MistakesMode"
import { TestRushMode } from "@/components/modes/TestRushMode"
import { VariantMode } from "@/components/modes/VariantMode"
import { VariantRushMode } from "@/components/modes/VariantRushMode"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  createQuizSession,
  getAllQuestions,
  getQuestionMap,
  validateQuestionsData,
} from "@/lib/quiz"
import {
  clearMistakes,
  clearSession,
  loadMistakes,
  loadSession,
  loadStats,
  loadTheme,
  recordAnswerInStats,
  recordMistake,
  removeMistake,
  resetAllStorage,
  saveMistakes,
  saveSession,
  saveStats,
  saveTheme,
  type ThemeMode,
} from "@/lib/storage"
import type {
  AppView,
  PreparationMode,
  Question,
  QuizSession,
} from "@/types/question"

function App() {
  const parsed = useMemo(() => {
    try {
      return {
        data: validateQuestionsData(rawQuestions),
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : "Не удалось прочитать questions.json",
      }
    }
  }, [])

  const [session, setSession] = useState<QuizSession | null>(() => loadSession())
  const [stats, setStats] = useState(() => loadStats())
  const [mistakes, setMistakes] = useState(() => loadMistakes())
  const [theme, setTheme] = useState<ThemeMode>(() => loadTheme())
  const [view, setView] = useState<AppView>(() => {
    const storedSession = loadSession()
    return storedSession?.status === "in-progress" ? storedSession.mode : "home"
  })

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    saveTheme(theme)
  }, [theme])

  const questions = useMemo(
    () => (parsed.data ? getAllQuestions(parsed.data) : []),
    [parsed.data]
  )
  const questionMap = useMemo(() => getQuestionMap(questions), [questions])

  if (!parsed.data) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background p-4">
        <Card className="max-w-xl rounded-lg">
          <CardHeader>
            <CardTitle>Ошибка структуры questions.json</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTitle>Данные не загружены</AlertTitle>
              <AlertDescription>{parsed.error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </main>
    )
  }

  const data = parsed.data

  function handleSessionChange(nextSession: QuizSession) {
    setSession(nextSession)
    saveSession(nextSession)
  }

  function handleRegisterAnswer(question: Question, selectedOptionId: string) {
    setStats((currentStats) => {
      const nextStats = recordAnswerInStats(
        currentStats,
        question,
        selectedOptionId
      )
      saveStats(nextStats)
      return nextStats
    })

    if (selectedOptionId !== question.correctOption) {
      setMistakes((currentMistakes) => {
        const nextMistakes = recordMistake(
          currentMistakes,
          question,
          selectedOptionId
        )
        saveMistakes(nextMistakes)
        return nextMistakes
      })
    }
  }

  function handleRemoveMistake(questionId: string) {
    setMistakes((currentMistakes) => {
      const nextMistakes = removeMistake(currentMistakes, questionId)
      saveMistakes(nextMistakes)
      return nextMistakes
    })
  }

  function handleClearMistakes() {
    clearMistakes()
    setMistakes({ records: {} })
  }

  function handleResetAll() {
    resetAllStorage()
    setSession(null)
    setStats(loadStats())
    setMistakes(loadMistakes())
    setView("home")
  }

  function handleStartFresh() {
    clearSession()
    setSession(null)
  }

  function handleContinue() {
    if (session?.status === "in-progress") {
      setView(session.mode)
    }
  }

  function handleOpenMode(mode: PreparationMode) {
    if (session?.mode === mode && session.status === "completed") {
      clearSession()
      setSession(null)
    }

    setView(mode)
  }

  function handleOpenVariant(variantId: string, questionIndex = 0) {
    const variant = data.variants.find((item) => item.id === variantId)

    if (!variant) {
      return
    }

    handleSessionChange(
      createQuizSession({
        mode: "variant",
        selectedVariantIds: [variant.id],
        questionIds: variant.questions.map((question) => question.id),
        currentIndex: questionIndex,
        settings: { title: variant.title, questionCount: "all" },
      })
    )
    setView("variant")
  }

  function renderContent() {
    switch (view) {
      case "home":
        return (
          <HomeScreen
            data={data}
            stats={stats}
            mistakes={mistakes}
            session={session}
            onOpenMode={handleOpenMode}
            onContinue={handleContinue}
            onStartFresh={handleStartFresh}
            onNavigate={setView}
          />
        )
      case "variants":
        return (
          <VariantsOverview
            data={data}
            stats={stats}
            mistakes={mistakes}
            onOpenVariant={handleOpenVariant}
          />
        )
      case "search":
        return (
          <SearchScreen questions={questions} onOpenQuestion={handleOpenVariant} />
        )
      case "variant":
        return (
          <VariantMode
            data={data}
            questionMap={questionMap}
            session={session}
            onSessionChange={handleSessionChange}
            onRegisterAnswer={handleRegisterAnswer}
            onHome={() => setView("home")}
          />
        )
      case "test-rush":
        return (
          <TestRushMode
            questions={questions}
            questionMap={questionMap}
            session={session}
            onSessionChange={handleSessionChange}
            onRegisterAnswer={handleRegisterAnswer}
            onHome={() => setView("home")}
          />
        )
      case "variant-rush":
        return (
          <VariantRushMode
            data={data}
            questions={questions}
            questionMap={questionMap}
            session={session}
            onSessionChange={handleSessionChange}
            onRegisterAnswer={handleRegisterAnswer}
            onHome={() => setView("home")}
          />
        )
      case "exam":
        return (
          <ExamMode
            data={data}
            questions={questions}
            questionMap={questionMap}
            session={session}
            onSessionChange={handleSessionChange}
            onRegisterAnswer={handleRegisterAnswer}
            onHome={() => setView("home")}
          />
        )
      case "mistakes":
        return (
          <MistakesMode
            mistakes={mistakes}
            questionMap={questionMap}
            session={session}
            onSessionChange={handleSessionChange}
            onRegisterAnswer={handleRegisterAnswer}
            onRemoveMistake={handleRemoveMistake}
            onClearMistakes={handleClearMistakes}
            onHome={() => setView("home")}
          />
        )
      default:
        return (
          <Button variant="outline" onClick={() => setView("home")}>
            Вернуться на главную
          </Button>
        )
    }
  }

  return (
    <AppShell
      view={view}
      session={session}
      theme={theme}
      onNavigate={setView}
      onContinue={handleContinue}
      onResetAll={handleResetAll}
      onToggleTheme={() =>
        setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))
      }
    >
      {renderContent()}
    </AppShell>
  )
}

export default App
