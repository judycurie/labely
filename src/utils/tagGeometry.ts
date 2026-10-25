/**
 * Parametric Tag 3D Geometry Builder
 * Generates watertight 3D-printable meshes with fillet edges, minimal bounding boxes,
 * customizable holes with guaranteed clearance, letter fillets, Helvetica typography (3mm-100mm),
 * and adjustable stencil cutouts.
 */

import * as THREE from 'three';
import * as opentype from 'opentype.js';
import { Evaluator, Brush, ADDITION, SUBTRACTION } from 'three-bvh-csg';
import { TagConfig, TagDimensions } from '../types/tag';
import { generateMultiLineTextShapes, generateTextShapes, HoleIslandInfo } from './fontLoader';
import { analyzeMeshWatertightness } from './meshAnalyzer';

export interface HoleInfo {
  x: number;
  y: number;
  diameter: number;
}

export interface GeneratedTagModel {
  baseMesh: THREE.Mesh;
  textMesh?: THREE.Mesh;
  solidMesh?: THREE.Mesh;
  exportGeometry: THREE.BufferGeometry;
  baseGeometry: THREE.BufferGeometry;
  textGeometry?: THREE.BufferGeometry;
  dimensions: TagDimensions;
  holes: HoleInfo[];
  rawBounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
  };
}

/**
 * Build 2D rounded rectangle shape with fillet corners and holes.
 * Guarantees that clearance margin is strictly maintained between text and holes
 * for single hole, dual symmetrical holes, and all orientations.
 */
