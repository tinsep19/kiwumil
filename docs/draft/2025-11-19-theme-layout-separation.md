# 指摘事項3の再検討: Theme と LayoutOptions の分離

## 現状分析

### 問題点

**LayoutConstraints が Theme に依存している**

```typescript
// src/layout/layout_constraints.ts
export class LayoutConstraints {
  constructor(
    private readonly vars: LayoutVariables,
    private readonly theme: Theme,  // ← スタイリング情報を直接参照
    private readonly resolveSymbol: (id: LayoutSymbolId) => SymbolBase | undefined
  ) {}

  arrangeHorizontal(symbolIds: LayoutSymbolId[], gap = this.theme.defaultStyleSet.horizontalGap) {
    // gap 値を Theme から取得
  }

  arrangeVertical(symbolIds: LayoutSymbolId[], gap = this.theme.defaultStyleSet.verticalGap) {
    // gap 値を Theme から取得
  }
}
```

### 責務の混在

**Theme の役割**:
- 視覚的スタイリング（色、線の太さ、フォントなど）
- シンボルごとのスタイル定義

**Layout の役割**:
- シンボルの配置・サイズ計算
- 制約ベースの位置決定

**現状**: Theme が **gap (配置パラメータ)** と **色/フォント (描画パラメータ)** の両方を持っている

```typescript
// src/core/theme.ts
export interface StyleSet {
  textColor: string        // 描画パラメータ
  fontSize: number         // 描画パラメータ
  fontFamily: string       // 描画パラメータ
  strokeWidth: number      // 描画パラメータ
  strokeColor: string      // 描画パラメータ
  fillColor: string        // 描画パラメータ
  backgroundColor?: string // 描画パラメータ
  horizontalGap: number    // レイアウトパラメータ ← 混在
  verticalGap: number      // レイアウトパラメータ ← 混在
}
```

### Theme.defaultStyleSet の使用状況

**使用箇所（38箇所）**:

1. **レイアウト関連（5箇所）**:
   - `layout_constraints.ts` (2箇所): arrangeHorizontal/arrangeVertical のデフォルト gap
   - `hint_factory.ts` (2箇所): createGuideX/Y のデフォルト gap
   - `diagram_symbol.ts` (3箇所): padding/headerHeight 計算
   - `system_boundary_symbol.ts` (3箇所): padding/headerHeight 計算

2. **描画関連（30+箇所）**:
   - `theme.ts`: getStyleForSymbol でのフォールバック
   - 各 Symbol の toSVG() メソッド内での色/フォント参照

## 変更すべき理由

### 1. 単一責任原則の違反

**現状**: Theme がレイアウトとスタイリングの両方を担当している

**問題**:
- Theme を変更したいだけなのにレイアウトが変わる可能性がある
- レイアウトパラメータを変更したいだけなのに Theme を作り直す必要がある

### 2. レイアウトエンジンの独立性の欠如

**現状**: LayoutConstraints が Theme に強く依存

**問題**:
- レイアウトシステムをテストする際に Theme のモックが必要
- 将来的に他のレイアウトエンジン（例: graphviz, d3-force）に差し替える際に Theme への依存が障害になる

### 3. 再利用性の低下

**現状**: gap 値が Theme に埋め込まれている

**問題**:
- 同じ Theme で異なる gap を使いたい場合に対応できない
- ダイアグラムごとに gap を調整したい場合、Theme 全体をコピーする必要がある

### 4. 型の不明確さ

**現状**: StyleSet が視覚とレイアウトの両方を含む

**問題**:
- プラグイン開発者が「どの値がレイアウトに影響するか」を理解しにくい
- IntelliSense で horizontalGap と textColor が同列に表示される

## 提案する変更内容

### 1. LayoutOptions インターフェースの導入

```typescript
// src/layout/layout_options.ts
export interface LayoutOptions {
  /** 水平方向の要素間隔 (arrangeHorizontal のデフォルト) */
  horizontalGap: number
  
  /** 垂直方向の要素間隔 (arrangeVertical のデフォルト) */
  verticalGap: number
  
  /** コンテナのデフォルトパディング係数 */
  containerPaddingRatio?: number
}

export const DefaultLayoutOptions: LayoutOptions = {
  horizontalGap: 80,
  verticalGap: 50,
  containerPaddingRatio: 0.5
}
```

### 2. LayoutContext の変更

```typescript
// src/layout/layout_context.ts
export class LayoutContext {
  readonly vars: LayoutVariables
  readonly constraints: LayoutConstraints
  readonly theme: Theme           // 描画用に残す
  readonly options: LayoutOptions // レイアウト用に追加

  constructor(
    theme: Theme,
    options: LayoutOptions = DefaultLayoutOptions,
    resolveSymbol: (id: SymbolId | ContainerSymbolId) => SymbolBase | undefined
  ) {
    this.theme = theme
    this.options = options
    this.vars = new LayoutVariables()
    this.constraints = new LayoutConstraints(this.vars, options, resolveSymbol) // theme → options
  }
}
```

### 3. LayoutConstraints の変更

```typescript
// src/layout/layout_constraints.ts
export class LayoutConstraints {
  constructor(
    private readonly vars: LayoutVariables,
    private readonly options: LayoutOptions,  // theme → options
    private readonly resolveSymbol: (id: LayoutSymbolId) => SymbolBase | undefined
  ) {}

  arrangeHorizontal(symbolIds: LayoutSymbolId[], gap = this.options.horizontalGap) {
    // options から取得
  }

  arrangeVertical(symbolIds: LayoutSymbolId[], gap = this.options.verticalGap) {
    // options から取得
  }
}
```

### 4. ContainerSymbolBase の変更

