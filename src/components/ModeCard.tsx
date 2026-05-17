import type { LucideIcon } from "lucide-react"

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

interface ModeCardProps {
  title: string
  description: string
  icon: LucideIcon
  badge?: string
  onOpen: () => void
}

export function ModeCard({
  title,
  description,
  icon: Icon,
  badge,
  onOpen,
}: ModeCardProps) {
  return (
    <Card className="min-h-[210px] rounded-lg">
      <CardHeader>
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        {badge ? (
          <CardAction>
            <Badge variant="secondary">{badge}</Badge>
          </CardAction>
        ) : null}
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grow" />
      <CardFooter>
        <Button className="w-full" onClick={onOpen}>
          Открыть режим
        </Button>
      </CardFooter>
    </Card>
  )
}
