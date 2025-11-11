// tests/layout_solver.test.ts
import { describe, test, expect, beforeEach } from "bun:test"
import { LayoutSolver } from "../src/layout/layout_solver"
import { ActorSymbol } from "../src/plugin/uml/symbols/actor_symbol"
import { UsecaseSymbol } from "../src/plugin/uml/symbols/usecase_symbol"
import { SystemBoundarySymbol } from "../src/plugin/uml/symbols/system_boundary_symbol"
import type { LayoutHint } from "../src/dsl/hint_factory"

describe("LayoutSolver", () => {
  let solver: LayoutSolver

  beforeEach(() => {
    solver = new LayoutSolver()
  })

  describe("arrangeHorizontal", () => {
    test("should arrange two elements horizontally with default gap", () => {
      const a = new ActorSymbol("a", "Actor A")
      const b = new ActorSymbol("b", "Actor B")
      
      const hints: LayoutHint[] = [
        { type: "arrangeHorizontal", symbolIds: ["a", "b"] }
      ]
      
      solver.solve([a, b], hints)
      
      // First element at origin (50, 50)
      expect(a.bounds.x).toBe(50)
      expect(a.bounds.y).toBe(50)
      
      // Second element should be gap=80 away horizontally
      expect(b.bounds.x).toBe(a.bounds.x + a.bounds.width + 80)
      expect(b.bounds.y).toBe(a.bounds.y) // Same Y
    })

    test("should arrange three elements horizontally with custom gap", () => {
      const a = new ActorSymbol("a", "A")
      const b = new ActorSymbol("b", "B")
      const c = new ActorSymbol("c", "C")
      
      const hints: LayoutHint[] = [
        { type: "arrangeHorizontal", symbolIds: ["a", "b", "c"], gap: 100 }
      ]
      
      solver.solve([a, b, c], hints)
      
      expect(a.bounds.x).toBe(50)
      expect(b.bounds.x).toBe(a.bounds.x + a.bounds.width + 100)
      expect(c.bounds.x).toBe(b.bounds.x + b.bounds.width + 100)
      
      // All Y coordinates should be the same
      expect(b.bounds.y).toBe(a.bounds.y)
      expect(c.bounds.y).toBe(a.bounds.y)
    })
  })

  describe("arrangeVertical", () => {
    test("should arrange two elements vertically with default gap", () => {
      const a = new UsecaseSymbol("a", "Use Case A")
      const b = new UsecaseSymbol("b", "Use Case B")
      
      const hints: LayoutHint[] = [
        { type: "arrangeVertical", symbolIds: ["a", "b"] }
      ]
      
      solver.solve([a, b], hints)
      
      // First element at origin
      expect(a.bounds.x).toBe(50)
      expect(a.bounds.y).toBe(50)
      
      // Second element should be gap=50 away vertically
      expect(b.bounds.y).toBe(a.bounds.y + a.bounds.height + 50)
      expect(b.bounds.x).toBe(a.bounds.x) // Same X
    })

    test("should arrange three elements vertically with custom gap", () => {
      const a = new UsecaseSymbol("a", "A")
      const b = new UsecaseSymbol("b", "B")
      const c = new UsecaseSymbol("c", "C")
      
      const hints: LayoutHint[] = [
        { type: "arrangeVertical", symbolIds: ["a", "b", "c"], gap: 30 }
      ]
      
      solver.solve([a, b, c], hints)
      
      expect(a.bounds.y).toBe(50)
      expect(b.bounds.y).toBe(a.bounds.y + a.bounds.height + 30)
      expect(c.bounds.y).toBe(b.bounds.y + b.bounds.height + 30)
      
      // All X coordinates should be the same
      expect(b.bounds.x).toBe(a.bounds.x)
      expect(c.bounds.x).toBe(a.bounds.x)
    })
  })

  describe("alignLeft", () => {
    test("should align multiple elements to the left", () => {
      const a = new UsecaseSymbol("a", "A")
      const b = new UsecaseSymbol("b", "B")
      const c = new UsecaseSymbol("c", "C")
      
      const hints: LayoutHint[] = [
        { type: "arrangeVertical", symbolIds: ["a", "b", "c"] },
        { type: "alignLeft", symbolIds: ["a", "b", "c"] }
      ]
      
      solver.solve([a, b, c], hints)
      
      // All elements should have the same X coordinate
      expect(b.bounds.x).toBe(a.bounds.x)
      expect(c.bounds.x).toBe(a.bounds.x)
    })
  })

  describe("alignRight", () => {
    test("should align multiple elements to the right", () => {
      const a = new UsecaseSymbol("a", "Short")
      const b = new UsecaseSymbol("b", "Medium Label")
      const c = new UsecaseSymbol("c", "Very Long Label")
      
      const hints: LayoutHint[] = [
        { type: "arrangeVertical", symbolIds: ["a", "b", "c"] },
        { type: "alignRight", symbolIds: ["a", "b", "c"] }
      ]
      
      solver.solve([a, b, c], hints)
      
      // All elements should have the same right edge
      const rightA = a.bounds.x + a.bounds.width
      const rightB = b.bounds.x + b.bounds.width
      const rightC = c.bounds.x + c.bounds.width
      
      expect(rightB).toBeCloseTo(rightA, 0.01)
      expect(rightC).toBeCloseTo(rightA, 0.01)
    })
  })

  describe("alignTop", () => {
    test("should align multiple elements to the top", () => {
      const a = new ActorSymbol("a", "A")
      const b = new ActorSymbol("b", "B")
      const c = new ActorSymbol("c", "C")
      
      const hints: LayoutHint[] = [
        { type: "arrangeHorizontal", symbolIds: ["a", "b", "c"] },
        { type: "alignTop", symbolIds: ["a", "b", "c"] }
      ]
      
      solver.solve([a, b, c], hints)
      
      // All elements should have the same Y coordinate
      expect(b.bounds.y).toBe(a.bounds.y)
      expect(c.bounds.y).toBe(a.bounds.y)
    })
  })

  describe("alignBottom", () => {
    test("should align multiple elements to the bottom", () => {
      const a = new ActorSymbol("a", "A")
      const b = new ActorSymbol("b", "B")
      const c = new ActorSymbol("c", "C")
      
      const hints: LayoutHint[] = [
        { type: "arrangeHorizontal", symbolIds: ["a", "b", "c"] },
        { type: "alignBottom", symbolIds: ["a", "b", "c"] }
      ]
      
      solver.solve([a, b, c], hints)
      
      // All elements should have the same bottom edge
      const bottomA = a.bounds.y + a.bounds.height
      const bottomB = b.bounds.y + b.bounds.height
      const bottomC = c.bounds.y + c.bounds.height
      
      expect(bottomB).toBeCloseTo(bottomA, 0.01)
      expect(bottomC).toBeCloseTo(bottomA, 0.01)
    })
  })

  describe("alignCenterX", () => {
    test("should align multiple elements on X axis center", () => {
      const a = new UsecaseSymbol("a", "A")
      const b = new UsecaseSymbol("b", "B")
      const c = new UsecaseSymbol("c", "C")
      
      const hints: LayoutHint[] = [
        { type: "arrangeVertical", symbolIds: ["a", "b", "c"] },
        { type: "alignCenterX", symbolIds: ["a", "b", "c"] }
      ]
      
      solver.solve([a, b, c], hints)
      
      // All elements should have the same center X
      const centerA = a.bounds.x + a.bounds.width / 2
      const centerB = b.bounds.x + b.bounds.width / 2
      const centerC = c.bounds.x + c.bounds.width / 2
      
      expect(centerB).toBeCloseTo(centerA, 0.01)
      expect(centerC).toBeCloseTo(centerA, 0.01)
    })
  })

  describe("alignCenterY", () => {
    test("should align multiple elements on Y axis center", () => {
      const a = new ActorSymbol("a", "A")
      const b = new ActorSymbol("b", "B")
      const c = new ActorSymbol("c", "C")
      
      const hints: LayoutHint[] = [
        { type: "arrangeHorizontal", symbolIds: ["a", "b", "c"] },
        { type: "alignCenterY", symbolIds: ["a", "b", "c"] }
      ]
      
      solver.solve([a, b, c], hints)
      
      // All elements should have the same center Y
      const centerA = a.bounds.y + a.bounds.height / 2
      const centerB = b.bounds.y + b.bounds.height / 2
      const centerC = c.bounds.y + c.bounds.height / 2
      
      expect(centerB).toBeCloseTo(centerA, 0.01)
      expect(centerC).toBeCloseTo(centerA, 0.01)
    })
  })

  describe("enclose", () => {
    test("should enclose children inside container with padding", () => {
      const container = new SystemBoundarySymbol("container", "System")
      const child = new UsecaseSymbol("child", "Use Case")
      
      const hints: LayoutHint[] = [
        { type: "enclose", containerId: "container", childIds: ["child"], symbolIds: [] }
      ]
      
      solver.solve([container, child], hints)
      
      const padding = 20
      const labelSpace = 50
      
      // Child should be inside container with padding
      expect(child.bounds.x).toBeGreaterThanOrEqual(container.bounds.x + padding)
      expect(child.bounds.y).toBeGreaterThanOrEqual(container.bounds.y + labelSpace)
      
      // Container should be large enough to contain child
      expect(container.bounds.x + container.bounds.width).toBeGreaterThanOrEqual(
        child.bounds.x + child.bounds.width + padding
      )
      expect(container.bounds.y + container.bounds.height).toBeGreaterThanOrEqual(
        child.bounds.y + child.bounds.height + padding
      )
    })

    test("should auto-expand container to fit multiple children arranged vertically", () => {
      const container = new SystemBoundarySymbol("container", "System")
      const a = new UsecaseSymbol("a", "A")
      const b = new UsecaseSymbol("b", "B")
      const c = new UsecaseSymbol("c", "C")
      
      const hints: LayoutHint[] = [
        { type: "enclose", containerId: "container", childIds: ["a", "b", "c"], symbolIds: [] },
        { type: "arrangeVertical", symbolIds: ["a", "b", "c"], gap: 50 }
      ]
      
      solver.solve([container, a, b, c], hints)
      
      // Children should be arranged vertically
      expect(b.bounds.y).toBe(a.bounds.y + a.bounds.height + 50)
      expect(c.bounds.y).toBe(b.bounds.y + b.bounds.height + 50)
      
      // All children should be inside container
      for (const child of [a, b, c]) {
        expect(child.bounds.x).toBeGreaterThanOrEqual(container.bounds.x + 20)
        expect(child.bounds.y).toBeGreaterThanOrEqual(container.bounds.y + 50)
        expect(child.bounds.x + child.bounds.width).toBeLessThanOrEqual(
          container.bounds.x + container.bounds.width - 20
        )
        expect(child.bounds.y + child.bounds.height).toBeLessThanOrEqual(
          container.bounds.y + container.bounds.height - 20
        )
      }
      
      // Container should be auto-expanded
      expect(container.bounds.height).toBeGreaterThan(100) // Minimum size
    })
  })

  describe("combined constraints", () => {
    test("should handle vertical arrangement with center X alignment", () => {
      const a = new UsecaseSymbol("a", "Short")
      const b = new UsecaseSymbol("b", "Medium Label")
      const c = new UsecaseSymbol("c", "Very Long Label")
      
      const hints: LayoutHint[] = [
        { type: "arrangeVertical", symbolIds: ["a", "b", "c"] },
        { type: "alignCenterX", symbolIds: ["a", "b", "c"] }
      ]
      
      solver.solve([a, b, c], hints)
      
      // Elements should be vertically arranged
      expect(b.bounds.y).toBeGreaterThan(a.bounds.y)
      expect(c.bounds.y).toBeGreaterThan(b.bounds.y)
      
      // Elements should be center-aligned on X axis
      const centerA = a.bounds.x + a.bounds.width / 2
      const centerB = b.bounds.x + b.bounds.width / 2
      const centerC = c.bounds.x + c.bounds.width / 2
      
      expect(centerB).toBeCloseTo(centerA, 0.01)
      expect(centerC).toBeCloseTo(centerA, 0.01)
    })

    test("should handle horizontal arrangement with center Y alignment", () => {
      const a = new ActorSymbol("a", "A")
      const b = new ActorSymbol("b", "B")
      const c = new ActorSymbol("c", "C")
      
      const hints: LayoutHint[] = [
        { type: "arrangeHorizontal", symbolIds: ["a", "b", "c"] },
        { type: "alignCenterY", symbolIds: ["a", "b", "c"] }
      ]
      
      solver.solve([a, b, c], hints)
      
      // Elements should be horizontally arranged
      expect(b.bounds.x).toBeGreaterThan(a.bounds.x)
      expect(c.bounds.x).toBeGreaterThan(b.bounds.x)
      
      // Elements should be center-aligned on Y axis
      const centerA = a.bounds.y + a.bounds.height / 2
      const centerB = b.bounds.y + b.bounds.height / 2
      const centerC = c.bounds.y + c.bounds.height / 2
      
      expect(centerB).toBeCloseTo(centerA, 0.01)
      expect(centerC).toBeCloseTo(centerA, 0.01)
    })
  })

  describe("legacy API compatibility", () => {
    test("should support legacy 'horizontal' hint type", () => {
      const a = new ActorSymbol("a", "A")
      const b = new ActorSymbol("b", "B")
      
      const hints: LayoutHint[] = [
        { type: "horizontal", symbolIds: ["a", "b"] }
      ]
      
      solver.solve([a, b], hints)
      
      expect(b.bounds.x).toBe(a.bounds.x + a.bounds.width + 80)
      expect(b.bounds.y).toBe(a.bounds.y)
    })

    test("should support legacy 'vertical' hint type", () => {
      const a = new UsecaseSymbol("a", "A")
      const b = new UsecaseSymbol("b", "B")
      
      const hints: LayoutHint[] = [
        { type: "vertical", symbolIds: ["a", "b"] }
      ]
      
      solver.solve([a, b], hints)
      
      expect(b.bounds.y).toBe(a.bounds.y + a.bounds.height + 50)
      expect(b.bounds.x).toBe(a.bounds.x)
    })
  })
})
