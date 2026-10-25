/**
 * Top Navigation Header with White-Grey-Black Monochrome Styling,
 * Mobile-First Responsive Layout, and Clean Touch Targets
 */

import React, { useState } from 'react';
import { TagConfig, TagDimensions, AppTheme } from '../types/tag';
import { TAG_PRESETS } from '../utils/presets';
import { 
  Download, 
  Ruler, 
  Grid3X3, 
  Sparkles, 
  ChevronDown, 
  Layers, 
  ShieldCheck,
  Sun,
  Moon,
  SlidersHorizontal,
  FileCode,
  Info
} from 'lucide-react';

interface TopHeaderProps {
  config: TagConfig;
  dimensions: TagDimensions | null;
  theme: AppTheme;
  onToggleTheme: () => void;
  onUpdateConfig: (partial: Partial<TagConfig>) => void;
  onExportSTL: (binary: boolean) => void;
  onExportMultiPart: () => void;
  onOpenSpecsModal: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  config,
  dimensions,
  theme,
  onToggleTheme,
  onUpdateConfig,
  onExportSTL,
  onExportMultiPart,
  onOpenSpecsModal,
}) => {
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showMobileTools, setShowMobileTools] = useState(false);

  const isLight = theme === 'light';

  const applyPreset = (presetId: string) => {
    const found = TAG_PRESETS.find((p) => p.id === presetId);
    if (found) {
      onUpdateConfig(found.config);
    }
    setShowPresetsMenu(false);
    setShowMobileTools(false);
  };

  return (
    <header
      className={`h-14 px-3 sm:px-4 flex items-center justify-between z-40 select-none border-b transition-colors duration-200 ${
        isLight
          ? 'bg-white border-zinc-200 text-zinc-900'
          : 'bg-zinc-950 border-zinc-800 text-zinc-100'
      }`}
    >
      {/* Brand & Title (Left Zone) */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs tracking-wider transition-colors shrink-0 ${
            isLight
              ? 'bg-zinc-900 text-white shadow-sm'
              : 'bg-white text-zinc-950 shadow-md'
          }`}
        >
          3D
        </div>
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className={`text-sm font-semibold tracking-tight whitespace-nowrap ${isLight ? 'text-zinc-950' : 'text-zinc-100'}`}>
              TagForge 3D
            </h1>
            <span
              className={`hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded font-medium border ${
                isLight
                  ? 'bg-zinc-100 text-zinc-800 border-zinc-300'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800'
              }`}
            >
              Watertight Mesh
            </span>
          </div>
          {/* On mobile: compact live dimension link */}
          {dimensions && (
            <button
              onClick={onOpenSpecsModal}
              className={`sm:hidden flex items-center gap-1 text-[11px] font-mono transition-colors text-left ${
                isLight ? 'text-zinc-600 hover:text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Ruler className="w-3 h-3 opacity-70" />
              <span>{dimensions.totalLength}×{dimensions.totalWidth}mm</span>
              <span className="opacity-40">·</span>
              <span className="text-[10px] underline decoration-zinc-400">Specs</span>
            </button>
          )}
          <p className={`text-[11px] hidden sm:block ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Helvetica typography • Minimal fillet box • Slicer-ready
          </p>
        </div>
      </div>

      {/* Center Live Dimension & Watertight Callouts (Desktop only) */}
      <div className="hidden lg:flex items-center gap-2.5">
        {dimensions && (
          <button
            onClick={onOpenSpecsModal}
            title="Click to view detailed 3D print specs & slicing metrics"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border cursor-pointer ${
              isLight
                ? 'bg-zinc-50 hover:bg-zinc-100 text-zinc-900 border-zinc-300'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
            }`}
          >
            <Ruler className={`w-3.5 h-3.5 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`} />
            <span className={`font-semibold ${isLight ? 'text-zinc-950' : 'text-white'}`}>
              {dimensions.totalLength} × {dimensions.totalWidth} × {dimensions.totalHeight} mm
            </span>
            <span className={`text-[11px] font-sans ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
              ({dimensions.weightGramsPLA}g PLA)
            </span>
          </button>
        )}

        {dimensions && (
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
              isLight
                ? 'bg-zinc-100 text-zinc-800 border-zinc-300'
                : 'bg-zinc-900 text-zinc-300 border-zinc-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
            <span>{dimensions.isWatertight ? 'Watertight Manifold' : 'Validating Hull...'}</span>
          </div>
        )}
      </div>

      {/* Right Action Tools */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Desktop View Tools: Dark/Light Mode, Presets, View Toggles & Export */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Dark/Light Mode Toggle */}
          <button
            onClick={onToggleTheme}
            title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              isLight
                ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
            }`}
          >
            {isLight ? (
              <>
                <Moon className="w-3.5 h-3.5 text-zinc-700" />
                <span>Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-zinc-200" />
                <span>Light</span>
              </>
            )}
          </button>

          {/* Presets Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowPresetsMenu(!showPresetsMenu);
                setShowExportMenu(false);
              }}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                isLight
                  ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Presets</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showPresetsMenu && (
              <div
                className={`absolute right-0 mt-1.5 w-60 rounded-xl shadow-2xl p-1.5 z-50 text-xs border ${
                  isLight
                    ? 'bg-white border-zinc-300 text-zinc-900 shadow-zinc-300/50'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-100 shadow-black'
                }`}
                onMouseLeave={() => setShowPresetsMenu(false)}
              >
                <div className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  1-Click Templates
                </div>
                {TAG_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p.id)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors flex flex-col gap-0.5 ${
                      isLight ? 'hover:bg-zinc-100 text-zinc-900' : 'hover:bg-zinc-800 text-zinc-200'
                    }`}
                  >
                    <span className="font-semibold">{p.name}</span>
                    <span className={`text-[11px] leading-tight ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {p.description}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3D Caliper Dimensions Toggle */}
          <button
            onClick={() => onUpdateConfig({ showDimensions3D: !config.showDimensions3D })}
            title={config.showDimensions3D ? 'Hide 3D Dimension Calipers' : 'Show 3D Dimension Calipers'}
            className={`p-1.5 rounded-lg border transition-colors ${
              config.showDimensions3D
                ? isLight
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-white text-zinc-950 border-white'
                : isLight
                ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border-zinc-300'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-800'
            }`}
          >
            <Ruler className="w-4 h-4" />
          </button>

          {/* Build Plate Grid Toggle */}
          <button
            onClick={() => onUpdateConfig({ showBuildPlate: !config.showBuildPlate })}
            title={config.showBuildPlate ? 'Hide 3D Printer Bed Grid' : 'Show 3D Printer Bed Grid'}
            className={`p-1.5 rounded-lg border transition-colors ${
              config.showBuildPlate
                ? isLight
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-white text-zinc-950 border-white'
                : isLight
                ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border-zinc-300'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-800'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Export STL (Visible on both Desktop and Mobile) */}
        <div className="relative flex items-center">
          <button
            onClick={() => onExportSTL(true)}
            className={`flex items-center gap-1.5 font-semibold text-xs px-3 py-2 sm:py-1.5 rounded-l-lg shadow-sm transition-colors min-h-[40px] sm:min-h-0 ${
              isLight
                ? 'bg-zinc-900 hover:bg-black text-white'
                : 'bg-white hover:bg-zinc-100 text-zinc-950'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Export</span>
            <span>STL</span>
          </button>
          <button
            onClick={() => {
              setShowExportMenu(!showExportMenu);
              setShowPresetsMenu(false);
              setShowMobileTools(false);
            }}
            className={`px-2 py-2 sm:py-1.5 rounded-r-lg border-l transition-colors min-h-[40px] sm:min-h-0 ${
              isLight
                ? 'bg-zinc-800 hover:bg-zinc-900 text-white border-zinc-700'
                : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-900 border-zinc-300'
            }`}
            title="More Export Options"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {/* Export Dropdown Menu */}
          {showExportMenu && (
            <div
              className={`absolute right-0 top-full mt-1.5 w-64 rounded-xl shadow-2xl p-1.5 z-50 text-xs border ${
                isLight
                  ? 'bg-white border-zinc-300 text-zinc-900 shadow-zinc-300/50'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-100 shadow-black'
              }`}
            >
              <button
                onClick={() => {
                  onExportSTL(true);
                  setShowExportMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex flex-col ${
                  isLight ? 'hover:bg-zinc-100' : 'hover:bg-zinc-800'
                }`}
              >
                <span className={`font-semibold ${isLight ? 'text-zinc-950' : 'text-white'}`}>
                  Binary STL (Recommended)
                </span>
                <span className={`text-[11px] ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Standard compact file for all slicers (Bambu, Cura, Prusa)
                </span>
              </button>

              <button
                onClick={() => {
                  onExportMultiPart();
                  setShowExportMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex flex-col mt-1 ${
                  isLight ? 'hover:bg-zinc-100' : 'hover:bg-zinc-800'
                }`}
              >
                <span className={`font-semibold flex items-center gap-1 ${isLight ? 'text-zinc-950' : 'text-white'}`}>
                  <Layers className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" /> Dual-Color / Multi-Part STLs
                </span>
                <span className={`text-[11px] ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Separate Base.stl + Text.stl for Bambu AMS or Prusa MMU
                </span>
              </button>

              <button
                onClick={() => {
                  onExportSTL(false);
                  setShowExportMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex flex-col mt-1 ${
                  isLight ? 'hover:bg-zinc-100 text-zinc-600' : 'hover:bg-zinc-800 text-zinc-400'
                }`}
              >
                <span className="font-medium">ASCII STL (Text format)</span>
                <span className={`text-[11px] ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Human-readable debug format
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Tools Menu Trigger (Mobile only) */}
        <div className="relative sm:hidden">
          <button
            onClick={() => {
              setShowMobileTools(!showMobileTools);
              setShowExportMenu(false);
              setShowPresetsMenu(false);
            }}
            title="App Settings & Tools"
            aria-label="App Settings & Tools"
            className={`p-2 rounded-lg border transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center ${
              showMobileTools
                ? isLight
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-white text-zinc-950 border-white'
                : isLight
                ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Mobile Tools Dropdown / Sheet */}
          {showMobileTools && (
            <div
              className={`absolute right-0 top-full mt-2 w-64 rounded-2xl shadow-2xl p-2 z-50 text-xs border ${
                isLight
                  ? 'bg-white border-zinc-300 text-zinc-900 shadow-zinc-400/50'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-100 shadow-black'
              }`}
            >
              <div className={`px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Quick Settings
              </div>

              {/* Theme Toggle in Mobile Menu */}
              <button
                onClick={() => {
                  onToggleTheme();
                  setShowMobileTools(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors flex items-center justify-between ${
                  isLight ? 'hover:bg-zinc-100' : 'hover:bg-zinc-800'
                }`}
              >
                <span className="flex items-center gap-2 font-medium">
                  {isLight ? <Moon className="w-4 h-4 text-zinc-700" /> : <Sun className="w-4 h-4 text-zinc-300" />}
                  Theme Mode
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                  isLight ? 'bg-zinc-100 border-zinc-300 text-zinc-700' : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                }`}>
                  {isLight ? 'Light' : 'Dark'}
                </span>
              </button>

              {/* 3D Calipers Toggle in Mobile Menu */}
              <button
                onClick={() => onUpdateConfig({ showDimensions3D: !config.showDimensions3D })}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors flex items-center justify-between ${
                  isLight ? 'hover:bg-zinc-100' : 'hover:bg-zinc-800'
                }`}
              >
                <span className="flex items-center gap-2 font-medium">
                  <Ruler className="w-4 h-4 text-zinc-500" />
                  3D Caliper Dimensions
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                  config.showDimensions3D
                    ? isLight ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-950 border-white'
                    : isLight ? 'bg-zinc-100 border-zinc-300 text-zinc-500' : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                }`}>
                  {config.showDimensions3D ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* Bed Grid Toggle in Mobile Menu */}
              <button
                onClick={() => onUpdateConfig({ showBuildPlate: !config.showBuildPlate })}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors flex items-center justify-between ${
                  isLight ? 'hover:bg-zinc-100' : 'hover:bg-zinc-800'
                }`}
              >
                <span className="flex items-center gap-2 font-medium">
                  <Grid3X3 className="w-4 h-4 text-zinc-500" />
                  3D Printer Bed Grid
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                  config.showBuildPlate
                    ? isLight ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-950 border-white'
                    : isLight ? 'bg-zinc-100 border-zinc-300 text-zinc-500' : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                }`}>
                  {config.showBuildPlate ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* View Full Specs Modal */}
              <button
                onClick={() => {
                  onOpenSpecsModal();
                  setShowMobileTools(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors flex items-center justify-between border-t mt-1 pt-2.5 ${
                  isLight ? 'border-zinc-200 hover:bg-zinc-100' : 'border-zinc-800 hover:bg-zinc-800'
                }`}
              >
                <span className="flex items-center gap-2 font-semibold">
                  <Info className="w-4 h-4 text-zinc-500" />
                  Detailed 3D Print Specs
                </span>
                <span className={`text-[10px] font-mono ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {dimensions ? `${dimensions.totalLength}×${dimensions.totalWidth}mm` : ''}
                </span>
              </button>

              {/* Presets Quick Link in Mobile Menu */}
              <div className={`mt-2 pt-2 border-t ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
                <div className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  <Sparkles className="w-3 h-3" /> Quick Presets
                </div>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {TAG_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => applyPreset(p.id)}
                      className={`text-left p-2 rounded-lg transition-colors border ${
                        isLight
                          ? 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-800'
                          : 'bg-zinc-950 border-zinc-800 hover:bg-zinc-800 text-zinc-200'
                      }`}
                    >
                      <span className="font-semibold block text-[11px] truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

