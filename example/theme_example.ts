// example/theme_example.ts
import { Diagram, CorePlugin } from "../src/index"
import { themes } from "../src/core/theme"

// Default theme example
Diagram
  .use(CorePlugin)
  .build("Login System", (element, relation, hint) => {
    const user = element.actor("User")
    const login = element.usecase("Login")
    const logout = element.usecase("Logout")
    
    relation.associate(user, login)
    relation.associate(user, logout)
    
    hint.vertical(login, logout)
  })
  .render("example/usecase_with_actor.svg")

// Blue theme example (future implementation)
// Diagram
//   .use(CorePlugin)
//   .theme(themes.blue)
//   .build("Login System (Blue)", (element, relation, hint) => {
//     const user = element.actor("User")
//     const login = element.usecase("Login")
//     const logout = element.usecase("Logout")
//     
//     relation.associate(user, login)
//     relation.associate(user, logout)
//     
//     hint.vertical(login, logout)
//   })
//   .render("example/usecase_with_actor_blue.svg")

// Dark theme example (future implementation)
// Diagram
//   .use(CorePlugin)
//   .theme(themes.dark)
//   .build("Login System (Dark)", (element, relation, hint) => {
//     const user = element.actor("User")
//     const login = element.usecase("Login")
//     const logout = element.usecase("Logout")
//     
//     relation.associate(user, login)
//     relation.associate(user, logout)
//     
//     hint.vertical(login, logout)
//   })
//   .render("example/usecase_with_actor_dark.svg")
