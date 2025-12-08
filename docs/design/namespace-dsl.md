# Namespace-Based DSL Architecture

## 概要

kiwumil は、プラグインごとの名前空間を持つ型安全な DSL によって図の作成を行います。各プラグインは独自の Symbol と Relationship を提供し、IntelliSense によって補完される直感的な API を実現しています。

## 名前空間ベースの DSL とは

従来の方法では、複数のプラグインから同名の Symbol や Relationship が提供される場合、名前の衝突が発生する可能性がありました。名前空間ベースの DSL では、各プラグインが自身の名前空間を持ち、その配下に Symbol と Relationship を提供します。

### 構造

```
el (Element Namespace)
├── core (CorePlugin)
│   ├── circle()
│   ├── rectangle()
│   └── ...
├── uml (UMLPlugin)
│   ├── actor()
│   ├── usecase()
│   └── ...
└── [plugin] (他のプラグイン)
    └── ...

rel (Relationship Namespace)
├── core (CorePlugin)
│   ├── arrow()
│   ├── line()
│   └── ...
├── uml (UMLPlugin)
│   ├── associate()
│   ├── extend()
│   └── ...
└── [plugin] (他のプラグイン)
    └── ...
```

## 使用例

### 基本的な使い方

```typescript
import { TypeDiagram, UMLPlugin } from 'kiwumil'

TypeDiagram("Use Case Diagram")
  .use(UMLPlugin)
  .build((el, rel, hint) => {
    // UML Plugin の名前空間を使用
    const user = el.uml.actor("User")
    const login = el.uml.usecase("Login")
    const register = el.uml.usecase("Register")
    
    rel.uml.associate(user, login)
    rel.uml.associate(user, register)
    
    hint.arrangeHorizontal(login, register)
  })
  .render("output.svg")
```

### CorePlugin のみを使用

```typescript
import { TypeDiagram } from 'kiwumil'

// CorePlugin はデフォルトで適用されています
TypeDiagram("Simple Diagram")
  .build((el, rel, hint) => {
    const circle = el.core.circle("Circle")
    const rect = el.core.rectangle("Rectangle")
    
    rel.core.arrow(circle, rect)
    
    hint.arrangeHorizontal(circle, rect)
  })
  .render("output.svg")
```

### 複数のプラグインを使用

```typescript
import { TypeDiagram, UMLPlugin, SequencePlugin } from 'kiwumil'

TypeDiagram("Mixed Diagram")
  .use(UMLPlugin, SequencePlugin)
  .build((el, rel, hint) => {
    // CorePlugin の名前空間（デフォルトで利用可能）
    const circle = el.core.circle("Circle")
    
    // UMLPlugin の名前空間
    const actor = el.uml.actor("Actor")
    
    // SequencePlugin の名前空間
    const lifeline = el.sequence.lifeline("Service")
    
    // 各名前空間の Relationship
    rel.core.arrow(circle, actor)
    rel.uml.associate(actor, lifeline)
  })
  .render("output.svg")
```

### DiagramInfo とテーマを使用

```typescript
import { TypeDiagram, UMLPlugin, DarkTheme } from 'kiwumil'

TypeDiagram({
  title: "E-Commerce System",
  createdAt: "2025-11-14",
  author: "Architecture Team"
})
  .use(UMLPlugin)
  .theme(DarkTheme)
  .build((el, rel, hint) => {
    const user = el.uml.actor("User")
    const cart = el.uml.usecase("Shopping Cart")
    rel.uml.associate(user, cart)
  })
  .render("output.svg")
```

## アーキテクチャの特徴

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
 * 形式: `${namespace}:${symbolName}/${index}`
 * 例: "uml:actor/0", "uml:usecase/1", "core:rectangle/0"
 */
type SymbolId = string & { readonly __brand: 'SymbolId' }

/**
 * Relationship の一意識別子
 * 形式: `${namespace}:${relationshipName}/${index}`
 * 例: "uml:association/0", "uml:include/1", "core:arrow/0"
 */
type RelationshipId = string & { readonly __brand: 'RelationshipId' }
```

**ID の命名規則の利点**:
- デバッグ時にどのプラグインで生成されたかが一目でわかる
- Symbol/Relationship の種類が明確
- プラグイン間で ID が衝突しない
- ログやエラーメッセージでの可読性が向上
- インデックスベースの採番により、生成順序が追跡可能

### SymbolBase と RelationshipBase

Symbol と Relationship は、オプションオブジェクトを受け取る構造になりました：

```typescript
interface SymbolBaseOptions {
  id: SymbolId
  layoutBounds: LayoutBound
  theme: Theme
}

abstract class SymbolBase {
  constructor(options: SymbolBaseOptions) { ... }

  getLayoutBounds(): LayoutBound
  abstract toSVG(): string
  abstract getConnectionPoint(from: Point): Point
}

interface RelationshipBaseOptions {
  id: RelationshipId
  from: SymbolId
  to: SymbolId
  theme: Theme
}

abstract class RelationshipBase {
  constructor(options: RelationshipBaseOptions) { ... }

