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

#### 4.1 Diagram自体をSymbolとして扱う設計

Diagram自体を特殊なSymbol（`DiagramSymbol`）として実装し、以下のようにする:

1. **DiagramSymbolの特徴**
   - `SymbolBase` を継承
   - DiagramInfoを保持
   - `build()` コールバック完了後、すべての子Symbolをenclosする
   - 常に `symbols` 配列の最初の要素として登録される
   - レイアウトソルバーで(0, 0)に固定される（既存の動作）

2. **メリット**
   - viewportを常に(0, 0)に保てる
   - 既存のenclose機構を再利用できる
   - DiagramSymbol自体がタイトルとメタ情報を描画
   - 統一的なSymbol階層構造

3. **動作フロー**
   ```
   1. Diagram("title") → DiagramSymbolを作成
   2. .build(callback) → 
      a. callbackを実行してsymbolsを収集
      b. DiagramSymbolを配列の先頭に挿入
      c. hint.enclose(diagramSymbol, ...allSymbols) を自動追加
      d. レイアウト計算を実行
   3. .render() → SVG出力
   ```

#### 4.2 変更が必要なファイル

1. **`src/dsl/diagram.ts`**
   - シングルトンから関数エクスポートに変更
   - `Diagram(title | info)` 関数を実装
   - 新しいDiagramBuilderインスタンスを返す

2. **`src/dsl/diagram_builder.ts`**
   - コンストラクタで `title | DiagramInfo` を受け取る
   - `build()` メソッドから `name` パラメータを削除
   - `build()` 内で:
     - DiagramSymbolを作成
     - callbackを実行してsymbolsを収集
     - DiagramSymbolを配列の先頭に挿入
     - すべてのsymbolをenclosするhintを追加
     - レイアウト計算を実行

3. **`src/layout/layout_solver.ts`**
   - 既存の動作を維持（最初のsymbolを(0,0)に固定）
   - DiagramSymbolは必ず最初の要素なので、自動的に(0,0)に配置される

4. **`src/render/svg_renderer.ts`**
   - DiagramSymbolを通常のSymbolとして描画
   - viewBoxは(0, 0)を起点とする

5. **`src/index.ts`**
   - `DiagramInfo` 型をエクスポート
   - `DiagramSymbol` は内部実装のためエクスポート不要

#### 4.3 新規作成が必要なファイル

1. **`src/model/diagram_info.ts`**
   - `DiagramInfo` インターフェースの定義

2. **`src/model/diagram_symbol.ts`**
   - `DiagramSymbol` クラスの実装
   - `SymbolBase` を継承
   - `toSVG()` でタイトルとメタ情報を描画
   - `getDefaultSize()` で最小サイズを返す（子要素に応じて拡張）

#### 4.4 API シグネチャ

```typescript
// diagram_info.ts
export interface DiagramInfo {
  title: string
  createdAt?: string
  author?: string
}

// diagram_symbol.ts
export class DiagramSymbol extends SymbolBase {
  constructor(id: SymbolId, diagramInfo: DiagramInfo)
  getDefaultSize(): { width: number; height: number }
  toSVG(): string
  getConnectionPoint(from: Point): Point
}

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
  symbols: SymbolBase[]  // DiagramSymbol + user symbols
  relationships: Relationship[]
  render(filepath: string): void
}

// svg_renderer.ts
export class SvgRenderer {
  constructor(
    symbols: SymbolBase[],  // includes DiagramSymbol
    relationships: Relationship[],
    theme: Theme
  )
}
```

#### 4.5 テストケース

1. 文字列でタイトルのみ指定した場合の動作確認
2. DiagramInfoで全情報を指定した場合の動作確認
3. DiagramInfoで一部情報のみ指定した場合の動作確認
4. プラグインとテーマの組み合わせでの動作確認
5. SVG出力に正しくメタ情報が含まれることの確認
6. メソッドチェーンの各順序での動作確認
7. SVGメタデータタグの検証
8. DiagramSymbolが配列の先頭に配置されることの確認
9. DiagramSymbolのboundsがすべての子要素を含むことの確認
10. viewBoxが(0, 0)起点であることの確認

### 5. 実装の優先順位

1. DiagramInfo型の定義
2. DiagramSymbolクラスの実装
3. DiagramBuilderの変更（DiagramSymbolの自動追加とenclose）
4. Diagram関数の実装
5. SVGメタデータタグの追加（オプション）
6. 既存のコード例の更新
7. テストの作成
8. READMEの更新

### 6. Canvas サイズの調整

DiagramSymbolが最初のSymbolとして(0, 0)に配置され、すべての子Symbolをenclosするため:

- SVGのviewBoxは `(0, 0, diagramSymbol.bounds.width, diagramSymbol.bounds.height)`
- DiagramSymbolのboundsは、enclosedされた子要素 + padding + タイトル領域 + メタ情報領域を含む
- レイアウトソルバーが自動的に適切なサイズを計算

### 7. DiagramSymbolの描画仕様

#### 7.1 構造

DiagramSymbolのSVG出力は以下の構造を持つ:

```xml
<g id="diagram-symbol">
  <!-- 背景 -->
  <rect x="0" y="0" width="..." height="..." fill="..." />
  
  <!-- タイトル（上部中央） -->
  <text x="centerX" y="30" text-anchor="middle" font-size="..." font-weight="bold">
    {title}
  </text>
  
  <!-- メタ情報（右下） -->
  <text x="width-10" y="height-10" text-anchor="end" font-size="..." opacity="0.5">
    {createdAt and/or author}
  </text>
  
  <!-- 子要素はDiagramSymbolの内側に配置される（enclosedされる） -->
</g>
```

#### 7.2 パディング計算

- 上部パディング: 50px（タイトル用スペース）
- 左右パディング: 20px
- 下部パディング: 30px（メタ情報用スペース）

### 8. 注意事項

- DiagramBuilderは各呼び出しで新しいインスタンスを作成（イミュータブル）
- DiagramSymbolは通常のSymbolとして扱われるため、特別な描画ロジックは不要
- テーマによって文字色やフォントサイズが変わるため、それに対応した実装が必要
- 日付形式は文字列として柔軟に受け入れる（検証はしない）
- 作成日や著者が省略された場合は表示しない
- DiagramSymbolのidは固定値（例: "__diagram__"）として予約

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
