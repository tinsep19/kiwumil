import { describe, it, expect } from "vitest"
import { SolverEngine } from "../../../src/domain/services/solver-engine"
import { VariableFactory } from "../../../src/domain/services/variable-factory"
import { ConstraintFactory } from "../../../src/domain/services/constraint-factory"
import { KiwiSolver } from "../../../src/infra/solver/kiwi/kiwi-solver"

describe("SolverEngine", () => {
  it("should solve constraints and update variables", () => {
    const solver = new KiwiSolver()
    const variableFactory = new VariableFactory(solver)
    const constraintFactory = new ConstraintFactory(solver)
    const engine = new SolverEngine(solver)
    
    const x = variableFactory.createAnchorX("x")
    
    constraintFactory.createGeometric(
      "x-constraint",
      (builder) => {
        builder.ct([1, x.freeVariable]).eq([100, 1]).required()
      }
    )
    
    engine.solve()
    
    expect(x.value()).toBeCloseTo(100)
  })

  it("should solve multiple constraints", () => {
    const solver = new KiwiSolver()
    const variableFactory = new VariableFactory(solver)
    const constraintFactory = new ConstraintFactory(solver)
    const engine = new SolverEngine(solver)
    
    const x = variableFactory.createAnchorX("x")
    const width = variableFactory.createWidth("width")
    const right = variableFactory.createAnchorX("right")
    
    constraintFactory.createGeometric(
      "constraints",
      (builder) => {
        builder.ct([1, x.freeVariable]).eq([10, 1]).required()
        builder.ct([1, width.freeVariable]).eq([50, 1]).required()
        builder.ct([1, right.freeVariable]).eq([1, x.freeVariable], [1, width.freeVariable]).required()
      }
    )
    
    engine.solve()
    
    expect(x.value()).toBeCloseTo(10)
    expect(width.value()).toBeCloseTo(50)
    expect(right.value()).toBeCloseTo(60)
  })
})
