# Diagram Info Feature - Implementation Summary

## 実装内容

### 1. 新しいAPI設計
- `Diagram(title | DiagramInfo)` - 関数として呼び出し、タイトルまたはメタデータを指定
- メソッドチェーン: `.use()` → `.theme()` → `.build()` → `.render()`
- 後方互換性は考慮せず、クリーンな新APIに統一

### 2. 主要な変更

#### DiagramInfo型 (`src/model/diagram_info.ts`)
```typescript
export interface DiagramInfo {
  title: string
  createdAt?: string
  author?: string
}
```

#### DiagramSymbol (`src/model/diagram_symbol.ts`)
- `SymbolBase`を継承した特殊なシンボル
- すべてのユーザーシンボルを自動的にenclosureする
- タイトルとメタデータを描画
- 配列の最初の要素として配置され、(0,0)に固定される

#### Diagram関数 (`src/dsl/diagram.ts`)
- シングルトンから関数に変更
- `string | DiagramInfo`を受け取り、新しい`DiagramBuilder`を返す

#### DiagramBuilder (`src/dsl/diagram_builder.ts`)
- コンストラクタで`titleOrInfo`を受け取る
- `build()`メソッドから`name`パラメータを削除
- DiagramSymbolを作成し、配列の先頭に挿入
- すべてのユーザーシンボルをenclosureするhintを自動追加

### 3. 動作の仕組み

```
1. Diagram("title") または Diagram({...info})
   ↓
2. DiagramBuilder作成（titleOrInfoを保持）
   ↓
3. .use(plugins) - プラグイン追加
   ↓
4. .theme(theme) - テーマ設定
   ↓
5. .build(callback)
   a. callbackを実行してユーザーシンボルを収集
   b. DiagramSymbolを作成
   c. [DiagramSymbol, ...userSymbols]の配列を作成
   d. encloseヒントを自動追加
   e. レイアウト計算（DiagramSymbolは(0,0)に固定）
   ↓
6. .render(filepath) - SVG出力
```

### 4. 生成されるSVG

- viewBoxは`(0, 0, width, height)`で固定
- DiagramSymbolが背景として全体を囲む
- タイトルは上部中央に大きく表示
- メタデータ（作成日・著者）は右下に小さく表示

### 5. 実装例

```typescript
// シンプルな例
Diagram("My Diagram")
  .build((el, rel, hint) => {
    const a = el.circle("A")
    const b = el.circle("B")
    hint.arrangeHorizontal(a, b)
  })
  .render("output.svg")

// フル機能の例
Diagram({
  title: "E-Commerce System",
  createdAt: "2025-11-13",
  author: "Architecture Team"
})
  .use(UMLPlugin)
  .theme(DarkTheme)
  .build((el, rel, hint) => {
    // ...
  })
  .render("output.svg")
```

### 6. テスト状況

- 基本機能のテストは通過
- DiagramSymbolの追加により、一部のテストで期待値の調整が必要
- 主要な機能は動作確認済み

## 今後の課題

1. 残りのテストケースの修正
2. SVG metadataタグの追加（オプション）
3. DiagramSymbolのスタイルカスタマイズ
4. エッジケースの処理改善

## ファイル変更一覧

### 新規作成
- `src/model/diagram_info.ts`
- `src/model/diagram_symbol.ts`
- `example/diagram_info_simple.ts`
- `example/diagram_info_full.ts`
- `example/diagram_info_partial.ts`

### 変更
- `src/dsl/diagram.ts` - 関数化
- `src/dsl/diagram_builder.ts` - DiagramSymbol対応
- `src/index.ts` - DiagramInfo型のexport
- `README.md` - 新API説明
- `example/*.ts` - 全例を新APIに更新
- `tests/*.test.ts` - 新APIに更新（一部）

## ブランチ情報

- ブランチ名: `feature/diagram-info`
- ベース: `main`
- コミット数: 5件
