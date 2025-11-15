# Namespace-Based DSL 設計仕様書

## 1. 概要

### 1.1 目的
既存の Diagram DSL を再設計し、`ElementFactory` と `RelationshipFactory` を廃止して、プラグインごとの名前空間を導入した新しい DSL を構築する。

### 1.2 設計目標
- プラグインベースの名前空間による強力な型推論
- IntelliSense の最大活用
- 拡張性の高いアーキテクチャ
- 既存 API との互換性維持（`build((el, rel, hint) => {...})` スタイル）

### 1.3 理想的な記述例
```typescript
build((el, rel, hint) => {
  const user = el.uml.actor("User")
  const login = el.uml.usecase("login")
  const user_will_login = rel.uml.associate(user, login)
})
```

## 2. アーキテクチャ設計

### 2.1 Factory API の廃止

#### 現在の問題点
- `ElementFactory` と `RelationshipFactory` が Proxy ベースの動的メソッド生成に依存
- 型安全性が不十分（`any` の多用）
- プラグインごとの名前空間が存在しない
- IntelliSense が効きづらい

#### 新しいアプローチ
プラグインが以下の 2 種類のファクトリ生成関数を提供する：
- `createSymbolFactory(userSymbols: SymbolBase[])`: Symbol 用 DSL を提供
- `createRelationshipFactory(relationships: RelationshipBase[])`: Relationship 用 DSL を提供

**重要**: ファクトリは `SymbolId` / `RelationshipId` を返し、生成された `SymbolBase` / `RelationshipBase` インスタンスの管理（配列への登録）も担当する。

```typescript
// Symbol Factory の例
createSymbolFactory(userSymbols: SymbolBase[]) {
  const namespace = 'uml'  // プラグインの名前空間
  let counter = 0
  return {
    actor: (label: string): SymbolId => {
      const id = `${namespace}:actor-${counter++}` as SymbolId
      const symbol = new ActorSymbol(id, label)
      userSymbols.push(symbol)  // 配列に登録
      return id  // SymbolId を返す (例: "uml:actor-0")
    },
    usecase: (label: string): SymbolId => {
      const id = `${namespace}:usecase-${counter++}` as SymbolId
      const symbol = new UsecaseSymbol(id, label)
      userSymbols.push(symbol)
      return id  // 例: "uml:usecase-0"
    }
  }
}

// Relationship Factory の例
createRelationshipFactory(relationships: RelationshipBase[]) {
  const namespace = 'uml'  // プラグインの名前空間
  let counter = 0
  return {
    associate: (from: SymbolId, to: SymbolId): RelationshipId => {
      const id = `${namespace}:association-${counter++}` as RelationshipId
      const rel = new Association(id, from, to)
      relationships.push(rel)  // 配列に登録
      return id  // RelationshipId を返す (例: "uml:association-0")
    },
    include: (from: SymbolId, to: SymbolId): RelationshipId => {
      const id = `${namespace}:include-${counter++}` as RelationshipId
      const rel = new Include(id, from, to)
      relationships.push(rel)
      return id  // 例: "uml:include-0"
    }
  }
}
```

### 2.2 名前空間の導入

#### 名前空間構造
各プラグインは専用の名前空間を持つ：
```typescript
el.uml.actor()          // UML Plugin - returns SymbolId
el.uml.usecase()        // UML Plugin - returns SymbolId
el.sequence.lifeline()  // Sequence Plugin - returns SymbolId
el.erd.entity()         // ERD Plugin - returns SymbolId

rel.uml.associate()     // UML Plugin - returns RelationshipId
rel.sequence.message()  // Sequence Plugin - returns RelationshipId
rel.erd.relation()      // ERD Plugin - returns RelationshipId
```

#### 複合名前空間オブジェクト
`el` と `rel` はすべてのプラグインを統合した「複合 namespace オブジェクト」として機能：
```typescript
// 型定義の例
type ElementNamespace = {
  uml: UMLSymbolFactory
  sequence: SequenceSymbolFactory
  erd: ERDSymbolFactory
  // プラグイン登録時に動的に拡張
}

type RelationshipNamespace = {
  uml: UMLRelationshipFactory
  sequence: SequenceRelationshipFactory
  erd: ERDRelationshipFactory
  // プラグイン登録時に動的に拡張
}
```

### 2.3 型推論・IntelliSense の厳密化

