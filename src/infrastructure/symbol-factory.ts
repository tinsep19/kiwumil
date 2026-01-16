import type { SymbolId } from "@/core/types"
import type { ICassowarySolver } from "@/domain/interfaces/cassowary-solver.interface"
import { ActorSymbol } from "@/domain/entities/actor-symbol"

/**
 * SymbolFactory: Symbol を作成し、Solver に登録するファクトリ
 * 
 * Symbol は Aggregate Root として Variable と LinearConstraint を所有する。
 * SymbolFactory は Symbol を作成し、その Variable と Constraint を Solver に登録する。
 * これにより、Symbol は Solver に依存せず、DIP（依存関係逆転の原則）を実現する。
 * 
 * @example
 * const solver = new KiwiSolver()
 * const factory = new SymbolFactory(solver)
 * 
 * const actor = factory.createActor("actor1", "User")
 * solver.solve()
 * 
 * console.log(actor.render())
 */
export class SymbolFactory {
  constructor(private solver: ICassowarySolver) {}
  
  /**
   * ActorSymbol を作成し、Solver に登録
   * 
   * @param id Symbol の ID
   * @param label Actor のラベル
   * @returns 作成された ActorSymbol
   */
  createActor(id: SymbolId, label: string): ActorSymbol {
    const symbol = new ActorSymbol(id, label)
    
    // Variable を Solver に登録
    for (const variable of symbol.getVariables()) {
      this.solver.addVariable(variable)
    }
    
    // Constraint を Solver に登録
    for (const constraint of symbol.getConstraints()) {
      this.solver.addConstraint(constraint)
    }
    
    return symbol
  }
}
