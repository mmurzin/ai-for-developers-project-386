import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { MemoryRouter } from "react-router"

import { client } from "@/api/client.gen"
import { App } from "@/App"

const okResponse = (status: number, body: unknown) => ({
  data: body,
  error: undefined,
  request: {} as Request,
  response: new Response(JSON.stringify(body), { status }),
})

const errorResponse = (status: number, body: unknown) => ({
  data: undefined,
  error: body,
  request: {} as Request,
  response: new Response(JSON.stringify(body), { status }),
})

afterEach(() => {
  vi.restoreAllMocks()
})

function renderSlotsPage() {
  return render(
    <MemoryRouter initialEntries={["/call-types/intro"]}>
      <App />
    </MemoryRouter>,
  )
}

// Кнопка дня календаря по ключу дня «YYYY-MM-DD»: react-day-picker
// помечает ячейку сетки атрибутом td[data-day] ISO-датой.
function dayButton(container: HTMLElement, dayKey: string) {
  const button = container.querySelector<HTMLButtonElement>(
    `td[data-day="${dayKey}"] button`,
  )
  if (!button) {
    throw new Error(`день ${dayKey} не отображён в календаре`)
  }
  return button
}

test("первый доступный день выбран автоматически, колонка Слотов подписана датой", async () => {
  vi.spyOn(client, "get").mockResolvedValue(
    okResponse(200, {
      items: [
        { startsAt: "2026-11-05T09:00:00+03:00", endsAt: "2026-11-05T09:15:00+03:00" },
        { startsAt: "2026-11-05T09:15:00+03:00", endsAt: "2026-11-05T09:30:00+03:00" },
        { startsAt: "2026-11-06T10:00:00+03:00", endsAt: "2026-11-06T10:15:00+03:00" },
      ],
    }) as never,
  )

  renderSlotsPage()

  // Заголовок колонки Слотов — дата автовыбранного первого дня.
  expect(
    await screen.findByRole("heading", { name: "Четверг, 5 ноября" }),
  ).toBeInTheDocument()
  expect(screen.getByRole("button", { name: "09:00 (+03:00)" })).toBeInTheDocument()
  expect(screen.getByRole("button", { name: "09:15 (+03:00)" })).toBeInTheDocument()
  // Слоты другого дня не показываются до выбора дня в календаре.
  expect(
    screen.queryByRole("button", { name: "10:00 (+03:00)" }),
  ).not.toBeInTheDocument()
  // В календаре автовыбранный день отмечен выбранным.
  expect(screen.getByRole("gridcell", { selected: true })).toHaveAttribute(
    "data-day",
    "2026-11-05",
  )
})

test("недоступны дни без Слотов и дни вне Окна записи", async () => {
  vi.spyOn(client, "get").mockResolvedValue(
    okResponse(200, {
      items: [
        { startsAt: "2026-11-05T09:00:00+03:00", endsAt: "2026-11-05T09:15:00+03:00" },
        { startsAt: "2026-11-06T09:00:00+03:00", endsAt: "2026-11-06T09:15:00+03:00" },
      ],
    }) as never,
  )

  const { container } = renderSlotsPage()
  await screen.findByRole("heading", { name: "Четверг, 5 ноября" })

  expect(dayButton(container, "2026-11-05")).toBeEnabled()
  expect(dayButton(container, "2026-11-06")).toBeEnabled()
  // Выходные не глушатся как класс: суббота недоступна не из-за
  // выходного, а из-за отсутствия Слотов.
  expect(dayButton(container, "2026-11-07")).toBeDisabled()
  // День до первого доступного — вне Окна записи.
  expect(dayButton(container, "2026-11-04")).toBeDisabled()
})

