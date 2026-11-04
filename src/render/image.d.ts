/** SVG markup decoded as a browser image (its images must be inline). */
export function svgImage(svg: string): Promise<HTMLImageElement>;
/** A new canvas of this size and its 2D context. */
export function canvas2d(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D];
