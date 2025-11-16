# FlowchartPlugin 仕様書

作成日: 2025-11-16  
対象リポジトリ: kiwumil

目的
- フローチャート図を簡潔に描画できる名前空間ベースのプラグインを提供する。
- コアの汎用図形（rectangle, circle 等）は再利用しつつ、フローチャート固有の図形・振る舞い（Decision, Input/Output, Terminator, Database など）をプラグインとして分離する。

設計方針
- プラグインは DiagramPlugin インターフェースに従う（既存設計に準拠）。
- core に既にある汎用図形は再利用する（例: Process は core.rectangle を利用できる）。
- FlowchartPlugin はフローチャート特有の図形のみを実装する（Decision 等）。汎用的なものは core に置く。
- 各 Symbol は
  - getDefaultSize()
  - getConnectionPoint(from: Point)
  - toSVG()
を提供する。
- ID 生成は createIdGenerator(this.name) を使い、ID は "flowchart:decision-1" のようにする。
- Theme は既存の Theme 型を利用し、プラグイン固有のシンボルキーを追加する（SymbolName は string）。

Scope（含めるもの）
- Symbols（優先度順）
  1. Decision（ひし形、分岐）
  2. InputOutput / Parallelogram（入出力）
  3. Terminator（開始/終了: 楕円 or 丸め矩形）
  4. Connector（小丸の接続ノード）
  5. Database / Cylinder（データ永続化）
  6. OffPage（ページ外リンク用の記号）
  7. Note / Annotation（付箋、注釈） — 補助的
  8. （必要なら）Process alias（core.rectangle をラップして Flowchart の API と整合）
- Relationships
  - flow(from: SymbolId, to: SymbolId, opts?: {label?: string, arrowHead?: 'normal'|'open'|'none'}) : RelationshipId
  - conditional(from, to, conditionLabel) — label が条件を示すことが多い（ただし流れは単に flow で表現可能）
  - connectorLink（Connector ノード同士、あるいはページ内ジャンプ用） — 実装は optional

API（DSL）
- plugin.name = 'flowchart'
- createSymbolFactory(userSymbols) が返す関数例:
  - decision(label: string): SymbolId
  - inputOutput(label: string): SymbolId
  - terminator(label: string): SymbolId
  - connector(label?: string): SymbolId
  - database(label: string): SymbolId
  - offpage(label?: string): SymbolId
  - note(label: string): SymbolId
  - process(label: string): SymbolId // 実装は core.rectangle を使うかラップ
- createRelationshipFactory(relationships) が返す関数例:
  - flow(from: SymbolId, to: SymbolId, label?: string): RelationshipId
  - conditional(from: SymbolId, to: SymbolId, label: string): RelationshipId (wrapper)
  - goto(from: SymbolId, to: SymbolId): RelationshipId (off-page/connector 用)

Symbol 実装要件（各シンボル共通）
- getDefaultSize(): 標準的な見た目に合った幅/高さを返す（例: Decision 120x120、InputOutput 120x60、Terminator 140x60、Database 100x80）。
- getConnectionPoint(from: Point): 「from」座標から symbol の中心へ向かう直線と図形境界の交点を返すこと。多角形（Decision, Parallelogram）は辺ごとの線分交差判定で算出する。
- toSVG(): シンボルの SVG マークアップを返す。ラベルは中央配置が基本。テーマのスタイルを参照して色・線幅・フォントを決定する。
- エラー処理: bounds が未設定なら適切なエラーを投げる。

テーマ / スタイル
- FlowchartPlugin は Theme.symbols に以下のキーを想定する（すべて Partial           + シンボル固有プロパティを許容）。
  - decision: { fillColor, strokeColor, strokeWidth, textColor, fontSize }
  - inputOutput: { fillColor, strokeColor, strokeWidth, textColor, fontSize, skew: number }
  - terminator: { fillColor, strokeColor, strokeWidth, textColor, fontSize, cornerRadius }
  - connector: { fillColor, strokeColor, radius }
  - database: { fillColor, strokeColor, strokeWidth, topEllipseRatio }
  - offpage: { fillColor, strokeColor, strokeWidth }
  - note: { fillColor, strokeColor, foldSize }
- デフォルト値は DefaultTheme の defaultStyleSet をベースにシンボルごとに上書きする。

