# TypedDiagram エントリポイント設計書（改訂版）

## 前提条件

**重要**: Kiwumil は初版リリース前であり、互換性を考慮する必要はない。
- 既存ユーザーは存在しない
- 破壊的変更を自由に行える
- 最適な設計を追求できる

## 設計理念

### 問題点（再評価）
- `new DiagramBuilder(title)` は冗長
- クラスインスタンス化の必要性がユーザーに見える
- "Builder" という名前が実装詳細を露出している
- **DiagramBuilder クラスを公開 API として残す必要がない**

### 解決策（改訂）
- **TypedDiagram** を唯一の公開エントリポイントとする
- 関数ベースの API でシンプルに
- IntelliSense が完全に機能することを名前で示唆
- 内部実装は完全に隠蔽する

## 実装方針の再検討

### ❌ Option 1: DiagramBuilder のラッパー関数

```typescript
export function TypedDiagram(titleOrInfo: string | DiagramInfo) {
  return new DiagramBuilder(titleOrInfo)
}
```

**問題点**:
- DiagramBuilder を export する必要がある
- 戻り値の型が `DiagramBuilder<[]>` になる
- ユーザーが内部実装を意識する
- API が2つ存在する混乱

### ❌ Option 2: 独立した実装

**問題点**:
- コードの重複
- メンテナンスコストが高い
- 設計として不適切

### ✅ Option 4: 完全な置き換え（推奨）

**DiagramBuilder を内部クラスとして扱い、TypedDiagram のみを公開する**

```typescript
// src/dsl/typed_diagram.ts

import { NamespaceBuilder } from "./namespace_builder"
import { HintFactory, LayoutHint } from "./hint_factory"
import { LayoutSolver } from "../layout/layout_solver"
import { SvgRenderer } from "../render/svg_renderer"
import { DiagramSymbol } from "../model/diagram_symbol"
import type { DiagramPlugin } from "./diagram_plugin"
import type { SymbolBase } from "../model/symbol_base"
import type { RelationshipBase } from "../model/relationship_base"
import type { DiagramInfo } from "../model/diagram_info"
import type { Theme } from "../core/theme"
import type { BuildElementNamespace, BuildRelationshipNamespace } from "./namespace_types"
import { DefaultTheme } from "../core/theme"

type DiagramCallback<TPlugins extends readonly DiagramPlugin[]> = (
  el: BuildElementNamespace<TPlugins>,
  rel: BuildRelationshipNamespace<TPlugins>,
  hint: HintFactory
) => void

/**
 * 内部実装クラス（非公開）
 * TypedDiagram 関数から返される
 */
class InternalDiagramBuilder<TPlugins extends readonly DiagramPlugin[] = []> {
  private plugins: TPlugins = [] as any
  private currentTheme: Theme
  private titleOrInfo: string | DiagramInfo

  constructor(titleOrInfo: string | DiagramInfo) {
    this.titleOrInfo = titleOrInfo
    this.currentTheme = DefaultTheme
  }

  use<TNewPlugins extends readonly DiagramPlugin[]>(
    ...plugins: TNewPlugins
  ): InternalDiagramBuilder<[...TPlugins, ...TNewPlugins]> {
    this.plugins = [...this.plugins, ...plugins] as any
    return this as any
  }

  theme(theme: Theme): this {
    this.currentTheme = theme
    return this
  }

  build(callback: DiagramCallback<TPlugins>) {
    const userSymbols: SymbolBase[] = []
    const relationships: RelationshipBase[] = []
    const hints: LayoutHint[] = []

    const namespaceBuilder = new NamespaceBuilder(this.plugins)
    const el = namespaceBuilder.buildElementNamespace(userSymbols)
    const rel = namespaceBuilder.buildRelationshipNamespace(relationships)
    const hint = new HintFactory(hints, userSymbols, this.currentTheme)

    callback(el, rel, hint)

    const diagramSymbol = new DiagramSymbol("__diagram__", this.titleOrInfo)
    diagramSymbol.setTheme(this.currentTheme)

    const allSymbols: SymbolBase[] = [diagramSymbol, ...userSymbols]

    for (const symbol of userSymbols) {
      symbol.setTheme(this.currentTheme)
    }
    for (const relationship of relationships) {
      relationship.setTheme(this.currentTheme)
    }

    if (userSymbols.length > 0) {
      hints.push({
        type: "enclose",
        symbolIds: [],
        containerId: diagramSymbol.id,
        childIds: userSymbols.map(s => s.id)
      })
    }

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

/**
 * TypedDiagram - Kiwumil の型安全な図作成エントリポイント
 * 
 * IntelliSense による強力な型推論をサポートし、
 * 宣言的で読みやすい図の定義を可能にします。
 * 
 * @param titleOrInfo - 図のタイトル、または DiagramInfo オブジェクト
 * @returns チェーン可能なビルダーオブジェクト
 * 
 * @example
 * ```typescript
 * import { TypedDiagram, UMLPlugin } from "kiwumil"
 * 
 * TypedDiagram("My Diagram")
 *   .use(UMLPlugin)
 *   .build((el, rel, hint) => {
 *     const user = el.uml.actor("User")
 *     const login = el.uml.usecase("Login")
 *     rel.uml.associate(user, login)
 *     hint.arrangeHorizontal(user, login)
 *   })
 *   .render("output.svg")
 * ```
 * 
 * @example DiagramInfo を使用
 * ```typescript
 * TypedDiagram({
 *   title: "E-Commerce System",
 *   createdAt: "2025-11-14",
 *   author: "Architecture Team"
 * })
 *   .use(UMLPlugin)
 *   .build((el, rel, hint) => {
 *     // ...
 *   })
 *   .render("output.svg")
 * ```
 */
export function TypedDiagram(titleOrInfo: string | DiagramInfo) {
  return new InternalDiagramBuilder(titleOrInfo)
}
```

