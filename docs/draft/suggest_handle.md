# KiwiSolver の SuggestHandle API

以前は `KiwiSolver#addEditVariable(variable: LayoutVariable, strength: kiwi.Strength)` という
唯一の編集エントリで `kiwi.Strength` をユーザーが直接扱う必要がありました。
この API を `SuggestHandle` に置き換えることで、フルエント・スタイルで strength を文字列で
指定でき、`kiwi` への依存を完全に隠蔽します。

```
const x : LayoutVariable

// create SuggestHandle to suggest value
const handle : SuggestHandle = solver.createHandle(x).strong()

handle.suggest(10) // internally call kiwi.Solver.suggestValue(x.variable, 10)
handle.strength()  // => "strong" (returns string to isolate kiwi.Strength)
handle.dispose()   // internally call kiwi.Solver.removeEditVariable(x.variable)
```
