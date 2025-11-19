# hint Grid/Figure Builder 設計（ユーザーイメージ版）

## 📋 ユーザーのイメージ

```typescript
hint
  .grid(container)
  .enclose([[...symbols1], [...symbols2], [...symbols3]] as const)
  .gap(10)
  .layout()
```

## 🎯 設計方針

### DX重視の原則

- **直感的な API**: レイアウトタイプが明確（`.grid()` / `.figure()`）
- **型安全性**: IntelliSense による完全な補完サポート
- **流暢性**: メソッドチェーンによる記述

### Guide API との一貫性

```typescript
// Guide API のパターン
hint
  .createGuideY()              // Builder取得
  .alignBottom(user, admin)    // 対象・設定を積み重ねる
  .alignTop(screen, server)    // 対象・設定を積み重ねる
  .arrange()                   // 最後に制約を適用

// Grid/Figure Builder のパターン
hint
  .grid(container)             // Builder取得（レイアウトタイプ指定）
  .enclose([[a, b], [c, d]])   // 対象を指定
  .gap(10)                     // オプションを積み重ねる
  .padding(20)                 // オプションを積み重ねる
  .layout()                    // 最後に制約を適用
```

**共通パターン**: 型指定 → 対象指定 → オプション → 適用

## 🏗️ API 設計

### 基本形

```typescript
// Grid配置（矩形行列）
hint
  .grid(container)
  .enclose([[a, b], [c, d]] as const)
  .layout()

// Figure配置（非矩形）
hint
  .figure(container)
  .enclose([[a, b], [c]] as const)
  .layout()

// 従来のシンプルな形（1D配列）
hint.enclose(container, [a, b, c])
```

### オプション付き

```typescript
// Grid + gap
hint
  .grid(boundary)
  .enclose([[a, b], [c, d]] as const)
  .gap(10)
  .layout()

// Grid + 行・列別々のgap
hint
  .grid(boundary)
  .enclose([[a, b], [c, d]] as const)
  .gap({ row: 60, col: 80 })
  .layout()

// Grid + gap + padding
hint
  .grid(boundary)
  .enclose([[a, b], [c, d]] as const)
  .gap(10)
  .padding(20)
  .layout()

// Figure + center揃え
hint
  .figure(boundary)
  .enclose([[a, b], [c]] as const)
  .gap(10)
  .align('center')
  .layout()
```

## 📝 実装

### HintFactory 拡張

```typescript
export class HintFactory {
  // 既存: 1D配列で即座適用（後方互換性）
  enclose(container: ContainerSymbolId, children: SymbolId[]): void {
    this.applyContainerMetadata(container, children)
    this.layout.constraints.enclose(container, children)
  }

  // 新規: Grid Builder を返す
  grid(container: ContainerSymbolId): GridBuilder {
    return new GridBuilder(this, container)
  }

  // 新規: Figure Builder を返す
  figure(container: ContainerSymbolId): FigureBuilder {
    return new FigureBuilder(this, container)
  }
}
```

### GridBuilder

```typescript
export class GridBuilder {
  private matrix?: SymbolId[][]
  private options: {
    rowGap?: number
    colGap?: number
    padding?: number | { top?: number; right?: number; bottom?: number; left?: number }
  } = {}

  constructor(
    private readonly hint: HintFactory,
    private readonly container: ContainerSymbolId
  ) {}

  /**
   * 配置するシンボルを指定（矩形行列）
   */
  enclose(matrix: SymbolId[][]): this {
    if (!isRectMatrix(matrix)) {
      throw new Error('grid() requires a rectangular matrix')
    }
    this.matrix = matrix
    return this
  }

  /**
   * gap を設定
   */
  gap(gap: number | { row?: number; col?: number }): this {
    if (typeof gap === 'number') {
      this.options.rowGap = gap
      this.options.colGap = gap
    } else {
      this.options.rowGap = gap.row
      this.options.colGap = gap.col
    }
    return this
  }

  /**
   * padding を設定
   */
  padding(padding: number | { top?: number; right?: number; bottom?: number; left?: number }): this {
    this.options.padding = padding
    return this
  }

  /**
   * レイアウトを適用（最後に呼ぶ）
   */
  layout(): void {
    if (!this.matrix) {
      throw new Error('enclose() must be called before layout()')
    }

    const children = this.matrix.flat()

    // metadata 設定
    this.hint.applyContainerMetadata(this.container, children)

    // 制約を適用（オプションを渡す）
    this.hint.layout.constraints.encloseGrid(this.container, this.matrix, this.options)
  }
}
```

### FigureBuilder