#### 型推論の仕組み
1. **プラグイン登録時の型合成**
   - Mapped Types と Generics を使用
   - プラグイン追加時に型が自動的に拡張される

2. **`as const` による型固定**
   ```typescript
   const plugin = {
     name: 'uml' as const,
     createSymbolFactory: (symbols) => ({...}),
     createRelationshipFactory: (relationships) => ({...})
   } satisfies DiagramPlugin
   ```

3. **ジェネリクスによる型拡張**
   ```typescript
   class DiagramBuilder<TPlugins extends readonly DiagramPlugin[]> {
     // TPlugins から ElementNamespace と RelationshipNamespace を自動生成
   }
   ```

#### IntelliSense の動作
- `el.` を入力すると、登録済みプラグイン名（`uml`, `sequence` など）が補完候補に表示
- `el.uml.` を入力すると、UML プラグインが提供する全メソッド（`actor`, `usecase` など）が補完候補に表示
- 型エラーがリアルタイムで検出される

## 3. API 仕様

### 3.1 DiagramBuilder API

#### 現行 API の維持
```typescript
const diagram = new DiagramBuilder("My Diagram")
  .use(UMLPlugin, SequencePlugin)
  .theme(MyCustomTheme)
  .build((el, rel, hint) => {
    // DSL による図の構築
  })
```

#### 内部実装の刷新
- `ElementFactory` → 名前空間ベースの `SymbolNamespaceBuilder`
- `RelationshipFactory` → 名前空間ベースの `RelationshipNamespaceBuilder`
- Proxy の削除、完全な型安全性の実現

### 3.2 DiagramPlugin インターフェース

プラグインは以下のインターフェースを実装する：

```typescript
interface DiagramPlugin {
  name: string
  createSymbolFactory(userSymbols: SymbolBase[]): Record<string, (...args: any[]) => SymbolId>
  createRelationshipFactory(relationships: RelationshipBase[]): Record<string, (...args: any[]) => RelationshipId>
}
```

**プラグインの実装方法の詳細については、[Plugin System ドキュメント](./plugin-system.md) を参照してください。**

### 3.3 ID ヘルパーユーティリティ

プラグイン実装を簡潔にするため、ID 生成ヘルパー関数を提供：

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

**使用例**:
```typescript
export const UMLPlugin: DiagramPlugin = {
  name: 'uml',
  
  createSymbolFactory(userSymbols: SymbolBase[]) {
    const idGen = createIdGenerator(this.name)
    
    return {
      actor(label: string): SymbolId {
        const id = idGen.generateSymbolId('actor')
        const symbol = new ActorSymbol(id, label)
        userSymbols.push(symbol)
        return id
      }
    }
  }
}
```

### 3.4 Namespace Builder の要件

#### 型ユーティリティ
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

#### ランタイムオブジェクトの構築
```typescript
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

### 3.5 DiagramBuilder.build の実装

```typescript
class DiagramBuilder<TPlugins extends readonly DiagramPlugin[]> {
  private plugins: TPlugins = [] as any

  build(
    callback: (
      el: BuildElementNamespace<TPlugins>,
      rel: BuildRelationshipNamespace<TPlugins>,
      hint: HintFactory
    ) => void
  ) {
    // Symbol と Relationship を格納する配列
    const userSymbols: SymbolBase[] = []
    const relationships: RelationshipBase[] = []
    const hints: LayoutHint[] = []

    // Namespace Builder を使って el と rel を構築
    const namespaceBuilder = new NamespaceBuilder(this.plugins)
    const el = namespaceBuilder.buildElementNamespace(userSymbols)
    const rel = namespaceBuilder.buildRelationshipNamespace(relationships)
    const hint = new HintFactory(hints, userSymbols, this.currentTheme)

    // ユーザーのコールバックを実行
    // この中で el.uml.actor() などが呼ばれ、userSymbols / relationships に追加される
    callback(el, rel, hint)

    // DiagramSymbol を作成
    const diagramSymbol = new DiagramSymbol("__diagram__", this.titleOrInfo)
    diagramSymbol.setTheme(this.currentTheme)

    // すべての Symbol を含む配列
    const allSymbols: SymbolBase[] = [diagramSymbol, ...userSymbols]

    // テーマを適用
    for (const symbol of userSymbols) {
      symbol.setTheme(this.currentTheme)
    }
    for (const relationship of relationships) {
      relationship.setTheme(this.currentTheme)
    }

    // DiagramSymbol がすべてのユーザー Symbol を enclose する hint を追加
    if (userSymbols.length > 0) {
      hints.push({
        type: "enclose",
        symbolIds: [],
        containerId: diagramSymbol.id,
        childIds: userSymbols.map(s => s.id)
      })
    }

    // レイアウト計算
    const solver = new LayoutSolver(this.currentTheme)
    solver.solve(allSymbols, hints)

    return {
      symbols: allSymbols,
      relationships,
      render: (filepath: string) => {
        const renderer = new SvgRenderer(allSymbols, relationships, this.currentTheme)
        renderer.saveToFile(filepath)
      }
    }
  }
}
```

## 4. 型システム設計

### 4.1 コア型定義

```typescript
/**
 * Symbol の一意識別子
 */
