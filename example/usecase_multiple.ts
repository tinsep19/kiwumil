import { Diagram, CorePlugin } from "../src/index"

Diagram
  .use(CorePlugin)
  .build("Multiple Usecases", (element, relation, hint) => {
    const login = element.usecase("Login")
    const register = element.usecase("Register")
    const profile = element.usecase("View Profile")
    
    hint.horizontal(login, register)
    hint.horizontal(register, profile)
  })
  .render("example/usecase_multiple.svg")
