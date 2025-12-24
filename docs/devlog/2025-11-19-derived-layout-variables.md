# 派生レイアウト変数の実装

**日付:** 2025-11-19  
**作業ブランチ:** feat/layout-context-rework  
**関連draft:** docs/draft/2025-11-19-symbol-kiwi-variables-status.md

## 📋 概要

LayoutBounds に派生変数（`right`, `bottom`, `centerX`, `centerY`）を追加し、Guide API などで毎回計算していた式を簡潔化しました。

## 🎯 背景

### 問題点

```typescript
// Before: 毎回 expression を作成
guide.alignRight(...symbols)
// 内部で以下を毎回計算:
// expression([{ variable: bounds.x }, { variable: bounds.width }])
```

**課題:**
- コードの冗長性
- 同じ式を複数回計算（パフォーマンス低下）
- API が直感的でない

### 目標

```typescript
// After: 派生変数を直接参照
guide.alignRight(...symbols)
// 内部: bounds.right で直接参照

// ユーザーコード:
hint.createGuideY(symbol.bottom)  // シンプル！
```

## 🛠️ 実装内容

### 1. LayoutBounds をクラス化

**変更:** `interface LayoutBounds` → `class LayoutBounds`

**src/model/symbol_base.ts:**

```typescript
export class LayoutBounds {
  readonly x: LayoutVar
  readonly y: LayoutVar
  readonly width: LayoutVar
  readonly height: LayoutVar

  private _right?: LayoutVar
  private _bottom?: LayoutVar
  private _centerX?: LayoutVar
  private _centerY?: LayoutVar

  constructor(
    private readonly ctx: LayoutVariables,
    x: LayoutVar,
    y: LayoutVar,
    width: LayoutVar,
    height: LayoutVar
  ) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }

  get right(): LayoutVar {
    if (!this._right) {
      this._right = this.ctx.createVar(`${this.x.name}.right`)
      this.ctx.addConstraint(
        this._right,
        Operator.Eq,
        this.ctx.expression([{ variable: this.x }, { variable: this.width }])
      )
    }
    return this._right
  }

  get bottom(): LayoutVar {
    if (!this._bottom) {
      this._bottom = this.ctx.createVar(`${this.y.name}.bottom`)
      this.ctx.addConstraint(
        this._bottom,
        Operator.Eq,
        this.ctx.expression([{ variable: this.y }, { variable: this.height }])
      )
    }
    return this._bottom
  }

  get centerX(): LayoutVar {
    if (!this._centerX) {
      this._centerX = this.ctx.createVar(`${this.x.name}.centerX`)
      this.ctx.addConstraint(
        this._centerX,
        Operator.Eq,
        this.ctx.expression([
          { variable: this.x },
          { variable: this.width, coefficient: 0.5 }
        ])
      )
    }
    return this._centerX
  }

  get centerY(): LayoutVar {
    if (!this._centerY) {
      this._centerY = this.ctx.createVar(`${this.y.name}.centerY`)
      this.ctx.addConstraint(
        this._centerY,
        Operator.Eq,
        this.ctx.expression([
          { variable: this.y },
          { variable: this.height, coefficient: 0.5 }
        ])
      )
    }
    return this._centerY
  }
}
```

**設計ポイント:**
- **遅延生成:** getter で初回アクセス時のみ変数と制約を生成
- **キャッシュ:** 2回目以降は生成済みの変数を返す
- **自動制約:** 派生変数は自動的に制約式として登録される

**生成される制約:**
```
right = x + width
bottom = y + height
centerX = x + width * 0.5
centerY = y + height * 0.5
```

### 2. SymbolBase の更新

**src/model/symbol_base.ts:**

```typescript
protected attachLayoutContext(ctx: LayoutVariables) {
  if (this.layoutBounds) {
    return
  }
  this.layoutContext = ctx
  this.layoutBounds = new LayoutBounds(
    ctx,
    ctx.createVar(`${this.id}.x`),
    ctx.createVar(`${this.id}.y`),
    ctx.createVar(`${this.id}.width`),
    ctx.createVar(`${this.id}.height`)
  )
}
```

### 3. ContainerSymbolBase の更新

**src/model/container_symbol_base.ts:**

```typescript
// import 修正: type import → 通常 import
import { SymbolBase, LayoutBounds } from "./symbol_base"

protected ensureContentBounds(): LayoutBounds {
  if (!this.contentBounds) {
    const vars = this.layout.variables
    this.contentBounds = new LayoutBounds(
      vars,
      vars.createVar(`${this.id}.content.x`),
      vars.createVar(`${this.id}.content.y`),
      vars.createVar(`${this.id}.content.width`),
      vars.createVar(`${this.id}.content.height`)
    )
  }
  // ...
  return this.contentBounds
}
```

### 4. GuideBuilderX のリファクタリング

**src/dsl/hint_factory.ts:**

#### Before: 冗長な expression

