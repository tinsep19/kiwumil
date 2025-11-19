# モジュール凝縮性レビュー（2025-11-19）

## 背景

`src/layout`, `src/core`, `src/model` の各モジュールにおけるexport・import関係を確認したところ、レイヤー間の依存関係が複雑化し、モジュールの凝縮性が低下している箇所が見られた。特に `layout` モジュールの内部型・ヘルパーが外部から直接参照されているケースが多く、カプセル化が不十分である。

## 問題点の整理

### 1. **layoutモジュールの内部詳細が外部に漏れている**

#### 問題箇所
- `src/model/symbol_base.ts` が `LayoutVar`, `LayoutVariables` を直接import
- `src/model/container_symbol_base.ts` が `LayoutConstraintStrength`, `expressionFromBounds` を直接import
- `src/model/diagram_symbol.ts` が `LayoutVariables`, `LayoutConstraintStrength`, `anchorToOrigin`, `applyMinSize` を直接import
- `src/plugin/core/plugin.ts`, `src/plugin/uml/plugin.ts` が `LayoutContext`, `applyFixedSize` を直接import
- `src/dsl/hint_factory.ts` が `LayoutConstraintOperator`, `LayoutConstraintStrength`, `LayoutVar` を直接import

#### 影響
- `layout_variables.ts` の実装詳細（`LayoutVar`, `LayoutConstraintStrength`, `LayoutConstraintOperator` など）がモジュール外部から直接参照されている
- `constraint_helpers.ts` が独立したヘルパーモジュールとして機能しているが、`LayoutContext` を受け取る設計のため `layout` モジュール外からの依存が増加
- レイアウトシステムの内部変更時に影響範囲が広がり、リファクタリングが困難

### 2. **modelモジュールがlayoutモジュールに強く依存**

#### 問題箇所
- `SymbolBase` が `LayoutVar`, `LayoutVariables` を知っている
- `ContainerSymbolBase` が `LayoutContext`, `LayoutConstraintStrength` を知っている
- `DiagramSymbol` が `LayoutVariables`, `LayoutContext`, `LayoutConstraintStrength` を知っている

#### 影響
- `model` は本来データモデルとインターフェースの定義に専念すべきだが、レイアウトの実装詳細に密結合している
- `SymbolBase` のテストで `LayoutVariables` のモックが必要になり、単体テストの独立性が損なわれている

### 3. **constraint_helpers.ts の位置が曖昧**

#### 問題箇所
- `constraint_helpers.ts` は `layout` モジュール内にあるが、`model` や `plugin` から利用される
- ヘルパー関数が `LayoutContext` を第一引数に取る設計のため、`LayoutContext` の公開APIに近い性質を持つ

#### 影響
- `layout` モジュールの内部ヘルパーなのか、公開APIの一部なのか不明確
- `applyFixedSize`, `applyMinSize`, `anchorToOrigin` などは高レベルな操作だが、低レベルな `LayoutContext` と同じモジュールに配置されている

### 4. **index.tsでlayoutモジュールが一切exportされていない**

#### 問題箇所
```typescript
// src/index.ts
// layoutモジュールからのexportが存在しない
export type { SymbolId, ContainerSymbolId, RelationshipId } from "./model/types"
export type { Theme } from "./core/theme"
// LayoutContext, LayoutVar などは非公開
```

#### 影響
- 外部パッケージからカスタムプラグインを作成する際、`LayoutContext` の型が利用できない
- プラグイン開発者は `import type { LayoutContext } from "kiwumil/dist/layout/layout_context"` のような不適切なimportが必要になる可能性がある（現状は `DiagramPlugin` 型経由で推論可能だが、型情報の提供が間接的）

## 改善提案

### 提案A: LayoutContext をファサードとして整理

