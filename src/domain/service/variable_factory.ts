import { 
  CassowarySolver,
  FreeVariable
} from "@/domain/ports"

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
