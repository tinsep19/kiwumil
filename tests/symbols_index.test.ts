import { describe, test, expect, beforeEach } from "bun:test"
import { LayoutContext } from "@/model"
import { KiwiSolver } from "@/kiwi"
import { Symbols } from "@/dsl"
import { DefaultTheme } from "@/theme"
import type { SymbolId } from "@/core/symbols"
import type { SymbolRegistration } from "@/model/symbols"

describe("Symbols Index Map", () => {
  let context: LayoutContext

  beforeEach(() => {
    const solver = new KiwiSolver()
    context = new LayoutContext(solver, DefaultTheme)
  })

  // Helper function to create a test symbol registration
  const createTestSymbol = (plugin: string, symbolName: string): SymbolRegistration => {
    return context.symbols.register(plugin, symbolName, (symbolId, builder) => {
      const layout = builder.createLayoutBounds("layout")
      builder.setCharacs({
        id: symbolId,
        layout,
      })
      builder.setSymbol({
        id: symbolId,
        render: () => "<svg></svg>",
        getConnectionPoint: (src) => src,
      })
      builder.setConstraint((cb) => {
        cb.ct([1, layout.width]).eq([100, 1]).strong()
        cb.ct([1, layout.height]).eq([100, 1]).strong()
      })
      return builder.build()
    })
  }

  test("findById should return registered symbol", () => {
    const registration = createTestSymbol("test-plugin", "test-symbol")

    // Test findById
    const found = context.symbols.findById(registration.symbol.id)
    expect(found).toBeDefined()
    expect(found?.symbol.id).toBe(registration.symbol.id)
  })

  test("findById should return undefined for non-existent id", () => {
    const found = context.symbols.findById("non-existent:id/0" as SymbolId)
    expect(found).toBeUndefined()
  })

  test("findSymbolById should return registered symbol", () => {
    const registration = createTestSymbol("test-plugin", "test-symbol")

    // Test findSymbolById
    const found = context.symbols.findSymbolById(registration.symbol.id)
    expect(found).toBeDefined()
    expect(found?.id).toBe(registration.symbol.id)
  })

  test("findSymbolById should return undefined for non-existent id", () => {
    const found = context.symbols.findSymbolById("non-existent:id/0" as SymbolId)
    expect(found).toBeUndefined()
  })

  test("findById should work with multiple symbols", () => {
    // Register multiple symbols using helper
    const reg1 = createTestSymbol("plugin1", "symbol1")
    const reg2 = createTestSymbol("plugin2", "symbol2")
    const reg3 = createTestSymbol("plugin3", "symbol3")

    // Test that all symbols can be found
    expect(context.symbols.findById(reg1.symbol.id)?.symbol.id).toBe(reg1.symbol.id)
    expect(context.symbols.findById(reg2.symbol.id)?.symbol.id).toBe(reg2.symbol.id)
    expect(context.symbols.findById(reg3.symbol.id)?.symbol.id).toBe(reg3.symbol.id)

    // Verify total count
    expect(context.symbols.size).toBe(3)
  })

  test("index map should maintain consistency with registrations array", () => {
    // Register multiple symbols using helper
    const registrations = []
    for (let i = 0; i < 5; i++) {
      registrations.push(createTestSymbol(`plugin${i}`, `symbol${i}`))
    }

    // Verify all registrations can be found via index
    for (const reg of registrations) {
      const found = context.symbols.findById(reg.symbol.id)
      expect(found).toBe(reg)
    }

    // Verify getAll returns all registrations
    const allRegs = context.symbols.getAll()
    expect(allRegs.length).toBe(registrations.length)

    // Verify each registration in getAll can be found via findById
    for (const reg of allRegs) {
      const found = context.symbols.findById(reg.symbol.id)
      expect(found).toBe(reg)
    }
  })
})
