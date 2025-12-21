[日本語](layout-system.ja.md) | English

# Kiwumil レイアウトシステム設計書

## 概要

Kiwumil のレイアウトシステムは、Cassowary アルゴリズムを使用した制約ベースの自動レイアウトエンジンです。
このドキュメントでは、レイアウトシステムの内部実装とアーキテクチャについて説明します。

ユーザー向けのレイアウトヒント API については [Layout Hints API](./layout-hints.md) を参照してください。

---

## アーキテクチャ

### 型とインターフェースの配置

Kiwumil は `src/core` モジュールで公開インターフェースを集約し、アーキテクチャの境界を明確化しています。

**`src/core/`** - 公開コアインターフェース:
- `symbols.ts`: `SymbolId`, `Point`, `ISymbol`, `ISymbolCharacs`, `Variable`, `LayoutConstraintId`, `ILayoutConstraint`, `ConstraintStrength`, `ISuggestHandle`, `ISuggestHandleFactory`
- `bounds.ts`: `BoundId`, `LayoutBounds`, `ContainerBounds`, `ItemBounds`
- `solver.ts`: `CassowarySolver`, `ConstraintStrength`, `SuggestHandle`, `SuggestHandleFactory`, `LayoutConstraint`, `Term`, `ConstraintSpec`, `LinearConstraintBuilder`, `LhsBuilder`, `OpRhsBuilder`, `StrengthBuilder`
- `layout_solver.ts`: `CassowarySolver`
- `hint_target.ts`: `HintTarget`

**`src/model/`** - モデル層実装:
- `SymbolBase`, `RelationshipBase`, `DiagramSymbol`
- `LayoutVariables` (moved from `src/kiwi`)

**`src/kiwi/`** - レイアウトエンジン実装:
- `KiwiSolver` (implements `CassowarySolver`)
- `ConstraintsBuilder` (implements `IConstraintsBuilder`)
- `LayoutContext`

### システム構成図

```
┌────────────────────────────────────────────────────────┐
│                    src/core (公開API)                  │
│  - CassowarySolver, IConstraintsBuilder, Variable │
│  - LayoutBounds, ConstraintSpec, HintTarget           │
└────────────────────────────────────────────────────────┘
         ▲                                    ▲
         │                                    │
┌────────┴──────────┐              ┌─────────┴──────────┐
│   src/model       │              │   src/kiwi       │
│  - SymbolBase     │              │  - KiwiSolver    │
│  - LayoutVariables│──────────────▶  - ConstraintsBuilder│
│  (solver接続)     │              │  (実装層)          │
└───────────────────┘              └────────────────────┘
```

### システム構成図

```
┌─────────────────────────────────────┐
│        LayoutContext                │
│  (ファサード・コーディネーター)       │
├─────────────────────────────────────┤
│  - solver: KiwiSolver             │
│  - variables: LayoutVariables       │
│  - constraints: LayoutConstraints   │
└─────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌──────────────┐    ┌──────────────────┐
│ Layout       │    │ Layout           │
│ LayoutVariables    │    │ Constraints      │
├──────────────┤    ├──────────────────┤
│ - 変数生成   │    │ - 制約生成       │
│ - Expression │    │ - 制約管理       │
│              │    │ - ID採番         │
└──────────────┘    └──────────────────┘
```

### 役割分担

#### LayoutContext（ファサード）

LayoutVariables と Constraints を束ね、統一されたインターフェースを提供。

```typescript
export class LayoutContext {
  readonly solver: KiwiSolver
  readonly variables: LayoutVariables
  readonly constraints: LayoutConstraints
  readonly theme: Theme
  
  constructor(
    theme: Theme,
    resolveSymbol: (id: SymbolId | SymbolId) => SymbolBase | undefined
  )
  
  solve(): void
  solveAndApply(symbols: SymbolBase[]): void
  valueOf(variable: Variable): number
  getSolver(): KiwiSolver
}
```

#### LayoutVariables（変数管理）

kiwi の Variable/Constraint 生成を担う薄い層。`src/model` に配置され、`CassowarySolver` インターフェースを通じてレイアウトソルバーを利用します。

