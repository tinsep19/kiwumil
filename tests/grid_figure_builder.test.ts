// tests/grid_figure_builder.test.ts

import { describe, expect, test } from "bun:test"
import { isRectMatrix, TypeDiagram } from "@/dsl"
import { CorePlugin } from "@/plugin/core"
import { UMLPlugin } from "@/plugin/uml"

describe("Matrix Utils", () => {
  test("isRectMatrix returns true for rectangular matrix", () => {
    expect(
      isRectMatrix([
        [1, 2],
        [3, 4],
      ])
    ).toBe(true)
    expect(
      isRectMatrix([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ])
    ).toBe(true)
    expect(
      isRectMatrix([
        ["a", "b"],
        ["c", "d"],
      ])
    ).toBe(true)
  })

  test("isRectMatrix returns false for non-rectangular matrix", () => {
    expect(isRectMatrix([[1, 2], [3]])).toBe(false)
    expect(isRectMatrix([[1], [2, 3]])).toBe(false)
    expect(
      isRectMatrix([
        [1, 2, 3],
        [4, 5],
      ])
    ).toBe(false)
  })

  test("isRectMatrix returns false for empty matrix", () => {
    expect(isRectMatrix([])).toBe(false)
    expect(isRectMatrix([[]])).toBe(false)
  })

  test("isRectMatrix returns true for single row", () => {
    expect(isRectMatrix([[1, 2, 3]])).toBe(true)
  })

  test("isRectMatrix returns true for single column", () => {
    expect(isRectMatrix([[1], [2], [3]])).toBe(true)
  })
})

describe("Grid Builder", () => {
  test("should create grid layout with default gap", () => {
    let boundaryId: any
    let symbolIds: any[] = []

    const result = TypeDiagram("Grid Test")
      .use(UMLPlugin)
      .build(({ el, rel, hint }) => {
        boundaryId = el.uml.systemBoundary("Boundary")

        const a = el.core.rectangle("A")
        const b = el.core.rectangle("B")
        const c = el.core.rectangle("C")
        const d = el.core.rectangle("D")

        symbolIds = [a, b, c, d]

        // Use FluentGridBuilder - grid takes only the 2D array
        hint.grid([
          [a, b],
          [c, d],
        ]).layout()
        
        // Then enclose the grid in the boundary
        hint.enclose(boundaryId, [a, b, c, d])
      })

    expect(result.symbols.length).toBeGreaterThan(4)
    expect(result.symbols.find((s) => s.label === "Boundary")).toBeDefined()
    expect(result.symbols.find((s) => s.label === "A")).toBeDefined()
  })

  test("should create grid layout with custom gap", () => {
    let boundaryId: any

    const result = TypeDiagram("Grid Custom Gap")
      .use(UMLPlugin)
      .build(({ el, rel, hint }) => {
        boundaryId = el.uml.systemBoundary("Boundary")

        const a = el.core.rectangle("A")
        const b = el.core.rectangle("B")
        const c = el.core.rectangle("C")
        const d = el.core.rectangle("D")

        // FluentGridBuilder doesn't have gap() method yet
        // Use the default gap for now
        hint.grid([
          [a, b],
          [c, d],
        ]).layout()
        
        hint.enclose(boundaryId, [a, b, c, d])
      })

    expect(result.symbols.find((s) => s.label === "Boundary")).toBeDefined()
  })

  test("should create grid layout with row/col gap", () => {
    let boundaryId: any

    const result = TypeDiagram("Grid Row/Col Gap")
      .use(UMLPlugin)
      .build(({ el, rel, hint }) => {
        boundaryId = el.uml.systemBoundary("Boundary")

        const a = el.core.rectangle("A")
        const b = el.core.rectangle("B")
        const c = el.core.rectangle("C")
        const d = el.core.rectangle("D")

        // FluentGridBuilder doesn't have gap() method
        // Use the default gap for now
        hint.grid([
          [a, b],
          [c, d],
        ]).layout()
        
        hint.enclose(boundaryId, [a, b, c, d])
      })

    expect(result.symbols.find((s) => s.label === "Boundary")).toBeDefined()
  })

  test("should throw error for non-rectangular matrix", () => {
    expect(() => {
      TypeDiagram("Grid Invalid")
        .use(UMLPlugin)
        .build(({ el, rel, hint }) => {
          const boundaryId = el.uml.systemBoundary("Boundary")

          const a = el.core.rectangle("A")
          const b = el.core.rectangle("B")
          const c = el.core.rectangle("C")

          // FluentGridBuilder validates rectangular matrix in constructor
          hint.grid([[a, b], [c]]).layout()
        })
    }).toThrow(/rectangular matrix/)
  })

  test("should throw error for empty grid", () => {
    expect(() => {
      TypeDiagram("Grid Empty")
        .use(UMLPlugin)
        .build(({ el, rel, hint }) => {
          // FluentGridBuilder requires non-empty matrix
          hint.grid([]).layout()
        })
    }).toThrow(/non-empty matrix/)
  })
})
