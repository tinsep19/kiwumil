import { createLayoutVar, LayoutSolver } from "@/layout"

describe("SuggestHandle", () => {
  test("propagates suggestions and exposes strength label", () => {
    const solver = new LayoutSolver()
    const variable = createLayoutVar("suggest:strong")
    const handle = solver.createHandle(variable).strong()
    handle.suggest(48)
    solver.updateVariables()

    expect(variable.value()).toBe(48)
    expect(handle.strength()).toBe("strong")
  })

  test("prevents reuse after disposal", () => {
    const solver = new LayoutSolver()
    const variable = createLayoutVar("suggest:dispose")
    const handle = solver.createHandle(variable).strong()
    handle.dispose()

    expect(() => handle.suggest(22)).toThrow("SuggestHandle")
  })
})
