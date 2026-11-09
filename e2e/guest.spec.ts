import { expect, test } from "@playwright/test"

// Сквозной сценарий #15: Гость открывает главную, выбирает Тип звонка
// и видит календарь вычисленных Слотов. Тип не сеется сценарием:
// «Консультация» — дефолтный Тип звонка, посеянный сервером при старте
// на пустой базе (#26); создание через UI закрыто admin.spec.ts.

test("гость выбирает тип звонка и видит календарь слотов", async ({ page }) => {
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

// Сквозной сценарий #16: Гость выбирает Тип звонка, записывается
// на Слот через форму (имя, контакт) и видит подтверждение с деталями
// Записи. Время созданной Записи исчезает из Слотов. Тип — дефолтный
// «Консультация» из посева при старте сервера (#26).

test("гость записывается на Слот и видит подтверждение", async ({ page }) => {
  await page.goto("/")

  await page.getByRole("link", { name: "Консультация — 30 минут" }).click()
  await expect(page.getByRole("heading", { name: "Свободные Слоты" })).toBeVisible()

  // Первый Слот первого дня Окна записи: 09:00 (+03:00).
  const firstDay = page.getByTestId("slot-day").first()
  await firstDay.getByRole("button", { name: "09:00 (+03:00)" }).click()

  await page.getByLabel("Имя").fill("Миша")
  await page.getByLabel("Контакт").fill("guest@example.com")
  await page.getByRole("button", { name: "Записаться" }).click()

  // Подтверждение с деталями Записи: тип, время, имя.
  await expect(page.getByRole("heading", { name: "Запись подтверждена" })).toBeVisible()
  const details = page.getByTestId("booking-details")
  await expect(details).toContainText("Консультация")
  await expect(details).toContainText("30 минут")
  await expect(details).toContainText("09:00 (+03:00) – 09:30 (+03:00)")
  await expect(details).toContainText("Миша")
  await expect(details).toContainText("guest@example.com")

  // Назад к календарю: время созданной Записи вырезано из Слотов.
  // Запись 09:00–09:30 убирает старты 09:00 и 09:15 (каждый заезжает
  // в интервал), но не 09:30 — примыкающий справа.
  await page.getByRole("button", { name: "Записаться ещё раз" }).click()
  await expect(firstDay.getByRole("button", { name: "09:00 (+03:00)" })).toHaveCount(0)
  await expect(firstDay.getByRole("button", { name: "09:15 (+03:00)" })).toHaveCount(0)
  await expect(firstDay.getByRole("button", { name: "09:30 (+03:00)" })).toBeVisible()
})