```typescript
export class LayoutVariables {
  private readonly solver: CassowarySolver
  
  createVariable(id: VariableId): Variable
  createBound(id: SymbolId): LayoutBounds
  createConstraint(id: LayoutConstraintId, spec: ConstraintSpec): ILayoutConstraint
}
```

#### LayoutConstraints（制約管理）

kiwumil レベルの制約を管理。各制約に ID とメタ情報を付与。

```typescript
export interface LayoutConstraint {
  id: LayoutConstraintId          // "constraints/${id}" 形式
  type: LayoutConstraintType      // "arrangeHorizontal", "encloseGrid" 等
  rawConstraints: kiwi.Constraint[]
}

export class LayoutConstraints {
  arrangeHorizontal(symbolIds: LayoutSymbolId[], gap?: number): void
  arrangeVertical(symbolIds: LayoutSymbolId[], gap?: number): void
  alignLeft(symbolIds: LayoutSymbolId[]): void
  // ... 他のヒントメソッド
  encloseGrid(containerId: SymbolId, matrix: SymbolId[][], options?): void
  encloseFigure(containerId: SymbolId, rows: SymbolId[][], options?): void
}
```

---

## Bounds とレイアウト変数

### Bounds の定義

Bounds はインターフェースとして `src/core/bounds.ts` に定義され、すべてのプロパティが `Variable` インターフェースを使用します。

```typescript
export interface Bounds {
  readonly type: BoundsType  // "layout" | "container" | "item"
  readonly x: Variable
  readonly y: Variable
  readonly width: Variable
  readonly height: Variable
  readonly right: Variable    // 派生変数: x + width
  readonly bottom: Variable   // 派生変数: y + height
  readonly centerX: Variable  // 派生変数: x + width * 0.5
  readonly centerY: Variable  // 派生変数: y + height * 0.5
}

export type BoundId = string
export type LayoutBounds = Bounds & { type: 'layout' }
export type ContainerBounds = Bounds & { type: 'container' }
export type ItemBounds = Bounds & { type: 'item' }
```

### 派生変数の実装

派生変数は `createBound()` 呼び出し時に事前生成され、制約も同時に設定されます。

```typescript
// LayoutVariables.createBound() で生成時に派生変数を作成し制約を設定
createBound(id: SymbolId | SymbolId): Bounds {
  const x = this.createVar(\`\${id}.x\`)
  const y = this.createVar(\`\${id}.y\`)
  const width = this.createVar(\`\${id}.width\`)
  const height = this.createVar(\`\${id}.height\`)

  // 派生変数を作成し、制約を設定
  const right = this.createVar(\`\${id}.right\`)
  this.addConstraint(right, LayoutConstraintOperator.Eq, 
    this.expression([{ variable: x }, { variable: width }]))

  const bottom = this.createVar(\`\${id}.bottom\`)
  this.addConstraint(bottom, LayoutConstraintOperator.Eq,
    this.expression([{ variable: y }, { variable: height }]))

  const centerX = this.createVar(\`\${id}.centerX\`)
  this.addConstraint(centerX, LayoutConstraintOperator.Eq,
    this.expression([{ variable: x }, { variable: width, coefficient: 0.5 }]))

  const centerY = this.createVar(\`\${id}.centerY\`)
  this.addConstraint(centerY, LayoutConstraintOperator.Eq,
    this.expression([{ variable: y }, { variable: height, coefficient: 0.5 }]))

  return { x, y, width, height, right, bottom, centerX, centerY }
}
```

**設計ポイント:**
- **事前生成**: すべての派生変数は createBound() 呼び出し時に生成される
- **一貫性**: 派生変数は常に存在し、nullable でない
- **自動制約登録**: 派生変数の定義式は制約として自動登録される

### パフォーマンス

事前作成アプローチ:
- アクセスが高速（getter のオーバーヘッドなし）
- すべてのプロパティが常に存在（nullable チェック不要）
- 制約の一貫性が保証される

---

## Symbol と Relationship の役割

### Symbol の責務

Symbol は図の要素（ノード）を表現する基底クラスです。

