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

  // Load an icon (stubbed). Real implementation should read file, sanitize and optimize.
  async load(name: string): Promise<IconMeta | null> {
    const rel = this.registry[name];
    if (!rel) return null;
    // TODO: read file from disk based on baseUrl, sanitize, optimize (SVGO), extract viewBox/width/height
    const id = `${this.plugin}-${name}`.toLowerCase();
    return { href: id, raw: `<svg><!-- stub for ${rel} --></svg>` };
  }
}
