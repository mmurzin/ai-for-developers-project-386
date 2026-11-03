import { render, screen } from "@testing-library/react"
import { expect, test } from "vitest"
import { App } from "@/App"

test("renders app", () => {
  render(<App />)
  expect(screen.getByRole("heading", { name: "Project ready!" })).toBeInTheDocument()
  expect(screen.getByRole("button", { name: "Button" })).toBeInTheDocument()
})
