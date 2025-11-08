import { Diagram, CorePlugin } from "../src/index"

Diagram
  .use(CorePlugin)
  .build("System Boundary Example", (el, rel, hint) => {
    const user = el.actor("User")
    const login = el.usecase("Login")
    const boundary = el.systemBoundary("Auth System")

    rel.associate(user, login)
    hint.horizontal(user, boundary)
    hint.pack(boundary, [login])
  })
  .render("example/system_boundary_example.svg")
