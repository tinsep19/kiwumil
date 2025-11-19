# hint.enclose 仕様レビュー（layout-hint-online の文脈で）

## 📋 レビューの前提

`docs/draft/2025-11-18-layout-hint-online.md` の **オンライン制約適用** という大きな流れの中で、`hint.enclose` の拡張提案を評価する。

### layout-hint-online の主要な設計方針

1. **オンライン制約適用**: ヒント呼び出し時に即座に制約を追加（バッチ処理の廃止）
2. **LayoutContext の導入**: Variables + Constraints を束ねる
3. **LayoutHint[] の廃止**: メタ情報の蓄積ではなく、直接制約を登録
4. **型レベルの安全性**: ContainerSymbolId などのブランド型
5. **制約の追跡可能性**: `LayoutConstraint` (id, type, rawConstraints[])

## 🔍 hint.enclose 提案の位置づけ

### 提案内容（再確認）

```typescript
// 1D配列: 制約定義
enclose(container, [s1, s2, s3]).constraints()  // 制約のみ返す
enclose(container, [s1, s2, s3]).apply()        // 制約を適用（現在の挙動）

// 2D配列: レイアウト構築
enclose(container, [[s1,s2],[s3,s4]]).grid()    // Grid配置
enclose(container, [[s1,s2],[s3]]).figure()     // Figure配置
```

## ⚠️ **layout-hint-online の原則との矛盾**

### 1. **オンライン適用 vs 遅延評価**

**layout-hint-online の原則**:
> ヒントを呼ぶ = その場で `LayoutConstraint` が生成され、`constraints/${id}` というブランドIDで追跡できる

**hint.enclose 提案**:
```typescript
enclose(container, [s1, s2, s3]).constraints()  // まだ適用されない（遅延評価）
```

**問題点**:
- **オンライン制約適用の原則に反する**
- `.constraints()` は制約を返すだけで、`LayoutConstraints` に登録しない
- これは「バッチ処理」の一種であり、layout-hint-online が廃止しようとしている設計パターン

**layout-hint-online の現在の実装**:
```typescript
// HintFactory の各メソッドは即座に LayoutConstraints に登録
arrangeHorizontal(...symbolIds) {
  this.layout.constraints.arrangeHorizontal(symbolIds)  // 即座に登録
}

enclose(containerId, childIds) {
  // 1. metadata 設定（即座）
  // 2. 制約登録（即座）
  this.layout.constraints.enclose(containerId, childIds)
}
```

**結論**: `.constraints()` による遅延評価は **layout-hint-online の方針と矛盾**

### 2. **`.apply()` の必要性**

**layout-hint-online の原則**:
> `HintFactory` は `LayoutConstraints` を直接呼び出し、`LayoutHint[]` に push しない

**hint.enclose 提案**:
```typescript
enclose(container, [s1, s2, s3]).apply()  // 明示的に適用
```

**問題点**:
- 他のヒントAPI（`arrangeHorizontal`, `alignTop` など）は即座適用
- `enclose` だけが `.apply()` を要求するのは **一貫性に欠ける**
- ユーザーが「なぜ enclose だけ？」と混乱する

**layout-hint-online での一貫性**:
```typescript
// すべてのヒントAPIは即座に適用
hint.arrangeHorizontal(a, b, c)  // 即座に制約登録
hint.alignTop(a, b, c)           // 即座に制約登録
hint.enclose(container, [a, b, c])  // 即座に制約登録（現在の実装）
```

**結論**: `.apply()` を要求する設計は **layout-hint-online の一貫性を損なう**

## ✅ **layout-hint-online と整合性のある提案**

### 修正案A: 即座適用を維持しつつ2Dレイアウトをサポート

```typescript
// 1D配列: 即座に制約を適用（現在の挙動を維持）
hint.enclose(container, [s1, s2, s3])

// 2D配列: レイアウトタイプを指定して即座に適用
hint.encloseGrid(container, [[s1,s2],[s3,s4]])     // Grid配置
hint.encloseFigure(container, [[s1,s2],[s3]])      // Figure配置
hint.encloseAuto(container, [[s1,s2],[s3,s4]])     // 自動選択
```

**メリット**:
- オンライン制約適用の原則を維持
- 一貫性のあるAPI（すべて即座適用）
- 2Dレイアウトのサポート

**デメリット**:
- メソッドが増える（enclose, encloseGrid, encloseFigure, encloseAuto）
- ビルダーパターンの型安全性が失われる

