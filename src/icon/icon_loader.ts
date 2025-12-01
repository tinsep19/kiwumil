export type IconMeta = {
  width?: number;
  height?: number;
  viewBox?: string;
  href?: string; // symbol id reference
  raw?: string; // raw svg content (optimized)
};

export class IconLoader {
  private plugin: string;
  private baseUrl: string;
  private registry: Record<string, string> = {};

  constructor(plugin: string, baseUrl: string) {
    this.plugin = plugin;
    this.baseUrl = baseUrl; // typically import.meta.url or file path
  }

  // Register an icon file path relative to the plugin (e.g. 'icons/icon1.svg')
  register(name: string, relPath: string) {
    this.registry[name] = relPath;
  }

  // List registered icon names
  list(): string[] {
    return Object.keys(this.registry);
  }

  // Synchronous load helper (returns optimized meta). Real impl should read & sanitize from disk.
  load_sync(name: string): IconMeta | null {
    const rel = this.registry[name];
    if (!rel) return null;
    const id = `${this.plugin}-${name}`.toLowerCase();
    return { href: id, raw: `<svg><!-- stub for ${rel} --></svg>` };
  }

  // Async wrapper kept for backward-compatibility
  async load(name: string): Promise<IconMeta | null> {
    return this.load_sync(name)
  }
}
