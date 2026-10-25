/**
 * TagForge 3D - Types and Interfaces
 */

export type HolePlacement = 'none' | 'top' | 'left' | 'right' | 'both-ends';
export type TagStyle = 'embossed' | 'debossed' | 'cutout';
export type FontVariant = 'regular' | 'bold';
export type AppTheme = 'light' | 'dark';

export interface TagConfig {
  // Typography - Line 1
  text: string;
  fontSize: number;          // 3 mm to 100 mm (from small key tags to large signs)
  fontVariant: FontVariant;  // Helvetica Regular or Bold
  letterSpacing: number;     // 0 to 10 mm
  letterFillet: number;      // 0 to max half of letter thickness (reliefHeight / 2)
  isUppercase: boolean;

  // Typography - Line 2 (Optional)
  hasSecondLine: boolean;
  textLine2: string;
  fontSize2: number;         // 3 mm to 100 mm
  lineSpacing: number;       // 0.5 mm to 20 mm vertical gap between lines

  // Base Geometry & Fillets
  baseThickness: number;     // 0.4 mm to 25.0 mm (scaled with font size)
  padding: number;           // minimal bounding box margin around text (1 to 60 mm)
  filletRadius: number;      // fillet edges radius (0.5 to 60 mm)
  edgeBevel: number;         // 0 to 5.0 mm top-edge tactile bevel

  // Holes
  holePlacement: HolePlacement; // 'top' | 'left' | 'right' | 'both-ends' | 'none'
  holeCount: 1 | 2;             // 1 or 2 symmetrical holes
  holeDiameter: number;         // 2.0 mm to 30.0 mm
  holeEdgeMargin: number;       // distance from edge to hole center & text clearance
  holeSymmetricalSpacing: number; // distance between 2 symmetrical holes (8 to 300 mm)

  // 3D Tag Style & Relief
  tagStyle: TagStyle;        // 'embossed' (raised) | 'debossed' (engraved) | 'cutout' (stencil)
  reliefHeight: number;      // text relief height/depth (min 0.6 mm, up to 10.0 mm)
  stencilGap: number;        // adjustable stencil island bridge width (0.6 mm to 10.0 mm)
  stencilBridges: boolean;   // enable stencil bridges so island letters (O, A, B, etc.) don't drop out
  centerTextInBase: boolean; // center text in the whole tag base including hole margins
  csgSolidUnion: boolean;    // Single watertight manifold CSG boolean union

  // Visual & Rendering
  baseColor: string;
  textColor: string;
  showDimensions3D: boolean; // 3D caliper measurement lines in viewport
  showBuildPlate: boolean;   // 3D printer bed preview grid
}

export interface TagDimensions {
  totalLength: number;       // X dimension in mm
  totalWidth: number;        // Y dimension in mm
  totalHeight: number;       // Z dimension in mm
  baseThickness: number;     // Z base in mm
  textRelief: number;        // Z text in mm
  textWidth: number;         // text bounding X in mm
  textHeight: number;        // text bounding Y in mm
  holeDiameter: number;      // mm
  holeCount: number;
  minWallThickness: number;  // minimum plastic wall around hole in mm
  volumeMm3: number;         // volume in mm^3
  volumeCm3: number;         // volume in cm^3
  weightGramsPLA: number;    // estimated weight in grams (PLA ~1.24 g/cm3)
  estimatedPrintMinutes: number; // estimated print time at 50mm/s
  estimatedLayers: number;   // at 0.2mm layer height
  isWatertight: boolean;     // 2-manifold closed solid
  vertexCount: number;
  triangleCount: number;
  boundaryEdges: number;
  nonManifoldEdges: number;
}

export interface TagPreset {
  id: string;
  name: string;
  description: string;
  config: Partial<TagConfig>;
}
