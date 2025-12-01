// Minimal icon registry: collects used icons and emits <symbol> fragments

function normalize_id(plugin: string, name: string): string {
  let id = `${plugin}-${name}`.toLowerCase();
  // replace invalid characters with '-'
  id = id.replace(/[^a-z0-9_.-]/g, '-');
  // prefix if starts with digit
  if (/^[0-9]/.test(id)) id = `i-${id}`;
  return id;
}

export class IconRegistry {
  private symbols = new Map<string, string>();

  // Register an icon's SVG content and return symbolId
  register(plugin: string, name: string, svgContent: string): string {
    const id = normalize_id(plugin, name);
    this.symbols.set(id, svgContent);
    return id;
  }

  // Mark usage (placeholder, can track usage counts)
  mark_usage(plugin: string, name: string): string {
    const id = normalize_id(plugin, name);
    // ensure symbol exists; if not, caller should register first
    if (!this.symbols.has(id)) this.symbols.set(id, '');
    return id;
  }

  // Emit combined <symbol> fragments wrapped in <defs>
  emit_symbols(): string {
    if (this.symbols.size === 0) return '';
    let out = '<defs>\n';
    for (const [id, svg] of this.symbols.entries()) {
      // svg is expected to be inner content (e.g., paths). For now insert raw.
      out += `<symbol id="${id}">` + svg + `</symbol>\n`;
    }
    out += '</defs>';
    return out;
  }
}
