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

      // Check if this symbol is a container (has children via pack)
      const isContainer = hints.some(h => h.type === "pack" && h.containerId === symbol.id)
      
      if (!isContainer) {
        // Non-container: fix size
        this.solver.addConstraint(
          new kiwi.Constraint(new kiwi.Expression(v.width), kiwi.Operator.Eq, size.width)
        )
        this.solver.addConstraint(
          new kiwi.Constraint(new kiwi.Expression(v.height), kiwi.Operator.Eq, size.height)
        )
      } else {
        // Container: set minimum size (will be expanded by children)
        this.solver.addConstraint(
          new kiwi.Constraint(new kiwi.Expression(v.width), kiwi.Operator.Ge, 100, kiwi.Strength.weak)
        )
        this.solver.addConstraint(
          new kiwi.Constraint(new kiwi.Expression(v.height), kiwi.Operator.Ge, 100, kiwi.Strength.weak)
        )
      }
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
      if (hint.type === "horizontal" || hint.type === "arrangeHorizontal") {
        this.addHorizontalConstraints(hint.symbolIds, hint.gap || 80)
      } else if (hint.type === "vertical" || hint.type === "arrangeVertical") {
        this.addVerticalConstraints(hint.symbolIds, hint.gap || 50)
      } else if (hint.type === "pack") {
        this.addPackConstraints(hint.containerId!, hint.childIds!)
      } else if (hint.type === "alignLeft") {
        this.addAlignLeftConstraints(hint.symbolIds)
      } else if (hint.type === "alignRight") {
        this.addAlignRightConstraints(hint.symbolIds)
      } else if (hint.type === "alignTop") {
        this.addAlignTopConstraints(hint.symbolIds)
      } else if (hint.type === "alignBottom") {
        this.addAlignBottomConstraints(hint.symbolIds)
      } else if (hint.type === "alignCenterX") {
        this.addAlignCenterXConstraints(hint.symbolIds)
      } else if (hint.type === "alignCenterY") {
        this.addAlignCenterYConstraints(hint.symbolIds)
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

      // b.x = a.x + a.width + gap (MEDIUM strength for pack compatibility)
      this.solver.addConstraint(
        new kiwi.Constraint(
          new kiwi.Expression(b.x),
          kiwi.Operator.Eq,
          new kiwi.Expression(a.x, a.width, gap),
          kiwi.Strength.medium
        )
      )

      // 同じyに揃える (MEDIUM strength)
      this.solver.addConstraint(
        new kiwi.Constraint(
          new kiwi.Expression(b.y),
          kiwi.Operator.Eq,
          new kiwi.Expression(a.y),
          kiwi.Strength.medium
        )
      )
    }
  }

  private addVerticalConstraints(symbolIds: string[], gap: number) {
    for (let i = 0; i < symbolIds.length - 1; i++) {
      const a = this.vars.get(symbolIds[i])!
      const b = this.vars.get(symbolIds[i + 1])!

      // b.y = a.y + a.height + gap (STRONG strength)
      this.solver.addConstraint(
        new kiwi.Constraint(
          new kiwi.Expression(b.y),
          kiwi.Operator.Eq,
          new kiwi.Expression(a.y, a.height, gap),
          kiwi.Strength.strong
        )
      )

      // 同じxに揃える (STRONG strength)
      this.solver.addConstraint(
        new kiwi.Constraint(
          new kiwi.Expression(b.x),
          kiwi.Operator.Eq,
          new kiwi.Expression(a.x),
          kiwi.Strength.strong
        )
      )
    }
  }

  private addPackConstraints(containerId: string, childIds: string[]) {
    const container = this.vars.get(containerId)!
    const padding = 20

    for (const childId of childIds) {
      const child = this.vars.get(childId)!

      // Child must be inside container with padding (REQUIRED)
      // child.x >= container.x + padding
      this.solver.addConstraint(
        new kiwi.Constraint(
          new kiwi.Expression(child.x),
          kiwi.Operator.Ge,
          new kiwi.Expression(container.x, padding),
          kiwi.Strength.required
        )
      )

      // child.y >= container.y + 50 (for label space) (REQUIRED)
      this.solver.addConstraint(
        new kiwi.Constraint(
          new kiwi.Expression(child.y),
          kiwi.Operator.Ge,
          new kiwi.Expression(container.y, 50),
          kiwi.Strength.required
        )
      )

      // Container must be large enough to contain children (REQUIRED)
      // container.width >= child.x - container.x + child.width + padding
      // Rewritten as: container.width + container.x >= child.x + child.width + padding
      this.solver.addConstraint(
        new kiwi.Constraint(
          new kiwi.Expression(container.width, container.x),
          kiwi.Operator.Ge,
          new kiwi.Expression(child.x, child.width, padding),
          kiwi.Strength.required
        )
      )

      // container.height + container.y >= child.y + child.height + padding
      this.solver.addConstraint(
        new kiwi.Constraint(
          new kiwi.Expression(container.height, container.y),
          kiwi.Operator.Ge,
          new kiwi.Expression(child.y, child.height, padding),
          kiwi.Strength.required
        )
      )
    }
  }

  private addAlignLeftConstraints(symbolIds: string[]) {
    if (symbolIds.length < 2) return
    
    const first = this.vars.get(symbolIds[0])!
    for (let i = 1; i < symbolIds.length; i++) {
      const curr = this.vars.get(symbolIds[i])!
      // curr.x = first.x
      this.solver.addConstraint(
        new kiwi.Constraint(
          new kiwi.Expression(curr.x),
          kiwi.Operator.Eq,
          new kiwi.Expression(first.x)
        )
      )
    }
  }

  private addAlignRightConstraints(symbolIds: string[]) {
    if (symbolIds.length < 2) return
    
    const first = this.vars.get(symbolIds[0])!
    for (let i = 1; i < symbolIds.length; i++) {
      const curr = this.vars.get(symbolIds[i])!
      // curr.x + curr.width = first.x + first.width
      this.solver.addConstraint(
        new kiwi.Constraint(
          new kiwi.Expression(curr.x, curr.width),
          kiwi.Operator.Eq,
          new kiwi.Expression(first.x, first.width)
        )
      )
    }
  }

  private addAlignTopConstraints(symbolIds: string[]) {
    if (symbolIds.length < 2) return
    
    const first = this.vars.get(symbolIds[0])!
    for (let i = 1; i < symbolIds.length; i++) {
      const curr = this.vars.get(symbolIds[i])!
      // curr.y = first.y
      this.solver.addConstraint(
        new kiwi.Constraint(
          new kiwi.Expression(curr.y),
          kiwi.Operator.Eq,
          new kiwi.Expression(first.y)
        )
      )
    }
  }

  private addAlignBottomConstraints(symbolIds: string[]) {
    if (symbolIds.length < 2) return
    
    const first = this.vars.get(symbolIds[0])!
    for (let i = 1; i < symbolIds.length; i++) {
      const curr = this.vars.get(symbolIds[i])!
      // curr.y + curr.height = first.y + first.height
      this.solver.addConstraint(
        new kiwi.Constraint(
          new kiwi.Expression(curr.y, curr.height),
          kiwi.Operator.Eq,
          new kiwi.Expression(first.y, first.height)
        )
      )
    }
  }

  private addAlignCenterXConstraints(symbolIds: string[]) {
    if (symbolIds.length < 2) return
    
    const first = this.vars.get(symbolIds[0])!
    for (let i = 1; i < symbolIds.length; i++) {
      const curr = this.vars.get(symbolIds[i])!
      // curr.x + curr.width/2 = first.x + first.width/2
      this.solver.addConstraint(
        new kiwi.Constraint(
          new kiwi.Expression([curr.x, 1], [curr.width, 0.5]),
          kiwi.Operator.Eq,
          new kiwi.Expression([first.x, 1], [first.width, 0.5])
        )
      )
    }
  }

  private addAlignCenterYConstraints(symbolIds: string[]) {
    if (symbolIds.length < 2) return
    
    const first = this.vars.get(symbolIds[0])!
    for (let i = 1; i < symbolIds.length; i++) {
      const curr = this.vars.get(symbolIds[i])!
      // curr.y + curr.height/2 = first.y + first.height/2
      this.solver.addConstraint(
        new kiwi.Constraint(
          new kiwi.Expression([curr.y, 1], [curr.height, 0.5]),
          kiwi.Operator.Eq,
          new kiwi.Expression([first.y, 1], [first.height, 0.5])
        )
      )
    }
  }
}
