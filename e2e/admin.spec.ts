import { expect, test } from "@playwright/test"

// Сквозной сценарий #14: Владелец страницы создаёт Тип звонка в админке
// и видит его в списке. Без подмены API — настоящий сервер с SQLite.

test("владелец создаёт Тип звонка и видит его в списке", async ({ page }) => {
  await page.goto("/admin")

  await page.getByLabel("Идентификатор").fill("intro")
  await page.getByLabel("Название").fill("Интро-звонок")
  await page.getByLabel("Описание").fill("Знакомство и обсуждение задач")
  await page.getByLabel("Длительность (минуты)").fill("15")
  await page.getByRole("button", { name: "Создать" }).click()

  await expect(page.getByText("Интро-звонок — 15 минут")).toBeVisible()
  await expect(page.getByText("Знакомство и обсуждение задач")).toBeVisible()
})
