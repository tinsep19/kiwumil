import { describe, it, expect } from "vitest"
import { createLayoutContext } from "../../src/core/create-layout-context"

describe("Layout Workflow Integration", () => {
  it("should create a simple box layout", () => {
    const context = createLayoutContext()

    // Box の変数を作成
    const x = context.variableFactory.createAnchorX("box.x")
    const y = context.variableFactory.createAnchorY("box.y")
    const width = context.variableFactory.createWidth("box.width")
    const height = context.variableFactory.createHeight("box.height")

    // 位置とサイズを制約
    context.constraintFactory.createGeometric("box.position-size", (builder) => {
      builder.ct([1, x.freeVariable]).eq([10, 1]).required()
      builder.ct([1, y.freeVariable]).eq([20, 1]).required()
      builder.ct([1, width.freeVariable]).eq([100, 1]).required()
      builder.ct([1, height.freeVariable]).eq([50, 1]).required()
    })

    // right と bottom を計算
    const right = context.variableFactory.createAnchorX("box.right")
    const bottom = context.variableFactory.createAnchorY("box.bottom")

    context.constraintFactory.createGeometric("box.derived", (builder) => {
      builder
        .ct([1, right.freeVariable])
        .eq([1, x.freeVariable], [1, width.freeVariable])
        .required()
      builder
        .ct([1, bottom.freeVariable])
        .eq([1, y.freeVariable], [1, height.freeVariable])
        .required()
    })

    // ソルバーを実行
    context.solverEngine.solve()

    // 結果を確認
    expect(x.value()).toBeCloseTo(10)
    expect(y.value()).toBeCloseTo(20)
    expect(width.value()).toBeCloseTo(100)
    expect(height.value()).toBeCloseTo(50)
    expect(right.value()).toBeCloseTo(110) // x + width
    expect(bottom.value()).toBeCloseTo(70) // y + height
  })

  it("should arrange boxes horizontally", () => {
    const context = createLayoutContext()

    // Box 1
    const x1 = context.variableFactory.createAnchorX("box1.x")
    const width1 = context.variableFactory.createWidth("box1.width")

    // Box 2
    const x2 = context.variableFactory.createAnchorX("box2.x")
    const width2 = context.variableFactory.createWidth("box2.width")

    // Box 1 の制約
    context.constraintFactory.createGeometric("box1", (builder) => {
      builder.ct([1, x1.freeVariable]).eq([0, 1]).required()
      builder.ct([1, width1.freeVariable]).eq([50, 1]).required()
    })

    // Box 2 の制約
    context.constraintFactory.createGeometric("box2.width", (builder) => {
      builder.ct([1, width2.freeVariable]).eq([50, 1]).required()
    })

    // 水平配置（x2 = x1 + width1）
    context.constraintFactory.createHint(
      "arrange-horizontal",
      (builder) => {
        builder.ct([1, x2.freeVariable]).eq([1, x1.freeVariable], [1, width1.freeVariable]).strong()
      },
      "strong",
      "arrange"
    )

    // ソルバーを実行
    context.solverEngine.solve()

    // 結果を確認
    expect(x1.value()).toBeCloseTo(0)
    expect(width1.value()).toBeCloseTo(50)
    expect(x2.value()).toBeCloseTo(50) // x1 + width1
    expect(width2.value()).toBeCloseTo(50)
  })
})
