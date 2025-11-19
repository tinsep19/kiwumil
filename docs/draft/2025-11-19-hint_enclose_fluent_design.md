# hint.enclose Fluent-Style Builder 設計（2025-11-19）

## 📋 設計方針の確認

### DX重視の原則（namespace-dsl.md より）

- **直感的な API**: 自然な記述
- **型安全性**: IntelliSense による完全な補完サポート
- **流暢性**: メソッドチェーンによる記述

### Guide API の fluent-style（layout-system.md より）

```typescript
const gy = hint
  .createGuideY()
  .alignBottom(user, admin)
  .alignTop(screen, server)
  .arrange()  // arrangeHorizontal: [user, admin, screen, server]
```

**特徴**:
- Builder パターン
- メソッドチェーン
- 最後に `arrange()` で制約を適用（オンライン適用）
- `follow*` / `align*` / `arrange()` の組み合わせ

## 🎯 hint.enclose の Fluent-Style 設計

### 基本方針

1. **`.constraints()` は廃止**: layout-hint-online 原則に反するため
2. **Fluent-style Builder**: Guide API と同様のパターン
3. **オンライン制約適用**: Builder のメソッド呼び出しで即座に適用
4. **型安全性**: TypeScript の型推論を最大活用

## 🏗️ 提案: EncloseBuilder

### API 設計

```typescript
// 基本形（1D配列）: 従来通りの即座適用
hint.enclose(container, [a, b, c])

// Builder形（2Dレイアウト）: fluent-style
hint
  .encloseBuilder(container)
  .grid([[a, b], [c, d]])     // Grid配置 + 即座に制約適用
  .gap({ row: 60, col: 80 })  // オプション指定

hint
  .encloseBuilder(container)
  .figure([[a, b], [c]])      // Figure配置 + 即座に制約適用
  .gap(60)                    // row gap のみ

hint
  .encloseBuilder(container)
  .auto([[a, b], [c, d]])     // 自動選択 + 即座に制約適用
```

### 実装

```typescript
export class HintFactory {
  // 既存: 1D配列で即座適用（後方互換性）
  enclose(container: ContainerSymbolId, children: SymbolId[]): void {
    this.applyContainerMetadata(container, children)
    this.layout.constraints.enclose(container, children)
  }

  // 新規: Builder を返す
  encloseBuilder(container: ContainerSymbolId): EncloseBuilder {
    return new EncloseBuilder(this, container)
  }
}

export class EncloseBuilder {
  constructor(
    private readonly hint: HintFactory,
    private readonly container: ContainerSymbolId
  ) {}

  /**
   * Grid配置（矩形行列）
   * @param matrix - N×M の矩形行列
   * @param options - gap などのオプション
   */
  grid(
    matrix: SymbolId[][],
    options?: { rowGap?: number; colGap?: number }
  ): EncloseBuilderWithLayout {
    if (!isRectMatrix(matrix)) {
      throw new Error('grid() requires a rectangular matrix')
    }
    
    const children = matrix.flat()
    
    // 即座に制約を適用（オンライン）
    this.hint.applyContainerMetadata(this.container, children)
    this.hint.layout.constraints.encloseGrid(this.container, matrix, options)
    
    return new EncloseBuilderWithLayout(this.hint, this.container, matrix, 'grid')
  }

  /**
   * Figure配置（非矩形）
   * @param rows - 行ごとの配列（行ごとに要素数が異なってもOK）
   * @param options - gap などのオプション
   */
  figure(
    rows: SymbolId[][],
    options?: { rowGap?: number; align?: 'left' | 'center' | 'right' }
  ): EncloseBuilderWithLayout {
    const children = rows.flat()
    
    // 即座に制約を適用（オンライン）
    this.hint.applyContainerMetadata(this.container, children)
    this.hint.layout.constraints.encloseFigure(this.container, rows, options)
    
    return new EncloseBuilderWithLayout(this.hint, this.container, rows, 'figure')
  }

  /**
   * 自動選択（矩形ならgrid、非矩形ならfigure）
   * @param matrix - 2D配列
   */
  auto(
    matrix: SymbolId[][],
    options?: { rowGap?: number; colGap?: number }
  ): EncloseBuilderWithLayout {
    if (isRectMatrix(matrix)) {
      return this.grid(matrix, options)
    } else {
      return this.figure(matrix, { rowGap: options?.rowGap })
    }
  }
}

/**
 * レイアウト適用後のBuilder
 * 追加のカスタマイズが可能
 */
export class EncloseBuilderWithLayout {
  constructor(
    private readonly hint: HintFactory,
    private readonly container: ContainerSymbolId,
    private readonly matrix: SymbolId[][],
    private readonly layoutType: 'grid' | 'figure'
  ) {}

  /**
   * gap を調整（既存の制約を更新）
   * ※ この時点で既に制約は適用済みなので、更新処理が必要
   */
  gap(gap: number | { row?: number; col?: number }): this {
    // TODO: 既存の制約を更新する実装
    // layout.constraints.updateGap(container, gap)
    return this
  }

  /**
   * padding を追加
   */
  padding(padding: number | { top?: number; right?: number; bottom?: number; left?: number }): this {
    // TODO: padding 制約を追加
    return this
  }

  /**
   * alignment を調整（figure の場合）
   */
  align(align: 'left' | 'center' | 'right'): this {
    if (this.layoutType !== 'figure') {
      throw new Error('align() is only available for figure layout')
    }
    // TODO: alignment 制約を追加
    return this
  }
}
```

