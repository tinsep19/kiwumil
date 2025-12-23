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

describe("Grid Builder (deprecated - tests removed)", () => {
  // These tests have been removed because GridBuilder is deprecated
  // and grid() now only supports FluentGridBuilder.
  // See fluent_grid_api.test.ts for FluentGridBuilder tests.
  test("GridBuilder is deprecated", () => {
    // This is a placeholder test to indicate the old GridBuilder API is no longer supported
    expect(true).toBe(true)
  })
})

describe("Figure Builder", () => {
  test("should create figure layout with default gap", () => {
    let boundaryId: any

    const result = TypeDiagram("Figure Test")
      .use(UMLPlugin)
      .build(({ el, rel, hint }) => {
        boundaryId = el.uml.systemBoundary("Boundary")

        const a = el.core.rectangle("A")
        const b = el.core.rectangle("B")
        const c = el.core.rectangle("C")

        hint
          .figure(boundaryId)
          .enclose([[a, b], [c]] as const)
          .layout()
      })

    expect(result.symbols.find((s) => s.label === "Boundary")).toBeDefined()
    expect(result.symbols.find((s) => s.label === "A")).toBeDefined()
  })

  test("should create figure layout with custom gap", () => {
    let boundaryId: any

    const result = TypeDiagram("Figure Custom Gap")
      .use(UMLPlugin)
      .build(({ el, rel, hint }) => {
        boundaryId = el.uml.systemBoundary("Boundary")

        const a = el.core.rectangle("A")
        const b = el.core.rectangle("B")
        const c = el.core.rectangle("C")

        hint
          .figure(boundaryId)
          .enclose([[a, b], [c]] as const)
          .gap(15)
          .layout()
      })

    expect(result.symbols.find((s) => s.label === "Boundary")).toBeDefined()
  })

  test("should create figure layout with center alignment", () => {
    let boundaryId: any

    const result = TypeDiagram("Figure Center")
      .use(UMLPlugin)
      .build(({ el, rel, hint }) => {
        boundaryId = el.uml.systemBoundary("Boundary")

        const a = el.core.rectangle("A")
        const b = el.core.rectangle("B")
        const c = el.core.rectangle("C")

        hint
          .figure(boundaryId)
          .enclose([[a, b], [c]] as const)
          .align("center")
          .layout()
      })

    expect(result.symbols.find((s) => s.label === "Boundary")).toBeDefined()
  })

  test("should create figure layout with right alignment", () => {
    let boundaryId: any

    const result = TypeDiagram("Figure Right")
      .use(UMLPlugin)
      .build(({ el, rel, hint }) => {
        boundaryId = el.uml.systemBoundary("Boundary")

        const a = el.core.rectangle("A")
        const b = el.core.rectangle("B")
        const c = el.core.rectangle("C")

        hint
          .figure(boundaryId)
          .enclose([[a, b], [c]] as const)
          .align("right")
          .layout()
      })

    expect(result.symbols.find((s) => s.label === "Boundary")).toBeDefined()
  })

  test("should throw error when enclose not called", () => {
    expect(() => {
      TypeDiagram("Figure No Enclose")
        .use(UMLPlugin)
        .build(({ el, rel, hint }) => {
          const boundaryId = el.uml.systemBoundary("Boundary")

          hint.figure(boundaryId).layout()
        })
    }).toThrow(/enclose.*must be called/)
  })

  test("should work with non-rectangular matrix", () => {
    let boundaryId: any

    const result = TypeDiagram("Figure Non-Rect")
      .use(UMLPlugin)
      .build(({ el, rel, hint }) => {
        boundaryId = el.uml.systemBoundary("Boundary")

        const a = el.core.rectangle("A")
        const b = el.core.rectangle("B")
        const c = el.core.rectangle("C")
        const d = el.core.rectangle("D")
        const e = el.core.rectangle("E")

        hint
          .figure(boundaryId)
          .enclose([[a], [b, c, d], [e]] as const)
          .layout()
      })

    expect(result.symbols.find((s) => s.label === "Boundary")).toBeDefined()
    expect(result.symbols.find((s) => s.label === "A")).toBeDefined()
    expect(result.symbols.find((s) => s.label === "E")).toBeDefined()
  })
})
