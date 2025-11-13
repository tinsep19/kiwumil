// example/diagram_info_full.ts
import { Diagram, UMLPlugin, DarkTheme } from "../src/index"

// Full example with all metadata
Diagram({
  title: "E-Commerce System",
  createdAt: "2025-11-13",
  author: "Architecture Team"
})
  .use(UMLPlugin)
  .theme(DarkTheme)
  .build((el, rel, hint) => {
    const user = el.actor("User")
    const shop = el.usecase("Browse Products")
    const cart = el.usecase("Add to Cart")
    const checkout = el.usecase("Checkout")
    
    rel.associate(user, shop)
    rel.associate(user, cart)
    rel.associate(user, checkout)
    
    hint.arrangeVertical(shop, cart, checkout)
  })
  .render("example/diagram_info_full.svg")
