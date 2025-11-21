// src/layout/kiwi/index.ts
// kiwi 依存を集約するラッパーモジュール
import * as kiwi from "@lume/kiwi"

// ブランドシンボル（LayoutVar 型の識別用）
const LAYOUT_VAR_BRAND = Symbol("LayoutVarBrand")

// ====================================
// 型定義
// ====================================

/**
 * ブランド付き kiwi.Variable
 * Layout システム内で使用される変数型
 */
export type LayoutVar = kiwi.Variable & { readonly [LAYOUT_VAR_BRAND]: true }

/**
 * レイアウト式の項（変数 + 係数）
 */
export interface LayoutTerm {
  variable: LayoutVar
  coefficient?: number
}

/**
 * レイアウト式（項の配列 + 定数）
 */
export interface LayoutExpression {
  terms?: LayoutTerm[]
  constant?: number
}

/**
 * レイアウト式の入力型（式、変数、定数のいずれか）
 */
export type LayoutExpressionInput = LayoutExpression | LayoutVar | number

// ====================================
// Operator / Strength の再エクスポート
// ====================================

/**
 * 制約の演算子（等号、以上、以下）
 */
export const Operator = Object.freeze({
  Eq: kiwi.Operator.Eq,
  Ge: kiwi.Operator.Ge,
  Le: kiwi.Operator.Le
} as const)
export type Operator = (typeof Operator)[keyof typeof Operator]

/**
 * 制約の強度（必須、強、弱）
 */
export const Strength = Object.freeze({
  Required: kiwi.Strength.required,
  Strong: kiwi.Strength.strong,
  Weak: kiwi.Strength.weak
} as const)
export type Strength = (typeof Strength)[keyof typeof Strength]

// ====================================
// 型ガード関数
// ====================================

/**
 * LayoutVar 型の判定
 */
export function isLayoutVar(input: LayoutExpressionInput): input is LayoutVar {
  return typeof input === "object" && input !== null && LAYOUT_VAR_BRAND in input
}

/**
 * LayoutExpression 型の判定
 */
export function isLayoutExpression(input: LayoutExpressionInput): input is LayoutExpression {
  if (typeof input !== "object" || input === null) {
    return false
  }
  if (isLayoutVar(input)) {
    return false
  }
  return "terms" in input || "constant" in input
}

// ====================================
// 変換ユーティリティ
// ====================================

/**
 * LayoutExpressionInput を kiwi.Expression に変換
 * 
 * @param input - 変換元（数値、LayoutVar、LayoutExpression）
 * @returns kiwi.Expression
 */
export function toKiwiExpression(input: LayoutExpressionInput): kiwi.Expression {
  // 数値の場合
  if (typeof input === "number") {
    return new kiwi.Expression(input)
  }
  
  // LayoutVar の場合
  if (isLayoutVar(input)) {
    return new kiwi.Expression(input)
  }
  
  // LayoutExpression の場合
  if (isLayoutExpression(input)) {
    let expr = new kiwi.Expression(input.constant ?? 0)
    for (const term of input.terms ?? []) {
      const coefficient = term.coefficient ?? 1
      const termExpr = new kiwi.Expression(term.variable)
      expr = coefficient === 1 ? expr.plus(termExpr) : expr.plus(termExpr.multiply(coefficient))
    }
    return expr
  }
  
  throw new Error("Unsupported expression input")
}

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
    configurable: false
  })
  return variable as LayoutVar
}

// ====================================
// LayoutSolver（kiwi.Solver のラッパー）
// ====================================

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
   * 制約を追加
   * 
   * @param left - 左辺の式
   * @param operator - 演算子
   * @param right - 右辺の式
   * @param strength - 制約の強度（省略可能）
   * @returns 追加された制約オブジェクト
   */
  addConstraint(
    left: LayoutExpressionInput,
    operator: Operator,
    right: LayoutExpressionInput,
    strength?: Strength
  ): kiwi.Constraint {
    const leftExpr = toKiwiExpression(left)
    const rightExpr = toKiwiExpression(right)
    const constraint = new kiwi.Constraint(leftExpr, operator, rightExpr, strength)
    this.solver.addConstraint(constraint)
    return constraint
  }

  /**
   * 制約を削除
   * 
   * @param constraint - 削除する制約
   */
  removeConstraint(constraint: kiwi.Constraint): void {
    this.solver.removeConstraint(constraint)
  }

  /**
   * 変数の編集を開始
   * 
   * @param variable - 編集する変数
   * @param strength - 編集の強度
   */
  addEditVariable(variable: LayoutVar, strength: Strength): void {
    this.solver.addEditVariable(variable, strength)
  }

  /**
   * 変数の編集を終了
   * 
   * @param variable - 編集を終了する変数
   */
  removeEditVariable(variable: LayoutVar): void {
    this.solver.removeEditVariable(variable)
  }

  /**
   * 変数に値を提案（編集中の変数）
   * 
   * @param variable - 値を提案する変数
   * @param value - 提案する値
   */
  suggestValue(variable: LayoutVar, value: number): void {
    this.solver.suggestValue(variable, value)
  }

  /**
   * ソルバーを実行し、すべての変数の値を更新
   */
  updateVariables(): void {
    this.solver.updateVariables()
  }

  /**
   * 内部の kiwi.Solver にアクセス（必要に応じて）
   * 
   * @returns kiwi.Solver
   */
  getInternalSolver(): kiwi.Solver {
    return this.solver
  }
}
