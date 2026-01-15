import type { ISolverEngine } from "../interfaces/solver-engine.interface"
import type { ICassowarySolver } from "../../infra/solver/cassowary/cassowary-solver.interface"

/**
 * SolverEngine: ISolverEngine の実装
 * 
 * ICassowarySolver の updateVariables() を呼び出すだけのシンプルな実装。
 */
export class SolverEngine implements ISolverEngine {
  constructor(private readonly solver: ICassowarySolver) {}

  solve(): void {
    this.solver.updateVariables()
  }
}