```typescript
// src/model/container_symbol_base.ts
export abstract class ContainerSymbolBase {
  protected getContainerPadding(theme: Theme): ContainerPadding {
    const ratio = this.layout.options.containerPaddingRatio ?? 0.5
    const horizontal = theme.defaultStyleSet.horizontalGap * ratio
    const vertical = theme.defaultStyleSet.verticalGap * ratio
    return { top: vertical, right: horizontal, bottom: vertical, left: horizontal }
  }
}
```

または、Theme から gap を完全に削除する場合:

```typescript
protected getContainerPadding(): ContainerPadding {
  const ratio = this.layout.options.containerPaddingRatio ?? 0.5
  const horizontal = this.layout.options.horizontalGap * ratio
  const vertical = this.layout.options.verticalGap * ratio
  return { top: vertical, right: horizontal, bottom: vertical, left: horizontal }
}
```

### 5. Theme から gap を削除（オプション）

**段階的移行案**:

**Phase 1**: Theme.defaultStyleSet に gap を残しつつ、LayoutOptions を導入
- 既存コードへの影響を最小化
- LayoutOptions が優先、Theme.gap はフォールバック

**Phase 2**: Theme.gap を deprecated として警告
- 次のメジャーバージョンで削除予定と告知

**Phase 3**: Theme から gap を完全に削除
- StyleSet から horizontalGap/verticalGap を削除
- レイアウトとスタイリングの完全分離

## DiagramBuilder API の変更

```typescript
// Before
TypeDiagram("Title")
  .theme(BlueTheme)
  .build(...)

// After (Option 1: テーマに埋め込まれた gap を使用)
TypeDiagram("Title")
  .theme(BlueTheme)
  .build(...)

// After (Option 2: 明示的に LayoutOptions を指定)
TypeDiagram("Title")
  .theme(BlueTheme)
  .layoutOptions({ horizontalGap: 100, verticalGap: 60 })
  .build(...)

// After (Option 3: Theme とは独立に指定)
TypeDiagram("Title")
  .theme(BlueTheme)
  .layout({ horizontalGap: 100, verticalGap: 60 })
  .build(...)
```

## 影響範囲

### 変更が必要なファイル

1. **新規作成**:
   - `src/layout/layout_options.ts`

2. **変更必須**:
   - `src/layout/layout_context.ts`
   - `src/layout/layout_constraints.ts`
   - `src/dsl/diagram_builder.ts` (LayoutOptions を受け取る)
   - `src/dsl/hint_factory.ts` (layout.options 参照に変更)

3. **変更推奨**:
   - `src/model/container_symbol_base.ts`
   - `src/model/diagram_symbol.ts`
   - `src/plugin/uml/symbols/system_boundary_symbol.ts`

4. **Phase 2 以降**:
   - `src/core/theme.ts` (StyleSet から gap 削除)

### テスト影響

- `tests/layout_constraints.test.ts`
- `tests/layout_solver.test.ts`
- 新規: `tests/layout_options.test.ts`

## メリット

### 1. 関心の分離

- **Theme**: 純粋に視覚的なスタイリング（色、線、フォント）
- **LayoutOptions**: 純粋にレイアウトパラメータ（gap、padding）

### 2. テスタビリティの向上

```typescript
// Before: Theme のモックが必要
const theme = { defaultStyleSet: { horizontalGap: 80, /* 他の全プロパティ */ } }

// After: LayoutOptions のみで十分
const options = { horizontalGap: 80, verticalGap: 50 }
```

### 3. 柔軟性の向上

```typescript
// 同じ Theme で異なる gap を使用可能
TypeDiagram("Dense Diagram")
  .theme(DefaultTheme)
  .layout({ horizontalGap: 40, verticalGap: 30 })

TypeDiagram("Spacious Diagram")
  .theme(DefaultTheme)
  .layout({ horizontalGap: 120, verticalGap: 80 })
```

### 4. 型の明確化

- `LayoutOptions` は純粋なレイアウトパラメータ
- `StyleSet` は純粋な視覚パラメータ
- 開発者が混乱しにくい

## デメリット

### 1. API の複雑化

- 新しい概念（LayoutOptions）の追加
- DiagramBuilder に新しいメソッド（.layout()）が必要

### 2. 破壊的変更（Phase 2/3 の場合）

- Theme.defaultStyleSet.horizontalGap を参照している既存コードが壊れる
- マイグレーションガイドが必要

### 3. デフォルト値の重複

- Theme と LayoutOptions の両方でデフォルト値を管理
- Phase 1 では両方に gap が存在する期間がある

## 推奨実装順序

### 短期（このPRに含める場合）

1. `LayoutOptions` インターフェース追加
2. `LayoutContext` に options プロパティ追加（theme も保持）
3. `LayoutConstraints` を options 参照に変更
4. Theme.gap はフォールバックとして残す

**メリット**: 既存コードを壊さずに新機能を追加

### 中期（次のPR）

1. `DiagramBuilder.layout()` / `.layoutOptions()` メソッド追加
2. ドキュメント更新（gap は LayoutOptions で指定推奨）
3. Theme.gap を deprecated として警告

### 長期（次のメジャーバージョン）

1. Theme から horizontalGap/verticalGap を削除
2. 完全な分離を達成

## 結論

**変更すべき理由**:
- 単一責任原則の違反を解消
- レイアウトとスタイリングの関心を分離
- テスタビリティと再利用性の向上

**推奨アプローチ**:
- **短期**: LayoutOptions を導入し、Theme.gap はフォールバックとして残す（非破壊的）
- **中期**: API を拡張し、LayoutOptions の使用を推奨
- **長期**: Theme から gap を削除し、完全分離

**今回のPRに含めるべきか**:
- 含める場合: 短期実装（非破壊的、テスト影響小）
- 含めない場合: 別PRで段階的に実施（より慎重なアプローチ）
