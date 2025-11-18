# ContainerSymbolBase Draft

## 背景 / 課題
- `SystemBoundarySymbol` や `DiagramSymbol` のようなコンテナは `SymbolBase` を直接継承しつつ、子シンボル情報 (`containerId`, `nestLevel`) はヒント側で都度設定している。
- コンテナ固有の制約（パディング、子要素に対する Required 制約、最小サイズの算出など）が散在し、今後コンテナを増やす際にロジックが重複する。
- `ContainerSymbolId` をブランド化したものの、型レベルで「このシンボルはコンテナである」と分かる仕組みがクラスレベルに存在しない。

## 目的
1. コンテナに必要な共通責務を `ContainerSymbolBase` に集約し、レイアウト/DSL/描画の再利用性を高める。
2. `ContainerSymbolId` ブランドとクラス階層を連動させ、型推論によって `hint.enclose()` 等が安全に扱えるようにする。
3. パディング/余白/自動リサイズなどの挙動をコンテナ実装ごとにカスタマイズ可能にしつつ、デフォルト実装を提供する。

## 実装状況 (2025-11-18)
- `ContainerSymbolBase` を追加し、`DiagramSymbol` / `SystemBoundarySymbol` が継承。`inbounds`/padding/ヘッダーの制約を共通化し、`LayoutConstraints.enclose` は inbounds を参照するようになった。
- `LayoutConstraints` にビルダー API を導入し、`SymbolId | ContainerSymbolId` 単位で `constraints/${symbolId}/${counter}` ID が採番される。
- `HintFactory` の arrange/align/enclose はシンボル/コンテナ混在を許容し、`registerChild` でコンテナが子情報を追跡する。
- `ContainerSymbolId` / `toContainerSymbolId` を公開 API としてエクスポートし、ブランド化は既存の `generateSymbolId` からの型変換で行う（ID 生成 API を増やさない）。

## 想定 API
```ts
export abstract class ContainerSymbolBase<TId extends ContainerSymbolId = ContainerSymbolId> extends SymbolBase {
  readonly id: TId
  protected padding: ContainerPadding
  protected childIds = new Set<SymbolId>()

  protected abstract getContainerPadding(theme: Theme): ContainerPadding

  registerChild(id: SymbolId) {
    this.childIds.add(id)
  }

  clearChildren() {
    this.childIds.clear()
  }
}
```

- コンストラクタで `ContainerSymbolId` のみを受け付ける。
- `ContainerPadding` は上下左右別設定またはテーマ連動可能にする。
- 子 ID の管理は `HintFactory` から呼び出すユーティリティ経由で更新し、`nestLevel` や `containerId` の設定もまとめて行う。

## レイアウト連携
- `ContainerSymbolBase` は `ensureLayoutBounds()` 時に `LayoutConstraints` のビルダー API を利用して、`constraints/${symbolId}/${counter}` 命名でサイズ系制約を登録する（`setDefaultSize/setMinSize` 相当は各シンボルが直接 `eq`/`ge` を呼ぶ）。
- `inbounds`（padding やヘッダーを差し引いた内部領域）を `LayoutVar` セットとして保持し、`layoutBounds` との間に `eq/Ge` 制約を張る。派生クラスは `getPadding()` / `getHeaderHeight()` を実装し、`ContainerSymbolBase` 側で共通ロジックを提供する。
- `layout.constraints.enclose()` はコンテナ実体から `inbounds` を取得して Required 制約を生成する。子として `SymbolId | ContainerSymbolId` を受け付け、入れ子コンテナにも対応する。
- DiagramBuilder が暗黙的に生成する DiagramSymbol も `ContainerSymbolBase` を継承し、`hint.enclose()` への ID 受け渡しと inbounds の扱いを統一する。

## DSL/型推論
- `DiagramPlugin.createSymbolFactory` の戻り型で、`ContainerSymbolBase` を返すファクトリは `ContainerSymbolId` を返すと推論できるようにする（例えば conditional types で `SymbolBase & { id: ContainerSymbolId }` を識別）。
- `HintFactory.enclose()` / `GuideBuilder` などで `SymbolBase` を参照する際、`instanceof ContainerSymbolBase` によるランタイムチェックも可能にする。

## 描画/テーマ
- コンテナのデフォルト padding やラベル位置などを `ContainerSymbolBase` が持つ `getContainerStyle()` で共通定義しつつ、各派生クラスが `renderBody()` のみ上書きできる構造を検討。
- 子要素情報を用いて、描画時にヘッダーや装飾を自動配置する仕組みを提供できるか検討（例: 子要素一覧の自動レンダリング）。

## LayoutConstraints ビルダーとの連携
- `LayoutConstraints` に `expression`, `eq`, `ge` などを備えたビルダーを追加し、`createBuilder(symbolId)` が `constraints/${symbolId}/${counter}` ID を採番。
- `ContainerSymbolBase`（および通常の `SymbolBase`）はビルダーを使って自分固有の制約を登録し、メタデータを統一フォーマットで蓄積できるようにする。
- Arrange/Align/Enclose などの高レベル API も引き続き `LayoutConstraints` から提供され、`SymbolId | ContainerSymbolId` の混在をサポートする。

## マイグレーション案
1. `ContainerSymbolBase` を追加し、`DiagramSymbol` → `SystemBoundarySymbol` の順に移行 (`inbounds`/padding 制約を付与)。
2. `HintFactory.enclose()` でコンテナインスタンスに `registerChild()` を呼び、`nestLevel`/`containerId` 更新を一元化。子にはコンテナを含められるよう型と実装を更新。
3. `LayoutConstraints` にビルダー API を実装し、既存の `setDefaultSize`/`setMinSize` 呼び出しを段階的に置き換える。
4. `LayoutContext` / `DiagramBuilder` / `tsd` テストを順次更新し、`enclose` の入れ子・型制約を検証する。

## 未決定事項
- `childIds` をレイアウトのみで使うか、描画/エクスポートにも公開するか。
- コンテナ内の自動配置（例えば子要素のスタック方向）を `ContainerSymbolBase` が管理するのか、従来通り hint/API に任せるのか。
- Theme との連動範囲：padding/背景色をテーマで制御する場合の API をどう整えるか。
