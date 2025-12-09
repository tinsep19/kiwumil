# ContainerSymbolId ブランド型削除の実装

## 日時
2025-12-09

## 概要
型ブランドとして定義されていた `ContainerSymbolId` を削除し、単純な type alias (`ContainerSymbolId = SymbolId`) に置き換えた。

## 変更内容

### src/model/types.ts の修正
- **変更前**: `ContainerSymbolId` は `unique symbol` を用いたブランド型
  ```typescript
  declare const CONTAINER_SYMBOL_ID: unique symbol
  export type ContainerSymbolId = SymbolId & { readonly [CONTAINER_SYMBOL_ID]: true }
  ```
- **変更後**: 単純な type alias に変更
  ```typescript
  // ContainerSymbolId をブランド型から単純エイリアスに変更して互換性を保つ
  export type ContainerSymbolId = SymbolId
  ```

## 理由
- 既存コードの import/export を壊さずにブランド型を取り除ける
- 段階的に型を簡素化できる
- ランタイムへの影響はない
- 外部 API の export を維持しつつブランド化のコストを取り除ける

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
- ほとんどの参照は型注釈のみであり、直接のランタイム変更はない
- `src/index.ts` では `ContainerSymbolId` を export しているため、後方互換性が保たれている
- ブランド型を前提とした厳密な型チェックはなくなるが、コンパイルエラーは発生しない

## 今後の展開
将来的に `ContainerSymbolId` を完全削除したい場合は、以下の段階的作業を推奨：
1. リポジトリ全体で `ContainerSymbolId` を `SymbolId` に置換
2. `src/index.ts` の `ContainerSymbolId` export を削除
3. `src/model/types.ts` の型定義を削除
4. `toContainerSymbolId` 関数の削除検討
