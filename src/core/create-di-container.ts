import { DiContainer } from "./di-container"
import { SERVICE_TOKENS } from "./service-tokens"
import type { ICassowarySolver } from "../infra/solver/cassowary"
import type { IVariableFactory, IConstraintFactory, ISolverEngine } from "../domain/interfaces"
import { KiwiSolver } from "../infra/solver/kiwi"
import { VariableFactory, ConstraintFactory, SolverEngine } from "../domain/services"

/**
 * createDiContainer: DI Container を作成し、サービスを登録
 * 
 * Diagram ごとに新しい Container を作成することで、
 * Diagram スコープを実現します。
 * 
 * @returns 設定済み DiContainer
 */
export function createDiContainer(): DiContainer {
  const container = new DiContainer()

  // ============================================================================
  // Infrastructure Layer
  // ============================================================================

  // ICassowarySolver の実装を Singleton として登録
  const solver = new KiwiSolver()
  container.registerSingleton<ICassowarySolver>(
    SERVICE_TOKENS.CASSOWARY_SOLVER,
    solver
  )

  // ============================================================================
  // Domain Layer - Factories
  // ============================================================================

  // IVariableFactory を Factory として登録
  container.registerFactory<IVariableFactory>(
    SERVICE_TOKENS.VARIABLE_FACTORY,
    () => {
      const cassowarySolver = container.resolve<ICassowarySolver>(
        SERVICE_TOKENS.CASSOWARY_SOLVER
      )
      return new VariableFactory(cassowarySolver)
    }
  )

  // IConstraintFactory を Factory として登録
  container.registerFactory<IConstraintFactory>(
    SERVICE_TOKENS.CONSTRAINT_FACTORY,
    () => {
      const cassowarySolver = container.resolve<ICassowarySolver>(
        SERVICE_TOKENS.CASSOWARY_SOLVER
      )
      return new ConstraintFactory(cassowarySolver)
    }
  )

  // ============================================================================
  // Domain Layer - Services
  // ============================================================================

  // ISolverEngine を Factory として登録
  container.registerFactory<ISolverEngine>(
    SERVICE_TOKENS.SOLVER_ENGINE,
    () => {
      const cassowarySolver = container.resolve<ICassowarySolver>(
        SERVICE_TOKENS.CASSOWARY_SOLVER
      )
      return new SolverEngine(cassowarySolver)
    }
  )

  // ============================================================================
  // Application Layer (Phase 6 で追加予定)
  // ============================================================================

  // TODO: LayoutContext を登録

  // ============================================================================
  // Presentation Layer (Phase 7 で追加予定)
  // ============================================================================

  // TODO: Theme を登録

  return container
}
