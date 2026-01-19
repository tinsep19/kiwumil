// src/domain/entity/item/text_item.ts
import { Item, type ItemBaseOptions, type EstimateSize } from "./item_base"
import { getBoundsValues } from "../layout_variable"

/**
 * TextAlignment: Text alignment options
 */
export type TextAlignment = "left" | "center" | "right"

/**
 * Padding: Padding configuration for text items
 */
export interface Padding {
  top: number
  right: number
  bottom: number
  left: number
}

/**
 * TextItemOptions: Configuration options for TextItem
 */
export interface TextItemOptions extends ItemBaseOptions {
  text: string
  alignment?: TextAlignment
  padding?: Partial<Padding>
  fontSize?: number
  fontFamily?: string
  textColor?: string
  lineHeightFactor?: number
}

const DEFAULT_FONT_SIZE = 14
const DEFAULT_FONT_FAMILY = "Arial"
const DEFAULT_TEXT_COLOR = "black"
const DEFAULT_LINE_HEIGHT_FACTOR = 1.2
const DEFAULT_PADDING = {
  top: 8,
  right: 12,
  bottom: 8,
  left: 12,
}

/**
 * TextItem: Renders text with configurable alignment and padding
 * Supports multiline text and calculates size based on content
 */
export class TextItem extends Item {
  readonly text: string
  readonly alignment: TextAlignment
  readonly padding: Padding
  readonly fontSize: number
  readonly fontFamily: string
  readonly textColor: string
  readonly lineHeightFactor: number

  constructor(options: TextItemOptions) {
    super(options)

    this.text = options.text
    this.alignment = options.alignment ?? "center"
    this.fontSize = options.fontSize ?? DEFAULT_FONT_SIZE
    this.fontFamily = options.fontFamily ?? DEFAULT_FONT_FAMILY
    this.textColor = options.textColor ?? DEFAULT_TEXT_COLOR
    this.lineHeightFactor = options.lineHeightFactor ?? DEFAULT_LINE_HEIGHT_FACTOR

    // Merge provided padding with defaults
    this.padding = {
      top: options.padding?.top ?? DEFAULT_PADDING.top,
      right: options.padding?.right ?? DEFAULT_PADDING.right,
      bottom: options.padding?.bottom ?? DEFAULT_PADDING.bottom,
      left: options.padding?.left ?? DEFAULT_PADDING.left,
    }
  }

  /**
   * Split text into lines, handling different line ending styles
   */
  private getLines(): string[] {
    const normalized = this.text.replace(/\r\n/g, "\n")
    const lines = normalized.split("\n")
    return lines.length > 0 ? lines : [""]
  }

  /**
   * Calculate the default size based on text content and padding
   */
  getDefaultSize(): EstimateSize {
    const lines = this.getLines()
    const longestLine = Math.max(...lines.map((line) => line.length), 1)

    // Approximate character width based on font size
    const approxCharWidth = this.fontSize * 0.6
    const textWidth = longestLine * approxCharWidth

    // Calculate height based on number of lines
    const lineHeight = this.fontSize * this.lineHeightFactor
    const textHeight = lines.length * lineHeight

    return {
      width: textWidth + this.padding.left + this.padding.right,
      height: textHeight + this.padding.top + this.padding.bottom,
    }
  }

  /**
   * Get the text anchor attribute for SVG based on alignment
   */
  private getTextAnchor(): "start" | "middle" | "end" {
    switch (this.alignment) {
      case "left":
        return "start"
      case "right":
        return "end"
      case "center":
      default:
        return "middle"
    }
  }

  /**
   * Calculate the x position for text based on alignment
   */
  private getTextX(boundsX: number, boundsWidth: number): number {
    switch (this.alignment) {
      case "left":
        return boundsX + this.padding.left
      case "right":
        return boundsX + boundsWidth - this.padding.right
      case "center":
      default:
        return boundsX + boundsWidth / 2
    }
  }

  /**
   * Render the text item as SVG
   */
  render(): string {
    const { x, y, width } = getBoundsValues(this.bounds)
    const lines = this.getLines()
    const textAnchor = this.getTextAnchor()
    const textX = this.getTextX(x, width)
    const startY = y + this.padding.top + this.fontSize
    const lineHeight = this.fontSize * this.lineHeightFactor

    // Generate tspan elements for each line
    const tspans = lines
      .map((line, index) => {
        const dy = index === 0 ? 0 : lineHeight
        // Escape XML special characters
        const escaped = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        // Use space for empty lines to maintain spacing
        return `<tspan x="${textX}" dy="${dy}">${escaped || " "}</tspan>`
      })
      .join("\n")

    return `
      <text x="${textX}" y="${startY}"
            text-anchor="${textAnchor}"
            font-size="${this.fontSize}"
            font-family="${this.fontFamily}"
            fill="${this.textColor}">
        ${tspans}
      </text>
    `
  }
}