### 修正案B: enclose のみ特別扱い（柔軟性を重視）

```typescript
// 基本: 即座適用（現在の挙動）
hint.enclose(container, [s1, s2, s3])

// 高度な使い方: ビルダーパターン
hint.buildEnclose(container)
  .with([s1, s2, s3])
  .grid()  // または .figure() / .auto()
```

**メリット**:
- 基本的な使い方は変わらない（即座適用）
- 高度な使い方として2Dレイアウトを提供
- 一貫性を損なわない（`buildEnclose` は別API）

**デメリット**:
- APIが2つに分かれる（enclose / buildEnclose）
- 学習コストが増える

### 修正案C: オプション引数で制御

```typescript
// 1D配列: デフォルトで即座適用
hint.enclose(container, [s1, s2, s3])

// 2D配列: layoutType オプションで即座適用
hint.enclose(container, [[s1,s2],[s3,s4]], { layout: 'grid' })
hint.enclose(container, [[s1,s2],[s3]], { layout: 'figure' })
hint.enclose(container, [[s1,s2],[s3,s4]], { layout: 'auto' })
```

**メリット**:
- 単一のAPIで完結
- オンライン制約適用を維持
- 型安全性も確保可能（オーバーロード）

**デメリット**:
- オプション引数が必須（省略時の挙動が不明確）
- 型推論が複雑になる可能性

## 🎯 **layout-hint-online の文脈での推奨**

### 推奨: 修正案C（オプション引数）

```typescript
export class HintFactory {
  // 1D配列: 即座に制約を適用
  enclose(container: ContainerSymbolId, children: SymbolId[]): void

  // 2D配列 + layoutType: 即座に適用
  enclose(
    container: ContainerSymbolId,
    matrix: SymbolId[][],
    options: { layout: 'grid' | 'figure' | 'auto' }
  ): void

  // 実装
  enclose(
    container: ContainerSymbolId,
    childrenOrMatrix: SymbolId[] | SymbolId[][],
    options?: { layout?: 'grid' | 'figure' | 'auto' }
  ): void {
    if (is2DArray(childrenOrMatrix)) {
      const matrix = childrenOrMatrix
      const layoutType = options?.layout ?? 'auto'
      
      // 即座に制約を登録
      if (layoutType === 'grid' || (layoutType === 'auto' && isRectMatrix(matrix))) {
        this.layout.constraints.encloseGrid(container, matrix)
      } else {
        this.layout.constraints.encloseFigure(container, matrix)
      }
    } else {
      // 1D: 現在の挙動（即座適用）
      this.layout.constraints.enclose(container, childrenOrMatrix)
    }
    
    // metadata 設定（nestLevel, containerId, registerChild）
    this.applyContainerMetadata(container, flattenMatrix(childrenOrMatrix))
  }
}
```

**理由**:
1. **オンライン制約適用を維持**: すべて即座に `LayoutConstraints` に登録
2. **一貫性**: 他のヒントAPIと同様、呼び出し時に制約を追加
3. **拡張性**: 将来的にオプションを追加可能（gap, padding など）
4. **型安全性**: オーバーロードで型推論をサポート

## 📝 **LayoutConstraints の拡張が必要**

### 新規メソッドの追加

```typescript
export class LayoutConstraints {
  // 既存
  enclose(containerId: ContainerSymbolId, childIds: SymbolId[]): void

  // 新規: Grid レイアウト
  encloseGrid(
    containerId: ContainerSymbolId,
    matrix: SymbolId[][],
    options?: { rowGap?: number; colGap?: number }
  ): void {
    // 1. enclose 制約（Required）
    this.enclose(containerId, matrix.flat())
    
    // 2. Grid 配置制約（Strong）
    this.arrangeGrid(containerId, matrix, options)
  }

  // 新規: Figure レイアウト
  encloseFigure(
    containerId: ContainerSymbolId,
    rows: SymbolId[][],
    options?: { rowGap?: number }
  ): void {
    // 1. enclose 制約（Required）
    this.enclose(containerId, rows.flat())
    
    // 2. 行ごとの配置制約（Strong）
    for (const row of rows) {
      this.arrangeHorizontal(row)
    }
    this.arrangeVertical(rows.map(row => row[0]))  // 各行の先頭を縦配置
  }

  // 新規: Grid 配置のための内部メソッド
  private arrangeGrid(
    containerId: ContainerSymbolId,
    matrix: SymbolId[][],
    options?: { rowGap?: number; colGap?: number }
  ): void {
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
  }
}
```

