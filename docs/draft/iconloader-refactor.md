# IconLoader Refactoring Design

## 目的 (Purpose)

現在の `IconLoader` クラスは複数の責務を持っているため、保守性向上のためリファクタリングを実施する。

Current `IconLoader` class has multiple responsibilities. This refactoring aims to improve maintainability by separating concerns.

## 現在の課題 (Current Issues)

`IconLoader` クラスが以下の責務を持っている：
1. アイコン名とファイルパスのレジストリ管理
2. 登録済みアイコンのリスト表示
3. ファイルの読み込み
4. SVGメタデータ（viewBox等）のパース

The current `IconLoader` class has the following responsibilities:
1. Managing registry of icon names and file paths
2. Listing registered icon names
3. Loading files from disk
4. Parsing SVG metadata (viewBox, etc.)

## 提案する設計 (Proposed Design)

### 新しいクラス構造 (New Class Structure)

#### `IconSet` クラス
- **責務**: アイコンの登録管理と IconLoader インスタンスの生成
- **Responsibilities**: Manage icon registrations and generate IconLoader instances

**メソッド (Methods):**
- `register(name: string, relPath: string)`: アイコンを登録（重複チェック付き）
- `list(): string[]`: 登録済みアイコン名の一覧を返す
- `createLoader(name: string): IconLoader`: 指定されたアイコンの IconLoader インスタンスを生成

#### `IconLoader` クラス（リファクタ後）
- **責務**: 単一ファイルの読み込みとパース
- **Responsibilities**: Handle single file loading and parsing operations

**メソッド (Methods):**
- `load_sync(): IconMeta`: ファイルを読み込んでメタデータを返す

### エラーハンドリング (Error Handling)

- `IconSet.register()` で重複登録を検出し、エラーをスロー
- `IconSet.createLoader()` で未登録のアイコンを検出し、エラーをスロー

## 移行計画 (Migration Plan)

1. `IconSet` クラスを新規作成
2. `IconLoader` クラスをリファクタリング
3. テストの追加・更新
4. 既存コードの使用箇所を更新

## 後方互換性 (Backward Compatibility)

現在の `IconLoader` の外部APIは変更されるため、使用箇所の更新が必要。
ただし、機能的には同等の動作を保証する。

The external API of `IconLoader` will change, requiring updates to usage sites.
However, functionally equivalent behavior will be maintained.
