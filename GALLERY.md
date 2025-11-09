# Gallery

このページでは、Kiwumilで生成できる図の例を紹介します。

## Actor Examples

### Simple Actor

基本的なアクター要素の描画例。

**Code:**
```typescript
// example/actor_simple.ts
import { Diagram, CorePlugin } from "../src/index"

Diagram
  .use(CorePlugin)
  .build("Simple Actor", (element, relation, hint) => {
    element.actor("User")
  })
  .render("example/actor_simple.svg")
```

**Output:**

![Simple Actor](example/actor_simple.svg)

---

### Horizontal Layout

複数のアクターを水平に配置した例。

**Code:**
```typescript
// example/actor_horizontal.ts
import { Diagram, CorePlugin } from "../src/index"

Diagram
  .use(CorePlugin)
  .build("Horizontal Actors", (element, relation, hint) => {
    const user1 = element.actor("User")
    const user2 = element.actor("Admin")
    const user3 = element.actor("Guest")

    hint.horizontal(user1, user2, user3)
  })
  .render("example/actor_horizontal.svg")
```

**Output:**

![Horizontal Actors](example/actor_horizontal.svg)

---

### Vertical Layout

複数のアクターを垂直に配置した例。

**Code:**
```typescript
// example/actor_vertical.ts
import { Diagram, CorePlugin } from "../src/index"

Diagram
  .use(CorePlugin)
  .build("Vertical Actors", (element, relation, hint) => {
    const user1 = element.actor("User")
    const user2 = element.actor("Admin")
    const user3 = element.actor("Guest")

    hint.vertical(user1, user2, user3)
  })
  .render("example/actor_vertical.svg")
```

**Output:**

![Vertical Actors](example/actor_vertical.svg)

---

## Usecase Examples

### Simple Usecase

基本的なユースケース要素の描画例。

**Code:**
```typescript
// example/usecase_simple.ts
import { Diagram, CorePlugin } from "../src/index"

Diagram
  .use(CorePlugin)
  .build("Simple Usecase", (element, relation, hint) => {
    element.usecase("Login")
  })
  .render("example/usecase_simple.svg")
```

**Output:**

![Simple Usecase](example/usecase_simple.svg)

---

### Multiple Usecases

複数のユースケースを配置した例。

**Code:**
```typescript
// example/usecase_multiple.ts
import { Diagram, CorePlugin } from "../src/index"

Diagram
  .use(CorePlugin)
  .build("Multiple Usecases", (element, relation, hint) => {
    const login = element.usecase("Login")
    const register = element.usecase("Register")
    const profile = element.usecase("View Profile")
    
    hint.horizontal(login, register)
    hint.horizontal(register, profile)
  })
  .render("example/usecase_multiple.svg")
```

**Output:**

![Multiple Usecases](example/usecase_multiple.svg)

---

## Association Examples

### Usecase with Actor

アクターとユースケースを関連線で接続した例。

**Code:**
```typescript
// example/usecase_with_actor.ts
import { Diagram, CorePlugin } from "../src/index"

Diagram
  .use(CorePlugin)
  .build("Usecase with Actor", (element, relation, hint) => {
    const user = element.actor("User")
    const login = element.usecase("Login")
    const logout = element.usecase("Logout")
    
    relation.associate(user, login)
    relation.associate(user, logout)
    
    hint.horizontal(user, login)
    hint.vertical(login, logout)
  })
  .render("example/usecase_with_actor.svg")
```

**Output:**

![Usecase with Actor](example/usecase_with_actor.svg)

---

## System Boundary Examples

### First Milestone - Complete Use Case Example

複数のアクターとユースケース、システム境界を組み合わせた実用的な例。

**Code:**
```typescript
// example/first_milestone.ts
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
```

**Output:**

![First Milestone](example/first_milestone.svg)

---

### System Boundary with Usecase

システム境界内にユースケースを配置した例。

**Code:**
```typescript
// example/system_boundary_example.ts
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
```

**Output:**

![System Boundary Example](example/system_boundary_example.svg)

---

## Theme Examples

### Blue Theme

ブルーテーマを適用した例。

**Code:**
```typescript
// example/usecase_with_actor_blue.ts
import { Diagram, CorePlugin, themes } from "../src/index"

Diagram
  .use(CorePlugin)
  .theme(themes.blue)
  .build("Usecase with Actor (Blue Theme)", (element, relation, hint) => {
    const user = element.actor("User")
    const login = element.usecase("Login")
    const logout = element.usecase("Logout")
    
    relation.associate(user, login)
    relation.associate(user, logout)
    
    hint.horizontal(user, login)
    hint.vertical(login, logout)
  })
  .render("example/usecase_with_actor_blue.svg")
```

**Output:**

![Usecase with Actor (Blue Theme)](example/usecase_with_actor_blue.svg)

---

### Dark Theme

ダークテーマを適用した例。

**Code:**
```typescript
// example/usecase_with_actor_dark.ts
import { Diagram, CorePlugin, themes } from "../src/index"

Diagram
  .use(CorePlugin)
  .theme(themes.dark)
  .build("Usecase with Actor (Dark Theme)", (element, relation, hint) => {
    const user = element.actor("User")
    const login = element.usecase("Login")
    const logout = element.usecase("Logout")
    
    relation.associate(user, login)
    relation.associate(user, logout)
    
    hint.horizontal(user, login)
    hint.vertical(login, logout)
  })
  .render("example/usecase_with_actor_dark.svg")
```

**Output:**

![Usecase with Actor (Dark Theme)](example/usecase_with_actor_dark.svg)

---

## Contributing

新しい例を追加したい場合は、`example/`ディレクトリに新しいTypeScriptファイルを作成し、同名のSVGファイルを生成してください。
