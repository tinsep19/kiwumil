import {
  CassowarySolver,
  ConstraintExpr,
  LinearConstraint,
} from "../ports"

export interface ConstraintRegistrar {
  register(expr: ConstraintExpr): LinearConstraint
  remove(ct: LinearConstraint): void
}

export function createConstraintRegistrar(solver: CassowarySolver) : ConstraintRegistrar {
   return {
     register(expr: ConstraintExpr) {
       return solver.createConstraint(expr)
     },
     remove(ct: LinearConstraint) {
       solver.removeConstraint(ct)
     }
   } satisfies ConstraintRegistrar 
}

