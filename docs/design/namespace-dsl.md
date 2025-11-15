# Namespace-Based DSL Architecture

## 概要

kiwumil は、プラグインごとの名前空間を持つ型安全な DSL によって図の作成を行います。各プラグインは独自の Symbol と Relationship を提供し、IntelliSense によって補完される直感的な API を実現しています。

### 基本的な記述例

```typescript
import { TypedDiagram, UMLPlugin } from 'kiwumil'

TypedDiagram("Use Case Diagram")
  .use(UMLPlugin)
  .build((el, rel, hint) => {
    const user = el.uml.actor("User")
    const login = el.uml.usecase("Login")
    const register = el.uml.usecase("Register")
    
    rel.uml.associate(user, login)
    rel.uml.associate(user, register)
    
    hint.arrangeHorizontal(login, register)
  })
  .render("output.svg")
```

## アーキテクチャの特徴

### 名前空間による型推論

各プラグインは専用の名前空間を持ち、その名前空間内で Symbol と Relationship の作成関数を提供します：

```typescript
// Symbol の作成
el.uml.actor()          // UML Plugin
el.uml.usecase()        // UML Plugin
el.core.rectangle()     // Core Plugin
el.sequence.lifeline()  // Sequence Plugin (将来)
el.erd.entity()         // ERD Plugin (将来)

// Relationship の作成
rel.uml.associate()     // UML Plugin
rel.uml.include()       // UML Plugin
rel.core.arrow()        // Core Plugin
rel.sequence.message()  // Sequence Plugin (将来)
rel.erd.relation()      // ERD Plugin (将来)
```

### 完全な型安全性

TypeScript の型システムを最大限活用し、以下を実現しています：

- **登録済みプラグインのみアクセス可能**: `el.` と入力すると、登録されているプラグインの名前空間のみが補完候補に表示
- **メソッドの補完**: `el.uml.` と入力すると、UML プラグインが提供する全メソッドが表示
- **型エラーの早期検出**: 存在しないメソッドや間違った引数型はコンパイル時にエラーとして検出
- **SymbolId / RelationshipId による型安全性**: Symbol と Relationship は一意な ID で識別され、型レベルで区別される

## コア型定義

### SymbolId と RelationshipId

Symbol と Relationship はそれぞれ一意な ID で識別されます：

```typescript
/**
 * Symbol の一意識別子
 * 形式: `${namespace}:${symbolName}-${serial}`
 * 例: "uml:actor-0", "uml:usecase-1", "core:rectangle-0"
 */
type SymbolId = string & { readonly __brand: 'SymbolId' }

/**
 * Relationship の一意識別子
 * 形式: `${namespace}:${relationshipName}-${serial}`
 * 例: "uml:association-0", "uml:include-1", "core:arrow-0"
 */
type RelationshipId = string & { readonly __brand: 'RelationshipId' }
```

**ID の命名規則の利点**:
- デバッグ時にどのプラグインで生成されたかが一目でわかる
- Symbol/Relationship の種類が明確
- プラグイン間で ID が衝突しない
- ログやエラーメッセージでの可読性が向上

### SymbolBase と RelationshipBase

すべての Symbol と Relationship は基底クラスを継承します：

```typescript
/**
 * Symbol の基底クラス
 */
abstract class SymbolBase {
  readonly id: SymbolId
  readonly label: string
  bounds?: Bounds
  protected theme?: Theme
  nestLevel: number = 0
  containerId?: SymbolId

  constructor(id: SymbolId, label: string)
  
  setTheme(theme: Theme): void
  abstract getDefaultSize(): { width: number; height: number }
  abstract toSVG(): string
  abstract getConnectionPoint(from: Point): Point
}

/**
 * Relationship の基底クラス
 */
abstract class RelationshipBase {
  readonly id: RelationshipId
  protected theme?: Theme

  constructor(
    id: RelationshipId,
    public from: SymbolId,
    public to: SymbolId
  )
  
  setTheme(theme: Theme): void
  calculateZIndex(symbols: Map<SymbolId, SymbolBase>): number
  abstract toSVG(symbols: Map<SymbolId, SymbolBase>): string
}
```

