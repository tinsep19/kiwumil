import { describe, it, expect } from "vitest"
import { VariableFactory } from "../../../src/domain/services/variable-factory"
import { KiwiSolver } from "../../../src/infra/solver/kiwi/kiwi-solver"
import { isAnchorX, isAnchorY, isWidth, isHeight } from "../../../src/domain/entities/variable"

describe("VariableFactory", () => {
  it("should create generic variable", () => {
    const solver = new KiwiSolver()
    const factory = new VariableFactory(solver)
    
    const variable = factory.create("test")
    
    expect(variable.id).toBe("test")
    expect(variable.variableType).toBe("generic")
    expect(variable.freeVariable).toBeDefined()
  })

  it("should create typed variables", () => {
    const solver = new KiwiSolver()
    const factory = new VariableFactory(solver)
    
    const x = factory.createAnchorX("x")
    expect(x.id).toBe("x")
    expect(x.variableType).toBe("anchor_x")
    expect(isAnchorX(x)).toBe(true)
    
    const y = factory.createAnchorY("y")
    expect(y.variableType).toBe("anchor_y")
    expect(isAnchorY(y)).toBe(true)
    
    const width = factory.createWidth("width")
    expect(width.variableType).toBe("width")
    expect(isWidth(width)).toBe(true)
    
    const height = factory.createHeight("height")
    expect(height.variableType).toBe("height")
    expect(isHeight(height)).toBe(true)
  })

  it("should create variables with working freeVariable", () => {
    const solver = new KiwiSolver()
    const factory = new VariableFactory(solver)
    
    const x = factory.createAnchorX("x")
    
    // FreeVariable として動作することを確認
    expect(typeof x.value()).toBe("number")
    expect(x.name()).toBe("x")
  })

  it("should create typed variable using createTyped", () => {
    const solver = new KiwiSolver()
    const factory = new VariableFactory(solver)
    
    const variable = factory.createTyped("test", "anchor_z")
    
    expect(variable.variableType).toBe("anchor_z")
    expect(variable.id).toBe("test")
  })
})
