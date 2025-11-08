# テーマ実装案

## 修正完了
✅ ユースケースの楕円に白い塗りつぶし（`fill="white"`）を追加しました。
これで関連線がユースケースの中に見えなくなります。

## テーマ機能の実装案

### 案1: シンプルなテーマオブジェクト（推奨）

**特徴:**
- 最もシンプルで理解しやすい
- 拡張性が高い
- 既存コードへの影響が最小限

**実装内容:**
```typescript
// src/core/theme.ts
export interface Theme {
  colors: {
    background: string
    usecaseFill: string
    usecaseStroke: string
    actorStroke: string
    relationshipStroke: string
    text: string
  }
  strokeWidth: { usecase, actor, relationship }
  fontSize: { usecase, actor }
}
```

**使用例:**
```typescript
Diagram
  .use(CorePlugin)
  .theme(themes.blue)  // または .theme(themes.dark)
  .build("Login", ...)
  .render("output.svg")
```

**利点:**
- シンプルで使いやすい
- テーマの追加が容易
- TypeScript の型安全性

**欠点:**
- 全要素に同じテーマが適用される

---

### 案2: CSS クラスベースのテーマ

**特徴:**
- SVG に CSS を埋め込む
- 柔軟性が高い
- ブラウザでの動的変更が可能

**実装内容:**
```typescript
<style>
  .usecase { fill: white; stroke: black; }
  .actor { stroke: black; }
  .theme-blue .usecase { fill: #e6f3ff; stroke: #0066cc; }
</style>
<g class="theme-blue">
  <ellipse class="usecase" .../>
</g>
```

**利点:**
- ブラウザで動的にテーマ切り替え可能
- CSS のパワーを活用できる

**欠点:**
- SVG ファイルサイズが大きくなる
- 一部の SVG ビューアで非対応

---

### 案3: プラグインベースのテーマ

**特徴:**
- テーマごとにプラグインを作成
- 最も柔軟性が高い
- 複雑な要件に対応可能

**実装内容:**
```typescript
class BlueThemePlugin implements Plugin {
  onSymbolRender(symbol: SymbolBase) {
    // カスタムレンダリングロジック
  }
}

Diagram
  .use(CorePlugin)
  .use(BlueThemePlugin)
  .build(...)
```

**利点:**
- 完全なカスタマイズが可能
- レンダリングロジックの再利用

**欠点:**
- 実装が複雑
- プラグイン作成のハードルが高い

---

## 推奨実装順序

1. **フェーズ1**: 案1のシンプルなテーマオブジェクト実装
   - `src/core/theme.ts` を作成
   - デフォルト、ブルー、ダークの3テーマを用意
   - SymbolBase にテーマ適用機能を追加

2. **フェーズ2**: テーマのカスタマイズ機能
   - ユーザー定義テーマのサポート
   - テーマのマージ機能

3. **フェーズ3**: 高度な機能（必要に応じて）
   - シンボル単位のテーマ上書き
   - アニメーション対応
   - CSS クラスベースのエクスポート

---

## サンプルファイル

テーマ実装の参考ファイルを作成しました：

- `src/core/theme.ts` - テーマ定義
- `src/model/symbol_base_themed.ts` - テーマ対応のベースクラス
- `src/model/symbols/usecase_symbol_themed.ts` - テーマ対応のユースケース
- `src/render/svg_renderer_themed.ts` - テーマ対応のレンダラー

これらは参考実装で、既存のコードを置き換えるものではありません。
実装する際は、既存の構造に合わせて統合してください。
