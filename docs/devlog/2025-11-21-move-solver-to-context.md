# 2025-11-21 LayoutContext に Solver を移動（移行手順 4）

## 背景

[docs/draft/kiwi-boundary-refactor.md](../draft/kiwi-boundary-refactor.md) の移行手順 4 を実施。

移行手順 1-3 で kiwi ラッパーモジュール、型定義の分離、Variables の依存注入対応を完了した。次のステップとして、solver の所有権を LayoutContext に移動し、レイアウトシステム全体のライフサイクル管理を一元化する必要があった。

## 実施した作業

### 1. LayoutContext に KiwiSolver を追加

**変更ファイル**: `src/kiwi/layout_context.ts`

#### 変更前
```typescript
export class LayoutContext {
  readonly vars: Variables
  readonly constraints: LayoutConstraints
  readonly theme: Theme

  constructor(
    theme: Theme,
    resolveSymbol: (id: SymbolId | ContainerSymbolId) => SymbolBase | undefined
  ) {
    this.theme = theme
    this.variables = new Variables()
    this.constraints = new LayoutConstraints(this.variables, theme, resolveSymbol)
  }

  solve() {
    this.variables.solve()
  }
}
```

#### 変更後
```typescript
import { KiwiSolver } from "./kiwi"

export class LayoutContext {
  private readonly solver: KiwiSolver
  readonly vars: Variables
  readonly constraints: LayoutConstraints
  readonly theme: Theme

  constructor(
    theme: Theme,
    resolveSymbol: (id: SymbolId | ContainerSymbolId) => SymbolBase | undefined
  ) {
    this.theme = theme
    this.solver = new KiwiSolver()
    this.variables = new Variables(this.solver)
    this.constraints = new LayoutConstraints(this.variables, theme, resolveSymbol)
  }

  solve() {
    this.solver.updateVariables()
  }
}
```

### 2. 主な変更点

#### solver フィールドの追加
- **新規**: `private readonly solver: KiwiSolver`
- LayoutContext が KiwiSolver のインスタンスを所有する

#### コンストラクタの変更
- KiwiSolver を最初に作成
- 作成した solver を Variables に注入: `new Variables(this.solver)`
- これにより、vars と constraints が同じ solver を共有する

#### solve メソッドの変更
- **旧**: `this.variables.solve()` - Variables 経由で solver を呼び出し
- **新**: `this.solver.updateVariables()` - LayoutContext が直接 solver を操作

これにより、solver のライフサイクル管理が LayoutContext に集約された。

#### インポートの追加
- `import { KiwiSolver } from "./kiwi"` を追加

### 3. テストの実行

すべてのテストが成功することを確認：
```bash
$ bun test
 66 pass
 0 fail

$ bun run test:types
# 型テストも成功
```

## 効果

### 1. solver の所有権の明確化
- LayoutContext が solver を所有し、そのライフサイクルを管理
- Variables は注入された solver を使用するだけの役割に

### 2. 一元的な制御
- solve のタイミングを LayoutContext が制御できる
- 将来的なバッチ処理や最適化が容易に

### 3. 責務の明確化
```
LayoutContext:
  - KiwiSolver を所有
  - solve のタイミングを制御
  - 全体のオーケストレーション

Variables:
  - 変数の作成と管理
  - 注入された solver を利用

LayoutConstraints:
  - 制約の生成
  - vars 経由で solver に制約を追加
```

### 4. テスタビリティの向上
- LayoutContext のテスト時にモック KiwiSolver を注入可能（将来の拡張）
- solver の振る舞いを独立してテスト可能

### 5. 既存コードとの互換性維持
- LayoutContext の公開 API は変更なし（solve メソッドは同じシグネチャ）
- vars フィールドも引き続き公開されており、既存コードは影響を受けない
- 内部実装のみが変更され、外部からの使用方法は同じ

## アーキテクチャの変化

### 変更前
```
LayoutContext
  ├── vars: Variables
  │     └── solver: KiwiSolver (内部所有)
  └── constraints: LayoutConstraints
```

### 変更後
```
LayoutContext
  ├── solver: KiwiSolver (ContextがSolverを所有)
  ├── vars: Variables (Solverを注入)
  └── constraints: LayoutConstraints
```

solver の所有権が Variables から LayoutContext に移動し、より上位のレイヤーで管理されるようになった。

## 既存コードとの互換性

### 変更なしで動作するパターン
```typescript
// 既存の使い方はすべてそのまま動作
const context = new LayoutContext(theme, resolveSymbol)
const x = context.variables.createVar("x")
context.variables.addConstraint(x, Operator.Eq, 42)
context.solve() // 内部実装が変わっただけで、呼び出し方は同じ
```

### 内部的な変化
- `context.solve()` が内部で `this.solver.updateVariables()` を呼び出すように変更
- しかし、外部からは変化が見えない（カプセル化）

## 次のステップ

移行手順の次の段階：
1. ✅ kiwi ラッパーを作成（完了）
2. ✅ 型の切り出し（完了）
3. ✅ Variables を依存注入対応にする（完了）
4. ✅ LayoutContext に Solver を移動（完了）
5. ⏳ LayoutConstraints の責務整理
6. ⏳ 呼び出し元の更新（段階的に置換）
7. ⏳ 副次作業と検証

次は手順 5（LayoutConstraints の責務整理）または手順 6（呼び出し元の更新）を実施する予定。ただし、現時点で既に主要な目的は達成されており、残りは最適化とさらなる責務の明確化となる。
