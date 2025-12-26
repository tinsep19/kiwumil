/**
 * Fluent Grid API Example: Basic 2x2 grid with default layout
 * 
 * Demonstrates the basic usage of hint.grid() to arrange symbols in a 2x2 matrix.
 * The grid() method accepts a 2D array of symbols and automatically creates
 * guide variables for grid lines, then applies constraints to position symbols
 * within the grid cells.
 */

import { TypeDiagram } from "../src/index"
import { CorePlugin } from "../src/plugin/core/plugin"

TypeDiagram("Grid Default Test")
  .use(CorePlugin)
  .build(({ el, rel, hint }) => {
    const a = el.core.rectangle("A")
    const b = el.core.rectangle("B")
    const c = el.core.rectangle("C")
    const d = el.core.rectangle("D")
    
    // Create a 2x2 grid layout: symbols are arranged in rows and columns
    // Row 0: [a, b]  Row 1: [c, d]
    hint.grid([
      [a, b],
      [c, d]
    ]).layout()
  })
  .render(import.meta)

