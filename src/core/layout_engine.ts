// src/core/layout_engine.ts
import * as kiwi from "@lume/kiwi"

export interface NodeBox {
  id: string
  x: kiwi.Variable
  y: kiwi.Variable
  width: kiwi.Variable
  height: kiwi.Variable
}

/**
 * LayoutEngine
 * Cassowary制約ソルバ（@lume/kiwi）を利用してノード位置を決定
 */
export class LayoutEngine {
  private solver: kiwi.Solver
  private boxes: Map<string, NodeBox>

  constructor() {
    this.solver = new kiwi.Solver()
    this.boxes = new Map()
  }

  /** ノードを追加 */
  addNode(id: string, width = 100, height = 60): NodeBox {
    const box: NodeBox = {
      id,
      x: new kiwi.Variable(`${id}.x`),
      y: new kiwi.Variable(`${id}.y`),
      width: new kiwi.Variable(`${id}.w`),
      height: new kiwi.Variable(`${id}.h`),
    }

    // 固定サイズ制約
    this.solver.addConstraint(
      new kiwi.Constraint(new kiwi.Expression(box.width), kiwi.Operator.Eq, width)
    )
    this.solver.addConstraint(
      new kiwi.Constraint(new kiwi.Expression(box.height), kiwi.Operator.Eq, height)
    )

    this.boxes.set(id, box)
    return box
  }

  /** 原点に固定 */
  anchorNode(node: NodeBox, x: number, y: number) {
    this.solver.addConstraint(
      new kiwi.Constraint(new kiwi.Expression(node.x), kiwi.Operator.Eq, x)
    )
    this.solver.addConstraint(
      new kiwi.Constraint(new kiwi.Expression(node.y), kiwi.Operator.Eq, y)
    )
  }

  /** 水平方向にノードを並べる */
  addHorizontalLayout(nodes: NodeBox[], gap = 40) {
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i]
      const b = nodes[i + 1]
      if (!a || !b) continue

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

  /** 垂直方向にノードを並べる */
  addVerticalLayout(nodes: NodeBox[], gap = 40) {
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i]
      const b = nodes[i + 1]
      if (!a || !b) continue

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

  /** 解を求める */
  solve(): Record<string, { x: number; y: number; w: number; h: number }> {
    this.solver.updateVariables()
    const result: Record<string, { x: number; y: number; w: number; h: number }> = {}
    for (const [id, box] of this.boxes) {
      result[id] = {
        x: box.x.value(),
        y: box.y.value(),
        w: box.width.value(),
        h: box.height.value(),
      }
    }
    return result
  }
}

