import { Diagram, CorePlugin } from "../src/index"

const diagram = Diagram.use(CorePlugin).build("Multiple Usecases", (element, relation, hint) => {
  const login = element.usecase("Login")
  const register = element.usecase("Register")
  const profile = element.usecase("View Profile")
  
  hint.horizontal(login, register)
  hint.horizontal(register, profile)
})

diagram.render("example/usecase_multiple.svg")
