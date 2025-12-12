# 循環依存防止ガイドライン

## 概要

このドキュメントは、TypeScriptプロジェクトにおける循環依存を防止し、健全なアーキテクチャを維持するためのガイドラインです。

## 現在の問題とESLintルールの課題

### 問題点

1. **ディレクトリ間re-exportによる循環依存**: `kiwi/index.ts` が `model` をre-exportし、`model` が `kiwi` をインポートする循環
2. **例外設定の手動管理**: 循環依存回避のためのESLint例外が特定ファイルにハードコード
3. **依存関係の可視化不足**: どのモジュールがどれに依存しているか把握が困難

### 現在のESLintルールの限界

```javascript
// 現在: 特定ファイルへの例外設定（手動管理）
files: [
  "src/plugin/core/symbols/circle_symbol.ts",
  "src/plugin/uml/symbols/actor_symbol.ts", 
  "src/plugin/uml/relationships/association.ts"
]
```

この方式では：
- 新しいファイルが追加される度に手動で例外を追加する必要
- なぜそのファイルが例外なのかが明確でない
- スケールしない

## 新しいアプローチ：レイヤーベース設計

### 1. アーキテクチャレイヤーの定義

```
Layer 4: DSL        (dsl/)
   ↓
Layer 3: Plugins    (plugin/, render/)
   ↓  
Layer 2: Model      (model/, hint/)
   ↓
Layer 1: Core       (core/, kiwi/, theme/, icon/, utils/)
```

**ルール**: 上位レイヤーは下位レイヤーを依存できるが、下位レイヤーは上位レイヤーに依存してはならない。

### 2. レイヤー内循環依存の防止

各レイヤー内でも循環依存を避ける：

#### Core Layer (Layer 1)
- `core/`: 型定義のみ、他への依存なし
- `kiwi/`: `core/` のみ依存
- `theme/`, `icon/`, `utils/`: `core/` のみ依存

#### Model Layer (Layer 2)  
- `model/`: `core/`, `kiwi/`, `theme/` に依存
- `hint/`: `model/`, `kiwi/`, `core/` に依存

#### Plugin Layer (Layer 3)
- `plugin/`: 下位レイヤーすべてに依存可能

#### DSL Layer (Layer 4)
- `dsl/`: 全レイヤーに依存可能（kiwi/ への依存は DSL のみ許可）

### 3. 改善されたESLintルール設計

#### A. レイヤーベースルール

```javascript
// 提案: レイヤーベースのルール
const LAYER_RULES = {
  'core/**': [], // 他レイヤーに依存禁止
  'kiwi/**': ['core/**'],
  'theme/**': ['core/**'], 
  'icon/**': ['core/**'],
  'utils/**': ['core/**'],
  'model/**': ['core/**', 'theme/**'],
  'hint/**': ['core/**', 'model/**'],
  'plugin/**': ['core/**', 'theme/**', 'model/**', 'hint/**'],
  'render/**': ['core/**', 'theme/**', 'model/**', 'plugin/**'],
  'dsl/**': ['core/**', 'kiwi/**', 'theme/**', 'model/**', 'hint/**', 'plugin/**', 'render/**']
}
```

#### B. レイヤー内循環検出

```javascript
// レイヤー内での循環依存も検出
const INTRA_LAYER_RULES = {
  // model内での循環を防ぐ
  'model/layout_context.ts': {
    forbidden: ['model/**'],
    exceptions: ['model/layout_variables.ts', 'model/hints.ts']
  }
}
```

## 実装ガイドライン

### 1. Index.tsのRe-export原則

#### ✅ 推奨パターン

```typescript
// ✅ 同じディレクトリ内のexport
export { SymbolBase } from "./symbol_base"
export { DiagramSymbol } from "./diagram_symbol"

// ✅ 下位レイヤーからのre-export  
export type { ILayoutSolver } from "../core"
export { getBoundsValues } from "../core"
```

#### ❌ 避けるべきパターン

