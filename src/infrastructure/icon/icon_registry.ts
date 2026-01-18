// Minimal icon registry: collects used icons and emits <symbol> fragments
import { LoaderFactory } from "./loader_factory"

function normalize_id(plugin: string, name: string): string {
  let id = `${plugin}-${name}`.toLowerCase()
  // replace invalid characters with '-'
  id = id.replace(/[^a-z0-9_.-]/g, "-")
  // prefix if starts with digit
  if (/^[0-9]/.test(id)) id = `i-${id}`
  return id
}

type StoredIcon = {
  inner: string
  viewBox?: string
}

export class IconRegistry {
  private symbols = new Map<string, StoredIcon>()

  // Register an icon's SVG content and return symbolId
  register(plugin: string, name: string, svgContent: string): string {
    const id = normalize_id(plugin, name)

    // If svgContent is a full <svg> element, extract viewBox and inner content
    const svgMatch = svgContent.match(/<svg([^>]*)>([\s\S]*?)<\/svg>/i)
    let inner = svgContent
    let viewBox: string | undefined = undefined
    if (svgMatch) {
      inner = svgMatch[2] || ""
      const attr = svgMatch[1] || ""
      const vb = attr.match(/viewBox\s*=\s*"([^"]+)"/i)
      if (vb) viewBox = vb[1]
    }

    this.symbols.set(id, { inner, viewBox })
    return id
  }

  // Mark usage (placeholder, can track usage counts)
  mark_usage(plugin: string, name: string): string {
    const id = normalize_id(plugin, name)
    // ensure symbol exists; if not, create empty placeholder
    if (!this.symbols.has(id)) this.symbols.set(id, { inner: "" })
    return id
  }

  // Emit combined <symbol> fragments wrapped in <defs>
  emit_symbols(): string {
    if (this.symbols.size === 0) return ""
    let out = "<defs>\n"
    for (const [id, icon] of this.symbols.entries()) {
      const vbAttr = icon.viewBox ? ` viewBox="${icon.viewBox}"` : ""
      out += `<symbol id="${id}"${vbAttr}>` + icon.inner + `</symbol>\n`
    }
    out += "</defs>"
    return out
  }

  /**
   * Create a LoaderFactory for the given plugin
   * This method is used by plugins in createIconFactory to get a factory for creating icon loaders
   *
   * @param plugin - Plugin name
   * @param importMeta - import.meta from the plugin
   * @returns LoaderFactory instance
   */
  createLoaderFactory(plugin: string, importMeta: ImportMeta): LoaderFactory {
    return new LoaderFactory(plugin, importMeta?.url ?? "", this)
  }
}
