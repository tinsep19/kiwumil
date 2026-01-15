import { describe, it, expect } from "vitest"
import {
  isGeometricConstraint,
  isLayoutHint,
  isSymbolInternalConstraint
} from "../../src/domain/entities/layout-constraint"
import type {
  LayoutConstraint,
  GeometricConstraint,
  LayoutHint,
  SymbolInternalConstraint
} from "../../src/domain/entities/layout-constraint"

describe("LayoutConstraint Discriminated Union", () => {
  describe("GeometricConstraint", () => {
    it("should correctly identify geometric constraints", () => {
      const constraint: GeometricConstraint = {
        id: "test-geometric",
        category: "geometric",
        strength: "required",
        rawConstraints: [],
        description: "Test geometric constraint"
      }

      expect(isGeometricConstraint(constraint)).toBe(true)
      expect(isLayoutHint(constraint)).toBe(false)
      expect(isSymbolInternalConstraint(constraint)).toBe(false)
    })

    it("should only allow required strength", () => {
      // ✅ TypeScript がコンパイル時にチェック
      const constraint: GeometricConstraint = {
        id: "test",
        category: "geometric",
        strength: "required",  // ← "strong" などは型エラー
        rawConstraints: []
      }

      expect(constraint.strength).toBe("required")
    })
  })

  describe("LayoutHint", () => {
    it("should correctly identify layout hints", () => {
      const constraint: LayoutHint = {
        id: "test-hint",
        category: "hint",
        strength: "strong",
        hintType: "arrange",
        rawConstraints: []
      }

      expect(isLayoutHint(constraint)).toBe(true)
      expect(isGeometricConstraint(constraint)).toBe(false)
      expect(isSymbolInternalConstraint(constraint)).toBe(false)
    })

    it("should support all non-required strengths", () => {
      const strengths: Array<"strong" | "medium" | "weak"> = ["strong", "medium", "weak"]

      strengths.forEach(strength => {
        const constraint: LayoutHint = {
          id: `test-${strength}`,
          category: "hint",
          strength,
          hintType: "custom",
          rawConstraints: []
        }

        expect(constraint.strength).toBe(strength)
      })
    })
  })

  describe("SymbolInternalConstraint", () => {
    it("should correctly identify symbol internal constraints", () => {
      const constraint: SymbolInternalConstraint = {
        id: "test-symbol-internal",
        category: "symbol-internal",
        strength: "strong",
        symbolId: "actor-1",
        rawConstraints: []
      }

      expect(isSymbolInternalConstraint(constraint)).toBe(true)
      expect(isGeometricConstraint(constraint)).toBe(false)
      expect(isLayoutHint(constraint)).toBe(false)
    })

    it("should require symbolId", () => {
      const constraint: SymbolInternalConstraint = {
        id: "test",
        category: "symbol-internal",
        strength: "medium",
        symbolId: "usecase-1",
        rawConstraints: []
      }

      expect(constraint.symbolId).toBe("usecase-1")
    })
  })

  describe("Type Safety with Switch", () => {
    it("should maintain type safety in switch statements", () => {
      const constraints: LayoutConstraint[] = [
        {
          id: "geom",
          category: "geometric",
          strength: "required",
          rawConstraints: []
        },
        {
          id: "hint",
          category: "hint",
          strength: "strong",
          hintType: "arrange",
          rawConstraints: []
        },
        {
          id: "symbol",
          category: "symbol-internal",
          strength: "medium",
          symbolId: "test-symbol",
          rawConstraints: []
        }
      ]

      constraints.forEach(c => {
        switch (c.category) {
          case "geometric":
            expect(c.strength).toBe("required")
            break
          case "hint":
            expect(c.hintType).toBeDefined()
            break
          case "symbol-internal":
            expect(c.symbolId).toBeDefined()
            break
          default:
            const _exhaustive: never = c
            throw new Error(`Unhandled category: ${_exhaustive}`)
        }
      })
    })
  })
})