```typescript
// ❌ 同等または上位レイヤーのre-export
export { LayoutVariables } from "../model" // kiwi/ → model/

// ❌ 循環を作るre-export
export { DiagramBuilder } from "../dsl" // model/ → dsl/ → model/
```

### 2. 依存注入によるデカップリング

#### Before: 直接依存

```typescript
export class LayoutContext {
  constructor(theme: Theme) {
    this.solver = new KiwiSolver() // 直接依存
  }
}
```

#### After: 依存注入

```typescript
export class LayoutContext {
  constructor(solver: ILayoutSolver, theme: Theme) {
    this.solver = solver // 注入された依存
  }
}
```

### 3. テスト設計パターン

```typescript
// ✅ 推奨: 依存を明示的に組み立て
beforeEach(() => {
  const solver = new KiwiSolver()
  const context = new LayoutContext(solver, DefaultTheme)
  const symbols = new Symbols(context.variables)
})

// ❌ 避ける: 内部で依存を隠蔽
beforeEach(() => {
  const context = new LayoutContext(DefaultTheme) // 内部でsolver作成
})
```

## ESLintルールの改善提案

### 1. 新しいカスタムルール

```javascript
// eslint-rules/layer-dependency.js
const LAYERS = {
  core: 1,
  kiwi: 1, 
  theme: 1,
  icon: 1,
  utils: 1,
  model: 2,
  hint: 2,
  plugin: 3,
  dsl: 4,
  render: 4
}

function getLayerLevel(filePath) {
  const segments = filePath.split('/')
  const srcIndex = segments.indexOf('src')
  const layerName = segments[srcIndex + 1]
  return LAYERS[layerName] || 999
}

// 上位レイヤーから下位レイヤーへの依存のみ許可
function validateLayerDependency(importerPath, importeePath) {
  const importerLayer = getLayerLevel(importerPath)
  const importeeLayer = getLayerLevel(importeePath)
  
  return importerLayer >= importeeLayer
}
```

### 2. 設定ファイルの更新

```javascript
export default [
  {
    files: ["src/**/*.ts"],
    plugins: {
      "@typescript-eslint": tseslint,
      local: {
        ...directoryEntryImport,
        ...layerDependency // 新しいルール
      }
    },
    rules: {
      "local/require-directory-index-import": "error",
      "local/no-layer-violation": "error", // 新しいルール
      "local/no-intra-layer-cycle": "warn"  // 新しいルール
    }
  }
]
```

## 移行戦略

### Phase 1: 現在の修正 ✅
- [x] 即座の循環依存解決（今回のPR）
- [x] LayoutVariablesのre-export削除
- [x] 依存注入パターン導入

### Phase 2: ルール拡張
- [ ] レイヤーベースESLintルール実装
- [ ] 依存関係可視化ツール追加
- [ ] CI/CDでの循環依存検証強化

### Phase 3: アーキテクチャ改善
- [ ] 残りの循環依存解消
- [ ] レイヤー境界の明確化
- [ ] ドキュメント整備

## 運用ルール

### 1. コードレビュー時のチェックポイント

- [ ] 新しいindex.tsにre-exportを追加する際は、循環依存チェック
- [ ] クラスのコンストラクタで具象クラスを直接生成していないか確認
- [ ] テストコードで依存注入パターンに従っているか確認

### 2. 新機能開発時の注意事項

- [ ] レイヤー設計に従った配置
- [ ] 上位レイヤーから下位レイヤーへの依存のみ
- [ ] 必要に応じてインターフェース抽出

### 3. リファクタリング時の指針

- [ ] 循環依存がある場合は依存注入で解決
- [ ] Re-exportは同等・下位レイヤーのみ
- [ ] 責務分離によるレイヤー境界の明確化

## まとめ

このガイドラインにより：

1. **予防的**: 循環依存の発生を設計レベルで防止
2. **スケーラブル**: レイヤーベースで自動的に検証
3. **明確**: 依存関係の方向性が明示的
4. **保守性**: 手動例外設定から構造的なルールへ

健全なアーキテクチャを維持し、長期的にメンテナブルなコードベースを実現できます。