**メリット**:
- ✅ TypedDiagram のみが公開 API
- ✅ 内部実装が完全に隠蔽される
- ✅ ユーザーが意識する概念が1つだけ
- ✅ 戻り値の型名にも "Builder" が出ない
- ✅ 最もクリーンな設計
- ✅ ドキュメントがシンプルになる

**デメリット**:
- DiagramBuilder を使っている既存コード... → **存在しない！**

## エクスポート戦略（改訂版）

### src/index.ts

```typescript
// メインエントリポイント
export { TypedDiagram } from "./dsl/typed_diagram"

// プラグイン
export { CorePlugin } from "./plugin/core/plugin"
export { UMLPlugin } from "./plugin/uml/plugin"

// 型定義
export type { DiagramPlugin } from "./dsl/diagram_plugin"
export type { DiagramInfo } from "./model/diagram_info"
export type { Theme } from "./core/theme"
export type { SymbolBase } from "./model/symbol_base"
export type { SymbolId, RelationshipId } from "./model/types"

// テーマ
export { DefaultTheme, BlueTheme, DarkTheme } from "./core/theme"

// 注: DiagramBuilder は export しない（内部実装）
// 注: Diagram は削除（不要）
```

## ファイル構成の整理

### 削除するファイル
- ❌ `src/dsl/diagram.ts` - レガシー、不要
- ❌ `src/dsl/diagram_builder.ts` - TypedDiagram に統合

### 新規作成するファイル
- ✅ `src/dsl/typed_diagram.ts` - 唯一の公開エントリポイント

### 残すファイル
- ✅ その他すべての内部実装ファイル

## API 設計（最終版）

### 基本的な使い方

```typescript
import { TypedDiagram, UMLPlugin } from "kiwumil"

TypedDiagram("My Diagram")
  .use(UMLPlugin)
  .build((el, rel, hint) => {
    const user = el.uml.actor("User")
    const login = el.uml.usecase("Login")
    rel.uml.associate(user, login)
  })
  .render("output.svg")
```

### 複数プラグイン

```typescript
import { TypedDiagram, UMLPlugin, CorePlugin } from "kiwumil"

TypedDiagram("Mixed Diagram")
  .use(UMLPlugin, CorePlugin)
  .build((el, rel, hint) => {
    el.uml.actor("User")
    el.core.circle("Circle")
  })
  .render("output.svg")
```

### テーマの適用

```typescript
import { TypedDiagram, UMLPlugin, DarkTheme } from "kiwumil"

TypedDiagram("Dark Diagram")
  .use(UMLPlugin)
  .theme(DarkTheme)
  .build((el, rel, hint) => {
    // ...
  })
  .render("output.svg")
```

