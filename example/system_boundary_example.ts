import { Diagram, CorePlugin } from "../src/index"

Diagram
  .use(CorePlugin)
  .build("System Boundary Example", (el, rel, hint) => {
    const user = el.actor("User")
    const login = el.usecase("Login")
    const boundary = el.systemBoundary("Auth System")

    hint.pack(boundary, [login])
    hint.horizontal(user, boundary)
    rel.associate(user, login)
  })
  .render("example/system_boundary_example.svg")
