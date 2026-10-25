/**
 * 3D Mesh Analyzer & Watertight 2-Manifold Validator for 3D Printing
 */

import * as THREE from 'three';

export interface MeshAnalysisResult {
  isWatertight: boolean;
  boundaryEdges: number;
  nonManifoldEdges: number;
  vertexCount: number;
  triangleCount: number;
  volumeMm3: number;
  volumeCm3: number;
  surfaceAreaMm2: number;
  weightGramsPLA: number;
  estimatedPrintMinutes: number;
  bounds: {
    x: number;
    y: number;
    z: number;
  };
}

/**
 * Validate topological 2-manifold watertightness of a Three.js BufferGeometry
 */
export function analyzeMeshWatertightness(geometry: THREE.BufferGeometry): MeshAnalysisResult {
  const pos = geometry.attributes.position;
  if (!pos || pos.count === 0) {
    return {
      isWatertight: false,
      boundaryEdges: 0,
      nonManifoldEdges: 0,
      vertexCount: 0,
      triangleCount: 0,
      volumeMm3: 0,
      volumeCm3: 0,
      surfaceAreaMm2: 0,
      weightGramsPLA: 0,
      estimatedPrintMinutes: 0,
      bounds: { x: 0, y: 0, z: 0 },
    };
  }

  // Ensure bounding box is computed
  if (!geometry.boundingBox) {
    geometry.computeBoundingBox();
  }
  const bb = geometry.boundingBox!;
  const bounds = {
    x: Math.max(0, bb.max.x - bb.min.x),
    y: Math.max(0, bb.max.y - bb.min.y),
    z: Math.max(0, bb.max.z - bb.min.z),
  };

  // Quantize spatial coordinates to 0.001mm tolerance to detect identical spatial vertices
  const spatialKey = (i: number): string => {
    const x = Math.round(pos.getX(i) * 1000);
    const y = Math.round(pos.getY(i) * 1000);
    const z = Math.round(pos.getZ(i) * 1000);
    return `${x},${y},${z}`;
  };

  const edgeMap = new Map<string, number>();
  let totalTriangles = 0;
  let signedVolume = 0;
  let surfaceArea = 0;

  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();
  const cross = new THREE.Vector3();
  const edge1 = new THREE.Vector3();
  const edge2 = new THREE.Vector3();

  const isIndexed = geometry.index !== null;
  const index = geometry.index;
  const loopCount = isIndexed ? index!.count : pos.count;

  for (let i = 0; i < loopCount; i += 3) {
    const idx0 = isIndexed ? index!.getX(i) : i;
    const idx1 = isIndexed ? index!.getX(i + 1) : i + 1;
    const idx2 = isIndexed ? index!.getX(i + 2) : i + 2;

    totalTriangles++;

    // Read spatial vertices
    vA.fromBufferAttribute(pos, idx0);
    vB.fromBufferAttribute(pos, idx1);
    vC.fromBufferAttribute(pos, idx2);

    // Calculate triangle area
    edge1.subVectors(vB, vA);
    edge2.subVectors(vC, vA);
    cross.crossVectors(edge1, edge2);
    surfaceArea += cross.length() * 0.5;

    // Calculate signed tetrahedron volume (Divergence theorem for closed polyhedra)
    signedVolume += vA.dot(cross) / 6.0;

    // Track undirected edges for 2-manifold verification
    const k0 = spatialKey(idx0);
    const k1 = spatialKey(idx1);
    const k2 = spatialKey(idx2);

    const edges = [
      k0 < k1 ? `${k0}|${k1}` : `${k1}|${k0}`,
      k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`,
      k2 < k0 ? `${k2}|${k0}` : `${k0}|${k2}`,
    ];

    for (const e of edges) {
      edgeMap.set(e, (edgeMap.get(e) || 0) + 1);
    }
  }

  let boundaryEdges = 0;
  let nonManifoldEdges = 0;

  for (const count of edgeMap.values()) {
    if (count === 1) {
      boundaryEdges++;
    } else if (count > 2) {
      nonManifoldEdges++;
    }
  }

  const isWatertight = boundaryEdges === 0 && nonManifoldEdges === 0 && totalTriangles > 0;
  const volumeMm3 = Math.max(0, Math.abs(signedVolume));
  const volumeCm3 = volumeMm3 / 1000;

  // PLA density is approximately 1.24 g/cm3; at ~100% infill for thin tags
  const weightGramsPLA = volumeCm3 * 1.24;

  // Typical FDM 3D printing speed (50mm/s, standard acceleration, skirt & perimeters)
  // Usually around 0.5 - 1.5 cm3 per 5-10 minutes
  const estimatedPrintMinutes = Math.max(3, Math.round(3 + volumeCm3 * 3.5));

  return {
    isWatertight,
    boundaryEdges,
    nonManifoldEdges,
    vertexCount: pos.count,
    triangleCount: totalTriangles,
    volumeMm3,
    volumeCm3,
    surfaceAreaMm2: surfaceArea,
    weightGramsPLA: Math.round(weightGramsPLA * 100) / 100,
    estimatedPrintMinutes,
    bounds,
  };
}