```typescript
export abstract class SymbolBase {
  readonly id: SymbolId
  readonly label: string
  protected readonly layoutBounds: LayoutBounds
  bounds?: { x: number; y: number; width: number; height: number }

  constructor(id: SymbolId, label: string, layoutBounds: LayoutBounds)
  
  getLayoutBounds(): LayoutBounds
  ensureLayoutBounds(builder: IConstraintsBuilder): void
  abstract toSVG(): string
  abstract getConnectionPoint(from: Point): Point
}
```

**主な責務:**
1. **形状の定義と描画**: SVG での描画
2. **接続点の計算**: 関係線の接続点を計算
3. **Bounds の保持**: レイアウト変数への参照

### Relationship の責務

Relationship は Symbol 間の関係（エッジ）を表現します。

```typescript
export abstract class RelationshipBase {
  readonly id: RelationshipId
  readonly from: SymbolId
  readonly to: SymbolId

  constructor(id: RelationshipId, from: SymbolId, to: SymbolId)
  
  abstract toSVG(symbols: Map<SymbolId, SymbolBase>): string
  abstract calculateZIndex(symbols: Map<SymbolId, SymbolBase>): number
}
```

**接続点の計算例:**

```typescript
class Association extends RelationshipBase {
  toSVG(symbols: Map<SymbolId, SymbolBase>): string {
    const fromSymbol = symbols.get(this.from)!
    const toSymbol = symbols.get(this.to)!
    
    // 各シンボルの中心を計算
    const fromBounds = fromSymbol.getLayoutBounds()
    const toBounds = toSymbol.getLayoutBounds()
    
    const fromCenter = {
      x: fromBounds.centerX.value(),
      y: fromBounds.centerY.value()
    }
    const toCenter = {
      x: toBounds.centerX.value(),
      y: toBounds.centerY.value()
    }
    
    // 各シンボルに接続点を問い合わせ
    const fromPoint = fromSymbol.getConnectionPoint(toCenter)
    const toPoint = toSymbol.getConnectionPoint(fromCenter)
    
    return \`<line x1="\${fromPoint.x}" y1="\${fromPoint.y}" 
                  x2="\${toPoint.x}" y2="\${toPoint.y}" ... />\`
  }
}
```

---

## 特別な Symbol: DiagramSymbol

### 概要

DiagramSymbol は、図全体を表す特殊なシンボルです。すべてのユーザー定義シンボルを自動的に包含し、タイトルやメタデータを表示します。

### 設計思想

DiagramSymbol の導入により：

1. **DiagramSymbol** が常に配列の最初の要素として追加される
2. DiagramSymbol が (0, 0) に固定される
3. すべてのユーザーシンボルが DiagramSymbol 内に enclose される
4. **viewport が常に (0, 0) から始まる**

これにより、図全体の境界計算が不要になり、より予測可能なレイアウトを実現します。

### レイアウト制約

#### DiagramSymbol の位置固定

```typescript
// DiagramSymbol の LayoutBound を (0, 0) に固定
const diagram = diagramSymbol.getLayoutBounds()

layout.constraints.addConstraint(diagram.x, LayoutConstraintOperator.Eq, 0)
layout.constraints.addConstraint(diagram.y, LayoutConstraintOperator.Eq, 0)
```

#### DiagramSymbol のサイズ制約

DiagramSymbol はコンテナとして扱われるため、最小サイズのみ指定されます（WEAK 制約）。

```typescript
// 最小サイズのみ指定
layout.constraints.addConstraint(
  diagram.width,
  LayoutConstraintOperator.Ge,
  200,
  LayoutConstraintStrength.Weak
)
layout.constraints.addConstraint(
  diagram.height,
  LayoutConstraintOperator.Ge,
  150,
  LayoutConstraintStrength.Weak
)
```

#### ユーザーシンボルの配置制約

自動的に追加される enclose 制約により、すべてのユーザーシンボルが DiagramSymbol 内に配置され、DiagramSymbol が自動的に拡大します。

---

## 制約の実装詳細

### 制約の優先順位

