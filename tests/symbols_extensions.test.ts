import { describe, test, expect, beforeEach } from "bun:test"
import { LayoutContext } from "@/model"
import { KiwiSolver } from "@/kiwi"
import { Symbols } from "@/dsl"
import { DefaultTheme } from "@/theme"
import type { ISymbolCharacs, Variable } from "@/core"
import type { SymbolRegistration } from "@/model/symbols"

/**
 * Extended symbol characteristics for testing
 * This type adds custom fields to ISymbolCharacs
 */
type ITestSymbolCharacs = ISymbolCharacs<{
  customField: string
  customVariable: Variable
}>

describe("Symbol Extensions with ISymbolCharacs", () => {
  let context: LayoutContext
  let symbols: Symbols

  beforeEach(() => {
    const solver = new KiwiSolver()
    context = new LayoutContext(solver, DefaultTheme)
    symbols = new Symbols(context.variables)
  })

  test("should create symbol with extended fields", () => {
    const registration = symbols.register("test-plugin", "extended-symbol", (symbolId, builder) => {
      const layout = builder.createLayoutBounds("layout")
      const customVar = builder.createVariable("customVar")

      // Set characs with extended fields
      builder.setCharacs({
        id: symbolId,
        bounds: layout,
        customField: "test-value",
        customVariable: customVar,
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

    expect(registration).toBeDefined()
    expect(registration.symbol.id).toContain("test-plugin:extended-symbol")
    expect(registration.characs.id).toBe(registration.symbol.id)
    expect(registration.characs.bounds).toBeDefined()

    // Verify extended fields are present in characs
    const characs = registration.characs as any
    expect(characs.customField).toBe("test-value")
    expect(characs.customVariable).toBeDefined()
  })

  test("should correctly handle multiple symbols with different extended fields", () => {
    // Symbol 1: with customField and customVariable
    const reg1 = symbols.register("plugin1", "symbol1", (symbolId, builder) => {
      const layout = builder.createLayoutBounds("layout")
      const customVar = builder.createVariable("customVar")

      builder.setCharacs({
        id: symbolId,
        bounds: layout,
        customField: "value1",
        customVariable: customVar,
      })

      builder.setSymbol({
        id: symbolId,
        render: () => "<svg></svg>",
        getConnectionPoint: (src) => src,
      })

      builder.setConstraint((cb) => {
        cb.ct([1, layout.width]).eq([50, 1]).strong()
        cb.ct([1, layout.height]).eq([50, 1]).strong()
      })

      return builder.build()
    })

    // Symbol 2: with different extended fields
    const reg2 = symbols.register("plugin2", "symbol2", (symbolId, builder) => {
      const layout = builder.createLayoutBounds("layout")
      const extraVar = builder.createVariable("extraVar")

      builder.setCharacs({
        id: symbolId,
        bounds: layout,
        extraProperty: "value2",
        extraVariable: extraVar,
      })

      builder.setSymbol({
        id: symbolId,
        render: () => "<svg></svg>",
        getConnectionPoint: (src) => src,
      })

      builder.setConstraint((cb) => {
        cb.ct([1, layout.width]).eq([75, 1]).strong()
        cb.ct([1, layout.height]).eq([75, 1]).strong()
      })

      return builder.build()
    })

    // Verify both symbols are registered
    expect(symbols.size).toBe(2)

    // Verify each symbol has its own extended fields
    const characs1 = reg1.characs as any
    expect(characs1.customField).toBe("value1")
    expect(characs1.customVariable).toBeDefined()

    const characs2 = reg2.characs as any
    expect(characs2.extraProperty).toBe("value2")
    expect(characs2.extraVariable).toBeDefined()
  })

  test("should preserve extended fields when retrieving symbols by id", () => {
    const registration = symbols.register("test-plugin", "preserved-symbol", (symbolId, builder) => {
      const layout = builder.createLayoutBounds("layout")
      const testVar = builder.createVariable("testVar")

      builder.setCharacs({
        id: symbolId,
        bounds: layout,
        preservedField: "should-persist",
        preservedVariable: testVar,
      })

      builder.setSymbol({
        id: symbolId,
        render: () => "<svg></svg>",
        getConnectionPoint: (src) => src,
      })

      builder.setConstraint((cb) => {
        cb.ct([1, layout.width]).eq([60, 1]).strong()
        cb.ct([1, layout.height]).eq([60, 1]).strong()
      })

      return builder.build()
    })

    // Retrieve by ID
    const found = symbols.findById(registration.symbol.id)
    expect(found).toBeDefined()

    // Verify extended fields are preserved
    const foundCharacs = found!.characs as any
    expect(foundCharacs.preservedField).toBe("should-persist")
    expect(foundCharacs.preservedVariable).toBeDefined()
    expect(foundCharacs.preservedVariable).toBe((registration.characs as any).preservedVariable)
  })

  test("should support symbols with container bounds as extended field", () => {
    const registration = symbols.register("test-plugin", "container-symbol", (symbolId, builder) => {
      const layout = builder.createLayoutBounds("layout")
      const container = builder.createContainerBounds("container")

      builder.setCharacs({
        id: symbolId,
        bounds: layout,
        container: container,
      })

      builder.setSymbol({
        id: symbolId,
        render: () => "<svg></svg>",
        getConnectionPoint: (src) => src,
      })

      builder.setConstraint((cb) => {
        cb.ct([1, layout.width]).eq([200, 1]).strong()
        cb.ct([1, layout.height]).eq([200, 1]).strong()
      })

      return builder.build()
    })

    expect(registration).toBeDefined()
    expect(registration.characs.bounds).toBeDefined()

    const characs = registration.characs as any
    expect(characs.container).toBeDefined()
    expect(characs.container.type).toBe("container")
  })

  test("should support symbols with item bounds as extended field", () => {
    const registration = symbols.register("test-plugin", "item-symbol", (symbolId, builder) => {
      const layout = builder.createLayoutBounds("layout")
      const item = builder.createItemBounds("item")

      builder.setCharacs({
        id: symbolId,
        bounds: layout,
        itemBounds: item,
      })

      builder.setSymbol({
        id: symbolId,
        render: () => "<svg></svg>",
        getConnectionPoint: (src) => src,
      })

      builder.setConstraint((cb) => {
        cb.ct([1, layout.width]).eq([80, 1]).strong()
        cb.ct([1, layout.height]).eq([80, 1]).strong()
      })

      return builder.build()
    })

    expect(registration).toBeDefined()
    const characs = registration.characs as any
    expect(characs.itemBounds).toBeDefined()
    expect(characs.itemBounds.type).toBe("item")
  })

  test("should support multiple variables as extended fields", () => {
    const registration = symbols.register("test-plugin", "multi-var-symbol", (symbolId, builder) => {
      const layout = builder.createLayoutBounds("layout")
      const var1 = builder.createVariable("var1")
      const var2 = builder.createVariable("var2")
      const var3 = builder.createVariable("var3")

      builder.setCharacs({
        id: symbolId,
        bounds: layout,
        variable1: var1,
        variable2: var2,
        variable3: var3,
      })

      builder.setSymbol({
        id: symbolId,
        render: () => "<svg></svg>",
        getConnectionPoint: (src) => src,
      })

      builder.setConstraint((cb) => {
        cb.ct([1, layout.width]).eq([90, 1]).strong()
        cb.ct([1, layout.height]).eq([90, 1]).strong()
      })

      return builder.build()
    })

    const characs = registration.characs as any
    expect(characs.variable1).toBeDefined()
    expect(characs.variable2).toBeDefined()
    expect(characs.variable3).toBeDefined()
  })
})
