// src/domain/ports/solver.ts
// Cassowary ソルバーの抽象化インターフェース

import type { VariableId, LayoutConstraintId, Variable } from "../../core"
import type { Fluent, Entry, Step, Terminal } from "../../hint/fluent_builder_generator"

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

type LinearConstraintBuilder = Fluent<{
  init: {
    ct: Entry<[...lhs: Term[]]>
  }
  requiredGroups: {
    op: {
      eq: Step<[...rhs: Term[]]>
      le: Step<[...rhs: Term[]]>
      ge: Step<[...rhs: Term[]]>
      eq0: Step
      le0: Step
      ge0: Step
    }
  }
  terminal: {
    required: Terminal
    strong: Terminal
    medium: Terminal
    weak: Terminal
  }
}>

export abstract class AbstractLinearConstraintBuilder {
  private pending: Partial<ConstraintExpr> = {}
  private constraints: LinearConstraint[] = []
  constructor(private solver: CassowarySolver) {}
  getConstraints() {
    return this.constraints
  }
  ct(...lhs: Term[]) {
    this.pending = { ...this.pending, lhs }
  }
  eq(...rhs: Term[]) {
    this.pending = { ...this.pending, op: "eq", rhs }
  }
  eq0() {
    this.pending = { ...this.pending, op: "eq", rhs: [[0, 1]] }
  }
  le(...rhs: Term[]) {
    this.pending = { ...this.pending, op: "le", rhs }
  }
  le0() {
    this.pending = { ...this.pending, op: "le", rhs: [[0, 1]] }
  }
  ge(...rhs: Term[]) {
    this.pending = { ...this.pending, op: "ge", rhs }
  }
  ge0() {
    this.pending = { ...this.pending, op: "ge", rhs: [[0, 1]] }
  }
  required() {
    this.pending = { ...this.pending, strength: "required" }
    this.finalize(this.pending)
  }
  strong() {
    this.pending = { ...this.pending, strength: "strong" }
    this.finalize(this.pending)
  }
  medium() {
    this.pending = { ...this.pending, strength: "medium" }
    this.finalize(this.pending)
  }
  weak() {
    this.pending = { ...this.pending, strength: "weak" }
    this.finalize(this.pending)
  }

  isPendingComplete(pending: Partial<ConstraintExpr>): pending is ConstraintExpr {
    const { lhs, rhs, op, strength } = pending
    return lhs !== undefined && rhs !== undefined && op !== undefined && strength !== undefined
  }
  abstract finalize(expr: Partial<ConstraintExpr>): void
  // 最初に isPendingCompleteでConstraintExprになっているか確認
  // 各Solver実装への変換処理/制約の登録を行う
}

/**
 * LhsBuilder: 制約の左辺を構築するインターフェース
 */
// export interface LhsBuilder {
//   ct(...lhs: Term[]): OpRhsBuilder
// }

/**
 * OpRhsBuilder: 演算子と右辺を構築するインターフェース
 */
// export interface OpRhsBuilder {
//   eq(...rhs: Term[]): StrengthBuilder
//   ge(...rhs: Term[]): StrengthBuilder
//   le(...rhs: Term[]): StrengthBuilder
//   eq0(): StrengthBuilder
//   ge0(): StrengthBuilder
//   le0(): StrengthBuilder
// }

/**
 * StrengthBuilder: 制約の強度を設定するインターフェース
 */
// export interface StrengthBuilder {
//   required(): void
//   strong(): void
//   medium(): void
//   weak(): void
// }

/**
 * LinearConstraintBuilder: 制約を構築する Fluent API インターフェース
 */
// export interface LinearConstraintBuilder extends LhsBuilder, OpRhsBuilder, StrengthBuilder {
//   getRawConstraints(): LinearConstraint[]
// }

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
   * 注: 実装は LayoutConstraint を返すが、内部的には複数の LinearConstraint を持つ
   */
  createConstraint(id: LayoutConstraintId, spec: ConstraintSpec): unknown

  /**
   * 編集用ハンドルを作成
   */
  createHandle(variable: Variable): SuggestHandleFactory
}