制約ソルバー（Cassowary）は以下の強度で制約を解決します：

| 制約タイプ | 強度 | 理由 |
|-----------|------|------|
| Enclose（子要素の位置） | REQUIRED | 子要素が必ずコンテナ内に配置 |
| Enclose（コンテナの拡大） | REQUIRED | コンテナが必ず子要素を含む |
| Arrange（間隔） | STRONG | 要素間の間隔を厳密に保つ |
| Align（整列） | STRONG | 整列を厳密に保つ |
| コンテナの最小サイズ | WEAK | 子要素に応じて拡大可能 |
| 非コンテナのサイズ | REQUIRED (Eq) | サイズは固定 |

この優先順位により、制約が競合せずに解決されます。

### Arrange（配置）の実装

#### arrangeHorizontal の実装

要素を水平方向に等間隔で並べます。

```typescript
// 概念的な例（実際は LayoutConstraints が制約を管理）
private addHorizontalConstraints(symbolIds: string[], gap: number) {
  for (let i = 0; i < symbolIds.length - 1; i++) {
    const a = this.boundsMap.get(symbolIds[i])
    const b = this.boundsMap.get(symbolIds[i + 1])
    if (!a || !b) continue

    // b.x = a.x + a.width + gap (STRONG strength)
    this.layoutContext.constraints.addConstraint(
      b.x,
      LayoutConstraintOperator.Eq,
      this.layoutContext.constraints.expression(
        [
          { variable: a.x },
          { variable: a.width }
        ],
        gap
      ),
      LayoutConstraintStrength.Strong
    )
  }
}
```

**制約:**
- 要素間の距離が等しい
- 左から右の順序で配置
- デフォルト間隔: 80px
- 制約強度: STRONG

#### arrangeVertical の実装

要素を垂直方向に等間隔で並べます。

```typescript
// 概念的な例（実際は LayoutConstraints が制約を管理）
private addVerticalConstraints(symbolIds: string[], gap: number) {
  for (let i = 0; i < symbolIds.length - 1; i++) {
    const a = this.boundsMap.get(symbolIds[i])
    const b = this.boundsMap.get(symbolIds[i + 1])
    if (!a || !b) continue

    // b.y = a.y + a.height + gap (STRONG strength)
    this.layoutContext.constraints.addConstraint(
      b.y,
      LayoutConstraintOperator.Eq,
      this.layoutContext.constraints.expression(
        [
          { variable: a.y },
          { variable: a.height }
        ],
        gap
      ),
      LayoutConstraintStrength.Strong
    )
  }
}
```

**制約:**
- 要素間の距離が等しい
- 上から下の順序で配置
- デフォルト間隔: 50px
- 制約強度: STRONG

### Align（整列）の実装

Align 系のメソッドは、派生変数を利用して効率的に制約を追加します。

```typescript
// alignRight の例（派生変数 right を利用）
private addAlignRightConstraints(symbolIds: string[]) {
  if (symbolIds.length < 2) return
  const firstId = symbolIds[0]
  if (!firstId) return
  const first = this.boundsMap.get(firstId)
  if (!first) return

  for (let i = 1; i < symbolIds.length; i++) {
    const symbolId = symbolIds[i]
    if (!symbolId) continue
    const symbol = this.boundsMap.get(symbolId)
    if (!symbol) continue
    
    // curr.right = first.right (派生変数を利用)
    this.layoutContext.constraints.addConstraint(
      symbol.right,
      LayoutConstraintOperator.Eq,
      first.right,
      LayoutConstraintStrength.Strong
    )
  }
}
```

