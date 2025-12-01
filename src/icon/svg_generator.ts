import { IconRegistry } from './icon_registry';

export class SvgGenerator {
  private registry: IconRegistry;

  constructor(registry: IconRegistry) {
    this.registry = registry;
  }

  // Emit a complete SVG document/string with collected symbols in <defs>
  emit_document(body: string): string {
    const defs = this.registry.emit_symbols();
    return `<svg xmlns="http://www.w3.org/2000/svg">\n${defs}\n${body}\n</svg>`;
  }
}
