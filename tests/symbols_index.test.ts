import { describe, test, expect, beforeEach } from "bun:test"
import { LayoutContext } from "@/model"
import { Symbols } from "@/dsl"
import { DefaultTheme } from "@/theme"
import type { SymbolId } from "@/model/types"

describe("Symbols Index Map", () => {
  let context: LayoutContext
  let symbols: Symbols

  beforeEach(() => {
    context = new LayoutContext(DefaultTheme)
    symbols = new Symbols(context.variables)
  })

  test("findById should return registered symbol", () => {
    // Register a symbol
    const registration = symbols.register("test-plugin", "test-symbol", (symbolId, builder) => {
      const layout = builder.createBounds("layout", "layout")
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
        cb.expr([1, layout.width]).eq([100, 1]).strong()
        cb.expr([1, layout.height]).eq([100, 1]).strong()
      })
      return builder.build()
    })

    // Test findById
    const found = symbols.findById(registration.symbol.id)
    expect(found).toBeDefined()
    expect(found?.symbol.id).toBe(registration.symbol.id)
  })

  test("findById should return undefined for non-existent id", () => {
    const found = symbols.findById("non-existent:id/0" as SymbolId)
    expect(found).toBeUndefined()
  })

  test("findSymbolById should return registered symbol", () => {
    // Register a symbol
    const registration = symbols.register("test-plugin", "test-symbol", (symbolId, builder) => {
      const layout = builder.createBounds("layout", "layout")
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
        cb.expr([1, layout.width]).eq([100, 1]).strong()
        cb.expr([1, layout.height]).eq([100, 1]).strong()
      })
      return builder.build()
    })

    // Test findSymbolById
    const found = symbols.findSymbolById(registration.symbol.id)
    expect(found).toBeDefined()
    expect(found?.id).toBe(registration.symbol.id)
  })

  test("findSymbolById should return undefined for non-existent id", () => {
    const found = symbols.findSymbolById("non-existent:id/0" as SymbolId)
    expect(found).toBeUndefined()
  })

  test("findById should work with multiple symbols", () => {
    // Register multiple symbols
    const reg1 = symbols.register("plugin1", "symbol1", (symbolId, builder) => {
      const layout = builder.createBounds("layout", "layout")
      builder.setCharacs({ id: symbolId, layout })
      builder.setSymbol({
        id: symbolId,
        render: () => "<svg></svg>",
        getConnectionPoint: (src) => src,
      })
      builder.setConstraint((cb) => {
        cb.expr([1, layout.width]).eq([100, 1]).strong()
        cb.expr([1, layout.height]).eq([100, 1]).strong()
      })
      return builder.build()
    })

    const reg2 = symbols.register("plugin2", "symbol2", (symbolId, builder) => {
      const layout = builder.createBounds("layout", "layout")
      builder.setCharacs({ id: symbolId, layout })
      builder.setSymbol({
        id: symbolId,
        render: () => "<svg></svg>",
        getConnectionPoint: (src) => src,
      })
      builder.setConstraint((cb) => {
        cb.expr([1, layout.width]).eq([100, 1]).strong()
        cb.expr([1, layout.height]).eq([100, 1]).strong()
      })
      return builder.build()
    })

    const reg3 = symbols.register("plugin3", "symbol3", (symbolId, builder) => {
      const layout = builder.createBounds("layout", "layout")
      builder.setCharacs({ id: symbolId, layout })
      builder.setSymbol({
        id: symbolId,
        render: () => "<svg></svg>",
        getConnectionPoint: (src) => src,
      })
      builder.setConstraint((cb) => {
        cb.expr([1, layout.width]).eq([100, 1]).strong()
        cb.expr([1, layout.height]).eq([100, 1]).strong()
      })
      return builder.build()
    })

    // Test that all symbols can be found
    expect(symbols.findById(reg1.symbol.id)?.symbol.id).toBe(reg1.symbol.id)
    expect(symbols.findById(reg2.symbol.id)?.symbol.id).toBe(reg2.symbol.id)
    expect(symbols.findById(reg3.symbol.id)?.symbol.id).toBe(reg3.symbol.id)

    // Verify total count
    expect(symbols.size).toBe(3)
  })

  test("index map should maintain consistency with registrations array", () => {
    // Register multiple symbols
    const registrations = []
    for (let i = 0; i < 5; i++) {
      const reg = symbols.register(`plugin${i}`, `symbol${i}`, (symbolId, builder) => {
        const layout = builder.createBounds("layout", "layout")
        builder.setCharacs({ id: symbolId, layout })
        builder.setSymbol({
          id: symbolId,
          render: () => "<svg></svg>",
          getConnectionPoint: (src) => src,
        })
        builder.setConstraint((cb) => {
          cb.expr([1, layout.width]).eq([100, 1]).strong()
          cb.expr([1, layout.height]).eq([100, 1]).strong()
        })
        return builder.build()
      })
      registrations.push(reg)
    }

    // Verify all registrations can be found via index
    for (const reg of registrations) {
      const found = symbols.findById(reg.symbol.id)
      expect(found).toBe(reg)
    }

    // Verify getAll returns all registrations
    const allRegs = symbols.getAll()
    expect(allRegs.length).toBe(registrations.length)

    // Verify each registration in getAll can be found via findById
    for (const reg of allRegs) {
      const found = symbols.findById(reg.symbol.id)
      expect(found).toBe(reg)
    }
  })
})