## 実装タスク（改訂版）

### Phase 1: TypedDiagram の実装
- [ ] `src/dsl/typed_diagram.ts` を作成（InternalDiagramBuilder を含む）
- [ ] `src/dsl/diagram_builder.ts` を削除
- [ ] `src/dsl/diagram.ts` を削除
- [ ] `src/index.ts` を更新（TypedDiagram のみ export）

### Phase 2: テストの更新
- [ ] `tests/namespace_dsl.test.ts` を `tests/typed_diagram.test.ts` にリネーム
- [ ] すべての `DiagramBuilder` → `TypedDiagram` に変更
- [ ] `tests/diagram_builder.test.ts` を削除または統合

### Phase 3: ドキュメント更新
- [ ] README.md を TypedDiagram ベースに書き換え
- [ ] GALLERY.md を TypedDiagram ベースに書き換え
- [ ] "DiagramBuilder" への言及をすべて削除

### Phase 4: Example ファイル更新
- [ ] すべての example を TypedDiagram に変更
- [ ] SVG を再生成

## 互換性マトリクス（改訂版）

| API | Status | 推奨 | 備考 |
|-----|--------|------|------|
| `TypedDiagram()` | ✅ 公式 | ⭐⭐⭐ | 唯一の公開エントリポイント |
| `DiagramBuilder` | ❌ 削除 | - | 内部実装に統合 |
| `Diagram()` | ❌ 削除 | - | 不要 |

## まとめ（改訂版）

**初版リリース前の状況を踏まえた最適解:**

### Option 4 を採用すべき理由

1. **シンプルさ**: 公開 API が1つだけ
2. **クリーンさ**: 内部実装が完全に隠蔽される
3. **学習コスト**: ユーザーが覚える API が最小限
4. **ドキュメント**: 説明が簡潔になる
5. **将来性**: 内部実装を自由に変更できる
6. **互換性**: 考慮不要（初版リリース前）

### 変更の影響

- ✅ ユーザーへの影響: なし（初版前）
- ✅ ドキュメント: シンプルになる
- ✅ テスト: 名前変更のみ
- ✅ Example: 名前変更のみ

---

## レビュー依頼（改訂版）

初版リリース前という状況を踏まえ、以下について再度レビューをお願いします：

1. **Option 4 の採用**: DiagramBuilder を削除し、TypedDiagram のみを公開する方針で OK ですか？

2. **名前**: `TypedDiagram` で確定して良いですか？
   - 他の案: `diagram()`, `createDiagram()`

3. **InternalDiagramBuilder**: 内部クラス名は `InternalDiagramBuilder` で良いですか？
   - 他の案: `Builder`, `DiagramBuilderImpl`, `TypedDiagramBuilder`

4. **移行計画**: DiagramBuilder の完全削除に問題はありませんか？

5. **その他**: 懸念点があればお願いします。


## API 設計

### 基本形

```typescript
import { TypedDiagram, UMLPlugin } from "kiwumil"

// シンプルな使い方
TypedDiagram("My Diagram")
  .use(UMLPlugin)
  .build((el, rel, hint) => {
    const user = el.uml.actor("User")
    const login = el.uml.usecase("Login")
    rel.uml.associate(user, login)
  })
  .render("output.svg")

// DiagramInfo を使う場合
TypedDiagram({
  title: "E-Commerce System",
  createdAt: "2025-11-14",
  author: "Team"
})
  .use(UMLPlugin)
  .build((el, rel, hint) => {
    // ...
  })
  .render("output.svg")
```

### 型推論の強化

```typescript
// プラグインを登録すると型が自動的に推論される
const diagram = TypedDiagram("Test")
  .use(UMLPlugin, CorePlugin)

// build 内で el と rel の型が完全に推論される
diagram.build((el, rel, hint) => {
  el.uml.actor("User")      // ✅ OK
  el.core.circle("Circle")  // ✅ OK
  el.nonexistent.foo()      // ❌ コンパイルエラー
})
```

## 実装方針

### Option 1: DiagramBuilder のラッパー関数（推奨）

