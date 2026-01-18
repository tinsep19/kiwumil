import { KiwiSolver } from "@/kiwi"
import { LayoutVariables } from "@/model"
import { topLeft, topRight, bottomLeft, bottomRight } from "@/core"
import type {
  Anchor,
  TopLeftAnchor,
  TopRightAnchor,
  BottomLeftAnchor,
  BottomRightAnchor,
  CornerAnchor,
} from "@/core"

describe("Corner Anchor Types", () => {
  test("topLeft creates TopLeftAnchor with corner branding", () => {
    const solver = new KiwiSolver()
    const variables = new LayoutVariables(solver)
    const bounds = variables.createBounds("test", "layout")

    const anchor: Anchor = { x: bounds.x, y: bounds.y }
    const cornerAnchor: TopLeftAnchor = topLeft(anchor)

    // Should have the original anchor properties
    expect(cornerAnchor.x).toBe(anchor.x)
    expect(cornerAnchor.y).toBe(anchor.y)

    // Should have the corner branding
    expect(cornerAnchor.corner).toBe("topLeft")
  })

  test("topRight creates TopRightAnchor with corner branding", () => {
    const solver = new KiwiSolver()
    const variables = new LayoutVariables(solver)
    const bounds = variables.createBounds("test", "layout")

    const anchor: Anchor = { x: bounds.x, y: bounds.y }
    const cornerAnchor: TopRightAnchor = topRight(anchor)

    expect(cornerAnchor.x).toBe(anchor.x)
    expect(cornerAnchor.y).toBe(anchor.y)
    expect(cornerAnchor.corner).toBe("topRight")
  })

  test("bottomLeft creates BottomLeftAnchor with corner branding", () => {
    const solver = new KiwiSolver()
    const variables = new LayoutVariables(solver)
    const bounds = variables.createBounds("test", "layout")

    const anchor: Anchor = { x: bounds.x, y: bounds.y }
    const cornerAnchor: BottomLeftAnchor = bottomLeft(anchor)

    expect(cornerAnchor.x).toBe(anchor.x)
    expect(cornerAnchor.y).toBe(anchor.y)
    expect(cornerAnchor.corner).toBe("bottomLeft")
  })

  test("bottomRight creates BottomRightAnchor with corner branding", () => {
    const solver = new KiwiSolver()
    const variables = new LayoutVariables(solver)
    const bounds = variables.createBounds("test", "layout")

    const anchor: Anchor = { x: bounds.x, y: bounds.y }
    const cornerAnchor: BottomRightAnchor = bottomRight(anchor)

    expect(cornerAnchor.x).toBe(anchor.x)
    expect(cornerAnchor.y).toBe(anchor.y)
    expect(cornerAnchor.corner).toBe("bottomRight")
  })

  test("corner anchors preserve anchor variables for constraint solving", () => {
    const solver = new KiwiSolver()
    const variables = new LayoutVariables(solver)
    const bounds = variables.createBounds("test", "layout")

    const anchor: Anchor = { x: bounds.x, y: bounds.y }
    const tlAnchor = topLeft(anchor)
    const trAnchor = topRight(anchor)
    const blAnchor = bottomLeft(anchor)
    const brAnchor = bottomRight(anchor)

    // Set constraints on the original bounds
    solver.createConstraint("test-constraints", (builder) => {
      builder.ct([1, bounds.x]).eq([10, 1]).strong()
      builder.ct([1, bounds.y]).eq([20, 1]).strong()
    })

    solver.updateVariables()

    // All corner anchors should reflect the same values since they share the same variables
    expect(tlAnchor.x.value()).toBeCloseTo(10)
    expect(tlAnchor.y.value()).toBeCloseTo(20)

    expect(trAnchor.x.value()).toBeCloseTo(10)
    expect(trAnchor.y.value()).toBeCloseTo(20)

    expect(blAnchor.x.value()).toBeCloseTo(10)
    expect(blAnchor.y.value()).toBeCloseTo(20)

    expect(brAnchor.x.value()).toBeCloseTo(10)
    expect(brAnchor.y.value()).toBeCloseTo(20)
  })

  test("corner anchors can be used to distinguish different layout positions", () => {
    const solver = new KiwiSolver()
    const variables = new LayoutVariables(solver)

    // Create bounds for different elements
    const element1 = variables.createBounds("element1", "layout")
    const element2 = variables.createBounds("element2", "layout")

    // Create corner-branded anchors for type-safe layout positioning
    const topLeftCorner: TopLeftAnchor = topLeft({ x: element1.x, y: element1.y })
    const bottomRightCorner: BottomRightAnchor = bottomRight({ x: element2.x, y: element2.y })

    // The type system now knows which corner we're working with
    expect(topLeftCorner.corner).toBe("topLeft")
    expect(bottomRightCorner.corner).toBe("bottomRight")

    // This provides better type safety and readability in layout positioning code
    expect(topLeftCorner.x.id).toBe("element1.x")
    expect(topLeftCorner.y.id).toBe("element1.y")
    expect(bottomRightCorner.x.id).toBe("element2.x")
    expect(bottomRightCorner.y.id).toBe("element2.y")
  })

  test("corner anchor types are distinct at type level", () => {
    const solver = new KiwiSolver()
    const variables = new LayoutVariables(solver)
    const bounds = variables.createBounds("test", "layout")

    const anchor: Anchor = { x: bounds.x, y: bounds.y }

    // Each factory creates a distinct branded type
    const tl = topLeft(anchor)
    const tr = topRight(anchor)
    const bl = bottomLeft(anchor)
    const br = bottomRight(anchor)

    // At runtime, they have different corner values
    const corners = [tl.corner, tr.corner, bl.corner, br.corner]
    expect(corners).toEqual(["topLeft", "topRight", "bottomLeft", "bottomRight"])
  })

  test("CornerAnchor union type accepts all corner anchor types", () => {
    const solver = new KiwiSolver()
    const variables = new LayoutVariables(solver)
    const bounds = variables.createBounds("test", "layout")

    const anchor: Anchor = { x: bounds.x, y: bounds.y }

    // All corner anchor types should be assignable to CornerAnchor
    const cornerAnchors: CornerAnchor[] = [
      topLeft(anchor),
      topRight(anchor),
      bottomLeft(anchor),
      bottomRight(anchor),
    ]

    // Verify all corners are present
    expect(cornerAnchors).toHaveLength(4)
    expect(cornerAnchors[0].corner).toBe("topLeft")
    expect(cornerAnchors[1].corner).toBe("topRight")
    expect(cornerAnchors[2].corner).toBe("bottomLeft")
    expect(cornerAnchors[3].corner).toBe("bottomRight")

    // Verify they all share the same anchor variables
    cornerAnchors.forEach((cornerAnchor) => {
      expect(cornerAnchor.x).toBe(anchor.x)
      expect(cornerAnchor.y).toBe(anchor.y)
    })
  })

  test("CornerAnchor type can be used in function signatures", () => {
    const solver = new KiwiSolver()
    const variables = new LayoutVariables(solver)
    const bounds1 = variables.createBounds("bounds1", "layout")
    const bounds2 = variables.createBounds("bounds2", "layout")

    // Function that accepts any corner anchor
    function getCornerType(corner: CornerAnchor): string {
      return corner.corner
    }

    // Should accept all corner anchor types
    expect(getCornerType(topLeft({ x: bounds1.x, y: bounds1.y }))).toBe("topLeft")
    expect(getCornerType(topRight({ x: bounds1.x, y: bounds1.y }))).toBe("topRight")
    expect(getCornerType(bottomLeft({ x: bounds2.x, y: bounds2.y }))).toBe("bottomLeft")
    expect(getCornerType(bottomRight({ x: bounds2.x, y: bounds2.y }))).toBe("bottomRight")
  })
})
