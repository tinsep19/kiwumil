import { TypeDiagram, UMLPlugin } from "../src/index"

TypeDiagram("First Milestone")
  .use(UMLPlugin)
  .build((el, rel, hint) => {
    // 1. シンボルを定義
    const user = el.uml.actor("User")
    const admin = el.uml.actor("Admin")
    
    const login = el.uml.usecase("Login")
    const logout = el.uml.usecase("Logout")
    const manage_users = el.uml.usecase("Manage Users")
    
    const system_boundary = el.uml.systemBoundary("システム化範囲")
    
    // 2. 関係を定義
    rel.uml.associate(user, login)
    rel.uml.associate(user, logout)
    rel.uml.associate(admin, login)
    rel.uml.associate(admin, logout)
    rel.uml.associate(admin, manage_users)
    
    // 3. レイアウトヒントを設定（新しいAPI）
    hint.arrangeVertical(user, admin)
    hint.arrangeHorizontal(user, system_boundary)
    hint.enclose(system_boundary, [login, logout, manage_users])
    hint.arrangeVertical(login, logout, manage_users)  // ✅ 重ならない！
  })
  .render("example/first_milestone.svg")
