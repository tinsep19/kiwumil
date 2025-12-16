// src/constraint_helper.ts
// ConstraintHelper: LinearConstraintBuilder をラップして高水準のチェーン API を提供

import type { LinearConstraintBuilder, Variable } from "./core"
import type { LayoutBounds, ItemBounds } from "./core"

/**
 * 制約の強度を設定するためのビルダーインターフェース
 */
interface StrengthBuilder {
  weak(): void
  medium(): void
  strong(): void
  required(): void
}

/**
 * SetSize 操作のビルダー
 */
class SetSizeBuilder implements StrengthBuilder {
  constructor(
    private readonly builder: LinearConstraintBuilder,
    private readonly bounds: LayoutBounds,
    private readonly width: number | Variable,
    private readonly height: number | Variable
  ) {}

  weak(): void {
    this.applyConstraints("weak")
  }

  medium(): void {
    this.applyConstraints("medium")
  }

  strong(): void {
    this.applyConstraints("strong")
  }

  required(): void {
    this.applyConstraints("required")
  }

  private applyConstraints(strength: "weak" | "medium" | "strong" | "required"): void {
    this.builder.expr([1, this.bounds.width]).eq([1, this.width])[strength]()

    this.builder.expr([1, this.bounds.height]).eq([1, this.height])[strength]()
  }
}

/**
 * Enclose の padding 設定ビルダー
 */
class EnclosePaddingBuilder {
  constructor(
    private readonly builder: LinearConstraintBuilder,
    private readonly container: LayoutBounds,
    private readonly children: LayoutBounds[],
    private readonly paddingValue: number | Variable
  ) {}

  weak(): void {
    this.applyConstraints("weak")
  }

  medium(): void {
    this.applyConstraints("medium")
  }

  strong(): void {
    this.applyConstraints("strong")
  }

  required(): void {
    this.applyConstraints("required")
  }

  private applyConstraints(strength: "weak" | "medium" | "strong" | "required"): void {
    for (const child of this.children) {
      // container.width >= child.width + 2*padding
      this.builder
        .expr([1, this.container.width])
        .ge([1, child.width], [2, this.paddingValue])
        [strength]()

      // container.height >= child.height + 2*padding
      this.builder
        .expr([1, this.container.height])
        .ge([1, child.height], [2, this.paddingValue])
        [strength]()

      // child.x >= container.x + padding
      this.builder.expr([1, child.x]).ge([1, this.container.x], [1, this.paddingValue])[strength]()

      // child.y >= container.y + padding
      this.builder.expr([1, child.y]).ge([1, this.container.y], [1, this.paddingValue])[strength]()
    }
  }
}

/**
 * Enclose 操作のビルダー
 */
class EncloseBuilder {
  constructor(
    private readonly builder: LinearConstraintBuilder,
    private readonly container: LayoutBounds
  ) {}

  childs(...children: LayoutBounds[]): EncloseChildsBuilder {
    return new EncloseChildsBuilder(this.builder, this.container, children)
  }
}

/**
 * Enclose の childs 設定ビルダー
 */
class EncloseChildsBuilder {
  constructor(
    private readonly builder: LinearConstraintBuilder,
    private readonly container: LayoutBounds,
    private readonly children: LayoutBounds[]
  ) {}

  padding(value: number | Variable): EnclosePaddingBuilder {
    return new EnclosePaddingBuilder(this.builder, this.container, this.children, value)
  }
}

/**
 * Arrange の方向設定ビルダー
 */
class ArrangeDirectionBuilder implements StrengthBuilder {
  constructor(
    private readonly builder: LinearConstraintBuilder,
    private readonly elements: (LayoutBounds | ItemBounds)[],
    private readonly marginValue: number | Variable,
    private readonly direction: "horizontal" | "vertical"
  ) {}

  weak(): void {
    this.applyConstraints("weak")
  }

  medium(): void {
    this.applyConstraints("medium")
  }

  strong(): void {
    this.applyConstraints("strong")
  }

  required(): void {
    this.applyConstraints("required")
  }

  private applyConstraints(strength: "weak" | "medium" | "strong" | "required"): void {
    for (let i = 0; i < this.elements.length - 1; i++) {
      const prev = this.elements[i]
      const next = this.elements[i + 1]
      if (!prev || !next) continue

      if (this.direction === "horizontal") {
        // next.x >= prev.x + prev.width + margin
        // Equivalently: prev.right + margin = next.left
        this.builder
          .expr([1, next.x])
          .ge([1, prev.x], [1, prev.width], [1, this.marginValue])
          [strength]()
      } else {
        // next.y >= prev.y + prev.height + margin
        // Equivalently: prev.bottom + margin = next.top
        this.builder
          .expr([1, next.y])
          .ge([1, prev.y], [1, prev.height], [1, this.marginValue])
          [strength]()
      }
    }
  }
}

/**
 * Arrange の margin 設定ビルダー
 */
class ArrangeMarginBuilder {
  constructor(
    private readonly builder: LinearConstraintBuilder,
    private readonly elements: (LayoutBounds | ItemBounds)[],
    private readonly marginValue: number | Variable
  ) {}

