// src/layout/layout_variables.ts
import { LayoutSolver, type LayoutVariable, type ConstraintSpec, type LayoutConstraint } from "./layout_solver"
import {
  createBoundId,
  type Bounds,
  type BoundsType,
  type LayoutBounds,
  type ContainerBounds,
  type ItemBounds,
  type BoundsMap,
} from "../core"

// 互換性のため既存の export を維持
export type { LayoutVariable }

// 新しい型エイリアス
export type { BoundsType, LayoutBounds, ContainerBounds, ItemBounds }

/**
 * Layout変数とバウンドの生成・管理を担当
 * 式の作成や制約の追加は LayoutSolver が担当
 */
export class LayoutVariables {
  private readonly solver: LayoutSolver

  constructor(solver: LayoutSolver) {
    this.solver = solver
  }

  createVariable(name: string): LayoutVariable {
    return this.solver.createLayoutVariable(name)
  }

  /**
   * @deprecated Use createVariable instead. This method is kept for backward compatibility and will be removed in a future major version.
   */
  createVar(name: string): LayoutVariable {
    return this.createVariable(name)
  }

  /**
   * Bounds を生成する factory メソッド
   * すべての computed properties (right, bottom, centerX, centerY) も作成し、制約を設定する
   * @param prefix 変数名のプレフィックス
   * @param type レイアウトの種類 (デフォルト: "layout")
   */
  createBounds<Type extends BoundsType = "layout">(
    prefix: string,
    type: Type = "layout" as Type
  ): BoundsMap[Type] {
    const boundId = createBoundId(`${prefix}:${type}`)

    // 基本的な 4 つの変数を作成
    const x = this.createVariable(`${prefix}.x`)
    const y = this.createVariable(`${prefix}.y`)
    const width = this.createVariable(`${prefix}.width`)
    const height = this.createVariable(`${prefix}.height`)

    // computed properties を作成
    const right = this.createVariable(`${prefix}.right`)
    const bottom = this.createVariable(`${prefix}.bottom`)
    const centerX = this.createVariable(`${prefix}.centerX`)
    const centerY = this.createVariable(`${prefix}.centerY`)

    this.solver.createConstraint(`${boundId}:computed`, (builder) => {
      builder
        .expr([1, right])
        .eq([1, x], [1, width])
        .strong()
      builder
        .expr([1, bottom])
        .eq([1, y], [1, height])
        .strong()
      builder
        .expr([1, centerX])
        .eq([1, x], [0.5, width])
        .strong()
      builder
        .expr([1, centerY])
        .eq([1, y], [0.5, height])
        .strong()
    })

    return {
      boundId,
      type,
      x,
      y,
      width,
      height,
      right,
      bottom,
      centerX,
      centerY,
    } as BoundsMap[Type]
  }

  /**
   * 複数の Bounds または LayoutVariable を一括で生成する factory メソッド
   * @param set キーと BoundsType または "variable" のマップ
   * @returns キーと対応する型付き Bounds または LayoutVariable のマップ
   */
  createBoundsSet<T extends Record<string, BoundsType | "variable">>(
    set: T
  ): { [K in keyof T]: T[K] extends "variable" ? LayoutVariable : BoundsMap[T[K] & BoundsType] } {
    const result: Record<string, Bounds | LayoutVariable> = {}
    for (const [key, type] of Object.entries(set)) {
      if (type === "variable") {
        result[key] = this.createVariable(key)
      } else {
        result[key] = this.createBounds(key, type)
      }
    }
    return result as { [K in keyof T]: T[K] extends "variable" ? LayoutVariable : BoundsMap[T[K] & BoundsType] }
  }

  valueOf(variable: LayoutVariable): number {
    return variable.value()
  }

  /**
   * Create a constraint by forwarding to the solver.
   * @param name Constraint identifier
   * @param spec Builder callback function
   * @returns LayoutConstraint with id and rawConstraints
   */
  createConstraint(name: string, spec: ConstraintSpec): LayoutConstraint {
    return this.solver.createConstraint(name, spec)
  }

  /**
   * solver へのアクセサ（後方互換性のため）
   * LayoutContext から注入された solver を取得する
   */
  getSolver(): LayoutSolver {
    return this.solver
  }
}