```typescript
export class FigureBuilder {
  private rows?: SymbolId[][]
  private options: {
    rowGap?: number
    align?: 'left' | 'center' | 'right'
    padding?: number | { top?: number; right?: number; bottom?: number; left?: number }
  } = {}

  constructor(
    private readonly hint: HintFactory,
    private readonly container: ContainerSymbolId
  ) {}

  /**
   * 配置するシンボルを指定（行配列）
   */
  enclose(rows: SymbolId[][]): this {
    this.rows = rows
    return this
  }

  /**
   * gap を設定（行間のみ）
   */
  gap(gap: number): this {
    this.options.rowGap = gap
    return this
  }

  /**
   * 水平方向の揃え位置を設定
   */
  align(align: 'left' | 'center' | 'right'): this {
    this.options.align = align
    return this
  }

  /**
   * padding を設定
   */
  padding(padding: number | { top?: number; right?: number; bottom?: number; left?: number }): this {
    this.options.padding = padding
    return this
  }

  /**
   * レイアウトを適用（最後に呼ぶ）
   */
  layout(): void {
    if (!this.rows) {
      throw new Error('enclose() must be called before layout()')
    }

    const children = this.rows.flat()

    // metadata 設定
    this.hint.applyContainerMetadata(this.container, children)

    // 制約を適用（オプションを渡す）
    this.hint.layout.constraints.encloseFigure(this.container, this.rows, this.options)
  }
}
```

## 📊 設計の特徴

| 観点 | Grid Builder | Figure Builder |
|------|--------------|----------------|
| 用途 | 矩形行列（N×M） | 非矩形（行ごとに異なる要素数） |
| gap設定 | row/col 別々 | row のみ |
| alignment | なし | left/center/right |
| 検証 | 矩形検証あり | なし |

## 🎯 メリット

1. ✅ **レイアウトタイプが明確**: `hint.grid()` / `hint.figure()` で意図が明白
2. ✅ **Guide API との一貫性**: 同じパターン（型→対象→オプション→適用）
3. ✅ **オンライン制約適用**: `.layout()` で即座に登録
4. ✅ **型安全性**: 矩形検証など
5. ✅ **シンプル**: 必要なBuilderのみ提供（GridとFigure）
6. ✅ **拡張性**: 将来のレイアウトタイプ追加が容易

## 📋 LayoutConstraints の拡張

```typescript
export class LayoutConstraints {
  /**
   * Grid レイアウト（N×M配置）
   */
  encloseGrid(
    containerId: ContainerSymbolId,
    matrix: SymbolId[][],
    options?: {
      rowGap?: number
      colGap?: number
      padding?: number | { top?: number; right?: number; bottom?: number; left?: number }
    }
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
    
    // 3. Padding 制約（将来実装）
    if (options?.padding) {
      // TODO: padding 制約を追加
    }
  }

  /**
   * Figure レイアウト（行ごとの配置）
   */
  encloseFigure(
    containerId: ContainerSymbolId,
    rows: SymbolId[][],
    options?: {
      rowGap?: number
      align?: 'left' | 'center' | 'right'
      padding?: number | { top?: number; right?: number; bottom?: number; left?: number }
    }
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
    
    // 各行の先頭（または中央/右）を縦配置
    const anchors = rows.map(row => row[0])  // 左揃え
    this.arrangeVertical(anchors, rowGap)
    
    // 3. Alignment 対応（将来実装）
    if (options?.align === 'center') {
      this.alignCenterX(children)
    } else if (options?.align === 'right') {
      this.alignRight(children)
    }
  }
}
```

## 🚀 実装の優先順位

### Phase 1: 基盤整備（次のPR）

- [ ] `GridBuilder` / `FigureBuilder` クラス実装
- [ ] `HintFactory.grid()` / `.figure()` メソッド
- [ ] `LayoutConstraints.encloseGrid()` / `.encloseFigure()`
- [ ] 基本的な gap サポート
- [ ] 矩形検証（`isRectMatrix`）
- [ ] テスト追加

### Phase 2: オプション拡張

- [ ] padding サポート
- [ ] alignment サポート（figure）
- [ ] カスタム gap 値の詳細制約
- [ ] 詳細なテスト

### Phase 3: 高度な機能

- [ ] 入れ子コンテナのサポート
- [ ] カスタムレイアウトアルゴリズム
- [ ] パフォーマンス最適化

## 🎯 結論

### 採用する設計: Grid/Figure Builder

```typescript
// Grid: 矩形配置
hint
  .grid(container)
  .enclose([[a, b], [c, d]] as const)
  .gap(10)
  .layout()

// Figure: 非矩形配置
hint
  .figure(container)
  .enclose([[a, b], [c]] as const)
  .gap(10)
  .align('center')
  .layout()
```

### メリット

1. ✅ **最高のDX**: レイアウトタイプが一目瞭然
2. ✅ **オンライン制約適用**: layout-hint-online 原則に準拠
3. ✅ **Guide API 一貫性**: 同じパターン
4. ✅ **型安全性**: IntelliSense サポート
5. ✅ **シンプル**: GridとFigureのみで明確
6. ✅ **拡張性**: 新しいレイアウトタイプ追加が容易

### 次のステップ

1. GridBuilder / FigureBuilder の実装
2. LayoutConstraints 拡張（encloseGrid/encloseFigure）
3. テスト追加
4. ドキュメント更新

この設計により、ユーザーの直感に最も近い、シンプルで美しい API を提供できます！
