// src/item/item_base.ts
import type { ItemBounds } from "../core"

/**
 * ItemBaseOptions: Base options for all Item types
 */
export interface ItemBaseOptions {
  bounds: ItemBounds
}

/**
 * EstimateSize: Represents width and height dimensions
 */
export interface EstimateSize {
  width: number
  height: number
}

/**
 * Item: Abstract base class for all renderable items
 * Items are foundational units for labels, titles, and other content
 * that can be rendered within a symbol or standalone.
 */
export abstract class Item {
  readonly bounds: ItemBounds

  constructor(options: ItemBaseOptions) {
    this.bounds = options.bounds
  }

  /**
   * Calculate the default size for this item based on its content
   * @returns EstimateSize object with width and height
   */
  abstract getDefaultSize(): EstimateSize

  /**
   * Render the item as an SVG string
   * @returns SVG markup representing this item
   */
  abstract render(): string
}
