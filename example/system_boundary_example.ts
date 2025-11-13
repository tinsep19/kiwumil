import { Diagram, UMLPlugin } from "../src/index"

Diagram("System Boundary Example")
  .use(UMLPlugin)
  .build((el, rel, hint) => {
    const user = el.actor("User")
    const login = el.usecase("Login")
    const boundary = el.systemBoundary("Auth System")

    hint.enclose(boundary, [login])
    hint.horizontal(user, boundary)
    rel.associate(user, login)
  })
  .render("example/system_boundary_example.svg")