test("навигация месяцами не выходит за пределы Окна записи", async () => {
  vi.spyOn(client, "get").mockResolvedValue(
    okResponse(200, {
      items: [
        { startsAt: "2026-11-25T09:00:00+03:00", endsAt: "2026-11-25T09:15:00+03:00" },
        { startsAt: "2026-12-01T09:00:00+03:00", endsAt: "2026-12-01T09:15:00+03:00" },
        { startsAt: "2026-12-08T09:00:00+03:00", endsAt: "2026-12-08T09:15:00+03:00" },
      ],
    }) as never,
  )

  renderSlotsPage()
  await screen.findByRole("heading", { name: "Среда, 25 ноября" })

  // По умолчанию показан месяц первого доступного дня.
  expect(screen.getByText("ноябрь 2026")).toBeInTheDocument()
  expect(
    screen.getByRole("button", { name: "Перейти к предыдущему месяцу" }),
  ).toHaveAttribute("aria-disabled", "true")
  expect(
    screen.getByRole("button", { name: "Перейти к следующему месяцу" }),
  ).not.toHaveAttribute("aria-disabled")

  // react-day-picker пересоздаёт кнопки навигации при смене месяца —
  // запрашиваем их заново после клика.
  fireEvent.click(screen.getByRole("button", { name: "Перейти к следующему месяцу" }))
  expect(screen.getByText("декабрь 2026")).toBeInTheDocument()
  // Дальше декабря навигация не идёт: Окно записи кончилось.
  expect(
    screen.getByRole("button", { name: "Перейти к следующему месяцу" }),
  ).toHaveAttribute("aria-disabled", "true")
  expect(
    screen.getByRole("button", { name: "Перейти к предыдущему месяцу" }),
  ).not.toHaveAttribute("aria-disabled")

  fireEvent.click(screen.getByRole("button", { name: "Перейти к предыдущему месяцу" }))
  expect(screen.getByText("ноябрь 2026")).toBeInTheDocument()
})

test("клик по другому Слоту или дню заменяет выбор", async () => {
  vi.spyOn(client, "get").mockResolvedValue(
    okResponse(200, {
      items: [
        { startsAt: "2026-11-05T09:00:00+03:00", endsAt: "2026-11-05T09:30:00+03:00" },
        { startsAt: "2026-11-05T09:30:00+03:00", endsAt: "2026-11-05T10:00:00+03:00" },
        { startsAt: "2026-11-06T10:00:00+03:00", endsAt: "2026-11-06T10:30:00+03:00" },
      ],
    }) as never,
  )

  const { container } = renderSlotsPage()
  await screen.findByRole("heading", { name: "Четверг, 5 ноября" })

  // Первый выбор: 09:00.
  fireEvent.click(screen.getByRole("button", { name: "09:00 (+03:00)" }))
  expect(screen.getByRole("button", { name: "09:00 (+03:00)" })).toHaveAttribute(
    "aria-pressed",
    "true",
  )

  // Клик по другому времени того же дня заменяет выбор: сводка
  // обновляется на новый интервал.
  fireEvent.click(screen.getByRole("button", { name: "09:30 (+03:00)" }))
  expect(screen.getByRole("button", { name: "09:30 (+03:00)" })).toHaveAttribute(
    "aria-pressed",
    "true",
  )
  expect(screen.getByRole("button", { name: "09:00 (+03:00)" })).toHaveAttribute(
    "aria-pressed",
    "false",
  )
  expect(screen.getByTestId("booking-summary")).toHaveTextContent(
    "09:30 (+03:00) – 10:00 (+03:00)",
  )

  // Клик по другому дню тоже заменяет выбор: Слот сброшен, форма
  // снова неактивна, сводка — подсказка. Форма при этом не исчезает.
  fireEvent.click(dayButton(container, "2026-11-06"))
  expect(screen.getByRole("heading", { name: "Пятница, 6 ноября" })).toBeInTheDocument()
  expect(screen.getByRole("button", { name: "10:00 (+03:00)" })).toBeInTheDocument()
  expect(
    screen.queryByRole("button", { name: "09:00 (+03:00)" }),
  ).not.toBeInTheDocument()
  expect(screen.getByTestId("booking-summary")).toHaveTextContent("Слот не выбран")
  expect(screen.getByLabelText("Имя")).toBeDisabled()
  expect(screen.getByRole("button", { name: "Записаться" })).toBeDisabled()

  // Возврат к первому дню: Слоты на месте, выбора нет.
  fireEvent.click(dayButton(container, "2026-11-05"))
  expect(screen.getByRole("button", { name: "09:00 (+03:00)" })).toHaveAttribute(
    "aria-pressed",
    "false",
  )
})

