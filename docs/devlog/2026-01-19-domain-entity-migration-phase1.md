# 2026-01-19: Domain Entity Migration - Phase 1 Complete

## 概要

Clean Architecture への移行の一環として、Domain Entity 層のファイル（`layout_variable.ts` と `item/` ディレクトリ）を新しいディレクトリ構造 `src/domain/entity/` に移動しました。

## 実施内容

### 1. ディレクトリ構造の作成

```
src/domain/entity/
├── layout_variable.ts
└── item/
    ├── item_base.ts
    ├── text_item.ts
    ├── rect_item.ts
    ├── icon_item.ts
    └── index.ts
```

### 2. layout_variable.ts の移行

**移動元:** `src/core/layout_variable.ts`  
**移動先:** `src/domain/entity/layout_variable.ts`

**変更内容:**
- import パスを `../../core/types` に調整（`VariableId`, `BoundId` の参照）
- ファイル内容は変更なし（移動のみ）

**注意:**
- `bounds.ts` は別ファイルとして存在せず、Bounds 関連の型と関数はすべて `layout_variable.ts` に含まれていた
- `getBoundsValues` 関数も同じファイルに含まれている

### 3. item ファイルの移行

以下の 4 ファイルを移行:

1. **item_base.ts**
   - import 変更: `../core` → `../layout_variable`

2. **text_item.ts**
   - import 変更: `../core` → `../layout_variable`

3. **rect_item.ts**
   - import 変更: `../core` → `../layout_variable`

4. **icon_item.ts**
   - import 変更: 
     - `../core` → `../layout_variable`
     - `../icon` → `../../../icon`

**注意:**
- `ellipse_item.ts` は存在しない（当初の要件には記載されていたが、実際のコードベースには存在しなかった）

### 4. 後方互換性のための再エクスポート

#### `src/core/layout_variable.ts`

```typescript
// Re-export from domain entity for backward compatibility
export type {
  Variable,
  AnchorX,
  AnchorY,
  AnchorZ,
  // ... その他の型
  Bounds,
  BoundsType,
  LayoutBounds,
  ContainerBounds,
  ItemBounds,
  BoundsMap,
} from "../domain/entity/layout_variable"

export {
  createBrandVariableFactory,
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  createBoundId,
  getBoundsValues,
} from "../domain/entity/layout_variable"
```

#### `src/item/index.ts`

```typescript
// Re-export from domain entity for backward compatibility
export { Item, TextItem, RectItem, IconItem } from "../domain/entity/item"
export type {
  ItemBaseOptions,
  EstimateSize,
  TextItemOptions,
  TextAlignment,
  Padding,
  RectItemOptions,
  IconItemOptions,
} from "../domain/entity/item"
```

旧パスからの個別ファイル（`item_base.ts`, `text_item.ts`, `rect_item.ts`, `icon_item.ts`）は削除し、`index.ts` からの再エクスポートに統一しました。

### 5. domain/entity/index.ts の更新

既存の `IconRef` エクスポートに加えて、新しく移行したエンティティのエクスポートを追加:

```typescript
// Layout variable entity
export type { Variable, AnchorX, AnchorY, ... } from "./layout_variable"
export { createBrandVariableFactory, topLeft, ... } from "./layout_variable"

// Bounds entity
export type { Bounds, BoundsType, ... } from "./layout_variable"
export { createBoundId, getBoundsValues } from "./layout_variable"

// Item entities
export { Item, TextItem, RectItem, IconItem } from "./item"
export type { ItemBaseOptions, ... } from "./item"
```

## 検証結果

### TypeScript コンパイル
```
✅ エラーなし
```

### テスト実行
```
✅ 235 pass
✅ 2 skip (既存の skip)
✅ 0 fail
```

### ビルド
```
✅ 成功
✅ 87 モジュールをバンドル
✅ index.js 78.96 KB
```

## 成功条件の確認

- ✅ すべてのファイルが新しいディレクトリに移動されている
- ✅ 旧パスに再エクスポートが設定されている
- ✅ すべてのテストがパスする（235/235）
- ✅ TypeScript のコンパイルエラーがない
- ✅ 既存の公開 API に変更がない

## インポートパスの例

### 新しいパス（推奨）

```typescript
import { Bounds, ItemBounds } from "../../domain/entity/layout_variable"
import { TextItem } from "../../domain/entity/item"
```

### 旧パス（後方互換性のため引き続き動作）

```typescript
import { Bounds, ItemBounds } from "../../core"
import { TextItem } from "../../item"
```

## 影響範囲

### 直接の変更
- `src/core/layout_variable.ts` - 再エクスポートに変更
- `src/item/index.ts` - 再エクスポートに変更
- `src/item/*.ts` - 削除（4 ファイル）
- `src/domain/entity/layout_variable.ts` - 新規作成
- `src/domain/entity/item/*.ts` - 新規作成（5 ファイル）
- `src/domain/entity/index.ts` - 更新

### 間接的な影響
- **なし** - すべての既存コードは再エクスポートを通じて変更なく動作

## 今後の課題

1. 既存のコードを段階的に新しいインポートパスに移行
2. 他の Domain Entity の移行（次のフェーズ）
3. Use Case 層の整理
4. Repository パターンの導入（必要に応じて）

## 備考

- `domain/ports` には一切触れていない（制約条件を遵守）
- 破壊的変更なし（すべてのテストが変更なしで通過）
- 公開 API (`src/index.ts`) は変更不要（再エクスポートが正しく機能）
