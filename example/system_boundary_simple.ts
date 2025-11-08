import { Diagram, CorePlugin } from "../src/index"

Diagram
  .use(CorePlugin)
  .build("System Boundary Example", (element, relation, hint) => {
    const user = element.actor("User")
    const login = element.usecase("Login")
    const boundary = element.systemBoundary("Auth System")
    
    hint.pack(boundary, [login])
  })
  .render("example/system_boundary_simple.svg")
