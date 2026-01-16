import type { Variable } from "@/domain/entities/variable"
import type { LinearConstraint } from "@/domain/entities/linear-constraint"

/**
 * ICassowarySolver: Cassowary ソルバーのインターフェース
 * 
 * Domain Layer が依存するソルバーの抽象インターフェース。
 * Infrastructure Layer で実装される（DIP: 依存関係逆転の原則）。
 */
export interface ICassowarySolver {
  /**
   * 変数を追加
   */
  addVariable(variable: Variable): void

  /**
   * 制約を追加
   */
  addConstraint(constraint: LinearConstraint): void

  /**
   * ソルバーを実行し、変数の値を計算
   */
  solve(): void

  /**
   * 変数を削除（オプション）
   */
  removeVariable?(variable: Variable): void

  /**
   * 制約を削除（オプション）
   */
  removeConstraint?(constraint: LinearConstraint): void
}
