# Kiwumil レイアウトシステム設計書

## 概要

Kiwumil のレイアウトシステムは、制約ベースの自動レイアウトエンジンです。
Cassowary アルゴリズムを使用して、宣言的なレイアウトヒントから最適な配置を計算します。

**🎉 First Milestone 達成済み:** Enclose内要素の自動配置が実装されました。

---

## 設計哲学

### 1. 宣言的 API
ユーザーは「どう配置するか」ではなく「どう配置されるべきか」を宣言します。

```typescript
// ❌ 命令的（座標を直接指定）
a.setPosition(100, 200)
b.setPosition(150, 200)

// ✅ 宣言的（関係を指定）
hint.arrangeHorizontal(a, b)
```

### 2. 制約の組み合わせ
複数のレイアウトヒントを組み合わせて複雑な配置を実現します。

```typescript
hint.arrangeVertical(a, b, c)    // 縦に並べる
hint.alignCenterX(a, b, c)       // X軸中央を揃える
```

### 3. 直感的な命名
- **Arrange** = 配置（要素を並べる）
- **Align** = 整列（位置を揃える）

---

## API 設計

### 実装状況

| カテゴリ | メソッド | 状態 |
|---------|---------|------|
| Arrange | `arrangeHorizontal` | ✅ 実装済み |
| Arrange | `arrangeVertical` | ✅ 実装済み |
| Align | `alignLeft` | ✅ 実装済み |
| Align | `alignRight` | ✅ 実装済み |
| Align | `alignTop` | ✅ 実装済み |
| Align | `alignBottom` | ✅ 実装済み |
| Align | `alignCenterX` | ✅ 実装済み |
| Align | `alignCenterY` | ✅ 実装済み |
| Container | `enclose` | ✅ 実装済み（将来削除予定） |
| Legacy | `horizontal` | ✅ 実装済み（deprecated） |
| Legacy | `vertical` | ✅ 実装済み（deprecated） |

### Arrange（配置）- 要素を並べる

#### `arrangeHorizontal(...elements: SymbolId[])`
要素を水平方向に等間隔で並べます。

```typescript
hint.arrangeHorizontal(a, b, c)

結果: a --- b --- c
```

**制約:**
- 要素間の距離が等しい
- 左から右の順序で配置
- デフォルト間隔: 80px
- 制約強度: STRONG（enclose制約より優先）

**実装詳細:**
```typescript
// layout_solver.ts
private addHorizontalConstraints(symbolIds: string[], gap: number) {
  for (let i = 0; i < symbolIds.length - 1; i++) {
    const a = this.vars.get(symbolIds[i])!
    const b = this.vars.get(symbolIds[i + 1])!
    
    // b.x = a.x + a.width + gap (STRONG strength)
    this.solver.addConstraint(
      new kiwi.Constraint(
        new kiwi.Expression(b.x),
        kiwi.Operator.Eq,
        new kiwi.Expression(a.x, a.width, gap),
        kiwi.Strength.strong
      )
    )
    
    // Y軸を揃える (STRONG strength)
    this.solver.addConstraint(
      new kiwi.Constraint(
        new kiwi.Expression(b.y),
        kiwi.Operator.Eq,
        new kiwi.Expression(a.y),
        kiwi.Strength.strong
      )
    )
  }
}
```

#### `arrangeVertical(...elements: SymbolId[])`
要素を垂直方向に等間隔で並べます。

```typescript
hint.arrangeVertical(a, b, c)

結果:
a
|
b
|
c
```

**制約:**
- 要素間の距離が等しい
- 上から下の順序で配置
- デフォルト間隔: 50px
- 制約強度: STRONG（enclose制約より優先）

**実装詳細:**
```typescript
// layout_solver.ts
private addVerticalConstraints(symbolIds: string[], gap: number) {
  for (let i = 0; i < symbolIds.length - 1; i++) {
    const a = this.vars.get(symbolIds[i])!
    const b = this.vars.get(symbolIds[i + 1])!
    
    // b.y = a.y + a.height + gap (STRONG strength)
    this.solver.addConstraint(
      new kiwi.Constraint(
        new kiwi.Expression(b.y),
        kiwi.Operator.Eq,
        new kiwi.Expression(a.y, a.height, gap),
        kiwi.Strength.strong
      )
    )
    
    // X軸を揃える (STRONG strength)
    this.solver.addConstraint(
      new kiwi.Constraint(
        new kiwi.Expression(b.x),
        kiwi.Operator.Eq,
        new kiwi.Expression(a.x),
        kiwi.Strength.strong
      )
    )
  }
}
```

---

### Align（整列）- 位置を揃える

#### 水平方向の整列

