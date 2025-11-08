// src/layout/layout_solver.ts
import * as kiwi from "@lume/kiwi"
import type { SymbolBase } from "../model/symbol_base"
import type { LayoutHint } from "../dsl/hint_factory"

interface NodeVar {
  x: kiwi.Variable
  y: kiwi.Variable
  width: kiwi.Variable
  height: kiwi.Variable
}

export class LayoutSolver {
  private solver: kiwi.Solver
  private vars: Map<string, NodeVar>

  constructor() {
    this.solver = new kiwi.Solver()
    this.vars = new Map()
  }

  solve(symbols: SymbolBase[], hints: LayoutHint[]) {
    // 各シンボルの変数を作成
    for (const symbol of symbols) {
      const size = symbol.getDefaultSize()
      const v: NodeVar = {
        x: new kiwi.Variable(`${symbol.id}.x`),
        y: new kiwi.Variable(`${symbol.id}.y`),
        width: new kiwi.Variable(`${symbol.id}.w`),
        height: new kiwi.Variable(`${symbol.id}.h`),
      }
      this.vars.set(symbol.id, v)

      // サイズ制約
      this.solver.addConstraint(
        new kiwi.Constraint(new kiwi.Expression(v.width), kiwi.Operator.Eq, size.width)
      )
      this.solver.addConstraint(
        new kiwi.Constraint(new kiwi.Expression(v.height), kiwi.Operator.Eq, size.height)
      )
    }

    // 最初のシンボルを原点に固定
    if (symbols.length > 0) {
      const first = this.vars.get(symbols[0].id)!
      this.solver.addConstraint(
        new kiwi.Constraint(new kiwi.Expression(first.x), kiwi.Operator.Eq, 50)
      )
      this.solver.addConstraint(
        new kiwi.Constraint(new kiwi.Expression(first.y), kiwi.Operator.Eq, 50)
      )
    }

    // ヒントに基づく制約を追加
    for (const hint of hints) {
      if (hint.type === "horizontal") {
        this.addHorizontalConstraints(hint.symbolIds, hint.gap || 80)
      } else if (hint.type === "vertical") {
        this.addVerticalConstraints(hint.symbolIds, hint.gap || 50)
      }
    }

    // 解を計算
    this.solver.updateVariables()

    // 結果を各シンボルに適用
    for (const symbol of symbols) {
      const v = this.vars.get(symbol.id)!
      symbol.bounds = {
        x: v.x.value(),
        y: v.y.value(),
        width: v.width.value(),
        height: v.height.value(),
      }
    }
  }

  private addHorizontalConstraints(symbolIds: string[], gap: number) {
    for (let i = 0; i < symbolIds.length - 1; i++) {
      const a = this.vars.get(symbolIds[i])!
      const b = this.vars.get(symbolIds[i + 1])!

      // b.x = a.x + a.width + gap
      this.solver.addConstraint(
        new kiwi.Constraint(
          new kiwi.Expression(b.x),
          kiwi.Operator.Eq,
          new kiwi.Expression(a.x, a.width, gap)
        )
      )

      // 同じyに揃える
      this.solver.addConstraint(
        new kiwi.Constraint(
          new kiwi.Expression(b.y),
          kiwi.Operator.Eq,
          new kiwi.Expression(a.y)
        )
      )
    }
  }

  private addVerticalConstraints(symbolIds: string[], gap: number) {
    for (let i = 0; i < symbolIds.length - 1; i++) {
      const a = this.vars.get(symbolIds[i])!
      const b = this.vars.get(symbolIds[i + 1])!

      // b.y = a.y + a.height + gap
      this.solver.addConstraint(
        new kiwi.Constraint(
          new kiwi.Expression(b.y),
          kiwi.Operator.Eq,
          new kiwi.Expression(a.y, a.height, gap)
        )
      )

      // 同じxに揃える
      this.solver.addConstraint(
        new kiwi.Constraint(
          new kiwi.Expression(b.x),
          kiwi.Operator.Eq,
          new kiwi.Expression(a.x)
        )
      )
    }
  }
}
