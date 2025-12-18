// tests/fluent_grid_api.test.ts

import { describe, expect, test } from "bun:test"
import { TypeDiagram } from "@/dsl"
import { CorePlugin } from "@/plugin/core"
import { UMLPlugin } from "@/plugin/uml"

describe("Fluent Grid API", () => {
  test("should create grid with 2D array syntax", () => {
    let gridResult: any

    const result = TypeDiagram("Fluent Grid Test")
      .use(CorePlugin)
      .build(({ el, hint }) => {
        const symbol1 = el.core.rectangle("Symbol 1")
        const symbol2 = el.core.rectangle("Symbol 2")
        const symbol3 = el.core.rectangle("Symbol 3")
        const symbol4 = el.core.rectangle("Symbol 4")

        // Get the symbol characs
        const s1 = hint.getSymbols().find((s) => s.id === symbol1)
        const s2 = hint.getSymbols().find((s) => s.id === symbol2)
        const s3 = hint.getSymbols().find((s) => s.id === symbol3)
        const s4 = hint.getSymbols().find((s) => s.id === symbol4)

        // Use the new fluent grid API
        gridResult = hint.grid([
          [s1, s2],
          [null, s3],
          [null, s4],
        ] as any).layout()
      })

    expect(result.symbols.length).toBeGreaterThanOrEqual(4)
    expect(gridResult).toBeDefined()
    expect(gridResult.x).toBeDefined()
    expect(gridResult.y).toBeDefined()
    expect(gridResult.width).toBeDefined()
    expect(gridResult.height).toBeDefined()

    // Check array sizes: M=2 cols, N=3 rows
    expect(gridResult.x.length).toBe(3) // M+1
    expect(gridResult.y.length).toBe(4) // N+1
    expect(gridResult.width.length).toBe(2) // M
    expect(gridResult.height.length).toBe(3) // N
  })

  test("should create grid with container", () => {
    let gridResult: any

    const result = TypeDiagram("Fluent Grid with Container")
      .use(UMLPlugin)
      .build(({ el, hint }) => {
        const container = el.uml.systemBoundary("Container")
        const symbol1 = el.core.rectangle("A")
        const symbol2 = el.core.rectangle("B")
        const symbol3 = el.core.rectangle("C")
        const symbol4 = el.core.rectangle("D")

        const s1 = hint.getSymbols().find((s) => s.id === symbol1)
        const s2 = hint.getSymbols().find((s) => s.id === symbol2)
        const s3 = hint.getSymbols().find((s) => s.id === symbol3)
        const s4 = hint.getSymbols().find((s) => s.id === symbol4)

        gridResult = hint.grid([
          [s1, s2],
          [s3, s4],
        ] as any).in(container)
      })

    expect(result.symbols.find((s) => s.label === "Container")).toBeDefined()
    expect(gridResult).toBeDefined()
    expect(gridResult.x.length).toBe(3) // M+1 = 2+1
    expect(gridResult.y.length).toBe(3) // N+1 = 2+1
  })

  test("should provide getArea method", () => {
    let gridResult: any

    TypeDiagram("Fluent Grid getArea")
      .use(CorePlugin)
      .build(({ el, hint }) => {
        const symbol1 = el.core.rectangle("1")
        const symbol2 = el.core.rectangle("2")
        const symbol3 = el.core.rectangle("3")
        const symbol4 = el.core.rectangle("4")

        const s1 = hint.getSymbols().find((s) => s.id === symbol1)
        const s2 = hint.getSymbols().find((s) => s.id === symbol2)
        const s3 = hint.getSymbols().find((s) => s.id === symbol3)
        const s4 = hint.getSymbols().find((s) => s.id === symbol4)

        gridResult = hint.grid([
          [s1, s2],
          [s3, s4],
        ] as any).layout()

        // Test getArea
        const cell = gridResult.getArea({ top: 0, left: 0, bottom: 1, right: 1 })
        expect(cell).toBeDefined()
        expect(cell.left).toBeDefined()
        expect(cell.top).toBeDefined()
        expect(cell.right).toBeDefined()
        expect(cell.bottom).toBeDefined()

        // Test spanning multiple cells
        const spanCell = gridResult.getArea({ top: 0, left: 0, bottom: 2, right: 2 })
        expect(spanCell).toBeDefined()
      })

    expect(gridResult).toBeDefined()
  })

  test("should throw error for invalid getArea bounds", () => {
    let gridResult: any

    TypeDiagram("Grid Invalid Bounds")
      .use(CorePlugin)
      .build(({ el, hint }) => {
        const s1 = el.core.rectangle("1")
        const s2 = el.core.rectangle("2")

        const sym1 = hint.getSymbols().find((s) => s.id === s1)
        const sym2 = hint.getSymbols().find((s) => s.id === s2)

        gridResult = hint.grid([[sym1, sym2]] as any).layout()
      })

    expect(() => {
      gridResult.getArea({ top: 0, left: 0, bottom: 0, right: 1 })
    }).toThrow()

    expect(() => {
      gridResult.getArea({ top: 0, left: 0, bottom: 1, right: 0 })
    }).toThrow()

    expect(() => {
      gridResult.getArea({ top: -1, left: 0, bottom: 1, right: 1 })
    }).toThrow()
  })

  test("should throw error for non-rectangular matrix", () => {
    expect(() => {
      TypeDiagram("Non-Rect Grid")
        .use(CorePlugin)
        .build(({ el, hint }) => {
          const s1 = el.core.rectangle("1")
          const s2 = el.core.rectangle("2")
          const s3 = el.core.rectangle("3")

          const sym1 = hint.getSymbols().find((s) => s.id === s1)
          const sym2 = hint.getSymbols().find((s) => s.id === s2)
          const sym3 = hint.getSymbols().find((s) => s.id === s3)

          // Non-rectangular matrix should throw
          hint.grid([[sym1, sym2], [sym3]] as any).layout()
        })
    }).toThrow(/rectangular matrix/)
  })

  test("should throw error for empty matrix", () => {
    expect(() => {
      TypeDiagram("Empty Grid")
        .use(CorePlugin)
        .build(({ hint }) => {
          hint.grid([]).layout()
        })
    }).toThrow(/non-empty/)
  })
})