同様に、\`alignCenterX\`, \`alignCenterY\`, \`alignBottom\` でも派生変数を利用します。

### Enclose（包含）の実装

#### コンテナのサイズ制約

```typescript
// コンテナは最小サイズのみ指定（WEAK）
if (isContainer) {
  this.layoutContext.constraints.addConstraint(
    layoutBounds.width,
    LayoutConstraintOperator.Ge,
    100,
    LayoutConstraintStrength.Weak
  )
  this.layoutContext.constraints.addConstraint(
    layoutBounds.height,
    LayoutConstraintOperator.Ge,
    100,
    LayoutConstraintStrength.Weak
  )
}
```

#### enclose 制約（子要素の配置とコンテナの拡大）

```typescript
private addEncloseConstraints(containerId: string, childIds: string[] = []) {
  const container = this.boundsMap.get(containerId)
  if (!container) return
  const padding = 20

  for (const childId of childIds) {
    const child = this.boundsMap.get(childId)
    if (!child) continue

    // 子要素の最小位置制約（コンテナ内に配置）
    // child.x >= container.x + padding
    this.layoutContext.constraints.addConstraint(
      child.x,
      LayoutConstraintOperator.Ge,
      this.layoutContext.constraints.expression([{ variable: container.x }], padding),
      LayoutConstraintStrength.Required
    )

    // child.y >= container.y + 50 (タイトルスペース考慮)
    this.layoutContext.constraints.addConstraint(
      child.y,
      LayoutConstraintOperator.Ge,
      this.layoutContext.constraints.expression([{ variable: container.y }], 50),
      LayoutConstraintStrength.Required
    )

    // コンテナを子要素に合わせて拡大（重要！）
    // container.width + container.x >= child.x + child.width + padding
    this.layoutContext.constraints.addConstraint(
      this.layoutContext.constraints.expression([
        { variable: container.width },
        { variable: container.x }
      ]),
      LayoutConstraintOperator.Ge,
      this.layoutContext.constraints.expression(
        [
          { variable: child.x },
          { variable: child.width }
        ],
        padding
      ),
      LayoutConstraintStrength.Required
    )

    // container.height + container.y >= child.y + child.height + padding
    this.layoutContext.constraints.addConstraint(
      this.layoutContext.constraints.expression([
        { variable: container.height },
        { variable: container.y }
      ]),
      LayoutConstraintOperator.Ge,
      this.layoutContext.constraints.expression(
        [
          { variable: child.y },
          { variable: child.height }
        ],
        padding
      ),
      LayoutConstraintStrength.Required
    )
  }
}
```

**キーポイント:**
- コンテナのサイズは固定せず、最小サイズのみ指定（WEAK 制約）
- 子要素の位置に応じてコンテナが自動的に拡大（REQUIRED 制約）
- \`arrange\` 制約（STRONG）と \`enclose\` 制約（REQUIRED）は競合しない

---

## オンライン制約適用

従来はヒント情報を \`LayoutHint[]\` に蓄積し、solve時にバッチ処理していましたが、現在は**ヒント呼び出し時に即座に制約を追加**します。

### 旧設計（バッチ処理）

```typescript
// ❌ 旧: ヒントを蓄積
hint.arrangeHorizontal(a, b, c)  // → hints.push({ type: "horizontal", ids: [a,b,c] })

// solve時に制約生成
solver.solve(symbols, hints)     // → hints をループして制約追加
```

### 新設計（オンライン適用）

```typescript
// ✅ 新: 即座に制約追加
hint.arrangeHorizontal(a, b, c)  // → layoutContext.constraints.arrangeHorizontal([a,b,c])
                                  // → solver.addConstraint(...) が即座に実行
```

**メリット:**
- シンプルな実装（中間データ構造が不要）
- 制約の追跡が容易（\`LayoutConstraint\` ID で管理）
- Guide APIとの統一感

---

## Symbol生成時の制約適用

Symbol生成時に \`LayoutContext\` を注入し、初期制約を登録します。

```typescript
// プラグインでのシンボル生成
circle(label: string): SymbolId {
  const symbol = symbols.register(plugin, 'circle', (symbolId) => {
    const bound = layout.variables.createBound(symbolId)
    const circle = new CircleSymbol(symbolId, label, bound)
    
    // 必要に応じて制約を追加（例: 固定サイズ）
    layout.constraints.addConstraint(
      bound.width,
      LayoutConstraintOperator.Eq,
      80,
      LayoutConstraintStrength.Required
    )
    layout.constraints.addConstraint(
      bound.height,
      LayoutConstraintOperator.Eq,
      80,
      LayoutConstraintStrength.Required
    )
    
    return circle
  })
  return symbol.id
}
```

---

---

## 命名規則

* `LayoutContext` インスタンスは `context` と呼ぶ
* `LayoutConstraints` は `constraints`
* `LayoutVariables` は `variables`

## LayoutBound Injection

### 概要

SymbolBase および ContainerSymbolBase は、LayoutBound をコンストラクタで注入し、immutable として保持します。
これにより、layoutContext への直接依存を排除し、シンボル側で固有の制約を追加できるようになります。

### SymbolBase の構造

```typescript
export abstract class SymbolBase {
  readonly id: SymbolId
  readonly label: string
  protected readonly layoutBounds: LayoutBounds
  // 後方互換性のため残されているが、layoutBounds を使用することを推奨
  bounds?: { x: number; y: number; width: number; height: number }

