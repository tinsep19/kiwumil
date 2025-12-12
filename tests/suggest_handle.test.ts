import { KiwiSolver } from "@/kiwi"

describe("SuggestHandle", () => {
  test("propagates suggestions and exposes strength label", () => {
    const solver = new KiwiSolver()
    const variable = solver.createVariable("suggest:strong")
    const handle = solver.createHandle(variable).strong()
    handle.suggest(48)
    solver.updateVariables()

    expect(variable.value()).toBe(48)
    expect(handle.strength()).toBe("strong")
  })

  test("prevents reuse after disposal", () => {
    const solver = new KiwiSolver()
    const variable = solver.createVariable("suggest:dispose")
    const handle = solver.createHandle(variable).strong()
    handle.dispose()

    expect(() => handle.suggest(22)).toThrow("SuggestHandle")
  })
})
