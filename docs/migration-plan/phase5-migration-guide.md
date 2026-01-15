# Phase 5 マイグレーションガイド

## API の変更

### 1. solve() の変更

**Before**:
```typescript
layoutContext.solve()
```

**After**:
```typescript
layoutContext.solverEngine.solve()
```

---

### 2. createConstraint() の変更

**Before**:
```typescript
layoutContext.createConstraint((builder) => {
  builder.ct([1, x]).eq([100, 1]).required()
})
```

**After**:
```typescript
// Geometric constraint
layoutContext.constraintFactory.createGeometric("constraint-id", (builder) => {
  builder.ct([1, x.freeVariable]).eq([100, 1]).required()
})

// Layout hint
layoutContext.constraintFactory.createHint("hint-id", (builder) => {
  builder.ct([1, x.freeVariable]).eq([100, 1]).strong()
}, "strong", "arrange")
```

**重要**: 新しい API では `x` ではなく `x.freeVariable` を使用します。

---

### 3. valueOf() の変更

**Before**:
```typescript
const value = layoutContext.valueOf(variable)
```

**After**:
```typescript
const value = variable.value()
```

---

### 4. 変数作成の変更

**Before** (Phase 5 以前に変数作成 API があった場合):
```typescript
const x = layoutContext.createVariable("x")
```

**After**:
```typescript
const x = layoutContext.variableFactory.createAnchorX("x")
```

---

## マイグレーション手順

1. `solve()` の置き換え
2. `createConstraint()` の置き換え（制約の種類を明示）
3. `valueOf()` の置き換え
4. テストの実行・修正

---

## 使用例

### 完全なワークフロー

```typescript
import { createLayoutContext } from "@tinsep19/kiwumil"

// コンテキストを作成
const layoutContext = createLayoutContext()

// 変数を作成
const x = layoutContext.variableFactory.createAnchorX("x")
const y = layoutContext.variableFactory.createAnchorY("y")
const width = layoutContext.variableFactory.createWidth("width")
const height = layoutContext.variableFactory.createHeight("height")

// 制約を作成
layoutContext.constraintFactory.createGeometric("position", (builder) => {
  builder.ct([1, x.freeVariable]).eq([10, 1]).required()
  builder.ct([1, y.freeVariable]).eq([20, 1]).required()
})

layoutContext.constraintFactory.createGeometric("size", (builder) => {
  builder.ct([1, width.freeVariable]).eq([100, 1]).required()
  builder.ct([1, height.freeVariable]).eq([50, 1]).required()
})

// ソルバーを実行
layoutContext.solverEngine.solve()

// 結果を取得
console.log(x.value())      // 10
console.log(y.value())      // 20
console.log(width.value())  // 100
console.log(height.value()) // 50
```

---

## 注意事項

### 新しい LayoutContext と既存の LayoutContext

- **新しい LayoutContext**: `src/core/layout_context.ts`
  - Service Locator パターン
  - DiContainer ベース
  - Phase 5 で導入

- **既存の LayoutContext**: `src/model/layout_context.ts`
  - Model 層のコンテキスト
  - Theme、SymbolRegistry などを含む
  - 今後段階的に更新される予定

現時点では両方が共存しています。新しいコードでは `src/core` の LayoutContext を使用してください。

---

## トラブルシューティング

### Q: `x.freeVariable` とは何ですか？

A: Domain 層の Variable は `freeVariable` プロパティを持ち、これが Infrastructure 層の実際のソルバー変数です。制約を作成する際は `x.freeVariable` を使用する必要があります。

### Q: 既存のコードはすぐに更新する必要がありますか？

A: いいえ。既存のコードは段階的に更新してください。新しい機能や修正を加える際に、関連する部分を新しい API に移行することを推奨します。

### Q: テストが失敗します

A: 主な原因:
1. `x` の代わりに `x.freeVariable` を使っているか確認
2. `solve()` を `solverEngine.solve()` に変更しているか確認
3. 制約作成時に ID を指定しているか確認