## プラグインインターフェース

### DiagramPlugin

プラグインは以下のインターフェースを実装します：

```typescript
export interface DiagramPlugin {
  /**
   * プラグインの名前空間名（例: "uml", "sequence", "erd"）
   */
  readonly name: string

  /**
   * Symbol 用の DSL ファクトリを生成
   * 
   * @param userSymbols - 生成した Symbol を登録する配列
   * @returns Symbol 作成関数のオブジェクト（各関数は SymbolId を返す）
   */
  createSymbolFactory(
    userSymbols: SymbolBase[]
  ): Record<string, (...args: any[]) => SymbolId>

  /**
   * Relationship 用の DSL ファクトリを生成
   * 
   * @param relationships - 生成した Relationship を登録する配列
   * @returns Relationship 作成関数のオブジェクト（各関数は RelationshipId を返す）
   */
  createRelationshipFactory(
    relationships: RelationshipBase[]
  ): Record<string, (...args: any[]) => RelationshipId>
}
```

**プラグインの実装方法の詳細については、[Plugin System ドキュメント](./plugin-system.md) を参照してください。**

### プラグインの実装例

```typescript
import { createIdGenerator } from "../../dsl/id_generator"
import type { DiagramPlugin } from "../../dsl/diagram_plugin"
import type { SymbolBase } from "../../model/symbol_base"
import type { RelationshipBase } from "../../model/relationship_base"
import type { SymbolId, RelationshipId } from "../../model/types"

export const UMLPlugin: DiagramPlugin = {
  name: 'uml',
  
  createSymbolFactory(userSymbols: SymbolBase[]) {
    const idGen = createIdGenerator(this.name)
    
    return {
      actor(label: string): SymbolId {
        const id = idGen.generateSymbolId('actor')
        const symbol = new ActorSymbol(id, label)
        userSymbols.push(symbol)  // 配列に登録
        return id  // SymbolId を返す (例: "uml:actor-0")
      },
      
      usecase(label: string): SymbolId {
        const id = idGen.generateSymbolId('usecase')
        const symbol = new UsecaseSymbol(id, label)
        userSymbols.push(symbol)
        return id  // 例: "uml:usecase-1"
      }
    }
  },
  
  createRelationshipFactory(relationships: RelationshipBase[]) {
    const idGen = createIdGenerator(this.name)
    
    return {
      associate(from: SymbolId, to: SymbolId): RelationshipId {
        const id = idGen.generateRelationshipId('association')
        const rel = new Association(id, from, to)
        relationships.push(rel)  // 配列に登録
        return id  // RelationshipId を返す (例: "uml:association-0")
      },
      
      include(from: SymbolId, to: SymbolId): RelationshipId {
        const id = idGen.generateRelationshipId('include')
        const rel = new Include(id, from, to)
        relationships.push(rel)
        return id  // 例: "uml:include-1"
      }
    }
  }
}
```

### ID ジェネレータ

プラグイン実装を簡潔にするため、ID 生成ヘルパー関数を提供しています：

```typescript
export function createIdGenerator(namespace: string) {
  let symbolCounter = 0
  let relationshipCounter = 0
  
  return {
    generateSymbolId(symbolName: string): SymbolId {
      return `${namespace}:${symbolName}-${symbolCounter++}` as SymbolId
    },
    
    generateRelationshipId(relationshipName: string): RelationshipId {
      return `${namespace}:${relationshipName}-${relationshipCounter++}` as RelationshipId
    }
  }
}
```

**カウンター管理の特徴**:
- 各プラグインの `createSymbolFactory` / `createRelationshipFactory` 内でカウンターを管理
- Symbol と Relationship でそれぞれ独立したカウンター（0 から開始）
- プラグインごとに独立したカウンター
- 名前空間プレフィックスにより ID の衝突が完全に防止される

## 名前空間システムの実装

### 名前空間オブジェクトの構築

`el` と `rel` は、登録されたプラグインから動的に構築される「複合名前空間オブジェクト」です：

