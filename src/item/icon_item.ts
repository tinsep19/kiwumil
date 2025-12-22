// src/item/icon_item.ts
import { Item, type ItemBaseOptions, type Size } from "./item_base"
import { getBoundsValues } from "../core"
import type { IconRegistry } from "../icon"

/**
 * IconItemOptions: Configuration options for IconItem
 */
export interface IconItemOptions extends ItemBaseOptions {
  iconRegistry: IconRegistry
  plugin: string
  iconName: string
  width?: number
  height?: number
  color?: string
}

const DEFAULT_ICON_WIDTH = 24
const DEFAULT_ICON_HEIGHT = 24
const DEFAULT_ICON_COLOR = "currentColor"

/**
 * IconItem: Renders an icon using SVG <use> element
 * Integrates with IconRegistry to reference icon symbols
 */
export class IconItem extends Item {
  readonly iconRegistry: IconRegistry
  readonly plugin: string
  readonly iconName: string
  readonly width: number
  readonly height: number
  readonly color: string

  constructor(options: IconItemOptions) {
    super(options)

    this.iconRegistry = options.iconRegistry
    this.plugin = options.plugin
    this.iconName = options.iconName
    this.width = options.width ?? DEFAULT_ICON_WIDTH
    this.height = options.height ?? DEFAULT_ICON_HEIGHT
    this.color = options.color ?? DEFAULT_ICON_COLOR
  }

  /**
   * Calculate the default size based on icon dimensions
   */
  getDefaultSize(): Size {
    return {
      width: this.width,
      height: this.height,
    }
  }

  /**
   * Render the icon as SVG using <use> element
   * The icon symbol should be registered in the IconRegistry
   */
  render(): string {
    const { x, y, width, height } = getBoundsValues(this.bounds)

    // Mark icon usage in the registry and get the symbol ID
    const symbolId = this.iconRegistry.mark_usage(this.plugin, this.iconName)

    return `
      <svg x="${x}" y="${y}" width="${width}" height="${height}"
           fill="${this.color}">
        <use href="#${symbolId}" />
      </svg>
    `
  }
}
