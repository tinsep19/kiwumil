import { LinearConstraint } from "@/domain/entities/linear-constraint"
import type { Term, Operator } from "@/domain/entities/linear-constraint"

/**
 * ct - Constraint DSL のエントリーポイント
 * 
 * @example
 * ct([1, width]).eq([60, 1]).required()
 * ct([1, x], [1, y]).eq([1, 1]).strong()
 * ct([1, right]).eq([1, x], [1, width]).required()
 */
export function ct(...lhs: Term[]): ConstraintBuilder {
  return new ConstraintBuilder(lhs)
}

/**
 * ConstraintBuilder: 制約の演算子と右辺を設定するビルダー
 */
class ConstraintBuilder {
  constructor(private lhs: Term[]) {}

  eq(...rhs: Term[]): StrengthBuilder {
    return new StrengthBuilder(this.lhs, rhs, "==")
  }

  eq0(): StrengthBuilder {
    return new StrengthBuilder(this.lhs, [[0, 1]], "==")
  }

  ge(...rhs: Term[]): StrengthBuilder {
    return new StrengthBuilder(this.lhs, rhs, ">=")
  }

  ge0(): StrengthBuilder {
    return new StrengthBuilder(this.lhs, [[0, 1]], ">=")
  }

  le(...rhs: Term[]): StrengthBuilder {
    return new StrengthBuilder(this.lhs, rhs, "<=")
  }

  le0(): StrengthBuilder {
    return new StrengthBuilder(this.lhs, [[0, 1]], "<=")
  }
}

/**
 * StrengthBuilder: 制約の強度を設定するビルダー
 */
class StrengthBuilder {
  constructor(
    private lhs: Term[],
    private rhs: Term[],
    private op: Operator
  ) {}

  required(): LinearConstraint {
    return new LinearConstraint(this.lhs, this.rhs, this.op, "required")
  }

  strong(): LinearConstraint {
    return new LinearConstraint(this.lhs, this.rhs, this.op, "strong")
  }

  medium(): LinearConstraint {
    return new LinearConstraint(this.lhs, this.rhs, this.op, "medium")
  }

  weak(): LinearConstraint {
    return new LinearConstraint(this.lhs, this.rhs, this.op, "weak")
  }
}