```typescript
// src/dsl/typed_diagram.ts
import { DiagramBuilder } from "./diagram_builder"
import type { DiagramInfo } from "../model/diagram_info"

/**
 * TypedDiagram - 型安全な図作成のエントリポイント
 * 
 * IntelliSense による強力な型推論をサポートする、
 * Kiwumil の推奨エントリポイント関数です。
 * 
 * @param titleOrInfo - 図のタイトル、または DiagramInfo オブジェクト
 * @returns DiagramBuilder インスタンス
 * 
 * @example
 * ```typescript
 * import { TypedDiagram, UMLPlugin } from "kiwumil"
 * 
 * TypedDiagram("My Diagram")
 *   .use(UMLPlugin)
 *   .build((el, rel, hint) => {
 *     const user = el.uml.actor("User")
 *     const login = el.uml.usecase("Login")
 *     rel.uml.associate(user, login)
 *   })
 *   .render("output.svg")
 * ```
 */
export function TypedDiagram(titleOrInfo: string | DiagramInfo) {
  return new DiagramBuilder(titleOrInfo)
}
```

**メリット**:
- 実装が非常にシンプル
- DiagramBuilder の全機能を透過的に利用可能
- メンテナンスコストが低い
- 型推論が完全に機能

**デメリット**:
- 内部で DiagramBuilder を使用していることが見える

### Option 2: 独立した実装

```typescript
// src/dsl/typed_diagram.ts
import type { DiagramPlugin } from "./diagram_plugin"
import type { DiagramInfo } from "../model/diagram_info"
import type { Theme } from "../core/theme"

class TypedDiagramBuilder<TPlugins extends readonly DiagramPlugin[] = []> {
  // DiagramBuilder と同じ実装
}

export function TypedDiagram(titleOrInfo: string | DiagramInfo) {
  return new TypedDiagramBuilder(titleOrInfo)
}
```

**メリット**:
- 完全に独立した実装
- "Builder" という名前を隠蔽できる

**デメリット**:
- コードの重複
- メンテナンスコストが高い
- DiagramBuilder との同期が必要

### Option 3: DiagramBuilder のリネーム

```typescript
// DiagramBuilder → TypedDiagramBuilder にリネーム
// TypedDiagram は直接 export

export class TypedDiagramBuilder<...> {
  // 既存の実装
}

export function TypedDiagram(titleOrInfo: string | DiagramInfo) {
  return new TypedDiagramBuilder(titleOrInfo)
}

// 互換性のため
export const DiagramBuilder = TypedDiagramBuilder
```

**メリット**:
- 実装は一つだけ
- 明確な命名

**デメリット**:
- 既存コードとの互換性に注意が必要
- リネームの影響範囲が大きい

## 推奨実装: Option 1

**理由**:
- 実装が最もシンプル
- DiagramBuilder は内部で使い続け、TypedDiagram を公開 API とする
- 既存コードへの影響がゼロ
- 段階的な移行が可能

## エクスポート戦略

### src/index.ts

```typescript
// 推奨エントリポイント
export { TypedDiagram } from "./dsl/typed_diagram"

// 従来のエントリポイント（互換性のため）
export { DiagramBuilder } from "./dsl/diagram_builder"
export { Diagram } from "./dsl/diagram"  // レガシー

// プラグイン
export { CorePlugin } from "./plugin/core/plugin"
export { UMLPlugin } from "./plugin/uml/plugin"

// 型
export type { DiagramPlugin } from "./dsl/diagram_plugin"
export type { DiagramInfo } from "./model/diagram_info"
export type { Theme } from "./core/theme"
export type { SymbolBase } from "./model/symbol_base"

// テーマ
export { DefaultTheme, BlueTheme, DarkTheme } from "./core/theme"
```

## ドキュメント更新計画

### README.md

```typescript
// ❌ 旧 API
import { Diagram } from "kiwumil"

// ⚠️ 中間 API
import { DiagramBuilder } from "kiwumil"
const diagram = new DiagramBuilder("title")

// ✅ 推奨 API
import { TypedDiagram } from "kiwumil"
TypedDiagram("title")
```

### 主な変更点

1. **メインの使用例を TypedDiagram に変更**
2. **"型安全" と "IntelliSense" を強調**
3. **DiagramBuilder は "Advanced Usage" セクションで説明**
4. **Diagram は "Legacy API" として記載**