##### `alignLeft(...elements: SymbolId[])`
要素の左端を揃えます。

```typescript
hint.alignLeft(a, b, c)

結果:
|a
|bb
|ccc
(左端が揃う)
```

##### `alignRight(...elements: SymbolId[])`
要素の右端を揃えます。

```typescript
hint.alignRight(a, b, c)

結果:
  a|
 bb|
ccc|
(右端が揃う)
```

##### `alignCenterX(...elements: SymbolId[])`
要素のX軸中央を揃えます。

```typescript
hint.alignCenterX(a, b, c)

結果:
  a
 bb
ccc
(X軸中央が揃う)
```

**よくある使い方:**
```typescript
// 垂直に並べてX軸中央揃え
hint.arrangeVertical(a, b, c)
hint.alignCenterX(a, b, c)
```

#### 垂直方向の整列

##### `alignTop(...elements: SymbolId[])`
要素の上端を揃えます。

```typescript
hint.alignTop(a, b, c)

結果: ___
     |a|bb|ccc|
```

##### `alignBottom(...elements: SymbolId[])`
要素の下端を揃えます。

```typescript
hint.alignBottom(a, b, c)

結果:
     |a|bb|ccc|
     ‾‾‾
```

##### `alignCenterY(...elements: SymbolId[])`
要素のY軸中央を揃えます。

```typescript
hint.alignCenterY(a, b, c)

結果: a  bb  ccc  (Y軸中央が揃う)
```

**よくある使い方:**
```typescript
// 水平に並べてY軸中央揃え
hint.arrangeHorizontal(a, b, c)
hint.alignCenterY(a, b, c)
```

---

### Pack（コンテナ）- 暫定的に残す

#### `pack(container: SymbolId, children: SymbolId[])`
コンテナ内に子要素を配置します。

```typescript
hint.enclose(boundary, [a, b, c])
```

**制約:**
- 子要素がコンテナ内に収まる
- コンテナがパディングを持つ
- **コンテナサイズが自動的に子要素に合わせて拡大**
- 子要素の配置は別途 `arrange` で指定

**⚠️ 注意:**
`enclose` は将来的に削除予定です。代わりに `arrange` + `align` の組み合わせを使用してください。

**✅ 現在の実装:**
```typescript
// コンテナと子要素を組み合わせて使う
hint.enclose(boundary, [a, b, c])
hint.arrangeVertical(a, b, c)  // ✅ 重ならずに配置される

結果:
┌─────────┐
│    a    │
│    b    │  ← 自動的に縦に並ぶ
│    c    │
└─────────┘
 ↑ コンテナが自動拡大
```

**実装詳細:**

1. **コンテナのサイズ制約:**
```typescript
// コンテナは最小サイズのみ指定（WEAK）
const isContainer = hints.some(h => h.type === "enclose" && h.containerId === symbol.id)

if (isContainer) {
  // 最小サイズのみ（子要素に合わせて拡大可能）
  this.solver.addConstraint(
    new kiwi.Constraint(
      new kiwi.Expression(v.width), 
      kiwi.Operator.Ge, 
      100, 
      kiwi.Strength.weak
    )
  )
  this.solver.addConstraint(
    new kiwi.Constraint(
      new kiwi.Expression(v.height), 
      kiwi.Operator.Ge, 
      100, 
      kiwi.Strength.weak
    )
  )
}
```

2. **Pack制約（子要素の配置とコンテナの拡大）:**
```typescript
private addPackConstraints(containerId: string, childIds: string[]) {
  const container = this.vars.get(containerId)!
  const padding = 20

  for (const childId of childIds) {
    const child = this.vars.get(childId)!

    // 子要素の最小位置制約（コンテナ内に配置）
    // child.x >= container.x + padding
    this.solver.addConstraint(
      new kiwi.Constraint(
        new kiwi.Expression(child.x),
        kiwi.Operator.Ge,
        new kiwi.Expression(container.x, padding),
        kiwi.Strength.required
      )
    )

    // child.y >= container.y + 50 (ラベルスペース考慮)
    this.solver.addConstraint(
      new kiwi.Constraint(
        new kiwi.Expression(child.y),
        kiwi.Operator.Ge,
        new kiwi.Expression(container.y, 50),
        kiwi.Strength.required
      )
    )

    // コンテナを子要素に合わせて拡大（重要！）
    // container.width + container.x >= child.x + child.width + padding
    this.solver.addConstraint(
      new kiwi.Constraint(
        new kiwi.Expression(container.width, container.x),
        kiwi.Operator.Ge,
        new kiwi.Expression(child.x, child.width, padding),
        kiwi.Strength.required
      )
    )

    // container.height + container.y >= child.y + child.height + padding
    this.solver.addConstraint(
      new kiwi.Constraint(
        new kiwi.Expression(container.height, container.y),
        kiwi.Operator.Ge,
        new kiwi.Expression(child.y, child.height, padding),
        kiwi.Strength.required
      )
    )
  }
}
```

