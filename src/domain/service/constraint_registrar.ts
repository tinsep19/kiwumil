import type { CassowarySolver, LinearConstraint } from "../ports"
import type { Constraint } from "../value/constraint/constraint"

export interface ConstraintRegistrar {
  register(expr: Constraint): LinearConstraint
  remove(ct: LinearConstraint): void
}

export function createConstraintRegistrar(solver: CassowarySolver) : ConstraintRegistrar {
   return {
     register(expr: Constraint) {
       return solver.createConstraint(expr)
     },
     remove(ct: LinearConstraint) {
       solver.removeConstraint(ct)
     }
   } satisfies ConstraintRegistrar 
}

