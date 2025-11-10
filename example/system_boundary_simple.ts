import { Diagram, UMLPlugin } from "../src/index"

Diagram
  .use(UMLPlugin)
  .build("System Boundary Example", (element, relation, hint) => {
    const user = element.actor("User")
    const login = element.usecase("Login")
    const boundary = element.systemBoundary("Auth System")
    
    hint.enclose(boundary, [login])
  })
  .render("example/system_boundary_simple.svg")
