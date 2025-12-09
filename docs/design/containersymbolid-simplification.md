# ContainerSymbolId 型の完全削除

## 概要
`ContainerSymbolId` ブランド型を完全に削除し、すべて `SymbolId` に統一することで、型システムの複雑性を削減した。

## 背景
当初 `ContainerSymbolId` は、`SymbolId` との型の区別を強制するためにブランド型（unique symbol を使った交差型）として実装されていた。しかし、実際の使用では以下の課題があった：

1. 型変換のための `toContainerSymbolId` 関数が必要
2. ブランド型のメリットが実運用で限定的
3. 型システムの複雑性が増加

## 実装経緯

### Phase 1: type alias への変更
```typescript
// ブランド型から単純な type alias に変更
export type ContainerSymbolId = SymbolId
```

### Phase 2: 完全削除（実装完了）
- すべての `ContainerSymbolId` 型参照を `SymbolId` に置換
- `toContainerSymbolId` 関数の定義と呼び出しを削除
- 型定義を完全削除

## 最終状態

### 削除された要素
- ❌ `ContainerSymbolId` 型定義
- ❌ `toContainerSymbolId` 関数（`src/model/container_symbol.ts`）
- ❌ `toContainerSymbolId` 関数（`src/dsl/symbol_helpers.ts`）
- ❌ 公開 API からの export（`src/index.ts`）

### 現在の設計
- ✅ すべての識別子は `SymbolId` 型
- ✅ コンテナシンボルの判定は `ContainerSymbol` インターフェース（`container` プロパティの有無）で行う
- ✅ `ContainerSymbolOrId` 型は `ContainerSymbol | SymbolId` として残存

## 設計判断

### なぜ完全削除したか
- **型システムの簡素化**: 不要な型区別を削除
- **コードの明瞭化**: 型変換関数が不要に
- **一貫性の向上**: すべての ID は `SymbolId` で統一
- **インターフェースベースの区別**: ランタイムで判定可能な `ContainerSymbol` インターフェースで区別

### 影響範囲
- **型注釈の変更**: `ContainerSymbolId` → `SymbolId`
- **関数呼び出しの削除**: `toContainerSymbolId(x)` → `x` または `toSymbolId(x)`
- **破壊的変更**: 外部利用者は上記の置換が必要

## 検証
- TypeScript コンパイラによる型チェック: ✅ 成功
- 型テスト (tsd): ✅ 成功
- ユニットテスト: ✅ 123 pass, 0 fail
- コードレビュー: ✅ 問題なし
- セキュリティスキャン (CodeQL): ✅ アラートなし

## 移行ガイド

外部ユーザーが移行する場合：

### 型の置換
```typescript
// 変更前
import type { ContainerSymbolId } from "@tinsep19/kiwumil"
const containerId: ContainerSymbolId = "..."

// 変更後
import type { SymbolId } from "@tinsep19/kiwumil"
const containerId: SymbolId = "..."
```

### 関数呼び出しの削除
```typescript
// 変更前
import { toContainerSymbolId } from "@tinsep19/kiwumil"
const id = toContainerSymbolId(symbolId)

// 変更後
// 関数呼び出しを削除（不要）
const id = symbolId
```

## 関連ファイル
- `src/model/types.ts`: 型定義（削除済み）
- `src/model/container_symbol.ts`: 関数削除
- `src/dsl/symbol_helpers.ts`: 関数削除
- `src/index.ts`: export 削除
- `docs/devlog/2025-12-09-remove-containersymbolid-branding.md`: 実装ログ
