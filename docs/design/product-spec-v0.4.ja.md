# Kiwumil v0.4.0 製品仕様書

## 1. 製品定義

Kiwumil は、TypeScript により図を意味構造として記述し、資料品質の図を自動生成できる Diagram as Code 製品である。v0.4.0 は Semantic IR 中心アーキテクチャへの移行版と位置づける。

---

## 2. v0.4.0 の提供価値

| ID | 提供価値 | 内容 |
|---|---|---|
| VAL-01 | Git管理可能な図 | 差分比較・レビュー可能 |
| VAL-02 | 高品質自動作図 | 手調整を最小化 |
| VAL-03 | Semantic First | 図を意味モデルとして保持 |
| VAL-04 | 拡張可能 | Plugin / Exporter追加可能 |
| VAL-05 | 開発ワークフロー統合 | Bun CLI / CI利用可能 |

---

## 3. v0.4.0 スコープ

### Included

- TypeScript DSL
- Semantic IR
- SVG Export
- JSON Export（診断用途）
- Bun CLI
- kiwi.js（Cassowary）による自動レイアウト
- ELK による配線
- Plugin 基盤
- アーキテクチャ図向けブロック表現

### Excluded

- GUIエディタ
- SaaS機能
- リアルタイム共同編集
- PNG/PDF正式対応
- SysML Exporter
- UML Plugin
- JSON Import
- AI生成UI

---

## 4. 主要ユースケース

| UC-ID | ユースケース | 優先 |
|---|---|---|
| UC-01 | README 用構成図作成 | 高 |
| UC-02 | システム全体構成図作成 | 高 |
| UC-03 | アーキテクチャ説明図作成 | 高 |
| UC-04 | 提案資料向け図生成 | 中 |
| UC-05 | IRをJSON出力して検証 | 中 |

---

## 5. 機能仕様

### SPEC-FUNC-01 図生成DSL

- TypeScript chainable API
- 型補完対応
- deterministic build

### SPEC-FUNC-02 ノード作成

属性:
- id
- label
- type
- metadata
- style

### SPEC-FUNC-03 エッジ作成

属性:
- source
- target
- label
- relationType
- direction

既定 relationType:
- association
- dependency
- flow
- composition

### SPEC-FUNC-04 グループ / コンテナ

ノードを論理グループ化し、内包レイアウト可能。

### SPEC-FUNC-05 自動レイアウト

kiwi.js による制約ベース配置。

Hint対応:
- vertical
- horizontal
- grid
- alignLeft
- sameSpacing
- insideContainer

### SPEC-FUNC-06 配線

ELK による直交配線。

品質条件:
- ノード貫通禁止
- 曲がり回数抑制
- 重なり抑制
- 平行線分離

### SPEC-FUNC-07 Export

- SVG
- JSON(IR dump)

### SPEC-FUNC-08 Plugin API

追加可能:
- Node種別
- Edge種別
- DSL sugar
- style preset

### SPEC-FUNC-09 CLI

```bash
kiwumil render src/system.ts -o out.svg
kiwumil render src/system.ts -f json
kiwumil validate src/system.ts
```

---

## 6. データ仕様

### SPEC-DATA-01 Semantic IR

Semantic IR は、**ユーザーが DSL で記述した内容（意味・属性・関係・グループ化・Hint・スタイル参照）を素直に保持する JSON 表現**とする。

- 座標（x/y/width/height）や配線（polyline 等）のような幾何情報は含めない（それらは後段の Geometry / Routing の責務）
- 参照は ID ベース（edge は source/target の node ID を参照）
- 主要構成（最低限）:
  - nodes[]
  - edges[]
  - groups[]
  - constraints[]（Hint を含む）
  - styles[]

### SPEC-DATA-02 安定ID

再生成時に不要な ID 変動を抑制する。

### SPEC-DATA-03 JSON Export（Semantic IR dump）

JSON Export は **Semantic IR を診断用途で出力**する。

- Git diff しやすい整形 JSON（改行・インデントを固定）
- **決定論のために正規化して出力**する（例: 配列は ID 等で安定ソートし、同一入力は同一 JSON になる）
- schemaVersion を付与し、将来の変更に備える（例: "0.4"）

---

## 7. 性能仕様

| ID | 条件 | 目標 |
|---|---|---|
| PERF-01 | 100要素 | 1秒以内 |
| PERF-02 | 500要素 | 3秒以内 |
| PERF-03 | 同一入力 | 同一出力 |

---

