// src/layout/layout_variables.ts
import {
  createLayoutVar,
  Operator,
  Strength,
  LayoutSolver,
  type LayoutVar,
  type LayoutTerm,
  type LayoutExpression,
  type LayoutExpressionInput,
} from "./kiwi"
import type {
  Bounds,
  BoundsType,
  LayoutBounds,
  ContainerBounds,
  ItemBounds,
  BoundsMap,
} from "./layout_bound"

// 互換性のため既存の export を維持
export type { LayoutVar, LayoutTerm, LayoutExpression, LayoutExpressionInput }

// 型エイリアスも再エクスポート
export type { BoundsType, LayoutBounds, ContainerBounds, ItemBounds }

// 後方互換性のため deprecated 型を再エクスポート
export type { LayoutType, LayoutBound } from "./layout_bound"

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

  /**
   * Bounds を生成する factory メソッド
   * すべての computed properties (right, bottom, centerX, centerY) も作成し、制約を設定する
   * @param prefix 変数名のプレフィックス
   * @param type レイアウトの種類 (デフォルト: "layout")
   */
  createBound(prefix: string, type: BoundsType = "layout"): Bounds {
    const solver = this.getSolver()
    if (!solver) {
      throw new Error(
        "LayoutVariables: solver is not injected. Cannot create bound with constraints."
      )
    }

    // 基本的な 4 つの変数を作成
    const x = this.createVar(`${prefix}.x`)
    const y = this.createVar(`${prefix}.y`)
    const width = this.createVar(`${prefix}.width`)
    const height = this.createVar(`${prefix}.height`)

    // computed properties を作成
    const right = this.createVar(`${prefix}.right`)
    const bottom = this.createVar(`${prefix}.bottom`)
    const centerX = this.createVar(`${prefix}.centerX`)
    const centerY = this.createVar(`${prefix}.centerY`)

    // right = x + width
    solver.addConstraint(
      right,
      Operator.Eq,
      solver.expression([{ variable: x }, { variable: width }])
    )

    // bottom = y + height
    solver.addConstraint(
      bottom,
      Operator.Eq,
      solver.expression([{ variable: y }, { variable: height }])
    )

    // centerX = x + width * 0.5
    solver.addConstraint(
      centerX,
      Operator.Eq,
      solver.expression([{ variable: x }, { variable: width, coefficient: 0.5 }])
    )

    // centerY = y + height * 0.5
    solver.addConstraint(
      centerY,
      Operator.Eq,
      solver.expression([{ variable: y }, { variable: height, coefficient: 0.5 }])
    )

    return {
      type,
      x,
      y,
      width,
      height,
      right,
      bottom,
      centerX,
      centerY,
    }
  }

  /**
   * 複数の Bounds を一括で生成する factory メソッド
   * @param set キーと BoundsType のマップ
   * @returns キーと対応する型付き Bounds のマップ
   */
  createBoundsSet<T extends Record<string, BoundsType>>(
    set: T
  ): { [K in keyof T]: BoundsMap[T[K]] } {
    const result: Record<string, Bounds> = {}
    for (const [key, type] of Object.entries(set)) {
      result[key] = this.createBound(key, type)
    }
    return result as { [K in keyof T]: BoundsMap[T[K]] }
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