## 🔄 **オリジナル提案との比較**

| 観点 | オリジナル提案 | 修正案C（推奨） |
|------|----------------|-----------------|
| 制約適用タイミング | 遅延評価（`.apply()`） | 即座適用（オンライン） |
| API一貫性 | enclose のみ特殊 | 全ヒントAPI統一 |
| 型安全性 | ビルダーで型検証 | オーバーロードで型検証 |
| layout-hint-online原則 | **矛盾** | **整合** |
| 学習コスト | ビルダーパターン習得 | 既存パターンの延長 |
| 実装複雑度 | ビルダークラス3つ | オーバーロード+内部メソッド |

## 📋 **実装の優先順位**

### Phase 1: 基盤整備（layout-hint-online 完成）
- [x] LayoutContext / LayoutConstraints / LayoutVariables
- [x] オンライン制約適用
- [x] ContainerSymbolBase / enclose 基本機能
- [x] constraint_helpers → LayoutContext メソッド統合

### Phase 2: 2Dレイアウト実装（次のPR）
- [ ] `LayoutConstraints.encloseGrid()` / `.encloseFigure()`
- [ ] `LayoutConstraints.arrangeGrid()` の実装
- [ ] `HintFactory.enclose()` のオーバーロード拡張
- [ ] Grid/Figure の制約生成ロジック
- [ ] テスト追加（矩形検証、gap計算など）

### Phase 3: オプション拡張（将来）
- [ ] gap/padding のカスタマイズ
- [ ] alignment オプション（left/center/right）
- [ ] 入れ子コンテナの Grid/Figure 対応
- [ ] パフォーマンス最適化

## 🎯 **結論**

### オリジナル提案の評価（layout-hint-online 視点）

**総合評価**: ⭐⭐☆☆☆ (2/5)

**良い点**:
- 2Dレイアウトの必要性は正しい
- 型安全性の向上は価値がある

**問題点**:
- **layout-hint-online の原則と矛盾**（遅延評価）
- **API一貫性の欠如**（enclose のみビルダー）
- **オンライン制約適用の放棄**（`.constraints()` / `.apply()`）

### 推奨アプローチ

**修正案C を採用**: オプション引数による即座適用

```typescript
// シンプル: 従来通り
hint.enclose(container, [a, b, c])

// 2Dレイアウト: オプション指定
hint.enclose(container, [[a,b],[c,d]], { layout: 'grid' })
hint.enclose(container, [[a,b],[c]], { layout: 'figure' })
hint.enclose(container, [[a,b],[c,d]], { layout: 'auto' })
```

**理由**:
1. layout-hint-online の原則を維持
2. オンライン制約適用を保持
3. API の一貫性を確保
4. 段階的実装が可能

### 次のステップ

1. **オリジナル提案者と議論**: 修正案Cの妥当性を確認
2. **LayoutConstraints 拡張の設計**: arrangeGrid/encloseFigure の詳細仕様
3. **テスト戦略の策定**: 矩形検証、制約生成の正確性
4. **ドキュメント更新**: layout-hint-online の一環として記述

layout-hint-online の流れを継続し、enclose 拡張はその延長として位置づけるべきです。


### 現在の enclose API

```typescript
// src/dsl/hint_factory.ts
enclose(containerId: ContainerSymbolId, childIds: LayoutTargetId[]) {
  // 1. nestLevel と containerId を設定
  // 2. ContainerSymbolBase.registerChild() を呼び出し
  // 3. layout.constraints.enclose() で制約を追加
}
```

**特徴**:
- シンプルな1次元配列のみをサポート
- 制約の即時適用（遅延評価なし）
- レイアウト構造（grid/figure）の区別なし

## 📊 レビュー結果

### ✅ 良い点

#### 1. 関心の分離が明確

```typescript
// 制約のみ定義（レイアウトは後で決定）
enclose(container, [s1, s2, s3]).constraints()

// 制約を即座に適用（現在の挙動）
enclose(container, [s1, s2, s3]).apply()
```

- 制約定義とレイアウト適用を分離
- 現在の即時適用挙動を `.apply()` として明示化

#### 2. 2Dレイアウトのサポート

```typescript
// Grid: 矩形配置（N×M）
enclose(container, [[s1,s2],[s3,s4]]).grid()

// Figure: 非矩形配置（行ごとに均等gap）
enclose(container, [[s1,s2],[s3]]).figure()
```

