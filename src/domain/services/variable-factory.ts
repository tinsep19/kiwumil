import type { IVariableFactory } from "../interfaces/variable-factory.interface"
import type { 
  Variable, 
  AnchorX, 
  AnchorY, 
  AnchorZ, 
  Width, 
  Height,
  GenericVariable,
  VariableType
} from "../entities/variable"
import type { ICassowarySolver } from "../../infra/solver/cassowary/cassowary-solver.interface"
import { VariableImpl } from "../entities/variable"

/**
 * VariableFactory: IVariableFactory の実装
 * 
 * ICassowarySolver を使用して FreeVariable を作成し、
 * VariableImpl でラップして型付き変数を生成します。
 */
export class VariableFactory implements IVariableFactory {
  constructor(private readonly solver: ICassowarySolver) {}

  create(id: string): GenericVariable {
    return this.createTyped(id, "generic") as GenericVariable
  }

  createTyped(id: string, variableType: VariableType): Variable {
    const freeVariable = this.solver.createVariable(id)
    return new VariableImpl(id, freeVariable, variableType)
  }

  createAnchorX(id: string): AnchorX {
    return this.createTyped(id, "anchor_x") as AnchorX
  }

  createAnchorY(id: string): AnchorY {
    return this.createTyped(id, "anchor_y") as AnchorY
  }

  createAnchorZ(id: string): AnchorZ {
    return this.createTyped(id, "anchor_z") as AnchorZ
  }

  createWidth(id: string): Width {
    return this.createTyped(id, "width") as Width
  }

  createHeight(id: string): Height {
    return this.createTyped(id, "height") as Height
  }
}
