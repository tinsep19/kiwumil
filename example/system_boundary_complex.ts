import { Diagram, CorePlugin } from "../src/index"

Diagram
  .use(CorePlugin)
  .build("System Boundary with Multiple Elements", (element, relation, hint) => {
    const user = element.actor("User")
    const admin = element.actor("Admin")
    const login = element.usecase("Login")
    const logout = element.usecase("Logout")
    const manage = element.usecase("Manage Users")
    
    // Create system boundary with multiple children
    const authSystem = element.systemBoundary("Auth System", [login, logout])
    const adminSystem = element.systemBoundary("Admin System", [manage])
  })
  .render("example/system_boundary_complex.svg")
