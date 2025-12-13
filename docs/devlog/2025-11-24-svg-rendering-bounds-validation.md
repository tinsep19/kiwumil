# SVG レンダリング崩れの修正：境界値検証とガードの追加

日付: 2025-11-24  
作業者: GitHub Copilot

## 問題の発見

`examples/first_milestone.svg` を生成した際、以下の問題が発生していた：

```xml
<!-- 問題のある出力例 -->
<circle cx="0" cy="66.66..." r="-13.333..." />  <!-- 負の半径 -->
<ellipse cx="190" cy="91.66..." rx="123.33..." ry="-25" />  <!-- 負の ry -->
```

### 原因分析

1. レイアウトソルバが width/height に負の値を返していた
   - `width: -80` (User Actor)
   - `height: -50` (Usecase symbols)

2. `getBoundsValues()` がこれらの値をそのまま返していた

3. Actor/Usecase の `toSVG()` が負の値をそのまま計算に使用していた
   - `headRadius = width / 6` → 負の値
   - `rx = width / 2`、`ry = height / 2` → 負の値

## 実装した解決策

### 1. 検出・警告層 (`src/kiwi/bounds.ts`)

```typescript
export function getBoundsValues(bounds: Bounds) {
  const rawWidth = bounds.width.value()
  const rawHeight = bounds.height.value()
  
  // 負の値を検出して警告
  if (rawWidth < 0) {
    console.warn(`[getBoundsValues] Negative width detected: ${rawWidth}`)
  }
  if (rawHeight < 0) {
    console.warn(`[getBoundsValues] Negative height detected: ${rawHeight}`)
  }
  
  // 値はそのまま返す（レイアウト計算への影響を最小化）
  return { x: rawX, y: rawY, width: rawWidth, height: rawHeight }
}
```

**設計判断**: 値を変更せずそのまま返すことで、レイアウト計算（制約解決）への影響を避けた。

### 2. レンダリング層での検証 (`src/render/svg_renderer.ts`)

```typescript
// 不正な bounds を持つシンボルを検出
const minBoundsSize = 0.1
const maxBoundsSize = 10000

for (const symbol of this.symbols) {
  const bounds = getBoundsValues(symbol.getLayoutBounds())
  if (bounds.width < minBoundsSize || bounds.height < minBoundsSize || 
      bounds.width > maxBoundsSize || bounds.height > maxBoundsSize) {
    console.warn(
      `[SvgRenderer] Abnormal bounds detected for symbol:`,
      `id=${symbol.id}, label="${symbol.label}",`,
      `bounds={x:${bounds.x}, y:${bounds.y}, width:${bounds.width}, height:${bounds.height}}`
    )
  }
}

// DiagramSymbol bounds の有効性チェック
const isDiagramBoundsValid = 
  typeof diagramWidth === "number" && 
  typeof diagramHeight === "number" &&
  Number.isFinite(diagramWidth) &&
  Number.isFinite(diagramHeight) &&
  diagramWidth >= minViewport &&
  diagramHeight >= minViewport

if (!isDiagramBoundsValid) {
  // maxX/maxY 計算にフォールバック
  // ...
}
```

### 3. 描画層での安全ガード (Actor/Usecase)

**Actor Symbol** (`src/plugin/uml/symbols/actor_symbol.ts`):
```typescript
const safeWidth = Math.max(10, Math.abs(width))
const safeHeight = Math.max(20, Math.abs(height))

const headRadius = Math.max(2, safeWidth / 6)
```

**Usecase Symbol** (`src/plugin/uml/symbols/usecase_symbol.ts`):
```typescript
const safeWidth = Math.max(10, Math.abs(width))
const safeHeight = Math.max(10, Math.abs(height))

const rx = Math.max(2, safeWidth / 2)
const ry = Math.max(2, safeHeight / 2)
```

## テストの追加

`tests/bounds_validation.test.ts` に7つの新規テストを追加：

1. `getBoundsValues` の動作検証 (3 tests)
   - 正常な値の返却
   - 負の width の検出
   - 負の height の検出

2. ActorSymbol の描画ガード (2 tests)
   - 負の width でも正の半径を生成
   - 正常な bounds での描画

3. UsecaseSymbol の描画ガード (2 tests)
   - 負の height でも正の rx/ry を生成
   - 正常な bounds での描画

## 検証結果

### 修正前
```xml
<circle cx="0" cy="66.66..." r="-13.333..." />
<ellipse cx="190" cy="91.66..." rx="123.33..." ry="-25" />
```

### 修正後
```xml
<circle cx="80" cy="93.33..." r="13.333..." />
<ellipse cx="190" cy="141.66..." rx="123.33..." ry="25" />
```

### テスト結果
- 全テスト: 94 pass, 0 fail
- 新規テスト: 7 追加

### デバッグログの例
```
[getBoundsValues] Negative width detected: -80
[SvgRenderer] Abnormal bounds detected for symbol: id=uml:actor/0, label="User", bounds={x:40, y:75, width:-80, height:200}
```

## セキュリティチェック

CodeQL による静的解析を実行：
- **結果**: 0 alerts
- セキュリティ上の問題は検出されませんでした

## 今後の課題

この修正は**応急処置**であり、以下の根本原因調査が必要：

### 推奨される追加調査

1. **レイアウトソルバの検証**
   - 制約解決後に `right < left` や `bottom < top` が発生していないか
   - 幅/高さが負になる制約が設定されていないか確認

2. **制約の見直し**
   - Symbol の最小サイズ制約が適切に設定されているか
   - container と content の関係が正しく表現されているか

3. **制約解の正規化**
   - solver.updateVariables() 後に bounds を検証
   - 不正な値を検出したら警告を出し、安全な値に置き換える

### 参考となる箇所

- `src/kiwi/layout_solver.ts` - 制約ソルバのラッパー
- `src/kiwi/layout_constraints.ts` - 制約の構築
- `src/model/symbol_base.ts` - Symbol の制約定義

## まとめ

- ✅ SVG 出力から負の値を排除
- ✅ 不正な bounds の検出とログ出力
- ✅ 多層防御（検出→検証→ガード）を実装
- ✅ テストでカバレッジを確保
- ✅ セキュリティチェック完了

この修正により、レイアウトソルバが不正な値を返しても SVG 出力が崩れないようになった。
ただし、根本原因（レイアウト制約の問題）は別途調査が必要。
