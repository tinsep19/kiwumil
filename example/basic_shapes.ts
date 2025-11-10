// example/basic_shapes.ts
import { Diagram, DefaultTheme } from "../src/index"

// CorePluginはデフォルトで有効
Diagram
  .theme(DefaultTheme)
  .build("Basic Shapes", (el, rel, hint) => {
    // Basic shapes from CorePlugin
    const circle = el.circle("Circle")
    const ellipse = el.ellipse("Ellipse")
    const rectangle = el.rectangle("Rectangle")
    const roundedRect = el.roundedRectangle("Rounded")
    
    // Arrange shapes horizontally
    hint.arrangeHorizontal(circle, ellipse, rectangle, roundedRect)
  })
  .render("example/basic_shapes.svg")
