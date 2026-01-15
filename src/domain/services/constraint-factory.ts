import type { IConstraintFactory } from "../interfaces/constraint-factory.interface"
import type { 
  GeometricConstraint, 
  LayoutHint, 
  SymbolInternalConstraint 
} from "../entities/layout-constraint"
import type { ConstraintSpec } from "../../core/solver"
import type { ICassowarySolver } from "../../infra/solver/cassowary/cassowary-solver.interface"

/**
 * ConstraintFactory: IConstraintFactory の実装
 * 
 * ICassowarySolver を使用して LinearConstraint を作成し、
 * Discriminated Union の LayoutConstraint に変換します。
 */
export class ConstraintFactory implements IConstraintFactory {
  constructor(private readonly solver: ICassowarySolver) {}

  createGeometric(
    id: string, 
    spec: ConstraintSpec,
    description?: string
  ): GeometricConstraint {
    const rawConstraints = this.solver.createConstraint(spec)
    return {
      id,
      category: "geometric",
      strength: "required",
      rawConstraints,
      description
    }
  }

  createHint(
    id: string,
    spec: ConstraintSpec,
    strength: "strong" | "medium" | "weak",
    hintType: "arrange" | "align" | "enclose" | "custom",
    description?: string
  ): LayoutHint {
    const rawConstraints = this.solver.createConstraint(spec)
    return {
      id,
      category: "hint",
      strength,
      hintType,
      rawConstraints,
      description
    }
  }

  createSymbolInternal(
    id: string,
    symbolId: string,
    spec: ConstraintSpec,
    strength: "strong" | "medium" | "weak",
    description?: string
  ): SymbolInternalConstraint {
    const rawConstraints = this.solver.createConstraint(spec)
    return {
      id,
      category: "symbol-internal",
      strength,
      symbolId,
      rawConstraints,
      description
    }
  }
}