- 構造化されたレイアウトを直感的に表現
- 型レベルで矩形/非矩形を検証

#### 3. 型安全性の向上

```typescript
type IsRectMatrix<T extends Matrix> = ...

class LayoutBuilder<T extends Matrix, Rect extends boolean> {
  grid(): Rect extends true ? GridLayout : never {
    // 型レベルで矩形を保証
  }
}
```

- コンパイル時に矩形行列を検証
- `.grid()` は矩形のみで呼び出し可能

#### 4. 動的ビルダーの提供

```typescript
const b = enclose(container)
b.grid([[s1,s2],[s3,s4]])  // 実行時に構造を決定
b.auto([[s1,s2],[s3]])     // 自動選択
```

- 条件分岐によるレイアウト切り替えが容易
- 実行時の柔軟性を確保

### ⚠️ 懸念点・検討が必要な点

#### 1. **現在のアーキテクチャとの整合性**

**問題**: 現在の `enclose` は即時適用を前提としている

```typescript
// 現在の実装
enclose(containerId, childIds) {
  // nestLevel を即座に設定
  child.nestLevel = containerNestLevel + 1
  child.containerId = containerId
  
  // 制約を即座に追加
  this.layout.constraints.enclose(containerId, childIds)
}
```

**提案**: 制約定義を遅延させる

```typescript
enclose(container, [s1, s2, s3]).constraints() // まだ適用されない
```

**懸念**:
- `nestLevel` / `containerId` の設定タイミングをいつにするか？
- `.constraints()` で制約を返すだけでは、metadata（nest情報）が設定されない
- `.apply()` が呼ばれるまで Symbol の状態が不完全

**推奨**:
- `.constraints()` は純粋な制約オブジェクトを返す
- `.apply()` で初めて Symbol に副作用を与える
- または、`.constraints()` でも metadata は設定する（制約適用は遅延）

#### 2. **LayoutConstraints.enclose との責務分離**

**現状**: `HintFactory.enclose` と `LayoutConstraints.enclose` の役割が混在

```typescript
// HintFactory.enclose
enclose(containerId, childIds) {
  // 1. Symbol metadata 設定（nestLevel, containerId）
  // 2. ContainerSymbolBase への登録
  // 3. 制約の追加（LayoutConstraints.enclose）
}
```

**提案の影響**:
- `.constraints()` / `.apply()` / `.grid()` などの戻り値型が制約情報を保持
- 実際の適用タイミングが分離される
- metadata 設定と制約適用を分ける必要がある

**推奨**:
```typescript
class ConstraintBuilder {
  constraints(): ConstraintPlan {
    // 純粋な制約定義（副作用なし）
    return {
      kind: 'constraints',
      container: this.container,
      children: this.list
    }
  }
  
  apply(): void {
    // 1. metadata 設定
    this.setChildMetadata()
    // 2. 制約適用
    this.applyConstraints()
  }
}
```

#### 3. **2Dレイアウトの実装複雑度**

**提案**: `.grid()` / `.figure()` は新しいレイアウトアルゴリズムを必要とする

```typescript
enclose(container, [[s1,s2],[s3,s4]]).grid()
// → どのように配置を計算するか？
```

**必要な実装**:
- Grid レイアウトエンジン（N×M の均等配置）
- Figure レイアウトエンジン（行ごとの配置）
- padding/gap の計算
- 制約の生成（position/size）

**現状のレイアウトシステムとの統合**:
- 現在は `arrangeHorizontal` / `arrangeVertical` + `enclose` の組み合わせ
- Grid/Figure は高レベルな抽象化
- `LayoutConstraints` に新しいメソッド（`arrangeGrid` / `arrangeFigure`）が必要？

**推奨**:
```typescript
class LayoutConstraints {
  // 新規メソッド
  arrangeGrid(
    containerId: ContainerSymbolId,
    matrix: SymbolId[][],
    options?: { rowGap?: number; colGap?: number }
  ): void
  
  arrangeFigure(
    containerId: ContainerSymbolId,
    rows: SymbolId[][],
    options?: { rowGap?: number }
  ): void
}
```

#### 4. **既存コードへの影響**

**破壊的変更の可能性**:

```typescript
// Before (現在の挙動)
hint.enclose(container, [a, b, c])  // 即座に適用

// After (提案)
hint.enclose(container, [a, b, c])  // ビルダーを返す
hint.enclose(container, [a, b, c]).apply()  // 明示的に適用
```

