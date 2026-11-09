import { fireEvent, render, screen, waitFor } from "@testing-library/react"
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

test("слоты сгруппированы по дням, время с явным смещением", async () => {
  vi.spyOn(client, "get").mockResolvedValue(
    okResponse(200, {
      items: [
        { startsAt: "2026-11-05T09:00:00+03:00", endsAt: "2026-11-05T09:15:00+03:00" },
        { startsAt: "2026-11-05T09:15:00+03:00", endsAt: "2026-11-05T09:30:00+03:00" },
        { startsAt: "2026-11-06T09:00:00+03:00", endsAt: "2026-11-06T09:15:00+03:00" },
      ],
    }) as never,
  )

  renderSlotsPage()

  expect(
    await screen.findByRole("heading", { name: "Четверг, 5 ноября" }),
  ).toBeInTheDocument()
  expect(screen.getByRole("heading", { name: "Пятница, 6 ноября" })).toBeInTheDocument()
  // 09:00 есть в оба дня, 09:15 — только в первый.
  expect(screen.getAllByText("09:00 (+03:00)")).toHaveLength(2)
  expect(screen.getByText("09:15 (+03:00)")).toBeInTheDocument()
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

  expect(await screen.findByRole("alert")).toHaveTextContent("уже занято")
  // Список обновился: занятый Слот исчез, соседний остался.
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "10:00 (+03:00)" }),
    ).not.toBeInTheDocument(),
  )
  expect(screen.getByRole("button", { name: "10:15 (+03:00)" })).toBeInTheDocument()
  await waitFor(() => expect(get).toHaveBeenCalledTimes(2))
})
