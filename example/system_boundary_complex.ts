import { Diagram, UMLPlugin } from "../src/index"

Diagram("System Boundary with Multiple Elements")
  .use(UMLPlugin)
  .build((element, relation, hint) => {
    const user = element.actor("User")
    const admin = element.actor("Admin")
    const login = element.usecase("Login")
    const logout = element.usecase("Logout")
    const manage = element.usecase("Manage Users")
    
    // Create system boundaries
    const authSystem = element.systemBoundary("Auth System")
    const adminSystem = element.systemBoundary("Admin System")
    
    // Pack use cases into boundaries
    hint.enclose(authSystem, [login, logout])
    hint.enclose(adminSystem, [manage])
    
    // Layout boundaries
    hint.horizontal(authSystem, adminSystem)
  })
  .render("example/system_boundary_complex.svg")
