日本語 | [English](icon-system.md)

# アイコンシステム

## 概要

アイコンシステムは、プラグインが図表内でSVGアイコンを登録・使用するための仕組みを提供します。このシステムは責務の分離を重視して設計されており、`IconSet`がアイコン登録を管理し、`IconLoader`が単一ファイル操作を処理します。

## アーキテクチャ

### IconSet

**目的**: プラグインのアイコン名とパスの登録を管理

**責務**:
- アイコン名とファイルパスの登録
- 重複登録の防止
- 登録済みアイコン名の一覧表示
- 特定アイコン用の`IconLoader`インスタンスの生成

**主要メソッド**:
```typescript
class IconSet {
  constructor(plugin: string, baseUrl: string)
  register(name: string, relPath: string): void
  list(): string[]
  createLoader(name: string): IconLoader
}
```

**エラーハンドリング**:
- アイコンの重複登録時にエラーをスロー
- 未登録アイコンのローダー生成時にエラーをスロー

### IconLoader

**目的**: 単一ファイルの読み込みとメタデータ解析処理を担当

**責務**:
- ディスクからSVGファイル内容を読み込む
- SVGメタデータ（viewBox等）を解析
- 構造化されたメタデータ（`IconMeta`）を返す

**主要メソッド**:
```typescript
class IconLoader {
  constructor(plugin: string, name: string, baseUrl: string, relPath: string)
  load_sync(): IconMeta
}
```

**エラーハンドリング**:
- ファイル未検出時に説明的なエラーをスロー
- ファイルシステムエラーを適切に処理

### IconRegistry

**目的**: SVGシンボルの収集と出力のためのランタイムレジストリ

**責務**:
- アイコンSVG内容の登録
- シンボルIDの正規化
- `<symbol>`要素を含む`<defs>`セクションの出力

このクラスは`IconSet`/`IconLoader`とは独立しており、ランタイムレンダリングに関する責務を担当します。

## 使用フロー

1. **プラグイン登録フェーズ**:
   ```typescript
   // プラグインは初期化時にアイコンを登録
   registerIcons(icons) {
     icons.createRegistrar('myplugin', import.meta, (iconSet) => {
       iconSet.register('icon1', 'icons/icon1.svg')
       iconSet.register('icon2', 'icons/icon2.svg')
     })
   }
   ```

2. **ビルドフェーズ**:
   ```typescript
   // システムは各アイコン用のローダーを生成
   const iconSet = new IconSet('myplugin', baseUrl)
   iconSet.register('icon1', 'icons/icon1.svg')
   
   // 特定アイコン用のローダーを生成
   const loader = iconSet.createLoader('icon1')
   const meta = loader.load_sync()
   ```

3. **レンダリングフェーズ**:
   ```typescript
   // IconRegistryは使用されたアイコンをすべて収集
   const registry = new IconRegistry()
   registry.register('myplugin', 'icon1', svgContent)
   
   // SVG出力でシンボルを発行
   const defs = registry.emit_symbols()
   ```

## 設計の利点

**責務の分離**:
- `IconSet`: レジストリ管理（どのアイコンが存在するか）
- `IconLoader`: ファイル操作（アイコンの読み込み方法）
- `IconRegistry`: ランタイムシンボル管理（アイコンの描画方法）

**エラー防止**:
- 重複登録の検出
- 型安全なアイコン参照
- 欠落アイコンに対する明確なエラーメッセージ

**テスト容易性**:
- 各クラスを独立してテスト可能
- 統合テストで完全なフローを検証
- ファイルシステム操作を容易にモック化

**保守性**:
- 各クラスに単一責任
- 責務間の明確な境界
- 新機能の追加が容易

## セキュリティに関する考慮事項

プラグインはサニタイズされたSVG内容を登録すべきです。本番環境では以下を実施してください：
- スクリプトと外部参照を削除（SVGOまたは同等のツールを使用）
- 登録前にSVG構造を検証
- ディレクトリトラバーサルを防ぐためファイルパスをサニタイズ

## 型安全性

システムは完全なTypeScriptサポートを提供します：
```typescript
// 型安全なアイコン名前空間
icon.myplugin.icon1() // IconMeta | null を返す

// 型安全な登録
iconSet.register('name', 'path') // 文字列型を強制
```

## 旧APIからの移行

**以前**（複数の責務を持つ単一クラス）:
```typescript
const loader = new IconLoader('plugin', baseUrl)
loader.register('icon1', 'path1.svg')
loader.register('icon2', 'path2.svg')
const list = loader.list()
const meta = loader.load_sync('icon1')
```

**現在**（責務の分離）:
```typescript
const iconSet = new IconSet('plugin', baseUrl)
iconSet.register('icon1', 'path1.svg')
iconSet.register('icon2', 'path2.svg')
const list = iconSet.list()
const loader = iconSet.createLoader('icon1')
const meta = loader.load_sync()
```

## テスト

アイコンシステムには包括的なテストが含まれています：
- `IconSet`の単体テスト（登録、一覧表示、エラーケース）
- `IconLoader`の単体テスト（ファイル読み込み、メタデータ解析）
- 統合テスト（IconSetとIconLoaderの連携動作）
- 重複登録防止のテスト
- 複数プラグイン間の独立性のテスト

---

英語版ドキュメント: [icon-system.md](icon-system.md)