**影響範囲**:
- `diagram_builder.ts`: DiagramSymbol が全シンボルを enclose
- 既存のユーザーコード（もしあれば）

**推奨**: 段階的移行
```typescript
// Phase 1: 現在の挙動を維持しつつ、新しいAPIを追加
enclose(container, [a, b, c])  // 従来通り即座に適用（deprecated）
enclose(container, [a, b, c]).apply()  // 明示的適用（推奨）

// Phase 2: 破壊的変更
enclose(container, [a, b, c])  // ビルダーを返す（.apply() が必要）
```

#### 5. **ContainerSymbolId の型制約**

**提案**: container パラメータが `C` として汎用的

```typescript
enclose<C, T extends List1D>(container: C, list: T): ConstraintBuilder<T>
```

**現状**: `ContainerSymbolId` を要求

```typescript
enclose(containerId: ContainerSymbolId, childIds: LayoutTargetId[])
```

**懸念**:
- 提案では container の型が緩い（HTMLElement など任意の型）
- 実際には `ContainerSymbolId` である必要がある
- 型安全性が失われる可能性

**推奨**:
```typescript
enclose<T extends List1D>(
  container: ContainerSymbolId,
  list: T
): ConstraintBuilder<T>
```

#### 6. **`.apply()` vs `.enclose()` の命名**

**提案**: `.apply()` で制約を適用

**既存の命名**:
- `hint.enclose()` = コンテナに囲む
- `hint.arrangeHorizontal()` = 水平配置
- `hint.alignTop()` = 上揃え

**一貫性の観点**:
- 他のヒントAPIは即座に適用される（遅延評価なし）
- `.apply()` だけが明示的な適用を必要とするのは一貫性に欠ける

**代替案**:
```typescript
// Option A: ビルダーパターンを全体に適用
hint.arrangeHorizontal([a, b, c]).apply()
hint.alignTop([a, b, c]).apply()

// Option B: enclose のみビルダーパターン（非一貫的だが実用的）
hint.enclose(container, [a, b, c]).apply()
hint.arrangeHorizontal(a, b, c)  // 即座に適用

// Option C: 即座適用版と遅延評価版を分ける
hint.enclose(container, [a, b, c])  // 即座に適用
hint.buildEnclose(container, [a, b, c]).apply()  // 遅延評価
```

**推奨**: Option B（enclose のみビルダー）
- enclose は構造的な配置（grid/figure）をサポートするため特別扱いが妥当
- 他のヒントAPIは単純な制約なので即座適用のまま

### 📝 追加の検討事項

#### 1. **ConstraintPlan の活用方法**

提案では `.constraints()` が `ConstraintPlan` を返すが、その後どう使うか不明確

```typescript
const plan = enclose(container, [a, b, c]).constraints()
// plan をどう扱う？
// - 別のコンテナに適用？
// - 制約のプレビュー？
// - デバッグ情報として表示？
```

**推奨**: ユースケースを明確化
```typescript
// Use case 1: 制約のプレビュー
const plan = hint.enclose(container, [a, b, c]).constraints()
console.log(plan)  // デバッグ用

// Use case 2: 条件分岐
const plan = someCondition 
  ? hint.enclose(container, [a, b, c]).constraints()
  : hint.enclose(container, [d, e, f]).constraints()
plan.apply()  // 選択された制約を適用

// Use case 3: 制約の保存・再利用
const savedLayout = hint.enclose(container, matrix).grid().constraints()
// 後で別のダイアグラムに適用
```

#### 2. **Grid/Figure のレイアウトオプション**

現在の提案では gap などのオプションが不明確

```typescript
enclose(container, [[a,b],[c,d]]).grid()
// → gap はどうなる？Theme から？
```

**推奨**: オプションの明示化
```typescript
class LayoutBuilder {
  grid(options?: {
    rowGap?: number
    colGap?: number
    padding?: Padding
  }): GridLayout
  
  figure(options?: {
    rowGap?: number
    horizontalAlign?: 'left' | 'center' | 'right'
  }): FigureLayout
}
```

#### 3. **入れ子コンテナのサポート**

現在の実装は入れ子コンテナをサポート済み

```typescript
// 現在
hint.enclose(outerContainer, [innerContainer, symbol1])
```

**提案での扱い**:
```typescript
// 2D配列での入れ子？
enclose(outer, [[inner, s1], [s2, s3]]).grid()
// → inner は ContainerSymbolId だが、どう扱う？
```

