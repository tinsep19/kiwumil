import { TypeDiagram, UMLPlugin } from "../src/index"

TypeDiagram("System Boundary with Multiple Elements")
  .use(UMLPlugin)
  .build(({ el, rel, hint }) => {
    const user = el.uml.actor("User")
    const admin = el.uml.actor("Admin")
    const login = el.uml.usecase("Login")
    const logout = el.uml.usecase("Logout")
    const manage = el.uml.usecase("Manage Users")
    
    // Create system boundaries
    const authSystem = el.uml.systemBoundary("Auth System")
    const adminSystem = el.uml.systemBoundary("Admin System")

    rel.uml.associate(user, login)
    rel.uml.associate(user, logout)
    rel.uml.associate(admin, login)
    rel.uml.associate(admin, logout)
    rel.uml.associate(admin, manage)
    
    // Pack usecases into boundaries
    hint.enclose(authSystem, [login, logout])
    hint.enclose(adminSystem, [manage])

    // Layout boundaries
    hint.arrangeVertical(login, logout)
    hint.arrangeHorizontal(user, authSystem, admin, adminSystem)
  })
  .render(import.meta)
