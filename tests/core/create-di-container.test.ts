import { describe, it, expect } from "vitest"
import { createDiContainer } from "../../src/core/create-di-container"
import { SERVICE_TOKENS } from "../../src/core/service-tokens"
import type { ICassowarySolver } from "../../src/infra/solver/cassowary"
import type { IVariableFactory, IConstraintFactory, ISolverEngine } from "../../src/domain/interfaces"

describe("createDiContainer", () => {
  it("should create container with all services registered", () => {
    const container = createDiContainer()

    expect(container.has(SERVICE_TOKENS.CASSOWARY_SOLVER)).toBe(true)
    expect(container.has(SERVICE_TOKENS.VARIABLE_FACTORY)).toBe(true)
    expect(container.has(SERVICE_TOKENS.CONSTRAINT_FACTORY)).toBe(true)
    expect(container.has(SERVICE_TOKENS.SOLVER_ENGINE)).toBe(true)
  })

  it("should resolve ICassowarySolver", () => {
    const container = createDiContainer()
    const solver = container.resolve<ICassowarySolver>(SERVICE_TOKENS.CASSOWARY_SOLVER)

    expect(solver).toBeDefined()
    expect(solver.createVariable).toBeDefined()
    expect(solver.createConstraint).toBeDefined()
    expect(solver.updateVariables).toBeDefined()
  })

  it("should resolve IVariableFactory", () => {
    const container = createDiContainer()
    const factory = container.resolve<IVariableFactory>(SERVICE_TOKENS.VARIABLE_FACTORY)

    expect(factory).toBeDefined()
    expect(factory.createAnchorX).toBeDefined()
    expect(factory.createWidth).toBeDefined()
  })

  it("should resolve IConstraintFactory", () => {
    const container = createDiContainer()
    const factory = container.resolve<IConstraintFactory>(SERVICE_TOKENS.CONSTRAINT_FACTORY)

    expect(factory).toBeDefined()
    expect(factory.createGeometric).toBeDefined()
    expect(factory.createHint).toBeDefined()
  })

  it("should resolve ISolverEngine", () => {
    const container = createDiContainer()
    const engine = container.resolve<ISolverEngine>(SERVICE_TOKENS.SOLVER_ENGINE)

    expect(engine).toBeDefined()
    expect(engine.solve).toBeDefined()
  })

  it("should create independent containers", () => {
    const container1 = createDiContainer()
    const container2 = createDiContainer()

    const solver1 = container1.resolve<ICassowarySolver>(SERVICE_TOKENS.CASSOWARY_SOLVER)
    const solver2 = container2.resolve<ICassowarySolver>(SERVICE_TOKENS.CASSOWARY_SOLVER)

    // 異なる Container は異なる Solver インスタンスを持つ
    expect(solver1).not.toBe(solver2)
  })

  it("should resolve services with dependencies", () => {
    const container = createDiContainer()

    const factory = container.resolve<IVariableFactory>(SERVICE_TOKENS.VARIABLE_FACTORY)
    const x = factory.createAnchorX("x")

    expect(x).toBeDefined()
    expect(x.variableType).toBe("anchor_x")
  })

  it("should support full workflow", () => {
    const container = createDiContainer()

    // サービスを解決
    const variableFactory = container.resolve<IVariableFactory>(SERVICE_TOKENS.VARIABLE_FACTORY)
    const constraintFactory = container.resolve<IConstraintFactory>(SERVICE_TOKENS.CONSTRAINT_FACTORY)
    const engine = container.resolve<ISolverEngine>(SERVICE_TOKENS.SOLVER_ENGINE)

    // 変数を作成
    const x = variableFactory.createAnchorX("x")

    // 制約を作成（freeVariable を使用する）
    constraintFactory.createGeometric("x-constraint", (builder) => {
      builder.ct([1, x.freeVariable]).eq([100, 1]).required()
    })

    // ソルバーを実行
    engine.solve()

    // 結果を確認
    expect(x.value()).toBeCloseTo(100)
  })
})
