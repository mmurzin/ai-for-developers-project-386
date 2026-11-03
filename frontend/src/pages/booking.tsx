import { Link, Navigate, useParams } from "react-router"

import { Button } from "@/components/ui/button"
import { parseDuration } from "@/lib/duration"

export function Booking() {
  const { duration } = useParams()
  const parsed = parseDuration(duration ?? "")

  if (parsed === null) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="flex w-full max-w-md flex-col gap-6">
        <h1 className="text-2xl font-medium">Страница в разработке</h1>
        <p>Вы выбрали звонок на {parsed} минут</p>
        <Button asChild variant="outline" className="self-start">
          <Link to="/">Назад</Link>
        </Button>
      </div>
    </div>
  )
}
