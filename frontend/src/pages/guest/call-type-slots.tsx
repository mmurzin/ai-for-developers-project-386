import { Link, useParams } from "react-router"

import { formatSlotTime, groupSlotsByDay, useSlots } from "@/lib/slots"

// CallTypeSlots — гостевая страница календаря Слотов выбранного Типа
// звонка: сетка вычислена API (Окно записи, Рабочие часы), время —
// с явным смещением часового пояса.
export function CallTypeSlots() {
  const { id = "" } = useParams()
  const { items, error, notFound } = useSlots(id)

  if (notFound) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <div className="flex w-full max-w-md flex-col gap-4">
          <h1 className="text-2xl font-medium">Тип звонка не найден</h1>
          <p className="text-muted-foreground text-sm">
            Возможно, Владелец страницы его удалил.
          </p>
          <Link
            to="/"
            className="text-muted-foreground underline-offset-4 text-sm hover:underline"
          >
            К списку типов звонков
          </Link>
        </div>
      </div>
    )
  }

  const days = groupSlotsByDay(items)

  return (
    <div className="flex min-h-svh justify-center p-6">
      <div className="flex w-full max-w-xl flex-col gap-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-medium">Свободные Слоты</h1>
          <p className="text-muted-foreground text-sm">
            Время указано с явным смещением часового пояса инстанса.
          </p>
          <Link
            to="/"
            className="text-muted-foreground underline-offset-4 text-sm hover:underline"
          >
            ← К списку типов звонков
          </Link>
        </header>

        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        ) : null}

        {days.length === 0 && !error ? (
          <p className="text-muted-foreground text-sm">Свободных Слотов нет.</p>
        ) : (
          days.map((day) => (
            <section key={day.key} className="flex flex-col gap-3" data-testid="slot-day">
              <h2 className="text-lg font-medium">{day.label}</h2>
              <ul className="flex flex-wrap gap-2">
                {day.slots.map((slot) => (
                  <li
                    key={slot.startsAt}
                    className="rounded-md border px-3 py-1.5 text-sm tabular-nums"
                  >
                    {formatSlotTime(slot.startsAt)}
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  )
}
