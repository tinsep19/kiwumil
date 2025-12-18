/**
 * Fluent Grid API Example 2: Grid layout with container
 * 
 * Demonstrates grid layout within a container with null cells
 */

import { TypeDiagram } from "../src/index"
import { CorePlugin } from "../src/plugin/core/plugin"
import { UMLPlugin } from "../src/plugin/uml/plugin"

// Example 2: Grid layout with container
TypeDiagram("Fluent Grid: With Container")
  .use(CorePlugin, UMLPlugin)
  .build(({ el, hint }) => {
    const container = el.uml.systemBoundary("System")
    
    const box1 = el.core.rectangle("Service A", { width: 100, height: 60 })
    const box2 = el.core.rectangle("Service B", { width: 100, height: 60 })
    const box3 = el.core.rectangle("Database", { width: 100, height: 60 })

    // Grid with null cells and container
    const grid = hint.grid([
      [box1, box2],
      [null, box3],
    ]).in(container)

    // The grid coordinates are automatically constrained to the container
    console.log("Container grid:", grid.width.length, "cols x", grid.height.length, "rows")
  })
  .render(import.meta)
