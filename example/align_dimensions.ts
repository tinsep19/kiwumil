import { Diagram } from "../src/dsl/diagram"
import { UMLPlugin } from "../src/plugin/uml"
import { CorePlugin } from "../src/plugin/core"

// Test alignWidth
Diagram.use(UMLPlugin)
  .use(CorePlugin)
  .build("Align Width Test", (el, rel, hint) => {
    const actor1 = el.actor("User")
    const actor2 = el.actor("Admin")
    const actor3 = el.actor("Guest")

    hint.arrangeVertical(actor1, actor2, actor3)
    hint.alignWidth(actor1, actor2, actor3)
  })
  .render("example/align_width.svg")

// Test alignHeight
Diagram.use(UMLPlugin)
  .use(CorePlugin)
  .build("Align Height Test", (el, rel, hint) => {
    const rect1 = el.rectangle("Box 1")
    const rect2 = el.rectangle("Box 2")
    const rect3 = el.rectangle("Box 3")

    hint.arrangeHorizontal(rect1, rect2, rect3)
    hint.alignHeight(rect1, rect2, rect3)
  })
  .render("example/align_height.svg")

// Test alignSize
Diagram.use(UMLPlugin)
  .use(CorePlugin)
  .build("Align Size Test", (el, rel, hint) => {
    const uc1 = el.usecase("Login")
    const uc2 = el.usecase("Logout")
    const uc3 = el.usecase("Register")

    hint.arrangeHorizontal(uc1, uc2, uc3)
    hint.alignSize(uc1, uc2, uc3)
  })
  .render("example/align_size.svg")

// Complex example: Align width + vertical layout
Diagram.use(UMLPlugin)
  .use(CorePlugin)
  .build("Complex Align Test", (el, rel, hint) => {
    const user = el.actor("User")
    const admin = el.actor("Admin")
    
    const login = el.usecase("Login")
    const logout = el.usecase("Logout")
    const manage = el.usecase("Manage Users")

    // Arrange actors vertically and align their widths
    hint.arrangeVertical(user, admin)
    hint.alignWidth(user, admin)

    // Arrange usecases vertically and align their sizes
    hint.arrangeVertical(login, logout, manage)
    hint.alignSize(login, logout, manage)

    // Position actors to the left of usecases
    hint.arrangeHorizontal(user, login)

    // Add relationships
    rel.associate(user, login)
    rel.associate(user, logout)
    rel.associate(admin, login)
    rel.associate(admin, logout)
    rel.associate(admin, manage)
  })
  .render("example/align_complex.svg")

console.log("✓ All align dimension examples rendered successfully!")
