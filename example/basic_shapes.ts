// example/basic_shapes.ts
import { Diagram, CorePlugin, DefaultTheme } from "../src/index"

Diagram
  .use(CorePlugin)
  .theme(DefaultTheme)
  .build("Basic Shapes", (el, rel, hint) => {
    // Basic shapes
    const circle = el.circle("Circle")
    const ellipse = el.ellipse("Ellipse")
    const rectangle = el.rectangle("Rectangle")
    const roundedRect = el.roundedRectangle("Rounded")
    
    // Arrange shapes horizontally
    hint.arrangeHorizontal(circle, ellipse, rectangle, roundedRect)
  })
  .render("example/basic_shapes.svg")