**方針**
1. `LayoutContext` を唯一の公開APIとし、内部の `LayoutVariables`, `LayoutConstraints`, `LayoutVar` などを完全に隠蔽する
2. `constraint_helpers.ts` の関数を `LayoutContext` のメソッドとして統合
3. `SymbolBase` / `ContainerSymbolBase` は `LayoutContext` のみに依存し、具体的な型（`LayoutVar` など）は知らない

**変更内容**

#### 1. LayoutContext にヘルパーメソッドを追加
```typescript
// src/layout/layout_context.ts
export class LayoutContext {
  // 既存のメソッド
  readonly vars: LayoutVariables
  readonly constraints: LayoutConstraints
  readonly theme: Theme
  
  // constraint_helpers.ts から移動
  applyFixedSize(symbol: SymbolBase, size?: Size): void
  applyMinSize(symbol: SymbolBase, size: Size, strength?: LayoutConstraintStrength): void
  anchorToOrigin(symbol: SymbolBase, strength?: LayoutConstraintStrength): void
  expressionFromBounds(bounds: LayoutBounds, terms: BoundsTerm[], constant?: number): LayoutExpression
  
  // solve/valueOf は既に存在
  solve(): void
  valueOf(variable: LayoutVar): number
}
```

#### 2. constraint_helpers.ts を削除し、LayoutContext に統合

#### 3. LayoutVariables, LayoutVar などを非公開化
```typescript
// src/layout/layout_variables.ts
// ブランド型・内部型は export しない（または internal として明示）
type LayoutVar = kiwi.Variable & { readonly [LAYOUT_VAR_BRAND]: true }
// export しない、または `export type { LayoutVar }` のみで実体は非公開
```

#### 4. SymbolBase の実装をリファクタリング
```typescript
// src/model/symbol_base.ts
// LayoutVar, LayoutVariables を直接参照しない
// layoutContext: unknown として保持し、LayoutContext 経由でのみアクセス

export abstract class SymbolBase {
  protected layoutContext?: unknown  // 内部的に LayoutContext を保持するが型を公開しない
  
  // または、layoutBounds を内部で完全に隠蔽し、LayoutContext が管理する
}
```

#### 5. index.ts で LayoutContext のみを公開
```typescript
// src/index.ts
export type { LayoutContext } from "./layout/layout_context"
// LayoutVar, LayoutVariables などは非公開
```

**メリット**
- `layout` モジュールの内部実装詳細が完全に隠蔽される
- `SymbolBase` / プラグイン は `LayoutContext` のみに依存するため、依存関係がシンプルになる
- `LayoutContext` がファサードパターンとして機能し、レイアウトシステムの変更が容易になる

**デメリット**
- `LayoutContext` が肥大化する可能性がある
- `SymbolBase` の `ensureLayoutBounds` などの実装変更が必要
- 既存のヘルパー関数呼び出し（`applyFixedSize(layout, symbol)` → `layout.applyFixedSize(symbol)`）を全面的に書き換える必要がある

---

### 提案B: layout/api 名前空間を導入し、公開APIと内部実装を分離

**方針**
1. `src/layout/api/` ディレクトリを新設し、公開APIのみを配置
2. `layout_context.ts`, `constraint_helpers.ts` を `api/` に移動
3. `layout_variables.ts`, `layout_constraints.ts` は `internal/` または layout 直下に配置し、`api/` からのみ参照
4. `index.ts` で `layout/api/*` のみを export

**ディレクトリ構成**
```
src/
  layout/
    api/
      layout_context.ts       # 公開API（LayoutContext）
      constraint_helpers.ts   # 公開ヘルパー
      index.ts                # layout/api の export 集約
    internal/
      layout_variables.ts     # 内部実装（LayoutVar, LayoutVariables）
      layout_constraints.ts   # 内部実装（LayoutConstraints）
    layout_solver.ts          # LayoutSolver（内部使用のみ）
```

**変更内容**