type SymbolId = string & { readonly __brand: 'SymbolId' }

/**
 * Relationship の一意識別子
 */
type RelationshipId = string & { readonly __brand: 'RelationshipId' }

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

  constructor(id: SymbolId, label: string) {
    this.id = id
    this.label = label
  }

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
  ) {
    this.id = id
  }

  setTheme(theme: Theme): void
  calculateZIndex(symbols: Map<SymbolId, SymbolBase>): number
  abstract toSVG(symbols: Map<SymbolId, SymbolBase>): string
}
```

### 4.2 プラグインの型安全性

```typescript
/**
 * 型安全な DiagramPlugin 定義
 */
interface DiagramPlugin<
  TName extends string = string,
  TSymbolFactory extends Record<string, (...args: any[]) => SymbolId> = any,
  TRelationshipFactory extends Record<string, (...args: any[]) => RelationshipId> = any
> {
  readonly name: TName
  createSymbolFactory(userSymbols: SymbolBase[]): TSymbolFactory
  createRelationshipFactory(relationships: RelationshipBase[]): TRelationshipFactory
}
```

### 4.3 DiagramBuilder の型定義

```typescript
class DiagramBuilder<TPlugins extends readonly DiagramPlugin[] = []> {
  private plugins: TPlugins = [] as any
  private currentTheme: Theme
  private titleOrInfo: string | DiagramInfo

  constructor(titleOrInfo: string | DiagramInfo) {
    this.titleOrInfo = titleOrInfo
    this.currentTheme = DefaultTheme
  }

  use<TNewPlugins extends readonly DiagramPlugin[]>(
    ...plugins: TNewPlugins
  ): DiagramBuilder<[...TPlugins, ...TNewPlugins]> {
    this.plugins = [...this.plugins, ...plugins] as any
    return this as any
  }

  theme(theme: Theme): this {
    this.currentTheme = theme
    return this
  }

  build(
    callback: (
      el: BuildElementNamespace<TPlugins>,
      rel: BuildRelationshipNamespace<TPlugins>,
      hint: HintFactory
    ) => void
  ) {
    // 実装は 3.4 を参照
  }
}
```

## 5. マイグレーションパス

### 5.1 段階的な移行戦略

#### Phase 1: 新 API の実装
1. `DiagramPlugin` インターフェースの定義
2. `NamespaceBuilder` の実装
3. 型ユーティリティの実装

#### Phase 2: プラグインの移行
1. `UMLPlugin` を新形式に変換
2. `CorePlugin` を新形式に変換
3. 新規プラグインの追加（Sequence, ERD など）

#### Phase 3: Builder の移行
1. 新しい `DiagramBuilder` の実装
2. 内部で名前空間ベースの DSL を使用
3. 既存の API は維持

#### Phase 4: 旧 API の削除
1. `ElementFactory` の削除
2. `RelationshipFactory` の削除
3. `PluginManager` の削除（機能を `NamespaceBuilder` に統合）
4. Proxy ベースの実装の削除

### 5.2 互換性の保証

#### 外部 API の維持
```typescript
// 以下の API は変更なし
new DiagramBuilder(title)
  .use(...plugins)
  .theme(theme)
  .build((el, rel, hint) => {...})
