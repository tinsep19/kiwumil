import { Diagram, CorePlugin } from "../src/index"

Diagram
  .use(CorePlugin)
  .build("First Milestone", (el, rel, hint) => {
    const user = el.actor("User")
    const admin = el.actor("Admin")
    
    const login = el.usecase("Login")
    const logout = el.usecase("Logout")
    const manage_users = el.usecase("Manage Users")
    
    const system_boundary = el.systemBoundary("システム化範囲")
    
    // Pack first to establish container relationship
    hint.pack(system_boundary, [login, logout, manage_users])
    
    // Then layout hints
    hint.vertical(user, admin)
    hint.horizontal(user, system_boundary)
    
    // Relations
    rel.associate(user, login)
    rel.associate(user, logout)
    rel.associate(admin, login)
    rel.associate(admin, logout)
    rel.associate(admin, manage_users)
  })
  .render("example/first_milestone.svg")
