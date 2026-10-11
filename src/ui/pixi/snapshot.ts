// Turns a drawing of the SVG scene, as the browser styles it, into a standalone SVG: each
// element carries its computed paint, so the picture no longer needs the page's CSS.
import type { Box } from '../neighbourhood';
import type { Art } from './art';

/** Properties that decide how an element is painted. */
const PAINT = [
  'fill',
  'fill-opacity',
  'fill-rule',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-linecap',
  'stroke-linejoin',
  'opacity',
  'stop-color',
  'stop-opacity',
] as const;

/** Also kept for a photo of the whole map (§6.5): where CSS places and turns each element. */
const PLACEMENT = ['transform', 'transform-origin', 'transform-box', 'visibility'] as const;

/** `url("http://…/#id")` as computed by some browsers, back to the `url(#id)` a picture resolves. */
export function localUrl(value: string): string {
  return value.replace(/url\((["']?)[^#)"']*(#[^)"']+)\1\)/g, 'url($2)');
}

/**
 * The element and its children as SVG markup, styles inlined, titles and hidden parts left out.
 * With `placement`, CSS transforms are kept too, for a picture of the scene as it stands.
 */
export function inlineStyles(element: Element, placement = false): string {
  const properties: readonly string[] = placement ? [...PAINT, ...PLACEMENT] : PAINT;
  const clone = element.cloneNode(true) as Element;
  const originals = [element, ...element.querySelectorAll('*')];
  const copies = [clone, ...clone.querySelectorAll('*')];
  originals.forEach((original, i) => {
    const copy = copies[i]!;
    const style = getComputedStyle(original);
    if (original.localName === 'title' || style.display === 'none') {
      copy.remove();
      return;
    }
    copy.removeAttribute('class');
    copy.removeAttribute('data-source');
    copy.setAttribute(
      'style',
      properties.map((name) => `${name}:${localUrl(style.getPropertyValue(name))}`).join(';'),
    );
  });
  return new XMLSerializer().serializeToString(clone);
}

/** The world box an element covers, with room for its strokes, in whole units. */
export function paddedBox(box: { x: number; y: number; width: number; height: number }): Box {
  const margin = 3;
  const x = Math.floor(box.x - margin);
  const y = Math.floor(box.y - margin);
  return [
    x,
    y,
    Math.ceil(box.x + box.width + margin) - x,
    Math.ceil(box.y + box.height + margin) - y,
  ];
}

/**
 * Reads drawings from the hidden SVG that PixiMap renders. Results are kept while the drawing's
 * markup and the scene's look (phase, season, challenge) stay the same.
 */
export class Snapshots {
  private cache = new Map<string, { html: string; look: string; art: Art }>();
  private defs: { look: string; svg: string } | null = null;

  constructor(private root: SVGSVGElement) {}

  /** The drawing `key` as a standalone picture, or null when it is not rendered. */
  art(key: string): Art | null {
    const element = this.root.querySelector<SVGGraphicsElement>(`[data-source="${key}"]`);
    if (!element) return null;
    const html = element.innerHTML;
    const look = this.look();
    const cached = this.cache.get(key);
    if (cached && cached.html === html && cached.look === look) return cached.art;
    const markup = inlineStyles(element);
    const svg = markup.includes('url(#') ? this.patterns(look) + markup : markup;
    const art = { box: paddedBox(element.getBBox()), svg };
    this.cache.set(key, { html, look, art });
    return art;
  }

  /** Forgets drawings no longer shown. */
  keep(keys: Set<string>): void {
    for (const key of this.cache.keys()) if (!keys.has(key)) this.cache.delete(key);
  }

  private look(): string {
    const scene = this.root.closest('.scene');
    return ['data-phase', 'data-season', 'data-challenge']
      .map((name) => scene?.getAttribute(name) ?? '')
      .join('|');
  }

  private patterns(look: string): string {
    if (this.defs?.look !== look) {
      const defs = this.root.querySelector('defs');
      this.defs = { look, svg: defs ? inlineStyles(defs) : '' };
    }
    return this.defs.svg;
  }
}