```typescript
alignRight(...symbolIds: LayoutTarget[]) {
  this.collect(symbolIds)
  for (const id of symbolIds) {
    const symbol = this.resolveSymbol(id)
    if (!symbol) continue
    const bounds = symbol.ensureLayoutBounds(this.layout.variables)
    this.layout.variables.addConstraint(
      this.layout.variables.expression([
        { variable: bounds.x },
        { variable: bounds.width }
      ]),
      LayoutConstraintOperator.Eq,
      this.x,
      LayoutConstraintStrength.Strong
    )
  }
  return this
}
```

#### After: 派生変数を直接使用

```typescript
alignRight(...symbolIds: LayoutTarget[]) {
  this.collect(symbolIds)
  for (const id of symbolIds) {
    const symbol = this.resolveSymbol(id)
    if (!symbol) continue
    const bounds = symbol.ensureLayoutBounds(this.layout.variables)
    this.layout.variables.addConstraint(
      bounds.right,
      LayoutConstraintOperator.Eq,
      this.x,
      LayoutConstraintStrength.Strong
    )
  }
  return this
}
```

**同様に修正したメソッド:**
- `GuideBuilderX`:
  - `alignRight()` → `bounds.right`
  - `alignCenter()` → `bounds.centerX`
  - `followRight()` → `bounds.right`
  - `followCenter()` → `bounds.centerX`

- `GuideBuilderY`:
  - `alignBottom()` → `bounds.bottom`
  - `alignCenter()` → `bounds.centerY`
  - `followBottom()` → `bounds.bottom`
  - `followCenter()` → `bounds.centerY`

## 📊 効果

### コード簡潔化

**Before:**
```typescript
this.layout.variables.expression([
  { variable: bounds.x },
  { variable: bounds.width }
])
```

**After:**
```typescript
bounds.right
```

**削減行数:** Guide API だけで約60行削減

### パフォーマンス向上

- 同じ派生変数を複数回参照しても式は1回だけ生成
- 制約も1回だけ登録

**例:**
```typescript
guide1.alignRight(symbolA, symbolB)
guide2.followRight(symbolA)  // symbolA.right は再利用
```

### API改善

```typescript
// 将来的に可能な直感的な記述
hint.createGuideY(symbol.bottom)
hint.createGuideX(symbol.centerX)

// constraint_helpers でも利用可能
builder.eq(symbolA.bounds.right, symbolB.bounds.left, -10)  // 10px gap
```

## ✅ テスト結果

```
bun test
✓ 66 pass
✓ 0 fail
```

全テストが通過し、既存機能に影響なし。

## 🎯 今後の拡張可能性

### 1. より複雑な派生変数

```typescript
get area(): LayoutVar {
  // width * height を表す変数（将来的に必要になった場合）
}
```

### 2. ユーザーAPI公開

```typescript
// Symbolから直接アクセス
const bounds = symbol.getLayoutBounds()
hint.createGuideY(bounds.bottom)
```

### 3. カスタム制約の簡潔化

```typescript
// constraint_helpers での利用
builder.ge(containerBounds.width, childBounds.right, 10)  // padding
```

## 📝 残課題

次のPhaseとして以下を検討:

1. ✅ **Guide API のドキュメント整備**
   - layout-system.md に派生変数の説明追加
   - 使用例の追加

2. 🔜 **Example の作成**
   - example/derived_variables.ts
   - 派生変数を活用したレイアウト例

3. 🔜 **Relationship対応（長期）**
   - ガイド沿いルーティング
   - 制御点の LayoutVar 化

## 📌 まとめ

**成果:**
- ✅ LayoutBounds をクラス化して派生変数を実装
- ✅ Guide API を大幅に簡潔化（約60行削減）
- ✅ パフォーマンス向上（式の再計算を防止）
- ✅ 全テスト通過（66テスト）

**次のステップ:**
- ドキュメント整備
- example 追加
- docs/draft の更新

**コミット準備完了！**

---

## Phase 2: ドキュメント整備（完了）

**日付:** 2025-11-19  
**作業内容:** Guide API と派生変数のドキュメント整備

### 実施内容

1. **layout-system.md の更新**
   - Guide API セクションを追加（約400行）
   - GuideBuilderX/Y の全メソッドを網羅
   - 派生変数のセクションを追加
   - 実装詳細、使用例、応用例を記載

2. **example/guide_layout.ts の作成**
   - Guide API の基本的な使用例を実装
   - X軸中央揃え + 縦並びのデモ
   - 実行可能な実例を提供

### ドキュメント内容

#### Guide API セクション
- 基本的な使い方（createGuideX/Y）
- GuideBuilderX のメソッド一覧
- GuideBuilderY のメソッド一覧
- align vs follow の違い
- 応用例（複雑な整列、マルチカラム、ベースライン揃え）

#### 派生変数セクション
- 派生変数の種類（right/bottom/centerX/centerY）
- 実装詳細（遅延生成・キャッシュ）
- 使用例（Guide API、カスタム制約）
- パフォーマンス効果

### 成果

- ✅ layout-system.md: 完全なGuide APIドキュメント
- ✅ example/guide_layout.ts: 実行可能なサンプル
- ✅ docs/design/layout-system.md: 1526行 → 1900行以上に拡充

### 次のステップ

Phase 2 完了により、派生変数実装プロジェクトは完了。
残作業は docs/draft の整理のみ。
