[English](architecture.md) | 日本語

# アーキテクチャ概要

Kiwumil は循環依存を避け、メンテナンス性を保つためにレイヤー構成を採用しています。推奨されるレイヤー構成は以下です：

```
Layer 4: DSL        (dsl/)
   ↓
Layer 3: Plugins    (plugin/)
   ↓
Layer 2: Model      (model/, hint/)
   ↓
Layer 1: Core       (core/, kiwi/, theme/, icon/, utils/)
```

ルール:
- 上位レイヤーは下位レイヤーに依存可能だが、下位レイヤーは上位レイヤーに依存してはいけない。
- re-export は同一ディレクトリか下位レイヤーの項目に限定し、循環を防ぐ。

詳細は `docs/guidelines/circular-dependency-prevention.md` を参照してください（レイヤーに基づく ESLint ルール案などを含む）。
