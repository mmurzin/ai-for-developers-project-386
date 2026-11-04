import { useCallback, useEffect, useState } from "react"

import { listSlots } from "@/api/sdk.gen"
import type { Slot } from "@/api/types.gen"

const LOAD_ERROR = "Не удалось загрузить Слоты"

type SlotsResult =
  | { kind: "ok"; items: Slot[] }
  | { kind: "error"; message: string; notFound: boolean }

// fetchSlots — один запрос Слотов без состояния: и начальная загрузка,
// и обновление после конфликта брони используют одну логику разбора.
async function fetchSlots(callTypeId: string): Promise<SlotsResult> {
  try {
    const { data, error } = await listSlots({ path: { id: callTypeId } })
    if (error) {
      return {
        kind: "error",
        message: error.message,
        notFound: error.code === "call_type_not_found",
      }
    }
    return { kind: "ok", items: data?.items ?? [] }
  } catch {
    return { kind: "error", message: LOAD_ERROR, notFound: false }
  }
}

// useSlots — Слоты Типа звонка через сгенерированный hey-api клиент.
// 404 (тип не найден) отражается как notFound, остальные ошибки — текстом.
// reload — повторная загрузка: после конфликта брони занятый Слот
// должен исчезнуть из списка.
export function useSlots(callTypeId: string) {
  const [items, setItems] = useState<Slot[]>([])
  const [error, setError] = useState<string | undefined>(undefined)
  const [notFound, setNotFound] = useState(false)

  const apply = useCallback((result: SlotsResult) => {
    if (result.kind === "error") {
      setNotFound(result.notFound)
      setError(result.message)
      return
    }
    setNotFound(false)
    setError(undefined)
    setItems(result.items)
  }, [])

  // setState — только в .then-колбэках, не в теле эффекта
  // (react-hooks/set-state-in-effect).
  useEffect(() => {
    let cancelled = false
    fetchSlots(callTypeId).then((result) => {
      if (!cancelled) {
        apply(result)
      }
    })
    return () => {
      cancelled = true
    }
  }, [callTypeId, apply])

  const reload = useCallback(async () => {
    apply(await fetchSlots(callTypeId))
  }, [callTypeId, apply])

  return { items, error, notFound, reload }
}

export type DaySlots = {
  key: string
  label: string
  slots: Slot[]
}

// groupSlotsByDay группирует Слоты по календарным дням зоны инстанса:
// дата берётся из ISO-строки (первые 10 символов), порядок сохраняется.
export function groupSlotsByDay(slots: Slot[]): DaySlots[] {
  const groups = new Map<string, Slot[]>()
  for (const slot of slots) {
    const key = slot.startsAt.slice(0, 10)
    const existing = groups.get(key)
    if (existing) {
      existing.push(slot)
    } else {
      groups.set(key, [slot])
    }
  }
  return Array.from(groups, ([key, daySlots]) => ({
    key,
    label: formatDayLabel(key),
    slots: daySlots,
  }))
}

const WEEKDAYS = [
  "Воскресенье",
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
] as const

const MONTHS_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
] as const

// formatDayLabel — «Суббота, 7 ноября» из ключа дня «YYYY-MM-DD»
// (календарная дата Слота в зоне инстанса). День недели считается
// по UTC-дате ключа: календарная дата от пояса не зависит.
export function formatDayLabel(key: string): string {
  const [year, month, day] = key.split("-").map(Number)
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
  return `${weekday}, ${day} ${MONTHS_GENITIVE[month - 1]}`
}

// formatSlotTime — время начала Слота с явным смещением: «09:00 (+03:00)».
export function formatSlotTime(iso: string): string {
  const time = iso.slice(11, 16)
  const offset = iso.slice(19)
  return offset ? `${time} (${offset})` : `${time} (UTC)`
}
