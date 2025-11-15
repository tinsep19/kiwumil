# ドキュメント再構成案

## 📋 現状分析

### 現在のルートディレクトリのドキュメント
```
DIAGRAM_INFO_SPEC.md          (11KB, 272行) - DiagramInfo機能の仕様書
IMPLEMENTATION_SUMMARY.md      (3.5KB, 110行) - DiagramInfo機能の実装概要
LAYOUT_DESIGN.md              (25KB, 827行) - レイアウトシステムの設計書
THEME_DESIGN.md               (8.7KB, 285行) - テーマシステムの設計書
```

### 現在の docs/design/
```
namespace-dsl.md              (23KB) - 名前空間ベースDSLの設計
typed-diagram-api.md          (21KB) - TypedDiagram APIの設計
```

---

## 🎯 再構成の目的

1. **一貫性**: すべての設計ドキュメントを `docs/design/` に集約
2. **発見性**: 目的に応じてドキュメントを見つけやすくする
3. **保守性**: 関連ドキュメントをグループ化して管理しやすくする
4. **明確性**: ファイル名から内容が推測できるようにする

---

## 📁 提案: 新しい構成

### Option A: 機能別分類（推奨）

```
docs/
├── design/
│   ├── api/
│   │   ├── typed-diagram.md          （旧: typed-diagram-api.md）
│   │   ├── namespace-dsl.md          （旧: namespace-dsl.md）
│   │   └── diagram-info.md           （旧: DIAGRAM_INFO_SPEC.md）
│   ├── core/
│   │   ├── layout-system.md          （旧: LAYOUT_DESIGN.md）
│   │   └── theme-system.md           （旧: THEME_DESIGN.md）
│   └── implementation/
│       └── diagram-info-impl.md      （旧: IMPLEMENTATION_SUMMARY.md）
│   └── git-workflow.md               （既存）
└── ...
```

**メリット:**
- 機能ごとにグルーピングされて探しやすい
- API設計とコア機能が明確に分離
- 実装詳細は別ディレクトリに

**デメリット:**
- ディレクトリ階層が1段深くなる

---

### Option B: フラット構成（シンプル）

```
docs/
├── design/
│   ├── typed-diagram.md              （旧: typed-diagram-api.md）
│   ├── namespace-dsl.md              （旧: namespace-dsl.md）
│   ├── diagram-info.md               （旧: DIAGRAM_INFO_SPEC.md）
│   ├── diagram-info-implementation.md（旧: IMPLEMENTATION_SUMMARY.md）
│   ├── layout-system.md              （旧: LAYOUT_DESIGN.md）
│   ├── theme-system.md               （旧: THEME_DESIGN.md）
│   └── git-workflow.md               （既存）
└── ...
```

**メリット:**
- シンプルでわかりやすい
- すべてのドキュメントが同じ階層
- ナビゲーションが簡単

**デメリット:**
- ファイルが増えると管理が煩雑になる可能性

---

### Option C: 時系列+機能別（ハイブリッド）

```
docs/
├── design/
│   ├── current/                      （現在のAPI設計）
│   │   ├── typed-diagram.md          （旧: typed-diagram-api.md）
│   │   └── namespace-dsl.md          （旧: namespace-dsl.md）
│   ├── systems/                      （コアシステム設計）
│   │   ├── layout-system.md          （旧: LAYOUT_DESIGN.md）
│   │   └── theme-system.md           （旧: THEME_DESIGN.md）
│   └── archive/                      （過去の設計・実装メモ）
│       ├── diagram-info-spec.md      （旧: DIAGRAM_INFO_SPEC.md）
│       └── diagram-info-impl.md      （旧: IMPLEMENTATION_SUMMARY.md）
│   └── git-workflow.md               （既存）
└── ...
```

**メリット:**
- 現在有効なドキュメントと歴史的ドキュメントを分離
- アーカイブにより過去の意思決定を保持

**デメリット:**
- どれが「現在」でどれが「アーカイブ」か判断が必要
- やや複雑

---

## 🎨 ファイル名の変更理由

| 旧ファイル名 | 新ファイル名 | 理由 |
|------------|------------|------|
| `DIAGRAM_INFO_SPEC.md` | `diagram-info.md` | 小文字統一、`SPEC`は冗長 |
| `IMPLEMENTATION_SUMMARY.md` | `diagram-info-implementation.md` | 何の実装か明確に |
| `LAYOUT_DESIGN.md` | `layout-system.md` | `DESIGN`は冗長、`system`でより一般的 |
| `THEME_DESIGN.md` | `theme-system.md` | 同上 |
| `typed-diagram-api.md` | `typed-diagram.md` | `-api`は冗長（designフォルダ内なので自明） |

---

## 🔄 移行作業

### 推奨手順

1. **決定した構成のディレクトリを作成**
2. **ファイルを移動** (`git mv` を使用)
3. **内部リンクを更新** (もしあれば)
4. **README.md にドキュメントへのリンクを追加**
5. **TODO.md を更新** (完了タスクに追加)

### 影響範囲

- ✅ 内部参照は少ない（各ドキュメントは独立している）
- ✅ 外部からの参照はなし（まだリリース前）
- ⚠️ `git-workflow.md` はまだコミットされていない

---

## 💡 推奨案

**Option B (フラット構成)** を推奨します。

**理由:**
1. **シンプル** - 現在6ファイル程度なので階層化は過剰
2. **発見性** - すべてが `docs/design/` 直下で探しやすい
3. **拡張性** - 将来的に必要なら簡単にサブディレクトリ化できる
4. **一貫性** - 既存の `namespace-dsl.md` と同じ階層

### 提案する最終構成

```
docs/
├── design/
│   ├── typed-diagram.md              
│   ├── namespace-dsl.md              
│   ├── diagram-info.md               
│   ├── diagram-info-implementation.md
│   ├── layout-system.md              
│   ├── theme-system.md               
│   └── git-workflow.md               
└── ...
```

---

## ✅ レビューポイント

以下の点についてご意見をお願いします：

1. **構成案の選択**: Option A, B, C のいずれを採用するか？
2. **ファイル名**: 提案した名前でよいか？より良い案はあるか？
3. **diagram-info-implementation.md の扱い**: 
   - 現在の実装では DiagramInfo は TypedDiagram に統合されている
   - このファイルは古い情報のため、archive または削除すべきか？
4. **git-workflow.md の配置**: `docs/design/` でよいか、それとも `docs/` 直下？
5. **その他の懸念や提案**

---

## 📝 補足情報

### DIAGRAM_INFO_SPEC.md と IMPLEMENTATION_SUMMARY.md について

これらのドキュメントは、現在の TypedDiagram API に統合された DiagramInfo 機能の**過去の設計・実装メモ**です。

**現状:**
- DiagramInfo は TypedDiagram の一部として実装済み
- typed-diagram-api.md に最新の仕様が記載されている

**選択肢:**
1. **保持**: 歴史的資料として archive に移動
2. **更新**: 現在の実装に合わせて内容を更新
3. **削除**: 古い情報なので削除し、typed-diagram.md に一本化

**推奨**: **選択肢3 (削除)** または **選択肢1 (アーカイブ)** - 重複を避けるため
