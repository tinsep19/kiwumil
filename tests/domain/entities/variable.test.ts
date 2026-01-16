import { describe, test, expect } from "bun:test"
import { Variable } from "@/domain/entities/variable"

describe("Variable", () => {
  test("should create a variable with an id", () => {
    const variable = new Variable("test.x")
    expect(variable.id()).toBe("test.x")
  })

  test("should have initial value of 0", () => {
    const variable = new Variable("test.x")
    expect(variable.value()).toBe(0)
  })

  test("should update value when setValue is called", () => {
    const variable = new Variable("test.x")
    variable.setValue(42)
    expect(variable.value()).toBe(42)
  })

  test("should handle negative values", () => {
    const variable = new Variable("test.x")
    variable.setValue(-10)
    expect(variable.value()).toBe(-10)
  })

  test("should handle decimal values", () => {
    const variable = new Variable("test.x")
    variable.setValue(3.14159)
    expect(variable.value()).toBe(3.14159)
  })

  test("should allow multiple variables with different ids", () => {
    const x = new Variable("test.x")
    const y = new Variable("test.y")
    
    x.setValue(10)
    y.setValue(20)
    
    expect(x.id()).toBe("test.x")
    expect(y.id()).toBe("test.y")
    expect(x.value()).toBe(10)
    expect(y.value()).toBe(20)
  })
})
