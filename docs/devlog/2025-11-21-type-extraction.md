# 2025-11-21 型の切り出し（移行手順 2）

## 背景

[docs/draft/kiwi-boundary-refactor.md](../draft/kiwi-boundary-refactor.md) の移行手順 2 を実施。

移行手順 1 で kiwi ラッパーモジュール（`src/layout/kiwi/index.ts`）を作成したが、型定義とブランドシンボルが kiwi モジュール内に配置されていた。これにより将来的に循環依存が発生する可能性があるため、型定義を独立したモジュールに分離する必要があった。

## 実施した作業

### 1. layout_types.ts の作成

**追加ファイル**: `src/layout/layout_types.ts`

以下の型定義とヘルパー関数を配置：

#### ブランドシンボル
- `LAYOUT_VAR_BRAND`: LayoutVar 型の識別用シンボル
  - const として定義し、名前付きエクスポートで外部から参照可能

#### 型定義
- `LayoutVar`: ブランド付き kiwi.Variable 型
- `LayoutTerm`: レイアウト式の項（変数 + 係数）
- `LayoutExpression`: レイアウト式（項の配列 + 定数）
- `LayoutExpressionInput`: 式の入力型（式、変数、定数のいずれか）

#### 型ガード関数
- `isLayoutVar(input)`: LayoutVar 型の判定
- `isLayoutExpression(input)`: LayoutExpression 型の判定

### 2. kiwi/index.ts の更新

**変更ファイル**: `src/layout/kiwi/index.ts`

#### インポートの変更
```typescript
// 旧: 型定義を直接実装
// 新: layout_types.ts からインポート
import {
  LAYOUT_VAR_BRAND,
  isLayoutVar,
  isLayoutExpression,
  type LayoutVar,
  type LayoutTerm,
  type LayoutExpression,
  type LayoutExpressionInput
} from "../layout_types"
```

#### 型の再エクスポート
互換性を保つため、インポートした型を再エクスポート：
```typescript
export type { LayoutVar, LayoutTerm, LayoutExpression, LayoutExpressionInput }
export { isLayoutVar, isLayoutExpression }
```

#### 重複コードの削除
- 型定義（LayoutVar, LayoutTerm, LayoutExpression, LayoutExpressionInput）を削除
- 型ガード関数（isLayoutVar, isLayoutExpression）を削除
- ブランドシンボル定義を削除

### 3. TypeScript 型エラーの修正

当初、`LAYOUT_VAR_BRAND` を `export const` として定義し、型定義で `typeof LAYOUT_VAR_BRAND` を使用していたが、TypeScript のコンパイルエラーが発生：

```
error TS1170: A computed property name in a type literal must refer to an expression whose type is a literal type or a 'unique symbol' type.
```

**解決策**:
- `LAYOUT_VAR_BRAND` を `const` として定義（export なし）
- 名前付きエクスポート `export { LAYOUT_VAR_BRAND }` で外部から参照可能にする
- 型定義では `[LAYOUT_VAR_BRAND]` を直接使用（`typeof` なし）

これにより、TypeScript がシンボルの一意性を正しく認識できるようになった。

### 4. テストの実行

すべてのテストが成功することを確認：
```bash
$ bun test
 66 pass
 0 fail

$ bun run test:types
# 型テストも成功
```

## 効果

### 1. 循環依存の回避
- 型定義が独立したモジュールに分離されたため、他のモジュールが型のみを参照できる
- kiwi モジュールは実装（関数やクラス）に専念できる

### 2. モジュール構造の明確化
```
src/layout/
├── layout_types.ts       ← 型定義のみ（kiwi に依存しない基本型）
├── kiwi/
│   └── index.ts          ← kiwi 依存のユーティリティと実装
├── layout_variables.ts   ← 変数管理（kiwi モジュール経由で型を使用）
├── layout_context.ts     ← コンテキスト管理
└── layout_constraints.ts ← 制約管理
```

### 3. 依存関係の整理
- `layout_types.ts` → kiwi（@lume/kiwi のみ）
- `kiwi/index.ts` → kiwi + layout_types
- `layout_variables.ts` → kiwi（型と実装の両方）

### 4. 既存コードとの互換性維持
- kiwi/index.ts が型を再エクスポートしているため、既存のインポート文は変更不要
- layout_variables.ts など他のモジュールは影響を受けない

## 次のステップ

移行手順の次の段階：
1. ✅ kiwi ラッパーを作成（完了）
2. ✅ 型の切り出し（完了）
3. ⏳ LayoutVariables を依存注入対応にする
4. ⏳ LayoutContext に Solver を移動
5. ⏳ LayoutConstraints の責務整理

次は手順 3（LayoutVariables の依存注入対応）を実施する予定。
