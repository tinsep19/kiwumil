/**
 * FreeVariable: Cassowary ソルバーの生変数
 * 
 * kiwi.Variable が満たすべきインターフェース。
 * id を持たず、純粋に数値制約ソルバーとして動作します。
 */
export interface FreeVariable {
  /**
   * Get the current value of this variable
   */
  value(): number

  /**
   * Get the name of this variable
   */
  name(): string
}

/**
 * LinearConstraint: Cassowary の生制約
 * 
 * これは kiwi.Constraint などの実装固有の型です。
 */
export type LinearConstraint = unknown
