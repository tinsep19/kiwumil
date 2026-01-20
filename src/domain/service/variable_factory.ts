import type { CassowarySolver } from "@/domain/ports"
import type { FreeVariable } from "@/domain/value/constraint/free_variable"

export interface VariableFactory {
  create(name?: string) : FreeVariable
}
export function createVariableFactory(solver: CassowarySolver) {
  return {
    create(name?: string) {
      return solver.createVariable(name)
    }
  } satisfies VariableFactory
}