```typescript
/**
 * Namespace Builder
 * 
 * プラグイン配列から el と rel を構築する
 */
class NamespaceBuilder<TPlugins extends readonly DiagramPlugin[]> {
  private plugins: TPlugins

  constructor(plugins: TPlugins) {
    this.plugins = plugins
  }

  buildElementNamespace(
    userSymbols: SymbolBase[]
  ): BuildElementNamespace<TPlugins> {
    const namespace = {} as any
    for (const plugin of this.plugins) {
      namespace[plugin.name] = plugin.createSymbolFactory(userSymbols)
    }
    return namespace
  }

  buildRelationshipNamespace(
    relationships: RelationshipBase[]
  ): BuildRelationshipNamespace<TPlugins> {
    const namespace = {} as any
    for (const plugin of this.plugins) {
      namespace[plugin.name] = plugin.createRelationshipFactory(relationships)
    }
    return namespace
  }
}
```

### 型ユーティリティ

プラグイン配列から名前空間の型を自動生成します：

```typescript
/**
 * プラグイン配列から ElementNamespace 型を生成
 */
type BuildElementNamespace<TPlugins extends readonly DiagramPlugin[]> = {
  [K in TPlugins[number]['name']]: ReturnType<
    Extract<TPlugins[number], { name: K }>['createSymbolFactory']
  >
}

/**
 * プラグイン配列から RelationshipNamespace 型を生成
 */
type BuildRelationshipNamespace<TPlugins extends readonly DiagramPlugin[]> = {
  [K in TPlugins[number]['name']]: ReturnType<
    Extract<TPlugins[number], { name: K }>['createRelationshipFactory']
  >
}
```

**結果の型の例**:
```typescript
// UMLPlugin と CorePlugin を登録した場合
type ElementNamespace = {
  uml: {
    actor: (label: string) => SymbolId
    usecase: (label: string) => SymbolId
    systemBoundary: (label: string) => SymbolId
  }
  core: {
    rectangle: (label: string) => SymbolId
    ellipse: (label: string) => SymbolId
    text: (label: string) => SymbolId
  }
}

type RelationshipNamespace = {
  uml: {
    associate: (from: SymbolId, to: SymbolId) => RelationshipId
    include: (from: SymbolId, to: SymbolId) => RelationshipId
    extend: (from: SymbolId, to: SymbolId) => RelationshipId
    generalize: (from: SymbolId, to: SymbolId) => RelationshipId
  }
  core: {
    arrow: (from: SymbolId, to: SymbolId) => RelationshipId
  }
}
```

## TypedDiagram API

### エントリポイント

`TypedDiagram` は図の作成を開始するエントリポイントです。流暢なインターフェース (Fluent Interface) により、チェーン可能な API を提供します：

```typescript
function TypedDiagram(
  titleOrInfo: string | DiagramInfo
): DiagramBuilder<[CorePlugin]>

// DiagramBuilder のメソッド
class DiagramBuilder<TPlugins> {
  use<TNewPlugins>(...plugins: TNewPlugins): DiagramBuilder<[...TPlugins, ...TNewPlugins]>
  theme(theme: Theme): this
  build(callback: IntelliSenseBlock<TPlugins>): Diagram
}
```

**特徴**:
- CorePlugin がデフォルトで適用されるため、基本図形（circle, rectangle, ellipse 等）がすぐに利用可能
- `.use()` メソッドでプラグインを追加（複数回呼び出し可能）
- `.theme()` メソッドでテーマを設定
- `.build()` メソッドで図の定義を実行し、Diagram オブジェクトを返す
- 返された Diagram オブジェクトの `.render()` メソッドで SVG ファイルを出力

**使用例**:
```typescript
import { TypedDiagram, UMLPlugin } from 'kiwumil'

TypedDiagram("My Diagram")
  .use(UMLPlugin)
  .build((el, rel, hint) => {
    // CorePlugin（デフォルト）
    const box = el.core.rectangle("Box")
    
    // UMLPlugin
    const actor = el.uml.actor("User")
    rel.core.arrow(actor, box)
  })
  .render("output.svg")
```

### 内部処理フロー