test("неизвестный тип звонка — понятное сообщение и путь назад", async () => {
  vi.spyOn(client, "get").mockResolvedValue(
    errorResponse(404, {
      code: "call_type_not_found",
      message: "Тип звонка не найден",
    }) as never,
  )

  renderSlotsPage()

  expect(
    await screen.findByRole("heading", { name: "Тип звонка не найден" }),
  ).toBeInTheDocument()
  expect(screen.getByRole("link", { name: "К списку типов звонков" })).toHaveAttribute(
    "href",
    "/",
  )
})

test("форма Записи видна всегда, но до выбора Слота неактивна", async () => {
  vi.spyOn(client, "get").mockResolvedValue(
    okResponse(200, {
      items: [
        { startsAt: "2026-11-05T09:00:00+03:00", endsAt: "2026-11-05T09:30:00+03:00" },
        { startsAt: "2026-11-05T09:30:00+03:00", endsAt: "2026-11-05T10:00:00+03:00" },
      ],
    }) as never,
  )

  renderSlotsPage()
  await screen.findByRole("heading", { name: "Четверг, 5 ноября" })

  // Колонка Записи и форма видны с первого взгляда...
  expect(screen.getByLabelText("Имя")).toBeInTheDocument()
  expect(screen.getByLabelText("Контакт")).toBeInTheDocument()
  expect(screen.getByRole("button", { name: "Записаться" })).toBeInTheDocument()
  // ...но поля и кнопка неактивны, пока Гость не выбрал Слот.
  expect(screen.getByLabelText("Имя")).toBeDisabled()
  expect(screen.getByLabelText("Контакт")).toBeDisabled()
  expect(screen.getByRole("button", { name: "Записаться" })).toBeDisabled()
  // Сводки выбора ещё нет: вместо неё подсказка.
  expect(screen.getByText("Слот не выбран")).toBeInTheDocument()
  // Кнопки сброса выбора нет: выбор заменяется кликом по другому времени.
  expect(
    screen.queryByRole("button", { name: "Выбрать другое время" }),
  ).not.toBeInTheDocument()
})

test("выбор Слота активирует форму и показывает сводку выбора", async () => {
  vi.spyOn(client, "get").mockResolvedValue(
    okResponse(200, {
      items: [
        { startsAt: "2026-11-05T09:00:00+03:00", endsAt: "2026-11-05T09:30:00+03:00" },
      ],
    }) as never,
  )

  renderSlotsPage()
  await screen.findByRole("heading", { name: "Четверг, 5 ноября" })

  fireEvent.click(screen.getByRole("button", { name: "09:00 (+03:00)" }))

  // Форма активируется выбором Слота.
  expect(screen.getByLabelText("Имя")).toBeEnabled()
  expect(screen.getByLabelText("Контакт")).toBeEnabled()
  expect(screen.getByRole("button", { name: "Записаться" })).toBeEnabled()

  // Сводка выбора: дата, интервал с явными смещениями, длительность
  // из границ Слота (без запросов).
  const summary = screen.getByTestId("booking-summary")
  expect(summary).toHaveTextContent("Четверг, 5 ноября")
  expect(summary).toHaveTextContent("09:00 (+03:00) – 09:30 (+03:00)")
  expect(summary).toHaveTextContent("30 минут")
})

