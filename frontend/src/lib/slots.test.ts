import { expect, test } from "vitest"

import { formatDayLabel, formatSlotTime, groupSlotsByDay } from "@/lib/slots"

const slot = (startsAt: string, endsAt: string) => ({ startsAt, endsAt })

test("groupSlotsByDay группирует Слоты по календарным дням, сохраняя порядок", () => {
  const slots = [
    slot("2026-11-05T09:00:00+03:00", "2026-11-05T09:15:00+03:00"),
    slot("2026-11-05T09:15:00+03:00", "2026-11-05T09:30:00+03:00"),
    slot("2026-11-06T09:00:00+03:00", "2026-11-06T09:15:00+03:00"),
  ]

  const days = groupSlotsByDay(slots)

  expect(days).toHaveLength(2)
  expect(days[0]?.key).toBe("2026-11-05")
  expect(days[0]?.slots).toHaveLength(2)
  expect(days[1]?.key).toBe("2026-11-06")
  expect(days[1]?.label).toBe("Пятница, 6 ноября")
})

test("groupSlotsByDay возвращает пустой список без Слотов", () => {
  expect(groupSlotsByDay([])).toEqual([])
})

// Дни недели — независимая истина (календарь), не вывод реализации:
// 7 ноября 2026 — суббота, 18 ноября — среда.
test("formatDayLabel подписывает день недели и месяц по-русски", () => {
  expect(formatDayLabel("2026-11-07")).toBe("Суббота, 7 ноября")
  expect(formatDayLabel("2026-11-18")).toBe("Среда, 18 ноября")
  expect(formatDayLabel("2026-12-31")).toBe("Четверг, 31 декабря")
})

test("formatSlotTime показывает время с явным смещением", () => {
  expect(formatSlotTime("2026-11-05T09:00:00+03:00")).toBe("09:00 (+03:00)")
  expect(formatSlotTime("2026-11-05T17:45:00+03:00")).toBe("17:45 (+03:00)")
})
