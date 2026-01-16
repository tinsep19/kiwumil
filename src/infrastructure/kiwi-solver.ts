import * as kiwi from "@lume/kiwi"
import type { ICassowarySolver } from "@/domain/interfaces/cassowary-solver.interface"
import type { Variable } from "@/domain/entities/variable"
import type { LinearConstraint } from "@/domain/entities/linear-constraint"
import type { Term } from "@/domain/entities/linear-constraint"

/**
 * KiwiSolver: ICassowarySolver の実装
 * 
 * @lume/kiwi をラップし、Domain Layer の Variable と LinearConstraint を
 * kiwi の Variable と Constraint に変換して管理する。
 */
export class KiwiSolver implements ICassowarySolver {
  private readonly solver: kiwi.Solver
  private readonly variableMap: WeakMap<Variable, kiwi.Variable>
  private readonly constraintMap: WeakMap<LinearConstraint, kiwi.Constraint>
  private readonly variables: Set<Variable>

  constructor() {
    this.solver = new kiwi.Solver()
    this.variableMap = new WeakMap()
    this.constraintMap = new WeakMap()
    this.variables = new Set()
  }

  /**
   * 変数を追加
   */
  addVariable(variable: Variable): void {
    // 既に追加済みの場合はスキップ
    if (this.variableMap.has(variable)) {
      return
    }

    const kiwiVar = new kiwi.Variable(variable.id())
    this.variableMap.set(variable, kiwiVar)
    this.variables.add(variable)
  }

  /**
   * 制約を追加
   */
  addConstraint(constraint: LinearConstraint): void {
    // 既に追加済みの場合はスキップ
    if (this.constraintMap.has(constraint)) {
      return
    }

    // Term を kiwi.Expression に変換
    const lhsExpr = this.buildExpression(constraint.lhs)
    const rhsExpr = this.buildExpression(constraint.rhs)
    
    // Operator を kiwi.Operator に変換
    const op = this.convertOperator(constraint.op)
    
    // ConstraintStrength を kiwi.Strength に変換
    const strength = this.convertStrength(constraint.strength)
    
    // kiwi.Constraint を作成して Solver に追加
    const kiwiConstraint = new kiwi.Constraint(lhsExpr, op, rhsExpr, strength)
    this.solver.addConstraint(kiwiConstraint)
    this.constraintMap.set(constraint, kiwiConstraint)
  }

  /**
   * ソルバーを実行し、変数の値を更新
   */
  solve(): void {
    this.solver.updateVariables()
    
    // すべての Variable に計算された値を反映
    for (const variable of this.variables) {
      const kiwiVar = this.variableMap.get(variable)
      if (kiwiVar) {
        variable.setValue(kiwiVar.value())
      }
    }
  }

  /**
   * 変数を削除（オプション）
   */
  removeVariable(variable: Variable): void {
    const kiwiVar = this.variableMap.get(variable)
    if (kiwiVar) {
      // kiwi.Solver には removeVariable がないため、
      // WeakMap と Set から削除するのみ
      this.variableMap.delete(variable)
      this.variables.delete(variable)
    }
  }

  /**
   * 制約を削除（オプション）
   */
  removeConstraint(constraint: LinearConstraint): void {
    const kiwiConstraint = this.constraintMap.get(constraint)
    if (kiwiConstraint) {
      this.solver.removeConstraint(kiwiConstraint)
      this.constraintMap.delete(constraint)
    }
  }

  /**
   * Variable の kiwi.Variable を取得（内部用）
   */
  getKiwiVariable(variable: Variable): kiwi.Variable | undefined {
    return this.variableMap.get(variable)
  }

  /**
   * Term[] を kiwi.Expression に変換
   */
  private buildExpression(terms: readonly Term[]): kiwi.Expression {
    if (terms.length === 0) {
      return new kiwi.Expression(0)
    }

    const args: Array<
      number | kiwi.Variable | kiwi.Expression | [number, kiwi.Variable | kiwi.Expression]
    > = []

    for (const [coefficient, operand] of terms) {
      if (typeof operand === "number") {
        // 定数項
        args.push(coefficient * operand)
      } else {
        // Variable
        const kiwiVar = this.variableMap.get(operand)
        if (!kiwiVar) {
          throw new Error(
            `Variable ${operand.id()} is not registered in the solver. Call addVariable() first.`
          )
        }
        
        if (coefficient === 1) {
          args.push(kiwiVar)
        } else {
          args.push([coefficient, kiwiVar])
        }
      }
    }

    return new kiwi.Expression(...args)
  }

  /**
   * Operator を kiwi.Operator に変換
   */
  private convertOperator(op: string): kiwi.Operator {
    switch (op) {
      case "==":
        return kiwi.Operator.Eq
      case "<=":
        return kiwi.Operator.Le
      case ">=":
        return kiwi.Operator.Ge
      default:
        throw new Error(`Unknown operator: ${op}`)
    }
  }

  /**
   * ConstraintStrength を kiwi.Strength に変換
   */
  private convertStrength(strength: string): number {
    switch (strength) {
      case "required":
        return kiwi.Strength.required
      case "strong":
        return kiwi.Strength.strong
      case "medium":
        return kiwi.Strength.medium
      case "weak":
        return kiwi.Strength.weak
      default:
        throw new Error(`Unknown strength: ${strength}`)
    }
  }
}
