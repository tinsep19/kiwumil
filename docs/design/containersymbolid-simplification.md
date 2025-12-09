# ContainerSymbolId 型の簡素化

## 概要
`ContainerSymbolId` をブランド型から単純な type alias に変更することで、型システムの複雑性を削減しつつ、後方互換性を維持する。

## 背景
当初 `ContainerSymbolId` は、`SymbolId` との型の区別を強制するためにブランド型（unique symbol を使った交差型）として実装されていた。しかし、実際の使用では以下の課題があった：

1. 型変換のための `toContainerSymbolId` 関数が必要
2. ブランド型のメリットが実運用で限定的
3. 型システムの複雑性が増加

## 変更内容

### 変更前
```typescript
declare const CONTAINER_SYMBOL_ID: unique symbol
export type ContainerSymbolId = SymbolId & { readonly [CONTAINER_SYMBOL_ID]: true }
```

### 変更後
```typescript
// ContainerSymbolId をブランド型から単純エイリアスに変更して互換性を保つ
export type ContainerSymbolId = SymbolId
```

## 設計判断

### なぜ削除ではなく type alias にするか
- **後方互換性**: 既存のコードで `ContainerSymbolId` 型を使用している箇所が多数存在する
- **段階的移行**: 将来的な完全削除を視野に入れつつ、まず影響を最小限にする
- **API の安定性**: 公開 API (`src/index.ts`) での export を維持

### 影響範囲
- **型注釈のみの変更**: ランタイムコードには影響なし
- **toContainerSymbolId 関数**: 引き続き動作するが、実質的には型アサーションのみ
- **型の厳密性**: `ContainerSymbolId` と `SymbolId` の区別がなくなる

## 検証
- TypeScript コンパイラによる型チェック: ✅ 成功
- 型テスト (tsd): ✅ 成功
- ユニットテスト: ✅ 123 pass, 0 fail

## 今後の展開

### 段階的削除の手順（オプション）
将来的に `ContainerSymbolId` を完全削除する場合：

1. **Phase 1**: type alias への変更（本変更）
2. **Phase 2**: 使用箇所の置換
   - コードベース全体で `ContainerSymbolId` → `SymbolId` に置換
   - `toContainerSymbolId` 関数の呼び出しを削除
3. **Phase 3**: 型定義と関数の削除
   - `src/model/types.ts` から型定義を削除
   - `src/model/container_symbol.ts` から関数を削除
   - `src/index.ts` から export を削除

### 保持する場合の理由
- ドメインモデルの明確化（コンテナシンボルの識別子であることを型名で表現）
- API ドキュメントの可読性向上

## 関連ファイル
- `src/model/types.ts`: 型定義
- `src/model/container_symbol.ts`: `toContainerSymbolId` 関数
- `src/index.ts`: 公開 API export