  horizontal(): ArrangeDirectionBuilder {
    return new ArrangeDirectionBuilder(this.builder, this.elements, this.marginValue, "horizontal")
  }

  vertical(): ArrangeDirectionBuilder {
    return new ArrangeDirectionBuilder(this.builder, this.elements, this.marginValue, "vertical")
  }
}

/**
 * Arrange 操作のビルダー
 */
class ArrangeBuilder {
  constructor(
    private readonly builder: LinearConstraintBuilder,
    private readonly elements: (LayoutBounds | ItemBounds)[]
  ) {}

  margin(value: number | Variable): ArrangeMarginBuilder {
    return new ArrangeMarginBuilder(this.builder, this.elements, value)
  }
}

/**
 * Align 操作のビルダー
 */
class AlignBuilder implements StrengthBuilder {
  constructor(
    private readonly builder: LinearConstraintBuilder,
    private readonly vars: Variable[]
  ) {}

  weak(): void {
    this.applyConstraints("weak")
  }

  medium(): void {
    this.applyConstraints("medium")
  }

  strong(): void {
    this.applyConstraints("strong")
  }

  required(): void {
    this.applyConstraints("required")
  }

  private applyConstraints(strength: "weak" | "medium" | "strong" | "required"): void {
    if (this.vars.length < 2) {
      return
    }

    for (let i = 0; i < this.vars.length - 1; i++) {
      const current = this.vars[i]
      const next = this.vars[i + 1]
      if (current && next) {
        this.builder.expr([1, current]).eq([1, next])[strength]()
      }
    }
  }
}

/**
 * ConstraintHelper は LinearConstraintBuilder をラップし、
 * プラグイン／シンボル実装で使いやすい高水準のチェーン API を提供します。
 *
 * 提供する API:
 * - setSize: Symbol の LayoutBounds のサイズを設定
 * - enclose: container と children の間の内側余白（padding）を設定
 * - arrange: 隣接要素間の隙間（margin）を設定
 * - align: 複数の変数を等しくする制約を生成
 */
export class ConstraintHelper {
  /**
   * underlying の LinearConstraintBuilder への参照
   */
  readonly builder: LinearConstraintBuilder

  constructor(builder: LinearConstraintBuilder) {
    this.builder = builder
  }

  /**
   * Symbol の LayoutBounds のサイズを設定する
   *
   * @param bounds - Symbol の LayoutBounds
   * @param width - 幅の値または変数
   * @param height - 高さの値または変数
   * @returns 制約の強度を設定するビルダー
   *
   * @example
   * helper.setSize(container, 200, 150).strong()
   */
  setSize(
    bounds: LayoutBounds,
    width: number | Variable,
    height: number | Variable
  ): StrengthBuilder {
    return new SetSizeBuilder(this.builder, bounds, width, height)
  }

  /**
   * container と children の間の内側余白（padding）を設定する
   *
   * 以下の制約を生成:
   * - container.width >= child.width + 2*padding
   * - container.height >= child.height + 2*padding
   * - child.x >= container.x + padding
   * - child.y >= container.y + padding
   *
   * @param container - コンテナの LayoutBounds
   * @returns childs と padding と制約の強度を設定するビルダー
   *
   * @example
   * helper.enclose(container).childs(child1, child2).padding(10).strong()
   */
  enclose(container: LayoutBounds): EncloseBuilder {
    return new EncloseBuilder(this.builder, container)
  }

  /**
   * 複数要素間の隙間（margin）と配置方向を設定する
   *
   * 水平配置の制約を生成:
   * - x1.right + margin = x2.left (x2.x >= x1.x + x1.width + margin)
   * - x2.right + margin = x3.left (x3.x >= x2.x + x2.width + margin)
   *
   * 垂直配置の制約を生成:
   * - x1.bottom + margin = x2.top (x2.y >= x1.y + x1.height + margin)
   * - x2.bottom + margin = x3.top (x3.y >= x2.y + x2.height + margin)
   *
   * @param elements - 配置する要素の LayoutBounds または ItemBounds（可変長引数）
   * @returns margin と方向と制約の強度を設定するビルダー
   *
   * @example
   * helper.arrange(x1, x2, x3).margin(20).horizontal().medium()
   * helper.arrange(x1, x2, x3).margin(20).vertical().medium()
   */
  arrange(...elements: (LayoutBounds | ItemBounds)[]): ArrangeBuilder {
    return new ArrangeBuilder(this.builder, elements)
  }

  /**
   * 複数の変数を等しくする制約を生成する
   *
   * vars[0] = vars[1], vars[1] = vars[2], ... の形で制約を生成
   *
   * @param vars - 等しくする変数（可変長引数）
   * @returns 制約の強度を設定するビルダー
   *
   * @example
   * helper.align(layout.z, container.z, item1.z, item2.z).required()
   */
  align(...vars: Variable[]): StrengthBuilder {
    return new AlignBuilder(this.builder, vars)
  }
}
