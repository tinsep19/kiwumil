import { TypeDiagram, UMLPlugin, DefaultTheme } from "../src/index"

TypeDiagram("Actor with Stereotype Example")
  .use(UMLPlugin)
  .theme(DefaultTheme)
  .build(({ el, rel, hint }) => {
    // アクターをstereotypeありとなしで作成
    const user = el.uml.actor("User")
    const admin = el.uml.actor({ label: "Administrator", stereotype: "primary" })
    const guest = el.uml.actor({ label: "Guest", stereotype: "secondary" })
    
    const login = el.uml.usecase("Login")
    const manage = el.uml.usecase("Manage System")
    
    rel.uml.associate(user, login)
    rel.uml.associate(admin, manage)
    rel.uml.associate(guest, login)
    
    hint.arrangeVertical(admin, user, guest)
    hint.arrangeHorizontal(user, login)
    hint.arrangeHorizontal(admin, manage)
  })
  .render(import.meta)
