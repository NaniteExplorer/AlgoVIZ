/**
 * Path primitives shared by every 2D family.
 *
 * These exist so DP tables, recursion trees and data-structure diagrams speak
 * the same visual language as the WebGL scenes: soft-cornered blocks, tapered
 * connectors and curved edges rather than raw `strokeRect`/`lineTo` output.
 * All coordinates are CSS pixels — the backend applies the DPR transform.
 */

/** Trace a rounded rectangle. Caller fills/strokes. */
export function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
): void {
  const r = Math.max(0, Math.min(radius, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  fill: string,
): void {
  roundRectPath(ctx, x, y, w, h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
}

export function strokeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  stroke: string,
  lineWidth = 1,
): void {
  roundRectPath(ctx, x, y, w, h, radius);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

/** A straight line ending in a solid arrowhead — provenance arrows, list links. */
export function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  lineWidth = 1.5,
  headSize = 7,
): void {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  // Stop the shaft short of the tip so the line doesn't poke through the head.
  const shaftX = x2 - Math.cos(angle) * headSize * 0.9;
  const shaftY = y2 - Math.sin(angle) * headSize * 0.9;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(shaftX, shaftY);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - Math.cos(angle - Math.PI / 7) * headSize,
    y2 - Math.sin(angle - Math.PI / 7) * headSize,
  );
  ctx.lineTo(
    x2 - Math.cos(angle + Math.PI / 7) * headSize,
    y2 - Math.sin(angle + Math.PI / 7) * headSize,
  );
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

/**
 * A quadratic curve between two points, bowed perpendicular to the chord.
 * Used for tree edges and hash-bucket chains, where straight lines overlap.
 */
export function curve(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  lineWidth = 1.5,
  bow = 0.18,
): void {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(mx - dy * bow, my + dx * bow, x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.stroke();
}

export function circle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  fill: string,
): void {
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}