**キーポイント:**
- コンテナのサイズは固定せず、最小サイズのみ指定（WEAK制約）
- 子要素の位置に応じてコンテナが自動的に拡大（REQUIRED制約）
- `arrange` 制約（STRONG）と `enclose` 制約（REQUIRED）は競合しない

---

## 制約の組み合わせ

### パターン1: 垂直スタック + X軸中央揃え

```typescript
hint.arrangeVertical(a, b, c)
hint.alignCenterX(a, b, c)

結果:
    a
   bbb
  ccccc
(中央揃えの縦並び)
```

### パターン2: 水平スタック + Y軸中央揃え

```typescript
hint.arrangeHorizontal(a, b, c)
hint.alignCenterY(a, b, c)

結果:
  a
bbb ccccc
  a
(中央揃えの横並び)
```

### パターン3: グリッドレイアウト（将来対応）

```typescript
// 行ごとに配置
hint.arrangeHorizontal(a, b, c)
hint.arrangeHorizontal(d, e, f)
hint.arrangeVertical(a, d)
hint.arrangeVertical(b, e)
hint.arrangeVertical(c, f)

結果:
a b c
d e f
```

### パターン4: コンテナ内配置

```typescript
hint.enclose(container, [a, b, c])
hint.arrangeVertical(a, b, c)
hint.alignCenterX(a, b, c)

結果: container内に中央揃えで縦並び
┌─────────┐
│    a    │
│   bbb   │
│  ccccc  │
└─────────┘
```

---

## 内部実装

### 制約ソルバー（Cassowary）

各レイアウトヒントは制約として表現されます：

```typescript
// arrangeHorizontal(a, b, c) の制約
b.x = a.x + a.width + gap
c.x = b.x + b.width + gap

// alignCenterX(a, b, c) の制約
a.centerX = b.centerX
b.centerX = c.centerX

// pack(container, [a, b]) の制約
a.x >= container.x + padding
a.y >= container.y + padding
a.x + a.width <= container.x + container.width - padding
a.y + a.height <= container.y + container.height - padding
(同様にbについても)
```

### LayoutHint の型定義

```typescript
export interface LayoutHint {
  type: 
    | "horizontal"           // deprecated: use arrangeHorizontal
    | "vertical"             // deprecated: use arrangeVertical
    | "arrangeHorizontal"    // ✅ 実装済み
    | "arrangeVertical"      // ✅ 実装済み
    | "alignLeft"            // ✅ 実装済み
    | "alignRight"           // ✅ 実装済み
    | "alignTop"             // ✅ 実装済み
    | "alignBottom"          // ✅ 実装済み
    | "alignCenterX"         // ✅ 実装済み
    | "alignCenterY"         // ✅ 実装済み
    | "enclose"                 // ✅ 実装済み（将来削除予定）
  symbolIds: SymbolId[]
  gap?: number
  containerId?: SymbolId
  childIds?: SymbolId[]
}
```

### 制約強度の設定

| 制約タイプ | 強度 | 理由 |
|-----------|------|------|
| Arrange (horizontal/vertical) | STRONG | 要素間の間隔を厳密に保つ |
| Align (left/right/top/bottom/centerX/centerY) | STRONG | 整列を厳密に保つ |
| Pack (子要素の最小位置) | REQUIRED | 子要素が必ずコンテナ内に配置される |
| Pack (コンテナの拡大) | REQUIRED | コンテナが必ず子要素を含むサイズになる |
| コンテナの最小サイズ | WEAK | 子要素に応じて拡大可能 |
| 非コンテナのサイズ | REQUIRED (Eq) | サイズは固定 |

---

## First Milestone: Enclose内要素の自動配置 ✅ 達成

### 目標
コンテナ（SystemBoundary）内の複数要素を自動的に配置し、重ならないようにする。

### 実装前の問題

```typescript
hint.enclose(boundary, [a, b, c])
// ❌ a, b, c が重なる（デフォルトで同じ位置に配置される）
```

### 解決方法 ✅ 実装完了

```typescript
hint.enclose(boundary, [a, b, c])
hint.arrangeVertical(a, b, c)  // ✅ enclose + arrange で並ぶ
```

**実装結果:**
```
usecase_0 (A): x=50, y=50, w=120, h=60
usecase_1 (B): x=50, y=160, w=120, h=60  ← gap=50
usecase_2 (C): x=50, y=270, w=120, h=60  ← gap=50
systemBoundary (Container): x=30, y=0, w=160, h=350  ← 自動拡大！
```

