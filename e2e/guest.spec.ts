import { expect, test } from "@playwright/test"

// Сквозной сценарий #15: Гость открывает главную, выбирает Тип звонка
// и видит календарь вычисленных Слотов. Тип сеется через API —
// надёжнее UI-формы (сценарий формы уже закрыт admin.spec.ts);
// 409 допускаем на случай, если тип уже создан в этом прогоне базы.

test("гость выбирает тип звонка и видит календарь слотов", async ({ page, request }) => {
  const created = await request.post("/api/call-types", {
    data: {
      id: "consult",
      name: "Консультация",
      description: "Разбор ваших задач",
      durationMinutes: 30,
    },
  })
  expect([201, 409]).toContain(created.status())

  await page.goto("/")

  await page.getByRole("link", { name: "Консультация — 30 минут" }).click()

  await expect(page.getByRole("heading", { name: "Свободные Слоты" })).toBeVisible()

  // Окно записи — всегда 14 календарных дней со следующего дня,
  // включая выходные: групп по дням ровно 14.
  await expect(page.getByTestId("slot-day")).toHaveCount(14)

  // Сетка первого дня детерминирована: первый старт — 09:00,
  // для длительности 30 минут последний старт — 17:30.
  // Время — с явным смещением зоны инстанса (Europe/Moscow, +03:00).
  const firstDaySlots = page.getByTestId("slot-day").first().locator("li")
  await expect(firstDaySlots.first()).toHaveText("09:00 (+03:00)")
  await expect(firstDaySlots.last()).toHaveText("17:30 (+03:00)")
})
