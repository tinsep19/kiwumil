// example/theme_example.ts
import { Diagram, UMLPlugin, DefaultTheme, BlueTheme, DarkTheme } from "../src/index"

// Default theme example
Diagram("Login System")
  .use(UMLPlugin)
  .theme(DefaultTheme)
  .build((element, relation, hint) => {
    const user = element.actor("User")
    const login = element.usecase("Login")
    const logout = element.usecase("Logout")
    
    relation.associate(user, login)
    relation.associate(user, logout)
    
    hint.vertical(login, logout)
  })
  .render("example/usecase_with_actor.svg")

// Blue theme example
Diagram("Login System (Blue)")
  .use(UMLPlugin)
  .theme(BlueTheme)
  .build((element, relation, hint) => {
    const user = element.actor("User")
    const login = element.usecase("Login")
    const logout = element.usecase("Logout")
    
    relation.associate(user, login)
    relation.associate(user, logout)
    
    hint.vertical(login, logout)
  })
  .render("example/usecase_with_actor_blue_themed.svg")

// Dark theme example
Diagram("Login System")
  .use(UMLPlugin)
  .theme(DarkTheme)
  .build((element, relation, hint) => {
    const user = element.actor("User")
    const login = element.usecase("Login")
    const logout = element.usecase("Logout")
    
    relation.associate(user, login)
    relation.associate(user, logout)
    
    hint.vertical(login, logout)
  })
  .render("example/usecase_with_actor_dark_themed.svg")
