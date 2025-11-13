# Diagram Info 機能仕様書

## 概要

Diagramを関数化し、図にメタ情報（タイトル、作成日、著者）を含められるようにする機能の仕様書。

## 目的

- Diagramをより直感的で柔軟に使用できるようにする
- 図にメタデータを含めることで、ドキュメント性を向上させる
- よりクリーンなAPIデザインに変更する

## 要件

### 1. DiagramInfo 型定義

図のメタ情報を表す型を定義する。

```typescript
export interface DiagramInfo {
  title: string          // 図のタイトル
  createdAt?: string     // 作成日（ISO 8601形式推奨）
  author?: string        // 著者名
}
```

### 2. 新しいDiagram API

Diagramを関数として呼び出し、メソッドチェーンで設定を行う形式。

#### 2.1 基本的な使用パターン

```typescript
// パターン1: 文字列でタイトルのみ指定
Diagram("My Diagram")
  .build((el, rel, hint) => {
    const circle = el.circle("Circle")
    const rect = el.rectangle("Rect")
    hint.arrangeHorizontal(circle, rect)
  })
  .render("output.svg")

// パターン2: DiagramInfoでメタ情報を指定
Diagram({
  title: "My UML Diagram",
  createdAt: "2025-11-13",
  author: "John Doe"
})
  .build((el, rel, hint) => {
    // ...
  })
  .render("output.svg")
```

#### 2.2 プラグインとテーマの適用

```typescript
// プラグインとテーマを組み合わせる
Diagram("My UML Diagram")
  .use(UMLPlugin)
  .theme(BlueTheme)
  .build((el, rel, hint) => {
    const actor = el.actor("User")
    const usecase = el.usecase("Login")
    rel.associate(actor, usecase)
  })
  .render("output.svg")

// DiagramInfoと組み合わせて
Diagram({
  title: "System Architecture",
  createdAt: "2025-11-13",
  author: "Development Team"
})
  .use(UMLPlugin)
  .theme(DarkTheme)
  .build((el, rel, hint) => {
    // ...
  })
  .render("output.svg")
```

#### 2.3 メソッドチェーンの順序

メソッドは以下の順序で呼び出す:

1. `Diagram(title | info)` - ダイアグラムの作成
2. `.use(...plugins)` - プラグインの追加（オプション、複数回可能）
3. `.theme(theme)` - テーマの設定（オプション）
4. `.build(callback)` - ダイアグラムの構築
5. `.render(filepath)` - SVGファイルへの出力

### 3. SVG出力への反映

DiagramInfoで指定されたメタ情報をSVG出力に含める。

#### 3.1 表示位置

- タイトル: 図の上部中央に大きく表示
- 作成日・著者: 図の右下隅に小さく表示

#### 3.2 表示スタイル

- タイトル:
  - フォントサイズ: テーマで定義されたベースサイズの1.5倍
  - 位置: 図の上部、中央揃え
  - マージン: 上20px、下30px
  - フォントウェイト: bold

- メタ情報（作成日・著者）:
  - フォントサイズ: テーマで定義されたベースサイズの0.75倍
  - 位置: 図の右下隅（右マージン10px、下マージン10px）
  - 色: テーマのテキストカラーの50%透明度
  - フォーマット例:
    - 作成日のみ: "Created: 2025-11-13"
    - 著者のみ: "Author: John Doe"
    - 両方: "Created: 2025-11-13 | Author: John Doe"

#### 3.3 SVGメタデータ

SVGの`<metadata>`タグにも情報を含める。

```xml
<svg>
  <metadata>
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
             xmlns:dc="http://purl.org/dc/elements/1.1/">
      <rdf:Description>
        <dc:title>My Diagram</dc:title>
        <dc:creator>John Doe</dc:creator>
        <dc:date>2025-11-13</dc:date>
      </rdf:Description>
    </rdf:RDF>
  </metadata>
  <!-- ... -->
</svg>
```

### 4. 実装の詳細

#### 4.1 変更が必要なファイル

1. **`src/dsl/diagram.ts`**
   - シングルトンから関数エクスポートに変更
   - `Diagram(title | info)` 関数を実装
   - 新しいDiagramBuilderインスタンスを返す

