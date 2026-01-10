// tests/fluent_grid_api.test.ts

import { describe, expect, test } from "bun:test"
import { TypeDiagram } from "@/dsl"
import { CorePlugin } from "@/plugin/core"
import { UMLPlugin } from "@/plugin/uml"

describe("Fluent Grid API", () => {
  test("should create grid with 2D array syntax", () => {
    let gridResult: any

    TypeDiagram("Fluent Grid Test")
      .use(CorePlugin)
      .layout(({ el, hint }) => {
        const symbol1 = el.core.rectangle("Symbol 1")
        const symbol2 = el.core.rectangle("Symbol 2")
        const symbol3 = el.core.rectangle("Symbol 3")
        const symbol4 = el.core.rectangle("Symbol 4")

        // Pass symbol IDs directly - they will be resolved internally
        gridResult = hint.grid([
          [symbol1, symbol2],
          [null, symbol3],
          [null, symbol4],
        ]).layout()
      })
      .render((renderer) => {
        expect(renderer.getSymbols().length).toBeGreaterThanOrEqual(4)
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
  })

  test("should create grid with container", () => {
    let gridResult: any

    TypeDiagram("Fluent Grid with Container")
      .use(UMLPlugin)
      .layout(({ el, hint }) => {
        const container = el.uml.systemBoundary("Container")
        const symbol1 = el.core.rectangle("A")
        const symbol2 = el.core.rectangle("B")
        const symbol3 = el.core.rectangle("C")
        const symbol4 = el.core.rectangle("D")

        gridResult = hint.grid([
          [symbol1, symbol2],
          [symbol3, symbol4],
        ]).in(container)
      })
      .render((renderer) => {
        expect(renderer.getSymbols().find((s) => s.label === "Container")).toBeDefined()
        expect(gridResult).toBeDefined()
        expect(gridResult.x.length).toBe(3) // M+1 = 2+1
        expect(gridResult.y.length).toBe(3) // N+1 = 2+1
      })
  })

  test("should provide getArea method", () => {
    let gridResult: any

    TypeDiagram("Fluent Grid getArea")
      .use(CorePlugin)
      .layout(({ el, hint }) => {
        const symbol1 = el.core.rectangle("1")
        const symbol2 = el.core.rectangle("2")
        const symbol3 = el.core.rectangle("3")
        const symbol4 = el.core.rectangle("4")

        gridResult = hint.grid([
          [symbol1, symbol2],
          [symbol3, symbol4],
        ]).layout()

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
      .layout(({ el, hint }) => {
        const s1 = el.core.rectangle("1")
        const s2 = el.core.rectangle("2")

        gridResult = hint.grid([[s1, s2]]).layout()
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
        .layout(({ el, hint }) => {
          const s1 = el.core.rectangle("1")
          const s2 = el.core.rectangle("2")
          const s3 = el.core.rectangle("3")

          // Non-rectangular matrix should throw
          hint.grid([[s1, s2], [s3]]).layout()
        })
    }).toThrow(/rectangular matrix/)
  })

  test("should throw error for empty matrix", () => {
    expect(() => {
      TypeDiagram("Empty Grid")
        .use(CorePlugin)
        .layout(({ hint, diagram: diagramCharacs }) => {
          hint.grid([]).layout()
        })
    }).toThrow(/non-empty/)
  })
})
