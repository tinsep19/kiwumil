import { Diagram, CorePlugin } from "../src/index"

const diagram = Diagram.use(CorePlugin).build("Usecase with Actor", (element, relation, hint) => {
  const user = element.actor("User")
  const login = element.usecase("Login")
  const logout = element.usecase("Logout")
  
  hint.horizontal(user, login)
  hint.vertical(login, logout)
})

diagram.render("output/usecase_with_actor.svg")
