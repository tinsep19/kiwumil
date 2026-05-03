# Kiwumil IR導入 要件定義（初版）

## 1. 背景

現状の Kiwumil は以下を主要価値としている。

- TypeScript DSL による図記述
- セマンティクス重視
- 自動レイアウト + Hint調整
- SVG 出力

今後、以下を実現するため DSL と出力の間に **IR（Intermediate Representation / 中間表現）** を導入する。

- SVG以外の出力形式（SysML, Mermaid, JSON 等）
- プラグイン拡張
- 意味を保持した図の再利用
- 外部ツール連携
- モデルとしての進化

---

## 2. 目的

### 2.1 意味保持
DSLで記述された要素・関係・属性を、描画形式に依存せず保持する。

### 2.2 出力多様化
同一モデルから以下への変換を可能にする。

- SVG
- PNG（将来）
- JSON
- Mermaid（将来）
- PlantUML（将来）
- SysML / UML（将来）

### 2.3 レイアウト分離
意味モデルとレイアウト意図（Hint）、最終座標を分離する。

### 2.4 拡張性
プラグインが独自メタモデルを追加できる構造とする。

---

## 3. 基本設計方針

### 3.1 三層分離

```text
Model Layer   : 意味（要素・関係・属性）
Layout Layer  : 制約・配置意図・解決済座標
View Layer    : 色・線・テーマ・装飾
```

---

## 4. 機能要件

### FR-01 要素表現
ノード要素を保持できること。

例:
- Class
- Actor
- UseCase
- Block
- Requirement
- Generic Node

必要属性:
- id
- type
- label
- namespace
- metadata

### FR-02 関係表現
エッジ関係を保持できること。

例:
- association
- dependency
- composition
- inheritance
- flow
- satisfy

必要属性:
- id
- source
- target
- relationType
- direction
- label(optional)

### FR-03 所有構造
ネスト・内包を表現できること。

例:
- package contains class
- block contains port
- group contains node

### FR-04 属性保持
要素に任意属性を保持できること。

例:
```text
voltage=24V
version=1.2
owner=ops-team
```

### FR-05 制約・Hint保持
レイアウト意図を保持できること。

例:
- vertical arrangement
- align left
- same spacing
- group in grid

### FR-06 解決済レイアウト保持
ソルバ実行後の座標・サイズを保持できること。

```text
x, y, width, height
```

### FR-07 スタイル保持
表示テーマを保持できること。

- stroke
- fill
- font
- radius
- arrow style

### FR-08 Export API
IRから複数形式へ出力可能であること。

```text
IR -> SVG
IR -> JSON
IR -> SysML(subset)
```

### FR-09 Plugin拡張
プラグインが独自 type / relation / style を登録可能であること。

例:
```text
uml.actor
sysml.block
org.team
infra.awsLambda
```

---

## 5. 非機能要件

### NFR-01 Git Friendly
JSON/YAML/TSなど差分しやすい形式でシリアライズ可能であること。

### NFR-02 安定ID
要素IDは変更に強く、差分比較しやすいこと。

### NFR-03 高速性
中規模図（100〜1000要素）で実用速度を維持すること。

### NFR-04 型安全性
TypeScript型定義を提供すること。

### NFR-05 後方互換
既存DSLを大きく壊さず導入可能であること。

---

## 6. 将来要件

### SysML Export
以下 subset を優先候補とする。

- Block Definition Diagram
- Internal Block Diagram
- Requirement Diagram

### AI連携
IRをLLM入力に使えること。

例:
```text
この構成をAWS図にして
依存関係の循環を指摘して
```

---

## 7. 初期スコープ（推奨）

まず v0.1 は以下まで。

```text
Node
Edge
Group
Property
Hint
LayoutResult
SVG Export
JSON Export
```

SysML exporter は v0.2以降。

---

## 8. 成功条件

- SVG renderer が IR ベースで動作する
- JSON export/import が可能
- UML plugin が IR に自然変換される
- 将来的 SysML exporter 実装可能と判断できる

---

## 9. 要約

IR は、Kiwumil の描画エンジン改善ではなく、**semantic modeling platform に進化させる基盤**である。

