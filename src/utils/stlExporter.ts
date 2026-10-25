/**
 * STL Exporter & Multi-Material 3D Print File Downloader
 */

import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import confetti from 'canvas-confetti';

export interface ExportOptions {
  filename?: string;
  binary?: boolean;
}

/**
 * Clean text to safe filename slug
 */
export function getSafeFilename(text: string, suffix: string = ''): string {
  const clean = text
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 24);
  return `tag_${clean || 'model'}${suffix}.stl`;
}

/**
 * Trigger celebratory confetti on successful export
 */
export function fireExportConfetti() {
  try {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#6366f1'],
    });
  } catch {
    // Non-critical visual effect
  }
}

/**
 * Export a Three.js BufferGeometry or Mesh as an STL file
 */
export function exportSTL(
  objectOrGeometry: THREE.Object3D | THREE.BufferGeometry,
  options: ExportOptions = {}
): void {
  const isBinary = options.binary !== false;
  const exporter = new STLExporter();

  let mesh: THREE.Mesh;
  if (objectOrGeometry instanceof THREE.BufferGeometry) {
    mesh = new THREE.Mesh(objectOrGeometry, new THREE.MeshBasicMaterial());
  } else if (objectOrGeometry instanceof THREE.Mesh) {
    mesh = objectOrGeometry;
  } else {
    // Group or Object3D
    const group = objectOrGeometry;
    const output = exporter.parse(group, { binary: isBinary });
    downloadBlob(output, options.filename || '3d_tag.stl', isBinary);
    fireExportConfetti();
    return;
  }

  const output = exporter.parse(mesh, { binary: isBinary });
  downloadBlob(output, options.filename || '3d_tag.stl', isBinary);
  fireExportConfetti();
}

/**
 * Helper to download ArrayBuffer or string as file
 */
function downloadBlob(data: any, filename: string, isBinary: boolean) {
  let blob: Blob;
  if (isBinary) {
    // STLExporter returns DataView for binary
    const buffer = data instanceof DataView ? data.buffer : data;
    blob = new Blob([buffer], { type: 'application/octet-stream' });
  } else {
    blob = new Blob([data], { type: 'text/plain' });
  }

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * Export separate STL files for multi-color 3D printing (Bambu AMS / Prusa MMU)
 */
export function exportMultiPartSTL(
  baseGeom: THREE.BufferGeometry,
  textGeom: THREE.BufferGeometry | undefined,
  baseFilename: string
): void {
  const exporter = new STLExporter();

  // 1. Export Base Plate
  const baseMesh = new THREE.Mesh(baseGeom, new THREE.MeshBasicMaterial());
  const baseOutput = exporter.parse(baseMesh, { binary: true });
  downloadBlob(baseOutput, `${baseFilename}_Base.stl`, true);

  // 2. Export Text Relief (if present)
  if (textGeom) {
    setTimeout(() => {
      const textMesh = new THREE.Mesh(textGeom, new THREE.MeshBasicMaterial());
      const textOutput = exporter.parse(textMesh, { binary: true });
      downloadBlob(textOutput, `${baseFilename}_Text.stl`, true);
      fireExportConfetti();
    }, 400);
  } else {
    fireExportConfetti();
  }
}
