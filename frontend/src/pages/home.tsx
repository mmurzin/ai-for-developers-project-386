import { Link } from "react-router"

import { Button } from "@/components/ui/button"
import { DURATIONS } from "@/lib/duration"

export function Home() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="flex w-full max-w-md flex-col gap-6">
        <h1 className="text-2xl font-medium">Выберите длительность звонка</h1>
        <div className="flex gap-3">
          {DURATIONS.map((duration) => (
            <Button key={duration} asChild size="lg" className="flex-1 text-base">
              <Link to={`/booking/${duration}`}>{duration} минут</Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