#### 1. layout/api/index.ts で公開APIを集約
```typescript
// src/layout/api/index.ts
export { LayoutContext } from "./layout_context"
export { applyFixedSize, applyMinSize, anchorToOrigin, expressionFromBounds } from "./constraint_helpers"
export type { LayoutConstraintStrength } from "../internal/layout_variables"  // 型のみ公開
```

#### 2. src/index.ts で layout/api を export
```typescript
// src/index.ts
export type { LayoutContext } from "./layout/api/layout_context"
export { applyFixedSize, applyMinSize, anchorToOrigin } from "./layout/api/constraint_helpers"
// 内部実装（LayoutVar など）は非公開
```

#### 3. model/plugin は layout/api のみを import
```typescript
// src/model/symbol_base.ts
import type { LayoutContext } from "../layout/api/layout_context"
// LayoutVar は非公開、getLayoutBounds() の戻り値型も調整
```

**メリット**
- 公開APIと内部実装が明確に分離される
- ヘルパー関数は独立した関数として維持できる（`LayoutContext` の肥大化を回避）
- `layout/internal/*` の変更は外部に影響しない

**デメリット**
- ディレクトリ構成が複雑になる
- 既存のimport文を大量に変更する必要がある
- `LayoutBounds` の扱い（`LayoutVar` を含む型）をどう公開するか要検討

---

### 提案C: model を layout から完全に分離（レイヤードアーキテクチャ）

**方針**
1. `SymbolBase` から `LayoutVar` / `LayoutVariables` への依存を完全に削除
2. レイアウト情報は `LayoutContext` が `Map<SymbolId, LayoutBounds>` で外部管理
3. `SymbolBase` は純粋なデータモデル（`id`, `label`, `bounds`）のみを持つ
4. `ContainerSymbolBase` もレイアウト詳細を持たず、パディング定義などはテーマ or プラグインで管理

**変更内容**

#### 1. SymbolBase をシンプル化
```typescript
// src/model/symbol_base.ts
export abstract class SymbolBase {
  readonly id: SymbolId
  readonly label: string
  bounds?: Bounds  // solve後の結果値のみ
  nestLevel: number = 0
  containerId?: SymbolId
  
  // layoutBounds, layoutContext は持たない
  
  abstract getDefaultSize(): Size
  abstract toSVG(): string
  abstract getConnectionPoint(from: Point): Point
}
```

#### 2. LayoutContext が LayoutBounds を管理
```typescript
// src/layout/layout_context.ts
export class LayoutContext {
  private layoutBoundsMap = new Map<SymbolId, LayoutBounds>()
  
  ensureLayoutBounds(symbol: SymbolBase): LayoutBounds {
    if (!this.layoutBoundsMap.has(symbol.id)) {
      this.layoutBoundsMap.set(symbol.id, {
        x: this.vars.createVar(`${symbol.id}.x`),
        y: this.vars.createVar(`${symbol.id}.y`),
        width: this.vars.createVar(`${symbol.id}.width`),
        height: this.vars.createVar(`${symbol.id}.height`)
      })
    }
    return this.layoutBoundsMap.get(symbol.id)!
  }
}
```

#### 3. プラグインがレイアウト初期化を行う
```typescript
// src/plugin/core/plugin.ts
export const CorePlugin = {
  createSymbolFactory(userSymbols: SymbolBase[], layout: LayoutContext) {
    return {
      circle(label: string): SymbolId {
        const symbol = new CircleSymbol(idGen.generateSymbolId('circle'), label)
        // レイアウト初期化は LayoutContext 経由
        const bounds = layout.ensureLayoutBounds(symbol)
        layout.applyFixedSize(symbol)
        userSymbols.push(symbol)
        return symbol.id
      }
    }
  }
}
```

**メリット**
- `model` が完全に `layout` から独立し、レイヤードアーキテクチャが実現される
- `SymbolBase` の単体テストがレイアウトシステムなしで実行可能
- レイアウトシステムの差し替え（kiwi以外のソルバーへの移行）が容易

