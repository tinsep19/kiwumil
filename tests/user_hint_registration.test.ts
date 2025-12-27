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

  test("should register a user hint with a constraint", () => {
    const rect1 = createRectangle("rect1")
    
    const registration = context.hints.register("custom-guide", (builder) => {
      const xVar = builder.createVariable("guide_x")
      builder.setConstraint((cb) => {
        cb.ct([1, xVar]).eq([150, 1]).strong()
        cb.ct([1, rect1.bounds.x]).eq([1, xVar]).strong()
      })
      return builder.build()
    })

    expect(registration.id).toBe("hint:custom-guide/0")
    expect(registration.constraint).toBeDefined()
  })

  test("should allow multiple user hint registrations", () => {
    const reg1 = context.hints.register("guide-x", (builder) => {
      const xVar = builder.createVariable("x")
      builder.setConstraint((cb) => {
        cb.ct([1, xVar]).eq([100, 1]).strong()
      })
      return builder.build()
    })

    const reg2 = context.hints.register("guide-y", (builder) => {
      const yVar = builder.createVariable("y")
      builder.setConstraint((cb) => {
        cb.ct([1, yVar]).eq([200, 1]).strong()
      })
      return builder.build()
    })

    expect(reg1.id).toBe("hint:guide-x/0")
    expect(reg2.id).toBe("hint:guide-y/1")

    const allRegs = context.hints.getAllRegistrations()
    expect(allRegs).toHaveLength(2)
  })

  test("should find registered hint by ID", () => {
    const registration = context.hints.register("my-hint", (builder) => {
      const v = builder.createVariable("v")
      builder.setConstraint((cb) => {
        cb.ct([1, v]).eq([0, 1]).strong()
      })
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
      const guideX = builder.createVariable("align_x")
      
      builder.setConstraint((cb) => {
        // Set guide to x=200
        cb.ct([1, guideX]).eq([200, 1]).strong()
        // Align both rectangles to the guide
        cb.ct([1, rect1.bounds.x]).eq([1, guideX]).strong()
        cb.ct([1, rect2.bounds.x]).eq([1, guideX]).strong()
      })

      return builder.build()
    })

    context.solve()

    // Both rectangles should be aligned at x=200
    expect(context.valueOf(rect1.bounds.x)).toBeCloseTo(200, 1)
    expect(context.valueOf(rect2.bounds.x)).toBeCloseTo(200, 1)
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
        const v = builder.createVariable("v")
        builder.setConstraint((cb) => {
          cb.ct([1, v]).eq([0, 1]).strong()
        })
        // Build with wrong ID
        return {
          id: "wrong-id",
          constraint: builder.setConstraint((cb) => {
            cb.ct([1, v]).eq([0, 1]).strong()
          }),
        }
      })
    }).toThrow("UserHint registration id mismatch")
  })

  test("should throw error if constraint is not set", () => {
    expect(() => {
      context.hints.register("test-hint", (builder) => {
        builder.createVariable("v")
        // Don't call setConstraint
        return builder.build()
      })
    }).toThrow("UserHintRegistrationBuilder: constraint not set")
  })
})
