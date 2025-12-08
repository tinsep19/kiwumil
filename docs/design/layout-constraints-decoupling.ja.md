# Symbol を見ずに LayoutConstraints を運用する計画

## 背景

- 現状の `LayoutConstraints` は、`arrange*`/`align*`/`enclose*` などのヒントごとに `SymbolId` を `SymbolBase` へ解決し、その `layout`/`container` bounds を使って制約を組み立てています。これにより制約レイヤーがシンボル依存になり、Solver に必要な `Bounds` のみで表現できていません。
- そこで、Bounds に軽量な識別子 (`boundId`) を追加し、Hint レイヤー側で `SymbolId` を一度だけ解決して `LayoutConstraints` に渡すことで、制約ロジックを `Bounds` の集合に集中させる予定です。

## 目的

1. 各 `Bounds` に `boundId` を持たせることで、制約トラッキングに `SymbolId` を直接使う必要を無くす。
2. Hint レイヤーが `SymbolId` → ソルバに必要な `Bounds`（および必要に応じたコンテナ bounds）を 1 回だけ解決し、それを `LayoutConstraints` に渡す。
3. `LayoutConstraints` を `Bounds`/`LayoutVar` だけで動作するようリファクタリングし、コンストラクタから `resolveSymbol` を除去する。

## 改修概要

| 領域 | 内容 |
| --- | --- |
| Bounds モデル | 既存の `LayoutVar` フィールドに加えて `boundId` を公開し、拘束対象を識別できるようにする。 |
| HintFactory/Builder | `LayoutTargetId` を `{ ownerId: string; layout: LayoutBounds; container?: ContainerBounds }` のような `LayoutConstraintTarget` に変換し、そのまま `LayoutConstraints` に渡す。`nestLevel` 更新は継続。 |
| LayoutConstraints | メソッド引数を `LayoutConstraintTarget[]` に変更し、`target.layout`/`target.container` のみに依存。 Scoped ID は `target.boundId`（あるいは ownerId）を利用。コンストラクタ引数から `resolveSymbol` を削除。 |

## 計画

1. **Bounds に boundId を追加**
   - `Bounds`/`BoundsMap` (`src/layout/bounds.ts`) に `boundId: string` を追加。
   - `LayoutVariables.createBounds()` で指定 ID を元に安定した `boundId` を生成し、返却する Bounds に付与。
   - 受け入れ基準: Bounds が `boundId` を公開し、既存利用側が動作する。

2. **Hint レイヤーで Symbol 解決を完結**
   - `HintFactory.normalizeTargets` などに `LayoutTargetId` を `LayoutConstraintTarget` に変換するヘルパーを追加。
   - Grid/Figure Builder や Guide で `LayoutConstraints` を呼ぶときに解決済みターゲットを渡す（`resolveSymbol` 呼び出しは移動）。
   - 受け入れ基準: ビルダーは bounds + ownerId だけを `LayoutConstraints` に渡す。

3. **LayoutConstraints を Bounds ベースでリファクタリング**
   - `arrangeHorizontal` 等のシグネチャを `LayoutConstraintTarget[]` に変更。
   - `target.layout`/`target.container` から `LayoutVar` を取り出して制約を作成。
   - `record()` や ID 利用箇所は `target.boundId` を使う。
   - コンストラクタから `resolveSymbol` を削除。
   - 受け入れ基準: 制約生成が bounds データのみで完結し、既存テストが通る。

## テスト & リスク

- 既存の layout hint テスト (`tests/layout_constraints.test.ts` など) を新しいターゲットシグネチャに合わせて更新。
- `container` bounds を持たないシンボルが存在するケースでエラーにならないよう、ターゲット生成で `container` を optional に扱う。
- スケジュール: 各主要タスクは 1 日程度。全体が固まったら統合テストで検証。
