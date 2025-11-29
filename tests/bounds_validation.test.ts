import { describe, test, expect, beforeEach } from "bun:test"
import { getBoundsValues } from "../src/layout/bounds"
import { LayoutContext } from "../src/layout/layout_context"
import { ActorSymbol } from "../src/plugin/uml/symbols/actor_symbol"
import { UsecaseSymbol } from "../src/plugin/uml/symbols/usecase_symbol"
import { Symbols } from "../src/dsl/symbols"
import { DefaultTheme } from "../src/theme"
import { Operator } from "../src/layout/layout_solver"

describe("Bounds Validation", () => {
  describe("getBoundsValues", () => {
    let context: LayoutContext
    let symbols: Symbols

    beforeEach(() => {
      symbols = new Symbols()
      context = new LayoutContext(DefaultTheme)
    })

    test("should return finite values for valid bounds", () => {
      const bounds = context.variables.createBound("test")

      context.solver.addConstraint(bounds.x, Operator.Eq, 10)
      context.solver.addConstraint(bounds.y, Operator.Eq, 20)
      context.solver.addConstraint(bounds.width, Operator.Eq, 100)
      context.solver.addConstraint(bounds.height, Operator.Eq, 50)
      context.solver.updateVariables()

      const values = getBoundsValues(bounds)

      expect(values.x).toBe(10)
      expect(values.y).toBe(20)
      expect(values.width).toBe(100)
      expect(values.height).toBe(50)
    })

    test("should detect and warn about negative width", () => {
      const bounds = context.variables.createBound("test")

      // Create a scenario with negative width (right < left)
      context.solver.addConstraint(bounds.x, Operator.Eq, 100)
      context.solver.addConstraint(bounds.width, Operator.Eq, -50)
      context.solver.updateVariables()

      // Should still return the negative value but log warning
      const values = getBoundsValues(bounds)
      expect(values.width).toBe(-50)
    })

    test("should detect and warn about negative height", () => {
      const bounds = context.variables.createBound("test")

      // Create a scenario with negative height (bottom < top)
      context.solver.addConstraint(bounds.y, Operator.Eq, 100)
      context.solver.addConstraint(bounds.height, Operator.Eq, -30)
      context.solver.updateVariables()

      // Should still return the negative value but log warning
      const values = getBoundsValues(bounds)
      expect(values.height).toBe(-30)
    })
  })

  describe("ActorSymbol rendering guards", () => {
    let context: LayoutContext
    let symbols: Symbols

    beforeEach(() => {
      symbols = new Symbols()
      context = new LayoutContext(DefaultTheme)
    })

    test("should clamp negative width to safe value in SVG output", () => {
      const bounds = context.variables.createBound("actor")

      // Set negative width
      context.solver.addConstraint(bounds.x, Operator.Eq, 0)
      context.solver.addConstraint(bounds.y, Operator.Eq, 0)
      context.solver.addConstraint(bounds.width, Operator.Eq, -80)
      context.solver.addConstraint(bounds.height, Operator.Eq, 100)
      context.solver.updateVariables()

      const actor = new ActorSymbol({
        id: "test-actor",
        layout: bounds,
        label: "TestActor",
        theme: DefaultTheme,
      })
      const svg = actor.toSVG()

      // Check that SVG doesn't contain negative radius
      expect(svg).not.toContain('r="-')
      // Should have positive radius from clamped width
      expect(svg).toContain('r="')
      const radiusMatch = svg.match(/r="([^"]+)"/)
      expect(radiusMatch).toBeTruthy()
      const radius = parseFloat(radiusMatch![1])
      expect(radius).toBeGreaterThan(0)
    })

    test("should render with valid positive dimensions for normal bounds", () => {
      const bounds = context.variables.createBound("actor")

      context.solver.addConstraint(bounds.x, Operator.Eq, 10)
      context.solver.addConstraint(bounds.y, Operator.Eq, 10)
      context.solver.addConstraint(bounds.width, Operator.Eq, 60)
      context.solver.addConstraint(bounds.height, Operator.Eq, 80)
      context.solver.updateVariables()

      const actor = new ActorSymbol({
        id: "test-actor",
        layout: bounds,
        label: "TestActor",
        theme: DefaultTheme,
      })
      const svg = actor.toSVG()

      // Check for valid circle element with positive radius
      expect(svg).toContain("circle")
      expect(svg).not.toContain('r="-')
      const radiusMatch = svg.match(/r="([^"]+)"/)
      expect(radiusMatch).toBeTruthy()
      const radius = parseFloat(radiusMatch![1])
      expect(radius).toBeGreaterThanOrEqual(2) // Minimum clamped value
    })
  })

  describe("UsecaseSymbol rendering guards", () => {
    let context: LayoutContext
    let symbols: Symbols

    beforeEach(() => {
      symbols = new Symbols()
      context = new LayoutContext(DefaultTheme)
    })

    test("should clamp negative height to safe value in SVG output", () => {
      const bounds = context.variables.createBound("usecase")

      // Set negative height
      context.solver.addConstraint(bounds.x, Operator.Eq, 0)
      context.solver.addConstraint(bounds.y, Operator.Eq, 0)
      context.solver.addConstraint(bounds.width, Operator.Eq, 120)
      context.solver.addConstraint(bounds.height, Operator.Eq, -50)
      context.solver.updateVariables()

      const usecase = new UsecaseSymbol({
        id: "test-usecase",
        layout: bounds,
        label: "TestUsecase",
        theme: DefaultTheme,
      })
      const svg = usecase.toSVG()

      // Check that SVG doesn't contain negative ry
      expect(svg).not.toContain('ry="-')
      // Should have positive rx and ry from clamped dimensions
      const rxMatch = svg.match(/rx="([^"]+)"/)
      const ryMatch = svg.match(/ry="([^"]+)"/)
      expect(rxMatch).toBeTruthy()
      expect(ryMatch).toBeTruthy()
      const rx = parseFloat(rxMatch![1])
      const ry = parseFloat(ryMatch![1])
      expect(rx).toBeGreaterThan(0)
      expect(ry).toBeGreaterThan(0)
    })

    test("should render with valid positive dimensions for normal bounds", () => {
      const bounds = context.variables.createBound("usecase")

      context.solver.addConstraint(bounds.x, Operator.Eq, 10)
      context.solver.addConstraint(bounds.y, Operator.Eq, 10)
      context.solver.addConstraint(bounds.width, Operator.Eq, 120)
      context.solver.addConstraint(bounds.height, Operator.Eq, 60)
      context.solver.updateVariables()

      const usecase = new UsecaseSymbol({
        id: "test-usecase",
        layout: bounds,
        label: "TestUsecase",
        theme: DefaultTheme,
      })
      const svg = usecase.toSVG()

      // Check for valid ellipse element with positive rx and ry
      expect(svg).toContain("ellipse")
      expect(svg).not.toContain('rx="-')
      expect(svg).not.toContain('ry="-')
      const rxMatch = svg.match(/rx="([^"]+)"/)
      const ryMatch = svg.match(/ry="([^"]+)"/)
      expect(rxMatch).toBeTruthy()
      expect(ryMatch).toBeTruthy()
      const rx = parseFloat(rxMatch![1])
      const ry = parseFloat(ryMatch![1])
      expect(rx).toBeGreaterThanOrEqual(2) // Minimum clamped value
      expect(ry).toBeGreaterThanOrEqual(2) // Minimum clamped value
    })
  })
})