### 使用例

```typescript
// 例1: Grid配置（シンプル）
hint.encloseBuilder(boundary).grid([[a, b], [c, d]])

// 例2: Grid配置（gap指定）
hint
  .encloseBuilder(boundary)
  .grid([[a, b], [c, d]], { rowGap: 60, colGap: 80 })

// 例3: Figure配置（非矩形）
hint
  .encloseBuilder(boundary)
  .figure([[a, b], [c]])

// 例4: 自動選択
hint
  .encloseBuilder(boundary)
  .auto([[a, b], [c, d]])  // 矩形 → grid

// 例5: Fluent-style でカスタマイズ
hint
  .encloseBuilder(boundary)
  .grid([[a, b], [c, d]])
  .gap({ row: 60, col: 80 })
  .padding(20)

// 例6: Figure + alignment
hint
  .encloseBuilder(boundary)
  .figure([[a, b], [c]])
  .align('center')
  .gap(50)
```

## 🔄 Guide API との一貫性

### Guide API のパターン

```typescript
hint
  .createGuideY()
  .alignBottom(user, admin)
  .alignTop(screen, server)
  .arrange()  // 最後に制約を適用
```

### Enclose Builder のパターン

```typescript
hint
  .encloseBuilder(container)
  .grid([[a, b], [c, d]])     // 即座に制約を適用
  .gap({ row: 60, col: 80 })  // 追加のカスタマイズ
```

**違い**:
- **Guide**: `.arrange()` で最終的に制約を適用
- **Enclose**: `.grid()` / `.figure()` で即座に制約を適用

**理由**:
- Guide は「ガイド線を設定 → 最後に配置」というフロー
- Enclose は「配置方法を指定 → 追加カスタマイズ」というフロー
- どちらも **オンライン制約適用** を維持

## 📊 オリジナル提案との比較

| 観点 | オリジナル提案 | Fluent-Style Builder |
|------|----------------|----------------------|
| `.constraints()` | あり（廃止予定） | なし |
| `.apply()` | あり | なし（即座適用） |
| Builder パターン | あり | あり |
| オンライン適用 | ❌ 遅延評価 | ✅ 即座適用 |
| Guide API 一貫性 | - | ✅ 類似パターン |
| DX | 学習コスト高 | 直感的 |
| メソッド名 | `enclose()` → Builder | `encloseBuilder()` → Builder |

## 🎯 型安全性の確保

### 矩形検証

```typescript
// コンパイル時に矩形を検証
type IsRectMatrix<T extends Matrix> = ...

class EncloseBuilder {
  grid<T extends Matrix>(
    matrix: T,
    options?: GridOptions
  ): IsRectMatrix<T> extends true 
    ? EncloseBuilderWithLayout 
    : never {
    // 実行時検証
    if (!isRectMatrix(matrix)) {
      throw new Error('grid() requires a rectangular matrix')
    }
    // ...
  }
}
```

### IntelliSense サポート

```typescript
// ユーザーが入力すると...
hint.encloseBuilder(boundary).
// ↓ IntelliSense が候補を表示
// - grid(matrix, options?)
// - figure(rows, options?)
// - auto(matrix, options?)

hint.encloseBuilder(boundary).grid([[a, b], [c, d]]).
// ↓ 次の候補
// - gap(gap)
// - padding(padding)
```

