// src/item/icon_item.ts
import { Item, type ItemBaseOptions, type EstimateSize } from "./item_base"
import { getBoundsValues } from "../core"
import type { IconMeta } from "../icon"

/**
 * IconItemOptions: Configuration options for IconItem
 */
export interface IconItemOptions extends ItemBaseOptions {
  icon: IconMeta
  width?: number
  height?: number
  color?: string
}

const DEFAULT_ICON_WIDTH = 24
const DEFAULT_ICON_HEIGHT = 24
const DEFAULT_ICON_COLOR = "currentColor"

/**
 * IconItem: Renders an icon using IconMeta
 * Simple wrapper that renders icon content at the specified bounds
 */
export class IconItem extends Item {
  readonly icon: IconMeta
  readonly width: number
  readonly height: number
  readonly color: string

  constructor(options: IconItemOptions) {
    super(options)

    this.icon = options.icon
    this.width = options.width ?? this.icon.width ?? DEFAULT_ICON_WIDTH
    this.height = options.height ?? this.icon.height ?? DEFAULT_ICON_HEIGHT
    this.color = options.color ?? DEFAULT_ICON_COLOR
  }

  /**
   * Calculate the default size based on icon dimensions
   */
  getDefaultSize(): EstimateSize {
    return {
      width: this.width,
      height: this.height,
    }
  }

  /**
   * Render the icon as SVG
   * Uses <use> if href is available, otherwise renders raw SVG content
   */
  render(): string {
    const { x, y, width, height } = getBoundsValues(this.bounds)

    // If icon has href (symbol reference), use <use> element
    if (this.icon.href) {
      const viewBoxAttr = this.icon.viewBox ? ` viewBox="${this.icon.viewBox}"` : ""
      return `
        <svg x="${x}" y="${y}" width="${width}" height="${height}"${viewBoxAttr}
             fill="${this.color}">
          <use href="#${this.icon.href}" />
        </svg>
      `
    }

    // Otherwise, render raw SVG content wrapped in a positioned group
    if (this.icon.raw) {
      return `
        <g transform="translate(${x}, ${y})">
          ${this.icon.raw}
        </g>
      `
    }

    // No icon content available
    return ""
  }
}
