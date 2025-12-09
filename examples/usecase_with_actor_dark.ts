import { TypeDiagram, UMLPlugin, DarkTheme } from "../src/index"

TypeDiagram("Usecase with Actor (Dark Theme)")
  .use(UMLPlugin)
  .theme(DarkTheme)
  .build(({ el, rel, hint }) => {
    const user = el.uml.actor("User")
    const login = el.uml.usecase("Login")
    const logout = el.uml.usecase("Logout")
    
    rel.uml.associate(user, login)
    rel.uml.associate(user, logout)
    
    hint.arrangeHorizontal(user, login)
    hint.arrangeVertical(login, logout)
  })
  .render(import.meta)
