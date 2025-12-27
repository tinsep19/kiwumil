import { describe, test, beforeEach, expect } from "bun:test"
import { LayoutContext, Symbols } from "@/model"
import { KiwiSolver } from "@/kiwi"
import { DefaultTheme } from "@/theme"
import { RectangleSymbol } from "@/plugin/core"

describe("UserHintRegistration", () => {
  let context: LayoutContext
  let symbols: Symbols

  beforeEach(() => {
    const solver = new KiwiSolver()
    context = new LayoutContext(solver, DefaultTheme)
    symbols = new Symbols(context.variables)
  })

  function createRectangle(id: string) {
    return symbols.register("test", "rectangle", (symbolId, r) => {
      const bound = r.createLayoutBounds("layout")
      const rect = new RectangleSymbol({
        id: symbolId,
        bounds: bound,
        label: id,
        theme: DefaultTheme,
      })
      r.setSymbol(rect)
      r.setCharacs({ id: symbolId, bounds: bound })
      r.setConstraint((builder) => {
        rect.ensureLayoutBounds(builder)
      })
      return r.build()
    }).characs
  }

  test("should register a user hint with variables and constraints", () => {
    const registration = context.hints.register("custom-guide", (builder) => {
      const xVar = builder.createHintVariable({ baseName: "guide_x", name: "custom" })
      builder.createConstraint("custom-guide/init", (cb) => {
        cb.ct([1, xVar.variable]).eq([150, 1]).strong()
      })
      return builder.build()
    })

    expect(registration.id).toBe("hint:custom-guide/0")
    expect(registration.variables).toHaveLength(1)
    expect(registration.constraints).toHaveLength(1)
    expect(registration.variables[0]?.name).toBe("hint:guide_x_custom")
  })

  test("should allow multiple user hint registrations", () => {
    const reg1 = context.hints.register("guide-x", (builder) => {
      builder.createHintVariable({ baseName: "guide_x", name: "first" })
      return builder.build()
    })

    const reg2 = context.hints.register("guide-y", (builder) => {
      builder.createHintVariable({ baseName: "guide_y", name: "second" })
      return builder.build()
    })

    expect(reg1.id).toBe("hint:guide-x/0")
    expect(reg2.id).toBe("hint:guide-y/1")

    const allRegs = context.hints.getAllRegistrations()
    expect(allRegs).toHaveLength(2)
  })

  test("should find registered hint by ID", () => {
    const registration = context.hints.register("my-hint", (builder) => {
      return builder.build()
    })

    const found = context.hints.findRegistrationById(registration.id)
    expect(found).toBe(registration)
  })

  test("should return undefined for non-existent hint ID", () => {
    const found = context.hints.findRegistrationById("hint:non-existent/999")
    expect(found).toBeUndefined()
  })

  test("should create functional constraints through builder", () => {
    const rect1 = createRectangle("rect1")
    const rect2 = createRectangle("rect2")

    context.hints.register("align-guide", (builder) => {
      const guideX = builder.createHintVariable({ baseName: "align_x", name: "guide" })
      
      // Set guide to x=200
      builder.createConstraint("guide/init", (cb) => {
        cb.ct([1, guideX.variable]).eq([200, 1]).strong()
      })

      // Align both rectangles to the guide
      builder.createConstraint("guide/align-rect1", (cb) => {
        cb.ct([1, rect1.bounds.x]).eq([1, guideX.variable]).strong()
      })

      builder.createConstraint("guide/align-rect2", (cb) => {
        cb.ct([1, rect2.bounds.x]).eq([1, guideX.variable]).strong()
      })

      return builder.build()
    })

    context.solve()

    // Both rectangles should be aligned at x=200
    expect(context.valueOf(rect1.bounds.x)).toBeCloseTo(200, 1)
    expect(context.valueOf(rect2.bounds.x)).toBeCloseTo(200, 1)
  })

  test("should track variables created through builder", () => {
    const initialVarCount = context.hints.getHintVariables().length

    context.hints.register("multi-var-hint", (builder) => {
      builder.createHintVariable({ baseName: "var1" })
      builder.createHintVariable({ baseName: "var2" })
      builder.createHintVariable({ baseName: "var3" })
      return builder.build()
    })

    const allVars = context.hints.getHintVariables()
    expect(allVars.length).toBe(initialVarCount + 3)
  })

  test("should maintain backward compatibility with createHintVariable", () => {
    // Old way still works
    const hintVar = context.hints.createHintVariable({ baseName: "legacy", name: "var" })
    
    expect(hintVar.name).toBe("hint:legacy_var")
    expect(hintVar.variable).toBeDefined()
    
    const allVars = context.hints.getHintVariables()
    expect(allVars.some(v => v.name === "hint:legacy_var")).toBe(true)
  })

  test("should throw error on ID mismatch", () => {
    expect(() => {
      context.hints.register("test-hint", (builder) => {
        // Build with wrong ID
        return {
          id: "wrong-id",
          variables: [],
          constraints: [],
        }
      })
    }).toThrow("UserHint registration id mismatch")
  })
})