2. **`src/dsl/diagram_builder.ts`**
   - コンストラクタで `title | DiagramInfo` を受け取る
   - `build()` メソッドから `name` パラメータを削除
   - DiagramInfoを保持し、renderメソッドに渡す

3. **`src/render/svg_renderer.ts`**
   - コンストラクタで `DiagramInfo` を受け取る
   - タイトルとメタ情報を描画するメソッドを追加
   - Canvas サイズをメタ情報を含めた全体サイズに調整

4. **`src/index.ts`**
   - `DiagramInfo` 型をエクスポート

#### 4.2 新規作成が必要なファイル

1. **`src/model/diagram_info.ts`**
   - `DiagramInfo` インターフェースの定義
   - 内部用の `DiagramMetadata` クラス（DiagramInfoを正規化して保持）

#### 4.3 API シグネチャ

```typescript
// diagram.ts
export function Diagram(titleOrInfo: string | DiagramInfo): DiagramBuilder

// diagram_builder.ts
export class DiagramBuilder {
  constructor(titleOrInfo: string | DiagramInfo)
  use(...plugins: KiwumilPlugin[]): DiagramBuilder
  theme(theme: Theme): DiagramBuilder
  build(callback: DiagramCallback): DiagramResult
}

interface DiagramResult {
  symbols: SymbolBase[]
  relationships: Relationship[]
  render(filepath: string): void
}

// svg_renderer.ts
export class SvgRenderer {
  constructor(
    symbols: SymbolBase[],
    relationships: Relationship[],
    theme: Theme,
    diagramInfo: DiagramInfo
  )
}
```

#### 4.4 テストケース

1. 文字列でタイトルのみ指定した場合の動作確認
2. DiagramInfoで全情報を指定した場合の動作確認
3. DiagramInfoで一部情報のみ指定した場合の動作確認
4. プラグインとテーマの組み合わせでの動作確認
5. SVG出力に正しくメタ情報が含まれることの確認
6. メソッドチェーンの各順序での動作確認
7. SVGメタデータタグの検証

### 5. 実装の優先順位

1. DiagramInfo型とDiagramMetadataクラスの定義
2. DiagramBuilderの変更（コンストラクタとbuildメソッド）
3. Diagram関数の実装
4. SVGレンダラーの拡張（メタ情報の描画）
5. 既存のコード例の更新
6. テストの作成
7. READMEの更新

### 6. Canvas サイズの調整

SVGのviewBoxは以下のように計算する:

```
viewBox = {
  x: 0,
  y: -titleHeight,  // タイトル分上に拡張
  width: originalWidth,
  height: originalHeight + titleHeight + metaInfoHeight
}
```

- `titleHeight`: タイトルが存在する場合は約50px、なければ0
- `metaInfoHeight`: メタ情報が存在する場合は約30px、なければ0

### 7. 注意事項

- DiagramBuilderは各呼び出しで新しいインスタンスを作成（イミュータブル）
- テーマによって文字色やフォントサイズが変わるため、それに対応した実装が必要
- 日付形式は文字列として柔軟に受け入れる（検証はしない）
- 作成日や著者が省略された場合は表示しない

## 例

### 最小限の例

```typescript
import { Diagram } from "kiwumil"

Diagram("Simple Diagram")
  .build((el, rel, hint) => {
    el.circle("A")
  })
  .render("simple.svg")
```

### フル機能の例

```typescript
import { Diagram, UMLPlugin, DarkTheme } from "kiwumil"

Diagram({
  title: "E-Commerce System",
  createdAt: "2025-11-13",
  author: "Architecture Team"
})
  .use(UMLPlugin)
  .theme(DarkTheme)
  .build((el, rel, hint) => {
    const user = el.actor("User")
    const shop = el.usecase("Browse Products")
    const cart = el.usecase("Add to Cart")
    
    rel.associate(user, shop)
    rel.associate(user, cart)
    hint.arrangeVertical(shop, cart)
  })
  .render("ecommerce.svg")
```

## 参考

- 既存のDiagram実装: `src/dsl/diagram.ts`
- DiagramBuilder実装: `src/dsl/diagram_builder.ts`
- SVGレンダラー実装: `src/render/svg_renderer.ts`
- Theme実装: `src/core/theme.ts`
