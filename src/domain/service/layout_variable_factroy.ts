import type { FreeVariable } from "@/domain/value/constraint/free_variable"
import { VariableFactory } from "@/domain/service/variable_factory"
import { GeometricConstraint } from "@/domain/entity/layout_constraint"

export class LayoutVariableFactory {
  constructor(
    private readonly constraints: GeometricConstraint,
    private readonly factory: VariableFactory
  ){ }

  private createVariable(id: string) : FreeVariable {
    const variable = this.factory.create(id)
    this.constraints.addConstraint(builder => {
      builder.ct([1, variable]).ge0().required()
    })
    return variable
  }
  
}