### 実装の課題と解決策

#### 課題1: 制約の競合
以前は `enclose` と `arrange` の制約が競合してエラーになっていました：

```typescript
hint.arrangeVertical(a, b, c)     // まず垂直制約を追加
hint.enclose(boundary, [a, b, c])    // ❌ enclose制約と競合してエラー
```

**解決策:**
1. コンテナのサイズを固定せず、変数化（WEAK制約）
2. `arrange` 制約を STRONG に設定
3. `enclose` の位置制約を REQUIRED に設定
4. コンテナサイズ拡大制約を REQUIRED に設定

制約の優先順位:
- **REQUIRED**: Pack制約（子要素の最小位置、コンテナの拡大）
- **STRONG**: Arrange制約（要素間の間隔）
- **WEAK**: コンテナの最小サイズ

この優先順位により、制約が競合せずに解決されます。

#### 課題2: コンテナサイズの固定
以前はコンテナサイズが固定値（300x200）でした。

**解決策:**
- コンテナを検出（`isContainer`フラグ）
- コンテナは最小サイズのみ指定（`width >= 100`, `height >= 100`）
- 子要素の配置に応じて自動的に拡大

```typescript
// コンテナ検出
const isContainer = hints.some(h => 
  h.type === "enclose" && h.containerId === symbol.id
)

if (isContainer) {
  // 最小サイズのみ（拡大可能）
  this.solver.addConstraint(
    new kiwi.Constraint(
      new kiwi.Expression(v.width), 
      kiwi.Operator.Ge, 
      100, 
      kiwi.Strength.weak
    )
  )
}
```

### 結果

✅ **Pack + Arrange の組み合わせが正常に動作**  
✅ **要素が重ならずに配置される**  
✅ **コンテナサイズが自動的に拡大**  
✅ **制約の競合が解決**

**First Milestone 達成！** 🎉

---

## 将来の拡張

### Phase 2: Grid Layout

```typescript
hint.arrangeGrid(a, b, c, d, e, f, { 
  columns: 3,
  gap: 20 
})

結果:
a b c
d e f
```

### Phase 3: Distribute（等間隔配置）

```typescript
hint.distributeHorizontal(a, b, c)  // 全体の幅に均等配置
hint.distributeVertical(a, b, c)    // 全体の高さに均等配置
```

### Phase 4: Flexbox風レイアウト

```typescript
hint.flex(container, [a, b, c], {
  direction: 'row',
  justifyContent: 'space-between',
  alignItems: 'center'
})
```

---

## Enclose の段階的削除計画

### Phase 1: 現在（v0.1.x）
- `enclose` を維持
- `arrange` + `enclose` の組み合わせをサポート

### Phase 2: 移行期（v0.2.x）
- `enclose` を deprecate
- `SystemBoundary` が自動的に子要素を囲むように改善
- ドキュメントで代替方法を案内

### Phase 3: 削除（v1.0.x）
- `enclose` を削除
- `arrange` + `align` のみで表現

**代替方法の例:**
```typescript
// Before (pack使用)
hint.enclose(boundary, [a, b, c])
hint.arrangeVertical(a, b, c)

// After (pack削除後)
hint.arrangeVertical(a, b, c)
hint.alignCenterX(a, b, c)
// boundaryは自動的にa, b, cを囲むサイズに調整される
```

---

## まとめ

Kiwumil のレイアウトシステムは、宣言的で直感的な API を提供します：

✅ **Arrange** で要素を並べる  
✅ **Align** で位置を揃える  
✅ **自動サイズ調整コンテナ** でレイアウトを簡素化  
✅ 制約の組み合わせで複雑なレイアウトを実現  
✅ 将来的に Grid, Distribute, Flexbox 風レイアウトにも対応予定

**First Milestone 達成！** 🎉  
Pack 内要素の自動配置をサポートし、ユーザーが直感的にレイアウトを記述できるようになりました。

### 実装済み機能（v0.1.x）

- ✅ arrangeHorizontal / arrangeVertical
- ✅ alignLeft / alignRight / alignTop / alignBottom
- ✅ alignCenterX / alignCenterY
- ✅ Pack + Arrange の組み合わせ
- ✅ 自動サイズ調整コンテナ
- ✅ 制約の優先度調整による競合解決

### 次のステップ

**Phase 2: 高度なレイアウト**
- Grid Layout (`arrangeGrid`)
- Distribute（等間隔配置）
- Flexbox風レイアウト

**Phase 3: Pack の段階的削除**
- SystemBoundary が自動的に子要素を囲むように改善
- Pack を deprecate
- 最終的に削除（v1.0.x）
