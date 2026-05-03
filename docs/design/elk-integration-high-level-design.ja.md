# Kiwumil + ELK 統合 上位設計

## 1. 概要

Kiwumil は、図をセマンティクス（意味）中心に記述し、必要な場合のみレイアウト意図を加えて美しく整える TypeScript ベースの Diagram as Code 基盤である。

ELK（Eclipse Layout Kernel）を統合することで、Kiwumil は以下を備えた統合アーキテクチャへ進化する。

- TypeScript による記述性
- セマンティクス保持
- 制約ベース整列（Kiwi / Cassowary 系）
- 高品質な自動配置・配線（ELK）
- SVG / PNG / PDF 出力
- プラグインによるドメイン拡張

---

## 2. 設計目標

1. セマンティクスを壊さず図を生成する
2. 自動レイアウトを基盤とする
3. 必要時のみ Hint による微調整を許可する
4. 配置問題と配線問題を分離する
5. エンジン差し替え可能な構造にする
6. CLI / CI / Git 管理に適した決定論的出力を行う

---

## 3. 全体アーキテクチャ

```text
TypeScript Source
   ↓
Kiwumil API / Plugin DSL
   ↓
Semantic IR
   ↓
Layout Planning Layer
   ↓
+--------------------------+
| Constraint Solver        |
| Kiwi / Cassowary         |
+--------------------------+
            +
+--------------------------+
| Routing Engine           |
| ELK / Custom Router      |
+--------------------------+
   ↓
Geometry IR
   ↓
Beautifier
   ↓
Renderer
   ↓
SVG / PNG / PDF
```

---

## 4. 層ごとの責務

## 4.1 Authoring Layer

ユーザーは TypeScript で図を記述する。

責務:

- ノード定義
- 関係定義
- Hint 指定
- プラグイン利用

例:

```ts
TypeDiagram("Login")
  .use(UMLPlugin)
  .layout(({ el, rel, hint }) => {
    const user = el.uml.actor("User")
    const login = el.uml.usecase("Login")
    rel.uml.associate(user, login)
    hint.arrangeVertical(user, login)
  })
```

---

## 4.2 Semantic IR

図の意味情報を保持する中間表現。

```text
nodes[]
edges[]
containers[]
kinds[]
labels[]
styles[]
constraints[]
```

特徴:

- 描画座標を持たない
- レンダラ非依存
- エンジン差し替え可能

---

## 4.3 Layout Planning Layer

Semantic IR を配置可能な形へ変換する層。

責務:

- ノードサイズ見積もり
- 優先順位付け
- ELK / Kiwi への入力生成
- 制約競合解決準備

---

## 4.4 Constraint Solver Layer

Kiwi / Cassowary 系ソルバで整列・余白・揃えを解く。

得意領域:

- 右揃え
- 左揃え
- 等高揃え
- 等幅揃え
- グループ整列
- spacing 指定
- container 内包

出力:

```text
x, y, width, height
```

---

## 4.5 Routing Engine Layer

ELK または自作ルータによりエッジ経路を決定する。

得意領域:

- orthogonal routing
- crossing reduction
- bend reduction
- compound graph routing
- hierarchy aware routing
- port constraints

インターフェース:

```ts
interface RoutingEngine {
  route(input: RoutingInput): GeometryIR
}
```

実装候補:

- ElkRoutingEngine
- AStarRoutingEngine
- Future Commercial Engine

---

## 4.6 Policy Layer

Constraint Solver と Routing Engine の要求が衝突した際の裁定層。

例:

- 右揃えしたいが交差が増える
- 短経路だが見た目が崩れる

優先度モデル:

```text
Required : semantic validity
Strong   : user hints
Medium   : visual quality
Weak     : path length
```

---

## 4.7 Beautifier Layer

計算結果をそのまま描かず、視覚品質を向上させる層。

担当:

- corner radius
- parallel spacing
- bus style bundling
- arrow alignment
- label avoidance
- overlap micro fix

---

## 4.8 Renderer Layer

最終成果物を出力する。

出力形式:

- SVG（主力）
- PNG
- PDF

将来候補:

- Canvas
- Mermaid export
- JSON export

---

## 5. Plugin Architecture

ドメインごとの語彙・既定動作を追加する。

例:

- UMLPlugin
- C4Plugin
- AWSPlugin
- KubernetesPlugin
- ERPlugin

Plugin が提供するもの:

```text
semantic vocabulary
default constraints
default style
routing preference
renderer extensions
```

---

## 6. CLI / Bun 実行モデル

```bash
kiwumil render system.ts -o system.svg
kiwumil validate system.ts
kiwumil lint system.ts
```

Bun 採用理由:

- 高速起動
- TypeScript ネイティブ実行
- CLI と相性が良い
- CI 組み込みしやすい

---

## 7. 非機能要件

## 7.1 決定論的出力

同じ入力は常に同じ出力。

## 7.2 性能

- 中規模図面を数秒以内で生成
- 大規模図面でもタイムアウトしない

## 7.3 拡張性

- Engine 差し替え可能
- Plugin 追加可能
- Renderer 追加可能

## 7.4 保守性

IR 中心設計により内部変更を局所化する。

---

## 8. 推奨ディレクトリ構成

```text
src/
  api/
  core/
    ir/
    planner/
    policy/
  engines/
    kiwi/
    elk/
  plugins/
    uml/
    c4/
  beautify/
  render/
  cli/
```

---

## 9. 実装ロードマップ

## Phase 1

- Semantic IR 固定
- SVG Renderer
- Kiwi 統合

## Phase 2

- ELK Adapter 実装
- Orthogonal Routing

## Phase 3

- Policy Layer
- Beautifier 強化

## Phase 4

- Plugin 拡充
- Explainability
- Custom Router

---

## 10. 設計原則（最重要）

1. セマンティクスを第一級に扱う
2. 座標は内部実装詳細であり、入力主語にしない
3. 自動化を基本とし、Hint は補助とする
4. ELK は部品であり中心ではない
5. 中心は Semantic IR と Authoring UX である

---

## 11. 一文で定義するなら

> Kiwumil is a semantic diagram platform powered by pluggable layout engines.

