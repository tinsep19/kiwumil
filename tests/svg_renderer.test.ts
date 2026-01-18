import { describe, test, expect } from "bun:test"
import { SvgRenderer } from "../src/render/svg_renderer"
import { SymbolRegistry, RelationshipRegistry, LayoutContext } from "../src/model"
import { KiwiSolver } from "../src/kiwi"
import { DefaultTheme } from "../src/theme"
import { TypeDiagram } from "../src/dsl"
import { CorePlugin } from "../src/plugin"

describe("SvgRenderer with Symbols and Relationships", () => {
  test("should accept Symbols and Relationships instances", () => {
    const solver = new KiwiSolver()
    const context = new LayoutContext(solver, DefaultTheme)

    // Create renderer with LayoutContext
    const renderer = new SvgRenderer(context)
    expect(renderer).toBeDefined()
  })

  test("should render SVG using LayoutContext", () => {
    const solver = new KiwiSolver()
    const context = new LayoutContext(solver, DefaultTheme)

    // Register some test symbols
    context.symbols.register("test", "text1", (id, builder) => {
      const bounds = builder.createLayoutBounds("bounds")
      const symbol = {
        id,
        bounds,
        render: () => `<text>Test 1</text>`,
      }
      builder.setSymbol(symbol as any)
      builder.setCharacs({ id, bounds })
      builder.setConstraint(() => {})
      return builder.build()
    })

    context.symbols.register("test", "text2", (id, builder) => {
      const bounds = builder.createLayoutBounds("bounds")
      const symbol = {
        id,
        bounds,
        render: () => `<text>Test 2</text>`,
      }
      builder.setSymbol(symbol as any)
      builder.setCharacs({ id, bounds })
      builder.setConstraint(() => {})
      return builder.build()
    })

    context.solve()

    // Create renderer with LayoutContext and render
    const renderer = new SvgRenderer(context)
    const svg = renderer.render()

    // Verify both symbols were rendered
    expect(svg).toContain("Test 1")
    expect(svg).toContain("Test 2")
  })

  test("should handle empty Symbols and Relationships", () => {
    const solver = new KiwiSolver()
    const context = new LayoutContext(solver, DefaultTheme)

    const renderer = new SvgRenderer(context)
    const svg = renderer.render()

    // Should still produce valid SVG
    expect(svg).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(svg).toContain("<svg")
    expect(svg).toContain("</svg>")
  })

  test("should work with theme", () => {
    const solver = new KiwiSolver()
    const context = new LayoutContext(solver, DefaultTheme)

    context.solve()

    const renderer = new SvgRenderer(context)
    const svg = renderer.render()

    // Should include theme background color
    expect(svg).toContain('fill="white"')
  })

  test("should retrieve symbols using getAllSymbols()", () => {
    const solver = new KiwiSolver()
    const context = new LayoutContext(solver, DefaultTheme)

    // Register a test symbol
    context.symbols.register("test-plugin", "test-symbol", (id, builder) => {
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
    const renderer = new SvgRenderer(context)
    const svg = renderer.render()

    // Verify the symbol was rendered
    expect(svg).toContain("Test Symbol")
  })

  test("should retrieve relationships using getAll()", () => {
    const solver = new KiwiSolver()
    const context = new LayoutContext(solver, DefaultTheme)

    // Register test symbols
    const symbol1 = context.symbols.register("test", "s1", (id, builder) => {
      const bounds = builder.createLayoutBounds("bounds")
      builder.setSymbol({ id, bounds, render: () => "" } as any)
      builder.setCharacs({ id, bounds })
      builder.setConstraint(() => {})
      return builder.build()
    })

    const symbol2 = context.symbols.register("test", "s2", (id, builder) => {
      const bounds = builder.createLayoutBounds("bounds")
      builder.setSymbol({ id, bounds, render: () => "" } as any)
      builder.setCharacs({ id, bounds })
      builder.setConstraint(() => {})
      return builder.build()
    })

    // Register a test relationship
    context.relationships.register("test", "rel1", (id) => {
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
    const renderer = new SvgRenderer(context)
    const svg = renderer.render()

    // Verify the relationship was rendered
    expect(svg).toContain("test-relationship")
  })
})
