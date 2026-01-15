import type { DiContainer } from "./di-container"
import type { IVariableFactory, IConstraintFactory, ISolverEngine } from "../domain/interfaces"
import { SERVICE_TOKENS } from "./service-tokens"

/**
 * LayoutContext: レイアウトコンテキスト
 *
 * Service Locator パターンを採用し、サービスを直接公開します。
 * Facade メソッドは削除し、クライアントが各サービスを直接使用します。
 */
export class LayoutContext {
  // サービスをキャッシュ（初回アクセス時に解決）
  private _variableFactory?: IVariableFactory
  private _constraintFactory?: IConstraintFactory
  private _solverEngine?: ISolverEngine

  constructor(private readonly container: DiContainer) {}

  /**
   * VariableFactory を取得
   *
   * 型付き変数を作成するために使用します。
   *
   * @example
   * const x = layoutContext.variableFactory.createAnchorX("x")
   */
  get variableFactory(): IVariableFactory {
    if (!this._variableFactory) {
      this._variableFactory = this.container.resolve<IVariableFactory>(
        SERVICE_TOKENS.VARIABLE_FACTORY
      )
    }
    return this._variableFactory
  }

  /**
   * ConstraintFactory を取得
   *
   * Discriminated Union の制約を作成するために使用します。
   *
   * @example
   * layoutContext.constraintFactory.createGeometric("constraint-id", (builder) => {
   *   builder.ct([1, x]).eq([100, 1]).required()
   * })
   */
  get constraintFactory(): IConstraintFactory {
    if (!this._constraintFactory) {
      this._constraintFactory = this.container.resolve<IConstraintFactory>(
        SERVICE_TOKENS.CONSTRAINT_FACTORY
      )
    }
    return this._constraintFactory
  }

  /**
   * SolverEngine を取得
   *
   * 制約を解決して変数を更新するために使用します。
   *
   * @example
   * layoutContext.solverEngine.solve()
   */
  get solverEngine(): ISolverEngine {
    if (!this._solverEngine) {
      this._solverEngine = this.container.resolve<ISolverEngine>(SERVICE_TOKENS.SOLVER_ENGINE)
    }
    return this._solverEngine
  }

  /**
   * コンテナをクリア（主にテスト用）
   */
  dispose(): void {
    this.container.clear()
    this._variableFactory = undefined
    this._constraintFactory = undefined
    this._solverEngine = undefined
  }
}
