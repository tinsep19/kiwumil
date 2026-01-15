/**
 * ISolverEngine: ソルバーエンジン
 * 
 * 制約を解決し、変数の値を更新します。
 */
export interface ISolverEngine {
  /**
   * 制約を解決して変数を更新
   */
  solve(): void
}
