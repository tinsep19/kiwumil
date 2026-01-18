// src/domain/ports/solver.ts
// Cassowary ソルバーの抽象化インターフェース

import type { VariableId, LayoutConstraintId } from "../../core/types"
import type { Variable } from "../../core/layout_variable"

/**
 * ConstraintStrength: 制約の強度
 */
export type ConstraintStrength = "required" | "strong" | "medium" | "weak"

/**
 * ConstraintOperator: 制約の演算子
 */
export type ConstraintOperator = "eq" | "le" | "ge"

/**
 * Term: 係数と変数（または定数）からなる項
 */
export type Term = [number, Variable | number]

/**
 * ConstraintExpr: 制約式の抽象構文木（AST）
 * あとで isSatisfied() を評価可能にするために保持する
 */
export interface ConstraintExpr {
  lhs: Term[]
  rhs: Term[]
  op: ConstraintOperator
  strength: ConstraintStrength
}

/**
 * LinearConstraint: 線形制約のインターフェース
 * - 登録状態の確認
 * - 満足度の評価（tolerance を使用）
 * - 制約の削除
 */
export interface LinearConstraint {
  readonly strength: ConstraintStrength
  isSatisfied(): boolean
  isRegistered(): boolean
  dispose(): void
}

/**
 * LhsBuilder: 制約の左辺を構築するインターフェース
 */
export interface LhsBuilder {
  ct(...lhs: Term[]): OpRhsBuilder
}

/**
 * OpRhsBuilder: 演算子と右辺を構築するインターフェース
 */
export interface OpRhsBuilder {
  eq(...rhs: Term[]): StrengthBuilder
  ge(...rhs: Term[]): StrengthBuilder
  le(...rhs: Term[]): StrengthBuilder
  eq0(): StrengthBuilder
  ge0(): StrengthBuilder
  le0(): StrengthBuilder
}

/**
 * StrengthBuilder: 制約の強度を設定するインターフェース
 */
export interface StrengthBuilder {
  required(): void
  strong(): void
  medium(): void
  weak(): void
}

/**
 * LinearConstraintBuilder: 制約を構築する Fluent API インターフェース
 */
export interface LinearConstraintBuilder extends LhsBuilder, OpRhsBuilder, StrengthBuilder {
  getRawConstraints(): LinearConstraint[]
}

/**
 * ConstraintSpec: 制約を構築するコールバック関数
 */
export type ConstraintSpec = (builder: LinearConstraintBuilder) => void

/**
 * SuggestHandle: レイアウト変数への値の提案を行うハンドル
 */
export interface SuggestHandle {
  suggest(value: number): void
  strength(): ConstraintStrength
  dispose(): void
}

/**
 * SuggestHandleFactory: SuggestHandle を作成するファクトリ
 */
export interface SuggestHandleFactory {
  strong(): SuggestHandle
  medium(): SuggestHandle
  weak(): SuggestHandle
}

/**
 * CassowarySolver: Cassowary アルゴリズムのソルバー抽象化
 * Infrastructure 層で実装される
 */
export interface CassowarySolver {
  /**
   * レイアウト変数を作成
   */
  createVariable(id: VariableId): Variable

  /**
   * 変数の値を更新
   */
  updateVariables(): void

  /**
   * 制約を作成して登録
   */
  createConstraint(id: LayoutConstraintId, spec: ConstraintSpec): LinearConstraint[]

  /**
   * 編集用ハンドルを作成
   */
  createHandle(variable: Variable): SuggestHandleFactory
}
