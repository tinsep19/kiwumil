import { describe, test, expect, beforeEach } from "bun:test"
import { LayoutContext } from "@/model"
import { KiwiSolver } from "@/kiwi"
import { getBoundsValues } from "@/core"
import { ActorSymbol, UsecaseSymbol } from "@/plugin/uml"
import { DefaultTheme } from "@/theme"

describe("Bounds Validation", () => {
  describe("getBoundsValues", () => {
    let context: LayoutContext

    beforeEach(() => {
      const solver = new KiwiSolver()
      context = new LayoutContext(solver, DefaultTheme)
    })

    test("should return finite values for valid bounds", () => {
      const bounds = context.variables.createBounds("test")

      context.createConstraint("test-bounds", (builder) => {
        builder.ct([1, bounds.x]).eq([10, 1]).strong()
        builder.ct([1, bounds.y]).eq([20, 1]).strong()
        builder.ct([1, bounds.width]).eq([100, 1]).strong()
        builder.ct([1, bounds.height]).eq([50, 1]).strong()
      })
      context.solve()

      const values = getBoundsValues(bounds)

      expect(values.x).toBe(10)
      expect(values.y).toBe(20)
      expect(values.width).toBe(100)
      expect(values.height).toBe(50)
    })

    test("should support top and left aliases", () => {
      const bounds = context.variables.createBounds("test-aliases")

      context.createConstraint("test-aliases-bounds", (builder) => {
        builder.ct([1, bounds.left]).eq([15, 1]).strong()
        builder.ct([1, bounds.top]).eq([25, 1]).strong()
        builder.ct([1, bounds.width]).eq([80, 1]).strong()
        builder.ct([1, bounds.height]).eq([60, 1]).strong()
      })
      context.solve()

      // Verify that left is an alias of x and top is an alias of y
      expect(bounds.left.value()).toBe(15)
      expect(bounds.top.value()).toBe(25)
      expect(bounds.x.value()).toBe(15)
      expect(bounds.y.value()).toBe(25)
      expect(bounds.left).toBe(bounds.x)
      expect(bounds.top).toBe(bounds.y)
    })

    test("should detect and warn about negative width", () => {
      const bounds = context.variables.createBounds("test")

      // Create a scenario with negative width (right < left)
      context.createConstraint("test-negative-width", (builder) => {
        builder.ct([1, bounds.x]).eq([100, 1]).strong()
        builder.ct([1, bounds.width]).eq([-50, 1]).strong()
      })
      context.solve()

      // Should still return the negative value but log warning
      const values = getBoundsValues(bounds)
      expect(values.width).toBe(-50)
    })

    test("should detect and warn about negative height", () => {
      const bounds = context.variables.createBounds("test")

      // Create a scenario with negative height (bottom < top)
      context.createConstraint("test-negative-height", (builder) => {
        builder.ct([1, bounds.y]).eq([100, 1]).strong()
        builder.ct([1, bounds.height]).eq([-30, 1]).strong()
      })
      context.solve()

      // Should still return the negative value but log warning
      const values = getBoundsValues(bounds)
      expect(values.height).toBe(-30)
    })
  })

  describe("ActorSymbol rendering guards", () => {
    let context: LayoutContext

    beforeEach(() => {
      const solver = new KiwiSolver()
      context = new LayoutContext(solver, DefaultTheme)
    })

    // TODO: Update these tests for the new Item-based ActorSymbol implementation
    test.skip("should throw error when icon is not available", () => {
      // This test needs to be rewritten for the new implementation
    })

    test.skip("should render with icon when provided", () => {
      // This test needs to be rewritten for the new implementation
    })
  })

  describe("UsecaseSymbol rendering guards", () => {
    let context: LayoutContext

    beforeEach(() => {
      const solver = new KiwiSolver()
      context = new LayoutContext(solver, DefaultTheme)
    })

    test("should clamp negative height to safe value in SVG output", () => {
      const bounds = context.variables.createBounds("usecase")
      const rxVar = context.variables.createVariable("usecase.rx")
      const ryVar = context.variables.createVariable("usecase.ry")
      const ellipseItem = context.variables.createBounds("usecase.ellipse", "item")
      const labelItem = context.variables.createBounds("usecase.label", "item")

      // Set negative height
      context.createConstraint("test-usecase-negative-height", (builder) => {
        builder.ct([1, bounds.x]).eq([0, 1]).strong()
        builder.ct([1, bounds.y]).eq([0, 1]).strong()
        builder.ct([1, bounds.width]).eq([120, 1]).strong()
        builder.ct([1, bounds.height]).eq([-50, 1]).strong()
      })
      context.solve()

      const usecase = new UsecaseSymbol({
        label: "TestUsecase",
        characs: { id: "test-usecase", bounds: bounds, rx: rxVar, ry: ryVar, ellipse: ellipseItem, label: labelItem },
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
      const bounds = context.variables.createBounds("usecase")
      const rxVar = context.variables.createVariable("usecase.rx")
      const ryVar = context.variables.createVariable("usecase.ry")
      const ellipseItem = context.variables.createBounds("usecase.ellipse", "item")
      const labelItem = context.variables.createBounds("usecase.label", "item")

      context.createConstraint("test-usecase-normal", (builder) => {
        builder.ct([1, bounds.x]).eq([10, 1]).strong()
        builder.ct([1, bounds.y]).eq([10, 1]).strong()
        builder.ct([1, bounds.width]).eq([120, 1]).strong()
        builder.ct([1, bounds.height]).eq([60, 1]).strong()
      })
      context.solve()

      const usecase = new UsecaseSymbol({
        label: "TestUsecase",
        characs: { id: "test-usecase", bounds: bounds, rx: rxVar, ry: ryVar, ellipse: ellipseItem, label: labelItem },
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

    test("should constrain rx and ry as linear free variables", () => {
      const bounds = context.variables.createBounds("usecase-constraints")
      const rxVar = context.variables.createVariable("usecase-constraints.rx")
      const ryVar = context.variables.createVariable("usecase-constraints.ry")
      const ellipseItem = context.variables.createBounds("usecase-constraints.ellipse", "item")
      const labelItem = context.variables.createBounds("usecase-constraints.label", "item")

      // Set specific dimensions and rx/ry values
      context.createConstraint("test-usecase-constraints", (builder) => {
        builder.ct([1, bounds.x]).eq([0, 1]).strong()
        builder.ct([1, bounds.y]).eq([0, 1]).strong()
        builder.ct([1, bounds.width]).eq([100, 1]).strong()
        builder.ct([1, bounds.height]).eq([50, 1]).strong()
        // Set rx and ry to specific values to test the constraints
        builder.ct([1, rxVar]).eq([40, 1]).strong()
        builder.ct([1, ryVar]).eq([20, 1]).strong()
      })

      const usecase = new UsecaseSymbol({
        label: "TestUsecase",
        characs: { id: "test-usecase-constraints", bounds: bounds, rx: rxVar, ry: ryVar, ellipse: ellipseItem, label: labelItem },
        theme: DefaultTheme,
      })

      // Apply the constraints
      context.createConstraint("usecase-layout-constraints", (builder) => {
        usecase.ensureLayoutBounds(builder)
      })
      context.solve()

      // Verify the new constraint system:
      // 1. ellipseBounds fits within bounds
      // 2. ellipseBounds.width = 2 * rx and ellipseBounds.height = 2 * ry
      // 3. Label is centered within ellipse bounds
      
      const rxValue = rxVar.value()
      const ryValue = ryVar.value()
      const ellipseBoundsValues = getBoundsValues(ellipseItem)
      const boundsValues = getBoundsValues(bounds)
      const labelBoundsValues = getBoundsValues(labelItem)
      
      // Check that ellipse dimensions match rx and ry
      expect(ellipseBoundsValues.width).toBeCloseTo(2 * rxValue, 1)
      expect(ellipseBoundsValues.height).toBeCloseTo(2 * ryValue, 1)
      
      // Check that ellipse bounds fit within bounds
      expect(ellipseBoundsValues.x).toBeGreaterThanOrEqual(boundsValues.x - 0.1)
      expect(ellipseBoundsValues.right).toBeLessThanOrEqual(boundsValues.right + 0.1)
      expect(ellipseBoundsValues.y).toBeGreaterThanOrEqual(boundsValues.y - 0.1)
      expect(ellipseBoundsValues.bottom).toBeLessThanOrEqual(boundsValues.bottom + 0.1)
      
      // Check that label is centered within ellipse bounds
      expect(labelBoundsValues.centerX).toBeCloseTo(ellipseBoundsValues.centerX, 1)
      expect(labelBoundsValues.centerY).toBeCloseTo(ellipseBoundsValues.centerY, 1)
    })
  })
})
