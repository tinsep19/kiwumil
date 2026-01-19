import { 
  CassowarySolver,
  Variable
} from "@/domain/ports"

export interface VariableFactory {
  create(name?: string) : Variable
}
export function createVariableFactory(solver: CassowarySolver) {
  return {
    create(name?: string) {
      return solver.createVariable(name)
    }
  } satisfies VariableFactory
}
