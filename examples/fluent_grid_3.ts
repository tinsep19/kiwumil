/**
 * Fluent Grid API Example 3: Using getArea() to access cell bounds
 * 
 * Demonstrates accessing specific cell bounds and spanning cells
 */

import { TypeDiagram } from "../src/index"
import { CorePlugin } from "../src/plugin/core/plugin"

// Example 3: Using getArea() to access cell bounds
TypeDiagram("Fluent Grid: Cell Access")
  .use(CorePlugin)
  .layout(({ el, hint, diagram }) => {
    const a = el.core.rectangle("A", { width: 60, height: 40 })
    const b = el.core.rectangle("B", { width: 60, height: 40 })
    const c = el.core.rectangle("C", { width: 60, height: 40 })
    const d = el.core.rectangle("D", { width: 60, height: 40 })
    const e = el.core.rectangle("E", { width: 60, height: 40 })
    const f = el.core.rectangle("F", { width: 60, height: 40 })

    const grid = hint.grid([
      [a, b, c],
      [d, e, f],
    ]).layout()

    // Access specific cell bounds
    const topLeftCell = grid.getArea({ top: 0, left: 0, bottom: 1, right: 1 })
    console.log("Top-left cell bounds:", topLeftCell)

    // Access spanning cells
    const topRow = grid.getArea({ top: 0, left: 0, bottom: 1, right: 3 })
    console.log("Top row bounds:", topRow)

    const leftColumn = grid.getArea({ top: 0, left: 0, bottom: 2, right: 1 })
    console.log("Left column bounds:", leftColumn)
    hint.enclose(diagram, [a, b, c, d, e, f])
  })
  .render(import.meta)
