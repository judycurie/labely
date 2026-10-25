/**
 * Helvetica Font Loader & OpenType Glyph to Three.js Shape Converter
 */

import * as THREE from 'three';
import * as opentype from 'opentype.js';
import { FontVariant } from '../types/tag';

// In-memory cache for parsed opentype fonts
const fontCache = new Map<FontVariant, opentype.Font>();
const fontPromises = new Map<FontVariant, Promise<opentype.Font>>();

export interface HoleIslandInfo {
  cx: number;
  cy: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
}

/**
 * Load and parse Helvetica font
 */
export async function loadHelveticaFont(variant: FontVariant = 'regular'): Promise<opentype.Font> {
  if (fontCache.has(variant)) {
    return fontCache.get(variant)!;
  }

  if (fontPromises.has(variant)) {
    return fontPromises.get(variant)!;
  }

  const promise = (async () => {
    const filename = variant === 'bold' ? 'Helvetica-Bold.ttf' : 'Helvetica-Regular.ttf';
    const response = await fetch(`/fonts/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load font /fonts/${filename}: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    const font = opentype.parse(buffer);
    fontCache.set(variant, font);
    return font;
  })();

  fontPromises.set(variant, promise);
  return promise;
}

/**
 * Convert OpenType path commands to THREE.Shape array with proper hole topology
 */
export function opentypeCommandsToShapes(commands: opentype.PathCommand[]): {
  shapes: THREE.Shape[];
  holeIslands: HoleIslandInfo[];
  bounds: { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number };
} {
  interface Point {
    x: number;
    y: number;
  }

  const contours: Point[][] = [];
  let currentContour: Point[] = [];

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  function recordPoint(x: number, y: number) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  for (const cmd of commands) {
    if (cmd.type === 'M') {
      if (currentContour.length > 0) {
        contours.push(currentContour);
      }
      const y = -cmd.y; // Invert font Y to standard 3D upright Y
      currentContour = [{ x: cmd.x, y }];
      recordPoint(cmd.x, y);
    } else if (cmd.type === 'L') {
      const y = -cmd.y;
      currentContour.push({ x: cmd.x, y });
      recordPoint(cmd.x, y);
    } else if (cmd.type === 'Q') {
      const p0 = currentContour[currentContour.length - 1];
      const p1 = { x: cmd.x1, y: -cmd.y1 };
      const p2 = { x: cmd.x, y: -cmd.y };
      const steps = 6;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const mt = 1 - t;
        const x = mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x;
        const y = mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y;
        currentContour.push({ x, y });
        recordPoint(x, y);
      }
    } else if (cmd.type === 'C') {
      const p0 = currentContour[currentContour.length - 1];
      const p1 = { x: cmd.x1, y: -cmd.y1 };
      const p2 = { x: cmd.x2, y: -cmd.y2 };
      const p3 = { x: cmd.x, y: -cmd.y };
      const steps = 8;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const mt = 1 - t;
        const x = mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x;
        const y = mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y;
        currentContour.push({ x, y });
        recordPoint(x, y);
      }
    } else if (cmd.type === 'Z') {
      // Loop closure
    }
  }

  if (currentContour.length > 0) {
    contours.push(currentContour);
  }

  if (contours.length === 0) {
    return {
      shapes: [],
      holeIslands: [],
      bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 },
    };
  }

  // Calculate signed polygon area
  function polygonArea(pts: Point[]): number {
    let a = 0;
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      a += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
    }
    return a / 2;
  }

  // Point in polygon test
  function pointInPoly(pt: Point, poly: Point[]): boolean {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x;
      const yi = poly[i].y;
      const xj = poly[j].x;
      const yj = poly[j].y;
      const intersect = yi > pt.y !== yj > pt.y && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // Sort contours by area descending so outer contours come before holes
  const items = contours
    .map((c) => ({
      pts: c,
      area: Math.abs(polygonArea(c)),
      isHole: false,
      parentIdx: -1,
    }))
    .filter((item) => item.pts.length >= 3 && item.area > 0.001)
    .sort((a, b) => b.area - a.area);

  // Determine containment hierarchy
  for (let i = 0; i < items.length; i++) {
    const pts = items[i].pts;
    const testPt = {
      x: (pts[0].x + pts[Math.floor(pts.length / 2)].x) / 2,
      y: (pts[0].y + pts[Math.floor(pts.length / 2)].y) / 2,
    };

    let parent = -1;
    for (let j = i - 1; j >= 0; j--) {
      if (pointInPoly(testPt, items[j].pts)) {
        parent = j;
        break;
      }
    }

    if (parent !== -1) {
      items[i].parentIdx = parent;
      // If parent is a hole, then this is an island inside a hole (outer again)
      items[i].isHole = !items[parent].isHole;
    }
  }

  const shapes: THREE.Shape[] = [];
  const mapIdxToShape = new Map<number, THREE.Shape>();
  const holeIslands: HoleIslandInfo[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.isHole) {
      const shape = new THREE.Shape();
      shape.moveTo(item.pts[0].x, item.pts[0].y);
      for (let k = 1; k < item.pts.length; k++) {
        shape.lineTo(item.pts[k].x, item.pts[k].y);
      }
      shape.closePath();
      shapes.push(shape);
      mapIdxToShape.set(i, shape);
    } else {
      const parentShape = mapIdxToShape.get(item.parentIdx);
      if (parentShape) {
        const holePath = new THREE.Path();
        holePath.moveTo(item.pts[0].x, item.pts[0].y);
        for (let k = 1; k < item.pts.length; k++) {
          holePath.lineTo(item.pts[k].x, item.pts[k].y);
        }
        holePath.closePath();
        parentShape.holes.push(holePath);

        // Calculate hole island bounds and centroid for stencil bridging
        let hminX = Infinity, hmaxX = -Infinity, hminY = Infinity, hmaxY = -Infinity;
        for (const pt of item.pts) {
          if (pt.x < hminX) hminX = pt.x;
          if (pt.x > hmaxX) hmaxX = pt.x;
          if (pt.y < hminY) hminY = pt.y;
          if (pt.y > hmaxY) hmaxY = pt.y;
        }
        holeIslands.push({
          cx: (hminX + hmaxX) / 2,
          cy: (hminY + hmaxY) / 2,
          minX: hminX,
          maxX: hmaxX,
          minY: hminY,
          maxY: hmaxY,
          width: hmaxX - hminX,
          height: hmaxY - hminY,
        });
      }
    }
  }

  const width = Math.max(0.1, Number.isFinite(maxX - minX) ? maxX - minX : 0);
  const height = Math.max(0.1, Number.isFinite(maxY - minY) ? maxY - minY : 0);

  return {
    shapes,
    holeIslands,
    bounds: {
      minX: Number.isFinite(minX) ? minX : 0,
      maxX: Number.isFinite(maxX) ? maxX : 0,
      minY: Number.isFinite(minY) ? minY : 0,
      maxY: Number.isFinite(maxY) ? maxY : 0,
      width,
      height,
    },
  };
}

/**
 * Translate OpenType path commands in 3D millimeters space
 */
function translateCommands(commands: opentype.PathCommand[], dx: number, dy: number): opentype.PathCommand[] {
  return commands.map((cmd) => {
    const c = { ...cmd } as opentype.PathCommand;
    if ('x' in c && typeof (c as any).x === 'number') (c as any).x += dx;
    if ('y' in c && typeof (c as any).y === 'number') (c as any).y -= dy; // Inverted font Y to standard 3D Y
    if ('x1' in c && typeof (c as any).x1 === 'number') (c as any).x1 += dx;
    if ('y1' in c && typeof (c as any).y1 === 'number') (c as any).y1 -= dy;
    if ('x2' in c && typeof (c as any).x2 === 'number') (c as any).x2 += dx;
    if ('y2' in c && typeof (c as any).y2 === 'number') (c as any).y2 -= dy;
    return c;
  });
}

function getLineCommandsAndBounds(
  font: opentype.Font,
  text: string,
  fontSize: number,
  letterSpacing: number
): {
  commands: opentype.PathCommand[];
  bounds: { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number };
} {
  const commands: opentype.PathCommand[] = [];
  let cursorX = 0;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const glyph = font.charToGlyph(char);
    const glyphPath = glyph.getPath(cursorX, 0, fontSize);

    for (const cmd of glyphPath.commands) {
      commands.push(cmd);
      if ('x' in cmd && typeof cmd.x === 'number') {
        const x = cmd.x;
        const y = -cmd.y; // Standard 3D upright Y
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }

    const glyphAdvance = (glyph.advanceWidth ? glyph.advanceWidth / font.unitsPerEm : 0.6) * fontSize;
    cursorX += glyphAdvance + letterSpacing;
  }

  if (!Number.isFinite(minX)) {
    minX = 0;
    maxX = 0;
    minY = 0;
    maxY = 0;
  }

  return {
    commands,
    bounds: {
      minX,
      maxX,
      minY,
      maxY,
      width: Math.max(0.01, maxX - minX),
      height: Math.max(0.01, maxY - minY),
    },
  };
}

export interface MultiLineTextOptions {
  text1: string;
  fontSize1: number;
  text2?: string;
  fontSize2?: number;
  hasSecondLine?: boolean;
  letterSpacing?: number;
  lineSpacing?: number;
}

/**
 * Generate 3D shapes from text with support for single or dual lines
 * with independent font sizes and configurable vertical line spacing.
 */
export function generateMultiLineTextShapes(
  font: opentype.Font,
  opts: MultiLineTextOptions
): {
  shapes: THREE.Shape[];
  holeIslands: HoleIslandInfo[];
  bounds: { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number };
  rawCenterX: number;
  rawCenterY: number;
} {
  const t1 = opts.text1 ? opts.text1.trim() : '';
  const hasLine2 = !!opts.hasSecondLine && !!opts.text2 && opts.text2.trim().length > 0;
  const t2 = hasLine2 ? opts.text2!.trim() : '';
  const lSpacing = opts.letterSpacing || 0;

  if (t1.length === 0 && (!hasLine2 || t2.length === 0)) {
    return {
      shapes: [],
      holeIslands: [],
      bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 },
      rawCenterX: 0,
      rawCenterY: 0,
    };
  }

  // 1. Process Line 1
  const line1Res = t1.length > 0 ? getLineCommandsAndBounds(font, t1, opts.fontSize1, lSpacing) : null;

  // 2. Process Line 2 if active
  const line2Res = hasLine2 && t2.length > 0 ? getLineCommandsAndBounds(font, t2, opts.fontSize2 || opts.fontSize1, lSpacing) : null;

  const allCommands: opentype.PathCommand[] = [];

  if (line1Res && line2Res) {
    const b1 = line1Res.bounds;
    const b2 = line2Res.bounds;
    const gap = Math.max(0.5, opts.lineSpacing ?? 2.0);

    // Center each line horizontally
    const cx1 = (b1.minX + b1.maxX) / 2;
    const cx2 = (b2.minX + b2.maxX) / 2;
    const dx1 = -cx1;
    const dx2 = -cx2;

    // Stack Line 1 on top, Line 2 below, separated by gap, and centered vertically at 0
    let dy1 = gap / 2 - b1.minY;
    let dy2 = -gap / 2 - b2.maxY;
    const yOffset = (b1.height - b2.height) / 2;
    dy1 -= yOffset;
    dy2 -= yOffset;

    allCommands.push(...translateCommands(line1Res.commands, dx1, dy1));
    allCommands.push(...translateCommands(line2Res.commands, dx2, dy2));
  } else if (line1Res) {
    const b1 = line1Res.bounds;
    const cx1 = (b1.minX + b1.maxX) / 2;
    const cy1 = (b1.minY + b1.maxY) / 2;
    allCommands.push(...translateCommands(line1Res.commands, -cx1, -cy1));
  } else if (line2Res) {
    const b2 = line2Res.bounds;
    const cx2 = (b2.minX + b2.maxX) / 2;
    const cy2 = (b2.minY + b2.maxY) / 2;
    allCommands.push(...translateCommands(line2Res.commands, -cx2, -cy2));
  }

  const { shapes, holeIslands, bounds } = opentypeCommandsToShapes(allCommands);

  return {
    shapes,
    holeIslands,
    bounds,
    rawCenterX: (bounds.minX + bounds.maxX) / 2,
    rawCenterY: (bounds.minY + bounds.maxY) / 2,
  };
}

/**
 * Backward compatibility wrapper for single line
 */
export function generateTextShapes(
  font: opentype.Font,
  text: string,
  fontSize: number,
  letterSpacing: number = 0
) {
  return generateMultiLineTextShapes(font, {
    text1: text,
    fontSize1: fontSize,
    letterSpacing,
  });
}
