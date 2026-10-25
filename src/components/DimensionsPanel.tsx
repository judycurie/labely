/**
 * Detailed 3D Print Specifications & Engineering Dimensions Modal
 * Monochrome White-Grey-Black Styling with Theme Support
 */

import React from 'react';
import { TagDimensions, TagConfig, AppTheme } from '../types/tag';
import { 
  X, 
  Ruler, 
  Printer, 
  Scale, 
  Clock, 
  Layers, 
  Box, 
  ShieldCheck 
} from 'lucide-react';

interface DimensionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  dimensions: TagDimensions | null;
  config: TagConfig;
  theme: AppTheme;
}

export const DimensionsPanel: React.FC<DimensionsPanelProps> = ({
  isOpen,
  onClose,
  dimensions,
  config,
  theme,
}) => {
  if (!isOpen || !dimensions) return null;

  const isLight = theme === 'light';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm transition-colors duration-200 ${
        isLight ? 'bg-black/40' : 'bg-black/80'
      }`}
    >
      <div
        className={`rounded-t-3xl sm:rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col border-t sm:border max-h-[90vh] sm:max-h-[85vh] transition-colors duration-200 ${
          isLight
            ? 'bg-white border-zinc-300 text-zinc-900 shadow-zinc-400/30'
            : 'bg-zinc-900 border-zinc-800 text-zinc-100 shadow-black'
        }`}
      >
        {/* Mobile Drag Handle */}
        <div 
          onClick={onClose} 
          className="sm:hidden pt-3 pb-1 flex justify-center cursor-pointer active:opacity-60"
        >
          <div className={`w-10 h-1.5 rounded-full ${isLight ? 'bg-zinc-300' : 'bg-zinc-700'}`} />
        </div>

        {/* Header */}
        <div
          className={`px-4 sm:px-5 py-3 sm:py-4 border-b flex items-center justify-between transition-colors duration-200 ${
            isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950/60 border-zinc-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl border shrink-0 ${
                isLight ? 'bg-zinc-100 border-zinc-300 text-zinc-900' : 'bg-zinc-800 border-zinc-700 text-white'
              }`}
            >
              <Ruler className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold">3D Print Dimensions & Specs</h2>
              <p className={`text-[11px] ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Real-world millimeter slicing parameters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Specs Modal"
            className={`p-2 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
              isLight ? 'hover:bg-zinc-200 text-zinc-600' : 'hover:bg-zinc-800 text-zinc-400'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 space-y-4 sm:space-y-5 overflow-y-auto overscroll-contain">
          {/* Watertight Status Banner */}
          <div
            className={`rounded-xl p-3 sm:p-3.5 flex items-start sm:items-center gap-2.5 sm:gap-3 border ${
              isLight
                ? 'bg-zinc-100 border-zinc-300 text-zinc-900'
                : 'bg-zinc-950 border-zinc-800 text-zinc-100'
            }`}
          >
            <ShieldCheck className="w-5 h-5 shrink-0 opacity-80 mt-0.5 sm:mt-0" />
            <div>
              <div className="text-xs font-bold">
                {dimensions.isWatertight ? '100% Watertight 2-Manifold Mesh' : 'Watertight Geometry Ready'}
              </div>
              <div className={`text-[11px] leading-relaxed ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                Mesh is topologically closed and certified for direct slicing in Bambu Studio, Cura, PrusaSlicer, and OrcaSlicer without non-manifold repair warnings.
              </div>
            </div>
          </div>

          {/* Primary Outer Dimensions Grid */}
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
              Primary Bounding Dimensions (mm)
            </h3>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { label: 'Length (X)', val: dimensions.totalLength },
                { label: 'Width (Y)', val: dimensions.totalWidth },
                { label: 'Height (Z)', val: dimensions.totalHeight },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-xl p-2.5 sm:p-3 border text-center sm:text-left ${
                    isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950 border-zinc-800'
                  }`}
                >
                  <span className={`text-[10px] uppercase tracking-wider block font-semibold truncate ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {item.label}
                  </span>
                  <span className="text-base sm:text-lg font-mono font-bold">{item.val}</span>
                  <span className={`text-xs ml-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>mm</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Feature Metrics (Stacked on mobile, side-by-side on md:) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div
              className={`rounded-xl p-3 space-y-2 border ${
                isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950 border-zinc-800'
              }`}
            >
              <div className={`font-bold border-b pb-1 flex items-center gap-1.5 ${isLight ? 'border-zinc-200 text-zinc-900' : 'border-zinc-800 text-zinc-200'}`}>
                <Box className="w-3.5 h-3.5" />
                Geometry Breakdown
              </div>
              <div className={`flex justify-between ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                <span>Base Thickness:</span>
                <span className="font-mono font-semibold">{dimensions.baseThickness} mm</span>
              </div>
              <div className={`flex justify-between ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                <span>Text Relief / Depth:</span>
                <span className="font-mono font-semibold">
                  {config.tagStyle === 'cutout' ? `Cutout (Through ${dimensions.baseThickness}mm)` : `${dimensions.textRelief} mm`}
                </span>
              </div>
              {config.tagStyle === 'cutout' && (
                <div className={`flex justify-between ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  <span>Stencil Gap (Bridge):</span>
                  <span className="font-mono font-bold">{(config.stencilGap || 1.0).toFixed(1)} mm</span>
                </div>
              )}
              <div className={`flex justify-between ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                <span>Fillet Corner Radius:</span>
                <span className="font-mono font-semibold">{config.filletRadius} mm</span>
              </div>
              <div className={`flex justify-between ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                <span>Letter Outline Fillet:</span>
                <span className="font-mono font-semibold">
                  {(config.letterFillet || 0).toFixed(2)} mm (Max: {(dimensions.textRelief / 2).toFixed(2)}mm)
                </span>
              </div>
              <div className={`flex justify-between ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                <span>Typography Lines:</span>
                <span className="font-mono font-semibold">
                  {config.hasSecondLine ? `L1: ${config.fontSize}mm / L2: ${(config.fontSize2 || 4.5)}mm` : `1 Line (${config.fontSize}mm)`}
                </span>
              </div>
              <div className={`flex justify-between ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                <span>Text Bounding Box:</span>
                <span className="font-mono font-semibold">{dimensions.textWidth} × {dimensions.textHeight} mm</span>
              </div>
            </div>

            <div
              className={`rounded-xl p-3 space-y-2 border ${
                isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950 border-zinc-800'
              }`}
            >
              <div className={`font-bold border-b pb-1 flex items-center gap-1.5 ${isLight ? 'border-zinc-200 text-zinc-900' : 'border-zinc-800 text-zinc-200'}`}>
                <Ruler className="w-3.5 h-3.5" />
                Hole & Mounting Specs
              </div>
              <div className={`flex justify-between ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                <span>Hole Placement:</span>
                <span className="capitalize font-semibold">{config.holePlacement}</span>
              </div>
              <div className={`flex justify-between ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                <span>Hole Diameter:</span>
                <span className="font-mono font-semibold">
                  {dimensions.holeCount > 0 ? `Ø ${dimensions.holeDiameter} mm` : 'None'}
                </span>
              </div>
              <div className={`flex justify-between ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                <span>Hole Count:</span>
                <span className="font-mono font-semibold">{dimensions.holeCount}</span>
              </div>
              <div className={`flex justify-between ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                <span>Min Wall Thickness:</span>
                <span className="font-mono font-bold">{dimensions.minWallThickness} mm</span>
              </div>
            </div>
          </div>

          {/* Slicing & Print Estimates (2x2 on mobile, 4 columns on sm:) */}
          <div
            className={`rounded-xl p-3 sm:p-3.5 space-y-2.5 border ${
              isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950 border-zinc-800'
            }`}
          >
            <h4 className={`text-xs font-bold flex items-center gap-2 ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>
              <Printer className="w-4 h-4" />
              Estimated Slicer Print Metrics (PLA @ 0.2mm)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              {[
                { icon: Scale, label: 'Weight', val: `${dimensions.weightGramsPLA} g` },
                { icon: Box, label: 'Volume', val: `${dimensions.volumeCm3} cm³` },
                { icon: Layers, label: 'Layers', val: dimensions.estimatedLayers },
                { icon: Clock, label: 'Print Time', val: `~${dimensions.estimatedPrintMinutes}m` },
              ].map((col) => {
                const Icon = col.icon;
                return (
                  <div
                    key={col.label}
                    className={`p-2 rounded-lg border ${
                      isLight ? 'bg-white border-zinc-300' : 'bg-zinc-900 border-zinc-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 mx-auto mb-1 opacity-70" />
                    <span className={`text-[10px] block ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {col.label}
                    </span>
                    <span className="font-mono font-bold">{col.val}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-4 sm:px-5 py-3 border-t flex items-center justify-end pb-safe transition-colors duration-200 ${
            isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950/60 border-zinc-800'
          }`}
        >
          <button
            onClick={onClose}
            className={`w-full sm:w-auto px-5 py-2.5 sm:py-1.5 text-xs font-semibold rounded-xl sm:rounded-lg border transition-colors min-h-[44px] sm:min-h-0 flex items-center justify-center ${
              isLight
                ? 'bg-zinc-900 hover:bg-black text-white border-zinc-900'
                : 'bg-white hover:bg-zinc-100 text-zinc-950 border-white'
            }`}
          >
            Close Specs
          </button>
        </div>
      </div>
    </div>
  );
};