  constructor(id: SymbolId, label: string, layoutBounds: LayoutBounds) {
    this.id = id
    this.label = label
    this.layoutBounds = layoutBounds
  }

  getLayoutBounds(): LayoutBounds {
    return this.layoutBounds
  }
  
  ensureLayoutBounds(builder: IConstraintsBuilder): void {
    // 各シンボルが固有の制約を追加
  }

  // toSVG や getConnectionPoint 内で layoutBounds を使用
  abstract toSVG(): string
  abstract getConnectionPoint(from: Point): Point
}
```

### LayoutBound の使用例

```typescript
export class CircleSymbol extends SymbolBase {
  toSVG(): string {
    const bounds = this.getLayoutBounds()
    const x = bounds.x.value()
    const y = bounds.y.value()
    const width = bounds.width.value()
    const height = bounds.height.value()
    
    const cx = x + width / 2
    const cy = y + height / 2
    const r = Math.min(width, height) / 2
    
    return \`<circle cx="\${cx}" cy="\${cy}" r="\${r}" ... />\`
  }
}
```

### メリット

1. **依存性の逆転**: シンボルは layoutContext に依存しない
2. **責任の分離**: レイアウト変数の生成と制約の定義が分離
3. **拡張性**: 将来的なカスタム制約の追加が容易
4. **型安全性**: コンパイル時に型チェック

---

## 制約の追跡

各制約には一意なIDが付与され、デバッグや削除が可能です。

```typescript
// 制約ID形式
"constraints/\${serial}"                    // 通常の制約
"constraints/\${symbolId}/\${serial}"        // Symbol固有の制約

// 制約の削除（将来実装予定）
layoutContext.constraints.remove("constraints/user/0")
```

---

## まとめ

### 完了した機能

- ✅ **LayoutContext**: LayoutVariables/Constraints のファサード化
- ✅ **オンライン制約適用**: ヒント呼び出し時に即座に制約追加
- ✅ **LayoutBound**: インターフェース化、派生変数の事前作成
- ✅ **Container Symbol Interface**: `container: ContainerBounds` を保持し `containerInbounds` 制約を登録するシンプルなインターフェース
- ✅ **DiagramSymbol**: 図全体の統一的な管理
- ✅ **制約の追跡**: 制約IDによる管理

### 今後の拡張

- [ ] Theme と LayoutOptions の分離
- [ ] 制約の動的削除・更新
- [ ] カスタム制約 API の公開
- [ ] パフォーマンス最適化

---

## 関連ドキュメント

- **[Layout Hints API](./layout-hints.md)** - ユーザー向けレイアウトヒントAPI
- **[Namespace-based DSL](./namespace-dsl.md)** - DSL設計とAPI使い方
- **[Plugin System](./plugin-system.md)** - プラグイン作成ガイド
- **[Theme System](./theme-system.md)** - テーマシステムの設計


---

# Symbol を見ずに LayoutConstraints を運用する計画

## ステータス: 完了 ✅

本計画で提案されたレイアウト制約とシンボルの分離は完了しました。

## 実装内容

### 1. Bounds に BoundId を追加

`src/core/bounds.ts` で `BoundId` を型として定義し、ブランド化を削除:

```typescript
export type BoundId = string

export interface Bounds {
  readonly type: BoundsType
  readonly x: Variable
  readonly y: Variable
  readonly width: Variable
  readonly height: Variable
  readonly right: Variable
  readonly bottom: Variable
  readonly centerX: Variable
  readonly centerY: Variable
}
```

### 2. HintTarget の導入

`src/core/hint_target.ts` に `HintTarget` インターフェースを配置 (旧 `LayoutConstraintTarget`):

```typescript
export interface HintTarget {
  ownerId: SymbolId
  bounds: LayoutBounds
  container?: ContainerBounds
}
```

### 3. Variable への統一

すべての `Bounds` プロパティが `Variable` インターフェースを使用:

- 具象 `Variable` クラスへの直接依存を排除
- `src/core` のインターフェースのみに依存

## 完了した実装

| 領域 | 実装内容 |
| --- | --- |
| Bounds モデル | `BoundId` を `string` 型として `src/core/symbols.ts` に追加。`Bounds` のすべてのプロパティが `Variable` を使用。 |
| HintTarget | `HintTarget` インターフェースを `src/core/hint_target.ts` に配置し、`ownerId`、`bounds`、`container` を保持。 |
| LayoutConstraints | `HintTarget` を活用し、Bounds ベースでの制約構築を実現。 |

## 得られたメリット

1. **依存性の逆転**: 制約レイヤーが具象型ではなくインターフェースに依存
2. **型安全性の向上**: コンパイル時の型チェックが強化
3. **アーキテクチャの明確化**: `src/core` で公開API、`src/kiwi` で実装という明確な境界
4. **循環依存の排除**: コア型定義が実装から分離

## 関連変更

- `Variable` → `Variable` への統一
- `LayoutConstraintTarget` → `HintTarget` への名前変更
- `BoundId` のブランド化削除 (単純な `string` 型に)


---

# Layout Constraints Fluent Builder Migration

## Context

- The new `ConstraintsBuilder` (per [docs/draft/new_constraint_builder.md](../draft/new_constraint_builder.md)) is already wired into parts of `LayoutConstraints`, but several helpers, hints, and exported types still rely on `KiwiSolver.addConstraint`/`.expression` or legacy type wrappers.
- Keeping these old pathways prolongs the `KiwiSolver` surface, encourages duplicated expression logic, and pits downstream consumers (hints, tests, docs) against both the old and new APIs.
- We need a written migration plan to ensure the remaining pieces adopt the fluent builder before removing the old exports and solver helpers.

## Objectives

1. Ensure every constraint-producing helper in `src/kiwi` (constraints utilities, hint builders, layout helpers) issues constraints exclusively through `ConstraintsBuilder`.
2. Eliminate unused Kiwi/Wrapping exports (`LayoutTerm`, `LayoutExpression`, solver expression helpers, etc.) without regressing any consumer expectations.
3. Capture the migration sequence, acceptance criteria, and testing steps so the team can coordinate multiple commits safely.

## Migration Plan

### 1. Finish migrating `LayoutConstraints` helpers

- **Steps**: Confirm that `arrange*`, `align*`, `enclose*`, and other utility methods build every constraint using a `ConstraintsBuilder` instance, collect the generated `rawConstraints`, and keep constraint metadata unchanged. Document the required builder flow (e.g., `ct(...).eq(...).strong()` for equality, `.ge()`/`.le()` for inequalities).
- **Acceptance**: Each helper uses `createConstraintsBuilder()` rather than `KiwiSolver.expression`/`.addConstraint`, the `rawConstraints` recorded by `record()` still match their previous counts, and `LayoutConstraintType`/`strength` mappings are unchanged.

### 2. Rewire `LayoutContext`/hint layers and tests

- **Steps**:
  1. Provide a safe way to create builders (e.g., `LayoutContext.createConstraintsBuilder()`), remove the `getSolver()` accessor, and drop direct solver usage from guides/tests.
  2. Update `guide_builder` methods to instantiate a fresh builder for each constraint, chain the fluent API, and finalize with the appropriate strength.
  3. Adjust tests (`bounds_validation`, `layout_variables`, builder unit tests, etc.) to use the new API, rely on `context.solve()` instead of `context.solver.updateVariables()`, and remove references to Kiwi operators or strengths when possible.
- **Acceptance**: No file outside `constraints_builder` calls `KiwiSolver.addConstraint`/`.expression`, guides/tests no longer rely on `LayoutContext.getSolver()` or private solver fields, and existing coverage still passes.

### 3. Prune legacy exports and re-export the new API consistently

- **Steps**:
  1. Remove unused Kiwi wrappers (`LayoutTerm`, `LayoutExpression`, `toKiwiExpression`, etc.) and re-export only the new `LayoutConstraintStrength`/`Operator` constants from `layout_constraints`.
  2. Update `src/index.ts` to surface the cleaned exports. Keep the exported `ConstraintsBuilder` handy for downstream consumers.
  3. Review `src/kiwi` exports for duplicates and ensure no stray `kiwi` imports remain.
- **Acceptance**: Only necessary types remain exported, public types align with `ConstraintsBuilder`, and ABI-compatible coverage (lint, tests, docs) stays green.

## Testing & Verification

- `bun test` (the full suite, including `constraints_builder.test.ts` + domain tests).
- `bun run lint` (fix remaining `@typescript-eslint/no-unused-vars` warnings as part of the cleanup).
- `tsc --noEmit` (already part of `bun test:types`, but re-run if necessary).

## Risks & Notes

- Removing `KiwiSolver` helpers must happen only after all consumers adopt the builder; this document is a guardrail before the final cut.
- Builder-based APIs replace Kiwi expressions but still produce `kiwi.Constraint` internally, so existing `rawConstraints` checks should continue to pass.


---

# Fluent 制約ビルダー移行計画

## ステータス: 完了 ✅

本計画で提案された `IConstraintsBuilder` インターフェースの抽出と、型の整理は完了しました。

## 実装内容

### 1. インターフェース抽出

`src/core/solver.ts` に以下のコアインターフェースを配置:

```typescript
export interface IConstraintsBuilder {
  eq(lhs: Term, rhs: Term | number, strength?: ConstraintStrength): this
  ge(lhs: Term, rhs: Term | number, strength?: ConstraintStrength): this
  le(lhs: Term, rhs: Term | number, strength?: ConstraintStrength): this
}

export type Term = Variable | number
export type ConstraintSpec = (builder: IConstraintsBuilder) => void
```

### 2. 型の標準化

- `ConstraintStrength`: `"required" | "strong" | "medium" | "weak"`
- `ISuggestHandle`: 旧 `SuggestHandle` から名前変更
- `ISuggestHandleFactory`: 旧 `SuggestHandleFactory` から名前変更
- `Variable`: 旧 `Variable<T>` から型パラメータを削除

### 3. シンボル実装の更新

すべてのシンボルクラス (`SymbolBase` およびその派生クラス) が `ensureLayoutBounds(builder: IConstraintsBuilder)` メソッドを実装:

```typescript
export abstract class SymbolBase {
  ensureLayoutBounds(builder: IConstraintsBuilder): void {
    // 各シンボルが固有の制約を追加
  }
}
```

### 4. アーキテクチャの改善

- **依存性の逆転**: `src/kiwi` の具象クラスではなく `src/core` のインターフェースに依存
- **循環依存の解消**: `src/core` が型定義のみを持ち、実装から分離
- **型安全性の向上**: すべての公開APIがインターフェースベース

## 移行完了項目

- [x] `IConstraintsBuilder` インターフェースの抽出と `src/core` への配置
- [x] `Term` と `ConstraintSpec` の `src/core` への移動
- [x] `ConstraintStrength` への名前変更と `"required"` の追加
- [x] `ISuggestHandle` / `ISuggestHandleFactory` への名前変更
- [x] すべてのシンボル実装で `IConstraintsBuilder` を使用
- [x] テストの更新と検証 (129 tests pass)

## 参照

- `src/core/solver.ts` - コアインターフェース定義
- `src/kiwi/constraints_builder.ts` - 具象実装
- `src/model/symbol_base.ts` - シンボル基底クラス
