# 2025-11-19 モジュール凝縮性改善（提案A採用）

## 背景

`src/kiwi`, `src/core`, `src/model` のモジュール構造をレビューした結果、以下の問題が判明：

1. **layoutモジュールの内部詳細が外部に漏出**
   - `LayoutVar`, `LayoutConstraintStrength`, `LayoutConstraintOperator` が外部から直接参照されている
   - `constraint_helpers.ts` が model/plugin から多用されている

2. **公開APIが不明確**
   - `index.ts` で layout モジュールが一切 export されていない
   - カスタムプラグイン作成時に型情報が不足

3. **ContainerSymbolId ユーティリティの配置**
   - `toContainerSymbolId` が `model/types.ts` にあるが、`ContainerSymbolBase` と同じモジュールに配置する方が凝縮性が高い

## 採用した方針

**提案A**: LayoutContext をファサードとして整理 + 追加の指摘事項 1, 2 を適用

- `constraint_helpers.ts` の関数を `LayoutContext` のメソッドに統合
- `index.ts` で layout 関連の型を公開
- `toContainerSymbolId` を `container_symbol_base.ts` に移動

## 実施した変更

### 1. LayoutContext にヘルパーメソッドを追加

**変更ファイル**: `src/kiwi/layout_context.ts`

以下のメソッドを追加：
- `expressionFromBounds(bounds, terms, constant)`
- `applyFixedSize(symbol, size)`
- `applyMinSize(symbol, size, strength)`
- `anchorToOrigin(symbol, strength)`

これにより `layout.applyFixedSize(symbol)` のように統一的なAPIで呼び出せるようになった。

### 2. constraint_helpers.ts の削除

**削除ファイル**: `src/kiwi/constraint_helpers.ts`

全ての機能を `LayoutContext` に統合したため、このファイルは不要となった。

### 3. 呼び出し箇所の更新

**変更ファイル**:
- `src/plugin/core/plugin.ts`
- `src/plugin/uml/plugin.ts`
- `src/model/container_symbol_base.ts`
- `src/model/diagram_symbol.ts`
- `src/plugin/uml/symbols/system_boundary_symbol.ts`

変更前: `applyFixedSize(layout, symbol)`
変更後: `layout.applyFixedSize(symbol)`

変更前: `expressionFromBounds(layout, bounds, terms)`
変更後: `layout.expressionFromBounds(bounds, terms)`

### 4. toContainerSymbolId の移動

**変更前**: `src/model/types.ts` で定義・export
**変更後**: `src/model/container_symbol_base.ts` で定義・export

**import文の更新**:
- `src/plugin/uml/plugin.ts`
- `src/dsl/diagram_builder.ts`
- `tests/layout_constraints.test.ts`
- `tests/layout_solver.test.ts`

理由: `ContainerSymbolBase` と同じモジュールに配置することで凝縮性が向上。

### 5. index.ts の更新

**変更ファイル**: `src/index.ts`

追加した export:
```typescript
// Layout 型定義
export type { LayoutContext } from "./layout/layout_context"
export type { LayoutConstraintType } from "./layout/layout_constraints"
export { LayoutConstraintStrength } from "./layout/layout_variables"

// toContainerSymbolId の export 元を変更
export { toContainerSymbolId } from "./model/container_symbol_base"
```

これによりカスタムプラグイン開発時に必要な型情報が提供されるようになった。

## テスト結果

### 単体テスト
```bash
bun test
# 50 pass, 0 fail
```

### ビルド
```bash
bun run build
# 成功
```

### 型テスト
```bash
bun run test:types
# 成功
```

## メリット

1. **API の一貫性向上**
   - `LayoutContext` を経由した統一的なインターフェース
   - `layout.applyFixedSize(symbol)` のように明確な呼び出し

2. **カプセル化の強化**
   - `constraint_helpers.ts` の削除により、内部実装詳細の露出を削減
   - `LayoutContext` がファサードパターンとして機能

3. **型情報の提供**
   - `index.ts` で `LayoutContext`, `LayoutConstraintType`, `LayoutConstraintStrength` を公開
   - カスタムプラグイン開発者が型情報にアクセス可能

4. **凝縮性の向上**
   - `toContainerSymbolId` を `ContainerSymbolBase` と同じモジュールに配置
   - 関連する型とユーティリティが近接

## 今後の検討課題

- **提案B（中期）**: `layout/api` と `layout/internal` の分離
  - より明確な公開/非公開の境界線
  - 大規模な変更が必要なため、別のフェーズで検討

- **提案C（長期）**: model を layout から完全に分離
  - レイヤードアーキテクチャの実現
  - レイアウトエンジンの差し替え可能性
  - 現時点では kiwi 依存を前提としているため優先度低

## 関連ドキュメント

- `docs/draft/2025-11-19-module-cohesion-review.md` - モジュール凝縮性レビューの詳細
