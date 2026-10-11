// The photo mode (docs/game-design.md §6.5): a picture of the map as it stands, every layer of it
// (the WebGL canvas, the SVG scene and its overlays, the heliotrope) drawn in order on one canvas
// and saved as a PNG.
import { mapPicture } from './mapPicture';
import { inlineStyles } from './pixi/snapshot';

/** Pixels of the picture per CSS pixel of the map: sharp on any screen. */
const PICTURE_SCALE = 2;

function loadSvg(svg: SVGSVGElement, width: number, height: number): Promise<HTMLImageElement> {
  const markup = inlineStyles(svg, true)
    .replace(/^<svg/, `<svg width="${width}" height="${height}"`)
    .replace(/^<svg(?![^>]*xmlns=)/, '<svg xmlns="http://www.w3.org/2000/svg"');
  const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }));
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('svg'));
    };
    image.src = url;
  });
}

/** The layers of the map to draw, in order: canvases and outermost SVGs, not the hidden ones. */
function layers(map: HTMLElement): (HTMLCanvasElement | SVGSVGElement)[] {
  return [...map.querySelectorAll<HTMLCanvasElement | SVGSVGElement>('canvas, svg')].filter(
    (element) =>
      !element.closest('.pixi-sources, .butterfly') &&
      !(element instanceof SVGSVGElement && element.parentElement?.closest('svg')) &&
      element.getBoundingClientRect().width > 0,
  );
}

/** The map as a PNG picture, or null when the browser could not make it. */
export async function takePhoto(map: HTMLElement): Promise<Blob | null> {
  const frame = map.getBoundingClientRect();
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(frame.width * PICTURE_SCALE);
  canvas.height = Math.round(frame.height * PICTURE_SCALE);
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.scale(PICTURE_SCALE, PICTURE_SCALE);
  context.fillStyle = getComputedStyle(map).backgroundColor || '#fbf6ec';
  context.fillRect(0, 0, frame.width, frame.height);
  // The SVG layers are read first: the WebGL canvas must be drawn in the same moment it renders.
  const found = layers(map);
  const images = await Promise.all(
    found.map((element) => {
      if (element instanceof HTMLCanvasElement) return null;
      const box = element.getBoundingClientRect();
      return loadSvg(element, box.width, box.height).catch(() => null);
    }),
  );
  mapPicture.renderNow?.();
  found.forEach((element, i) => {
    const box = element.getBoundingClientRect();
    const source = element instanceof HTMLCanvasElement ? element : images[i];
    if (!source) return;
    context.drawImage(source, box.left - frame.left, box.top - frame.top, box.width, box.height);
  });
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

/** Offer the picture to the player as a file. */
export function downloadPhoto(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
