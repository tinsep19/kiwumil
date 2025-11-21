// example/diagram_info_full.ts
import { TypeDiagram, UMLPlugin, BlueTheme } from "../src/index"

// Full example with all metadata
TypeDiagram({
  title: "E-Commerce System",
  createdAt: "2025-11-13",
  author: "Architecture Team"
})
  .use(UMLPlugin)
  .theme(BlueTheme)
  .build((el, rel, hint) => {
    const user = el.uml.actor("User")
    const shop = el.uml.usecase("Browse Products")
    const cart = el.uml.usecase("Add to Cart")
    const checkout = el.uml.usecase("Checkout")
    
    rel.uml.associate(user, shop)
    rel.uml.associate(user, cart)
    rel.uml.associate(user, checkout)
    
    hint.arrangeVertical(shop, cart, checkout)
    hint.arrangeHorizontal(user, shop)
  })
  .render(import.meta)