## 🚀 実装の優先順位

### Phase 1: 基盤整備（次のPR）

- [ ] `EncloseBuilder` クラス実装
- [ ] `.grid()` / `.figure()` / `.auto()` メソッド
- [ ] `LayoutConstraints.encloseGrid()` / `.encloseFigure()`
- [ ] 基本的な gap サポート
- [ ] テスト追加

### Phase 2: カスタマイズ拡張

- [ ] `EncloseBuilderWithLayout` 実装
- [ ] `.gap()` / `.padding()` / `.align()` メソッド
- [ ] 制約の動的更新機能
- [ ] 詳細なテスト

### Phase 3: 高度な機能

- [ ] 入れ子コンテナのサポート
- [ ] カスタムレイアウトアルゴリズム
- [ ] パフォーマンス最適化

## 📝 LayoutConstraints の拡張

### 新規メソッド

```typescript
export class LayoutConstraints {
  /**
   * Grid レイアウト（N×M配置）
   */
  encloseGrid(
    containerId: ContainerSymbolId,
    matrix: SymbolId[][],
    options?: { rowGap?: number; colGap?: number }
  ): void {
    const children = matrix.flat()
    
    // 1. enclose 制約（Required）
    this.enclose(containerId, children)
    
    // 2. Grid 配置制約（Strong）
    const rowGap = options?.rowGap ?? this.options.verticalGap
    const colGap = options?.colGap ?? this.options.horizontalGap
    
    // 各行を水平配置
    for (const row of matrix) {
      this.arrangeHorizontal(row, colGap)
    }
    
    // 各列を垂直配置
    const numCols = matrix[0].length
    for (let col = 0; col < numCols; col++) {
      const column = matrix.map(row => row[col])
      this.arrangeVertical(column, rowGap)
    }
    
    // 3. Metadata の記録
    this.record('encloseGrid', raws, containerId)
  }

  /**
   * Figure レイアウト（行ごとの配置）
   */
  encloseFigure(
    containerId: ContainerSymbolId,
    rows: SymbolId[][],
    options?: { rowGap?: number; align?: 'left' | 'center' | 'right' }
  ): void {
    const children = rows.flat()
    
    // 1. enclose 制約（Required）
    this.enclose(containerId, children)
    
    // 2. 行ごとの配置制約（Strong）
    const rowGap = options?.rowGap ?? this.options.verticalGap
    
    // 各行を水平配置
    for (const row of rows) {
      this.arrangeHorizontal(row)
    }
    
    // 各行の先頭（または中央）を縦配置
    const anchors = rows.map(row => row[0])  // 左揃え
    this.arrangeVertical(anchors, rowGap)
    
    // alignment 対応（将来実装）
    if (options?.align === 'center') {
      this.alignCenterX(children)
    } else if (options?.align === 'right') {
      this.alignRight(children)
    }
    
    // 3. Metadata の記録
    this.record('encloseFigure', raws, containerId)
  }
}
```

## 🎯 結論

### 採用する設計

**Fluent-Style EncloseBuilder**:

```typescript
// シンプル: 従来通り
hint.enclose(container, [a, b, c])

// Builder: fluent-style
hint
  .encloseBuilder(container)
  .grid([[a, b], [c, d]])
  .gap({ row: 60, col: 80 })
```

### メリット

1. ✅ **DX 重視**: 直感的で流暢な記述
2. ✅ **オンライン制約適用**: layout-hint-online 原則に準拠
3. ✅ **Guide API との一貫性**: 類似した Builder パターン
4. ✅ **型安全性**: IntelliSense による補完サポート
5. ✅ **拡張性**: 将来的なカスタマイズが容易

### オリジナル提案からの変更点

- ❌ `.constraints()` を廃止
- ❌ `.apply()` を廃止（即座適用）
- ✅ `encloseBuilder()` で Builder を返す
- ✅ `.grid()` / `.figure()` / `.auto()` で即座に制約を適用
- ✅ Fluent-style でカスタマイズを追加

### 次のステップ

1. EncloseBuilder の実装
2. LayoutConstraints 拡張（encloseGrid/encloseFigure）
3. テスト追加
4. ドキュメント更新

この設計により、DX を重視しつつ layout-hint-online の原則を守ることができます。
