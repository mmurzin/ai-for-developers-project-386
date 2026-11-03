import { fireEvent, render, screen } from "@testing-library/react"
import { expect, test } from "vitest"
import { MemoryRouter } from "react-router"

import { App } from "@/App"

function renderApp() {
  return render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  )
}

test("home renders duration choices", () => {
  renderApp()

  expect(screen.getByRole("heading", { name: "Выберите длительность звонка" })).toBeInTheDocument()
  expect(screen.getByRole("link", { name: "15 минут" })).toBeInTheDocument()
  expect(screen.getByRole("link", { name: "30 минут" })).toBeInTheDocument()
})

test("choosing a duration opens the booking stub", () => {
  renderApp()

  fireEvent.click(screen.getByRole("link", { name: "30 минут" }))

  expect(screen.getByRole("heading", { name: "Страница в разработке" })).toBeInTheDocument()
  expect(screen.getByText("Вы выбрали звонок на 30 минут")).toBeInTheDocument()
})

test("unknown duration redirects home", () => {
  render(
    <MemoryRouter initialEntries={["/booking/45"]}>
      <App />
    </MemoryRouter>
  )

  expect(screen.getByRole("heading", { name: "Выберите длительность звонка" })).toBeInTheDocument()
})