```

#### 内部実装の刷新
- `el` と `rel` の実装を名前空間ベースに変更
- プラグインの内部構造を完全に刷新
- 利用者側のコード変更は不要

## 6. 実装上の注意点

### 6.1 TypeScript 5 の活用
- **Const Type Parameters**: プラグイン名の literal type として保持
- **Satisfies Operator**: 型安全性を保ちつつ型推論を維持
- **Mapped Types**: プラグイン一覧から名前空間型を生成

### 6.2 `any` の排除
- すべての public API から `any` を削除
- 内部実装でも可能な限り具体的な型を使用
- 型アサーションは最小限に

### 6.3 パフォーマンス考慮
- Proxy を削除し、直接的なオブジェクトアクセスを使用
- 名前空間オブジェクトは build 時に一度だけ構築
- プラグインの遅延ロードは不要（静的登録）

### 6.4 ID の命名規則
ID は以下の形式で生成される：
```
${namespace}:${symbolName|relationshipName}-${serial}
```

**例**:
- Symbol ID: `uml:actor-0`, `uml:usecase-1`, `sequence:lifeline-0`
- Relationship ID: `uml:association-0`, `uml:include-1`, `sequence:message-0`

**メリット**:
- デバッグ時にどのプラグインで生成されたかが一目でわかる
- Symbol/Relationship の種類が明確
- プラグイン間で ID が衝突しない
- ログやエラーメッセージでの可読性が向上

### 6.5 カウンター管理
- 各プラグインの `createSymbolFactory` / `createRelationshipFactory` 内でカウンターを管理
- Symbol と Relationship でそれぞれ独立したカウンター（0 から開始）
- プラグインごとに独立したカウンター
- 名前空間プレフィックスにより ID の衝突が完全に防止される

## 7. 拡張性

新しいプラグインの作成方法、ベストプラクティス、テスト戦略については、[Plugin System ドキュメント](./plugin-system.md) を参照してください。

### 7.1 プラグイン間の依存関係

将来的に、プラグイン間の依存関係をサポートする可能性がある：

```typescript
interface DiagramPlugin {
  name: string
  dependencies?: string[]  // 依存するプラグイン名のリスト
  createSymbolFactory(userSymbols: SymbolBase[]): Record<string, (...args: any[]) => SymbolId>
  createRelationshipFactory(relationships: RelationshipBase[]): Record<string, (...args: any[]) => RelationshipId>
}

// 依存関係チェックは DiagramBuilder.use() で実施
```

## 8. テスト戦略

### 8.1 型レベルのテスト
```typescript
// 型が正しく推論されることを確認
const builder = new DiagramBuilder("Test")
  .use(UMLPlugin, SequencePlugin)

builder.build((el, rel, hint) => {
  // el.uml が存在することを確認
  type _Test1 = typeof el.uml
  
  // el.sequence が存在することを確認
  type _Test2 = typeof el.sequence
  
  // 存在しない名前空間はエラーになることを確認
  // @ts-expect-error
  type _Test3 = typeof el.nonexistent
  
  // actor() が SymbolId を返すことを確認
  const userId: SymbolId = el.uml.actor("User")
  
  // associate() が RelationshipId を返すことを確認
  const relationId: RelationshipId = rel.uml.associate(userId, userId)
})
```

### 8.2 ランタイムのテスト
- プラグインの登録が正常に行われることを確認
- 名前空間オブジェクトが正しく構築されることを確認
- Symbol と Relationship が正しく生成されることを確認
- userSymbols / relationships 配列に正しく追加されることを確認

## 9. ドキュメント管理

### 9.1 デザインドキュメント
- `docs/design/namespace-dsl.md` (本ドキュメント)
- 設計変更時は常に更新

### 9.2 開発ログ
- `docs/devlog/YYYY-MM-DD_*.md` 形式で作業ログを記録
- 重要な実装ステップごとに作成

### 9.3 API ドキュメント
- JSDoc コメントで API を文書化
- TypeDoc で自動生成

## 10. まとめ

この設計により以下が実現される：
- ✅ 強力な型推論による IntelliSense の完全サポート
- ✅ プラグインベースの拡張可能なアーキテクチャ
- ✅ `any` を排除した型安全な実装
- ✅ 既存 API との完全な互換性
- ✅ 保守性・可読性の向上
- ✅ Symbol/Relationship の生成と管理の責務が明確化
- ✅ SymbolId / RelationshipId を返すことで既存コードとの整合性を保持
- ✅ Relationship にも ID を持たせることで、将来的な拡張性を確保
