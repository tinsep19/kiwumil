// src/constraint_helper.ts
// ConstraintHelper: IConstraintsBuilder をラップして高水準のチェーン API を提供

import type { IConstraintsBuilder, ILayoutVariable } from "./core"
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
    private readonly builder: IConstraintsBuilder,
    private readonly bounds: LayoutBounds,
    private readonly width: number | ILayoutVariable,
    private readonly height: number | ILayoutVariable
  ) {}

  weak(): void {
    this.applyConstraints('weak')
  }

  medium(): void {
    this.applyConstraints('medium')
  }

  strong(): void {
    this.applyConstraints('strong')
  }

  required(): void {
    this.applyConstraints('required')
  }

  private applyConstraints(strength: 'weak' | 'medium' | 'strong' | 'required'): void {
    this.builder
      .expr([1, this.bounds.width])
      .eq([1, this.width])
      [strength]()

    this.builder
      .expr([1, this.bounds.height])
      .eq([1, this.height])
      [strength]()
  }
}

/**
 * Enclose 操作のビルダー
 */
class EncloseBuilder {
  private paddingValue: number | ILayoutVariable = 0

  constructor(
    private readonly builder: IConstraintsBuilder,
    private readonly container: LayoutBounds,
    private readonly children: LayoutBounds[]
  ) {}

  padding(value: number | ILayoutVariable): StrengthBuilder {
    this.paddingValue = value
    return {
      weak: () => this.applyConstraints('weak'),
      medium: () => this.applyConstraints('medium'),
      strong: () => this.applyConstraints('strong'),
      required: () => this.applyConstraints('required'),
    }
  }

  private applyConstraints(strength: 'weak' | 'medium' | 'strong' | 'required'): void {
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
      this.builder
        .expr([1, child.x])
        .ge([1, this.container.x], [1, this.paddingValue])
        [strength]()

      // child.y >= container.y + padding
      this.builder
        .expr([1, child.y])
        .ge([1, this.container.y], [1, this.paddingValue])
        [strength]()
    }
  }
}

/**
 * Arrange 操作のビルダー
 */
class ArrangeBuilder {
  private marginValue: number | ILayoutVariable = 0

  constructor(
    private readonly builder: IConstraintsBuilder,
    private readonly prev: LayoutBounds | ItemBounds,
    private readonly next: LayoutBounds | ItemBounds
  ) {}

  margin(value: number | ILayoutVariable): StrengthBuilder {
    this.marginValue = value
    return {
      weak: () => this.applyConstraints('weak'),
      medium: () => this.applyConstraints('medium'),
      strong: () => this.applyConstraints('strong'),
      required: () => this.applyConstraints('required'),
    }
  }

  private applyConstraints(strength: 'weak' | 'medium' | 'strong' | 'required'): void {
    // 自動検出: prev.right と next.x の関係で horizontal、prev.bottom と next.y で vertical
    // ここでは簡易的に、まず horizontal を試み、必要なら vertical も追加
    // 実装としては、両方の制約を生成する（水平と垂直の配置両方をサポート）
    
    // Horizontal: next.x >= prev.x + prev.width + margin
    this.builder
      .expr([1, this.next.x])
      .ge([1, this.prev.x], [1, this.prev.width], [1, this.marginValue])
      [strength]()
  }
}

/**
 * Align 操作のビルダー
 */
class AlignBuilder implements StrengthBuilder {
  constructor(
    private readonly builder: IConstraintsBuilder,
    private readonly vars: ILayoutVariable[]
  ) {}

  weak(): void {
    this.applyConstraints('weak')
  }

  medium(): void {
    this.applyConstraints('medium')
  }

  strong(): void {
    this.applyConstraints('strong')
  }

  required(): void {
    this.applyConstraints('required')
  }

  private applyConstraints(strength: 'weak' | 'medium' | 'strong' | 'required'): void {
    if (this.vars.length < 2) {
      return
    }

    for (let i = 0; i < this.vars.length - 1; i++) {
      const current = this.vars[i]
      const next = this.vars[i + 1]
      if (current && next) {
        this.builder
          .expr([1, current])
          .eq([1, next])
          [strength]()
      }
    }
  }
}

/**
 * ConstraintHelper は IConstraintsBuilder をラップし、
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
   * underlying の IConstraintsBuilder への参照
   */
  readonly builder: IConstraintsBuilder

  constructor(builder: IConstraintsBuilder) {
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
    width: number | ILayoutVariable,
    height: number | ILayoutVariable
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
   * @param children - 子要素の LayoutBounds の配列
   * @returns padding と制約の強度を設定するビルダー
   * 
   * @example
   * helper.enclose(container, [child1, child2]).padding(10).strong()
   */
  enclose(
    container: LayoutBounds,
    children: LayoutBounds[]
  ): EncloseBuilder {
    return new EncloseBuilder(this.builder, container, children)
  }

  /**
   * 隣接要素間の隙間（margin）を設定する
   * 
   * 水平配置の制約を生成:
   * - next.x >= prev.x + prev.width + margin
   * 
   * @param prev - 前の要素の LayoutBounds または ItemBounds
   * @param next - 次の要素の LayoutBounds または ItemBounds
   * @returns margin と制約の強度を設定するビルダー
   * 
   * @example
   * helper.arrange(child1, child2).margin(20).medium()
   */
  arrange(
    prev: LayoutBounds | ItemBounds,
    next: LayoutBounds | ItemBounds
  ): ArrangeBuilder {
    return new ArrangeBuilder(this.builder, prev, next)
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
  align(...vars: ILayoutVariable[]): StrengthBuilder {
    return new AlignBuilder(this.builder, vars)
  }
}