SVG / 表示上の留意点
- viewBox 固定ではなく bounds に合わせて座標を埋める（既存 Symbol 実装に合わせる）。
- Database (Cylinder): 上下に楕円を描き、中央は矩形で接続する。topEllipseRatio で上楕円高さ比を調整。
- Decision: 中心を基準に回転 45° の四角（菱形）または対角線ベースで描画。ラベルは中心に水平に描画する。
- Parallelogram: 片側をシフトさせる。skew 値で左右の傾斜を制御。
- Terminator: 楕円か半径付き長方形。core.roundedRectangle を流用できる設計が望ましい。
- Connector: 小さな円。中心にラベルを入れることも可能だが通常は無名。

接続（Relationships）実装要件
- Flow（矢印）は relationship ベースで実装。矢印描画時は start/end の connectionPoint を使う。
- 矢印のスタイルは theme で制御できる（色・線幅・矢印形状）。
- conditional は実態は flow だがラベルを条件として描画するユーティリティ関数でよい。

テスト計画
- Unit: 各 getConnectionPoint に対して複数の from 方向（上/下/左/右/斜め）で期待座標が返るか。
- Snapshot: 各 Symbol.toSVG() の出力スナップショット比較。
- Integration: DSL を使った簡単なフローチャート描画シナリオのレンダリング確認（SVG の主要要素が存在するか）。
- Theme: シンボル固有キーを与えたときに色や形状パラメータが反映されることを確認。

ドキュメント
- docs/design/plugin-system.md にある他のプラグインの例に合わせて、利用例を追加。
- 例:
  - el.flowchart.decision("Yes?") / el.flowchart.process("Do X") / rel.flowchart.flow(p1, p2, "yes")
- README に図形一覧・テーマキー一覧・実装ガイドを載せる。

移行 / 互換性
- core の rectangle, circle 等はそのまま使えるようにする（FlowchartPlugin の process() は core.rectangle() を呼ぶラッパーにすることを推奨）。
- SymbolName は string 型なので theme 型の変更は不要（プラグイン固有のスタイルは既存設計に適合）。

実装ステップ（推奨順）
1. スケルトン: src/plugin/flowchart/plugin.ts を作成し DiagramPlugin 仕様に沿って骨格を用意（name='flowchart'）。
2. Symbols: Decision, Parallelogram, Terminator の Symbol クラスを作成（src/plugin/flowchart/symbols/*.ts）。
3. Relationships: flow 関数と Relationship クラス（矢印）を作成（src/plugin/flowchart/relationships/flow.ts）。
4. Theme: docs で利用方法を明示し、DefaultTheme.symbols に optional なサンプルを追加（docs または examples）。
5. Tests: 単体・スナップショットを追加。
6. Examples: docs/examples/flowchart.md でサンプルコードと生成 SVG を示す。
7. PR: 設計ドキュメント + 実装 + テストの形で提出。

具体的なタスク（Issue / PR 単位の分解案）
- Issue A: FlowchartPlugin: skeleton + README
- Issue B: Symbol: Decision class + tests
- Issue C: Symbol: Parallelogram class + tests
- Issue D: Symbol: Terminator class + tests
- Issue E: Relationship: Flow arrow class and rel factory + tests
- Issue F: Examples and docs
- Issue G: Theme samples and snapshots

実装の備考（詳細ポイント）
- Decision の接続点: 四辺それぞれの辺との交点を使う。角の極端ケースを扱うために epsilon を使った比較を入れる。
- Parallelogram の skew: bounds.width * skew で左/右ずらしを計算。
- Database の楕円: 上の楕円は topEllipseRatio * height で決定。正しい合成順（上楕円、中央矩形、下楕円）で描画。
- ラベル折返し/改行: 長いラベル対応は既存のテキスト描画ロジック（もしあれば）を利用。なければ単純に fontSize と bounds で切るか改行挿入する簡易ロジックを入れる。

見積り（粗）
- スケルトン + Decision + tests: 1-2 日
- Parallelogram + Terminator + Database: 2-3 日
- Relationships + docs + examples + snapshots: 1-2 日
- 合計（Baseline MVP）: 4-7 日（レビュー含まず）

次のアクション提案
- この仕様でよければ、まず plugin.ts と Decision / Parallelogram のシンボル実装スケルトン（ファイル雛形）を作成して PR を用意します。どちらから作りましょうか?
