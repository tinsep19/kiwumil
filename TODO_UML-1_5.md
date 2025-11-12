
# TODO: UML 1.5 Elements Implementation List for Kiwumil

Based on the UML 1.5 Specification (Formal/03-03-01).  
📘 Reference: [UML 1.5 Specification (PDF)](https://www.omg.org/spec/UML/1.5/PDF)

---

## 🧩 A. Diagram Types

| 種類 | 内容 |
|------|------|
| Use Case Diagram | アクターとユースケース、およびそれらの関係を表す。 |
| Class Diagram | クラス、インターフェース、属性、操作、継承、関連などを表す。 |
| Object Diagram | 実行時インスタンスの構成を示す。 |
| Statechart Diagram | 状態遷移を表す。 |
| Activity Diagram | アクティビティと制御フローを表す。 |
| Sequence Diagram | 時系列の相互作用を表す。 |
| Collaboration Diagram | オブジェクト間メッセージの構造を表す。 |
| Component Diagram | 実装単位（コンポーネント）を表す。 |
| Deployment Diagram | 実行環境やノード構成を表す。 |

---

## 🧱 B. Model Elements / Symbols（シンボル・ノード）

| カテゴリ | UML 1.5 Element 名 | 説明 |
|-----------|-------------------|------|
| 構造要素 | Class, Interface, Package, Component, Node, Subsystem | 構造やモジュールを表す |
| 動作要素 | UseCase, Actor, Signal, Activity, State, Transition | 振る舞いや相互作用を表す |
| 補助要素 | Note, Comment, Constraint | 図上の注記や条件 |
| 範囲・グループ要素 | SystemBoundary（ユースケース図に登場）, Package（名前空間） | 要素の範囲やコンテナ |
| その他 | Collaboration, Object, Link, Instance | 実行時または協調構造を表す |

---

## 🔗 C. Relationships（関係）

| 種別 | UML 1.5 Element 名 | 説明 |
|------|------------------|------|
| Structural Relationships | Association（集約・合成含む）, Generalization（継承）, Dependency | クラスや要素の構造的関係 |
| Behavioral Relationships | Include, Extend, Use（ユースケース間やアクター間の関係） | ユースケース図特有の関係 |
| Implementation Relationships | Realization（実現） | インターフェースと実装の関係 |
| Refinement / Trace Relationships | Refine, Trace | モデル間追跡など |
| Containment / Ownership | Composition, PackageContainment | 名前空間や包含構造を表す |

---

## 📘 D. Implementation Targets in Kiwumil

| 区分 | 要素 | 対応クラス（予定） | 状況 | 備考 |
|------|------|--------------------|------|------|
| **シンボル** | Actor | `ActorSymbol` | ✅ | 棒人形＋ラベル（実装済み） |
|  | UseCase | `UseCaseSymbol` | ✅ | 楕円＋ラベル（実装済み） |
|  | SystemBoundary | `SystemBoundarySymbol` | ✅ | 範囲定義コンテナ（実装済み、hint.enclose 対応） |
| **関係** | Association | `Association` | ✅ | Actor → UseCase（`rel.associate()`で利用可能） |
|  | Include | `Include` | ✅ | ユースケース間（«include»ステレオタイプ、`rel.include()`で利用可能） |
|  | Extend | `Extend` | ✅ | ユースケース間（«extend»ステレオタイプ、`rel.extend()`で利用可能） |
|  | Generalization | `Generalize` | ✅ | 継承関係（`rel.generalize()`で利用可能） |
| **レイアウトヒント** | horizontal | `hint.horizontal()` | ✅ | 水平配置（実装済み） |
|  | vertical | `hint.vertical()` | ✅ | 垂直配置（実装済み） |
|  | enclose | `hint.enclose()` | ✅ | 含有関係（実装済み） |
| **テーマ** | Theme System | `themes.*` | ✅ | default, blue, dark テーマ（実装済み） |
| **将来拡張** | Class | `ClassSymbol` | ☐ | クラス図用 |
|  | Interface | `InterfaceSymbol` | ☐ | インターフェース |
|  | Package | `PackageSymbol` | ☐ | パッケージ |
|  | Note | `NoteSymbol` | ☐ | 注釈 |
|  | Component | `ComponentSymbol` | ☐ | コンポーネント図用 |
|  | Node | `NodeSymbol` | ☐ | デプロイメント図用 |

---

## 📊 E. Current Implementation Status

### ✅ 実装済み（2025-11-12時点）

#### Symbols（シンボル）
- **ActorSymbol** (`src/plugin/uml/symbols/actor_symbol.ts`)
  - 棒人形の描画
  - テーマ対応（色、線幅、フォントサイズ）
  
- **UseCaseSymbol** (`src/plugin/uml/symbols/usecase_symbol.ts`)
  - 楕円の描画
  - テーマ対応
  
- **SystemBoundarySymbol** (`src/plugin/uml/symbols/system_boundary_symbol.ts`)
  - 矩形コンテナの描画
  - `hint.enclose()` による子要素の含有
  - デフォルトサイズ: 300x200

#### Relationships（関係）
- **Association** (`src/plugin/uml/relationships/association.ts`)
  - シンボル間の直線
  - DSL: `rel.associate(from, to)`
  - テーマ対応

- **Include** (`src/plugin/uml/relationships/include.ts`)
  - 破線の矢印と«include»ステレオタイプ
  - DSL: `rel.include(from, to)`
  - テーマ対応

- **Extend** (`src/plugin/uml/relationships/extend.ts`)
  - 破線の矢印と«extend»ステレオタイプ
  - DSL: `rel.extend(from, to)`
  - テーマ対応

- **Generalize** (`src/plugin/uml/relationships/generalize.ts`)
  - 実線の矢印と白抜き三角形
  - DSL: `rel.generalize(from, to)`
  - テーマ対応

#### Layout Hints（レイアウトヒント）
- **horizontal** - 水平配置
- **vertical** - 垂直配置
- **enclose** - 含有関係（コンテナ内配置）

#### Theme System（テーマシステム）
- **defaultTheme** - デフォルトテーマ
- **blueTheme** - ブルーテーマ
- **darkTheme** - ダークテーマ

#### Core Infrastructure
- **SymbolRegistry** - シンボルの登録と生成
- **RelationshipRegistry** - リレーションシップの登録
- **PluginManager** - プラグインシステム
- **LayoutSolver** - Kiwi制約ソルバーによるレイアウト計算
- **SvgRenderer** - SVG出力

---

🗂️ **Next Steps**

### 🎯 優先度：最高（First Milestone）

**🚧 Pack内要素の自動配置**
- 現状: `hint.enclose()` で複数要素を指定すると重なって表示される
- 目標: コンテナ内の複数要素を自動的に配置（vertical/horizontal/grid）
- 実装案:
  - `hint.enclose()` に layout オプションを追加
  - `hint.enclose(container, children, { layout: 'vertical' })`
  - または `hint.encloseVertical()`, `hint.encloseHorizontal()` を追加
  - enclose制約とvertical/horizontal制約の競合を解決

### 🎯 優先度：高（Use Case Diagram の完成）
~~1. **IncludeRelationship** を実装~~ ✅ 完了 (2025-11-12)
   - `«include»` ステレオタイプ付き破線矢印
   - DSL: `rel.include(from, to)`
   
~~2. **ExtendRelationship** を実装~~ ✅ 完了 (2025-11-12)
   - `«extend»` ステレオタイプ付き破線矢印
   - DSL: `rel.extend(from, to)`
   
~~3. **GeneralizationRelationship** を実装（Actor, UseCase 間）~~ ✅ 完了 (2025-11-12)
   - 白抜き三角形の継承矢印
   - DSL: `rel.generalize(child, parent)`

### 🎯 優先度：中（Use Case Diagram の拡張）
4. **NoteSymbol** を実装
   - 付箋紙型の注釈
   - `rel.annotate(note, target)` で破線接続

5. **Multiplicity** 表示のサポート
   - Association に多重度表示を追加

### 🎯 優先度：低（他のダイアグラムタイプへの拡張）
6. **ClassSymbol** - クラス図の基本
7. **InterfaceSymbol** - インターフェース
8. **PackageSymbol** - パッケージ
9. **ComponentSymbol** - コンポーネント図
10. **NodeSymbol** - デプロイメント図  
