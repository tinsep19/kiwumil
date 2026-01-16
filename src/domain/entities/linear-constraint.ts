import type { Variable } from "./variable"

/**
 * Operator: 制約の演算子
 */
export type Operator = "==" | "<=" | ">="

/**
 * ConstraintStrength: 制約の強度
 */
export type ConstraintStrength = "required" | "strong" | "medium" | "weak"

/**
 * Term: 制約の項
 * [係数, 変数 | 定数] のタプル
 * 
 * @example
 * [1, width]  // 1×width
 * [2, height]  // 2×height
 * [60, 1]  // 60×1 = 60（定数）
 */
export type Term = [number, Variable | number]

/**
 * LinearConstraint Entity
 * 
 * 線形制約を表す Entity。
 * lhs (左辺) op rhs (右辺) の形式で制約を表現。
 * 
 * Solver に登録すると、Kiwi の Constraint と1対1対応する。
 * 
 * @example
 * // width == 60
 * new LinearConstraint(
 *   [[1, width]],
 *   [[60, 1]],
 *   "==",
 *   "required"
 * )
 * 
 * // right == x + width
 * new LinearConstraint(
 *   [[1, right]],
 *   [[1, x], [1, width]],
 *   "==",
 *   "required"
 * )
 */
export class LinearConstraint {
  constructor(
    private _lhs: Term[],
    private _rhs: Term[],
    private _op: Operator,
    private _strength: ConstraintStrength
  ) {}
  
  /**
   * 左辺の項を取得
   */
  get lhs(): readonly Term[] {
    return this._lhs
  }
  
  /**
   * 右辺の項を取得
   */
  get rhs(): readonly Term[] {
    return this._rhs
  }
  
  /**
   * 演算子を取得
   */
  get op(): Operator {
    return this._op
  }
  
  /**
   * 強度を取得
   */
  get strength(): ConstraintStrength {
    return this._strength
  }
}