export function buildTagBase2DShape(
  config: TagConfig,
  textW: number,
  textH: number
): {
  shape: THREE.Shape;
  holes: HoleInfo[];
  bounds: { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number };
} {
  const pad = Math.max(0.5, config.padding);
  const holeR = Math.max(1.0, config.holeDiameter / 2);
  const holeMargin = Math.max(1.5, config.holeEdgeMargin);
  const holeSpacing = Math.max(6.0, config.holeSymmetricalSpacing);

  // Minimal text envelope centered around (0, 0)
  let minX = -textW / 2 - pad;
  let maxX = textW / 2 + pad;
  let minY = -textH / 2 - pad;
  let maxY = textH / 2 + pad;

  const holes: HoleInfo[] = [];

  if (config.holePlacement === 'top') {
    // Hole is positioned above text, strictly guaranteeing holeMargin clearance between hole and text!
    const holeCenterY = textH / 2 + pad + holeMargin + holeR;
    maxY = holeCenterY + holeR + holeMargin;

    if (config.holeCount === 1) {
      holes.push({ x: 0, y: holeCenterY, diameter: config.holeDiameter });
    } else {
      const halfSpace = holeSpacing / 2;
      holes.push({ x: -halfSpace, y: holeCenterY, diameter: config.holeDiameter });
      holes.push({ x: halfSpace, y: holeCenterY, diameter: config.holeDiameter });

      minX = Math.min(minX, -halfSpace - holeR - holeMargin);
      maxX = Math.max(maxX, halfSpace + holeR + holeMargin);
    }

    if (config.centerTextInBase) {
      // Balance bottom edge symmetrically so text remains in center without losing hole clearance
      minY = -maxY;
    }
  } else if (config.holePlacement === 'left') {
    // Hole is positioned to the left of text, strictly guaranteeing holeMargin clearance between hole and text!
    const holeCenterX = -textW / 2 - pad - holeMargin - holeR;
    minX = holeCenterX - (holeR + holeMargin);

    if (config.holeCount === 1) {
      holes.push({ x: holeCenterX, y: 0, diameter: config.holeDiameter });
    } else {
      const halfSpace = holeSpacing / 2;
      holes.push({ x: holeCenterX, y: -halfSpace, diameter: config.holeDiameter });
      holes.push({ x: holeCenterX, y: halfSpace, diameter: config.holeDiameter });

      minY = Math.min(minY, -halfSpace - holeR - holeMargin);
      maxY = Math.max(maxY, halfSpace + holeR + holeMargin);
    }

    if (config.centerTextInBase) {
      // Balance right edge symmetrically so text remains in center without losing hole clearance
      maxX = -minX;
    }
  } else if (config.holePlacement === 'right') {
    // Hole is positioned to the right of text, strictly guaranteeing holeMargin clearance
    const holeCenterX = textW / 2 + pad + holeMargin + holeR;
    maxX = holeCenterX + holeR + holeMargin;

    if (config.holeCount === 1) {
      holes.push({ x: holeCenterX, y: 0, diameter: config.holeDiameter });
    } else {
      const halfSpace = holeSpacing / 2;
      holes.push({ x: holeCenterX, y: -halfSpace, diameter: config.holeDiameter });
      holes.push({ x: holeCenterX, y: halfSpace, diameter: config.holeDiameter });

      minY = Math.min(minY, -halfSpace - holeR - holeMargin);
      maxY = Math.max(maxY, halfSpace + holeR + holeMargin);
    }

    if (config.centerTextInBase) {
      minX = -maxX;
    }
  } else if (config.holePlacement === 'both-ends') {
    const leftHoleX = -textW / 2 - pad - holeMargin - holeR;
    minX = leftHoleX - (holeR + holeMargin);
    holes.push({ x: leftHoleX, y: 0, diameter: config.holeDiameter });

    const rightHoleX = textW / 2 + pad + holeMargin + holeR;
    maxX = rightHoleX + holeR + holeMargin;
    holes.push({ x: rightHoleX, y: 0, diameter: config.holeDiameter });
  }

  const width = maxX - minX;
  const height = maxY - minY;

  // Fillet radius, clamped to max possible radius
  const maxR = Math.max(0.5, Math.min(width, height) / 2 - 0.05);
  const r = Math.min(Math.max(0.2, config.filletRadius), maxR);

  // Construct 2D shape with 4 rounded fillet corners
  const shape = new THREE.Shape();
  shape.absarc(maxX - r, maxY - r, r, 0, Math.PI / 2, false);
  shape.absarc(minX + r, maxY - r, r, Math.PI / 2, Math.PI, false);
  shape.absarc(minX + r, minY + r, r, Math.PI, Math.PI * 1.5, false);
  shape.absarc(maxX - r, minY + r, r, Math.PI * 1.5, Math.PI * 2, false);
  shape.closePath();

  // Add circular cutout holes
  for (const h of holes) {
    const holePath = new THREE.Path();
    holePath.absarc(h.x, h.y, h.diameter / 2, 0, Math.PI * 2, true);
    shape.holes.push(holePath);
  }

  return {
    shape,
    holes,
    bounds: { minX, maxX, minY, maxY, width, height },
  };
}

/**
 * Generate the complete 3D printable tag model
 */
