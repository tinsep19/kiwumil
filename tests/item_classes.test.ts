import { describe, test, beforeEach, expect } from "bun:test"
import { TextItem, RectItem, IconItem } from "@/item"
import { LayoutContext } from "@/model"
import { KiwiSolver } from "@/kiwi"
import { DefaultTheme } from "@/theme"
import { getBoundsValues } from "@/core"

describe("Item Classes", () => {
  let context: LayoutContext

  beforeEach(() => {
    const solver = new KiwiSolver()
    context = new LayoutContext(solver, DefaultTheme)
  })

  describe("TextItem", () => {
    test("should calculate default size based on text content", () => {
      const bounds = context.variables.createBounds("text1", "item")
      const textItem = new TextItem({
        bounds,
        text: "Hello World",
        fontSize: 14,
      })

      const size = textItem.getDefaultSize()
      expect(size.width).toBeGreaterThan(0)
      expect(size.height).toBeGreaterThan(0)
    })

    test("should support multiline text", () => {
      const bounds = context.variables.createBounds("text2", "item")
      const textItem = new TextItem({
        bounds,
        text: "Line 1\nLine 2\nLine 3",
        fontSize: 14,
      })

      const size = textItem.getDefaultSize()
      // Height should account for 3 lines
      expect(size.height).toBeGreaterThan(14 * 1.2 * 3)
    })

    test("should support different text alignments", () => {
      const bounds = context.variables.createBounds("text3", "item")

      const leftAligned = new TextItem({
        bounds,
        text: "Left",
        alignment: "left",
      })
      expect(leftAligned.alignment).toBe("left")

      const centerAligned = new TextItem({
        bounds,
        text: "Center",
        alignment: "center",
      })
      expect(centerAligned.alignment).toBe("center")

      const rightAligned = new TextItem({
        bounds,
        text: "Right",
        alignment: "right",
      })
      expect(rightAligned.alignment).toBe("right")
    })

    test("should render as SVG with proper escaping", () => {
      const bounds = context.variables.createBounds("text4", "item")

      context.createConstraint("text4-constraints", (builder) => {
        builder.ct([1, bounds.x]).eq([10, 1]).strong()
        builder.ct([1, bounds.y]).eq([20, 1]).strong()
        builder.ct([1, bounds.width]).eq([100, 1]).strong()
        builder.ct([1, bounds.height]).eq([50, 1]).strong()
      })
      context.solve()

      const textItem = new TextItem({
        bounds,
        text: "Test <>&",
        alignment: "center",
      })

      const svg = textItem.render()
      expect(svg).toContain('text-anchor="middle"')
      expect(svg).toContain("&lt;")
      expect(svg).toContain("&gt;")
      expect(svg).toContain("&amp;")
    })

    test("should support custom padding", () => {
      const bounds = context.variables.createBounds("text5", "item")
      const textItem = new TextItem({
        bounds,
        text: "Padded",
        padding: { top: 20, right: 30, bottom: 20, left: 30 },
      })

      expect(textItem.padding.top).toBe(20)
      expect(textItem.padding.right).toBe(30)
      expect(textItem.padding.bottom).toBe(20)
      expect(textItem.padding.left).toBe(30)
    })
  })

  describe("RectItem", () => {
    test("should calculate default size", () => {
      const bounds = context.variables.createBounds("rect1", "item")
      const rectItem = new RectItem({
        bounds,
        width: 100,
        height: 50,
      })

      const size = rectItem.getDefaultSize()
      expect(size.width).toBe(100)
      expect(size.height).toBe(50)
    })

    test("should render rectangle with fill and stroke", () => {
      const bounds = context.variables.createBounds("rect2", "item")

      context.createConstraint("rect2-constraints", (builder) => {
        builder.ct([1, bounds.x]).eq([0, 1]).strong()
        builder.ct([1, bounds.y]).eq([0, 1]).strong()
        builder.ct([1, bounds.width]).eq([100, 1]).strong()
        builder.ct([1, bounds.height]).eq([50, 1]).strong()
      })
      context.solve()

      const rectItem = new RectItem({
        bounds,
        fillColor: "#ff0000",
        strokeColor: "#000000",
        strokeWidth: 2,
      })

      const svg = rectItem.render()
      expect(svg).toContain('fill="#ff0000"')
      expect(svg).toContain('stroke="#000000"')
      expect(svg).toContain('stroke-width="2"')
    })

    test("should support rounded corners", () => {
      const bounds = context.variables.createBounds("rect3", "item")

      context.createConstraint("rect3-constraints", (builder) => {
        builder.ct([1, bounds.x]).eq([0, 1]).strong()
        builder.ct([1, bounds.y]).eq([0, 1]).strong()
        builder.ct([1, bounds.width]).eq([100, 1]).strong()
        builder.ct([1, bounds.height]).eq([50, 1]).strong()
      })
      context.solve()

      const rectItem = new RectItem({
        bounds,
        cornerRadius: 10,
      })

      const svg = rectItem.render()
      expect(svg).toContain('rx="10"')
      expect(svg).toContain('ry="10"')
    })
  })

  describe("IconItem", () => {
    test("should calculate default size from icon dimensions", () => {
      const bounds = context.variables.createBounds("icon1", "item")
      const iconItem = new IconItem({
        bounds,
        icon: {
          width: 48,
          height: 48,
          raw: '<circle cx="24" cy="24" r="20"/>',
        },
      })

      const size = iconItem.getDefaultSize()
      expect(size.width).toBe(48)
      expect(size.height).toBe(48)
    })

    test("should render icon with href reference", () => {
      const bounds = context.variables.createBounds("icon2", "item")

      context.createConstraint("icon2-constraints", (builder) => {
        builder.ct([1, bounds.x]).eq([10, 1]).strong()
        builder.ct([1, bounds.y]).eq([20, 1]).strong()
        builder.ct([1, bounds.width]).eq([24, 1]).strong()
        builder.ct([1, bounds.height]).eq([24, 1]).strong()
      })
      context.solve()

      const iconItem = new IconItem({
        bounds,
        icon: {
          href: "my-icon-symbol",
          viewBox: "0 0 24 24",
        },
      })

      const svg = iconItem.render()
      expect(svg).toContain('<use href="#my-icon-symbol"')
      expect(svg).toContain('viewBox="0 0 24 24"')
    })

    test("should render icon with raw SVG", () => {
      const bounds = context.variables.createBounds("icon3", "item")

      context.createConstraint("icon3-constraints", (builder) => {
        builder.ct([1, bounds.x]).eq([5, 1]).strong()
        builder.ct([1, bounds.y]).eq([10, 1]).strong()
        builder.ct([1, bounds.width]).eq([32, 1]).strong()
        builder.ct([1, bounds.height]).eq([32, 1]).strong()
      })
      context.solve()

      const iconItem = new IconItem({
        bounds,
        icon: {
          raw: '<circle cx="16" cy="16" r="12" fill="blue"/>',
        },
      })

      const svg = iconItem.render()
      expect(svg).toContain('<g transform="translate(5, 10)">')
      expect(svg).toContain('<circle cx="16" cy="16" r="12" fill="blue"/>')
    })

    test("should apply custom color when using href", () => {
      const bounds = context.variables.createBounds("icon4", "item")

      context.createConstraint("icon4-constraints", (builder) => {
        builder.ct([1, bounds.x]).eq([0, 1]).strong()
        builder.ct([1, bounds.y]).eq([0, 1]).strong()
        builder.ct([1, bounds.width]).eq([24, 1]).strong()
        builder.ct([1, bounds.height]).eq([24, 1]).strong()
      })
      context.solve()

      const iconItem = new IconItem({
        bounds,
        icon: {
          href: "test-icon",
        },
        color: "#ff0000",
      })

      const svg = iconItem.render()
      expect(svg).toContain('fill="#ff0000"')
    })
  })
})
