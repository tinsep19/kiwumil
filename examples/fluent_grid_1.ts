/**
 * Fluent Grid API Example 1: Basic grid layout
 * 
 * Demonstrates basic 2x2 grid layout with direct layout() call
 */

import { TypeDiagram } from "../src/index"
import { CorePlugin } from "../src/plugin/core/plugin"
import { UMLPlugin } from "../src/plugin/uml/plugin"

// Example 1: Basic grid layout with direct layout() call
TypeDiagram("Fluent Grid: Basic 2x2")
  .use(CorePlugin, UMLPlugin)
  .layout(({ el, hint }) => {
    const box1 = el.core.rectangle("Box 1", { width: 80, height: 60 })
    const box2 = el.core.rectangle("Box 2", { width: 80, height: 60 })
    const box3 = el.core.rectangle("Box 3", { width: 80, height: 60 })
    const box4 = el.core.rectangle("Box 4", { width: 80, height: 60 })

    // Use the new fluent grid API - symbols can be passed directly as IDs
    const grid = hint.grid([
      [box1, box2],
      [box3, box4],
    ]).layout()

    // Access grid coordinates
    console.log("Grid has", grid.x.length, "vertical guides (M+1)")
    console.log("Grid has", grid.y.length, "horizontal guides (N+1)")
    console.log("Grid has", grid.width.length, "column widths")
    console.log("Grid has", grid.height.length, "row heights")
  })
  .render(import.meta)