test("гость записывается на Слот и видит подтверждение с деталями Записи", async () => {
  vi.spyOn(client, "get").mockResolvedValue(
    okResponse(200, {
      items: [
        { startsAt: "2026-11-05T10:00:00+03:00", endsAt: "2026-11-05T10:15:00+03:00" },
      ],
    }) as never,
  )
  const post = vi.spyOn(client, "post").mockResolvedValue(
    okResponse(201, {
      callTypeId: "intro",
      callTypeName: "Интро-звонок",
      durationMinutes: 15,
      startsAt: "2026-11-05T10:00:00+03:00",
      endsAt: "2026-11-05T10:15:00+03:00",
      guestName: "Миша",
      guestContact: "guest@example.com",
    }) as never,
  )

  renderSlotsPage()

  fireEvent.click(await screen.findByRole("button", { name: "10:00 (+03:00)" }))
  fireEvent.change(screen.getByLabelText("Имя"), { target: { value: "Миша" } })
  fireEvent.change(screen.getByLabelText("Контакт"), {
    target: { value: "guest@example.com" },
  })
  fireEvent.click(screen.getByRole("button", { name: "Записаться" }))

  expect(
    await screen.findByRole("heading", { name: "Запись подтверждена" }),
  ).toBeInTheDocument()
  expect(screen.getByText("Интро-звонок")).toBeInTheDocument()
  expect(screen.getByText("Четверг, 5 ноября")).toBeInTheDocument()
  expect(screen.getByText("10:00 (+03:00) – 10:15 (+03:00)")).toBeInTheDocument()
  expect(screen.getByText("15 минут")).toBeInTheDocument()
  expect(screen.getByText("Миша")).toBeInTheDocument()
  expect(screen.getByText("guest@example.com")).toBeInTheDocument()
  await waitFor(() =>
    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/api/calls",
        body: {
          callTypeId: "intro",
          startsAt: "2026-11-05T10:00:00+03:00",
          guestName: "Миша",
          guestContact: "guest@example.com",
        },
      }),
    ),
  )
})

test("конфликт занятости: понятное сообщение и занятый Слот исчезает из списка", async () => {
  const get = vi
    .spyOn(client, "get")
    .mockResolvedValueOnce(
      okResponse(200, {
        items: [
          { startsAt: "2026-11-05T10:00:00+03:00", endsAt: "2026-11-05T10:15:00+03:00" },
          { startsAt: "2026-11-05T10:15:00+03:00", endsAt: "2026-11-05T10:30:00+03:00" },
        ],
      }) as never,
    )
    // Повторная загрузка после конфликта: занятый Слот уже вырезан.
    .mockResolvedValueOnce(
      okResponse(200, {
        items: [
          { startsAt: "2026-11-05T10:15:00+03:00", endsAt: "2026-11-05T10:30:00+03:00" },
        ],
      }) as never,
    )
  vi.spyOn(client, "post").mockResolvedValueOnce(
    errorResponse(409, {
      code: "slot_taken",
      message: "Это время уже занято другой Записью — выберите другой Слот",
    }) as never,
  )

  renderSlotsPage()

  fireEvent.click(await screen.findByRole("button", { name: "10:00 (+03:00)" }))
  fireEvent.change(screen.getByLabelText("Имя"), { target: { value: "Миша" } })
  fireEvent.change(screen.getByLabelText("Контакт"), {
    target: { value: "guest@example.com" },
  })
  fireEvent.click(screen.getByRole("button", { name: "Записаться" }))

  // Сообщение о конфликте — в колонке формы Записи.
  const formColumn = screen.getByRole("region", { name: "Запись на Слот" })
  expect(await within(formColumn).findByRole("alert")).toHaveTextContent("уже занято")

  // Выбор сброшен: форма снова неактивна, сводка — подсказка.
  expect(screen.getByLabelText("Имя")).toBeDisabled()
  expect(screen.getByLabelText("Контакт")).toBeDisabled()
  expect(screen.getByRole("button", { name: "Записаться" })).toBeDisabled()
  expect(screen.getByTestId("booking-summary")).toHaveTextContent("Слот не выбран")

  // Список обновился: занятый Слот исчез, соседний остался.
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "10:00 (+03:00)" }),
    ).not.toBeInTheDocument(),
  )
  expect(screen.getByRole("button", { name: "10:15 (+03:00)" })).toBeInTheDocument()
  await waitFor(() => expect(get).toHaveBeenCalledTimes(2))
})