**推奨**: 入れ子の扱いを仕様に明記
- 1D: 入れ子可能（現在の挙動を維持）
- 2D: 入れ子の扱いを定義（grid/figure での配置）

## 🎯 総合評価と推奨事項

### ✅ 採用すべき点

1. **制約定義と適用の分離**（`.constraints()` / `.apply()`）
   - テスタビリティ向上
   - 柔軟なレイアウト構築

2. **2Dレイアウトのサポート**（Grid/Figure）
   - 構造的なレイアウトを直感的に表現
   - 複雑なダイアグラムの作成が容易に

3. **型安全性の向上**（IsRectMatrix など）
   - コンパイル時検証
   - 実行時エラーの削減

### ⚠️ 変更・追加が必要な点

#### 1. **段階的実装を推奨**

**Phase 1: 基盤整備（このPR後の次のPR）**
- `ConstraintBuilder` / `LayoutBuilder` クラスの追加
- `.apply()` メソッドの実装（現在の挙動を維持）
- 既存の `enclose` を deprecated として残す

**Phase 2: 2Dレイアウト実装**
- `LayoutConstraints.arrangeGrid()` / `.arrangeFigure()` の実装
- Grid/Figure レイアウトエンジンの開発
- テストとドキュメント整備

**Phase 3: 動的ビルダー追加**
- `DynamicBuilder` の実装
- `.auto()` による自動選択
- 実行時最適化

#### 2. **仕様の明確化が必要**

以下の点をドラフトに追記すべき:

1. **metadata 設定のタイミング**
   - `.constraints()` で設定する？`.apply()` で設定する？
   
2. **ConstraintPlan のユースケース**
   - どのように活用するか具体例を提示

3. **Grid/Figure のレイアウトアルゴリズム**
   - 配置計算の詳細（padding, gap, alignment）

4. **オプション引数の設計**
   - gap/padding のカスタマイズ方法

5. **入れ子コンテナの扱い**
   - 2D配列での入れ子の挙動

6. **既存コードとの互換性**
   - 破壊的変更の有無と移行パス

#### 3. **命名の再検討**

現在の提案:
- `.apply()`: 制約を適用して配置

代替案:
- `.build()`: レイアウトを構築
- `.execute()`: 制約を実行
- `.render()`: レイアウトを描画（ただし描画とは異なる）

**推奨**: `.apply()` を維持
- 「制約を適用する」という意味が明確
- 他のAPIとの一貫性（`.constraints().apply()`）

#### 4. **型定義の改善**

```typescript
// 現在の提案
enclose<C, T extends List1D>(container: C, list: T)

// 推奨
enclose<T extends List1D>(
  container: ContainerSymbolId,
  list: T
): ConstraintBuilder<T>
```

## 📋 実装前のチェックリスト

- [ ] 現在の `enclose` の全使用箇所を調査
- [ ] metadata 設定タイミングの設計を決定
- [ ] Grid/Figure レイアウトアルゴリズムの設計
- [ ] `LayoutConstraints` への新規メソッド追加
- [ ] 破壊的変更の有無と移行戦略の決定
- [ ] テスト戦略の策定（単体/統合）
- [ ] ドキュメント整備（JSDoc, 使用例）
- [ ] パフォーマンス影響の評価（2D配列の処理）

## 🎯 結論

### 総合評価: ⭐⭐⭐⭐☆ (4/5)

**良い点**:
- 直感的で表現力の高いAPI
- 型安全性の向上
- 柔軟性と拡張性

**懸念点**:
- 実装複雑度が高い
- 既存アーキテクチャとの統合に注意が必要
- 仕様の詳細化が必要

### 推奨アプローチ

**今回のPRには含めない**: 
- 現在のPRは「LayoutContext のファサード化」に焦点
- enclose の拡張は独立した大きなトピック

**次のフェーズで段階的に実施**:
1. **Phase 1**: ConstraintBuilder 導入（非破壊的）
2. **Phase 2**: 2Dレイアウト実装（Grid/Figure）
3. **Phase 3**: 動的ビルダーと最適化

**事前準備**:
- 仕様の詳細化（上記の懸念点を解消）
- 既存の enclose 使用箇所の調査
- レイアウトアルゴリズムのプロトタイプ

この提案は kiwumil のレイアウトシステムを大幅に強化する可能性がありますが、慎重な設計と段階的実装が必要です。
