/**
 * Fluent Grid API Example
 * 
 * Demonstrates the new fluent API for grid-based layouts
 */

import { TypeDiagram } from "../src/index"
import { CorePlugin } from "../src/plugin/core/plugin"
import { UMLPlugin } from "../src/plugin/uml/plugin"

// Example 1: Basic grid layout with direct layout() call
TypeDiagram("Fluent Grid: Basic 2x2")
  .use(CorePlugin, UMLPlugin)
  .build(({ el, hint }) => {
    const box1 = el.core.rectangle("Box 1", { width: 80, height: 60 })
    const box2 = el.core.rectangle("Box 2", { width: 80, height: 60 })
    const box3 = el.core.rectangle("Box 3", { width: 80, height: 60 })
    const box4 = el.core.rectangle("Box 4", { width: 80, height: 60 })

    // Get symbol characs
    const symbols = hint.getSymbols()
    const s1 = symbols.find((s) => s.id === box1)
    const s2 = symbols.find((s) => s.id === box2)
    const s3 = symbols.find((s) => s.id === box3)
    const s4 = symbols.find((s) => s.id === box4)

    // Use the new fluent grid API
    const grid = hint.grid([
      [s1, s2],
      [s3, s4],
    ] as any).layout()

    // Access grid coordinates
    console.log("Grid has", grid.x.length, "vertical guides (M+1)")
    console.log("Grid has", grid.y.length, "horizontal guides (N+1)")
    console.log("Grid has", grid.width.length, "column widths")
    console.log("Grid has", grid.height.length, "row heights")
  })
  .render(import.meta)

// Example 2: Grid layout with container
TypeDiagram("Fluent Grid: With Container")
  .use(CorePlugin, UMLPlugin)
  .build(({ el, hint }) => {
    const container = el.uml.systemBoundary("System")
    
    const box1 = el.core.rectangle("Service A", { width: 100, height: 60 })
    const box2 = el.core.rectangle("Service B", { width: 100, height: 60 })
    const box3 = el.core.rectangle("Database", { width: 100, height: 60 })

    const symbols = hint.getSymbols()
    const s1 = symbols.find((s) => s.id === box1)
    const s2 = symbols.find((s) => s.id === box2)
    const s3 = symbols.find((s) => s.id === box3)

    // Grid with null cells and container
    const grid = hint.grid([
      [s1, s2],
      [null, s3],
    ] as any).in(container)

    // The grid coordinates are automatically constrained to the container
    console.log("Container grid:", grid.width.length, "cols x", grid.height.length, "rows")
  })
  .render(import.meta)

// Example 3: Using getArea() to access cell bounds
TypeDiagram("Fluent Grid: Cell Access")
  .use(CorePlugin)
  .build(({ el, hint }) => {
    const a = el.core.rectangle("A", { width: 60, height: 40 })
    const b = el.core.rectangle("B", { width: 60, height: 40 })
    const c = el.core.rectangle("C", { width: 60, height: 40 })
    const d = el.core.rectangle("D", { width: 60, height: 40 })
    const e = el.core.rectangle("E", { width: 60, height: 40 })
    const f = el.core.rectangle("F", { width: 60, height: 40 })

    const symbols = hint.getSymbols()
    const sa = symbols.find((s) => s.id === a)
    const sb = symbols.find((s) => s.id === b)
    const sc = symbols.find((s) => s.id === c)
    const sd = symbols.find((s) => s.id === d)
    const se = symbols.find((s) => s.id === e)
    const sf = symbols.find((s) => s.id === f)

    const grid = hint.grid([
      [sa, sb, sc],
      [sd, se, sf],
    ] as any).layout()

    // Access specific cell bounds
    const topLeftCell = grid.getArea({ top: 0, left: 0, bottom: 1, right: 1 })
    console.log("Top-left cell bounds:", topLeftCell)

    // Access spanning cells
    const topRow = grid.getArea({ top: 0, left: 0, bottom: 1, right: 3 })
    console.log("Top row bounds:", topRow)

    const leftColumn = grid.getArea({ top: 0, left: 0, bottom: 2, right: 1 })
    console.log("Left column bounds:", leftColumn)
  })
  .render(import.meta)
