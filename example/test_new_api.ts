import { Diagram, CorePlugin } from "../src/index"

Diagram
  .use(CorePlugin)
  .build("Test New API", (el, rel, hint) => {
    // 1. シンボルを定義
    const user = el.actor("User")
    const admin = el.actor("Admin")
    
    const login = el.usecase("Login")
    const logout = el.usecase("Logout")
    const manage_users = el.usecase("Manage Users")
    
    const system_boundary = el.systemBoundary("システム化範囲")
    
    // 2. 関係を定義
    rel.associate(user, login)
    rel.associate(user, logout)
    rel.associate(admin, login)
    rel.associate(admin, logout)
    rel.associate(admin, manage_users)
    
    // 3. レイアウトヒントを設定（新しいAPI）
    hint.arrangeVertical(user, admin)
    hint.arrangeHorizontal(user, system_boundary)
    hint.enclose(system_boundary, [login, logout, manage_users])
    hint.arrangeVertical(login, logout, manage_users)  // ✅ これで重ならない
  })
  .render("example/test_new_api.svg")