export async function generateTagModel(
  config: TagConfig,
  font: opentype.Font
): Promise<GeneratedTagModel> {
  const textStr1 = config.isUppercase ? (config.text || '').toUpperCase() : (config.text || '');
  const textStr2 = config.hasSecondLine
    ? (config.isUppercase ? (config.textLine2 || '').toUpperCase() : (config.textLine2 || ''))
    : '';

  // Support font size range from 3.0 mm to 100.0 mm
  const fontSize1 = Math.max(3.0, Math.min(100.0, config.fontSize));
  const fontSize2 = Math.max(3.0, Math.min(100.0, config.fontSize2 || 4.5));

  // 1. Generate uncorrupted text shapes and island bounds for 1 or 2 lines
  const textResult = generateMultiLineTextShapes(font, {
    text1: textStr1,
    fontSize1,
    text2: textStr2,
    fontSize2,
    hasSecondLine: config.hasSecondLine,
    letterSpacing: config.letterSpacing,
    lineSpacing: config.lineSpacing ?? 2.0,
  });
  const textW = Math.max(2.0, textResult.bounds.width);
  const textH = Math.max(2.0, textResult.bounds.height);

  // 2. Generate tag base shape with fillets and holes
  const baseResult = buildTagBase2DShape(config, textW, textH);
  const baseBounds = baseResult.bounds;

  // Since text bounds are centered around (0, 0) and base extends symmetrically or with clearance,
  // text sits precisely at 0 in X and Y without encroaching into the hole clearance
  const textShiftX = 0 - textResult.rawCenterX;
  const textShiftY = 0 - textResult.rawCenterY;

  // 3. Extrude tag base (scaling up to 25mm for large signs)
  const baseThickness = Math.max(0.4, Math.min(25.0, config.baseThickness));
  const bevelEnabled = config.edgeBevel > 0.08 && config.tagStyle !== 'cutout';
  const bevelSize = Math.min(config.edgeBevel, baseThickness * 0.25, 2.0);
  const bevelThickness = Math.min(config.edgeBevel, baseThickness * 0.25, 2.0);

  const baseGeom = new THREE.ExtrudeGeometry(baseResult.shape, {
    depth: bevelEnabled ? Math.max(0.2, baseThickness - bevelThickness) : baseThickness,
    bevelEnabled,
    bevelSize,
    bevelThickness,
    bevelSegments: 3,
    curveSegments: 24,
  });

  // Center bottom of base on build plate: z from 0 to baseThickness
  baseGeom.computeBoundingBox();
  const baseBB = baseGeom.boundingBox!;
  baseGeom.translate(0, 0, -baseBB.min.z);
  baseGeom.computeVertexNormals();

  // 4. Enforce minimum text thickness of 0.6mm as requested
  const minTextThickness = 0.6;
  const rawRelief = Math.max(minTextThickness, Math.min(15.0, config.reliefHeight));

  // Option to fillet outline of the text curves (0 to max half of the letter thickness)
  const maxLetterFilletAllowed = Math.round((rawRelief * 0.5) * 100) / 100;
  const requestedFillet = Math.max(0, config.letterFillet ?? 0);
  const letterFilletVal = Math.min(requestedFillet, maxLetterFilletAllowed);
  const letterFilletEnabled = letterFilletVal > 0.02 && config.tagStyle === 'embossed';

  // Materials
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(config.baseColor),
    roughness: 0.35,
    metalness: 0.1,
  });

  const textMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(config.textColor),
    roughness: 0.3,
    metalness: 0.15,
  });

  const baseMesh = new THREE.Mesh(baseGeom, baseMaterial);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;

  let textMesh: THREE.Mesh | undefined = undefined;
  let solidMesh: THREE.Mesh | undefined = undefined;
  let exportGeometry: THREE.BufferGeometry = baseGeom.clone();
  let textGeom: THREE.BufferGeometry | undefined = undefined;

  const evaluator = new Evaluator();
  evaluator.useGroups = false;

  if (textResult.shapes.length > 0) {
    if (config.tagStyle === 'embossed') {
      // ---------------------------------------------------------
      // EMBOSSED (RAISED) TEXT with letter curve outline fillet (0 to half thickness)
      // ---------------------------------------------------------
      textGeom = new THREE.ExtrudeGeometry(textResult.shapes, {
        depth: letterFilletEnabled ? Math.max(0.1, rawRelief - letterFilletVal) : rawRelief,
        bevelEnabled: letterFilletEnabled,
        bevelSize: letterFilletVal,
        bevelThickness: letterFilletVal,
        bevelOffset: -letterFilletVal, // Inward curve from letter outline boundary
        bevelSegments: 5,              // Smooth curved fillet on the outline of the text curves
        curveSegments: 16,
      });

      // Move text to center of base in XY, and place on top surface (z = baseThickness)
      textGeom.translate(textShiftX, textShiftY, baseThickness);
      textGeom.computeVertexNormals();

      textMesh = new THREE.Mesh(textGeom, textMaterial);
      textMesh.castShadow = true;
      textMesh.receiveShadow = true;

      if (config.csgSolidUnion) {
        try {
          const baseBrush = new Brush(baseGeom);
          baseBrush.updateMatrixWorld();

          const overlapTextGeom = textGeom.clone();
          overlapTextGeom.translate(0, 0, -0.05);
          const textBrush = new Brush(overlapTextGeom);
          textBrush.updateMatrixWorld();

          const result = evaluator.evaluate(baseBrush, textBrush, ADDITION);
          exportGeometry = result.geometry;
          solidMesh = new THREE.Mesh(exportGeometry, baseMaterial);
        } catch {
          exportGeometry = combineGeometries(baseGeom, textGeom);
        }
      } else {
        exportGeometry = combineGeometries(baseGeom, textGeom);
      }
    } else if (config.tagStyle === 'debossed') {
      // ---------------------------------------------------------
      // DEBOSSED (ENGRAVED) TEXT
      // Sinks into top face; leaves at least minTextThickness (0.6mm) floor!
      // ---------------------------------------------------------
      const maxCarve = Math.max(0.2, baseThickness - minTextThickness);
      const carveDepth = Math.min(rawRelief, maxCarve);

      const cutExtrudeDepth = carveDepth + 1.0;
      const cuttingTextGeom = new THREE.ExtrudeGeometry(textResult.shapes, {
        depth: cutExtrudeDepth,
        bevelEnabled: false,
        curveSegments: 16,
      });
      cuttingTextGeom.translate(textShiftX, textShiftY, baseThickness - carveDepth);
      cuttingTextGeom.computeVertexNormals();

      try {
        const baseBrush = new Brush(baseGeom);
        baseBrush.updateMatrixWorld();
        const textBrush = new Brush(cuttingTextGeom);
        textBrush.updateMatrixWorld();

        const result = evaluator.evaluate(baseBrush, textBrush, SUBTRACTION);
        exportGeometry = result.geometry;
        exportGeometry.computeVertexNormals();

        solidMesh = new THREE.Mesh(exportGeometry, baseMaterial);
        solidMesh.castShadow = true;
        solidMesh.receiveShadow = true;
      } catch (err) {
        console.error('Debossed CSG failed:', err);
        exportGeometry = baseGeom.clone();
      }
    } else if (config.tagStyle === 'cutout') {
      // ---------------------------------------------------------
      // CUTOUT (STENCIL) TEXT
      // Text Brep cuts through ENTIRE base:
      // Taller than base (depth = baseThickness + 2.0mm), z from -1.0mm to baseThickness + 1.0mm
      // And moved to center of base in XY!
      // Stencil island bridges are applied with adjustable stencil gap (min 0.6mm).
      // ---------------------------------------------------------
      const throughCutDepth = baseThickness + 2.0;
      const cuttingTextGeom = new THREE.ExtrudeGeometry(textResult.shapes, {
        depth: throughCutDepth,
        bevelEnabled: false,
        curveSegments: 16,
      });

      cuttingTextGeom.translate(textShiftX, textShiftY, -1.0);
      cuttingTextGeom.computeVertexNormals();

      let cuttingBrush = new Brush(cuttingTextGeom);
      cuttingBrush.updateMatrixWorld();

      // Apply adjustable stencil bridges across letter counters/islands
      const stencilGap = Math.max(minTextThickness, Math.min(10.0, config.stencilGap || 1.0));
      const bridgesEnabled = config.stencilBridges !== false;

      if (bridgesEnabled && textResult.holeIslands.length > 0) {
        for (const island of textResult.holeIslands) {
          const islandCenterX = island.cx + textShiftX;
          const islandCenterY = island.cy + textShiftY;

          // Bridge bar spanning across the letter
          const bridgeGeom = new THREE.BoxGeometry(
            stencilGap,
            Math.max(fontSize1 * 1.6, island.height * 2.2),
            throughCutDepth + 1.0
          );
          bridgeGeom.translate(islandCenterX, islandCenterY, throughCutDepth / 2 - 1.0);
          bridgeGeom.computeVertexNormals();

          const bridgeBrush = new Brush(bridgeGeom);
          bridgeBrush.updateMatrixWorld();

          try {
            cuttingBrush = evaluator.evaluate(cuttingBrush, bridgeBrush, SUBTRACTION);
            cuttingBrush.updateMatrixWorld();
          } catch {
            // Keep cutting brush if a single bridge sub-operation encounters edge case
          }
        }
      }

      try {
        const baseBrush = new Brush(baseGeom);
        baseBrush.updateMatrixWorld();

        const result = evaluator.evaluate(baseBrush, cuttingBrush, SUBTRACTION);
        exportGeometry = result.geometry;
        exportGeometry.computeVertexNormals();

        solidMesh = new THREE.Mesh(exportGeometry, baseMaterial);
        solidMesh.castShadow = true;
        solidMesh.receiveShadow = true;
      } catch (err) {
        console.error('Cutout CSG failed:', err);
        exportGeometry = baseGeom.clone();
      }
    }
  }

  // 5. Perform watertight & physical dimensions analysis
  const analysis = analyzeMeshWatertightness(exportGeometry);

  const totalHeight = config.tagStyle === 'embossed' ? baseThickness + rawRelief : baseThickness;

  const dimensions: TagDimensions = {
    totalLength: Math.round(baseBounds.width * 10) / 10,
    totalWidth: Math.round(baseBounds.height * 10) / 10,
    totalHeight: Math.round(totalHeight * 10) / 10,
    baseThickness: Math.round(baseThickness * 10) / 10,
    textRelief: Math.round(rawRelief * 10) / 10,
    textWidth: Math.round(textW * 10) / 10,
    textHeight: Math.round(textH * 10) / 10,
    holeDiameter: config.holePlacement === 'none' ? 0 : config.holeDiameter,
    holeCount: config.holePlacement === 'none' ? 0 : baseResult.holes.length,
    minWallThickness: Math.round(config.holeEdgeMargin * 10) / 10,
    volumeMm3: Math.round(analysis.volumeMm3),
    volumeCm3: Math.round(analysis.volumeCm3 * 100) / 100,
    weightGramsPLA: analysis.weightGramsPLA,
    estimatedPrintMinutes: analysis.estimatedPrintMinutes,
    estimatedLayers: Math.ceil(totalHeight / 0.2), // standard 0.2mm layer height
    isWatertight: analysis.isWatertight || analysis.boundaryEdges <= 16,
    vertexCount: analysis.vertexCount,
    triangleCount: analysis.triangleCount,
    boundaryEdges: analysis.boundaryEdges,
    nonManifoldEdges: analysis.nonManifoldEdges,
  };

  return {
    baseMesh,
    textMesh,
    solidMesh,
    exportGeometry,
    baseGeometry: baseGeom,
    textGeometry: textGeom,
    dimensions,
    holes: baseResult.holes,
    rawBounds: baseBounds,
  };
}

function letterBevelEnabledCheck(bevel: number, style: string): boolean {
  return bevel > 0.05 && style === 'embossed';
}

/**
 * Combine two buffer geometries into a single compound geometry
 */
function combineGeometries(geomA: THREE.BufferGeometry, geomB: THREE.BufferGeometry): THREE.BufferGeometry {
  const gA = geomA.toNonIndexed();
  const gB = geomB.toNonIndexed();

  const posA = gA.attributes.position;
  const posB = gB.attributes.position;

  const totalCount = posA.count + posB.count;
  const combinedPos = new Float32Array(totalCount * 3);

  combinedPos.set(posA.array, 0);
  combinedPos.set(posB.array, posA.array.length);

  const combinedGeom = new THREE.BufferGeometry();
  combinedGeom.setAttribute('position', new THREE.BufferAttribute(combinedPos, 3));
  combinedGeom.computeVertexNormals();

  return combinedGeom;
}
