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

## Contributing

新しい例を追加したい場合は、`example/`ディレクトリに新しいTypeScriptファイルを作成し、同名のSVGファイルを生成してください。
