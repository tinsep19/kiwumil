import { Diagram, UMLPlugin, DarkTheme } from "../src/index"

Diagram("Usecase with Actor (Dark Theme)")
  .use(UMLPlugin)
  .theme(DarkTheme)
  .build((element, relation, hint) => {
    const user = element.actor("User")
    const login = element.usecase("Login")
    const logout = element.usecase("Logout")
    
    relation.associate(user, login)
    relation.associate(user, logout)
    
    hint.horizontal(user, login)
    hint.vertical(login, logout)
  })
  .render("example/usecase_with_actor_dark.svg")
