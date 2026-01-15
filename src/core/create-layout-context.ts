import { createDiContainer } from "./create-di-container"
import { LayoutContext } from "./layout_context"

/**
 * createLayoutContext: LayoutContext を作成
 *
 * Diagram ごとに新しい LayoutContext を作成します。
 * 各 LayoutContext は独立した DiContainer を持ちます。
 *
 * @returns LayoutContext
 *
 * @example
 * const layoutContext = createLayoutContext()
 * const x = layoutContext.variableFactory.createAnchorX("x")
 * layoutContext.constraintFactory.createGeometric("c1", (builder) => {
 *   builder.ct([1, x.freeVariable]).eq([100, 1]).required()
 * })
 * layoutContext.solverEngine.solve()
 * console.log(x.value()) // 100
 */
export function createLayoutContext(): LayoutContext {
  const container = createDiContainer()
  return new LayoutContext(container)
}