## 8. 実行環境・互換性

- Primary Runtime: Bun
- 対応OS: Linux / macOS / Windows
- API後方互換は保証しない
- DSLの書き味は大きく変えない

---

## 9. 受入条件（Done定義）

- READMEサンプル3種生成成功
- SVG品質が既存版以上
- JSON Export可能
- CLI render動作
- Snapshot test green
- kiwi.js + ELK 統合動作

---

## 10. Plugin / Component 仕様

### Semantic Public / Visual Private 原則

- 利用者向け API は Semantic First とする
- Plugin は意味語彙（Service / Database / Queue 等）を提供する
- Plugin 内部では Primitive + Layout DSL により Visual Component を構成する

### Core Primitive（予定）

- rectangle
- text
- icon
- line
- port
- badge
- group

### Core Layout DSL（予定）

- vstack
- hstack
- grid
- overlay
- padding
- align
- center
- spaceBetween

### 利用者イメージ

```ts
block.service("API")
block.database("MainDB")
```

### Plugin内部イメージ

```ts
roundedRect(
  vstack([
    icon("db"),
    text(label)
  ])
)
```

---

## 11. 要求トレーサビリティ（REQ-SPEC-CHK）

> 製品要求仕様書の正式REQ-ID（3桁採番）と同期

| REQ-ID | 要求 | 対応SPEC | 確認方法（CHK） | 合否基準 |
|---|---|---|---|---|
| REQ-001 | Git管理しやすい図を作成できる | SPEC-FUNC-07, SPEC-DATA-03, SPEC-FUNC-09 | Git diff / CLI運用確認 | 差分がJSON/SVGで追跡可能 |
| REQ-002 | 高品質な自動作図ができる | SPEC-FUNC-05, SPEC-FUNC-06, SPEC-UX-02 | サンプル図レビュー | 手修正5分以内で資料転用可能 |
| REQ-003 | Semantic Firstで意味構造を保持できる | SPEC-DATA-01, SPEC-FUNC-01 | IR / JSON確認 | ノード・関係・グループ情報が欠落しない |
| REQ-004 | 拡張可能な基盤である | SPEC-FUNC-08, Plugin仕様 | Plugin試作 | 独自語彙3種を1日以内に追加可能 |
| REQ-005 | 開発ワークフローへ統合できる | SPEC-FUNC-09, OPS-01 | CI組込試験 | 非対話CLI実行成功 |
| REQ-006 | 学習コストが低い | SPEC-UX-01 | 初回利用テスト | サンプル図作成30分以内 |
| REQ-007 | 資料転用しやすい | SPEC-UX-02, Theme仕様 | PowerPoint貼付確認 | レイアウト崩れなく利用可能 |

---

## 12. 検証計画 / 受入基準

### 機能受入

- CLI render が正常終了する
- SVG / JSON Export が成功する
- Plugin 読み込みが成功する

### 品質受入

- 100要素図が1秒以内で生成される
- 同一入力で同一出力となる
- ノード貫通配線が発生しない

### UX受入

- README図サンプル3種が追加修正なしで利用可能
- 初回利用者が30分以内に基本図を作成できる

---

## 13. 意思決定ステータス

### 決定済み（Approved）

- Primary Runtime は Bun とする
- レイアウトは kiwi.js（Cassowary）ベース内製エンジンとする
- 配線は ELK を使用する
- API後方互換は保証しない
- DSLの書き味は大きく変えない
- UML Plugin は v0.4.0 対象外とする
- JSON Import は v0.4.0 対象外とする
- Plugin は Semantic Public / Visual Private 原則とする
- Plugin API は Semantic API + Layout API を公開し、Engine内部は非公開とする
- ブロック図語彙は Block Plugin として分離する
- Node.js 対応は当面見送る

### 方針確定・詳細仕様化待ち（Defined, Details Pending）

- Core Primitive の最終セット（rectangle / text / icon 等）
- Core Layout DSL の関数一覧とシグネチャ
- Block Plugin の標準語彙（System / Service / DB / Queue 等）
- SVG テーマ初期セット（default / presentation / engineering）
- Plugin versioning 方針
- JSON Export schema の公開粒度

### 未決事項（Open Decisions）

- Bun 専用運用とするか、将来 Node.js 再対応するかの判断時期
- SVG テーマをコア同梱するか Plugin 提供にするか
- Plugin API の安定版公開タイミング（v0.4.x / v0.5.0 以降）
- JSON Import を着手する次期バージョン

