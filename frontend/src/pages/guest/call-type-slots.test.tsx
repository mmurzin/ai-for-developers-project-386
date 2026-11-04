import { render, screen } from "@testing-library/react"
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