## マイグレーションガイド

### 既存ユーザー向け

```typescript
// 旧: Diagram (レガシー)
Diagram("title").use(UMLPlugin).build(...)

// 旧: DiagramBuilder
new DiagramBuilder("title").use(UMLPlugin).build(...)

// 新: TypedDiagram (推奨)
TypedDiagram("title").use(UMLPlugin).build(...)
```

**変更点**:
- `new` が不要になった
- より簡潔で読みやすい
- 型推論が改善されている

## テスト計画

### tests/typed_diagram.test.ts

```typescript
import { describe, test, expect } from "bun:test"
import { TypedDiagram, UMLPlugin, CorePlugin } from "../src/index"

describe("TypedDiagram", () => {
  test("should create diagram with string title", () => {
    const diagram = TypedDiagram("Test")
      .use(UMLPlugin)
      .build((el, rel, hint) => {
        el.uml.actor("User")
      })
    
    expect(diagram.symbols.length).toBeGreaterThan(0)
  })

  test("should create diagram with DiagramInfo", () => {
    const diagram = TypedDiagram({
      title: "Test",
      author: "Author"
    })
      .use(UMLPlugin)
      .build((el, rel, hint) => {
        el.uml.actor("User")
      })
    
    expect(diagram.symbols.length).toBeGreaterThan(0)
  })

  test("should support multiple plugins", () => {
    const diagram = TypedDiagram("Test")
      .use(UMLPlugin, CorePlugin)
      .build((el, rel, hint) => {
        el.uml.actor("User")
        el.core.circle("Circle")
      })
    
    expect(diagram.symbols.length).toBeGreaterThan(1)
  })

  test("should have same behavior as DiagramBuilder", () => {
    const typed = TypedDiagram("Test")
      .use(UMLPlugin)
      .build((el, rel, hint) => {
        const user = el.uml.actor("User")
        const login = el.uml.usecase("Login")
        rel.uml.associate(user, login)
      })
    
    expect(typed.symbols.length).toBeGreaterThan(0)
    expect(typed.relationships.length).toBeGreaterThan(0)
  })
})
```

## 実装タスク

### Phase 1: TypedDiagram 関数の実装
- [ ] `src/dsl/typed_diagram.ts` を作成
- [ ] JSDoc コメントを充実させる
- [ ] `src/index.ts` でエクスポート

### Phase 2: テストの追加
- [ ] `tests/typed_diagram.test.ts` を作成
- [ ] DiagramBuilder との互換性テスト
- [ ] 型推論のテスト

### Phase 3: ドキュメント更新
- [ ] README.md のメイン例を TypedDiagram に変更
- [ ] GALLERY.md の例を TypedDiagram に変更
- [ ] マイグレーションガイドを追加

### Phase 4: Example ファイル更新
- [ ] すべての example ファイルを TypedDiagram に変更
- [ ] 新しい SVG を生成

## 互換性マトリクス

| API | Status | 推奨 | 備考 |
|-----|--------|------|------|
| `TypedDiagram()` | ✅ 最新 | ⭐⭐⭐ | 推奨エントリポイント |
| `new DiagramBuilder()` | ✅ 安定 | ⭐⭐ | 引き続きサポート |
| `Diagram()` | ⚠️ レガシー | ⭐ | 互換性のみ |

## まとめ

**TypedDiagram** は:
- ✅ シンプルで直感的
- ✅ 型安全性を名前で強調
- ✅ IntelliSense が完全に機能
- ✅ 既存コードとの互換性を保持
- ✅ 実装コストが低い

推奨実装は **Option 1** (DiagramBuilder のラッパー関数) です。

---

## レビュー依頼

以下の点についてレビューをお願いします：

1. **名前**: `TypedDiagram` という名前は適切ですか？
   - 代替案: `diagram()`, `createDiagram()`, `TypeSafeDiagram()`, `SmartDiagram()`

2. **実装方針**: Option 1 (ラッパー関数) で問題ありませんか？

3. **エクスポート戦略**: TypedDiagram を推奨、DiagramBuilder も残す方針で OK ですか？

4. **ドキュメント**: README で TypedDiagram をメインに据える方針で良いですか？

5. **その他**: 懸念点や改善案があればお願いします。
