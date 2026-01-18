// src/domain/ports/solver.ts
// Cassowary ソルバーの抽象化インターフェース

import type { Variable, VariableId } from "../../core"
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

export type ConstraintBuilder<R=void> = Fluent<{
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
    required: Terminal<[[],[R]]>
    strong:   Terminal<[[],[R]]>
    medium:   Terminal<[[],[R]]>
    weak:     Terminal<[[],[R]]>
  }
}>


export class DefaultConstraintBuilder<R> implements ConstraintBuilder<R>{
  private pending: Partial<ConstraintExpr> = {}
  constructor(
   private process: (expr: ConstraintExpr) => R
  ){}
  private init(part: Partial<ConstraintExpr>) {
    this.pending = part
    return this
  }
  private update(part: Partial<ConstraintExpr>) {
    this.pending = {...this.pending, ...part }
    return this
  }
  
  ct(...lhs: Term[]) { return this.init({ lhs }) }

  eq(...rhs: Term[]) { return this.update({ op: "eq", rhs }) }
  le(...rhs: Term[]) { return this.update({ op: "le", rhs }) }
  ge(...rhs: Term[]) { return this.update({ op: "ge", rhs }) }
  eq0() { return this.update({ op: "eq", rhs: [[0, 1]] }) }
  le0() { return this.update({ op: "le", rhs: [[0, 1]] }) }
  ge0() { return this.update({ op: "ge", rhs: [[0, 1]] }) }

  required() { return this.finalize({ strength: "required" }) }
  strong()   { return this.finalize({ strength: "strong"   }) }
  medium()   { return this.finalize({ strength: "medium"   }) }
  weak()     { return this.finalize({ strength: "weak"     }) }

  isPendingComplete(pending: Partial<ConstraintExpr>): pending is ConstraintExpr {
    const { lhs, rhs, op, strength } = pending
    return lhs !== undefined && rhs !== undefined && op !== undefined && strength !== undefined
  }
  
  finalize(part: Partial<ConstraintExpr>): R {
    const expr = { ...this.pending, ...part }
    if (!this.isPendingComplete(expr)) {
      throw "pending expr is not complete!"
    }
    this.init({})
    return this.process(expr)
  }
}

export class ConstraintExprBuilder extends DefaultConstraintBuilder<ConstraintExpr> {
  constructor() {
    super(expr => expr)
  }
}

/**
 * ConstraintSpec: 制約を構築するコールバック関数
 */
export type ConstraintSpec = (builder: ConstraintBuilder) => void

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
 * SuggestHandle: レイアウト変数への値の提案を行うハンドル
 */
export interface SuggestHandle {
  suggest(value: number): void
  strength(): ConstraintStrength
  variable(): Variable
  dispose(): void
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
  createConstraint(expr: ConstraintExpr): LinearConstraint

  /**
   * 制約の登録を解除
   */
  removeConstraint(constraint: LinearConstraint): void

  createHandle(variable: Variable, strength: ConstraintStrength): SuggestHandle
}
