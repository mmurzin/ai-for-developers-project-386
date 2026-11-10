import { expect, test } from "vitest"

import {
  availableDayKeys,
  calendarMonthRange,
  dateToDayKey,
  dayKeyToDate,
  firstAvailableDayKey,
  formatDayLabel,
  formatSlotTime,
  groupSlotsByDay,
  slotDurationMinutes,
} from "@/lib/slots"

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

// Длительность — из границ Слота (endsAt − startsAt), без запросов.
// Длительности Типов звонка — независимая истина: 15 и 30 минут сеются
// дефолтными Типами (#26); слот через полночь — 23:45…00:00 = 15 минут.
test("slotDurationMinutes считает минуты из границ Слота", () => {
  expect(slotDurationMinutes(slot("2026-11-05T09:00:00+03:00", "2026-11-05T09:30:00+03:00"))).toBe(30)
  expect(slotDurationMinutes(slot("2026-11-05T09:00:00+03:00", "2026-11-05T09:15:00+03:00"))).toBe(15)
  expect(slotDurationMinutes(slot("2026-11-05T23:45:00+03:00", "2026-11-06T00:00:00+03:00"))).toBe(15)
})

// Доступность дня для календаря: день есть в списке Слотов = доступен.
test("availableDayKeys собирает уникальные дни Слотов в календарном порядке", () => {
  const slots = [
    slot("2026-12-08T09:00:00+03:00", "2026-12-08T09:15:00+03:00"),
    slot("2026-11-30T09:00:00+03:00", "2026-11-30T09:15:00+03:00"),
    slot("2026-12-01T09:00:00+03:00", "2026-12-01T09:15:00+03:00"),
    slot("2026-12-01T09:15:00+03:00", "2026-12-01T09:30:00+03:00"),
  ]

  expect(availableDayKeys(slots)).toEqual(["2026-11-30", "2026-12-01", "2026-12-08"])
})

test("availableDayKeys без Слотов — пустой список", () => {
  expect(availableDayKeys([])).toEqual([])
})

test("firstAvailableDayKey — первый из доступных дней, без Слотов — undefined", () => {
  const slots = [
    slot("2026-12-08T09:00:00+03:00", "2026-12-08T09:15:00+03:00"),
    slot("2026-11-30T09:00:00+03:00", "2026-11-30T09:15:00+03:00"),
  ]

  expect(firstAvailableDayKey(slots)).toBe("2026-11-30")
  expect(firstAvailableDayKey([])).toBeUndefined()
})

// Ключ дня «YYYY-MM-DD» — календарная дата в зоне инстанса. Дата для
// календаря собирается из компонент ключа (не из new Date(строка):
// дата-строки парсятся как UTC-полночь и сдвигают день в другой зоне).
// Границы месяца и года — самые уязвимые места.
test("dayKeyToDate и dateToDayKey — взаимно однозначные преобразования", () => {
  for (const key of ["2026-11-05", "2026-12-31", "2027-01-01", "2026-03-01"]) {
    expect(dateToDayKey(dayKeyToDate(key))).toBe(key)
  }
})

test("calendarMonthRange возвращает undefined без дней", () => {
  expect(calendarMonthRange([])).toBeUndefined()
})

// Окно записи целиком в одном месяце: навигация заперта в нём.
test("calendarMonthRange в одном месяце — от первого до последнего числа", () => {
  expect(calendarMonthRange(["2026-11-11", "2026-11-18", "2026-11-24"])).toEqual({
    startMonth: dayKeyToDate("2026-11-01"),
    endMonth: dayKeyToDate("2026-11-30"),
  })
})

// Окно записи пересекает границу месяцев — максимум два месяца навигации.
test("calendarMonthRange через границу месяцев — два месяца", () => {
  expect(calendarMonthRange(["2026-11-25", "2026-12-08"])).toEqual({
    startMonth: dayKeyToDate("2026-11-01"),
    endMonth: dayKeyToDate("2026-12-31"),
  })
})
