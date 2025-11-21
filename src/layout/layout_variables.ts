// src/layout/layout_variables.ts
import {
  createLayoutVar,
  Operator,
  Strength,
  LayoutSolver,
  type LayoutVar,
  type LayoutTerm,
  type LayoutExpression,
  type LayoutExpressionInput
} from "./kiwi"

// 互換性のため既存の export を維持
export type { LayoutVar, LayoutTerm, LayoutExpression, LayoutExpressionInput }

// LayoutConstraints で定義されているが、互換性のためここでも再エクスポート
export const LayoutConstraintOperator = Operator
export type LayoutConstraintOperator = Operator

export const LayoutConstraintStrength = Strength
export type LayoutConstraintStrength = Strength

/**
 * Layout変数とバウンドの生成・管理を担当
 * 式の作成や制約の追加は LayoutSolver が担当
 */
export class LayoutVariables {
  private readonly solver?: LayoutSolver

  constructor(solver?: LayoutSolver) {
    this.solver = solver
  }

  createVar(name: string): LayoutVar {
    return createLayoutVar(name)
  }

  valueOf(variable: LayoutVar): number {
    return variable.value()
  }

  /**
   * solver へのアクセサ（後方互換性のため）
   * LayoutContext から注入された solver を取得する
   */
  getSolver(): LayoutSolver | undefined {
    return this.solver
  }
}
