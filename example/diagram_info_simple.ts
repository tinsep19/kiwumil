// example/diagram_info_simple.ts
import { Diagram } from "../src/index"

// Simple example with title only
Diagram("Simple Diagram with Title")
  .build((el, rel, hint) => {
    const circle = el.circle("Circle")
    const rect = el.rectangle("Rectangle")
    hint.arrangeHorizontal(circle, rect)
  })
  .render("example/diagram_info_simple.svg")
