# Kiwumil レイアウトシステム設計書

## 概要

Kiwumil のレイアウトシステムは、制約ベースの自動レイアウトエンジンです。
Cassowary アルゴリズムを使用して、宣言的なレイアウトヒントから最適な配置を計算します。

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
hint.pack(boundary, [a, b, c])
```

**制約:**
- 子要素がコンテナ内に収まる
- コンテナがパディングを持つ
- 子要素の配置は別途 `arrange` で指定

**⚠️ 注意:**
`pack` は将来的に削除予定です。代わりに `arrange` + `align` の組み合わせを使用してください。

**現在の問題:**
```typescript
// ❌ 子要素が重なる
hint.pack(boundary, [a, b, c])

// ✅ arrangeと組み合わせて使う
hint.pack(boundary, [a, b, c])
hint.arrangeVertical(a, b, c)
```

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
hint.pack(container, [a, b, c])
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
    | "arrangeHorizontal"
    | "arrangeVertical"
    | "alignLeft"
    | "alignRight"
    | "alignTop"
    | "alignBottom"
    | "alignCenterX"
    | "alignCenterY"
    | "pack"
  symbolIds: SymbolId[]
  gap?: number
  containerId?: SymbolId
  childIds?: SymbolId[]
}
```

---

## First Milestone: Pack内要素の自動配置

### 現状の問題

```typescript
hint.pack(boundary, [a, b, c])
// ❌ a, b, c が重なる（デフォルトで同じ位置に配置される）
```

### 解決方法

```typescript
hint.pack(boundary, [a, b, c])
hint.arrangeVertical(a, b, c)  // ✅ pack + arrange で並ぶ
```

### 実装の課題

以前は `pack` と `arrange` の制約が競合してエラーになっていました：

```typescript
hint.arrangeVertical(a, b, c)     // まず垂直制約を追加
hint.pack(boundary, [a, b, c])    // ❌ pack制約と競合
```

**解決策:**
1. `pack` 制約を先に追加
2. `arrange` 制約を後から追加
3. 制約の優先度を調整（pack は WEAK、arrange は MEDIUM）

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

## Pack の段階的削除計画

### Phase 1: 現在（v0.1.x）
- `pack` を維持
- `arrange` + `pack` の組み合わせをサポート

### Phase 2: 移行期（v0.2.x）
- `pack` を deprecate
- `SystemBoundary` が自動的に子要素を囲むように改善
- ドキュメントで代替方法を案内

### Phase 3: 削除（v1.0.x）
- `pack` を削除
- `arrange` + `align` のみで表現

**代替方法の例:**
```typescript
// Before (pack使用)
hint.pack(boundary, [a, b, c])
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
✅ 制約の組み合わせで複雑なレイアウトを実現  
✅ 将来的に Grid, Distribute, Flexbox 風レイアウトにも対応予定

現在の First Milestone は、Pack 内要素の自動配置をサポートし、ユーザーが直感的にレイアウトを記述できるようにすることです。
