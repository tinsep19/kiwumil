# ContainerSymbolId ブランド型削除の実装

## 日時
2025-12-09

## 概要
型ブランドとして定義されていた `ContainerSymbolId` を削除し、単純な `SymbolId` に統一した。

## 変更内容

### Phase 1: src/model/types.ts の修正
- **変更前**: `ContainerSymbolId` は `unique symbol` を用いたブランド型
  ```typescript
  declare const CONTAINER_SYMBOL_ID: unique symbol
  export type ContainerSymbolId = SymbolId & { readonly [CONTAINER_SYMBOL_ID]: true }
  ```
- **変更後**: type alias に変更（Phase 1）、その後完全削除（Phase 2）
  ```typescript
  // Phase 2 で完全削除
  ```

### Phase 2: 全体的な置換と削除
- すべての `ContainerSymbolId` 型参照を `SymbolId` に置換
- `toContainerSymbolId` 関数の定義を削除
  - `src/model/container_symbol.ts` から削除
  - `src/dsl/symbol_helpers.ts` から削除
- `toContainerSymbolId` 関数の呼び出しを `toSymbolId` に置換
  - `src/dsl/hint_factory.ts` の3箇所
- export の削除
  - `src/model/index.ts`
  - `src/dsl/index.ts`
  - `src/index.ts`
- テストファイルの更新
  - `tests/layout_solver.test.ts`
  - `tests/layout_constraints.test.ts`
  - `tests/hintfactory_integration.test.ts`
  - `tests/guide_builder.test.ts`

## 理由
- 既存コードの import/export を壊さずにブランド型を取り除ける
- 段階的に型を簡素化できる
- ランタイムへの影響はない
- コンテナシンボルと通常シンボルの区別は `ContainerSymbol` インターフェース（`container` プロパティの有無）で行われるため、ID レベルでの型区別は不要

## 検証結果

### TypeScript 型チェック
```bash
$ tsc --noEmit
# 成功（エラーなし）
```

### 型テスト
```bash
$ bun run test:types
# 成功（エラーなし）
```

### ユニットテスト
```bash
$ bun test
# 123 pass, 0 fail
```

## 影響範囲
- **18ファイル**を変更（Phase 1 + Phase 2）
- 型システムがシンプルになり、不要な型変換が削除された
- 公開 API から `ContainerSymbolId` と `toContainerSymbolId` が削除された
- 外部利用者への影響: `ContainerSymbolId` を `SymbolId` に置き換え、`toContainerSymbolId` 呼び出しを削除すれば移行可能

## Phase 2 後の状態
- `ContainerSymbolId` 型定義は完全に削除
- `toContainerSymbolId` 関数は完全に削除
- すべて `SymbolId` に統一
- `ContainerSymbolOrId` は `ContainerSymbol | SymbolId` として残存（これは有用な型）
