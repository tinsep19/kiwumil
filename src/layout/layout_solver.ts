// src/layout/layout_solver.ts
// kiwi 依存を集約するラッパーモジュール
import * as kiwi from "@lume/kiwi"
import { LAYOUT_VAR_BRAND, type LayoutVar } from "./layout_types"
import { ConstraintsBuilder } from "./constraints_builder"

/**
 * ブランド付き LayoutVar を作成
 *
 * @param name - 変数名
 * @returns LayoutVar
 */
export function createLayoutVar(name: string): LayoutVar {
  const variable = new kiwi.Variable(name)
  Object.defineProperty(variable, LAYOUT_VAR_BRAND, {
    value: true,
    enumerable: false,
    configurable: false,
  })
  return variable as LayoutVar
}

export type { LayoutVar } from "./layout_types"

/**
 * kiwi.Solver のラッパークラス
 * ソルバーのライフサイクル管理と操作を集約
 */
export class LayoutSolver {
  private readonly solver: kiwi.Solver

  constructor() {
    this.solver = new kiwi.Solver()
  }

  /**
   * 制約の編集を開始
   */
  addEditVariable(variable: LayoutVar, strength: kiwi.Strength): void {
    this.solver.addEditVariable(variable, strength)
  }

  /**
   * 変数の編集を終了
   */
  removeEditVariable(variable: LayoutVar): void {
    this.solver.removeEditVariable(variable)
  }

  /**
   * 変数に値を提案
   */
  suggestValue(variable: LayoutVar, value: number): void {
    this.solver.suggestValue(variable, value)
  }

  /**
   * 変数を更新
   */
  updateVariables(): void {
    this.solver.updateVariables()
  }

  /**
   * Fluent ConstraintBuilder を作成
   */
  createConstraintsBuilder(): ConstraintsBuilder {
    return new ConstraintsBuilder(this.solver)
  }
}
