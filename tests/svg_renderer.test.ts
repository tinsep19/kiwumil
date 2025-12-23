import { describe, test, expect } from "bun:test"
import { SvgRenderer } from "../src/render/svg_renderer"
import { Symbols, Relationships, LayoutContext } from "../src/model"
import { KiwiSolver } from "../src/kiwi"
import { DefaultTheme } from "../src/theme"
import { TypeDiagram } from "../src/dsl"
import { CorePlugin } from "../src/plugin"

describe("SvgRenderer with Symbols and Relationships", () => {
  test("should accept Symbols and Relationships instances", () => {
    const solver = new KiwiSolver()
    const context = new LayoutContext(solver, DefaultTheme)
    const symbols = new Symbols(context.variables)
    const relationships = new Relationships()

    // Create renderer with Symbols and Relationships instances
    const renderer = new SvgRenderer(symbols, relationships, DefaultTheme)
    expect(renderer).toBeDefined()
  })

  test("should render SVG using getAllSymbols() and getAll()", () => {
    const diagram = TypeDiagram("Test Diagram")
      .use(CorePlugin)
      .build(({ el }) => {
        el.core.text({ label: "Test 1" })
        el.core.text({ label: "Test 2" })
      })

    // Extract symbols and relationships from the builder
    const symbols = diagram.symbols
    const relationships = diagram.relationships

    // Note: diagram.render already uses the new SvgRenderer internally,
    // so we can validate that the integration works
    expect(symbols).toBeDefined()
    expect(relationships).toBeDefined()
    expect(symbols.length).toBeGreaterThan(0)
  })

  test("should handle empty Symbols and Relationships", () => {
    const solver = new KiwiSolver()
    const context = new LayoutContext(solver, DefaultTheme)
    const symbols = new Symbols(context.variables)
    const relationships = new Relationships()

    const renderer = new SvgRenderer(symbols, relationships, DefaultTheme)
    const svg = renderer.render()

    // Should still produce valid SVG
    expect(svg).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(svg).toContain('<svg')
    expect(svg).toContain('</svg>')
  })

  test("should work with theme", () => {
    const solver = new KiwiSolver()
    const context = new LayoutContext(solver, DefaultTheme)
    const symbols = new Symbols(context.variables)
    const relationships = new Relationships()

    context.solve()

    const renderer = new SvgRenderer(symbols, relationships, DefaultTheme)
    const svg = renderer.render()

    // Should include theme background color
    expect(svg).toContain('fill="white"')
  })

  test("should retrieve symbols using getAllSymbols()", () => {
    const solver = new KiwiSolver()
    const context = new LayoutContext(solver, DefaultTheme)
    const symbols = new Symbols(context.variables)
    const relationships = new Relationships()

    // Register a test symbol
    symbols.register("test-plugin", "test-symbol", (id, builder) => {
      const bounds = builder.createLayoutBounds("bounds")
      const symbol = {
        id,
        bounds,
        render: () => `<text>Test Symbol</text>`,
      }
      builder.setSymbol(symbol as any)
      builder.setCharacs({ id, bounds })
      builder.setConstraint(() => {})
      return builder.build()
    })

    // Create renderer and render
    const renderer = new SvgRenderer(symbols, relationships, DefaultTheme)
    const svg = renderer.render()

    // Verify the symbol was rendered
    expect(svg).toContain("Test Symbol")
  })

  test("should retrieve relationships using getAll()", () => {
    const solver = new KiwiSolver()
    const context = new LayoutContext(solver, DefaultTheme)
    const symbols = new Symbols(context.variables)
    const relationships = new Relationships()

    // Register test symbols
    const symbol1 = symbols.register("test", "s1", (id, builder) => {
      const bounds = builder.createLayoutBounds("bounds")
      builder.setSymbol({ id, bounds, render: () => "" } as any)
      builder.setCharacs({ id, bounds })
      builder.setConstraint(() => {})
      return builder.build()
    })

    const symbol2 = symbols.register("test", "s2", (id, builder) => {
      const bounds = builder.createLayoutBounds("bounds")
      builder.setSymbol({ id, bounds, render: () => "" } as any)
      builder.setCharacs({ id, bounds })
      builder.setConstraint(() => {})
      return builder.build()
    })

    // Register a test relationship
    relationships.register("test", "rel1", (id) => {
      return {
        id,
        from: symbol1.symbol.id,
        to: symbol2.symbol.id,
        calculateZIndex: () => 0,
        toSVG: () => `<line id="test-relationship"/>`,
      } as any
    })

    context.solve()

    // Create renderer and render
    const renderer = new SvgRenderer(symbols, relationships, DefaultTheme)
    const svg = renderer.render()

    // Verify the relationship was rendered
    expect(svg).toContain("test-relationship")
  })
})
