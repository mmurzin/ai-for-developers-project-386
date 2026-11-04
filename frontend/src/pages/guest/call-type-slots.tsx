import { useState } from "react"
import { Link, useParams } from "react-router"

import type { Call, Slot } from "@/api/types.gen"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { bookCall } from "@/lib/booking"
import { formatDayLabel, formatSlotTime, groupSlotsByDay, useSlots } from "@/lib/slots"

const EMPTY_FORM = {
  guestName: "",
  guestContact: "",
}

// CallTypeSlots — гостевая страница календаря Слотов выбранного Типа
// звонка: сетка вычислена API (Окно записи, Рабочие часы), время —
// с явным смещением часового пояса. Клик по Слоту открывает форму
// Записи (имя, контакт); 201 — экран подтверждения, конфликт —
// понятное сообщение и свежий список Слотов без занятого.
export function CallTypeSlots() {
  const { id = "" } = useParams()
  const { items, error, notFound, reload } = useSlots(id)

  const [selected, setSelected] = useState<Slot | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [bookingError, setBookingError] = useState<string | undefined>(undefined)
  const [confirmed, setConfirmed] = useState<Call | null>(null)

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

  const pickSlot = (slot: Slot) => {
    setSelected(slot)
    setBookingError(undefined)
  }

  const resetBooking = () => {
    setSelected(null)
    setForm(EMPTY_FORM)
    setBookingError(undefined)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selected) {
      return
    }

    const result = await bookCall({
      callTypeId: id,
      startsAt: selected.startsAt,
      guestName: form.guestName.trim(),
      guestContact: form.guestContact.trim(),
    })
    if (result.ok) {
      setConfirmed(result.call)
      return
    }

    // Конфликт (409): время занято кем-то другим. Показываем сообщение
    // и обновляем список — занятый Слот исчезает, выбор сбрасывается.
    setBookingError(result.message)
    setSelected(null)
    await reload()
  }

  if (confirmed) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <div className="flex w-full max-w-md flex-col gap-6">
          <header className="flex flex-col gap-1">
            <h1 className="text-2xl font-medium">Запись подтверждена</h1>
            <p className="text-muted-foreground text-sm">
              Владелец страницы свяжется с вами по указанному контакту.
            </p>
          </header>

          <dl
            className="flex flex-col gap-3 rounded-lg border p-6 text-sm"
            data-testid="booking-details"
          >
            <div className="flex justify-between gap-6">
              <dt className="text-muted-foreground">Тип звонка</dt>
              <dd className="font-medium">{confirmed.callTypeName}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-muted-foreground">Дата</dt>
              <dd>{formatDayLabel(confirmed.startsAt.slice(0, 10))}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-muted-foreground">Время</dt>
              <dd className="tabular-nums">
                {formatSlotTime(confirmed.startsAt)} – {formatSlotTime(confirmed.endsAt)}
              </dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-muted-foreground">Длительность</dt>
              <dd>{confirmed.durationMinutes} минут</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-muted-foreground">Имя</dt>
              <dd>{confirmed.guestName}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-muted-foreground">Контакт</dt>
              <dd>{confirmed.guestContact}</dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmed(null)
                resetBooking()
                void reload()
              }}
            >
              Записаться ещё раз
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/">К списку типов звонков</Link>
            </Button>
          </div>
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
            Выберите Слот, чтобы записаться.
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
        {bookingError ? (
          <p role="alert" className="text-destructive text-sm">
            {bookingError}
          </p>
        ) : null}

        {days.length === 0 && !error ? (
          <p className="text-muted-foreground text-sm">Свободных Слотов нет.</p>
        ) : (
          days.map((day) => (
            <section key={day.key} className="flex flex-col gap-3" data-testid="slot-day">
              <h2 className="text-lg font-medium">{day.label}</h2>
              <ul className="flex flex-wrap gap-2">
                {day.slots.map((slot) => {
                  const isSelected = selected?.startsAt === slot.startsAt
                  return (
                    <li key={slot.startsAt}>
                      <button
                        type="button"
                        onClick={() => pickSlot(slot)}
                        aria-pressed={isSelected}
                        className={`rounded-md border px-3 py-1.5 text-sm tabular-nums transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/10 font-medium"
                            : "hover:bg-muted"
                        }`}
                      >
                        {formatSlotTime(slot.startsAt)}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))
        )}

        {selected ? (
          <section
            className="flex flex-col gap-4 rounded-lg border p-6"
            aria-label="Запись на Слот"
          >
            <h2 className="text-lg font-medium">Запись на Слот</h2>
            <p className="text-muted-foreground text-sm" data-testid="selected-slot">
              {formatDayLabel(selected.startsAt.slice(0, 10))},{" "}
              {formatSlotTime(selected.startsAt)} – {formatSlotTime(selected.endsAt)}
            </p>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="guest-name">Имя</Label>
                <Input
                  id="guest-name"
                  value={form.guestName}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, guestName: event.target.value }))
                  }
                  placeholder="Как к вам обращаться"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="guest-contact">Контакт</Label>
                <Input
                  id="guest-contact"
                  value={form.guestContact}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, guestContact: event.target.value }))
                  }
                  placeholder="Email или телефон для связи"
                  required
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit">Записаться</Button>
                <Button type="button" variant="ghost" onClick={resetBooking}>
                  Выбрать другое время
                </Button>
              </div>
            </form>
          </section>
        ) : null}
      </div>
    </div>
  )
}