**デメリット**
- **大規模リファクタリングが必要**（全Symbolクラス、全プラグイン、全テストの書き換え）
- `ensureLayoutBounds` の呼び出し箇所が増え、コード量が増加
- `getLayoutBounds()` / `getContentLayoutBounds()` の扱いが複雑化

---

## 推奨案

**短期（現PR向け）: 提案A の一部を適用**
- `constraint_helpers.ts` を `LayoutContext` のメソッドに統合
- `LayoutVar`, `LayoutConstraintStrength` などの型を `index.ts` で公開し、型情報としてのみアクセス可能にする
- `SymbolBase` の実装はそのまま維持（大規模変更を避ける）

**中期（次フェーズ）: 提案B を採用**
- `layout/api` と `layout/internal` に分離
- プラグイン・model は `layout/api` のみを参照
- 段階的にimport文を修正

**長期（将来の検討課題）: 提案C を視野に入れる**
- レイアウトエンジンの完全な差し替え可能性を考慮するなら、最終的に提案Cを目指す
- ただし、現時点では kiwi への依存を前提としているため優先度は低い

---

## 追加の指摘事項

### 1. LayoutConstraintType が公開されていない
- `layout_constraints.ts` で定義されているが、プラグインやテストで使用する可能性がある
- 少なくとも型定義として `index.ts` から export すべき

### 2. ContainerSymbolId の扱い
- `src/model/types.ts` で定義され、`index.ts` でも公開されているが、`toContainerSymbolId` はユーティリティ関数として適切な場所か要検討
- `ContainerSymbolBase` と同じモジュール（`model/container_symbol_base.ts`）に配置する方が凝縮性が高い

### 3. Theme の依存方向
- `LayoutConstraints` が `Theme` を保持しているが、これはレイアウトとスタイリングの責務が混在している
- gap などのレイアウトパラメータは別の設定オブジェクト（`LayoutConfig` など）に分離する方が望ましい

---

## まとめ

現状の `layout` モジュールは、内部実装詳細が外部に漏れており、凝縮性が低下している。短期的には `LayoutContext` をファサードとして整理し、中期的には `layout/api` と `layout/internal` の分離を行うことで、モジュールの独立性と保守性を向上させることを推奨する。

---

## 決定事項（2025-11-19）

**採用方針**: 提案A + 追加の指摘事項 1, 2 を適用

### 実装する変更

1. **constraint_helpers.ts を LayoutContext のメソッドに統合**
   - `applyFixedSize`, `applyMinSize`, `anchorToOrigin`, `expressionFromBounds` を `LayoutContext` のメソッドとして実装
   - 既存の関数呼び出しを全て `layout.applyFixedSize(symbol)` 形式に変更
   - `constraint_helpers.ts` ファイルを削除

2. **index.ts で layout 関連の型を公開**
   - `LayoutContext` を type export
   - `LayoutConstraintStrength` を type export
   - `LayoutConstraintType` を type export（追加の指摘事項1）

3. **ContainerSymbolId ユーティリティの移動**
   - `toContainerSymbolId` を `model/types.ts` から `model/container_symbol_base.ts` に移動（追加の指摘事項2）
   - `index.ts` の export も更新

### 実装しない変更（将来の検討課題）

- `SymbolBase` の実装変更（大規模リファクタリングを回避）
- `layout/api`, `layout/internal` へのディレクトリ分割（提案B）
- `Theme` と `LayoutConfig` の分離（追加の指摘事項3）

### 作業手順

1. `LayoutContext` にヘルパーメソッドを追加
2. 全ての呼び出し箇所を更新（plugin, model, dsl）
3. `constraint_helpers.ts` を削除
4. `index.ts` を更新
5. `toContainerSymbolId` を移動
6. テスト実行・修正
7. 型テスト（tsd）実行・修正