`TypedDiagram` および `DiagramBuilder.build()` 内部では以下の処理が行われます：

1. **初期化**
   - `TypedDiagram()` 呼び出しで DiagramBuilder インスタンスを作成
   - CorePlugin がデフォルトで登録される

2. **プラグイン登録**
   - `.use()` メソッドで追加のプラグインを登録
   - プラグインは配列として蓄積される

3. **テーマ設定（オプション）**
   - `.theme()` メソッドでカスタムテーマを設定

4. **ビルド開始 (.build())**
   - Symbol、Relationship、Hint を格納する配列を作成
   - DiagramSymbol（図全体を表す特別な Symbol）を作成

5. **名前空間の構築**
   - `NamespaceBuilder` を使って `el` と `rel` を構築
   - プラグインごとのファクトリが配列への参照を保持

6. **ユーザーコールバックの実行**
   - ユーザーが提供したコールバック関数を実行
   - `el.uml.actor()` などが呼ばれ、Symbol/Relationship が配列に追加される

7. **テーマの適用**
   - すべての Symbol と Relationship にテーマを適用

8. **レイアウト計算**
   - LayoutSolver が制約を解決して各 Symbol の位置とサイズを決定

9. **Diagram オブジェクトの返却**
   - レンダリング可能な Diagram オブジェクトを返す
   - `.render()` メソッドで SVG ファイルを出力

## 拡張性

### 新しいプラグインの追加

新しいプラグインを作成する方法については、[Plugin System ドキュメント](./plugin-system.md) を参照してください。

プラグインは以下のステップで追加できます：

1. `DiagramPlugin` インターフェースを実装
2. Symbol と Relationship のクラスを定義
3. `createSymbolFactory` と `createRelationshipFactory` を実装
4. `TypedDiagram().use()` で登録

```typescript
// 新しいプラグインの例
import { TypedDiagram, UMLPlugin } from 'kiwumil'
import { MyCustomPlugin } from './my-plugin'

TypedDiagram("Diagram")
  .use(UMLPlugin, MyCustomPlugin)
  .build((el, rel, hint) => {
    el.uml.actor("User")
    el.mycustom.customSymbol("My Symbol")  // カスタムプラグインの Symbol
  })
  .render("output.svg")
```

### プラグイン間の独立性

各プラグインは独立しており、以下の特性があります：

- **名前空間の分離**: プラグインごとに独立した名前空間
- **ID の衝突回避**: 名前空間プレフィックスにより ID が重複しない
- **カウンターの独立**: 各プラグインが独自のカウンターを管理

## TypeScript の高度な機能の活用

### Const Type Parameters

プラグイン名を literal type として保持：

```typescript
const plugin = {
  name: 'uml' as const,
  createSymbolFactory: (symbols) => ({...}),
  createRelationshipFactory: (relationships) => ({...})
} satisfies DiagramPlugin
```

### Satisfies Operator

型安全性を保ちつつ型推論を維持：

```typescript
export const UMLPlugin = {
  name: 'uml',
  createSymbolFactory(userSymbols) { /* ... */ },
  createRelationshipFactory(relationships) { /* ... */ }
} satisfies DiagramPlugin
```

### Mapped Types

プラグイン一覧から名前空間型を生成：

```typescript
type BuildElementNamespace<TPlugins extends readonly DiagramPlugin[]> = {
  [K in TPlugins[number]['name']]: ReturnType<
    Extract<TPlugins[number], { name: K }>['createSymbolFactory']
  >
}
```

## まとめ

Namespace-Based DSL Architecture により、以下が実現されています：

- ✅ **強力な型推論**: IntelliSense による完全な補完サポート
- ✅ **プラグインベース**: 拡張可能なアーキテクチャ
- ✅ **型安全性**: `SymbolId` / `RelationshipId` による型レベルの識別
- ✅ **可読性**: デバッグしやすい ID 命名規則
- ✅ **保守性**: 名前空間による責務の明確化
- ✅ **拡張性**: 新しいプラグインの追加が容易
- ✅ **直感的な API**: `el.namespace.method()` という自然な記述
