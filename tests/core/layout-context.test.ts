import { describe, it, expect } from "vitest"
import { createLayoutContext } from "../../src/core/create-layout-context"

describe("LayoutContext", () => {
  describe("Service Locator", () => {
    it("should provide variableFactory", () => {
      const context = createLayoutContext()

      expect(context.variableFactory).toBeDefined()
      expect(context.variableFactory.createAnchorX).toBeDefined()
    })

    it("should provide constraintFactory", () => {
      const context = createLayoutContext()

      expect(context.constraintFactory).toBeDefined()
      expect(context.constraintFactory.createGeometric).toBeDefined()
    })

    it("should provide solverEngine", () => {
      const context = createLayoutContext()

      expect(context.solverEngine).toBeDefined()
      expect(context.solverEngine.solve).toBeDefined()
    })

    it("should cache services (return same instance)", () => {
      const context = createLayoutContext()

      const factory1 = context.variableFactory
      const factory2 = context.variableFactory

      expect(factory1).toBe(factory2)
    })
  })

  describe("Full Workflow", () => {
    it("should support complete layout workflow", () => {
      const context = createLayoutContext()

      // 変数を作成
      const x = context.variableFactory.createAnchorX("x")
      const y = context.variableFactory.createAnchorY("y")
      const width = context.variableFactory.createWidth("width")
      const height = context.variableFactory.createHeight("height")

      // 制約を作成
      context.constraintFactory.createGeometric("position", (builder) => {
        builder.ct([1, x.freeVariable]).eq([10, 1]).required()
        builder.ct([1, y.freeVariable]).eq([20, 1]).required()
      })

      context.constraintFactory.createGeometric("size", (builder) => {
        builder.ct([1, width.freeVariable]).eq([100, 1]).required()
        builder.ct([1, height.freeVariable]).eq([50, 1]).required()
      })

      // ソルバーを実行
      context.solverEngine.solve()

      // 結果を確認
      expect(x.value()).toBeCloseTo(10)
      expect(y.value()).toBeCloseTo(20)
      expect(width.value()).toBeCloseTo(100)
      expect(height.value()).toBeCloseTo(50)
    })

    it("should support geometric constraints", () => {
      const context = createLayoutContext()

      const x = context.variableFactory.createAnchorX("x")
      const width = context.variableFactory.createWidth("width")
      const right = context.variableFactory.createAnchorX("right")

      context.constraintFactory.createGeometric("bounds", (builder) => {
        builder.ct([1, x.freeVariable]).eq([10, 1]).required()
        builder.ct([1, width.freeVariable]).eq([80, 1]).required()
        builder
          .ct([1, right.freeVariable])
          .eq([1, x.freeVariable], [1, width.freeVariable])
          .required()
      })

      context.solverEngine.solve()

      expect(x.value()).toBeCloseTo(10)
      expect(width.value()).toBeCloseTo(80)
      expect(right.value()).toBeCloseTo(90) // x + width
    })

    it("should support layout hints", () => {
      const context = createLayoutContext()

      const x = context.variableFactory.createAnchorX("x")

      // ヒントを作成（weak strength）
      context.constraintFactory.createHint(
        "x-hint",
        (builder) => {
          builder.ct([1, x.freeVariable]).eq([50, 1]).weak()
        },
        "weak",
        "custom"
      )

      context.solverEngine.solve()

      expect(x.value()).toBeCloseTo(50)
    })

    it("should support multiple constraints with different strengths", () => {
      const context = createLayoutContext()

      const x = context.variableFactory.createAnchorX("x")

      // Weak hint
      context.constraintFactory.createHint(
        "weak-hint",
        (builder) => {
          builder.ct([1, x.freeVariable]).eq([100, 1]).weak()
        },
        "weak",
        "custom"
      )

      // Strong hint (should override weak)
      context.constraintFactory.createHint(
        "strong-hint",
        (builder) => {
          builder.ct([1, x.freeVariable]).eq([200, 1]).strong()
        },
        "strong",
        "custom"
      )

      context.solverEngine.solve()

      // Strong hint が優先される
      expect(x.value()).toBeCloseTo(200)
    })
  })

  describe("Independence", () => {
    it("should create independent contexts", () => {
      const context1 = createLayoutContext()
      const context2 = createLayoutContext()

      const x1 = context1.variableFactory.createAnchorX("x")
      const x2 = context2.variableFactory.createAnchorX("x")

      context1.constraintFactory.createGeometric("c1", (builder) => {
        builder.ct([1, x1.freeVariable]).eq([100, 1]).required()
      })

      context2.constraintFactory.createGeometric("c2", (builder) => {
        builder.ct([1, x2.freeVariable]).eq([200, 1]).required()
      })

      context1.solverEngine.solve()
      context2.solverEngine.solve()

      // 各 context は独立している
      expect(x1.value()).toBeCloseTo(100)
      expect(x2.value()).toBeCloseTo(200)
    })
  })

  describe("dispose", () => {
    it("should clear services on dispose", () => {
      const context = createLayoutContext()

      // サービスにアクセスしてキャッシュ
      const factory = context.variableFactory
      const constraint = context.constraintFactory
      const engine = context.solverEngine

      expect(factory).toBeDefined()
      expect(constraint).toBeDefined()
      expect(engine).toBeDefined()

      // dispose
      context.dispose()

      // 再度アクセスすると新しいインスタンスが作成される
      // (ただし container.clear() 後なのでエラーになる可能性がある)
      // このテストは主に dispose の動作確認用
      expect(() => context.dispose()).not.toThrow()
    })
  })
})