  calculateZIndex(symbols: Map<SymbolId, SymbolBase>): number
  abstract toSVG(symbols: Map<SymbolId, SymbolBase>): string
}
```

## プラグインインターフェース

Namespace ベース DSL は `DiagramPlugin` を実装したプラグインが提供する名前空間を合成することで構築されます。ここでは仕組みのみを扱い、プラグイン作成の詳細は [Plugin System ドキュメント](./plugin-system.md) に集約しています。

- 各プラグインは一意の `name` を持ち、`el.{name}` / `rel.{name}` の形で参照されます。
- `createSymbolFactory` / `createRelationshipFactory` はどちらもオプショナルで、必要な方だけ実装できます。
- 両ファクトリは `Symbols` / `Relationships` インスタンスと `LayoutContext` を受け取ります。
- Symbol / Relationship の登録は `Symbols.register()` / `Relationships.register()` メソッドを使用します。
- LayoutBound は `layout.variables.createBounds(symbolId)` で生成し、コンストラクタに注入します。

### 参考資料

- DiagramPlugin インターフェースの完全な型定義
- UMLPlugin などの実装例
- Symbols / Relationships クラスによる集中管理パターン

➡ これらはすべて [Plugin System ドキュメント](./plugin-system.md) で詳しく説明しています。_namespace-dsl.md_ では、プラグインを追加した結果として el/rel 名前空間がどのように組み立てられるかに焦点を当てます。

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
    symbols: Symbols,
    layout: LayoutContext
  ): BuildElementNamespace<TPlugins> {
    const namespace = {} as any
    for (const plugin of this.plugins) {
      if (plugin.createSymbolFactory) {
        namespace[plugin.name] = plugin.createSymbolFactory(symbols, layout)
      }
    }
    return namespace
  }

  buildRelationshipNamespace(
    relationships: Relationships,
    layout: LayoutContext
  ): BuildRelationshipNamespace<TPlugins> {
    const namespace = {} as any
    for (const plugin of this.plugins) {
      if (plugin.createRelationshipFactory) {
        namespace[plugin.name] = plugin.createRelationshipFactory(relationships, layout)
      }
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

## TypeDiagram API

### エントリポイント

`TypeDiagram` は図の作成を開始するエントリポイントです。CorePlugin がデフォルトで適用されるため、基本図形（circle, rectangle, ellipse 等）がすぐに利用可能です。

**メソッドチェーンでの使用**:
```typescript
TypeDiagram(titleOrInfo: string | DiagramInfo)
  .use(...plugins: DiagramPlugin[])     // プラグインの追加
  .theme(theme: Theme)                   // テーマの設定（オプション）
  .build((el, rel, hint) => { ... })    // 図の定義
  .render(outputPath: string)            // SVG ファイルの出力
```

### 内部処理フロー

`TypeDiagram` および `DiagramBuilder` 内部では以下の処理が行われます：

1. **初期化 (`TypeDiagram()`)**
   - DiagramBuilder インスタンスを作成
   - CorePlugin がデフォルトで自動登録される

2. **プラグイン追加 (`.use()`)**
   - 追加のプラグインを登録
   - プラグインは配列として蓄積される

3. **テーマ設定 (`.theme()`)** - オプション
   - カスタムテーマを設定

4. **ビルド (`.build(callback)`)**
   - `Symbols` と `Relationships` インスタンスを作成
   - レイアウト専用の `LayoutContext` を生成
   - DiagramSymbol（図全体を表す特別な Symbol）の ID を生成
   - `NamespaceBuilder` を使って `el` と `rel` を構築し、各プラグインの `createSymbolFactory/RelationshipFactory` に `symbols`/`relationships` インスタンスと `layout` を渡す
   - プラグインごとのファクトリが `Symbols` / `Relationships` を経由して要素を登録
   - ユーザーが提供したコールバック関数を実行
   - `el.uml.actor()` などが呼ばれ、Symbol/Relationship が Symbols/Relationships に追加される
   - DiagramSymbol を実際に作成し、配列の先頭に追加
   - レンダリング可能なオブジェクトを返す

5. **レンダリング (`.render()`)**
   - テーマの適用: すべての Symbol と Relationship にテーマを適用
   - レイアウト計算: LayoutContext が制約を解決して各 Symbol の位置とサイズを決定
   - SVG 生成: すべての Symbol と Relationship を SVG として出力
   - 出力: 
     - 文字列の場合: ファイルパスとして SVG を保存
     - `import.meta` の場合: 自動的に対応する .svg パスへ保存
     - DOM Element の場合: innerHTML に SVG を設定（ブラウザ環境）

## 拡張性

Namespace DSL は、CorePlugin によるデフォルト図形に加えて任意の `DiagramPlugin` を登録することで拡張されます。プラグインそのものの作り方（クラス構成、ID 設計、TypeScript パターンなど）は [Plugin System ドキュメント](./plugin-system.md) に詳しい手順がありますので、ここでは仕組みの要点だけをまとめます。

- `TypeDiagram().use(MyPlugin)` で名前空間が `el.myplugin` / `rel.myplugin` として追加される
- 各プラグインは `Symbols` / `Relationships` を介して Symbol/Relationship を登録する
- ID は `Symbols.register()` / `Relationships.register()` 内で自動生成される
- レイアウト変数 (`LayoutBound`) は `layout.variables.createBounds()` で生成され、コンストラクタで注入される
- プラグイン固有のヒントやサイズ調整も同じ LayoutContext を通じて適用できる

**プラグインの実装方法（手順、コード例、TypeScript テクニック）は [plugin-system.md](./plugin-system.md) を参照してください。**

## まとめ

Namespace-Based DSL Architecture により、以下が実現されています：

- ✅ **強力な型推論**: IntelliSense による完全な補完サポート
- ✅ **プラグインベース**: 拡張可能なアーキテクチャ
- ✅ **型安全性**: `SymbolId` / `RelationshipId` による型レベルの識別
- ✅ **可読性**: デバッグしやすい ID 命名規則
- ✅ **保守性**: 名前空間による責務の明確化
- ✅ **拡張性**: 新しいプラグインの追加が容易
- ✅ **直感的な API**: `el.namespace.method()` という自然な記述
