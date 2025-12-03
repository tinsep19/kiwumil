import { describe, test, expect, beforeEach } from "bun:test"
import { LayoutContext, getBoundsValues } from "@/layout"
import { ActorSymbol, UsecaseSymbol } from "@/plugin/uml"
import { Symbols } from "@/dsl"
import { DefaultTheme } from "@/theme"

describe("Bounds Validation", () => {
  describe("getBoundsValues", () => {
    let context: LayoutContext
    let symbols: Symbols

    beforeEach(() => {
      context = new LayoutContext(DefaultTheme)
      symbols = new Symbols(context.variables)
    })

    test("should return finite values for valid bounds", () => {
      const bounds = context.variables.createBound("test")

      context.createConstraint("test-bounds", (builder) => {
        builder.expr([1, bounds.x]).eq([10, 1]).strong()
        builder.expr([1, bounds.y]).eq([20, 1]).strong()
        builder.expr([1, bounds.width]).eq([100, 1]).strong()
        builder.expr([1, bounds.height]).eq([50, 1]).strong()
      })
      context.solve()

      const values = getBoundsValues(bounds)

      expect(values.x).toBe(10)
      expect(values.y).toBe(20)
      expect(values.width).toBe(100)
      expect(values.height).toBe(50)
    })

    test("should detect and warn about negative width", () => {
      const bounds = context.variables.createBound("test")

      // Create a scenario with negative width (right < left)
      context.createConstraint("test-negative-width", (builder) => {
        builder.expr([1, bounds.x]).eq([100, 1]).strong()
        builder.expr([1, bounds.width]).eq([-50, 1]).strong()
      })
      context.solve()

      // Should still return the negative value but log warning
      const values = getBoundsValues(bounds)
      expect(values.width).toBe(-50)
    })

    test("should detect and warn about negative height", () => {
      const bounds = context.variables.createBound("test")

      // Create a scenario with negative height (bottom < top)
      context.createConstraint("test-negative-height", (builder) => {
        builder.expr([1, bounds.y]).eq([100, 1]).strong()
        builder.expr([1, bounds.height]).eq([-30, 1]).strong()
      })
      context.solve()

      // Should still return the negative value but log warning
      const values = getBoundsValues(bounds)
      expect(values.height).toBe(-30)
    })
  })

  describe("ActorSymbol rendering guards", () => {
    let context: LayoutContext
    let symbols: Symbols

    beforeEach(() => {
      context = new LayoutContext(DefaultTheme)
      symbols = new Symbols(context.variables)
    })

    test("should clamp negative width to safe value in SVG output", () => {
      const bounds = context.variables.createBound("actor")

      // Set negative width
      context.createConstraint("test-actor-negative-width", (builder) => {
        builder.expr([1, bounds.x]).eq([0, 1]).strong()
        builder.expr([1, bounds.y]).eq([0, 1]).strong()
        builder.expr([1, bounds.width]).eq([-80, 1]).strong()
        builder.expr([1, bounds.height]).eq([100, 1]).strong()
      })
      context.solve()

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

      context.createConstraint("test-actor-normal", (builder) => {
        builder.expr([1, bounds.x]).eq([10, 1]).strong()
        builder.expr([1, bounds.y]).eq([10, 1]).strong()
        builder.expr([1, bounds.width]).eq([60, 1]).strong()
        builder.expr([1, bounds.height]).eq([80, 1]).strong()
      })
      context.solve()

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
      context = new LayoutContext(DefaultTheme)
      symbols = new Symbols(context.variables)
    })

    test("should clamp negative height to safe value in SVG output", () => {
      const bounds = context.variables.createBound("usecase")

      // Set negative height
      context.createConstraint("test-usecase-negative-height", (builder) => {
        builder.expr([1, bounds.x]).eq([0, 1]).strong()
        builder.expr([1, bounds.y]).eq([0, 1]).strong()
        builder.expr([1, bounds.width]).eq([120, 1]).strong()
        builder.expr([1, bounds.height]).eq([-50, 1]).strong()
      })
      context.solve()

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

      context.createConstraint("test-usecase-normal", (builder) => {
        builder.expr([1, bounds.x]).eq([10, 1]).strong()
        builder.expr([1, bounds.y]).eq([10, 1]).strong()
        builder.expr([1, bounds.width]).eq([120, 1]).strong()
        builder.expr([1, bounds.height]).eq([60, 1]).strong()
      })
      context.solve()

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
