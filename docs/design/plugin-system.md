# Kiwumil プラグインシステム

## 目次

1. [概要](#概要)
2. [プラグインとは](#プラグインとは)
3. [DiagramPlugin インターフェース](#diagramplugin-インターフェース)
4. [プラグインの実装](#プラグインの実装)
5. [ID の命名規則](#id-の命名規則)
6. [新しいプラグインの作成](#新しいプラグインの作成)
7. [ベストプラクティス](#ベストプラクティス)
8. [テスト](#テスト)

---

## 概要

Kiwumil のプラグインシステムは、図の要素（Symbol）と関連（Relationship）を拡張可能な形で提供するための仕組みです。プラグインを使うことで、UML、シーケンス図、ER図など、様々な種類の図を型安全に作成できます。

### なぜプラグインが必要か

1. **拡張性**: 新しい図の種類を簡単に追加できる
2. **型安全性**: TypeScript の型推論により IntelliSense が効く
3. **名前空間**: プラグインごとに独立した名前空間を持つ（`el.uml.actor()`, `el.sequence.lifeline()` など）
4. **モジュール性**: 必要なプラグインだけを読み込める

---

## プラグインとは

プラグインは、以下の2つの機能を提供します：

1. **Symbol Factory**: 図の要素（Actor、Usecase、Lifeline など）を作成する関数群
2. **Relationship Factory**: 要素間の関連（Association、Include、Message など）を作成する関数群

> ℹ️ `TypeDiagram()` は常に `CorePlugin` を自動登録します。  
> そのため `el.core.circle()` などの基本図形は追加設定なしで利用でき、`core` という名前空間は予約済みと考えてください。

### プラグインの使用例

```typescript
import { TypeDiagram, UMLPlugin } from "kiwumil"

TypeDiagram("My UML Diagram")
  .use(UMLPlugin)
  .build((el, rel, hint) => {
    // el.uml が UMLPlugin によって提供される
    const user = el.uml.actor("User")
    const login = el.uml.usecase("Login")
    
    // rel.uml が UMLPlugin によって提供される
    rel.uml.associate(user, login)
  })
  .render("output.svg")
```

---

## DiagramPlugin インターフェース

すべてのプラグインは `DiagramPlugin` インターフェースを実装します。

### 型定義

```typescript
import type { LayoutContext } from "../layout/layout_context"
import type { Symbols } from "./symbols"
import type { Relationships } from "./relationships"

interface DiagramPlugin {
  /**
   * プラグインの名前空間名（例: "uml", "sequence", "erd"）
   */
  name: string

  /**
   * Symbol 用の DSL ファクトリを生成
   * @param symbols - 生成した Symbol を登録するインスタンス
   * @param layout - レイアウトコンテキスト（LayoutBound 生成用）
   * @returns Symbol 作成関数のオブジェクト（各関数は SymbolId を返す）
   */
  createSymbolFactory?(
    symbols: Symbols,
    layout: LayoutContext
  ): Record<string, (...args: any[]) => SymbolId>

  /**
   * Relationship 用の DSL ファクトリを生成
   * @param relationships - 生成した Relationship を登録するインスタンス
   * @param layout - レイアウトコンテキスト
   * @returns Relationship 作成関数のオブジェクト（各関数は RelationshipId を返す）
   */
  createRelationshipFactory?(
    relationships: Relationships,
    layout: LayoutContext
  ): Record<string, (...args: any[]) => RelationshipId>
}
```

### 重要な点

- **`name`**: プラグインの名前空間（`el.{name}.xxx()` でアクセス）
- **SymbolId / RelationshipId を返す**: `Symbols.register()` / `Relationships.register()` で登録し、ID を返す
- **`LayoutContext` の利用**: ファクトリは第2引数 `layout` を受け取り、`layout.variables.createBounds(id)` で LayoutBound を生成してシンボルに注入する
- **ファクトリはオプショナル**: Symbol のみ・Relationship のみを提供するプラグインも問題なく動作する
- **登録は Symbols/Relationships が担当**: `symbols.register(plugin, name, factory)` を呼び出すと、ID の生成と配列への追加が自動的に行われる
- **名前空間名はユニークにする**: `NamespaceBuilder` は `plugin.name` をキーに `el` / `rel` を構築するため、同じ名前のプラグインがあると後勝ちで上書きされる。`core` はビルトインなので避けること。
- **ファクトリ関数の引数に `any` を許容**: `DiagramPlugin` はプラグイン固有の DSL 引数すべてを統一的に受ける必要があり、ここで具象型を強制すると別プラグインの署名が破綻する。`satisfies DiagramPlugin` を使えば各プラグイン実装は個別の厳密なシグネチャ（例: `actor(label: string)`, `lifeline(config: LifelineOptions)`）を保てるため、インターフェース側は `any` で緩く受けて型安全性を失わない。

---

## プラグインの実装

### 基本構造

```typescript
import type { DiagramPlugin } from "kiwumil"
import type { SymbolBase, RelationshipBase, SymbolId, RelationshipId } from "kiwumil"
import type { LayoutContext } from "kiwumil"
import type { Symbols, Relationships } from "kiwumil"

export const MyPlugin: DiagramPlugin = {
  name: 'myplugin',
  
  createSymbolFactory(symbols: Symbols, layout: LayoutContext) {
    const plugin = this.name
    
    return {
      mySymbol(label: string): SymbolId {
        const symbol = symbols.register(plugin, "mySymbol", (symbolId) => {
          const bound = layout.variables.createBounds(symbolId)
          const instance = new MySymbol(symbolId, label, bound)
          return instance
        })
        return symbol.id
      }
    }
  },

  createRelationshipFactory(relationships: Relationships, layout: LayoutContext) {
    const plugin = this.name
    
    return {
      myRelation(from: SymbolId, to: SymbolId): RelationshipId {
        const relationship = relationships.register(plugin, "myRelation", (id) => {
          return new MyRelation(id, from, to)
        })
        return relationship.id
      }
    }
  }
}
```

### 実例: UMLPlugin

```typescript
import { ActorSymbol } from "./symbols/actor_symbol"
import { UsecaseSymbol } from "./symbols/usecase_symbol"
import { SystemBoundarySymbol } from "./symbols/system_boundary_symbol"
import { Association } from "./relationships/association"
import { Include } from "./relationships/include"
import { Extend } from "./relationships/extend"
import { Generalize } from "./relationships/generalize"
import type { DiagramPlugin } from "../../dsl/diagram_plugin"
import type { SymbolId, RelationshipId, ContainerSymbolId } from "../../model/types"
import { toContainerSymbolId } from "../../model/container_symbol_base"
import type { LayoutContext } from "../../layout/layout_context"
import { Symbols } from "../../dsl/symbols"
import { Relationships } from "../../dsl/relationships"

export const UMLPlugin = {
  name: 'uml',
  
  createSymbolFactory(symbols: Symbols, layout: LayoutContext) {
    const plugin = this.name
    
    return {
      actor(label: string): SymbolId {
        const symbol = symbols.register(plugin, "actor", (symbolId) => {
          const bound = layout.variables.createBounds(symbolId)
          const actor = new ActorSymbol(symbolId, label, bound)
          return actor
        })
        return symbol.id
      },
      
      usecase(label: string): SymbolId {
        const symbol = symbols.register(plugin, "usecase", (symbolId) => {
          const bound = layout.variables.createBounds(symbolId)
          const usecase = new UsecaseSymbol(symbolId, label, bound)
          return usecase
        })
        return symbol.id
      },
      
      systemBoundary(label: string): ContainerSymbolId {
        const symbol = symbols.register(plugin, "systemBoundary", (symbolId) => {
          const id = toContainerSymbolId(symbolId)
          const bound = layout.variables.createBounds(id)
          return new SystemBoundarySymbol(id, label, bound, layout)
        })
        return symbol.id as ContainerSymbolId
      }
    }
  },
  
  createRelationshipFactory(
    relationships: Relationships,
    _layout: LayoutContext
  ) {
    const plugin = this.name
    
    return {
      associate(from: SymbolId, to: SymbolId): RelationshipId {
        const relationship = relationships.register(plugin, "association", (id) => new Association(id, from, to))
        return relationship.id
      },
      
      include(from: SymbolId, to: SymbolId): RelationshipId {
        const relationship = relationships.register(plugin, "include", (id) => new Include(id, from, to))
        return relationship.id
      },
      
      extend(from: SymbolId, to: SymbolId): RelationshipId {
        const relationship = relationships.register(plugin, "extend", (id) => new Extend(id, from, to))
        return relationship.id
      },
      
      generalize(from: SymbolId, to: SymbolId): RelationshipId {
        const relationship = relationships.register(plugin, "generalize", (id) => new Generalize(id, from, to))
        return relationship.id
      }
    }
  }
} as const satisfies DiagramPlugin
```

---

## ID の命名規則

プラグインで生成する ID は以下の形式に従います：

```
${namespace}:${symbolName|relationshipName}/${index}
```

### 例

**Symbol ID:**
- `uml:actor/0`
- `uml:usecase/1`
- `sequence:lifeline/0`
- `erd:entity/2`

**Relationship ID:**
- `uml:association/0`
- `uml:include/1`
- `sequence:message/0`
- `erd:relation/3`

### メリット

1. **デバッグしやすい**: ログやエラーメッセージでどのプラグインの要素か一目でわかる
2. **衝突しない**: 名前空間により、プラグイン間で ID が衝突しない
3. **可読性**: 要素の種類が ID から推測できる
4. **生成順序の追跡**: インデックスにより、要素の生成順序が明確

### ID 生成の自動化

`Symbols` / `Relationships` クラスが ID 生成を自動的に行うため、手動での ID 生成は不要です：

```typescript
// Symbols.register() 内で自動生成される
private createSymbolId(plugin: string, symbolName: string): SymbolId {
  const idIndex = this.symbols.length
  return `${plugin}:${symbolName}/${idIndex}` as SymbolId
}
```

プラグイン開発者は、`symbols.register(plugin, symbolName, factory)` を呼び出すだけで、適切な ID が自動的に割り当てられます。

---

## 新しいプラグインの作成

### ステップバイステップガイド

#### Step 1: プラグインディレクトリの作成

```bash
src/plugin/
├── mydiagram/
│   ├── plugin.ts
│   ├── symbols/
│   │   ├── my_symbol.ts
│   │   └── another_symbol.ts
│   └── relationships/
│       └── my_relation.ts
```

#### Step 2: Symbol クラスの作成

```typescript
// src/plugin/mydiagram/symbols/my_symbol.ts
import { SymbolBase } from "../../../model/symbol_base"
import type { SymbolId } from "../../../model/types"
import type { Theme } from "../../../theme/theme"
import type { LayoutBound } from "../../../layout/layout_bound"
import type { Point } from "../../../model/types"

export class MySymbol extends SymbolBase {
  constructor(id: SymbolId, label: string, layoutBounds: LayoutBound) {
    super(id, label, layoutBounds)
  }

  toSVG(): string {
    const bounds = this.getLayoutBounds()
    const x = bounds.x.value()
    const y = bounds.y.value()
    const width = bounds.width.value()
    const height = bounds.height.value()
    
    // SVG 描画ロジック
    return `<rect x="${x}" y="${y}" 
                  width="${width}" height="${height}" />`
  }

  getConnectionPoint(from: Point): Point {
    const bounds = this.getLayoutBounds()
    const x = bounds.x.value()
    const y = bounds.y.value()
    const width = bounds.width.value()
    const height = bounds.height.value()
    
    // 接続点の計算ロジック
    return { x: x + width / 2, y: y + height / 2 }
  }
}
```

#### Step 3: Relationship クラスの作成

```typescript
// src/plugin/mydiagram/relationships/my_relation.ts
import { RelationshipBase } from "../../../model/relationship_base"
import type { SymbolId, RelationshipId } from "../../../model/types"
import type { SymbolBase } from "../../../model/symbol_base"

export class MyRelation extends RelationshipBase {
  constructor(id: RelationshipId, from: SymbolId, to: SymbolId) {
    super(id, from, to)
  }

  toSVG(symbols: Map<SymbolId, SymbolBase>): string {
    const fromSymbol = symbols.get(this.from)
    const toSymbol = symbols.get(this.to)
    
    if (!fromSymbol || !toSymbol) return ""
    
    const fromBounds = fromSymbol.getLayoutBounds()
    const toBounds = toSymbol.getLayoutBounds()
    
    const fromX = fromBounds.x.value()
    const fromY = fromBounds.y.value()
    const toX = toBounds.x.value()
    const toY = toBounds.y.value()
    
    // SVG 描画ロジック（線を描く）
    return `<line x1="${fromX}" y1="${fromY}"
                  x2="${toX}" y2="${toY}" />`
  }

  calculateZIndex(symbols: Map<SymbolId, SymbolBase>): number {
    // Z-index 計算ロジック
    return 0
  }
}
```

#### Step 4: プラグインの実装

```typescript
// src/plugin/mydiagram/plugin.ts
import { MySymbol } from "./symbols/my_symbol"
import { MyRelation } from "./relationships/my_relation"
import type { DiagramPlugin } from "../../dsl/diagram_plugin"
import type { SymbolId, RelationshipId } from "../../model/types"
import type { LayoutContext } from "../../layout/layout_context"
import type { Symbols } from "../../dsl/symbols"
import type { Relationships } from "../../dsl/relationships"

export const MyDiagramPlugin: DiagramPlugin = {
  name: 'mydiagram',
  
  createSymbolFactory(symbols: Symbols, layout: LayoutContext) {
    const plugin = this.name
    
    return {
      mySymbol(label: string): SymbolId {
        const symbol = symbols.register(plugin, 'mySymbol', (symbolId) => {
          const bound = layout.variables.createBounds(symbolId)
          return new MySymbol(symbolId, label, bound)
        })
        return symbol.id
      }
    }
  },
  
  createRelationshipFactory(relationships: Relationships, _layout: LayoutContext) {
    const plugin = this.name
    
    return {
      myRelation(from: SymbolId, to: SymbolId): RelationshipId {
        const relationship = relationships.register(plugin, 'myRelation', (id) => {
          return new MyRelation(id, from, to)
        })
        return relationship.id
      }
    }
  }
}
```

#### Step 5: エクスポート

```typescript
// src/index.ts
export { MyDiagramPlugin } from "./plugin/mydiagram/plugin"
```

#### Step 6: 使用

```typescript
import { TypeDiagram, MyDiagramPlugin } from "kiwumil"

TypeDiagram("My Diagram")
  .use(MyDiagramPlugin)
  .build((el, rel, hint) => {
    const a = el.mydiagram.mySymbol("A")
    const b = el.mydiagram.mySymbol("B")
    rel.mydiagram.myRelation(a, b)
  })
  .render("output.svg")
```

---

## ベストプラクティス

### 1. 型安全性を確保する

**❌ 避けるべき:**
```typescript
createSymbolFactory(symbols: any, layout: any) {
  return {
    mySymbol: (label: any) => {
      // any の使用は避ける
    }
  }
}
```

**✅ 推奨:**
```typescript
createSymbolFactory(symbols: Symbols, layout: LayoutContext) {
  return {
    mySymbol(label: string): SymbolId {
      // 明示的な型定義
    }
  }
}
```

### 2. Symbols/Relationships の register メソッドを使う

**❌ 避けるべき:**
```typescript
mySymbol(label: string): SymbolId {
  const id = `myplugin:mySymbol/${counter++}` as SymbolId
  const symbol = new MySymbol(id, label, bound)
  symbols.push(symbol)  // 直接 push しない
  return id
}
```

**✅ 推奨:**
```typescript
mySymbol(label: string): SymbolId {
  const symbol = symbols.register(plugin, 'mySymbol', (symbolId) => {
    const bound = layout.variables.createBounds(symbolId)
    return new MySymbol(symbolId, label, bound)
  })
  return symbol.id
}
```

### 3. LayoutBound をコンストラクタで注入する

**❌ 避けるべき:**
```typescript
// Symbol 内部で LayoutContext に直接依存
class MySymbol extends SymbolBase {
  constructor(id: SymbolId, label: string, layout: LayoutContext) {
    super(id, label)
    this.layoutBounds = layout.variables.createBounds(id)
  }
}
```

**✅ 推奨:**
```typescript
// LayoutBound をコンストラクタで注入
class MySymbol extends SymbolBase {
  constructor(id: SymbolId, label: string, layoutBounds: LayoutBound) {
    super(id, label, layoutBounds)
  }
}

// プラグイン側で LayoutBound を生成
mySymbol(label: string): SymbolId {
  const symbol = symbols.register(plugin, 'mySymbol', (symbolId) => {
    const bound = layout.variables.createBounds(symbolId)
    return new MySymbol(symbolId, label, bound)
  })
  return symbol.id
}
```

### 4. ファイル構成を整理する

```
src/plugin/myplugin/
├── plugin.ts              # プラグインのエントリポイント
├── symbols/               # Symbol クラス群
│   ├── symbol_a.ts
│   └── symbol_b.ts
├── relationships/         # Relationship クラス群
│   └── relation_a.ts
└── README.md             # プラグインのドキュメント（オプション）
```

### 5. 名前空間の衝突を避ける

`DiagramPlugin.name` は `NamespaceBuilder` によってそのまま `el.{name}` / `rel.{name}` のキーとして使用されるため、同じ名前を持つプラグインを複数読み込むと後から登録したものが前者を上書きします。`core` は `TypeDiagram()` が自動で登録するビルトイン名前空間なので、ユーザーのプラグインでは必ず一意な名前を選びましょう。

## TypeScript の活用

TypeScript の型レベル機能を活用すると、プラグインの実装から DSL の補完まで滑らかに繋げられます。

### Const Type Parameters

`name` フィールドを literal type として保持することで、`el.{name}` の補完が正しく動作します：

```typescript
const MyPlugin = {
  name: 'uml' as const,
  createSymbolFactory(userSymbols: SymbolBase[], layout: LayoutVariableContext) {
    // ...
  }
} satisfies DiagramPlugin
```

### Satisfies Operator

`satisfies` を使うと型チェックを厳密にしつつ、オブジェクトリテラルの推論を保てます：

```typescript
export const UMLPlugin = {
  name: 'uml',
  createSymbolFactory(userSymbols: SymbolBase[], layout: LayoutVariableContext) {
    // ...
  },
  createRelationshipFactory(relationships: RelationshipBase[], layout: LayoutVariableContext) {
    // ...
  }
} satisfies DiagramPlugin
```

### Mapped Types

登録済みプラグインから `el` / `rel` の型を自動生成する際にも mapped type が使われています。自作プラグインが正確な型情報を持つよう、`name` やファクトリの戻り値を literal にしておくと DSL 側で次のような型が推論されます：

```typescript
type BuildElementNamespace<TPlugins extends readonly DiagramPlugin[]> = {
  [K in TPlugins[number]['name']]: ReturnType<
    Extract<TPlugins[number], { name: K }>['createSymbolFactory']
  >
}
```

---

## テスト

### プラグインのテスト例

```typescript
import { describe, test, expect } from "bun:test"
import { TypeDiagram } from "../src/dsl/diagram_builder"
import { MyDiagramPlugin } from "../src/plugin/mydiagram/plugin"

describe("MyDiagramPlugin", () => {
  test("should create symbols with correct IDs", () => {
    let symbolCount = 0
    TypeDiagram("Test")
      .use(MyDiagramPlugin)
      .build((el, rel, hint) => {
        const a = el.mydiagram.mySymbol("A")
        const b = el.mydiagram.mySymbol("B")
        
        expect(a).toBe("mydiagram:mySymbol/0")
        expect(b).toBe("mydiagram:mySymbol/1")
        symbolCount = 2
      })
    
    expect(symbolCount).toBe(2)
  })
  
  test("should create relationships with correct IDs", () => {
    TypeDiagram("Test")
      .use(MyDiagramPlugin)
      .build((el, rel, hint) => {
        const a = el.mydiagram.mySymbol("A")
        const b = el.mydiagram.mySymbol("B")
        const relId = rel.mydiagram.myRelation(a, b)
        
        expect(relId).toBe("mydiagram:myRelation/0")
      })
  })
  
  test("should work with multiple plugins", () => {
    TypeDiagram("Test")
      .use(MyDiagramPlugin, UMLPlugin)
      .build((el, rel, hint) => {
        const mySymbol = el.mydiagram.mySymbol("A")
        const actor = el.uml.actor("User")
        
        // 両方のプラグインが正しく動作
        expect(mySymbol).toMatch(/^mydiagram:/)
        expect(actor).toMatch(/^uml:/)
      })
  })
})
```

### 型テスト（tsd）

DSL の型安全性は `tsd` による型テストで自動検証しています。`bun run test:types`（`package.json` の `test:types` スクリプト）を実行すると `tsd/namespace-dsl.test-d.ts` が走り、以下を含む挙動が静的に保証されます：

- `TypeDiagram().build()` の `el` / `rel` から未登録プラグインの名前空間へアクセスしようとすると `@ts-expect-error` で失敗すること
- `.use(UMLPlugin)` などで登録済みのプラグインのみが補完され、Symbol/Relationship の戻り値が `SymbolId` / `RelationshipId` になること
- 複数プラグインを組み合わせた際に、それぞれの factory が正しいシグネチャで推論されること

手動で IntelliSense を確認しなくても、型回りの破壊的変更は CI で検知できる。

### テストのポイント

1. **ID の形式を検証**: `namespace:symbolName/index` の形式になっているか
2. **型推論**: `tsd/namespace-dsl.test-d.ts` で DSL の型が崩れていないかを継続的に確認する
3. **複数プラグインの共存**: 他のプラグインと競合しないか
4. **LayoutBound の注入**: コンストラクタで正しく LayoutBound が渡されているか

---

## まとめ

Kiwumil のプラグインシステムを使うことで、型安全で拡張可能な図の作成が可能になります。

### プラグイン作成の基本

1. `DiagramPlugin` インターフェースを実装
2. `createSymbolFactory` と `createRelationshipFactory` を定義
3. ID は `namespace:name-serial` 形式で生成
4. 生成した要素は配列に登録
5. SymbolId / RelationshipId を返す

### 参考資料

- [TypeDiagram API](./typed-diagram.md)
- [Namespace-based DSL 設計](./namespace-dsl.md)
- [Layout System](./layout-system.md)
- [Theme System](./theme-system.md)

---

**Happy Plugin Development! 🎉**
