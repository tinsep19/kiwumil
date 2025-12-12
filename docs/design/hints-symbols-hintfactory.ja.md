# DESIGN: Hints / Symbols / HintFactory の設計

日付: 2025-12-04  
ステータス: 実装完了  
作成者: tinsep19 チーム

## 背景と目的
Guide を作成する際に、Guide 側で LayoutVariable を直接扱いたい（制約を直接作成できるようにしたい）という要望がありました。これに合わせて以下の設計方針を採用します：

- KiwiSolver の既存 API を変更しない（新メソッドは追加しない）。
- Hints は内部的に既存の KiwiSolver API を使って LayoutVariable（＝ソルバが管理する変数）を生成するが、生成された変数を Symbols に自動登録しない。
- HintFactory は LayoutContext を保持せず Hints を保持する。Guide は Hints を経由して変数を得て、その変数と既存 Symbols が管理する Symbol との間で制約を作る。
- Symbols は旧 LayoutVariables と Variables の責務を一つに併合する（別ハンドル型は定義しない）。

この設計は、Guide が変数を直接操作できる柔軟性を確保しつつ、既存のソルバ API 互換性を保持して影響範囲を限定することをねらいとします。

---

## 主要コンポーネントと責務

### KiwiSolver
- 既存の変数作成・制約作成・解法 API をそのまま使う（変更は行わない）。
- 変数（LayoutVariable）と制約（Constraint）の実体を管理する（所有者）。
- Constraint に creator/tag 等のメタ情報を付与できると望ましい（管理・削除が容易になる）。

### Symbols（旧: LayoutVariables + Variables の併合）
- Symbol 名、Bounds、関連する既存 Symbol に関するユーティリティ（align, pin, setMin/Max 等）を管理する。
- Symbols は solver が管理する変数への参照を持つことはあるが、Hints が作った変数を自動的に登録・管理はしない。
- Symbols は Symbol 間の補助的な制約生成メソッドを提供する（ただし Hints の変数は登録対象外）。

### Hints
- Hints.createHintVariable(...) などの API で内部的に既存 KiwiSolver の API を呼んで LayoutVariable を生成する。
- 生成された変数は Hints のスコープ（その Hint の生成物）として保持する。Symbols へは登録しない。
- Hint 固有の制約は solver に登録し、その制約 ID 等を Hints が保持する。

### HintFactory
- HintFactory は LayoutContext を保持しない。代わりに Hints インスタンスを注入して保持する。
- Guide からのリクエストを受け、Hints を使って LayoutVariable を作成し、その変数オブジェクトを Guide に渡す。
- Guide は受け取った変数を使って、必要な制約を自ら生成（solver API を呼ぶ）して Symbols が管理する Symbol とつなぐ。

### Guide（利用者側の振る舞い）
- HintFactory から渡された LayoutVariable（オブジェクト参照）を受け取り、必要に応じて Symbols の Symbol（名前で取得）と制約を作成する。
- Guide が作成した制約のライフサイクル管理（削除タイミング）は Guide 側が明確に持つ。

---

## 生成・接続フロー（例）
1. Guide が HintFactory に対してヒント（例:「アンカー変数が欲しい」）を要求する。
2. HintFactory が Hints.createHintVariable を呼ぶ。
3. Hints は既存の KiwiSolver API を呼び、必要な LayoutVariable を生成する。必要なら Hint 固有の補助制約を solver に登録する。
4. Hints は生成した LayoutVariable を Guide に返す（Symbols には登録しない）。
5. Guide は Symbols.get("symbolX") で既存 Symbol を参照し、solver の制約作成 API を呼んで Symbol と Hints が作った LayoutVariable を結ぶ制約を作る。
6. Guide の不要化時に、Guide は自分が作成した制約を削除する。

---

## API 注意点（設計上の約束）
- KiwiSolver の API 変更は行わない。Hints は既存 API をそのまま利用する。
- Constraint の生成 API は「変数オブジェクト参照」を受け入れることが前提。もし現実装が名前ベースのみであれば、ラッパーを用意する必要あり。
- Constraint に creator/tag 情報を付加するオプションがあると管理が容易（どの Hint/Guide が生成したか追跡可能）。

---

## 命名・スコープポリシー
- Hints が生成する変数に名前付けする場合は自動プレフィックスを付与する（例: hint:anchor_x_1234）。
- Symbols が管理する変数名と衝突しないように注意する。
- Guide が作成する制約には、作成元を示すメタデータ（creator/tag）を付与することを推奨する。

---

## 実装状況

### 実装完了（2025-12-04）

#### Hints クラス (`src/hint/hints.ts`)
- ✅ `createHintVariable(options?: HintVariableOptions): HintVariable` メソッドを実装
  - 内部で `KiwiSolver.createLayoutVar()` を呼び出し
  - 自動プレフィックス `hint:` を付与
  - カウンターによる自動命名（例: `hint:guide_x_0`, `hint:guide_x_1`）
  - 生成した変数を Hints インスタンスで保持
- ✅ `getHintVariables(): readonly HintVariable[]` メソッドを実装
  - Hints が作成したすべての hint 変数を取得可能

#### HintVariableOptions インターフェース
```typescript
interface HintVariableOptions {
  name?: string        // 変数名サフィックス（オプション）
  baseName?: string    // ベース名（デフォルト: "var"）
}
```

#### HintVariable インターフェース
```typescript
interface HintVariable {
  variable: LayoutVar           // 生成された LayoutVar
  name: string                  // hint: プレフィックス付きの完全な変数名
  constraintIds: LayoutConstraintId[]  // 関連する制約 ID
}
```

#### GuideBuilder の統合 (`src/hint/guide_builder.ts`)
- ✅ `GuideBuilderImpl` のコンストラクタを更新
  - `context.variables.createVar()` から `context.hints.createHintVariable()` に変更
  - GuideBuilder が作成する変数も Hints で追跡可能

### テストカバレッジ
- ✅ `tests/hints_createHintVariable.test.ts`: 基本動作テスト（9件）
- ✅ `tests/hintfactory_integration.test.ts`: 統合テスト（6件）
- ✅ 既存テスト（108件）もすべて合格

### 利用例

#### 基本的な使用方法
```typescript
const context = new LayoutContext(theme)

// Hint 変数を作成
const anchor = context.hints.createHintVariable({
  baseName: "anchor_x",
  name: "center"
})
// 生成される変数名: "hint:anchor_x_center"

// 制約を作成
context.createConstraint("anchor/position", (builder) => {
  builder.expr([1, anchor.variable]).eq([100, 1]).strong()
})
```

#### GuideBuilder との統合
```typescript
const hint = new HintFactory({ context, symbols })

// ガイドを作成（内部で Hints.createHintVariable を使用）
const guideX = hint.createGuideX(100)
guideX.alignLeft(symbol1.id, symbol2.id)

// Hints が作成した変数を確認
const hintVars = context.hints.getHintVariables()
console.log(hintVars.map(v => v.name))
// => ["hint:guide_x_guideX-0", ...]
```

### 実装の特徴
1. **既存 API との互換性**: KiwiSolver の API は一切変更していない
2. **Symbols との分離**: Hints が作成した変数は Symbols に自動登録されない
3. **追跡可能性**: `getHintVariables()` で作成した変数を取得可能
4. **命名規則**: `hint:` プレフィックスで明確に区別
5. **後方互換性**: 既存のコードはすべて動作し続ける
