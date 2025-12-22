// src/item/rect_item.ts
import { Item, type ItemBaseOptions, type Size } from "./item_base"
import { getBoundsValues } from "../core"

/**
 * RectItemOptions: Configuration options for RectItem
 */
export interface RectItemOptions extends ItemBaseOptions {
  fillColor?: string
  strokeColor?: string
  strokeWidth?: number
  cornerRadius?: number
  width?: number
  height?: number
}

const DEFAULT_FILL_COLOR = "white"
const DEFAULT_STROKE_COLOR = "black"
const DEFAULT_STROKE_WIDTH = 2
const DEFAULT_CORNER_RADIUS = 0
const DEFAULT_WIDTH = 120
const DEFAULT_HEIGHT = 60

/**
 * RectItem: Renders a rectangle with customizable fill, stroke, and corner radius
 * Supports both sharp corners and rounded corners
 */
export class RectItem extends Item {
  readonly fillColor: string
  readonly strokeColor: string
  readonly strokeWidth: number
  readonly cornerRadius: number
  readonly width: number
  readonly height: number

  constructor(options: RectItemOptions) {
    super(options)

    this.fillColor = options.fillColor ?? DEFAULT_FILL_COLOR
    this.strokeColor = options.strokeColor ?? DEFAULT_STROKE_COLOR
    this.strokeWidth = options.strokeWidth ?? DEFAULT_STROKE_WIDTH
    this.cornerRadius = options.cornerRadius ?? DEFAULT_CORNER_RADIUS
    this.width = options.width ?? DEFAULT_WIDTH
    this.height = options.height ?? DEFAULT_HEIGHT
  }

  /**
   * Calculate the default size based on configured dimensions
   */
  getDefaultSize(): Size {
    return {
      width: this.width,
      height: this.height,
    }
  }

  /**
   * Render the rectangle as SVG
   * Uses <rect> for sharp corners or <rect> with rx/ry for rounded corners
   */
  render(): string {
    const { x, y, width, height } = getBoundsValues(this.bounds)

    // If corner radius is specified, add rx and ry attributes
    const cornerAttrs =
      this.cornerRadius > 0
        ? ` rx="${this.cornerRadius}" ry="${this.cornerRadius}"`
        : ""

    return `
      <rect x="${x}" y="${y}" width="${width}" height="${height}"${cornerAttrs}
            fill="${this.fillColor}"
            stroke="${this.strokeColor}"
            stroke-width="${this.strokeWidth}" />
    `
  }
}
