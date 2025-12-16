import { KiwiSolver } from "@/kiwi"
import { LayoutVariables } from "@/model"
import {
  asAnchorX,
  asAnchorY,
  asAnchorZ,
  asWidth,
  asHeight,
  createBrandVariableFactory,
} from "@/core"

describe("Branded Layout Variables", () => {
  test("asAnchorX casts Variable to AnchorX", () => {
    const solver = new KiwiSolver()
    const variables = new LayoutVariables(solver)
    const v = variables.createVariable("test.x")
    const x = asAnchorX(v)

    // The branded variable should still work as a Variable
    expect(x.id).toBe("test.x")
    expect(typeof x.value).toBe("function")
  })

  test("asAnchorY casts Variable to AnchorY", () => {
    const solver = new KiwiSolver()
    const variables = new LayoutVariables(solver)
    const v = variables.createVariable("test.y")
    const y = asAnchorY(v)

    expect(y.id).toBe("test.y")
    expect(typeof y.value).toBe("function")
  })

  test("asAnchorZ casts Variable to AnchorZ", () => {
    const solver = new KiwiSolver()
    const variables = new LayoutVariables(solver)
    const v = variables.createVariable("test.z")
    const z = asAnchorZ(v)

    expect(z.id).toBe("test.z")
    expect(typeof z.value).toBe("function")
  })

  test("asWidth casts Variable to Width", () => {
    const solver = new KiwiSolver()
    const variables = new LayoutVariables(solver)
    const v = variables.createVariable("test.width")
    const width = asWidth(v)

    expect(width.id).toBe("test.width")
    expect(typeof width.value).toBe("function")
  })

  test("asHeight casts Variable to Height", () => {
    const solver = new KiwiSolver()
    const variables = new LayoutVariables(solver)
    const v = variables.createVariable("test.height")
    const height = asHeight(v)

    expect(height.id).toBe("test.height")
    expect(typeof height.value).toBe("function")
  })

  test("createBrandVariableFactory creates branded variables", () => {
    const solver = new KiwiSolver()
    const variables = new LayoutVariables(solver)

    const factory = createBrandVariableFactory((id) => variables.createVariable(id))

    const x = factory.createAnchorX("test.x")
    const y = factory.createAnchorY("test.y")
    const z = factory.createAnchorZ("test.z")
    const width = factory.createWidth("test.width")
    const height = factory.createHeight("test.height")

    expect(x.id).toBe("test.x")
    expect(y.id).toBe("test.y")
    expect(z.id).toBe("test.z")
    expect(width.id).toBe("test.width")
    expect(height.id).toBe("test.height")
  })

  test("createBrandVariableFactory provides createVariable for generic variables", () => {
    const solver = new KiwiSolver()
    const variables = new LayoutVariables(solver)

    const factory = createBrandVariableFactory((id) => variables.createVariable(id))

    const v = factory.createVariable("generic.var")
    expect(v.id).toBe("generic.var")
    expect(typeof v.value).toBe("function")
  })

  test("createBounds returns branded types for position and size", () => {
    const solver = new KiwiSolver()
    const variables = new LayoutVariables(solver)

    const bounds = variables.createBounds("test", "layout")

    // All fields should be present and have the correct structure
    expect(bounds.x.id).toBe("test.x")
    expect(bounds.y.id).toBe("test.y")
    expect(bounds.width.id).toBe("test.width")
    expect(bounds.height.id).toBe("test.height")
    expect(bounds.right.id).toBe("test.right")
    expect(bounds.bottom.id).toBe("test.bottom")
    expect(bounds.centerX.id).toBe("test.centerX")
    expect(bounds.centerY.id).toBe("test.centerY")
    expect(bounds.z.id).toBe("test.z")

    // All should be callable Variables
    expect(typeof bounds.x.value).toBe("function")
    expect(typeof bounds.y.value).toBe("function")
    expect(typeof bounds.width.value).toBe("function")
    expect(typeof bounds.height.value).toBe("function")
  })

  test("branded variables work with constraint solver", () => {
    const solver = new KiwiSolver()
    const variables = new LayoutVariables(solver)

    const bounds = variables.createBounds("test", "layout")

    // Set constraints
    solver.createConstraint("test-constraints", (builder) => {
      builder.expr([1, bounds.x]).eq([10, 1]).strong()
      builder.expr([1, bounds.y]).eq([20, 1]).strong()
      builder.expr([1, bounds.width]).eq([100, 1]).strong()
      builder.expr([1, bounds.height]).eq([50, 1]).strong()
    })

    solver.updateVariables()

    expect(bounds.x.value()).toBeCloseTo(10)
    expect(bounds.y.value()).toBeCloseTo(20)
    expect(bounds.width.value()).toBeCloseTo(100)
    expect(bounds.height.value()).toBeCloseTo(50)
    // Computed properties should work
    expect(bounds.right.value()).toBeCloseTo(110) // x + width
    expect(bounds.bottom.value()).toBeCloseTo(70) // y + height
    expect(bounds.centerX.value()).toBeCloseTo(60) // x + width/2
    expect(bounds.centerY.value()).toBeCloseTo(45) // y + height/2
  })
})
