/**
 * Ergonomic Mobile-First Collapsible Control Dock with White-Grey-Black Monochrome Styling,
 * Touch-Optimized Bottom Sheet Drawer, Dynamic Font Size Scaling,
 * Letter Fillets, and Strict Hole-Text Clearance.
 */

import React, { useState } from 'react';
import { TagConfig, HolePlacement, TagStyle, AppTheme } from '../types/tag';
import { 
  Type, 
  Box, 
  CircleDot, 
  Palette, 
  ChevronUp, 
  ChevronDown,
  Download,
  Ruler
} from 'lucide-react';

interface ControlDockProps {
  config: TagConfig;
  theme: AppTheme;
  onChange: (partial: Partial<TagConfig>) => void;
  onExportSTL?: (binary: boolean) => void;
  onOpenSpecs?: () => void;
}

type TabType = 'text' | 'base' | 'holes' | 'style';

const MONOCHROME_COLORS = [
  { name: 'Jet Black', value: '#09090b' },
  { name: 'Matte Carbon', value: '#18181b' },
  { name: 'Dark Graphite', value: '#27272a' },
  { name: 'Mid Zinc Grey', value: '#52525b' },
  { name: 'Cool Slate Grey', value: '#71717a' },
  { name: 'Light Silver', value: '#d4d4d8' },
  { name: 'Off White', value: '#f4f4f5' },
  { name: 'Pure White', value: '#ffffff' },
];

export const ControlDock: React.FC<ControlDockProps> = ({ 
  config, 
  theme, 
  onChange,
  onExportSTL,
  onOpenSpecs 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('text');

  const isLight = theme === 'light';

  // Dynamic maximum ranges mathematically scaled with font size (from small key tags to 100mm exit signs)
  const fs = config.fontSize;
  const maxBaseThickness = Math.max(8.0, Math.min(25.0, Math.round(fs * 0.25 * 10) / 10));
  const maxPadding = Math.max(10.0, Math.min(60.0, Math.round(fs * 0.5)));
  const maxFillet = Math.max(12.0, Math.min(60.0, Math.round(fs * 0.6)));
  const maxHoleDiameter = Math.max(8.0, Math.min(30.0, Math.round(fs * 0.25 * 2) / 2));
  const maxHoleMargin = Math.max(8.0, Math.min(30.0, Math.round(fs * 0.3)));
  const maxHoleSpacing = Math.max(50.0, Math.min(400.0, Math.round(fs * 4.0)));
  const maxRelief = Math.max(3.0, Math.min(10.0, Math.round(fs * 0.15 * 10) / 10));
  const maxStencilGap = Math.max(3.0, Math.min(10.0, Math.round(fs * 0.1 * 10) / 10));
  const currentRelief = Math.max(0.6, config.reliefHeight);
  const maxLetterFillet = Math.round((currentRelief / 2) * 100) / 100;
  const maxLetterSpacing = Math.max(2.5, Math.min(12.0, Math.round(fs * 0.15 * 10) / 10));

  return (
    <div
      className={`fixed bottom-0 sm:bottom-4 left-0 right-0 sm:left-1/2 sm:-translate-x-1/2 z-30 w-full sm:max-w-[920px] px-0 sm:px-4 transition-all duration-300 ease-out ${
        isCollapsed ? 'translate-y-[calc(100%-52px)] sm:translate-y-[calc(100%-44px)]' : 'translate-y-0'
      }`}
    >
      <div
        className={`rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden border-t sm:border backdrop-blur-xl transition-colors duration-200 ${
          isLight
            ? 'bg-white/95 border-zinc-300 shadow-zinc-400/30 text-zinc-900'
            : 'bg-zinc-900/95 border-zinc-800 shadow-black text-zinc-100'
        }`}
      >
        {/* Mobile Pull Handle (Visible on small screens) */}
        <div 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="sm:hidden pt-2 pb-1 flex justify-center cursor-pointer active:opacity-70"
          title={isCollapsed ? 'Tap to expand controls' : 'Tap to collapse'}
        >
          <div className={`w-10 h-1 rounded-full ${isLight ? 'bg-zinc-300' : 'bg-zinc-700'}`} />
        </div>

        {/* Dock Header Bar with Navigation Tabs & Collapse Toggle */}
        <div
          className={`flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 border-b transition-colors duration-200 ${
            isLight ? 'bg-zinc-50/90 border-zinc-200' : 'bg-zinc-950/80 border-zinc-800'
          }`}
        >
          {/* Responsive Tabs (Touch-first on mobile) */}
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar flex-1 mr-2">
            {[
              { id: 'text' as TabType, label: 'Text', longLabel: 'Text & Typography', icon: Type },
              { id: 'base' as TabType, label: 'Base', longLabel: 'Base & Fillets', icon: Box },
              {
                id: 'holes' as TabType,
                label: 'Holes',
                longLabel: `Holes (${config.holePlacement !== 'none' ? `${config.holeCount}×` : 'Off'})`,
                icon: CircleDot,
              },
              { id: 'style' as TabType, label: 'Style', longLabel: 'Styles & Colors', icon: Palette },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id && !isCollapsed;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (isCollapsed) setIsCollapsed(false);
                  }}
                  className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl sm:rounded-lg text-xs font-semibold transition-all min-h-[42px] sm:min-h-0 flex-1 sm:flex-initial shrink-0 ${
                    isActive
                      ? isLight
                        ? 'bg-zinc-900 text-white shadow-sm'
                        : 'bg-white text-zinc-950 shadow-sm'
                      : isLight
                      ? 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/60 active:bg-zinc-200'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60 active:bg-zinc-800'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span className="sm:hidden">{tab.label}</span>
                  <span className="hidden sm:inline">{tab.longLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Right Collapse / Expand Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Control Dock' : 'Collapse Control Dock (Zen Mode)'}
            aria-label={isCollapsed ? 'Expand Control Dock' : 'Collapse Control Dock'}
            className={`flex items-center justify-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors min-h-[42px] min-w-[42px] shrink-0 ${
              isLight
                ? 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/80 active:bg-zinc-200'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80 active:bg-zinc-800'
            }`}
          >
            {isCollapsed ? (
              <>
                <ChevronUp className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Controls</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Zen</span>
              </>
            )}
          </button>
        </div>

        {/* Tab Content Body with Touch-Friendly Layout & Safe Area padding */}
        {!isCollapsed && (
          <div className="p-3.5 sm:p-5 max-h-[50vh] sm:max-h-[320px] overflow-y-auto overscroll-contain pb-safe">
            {/* 1. TEXT & FONT TAB */}
            {activeTab === 'text' && (
              <div className="space-y-4">
                {/* Primary Text Line 1 */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center">
                  <div className="md:col-span-6">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className={`text-xs font-semibold ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                        Primary Text (Line 1)
                      </label>
                      <span className={`text-[10px] ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        Helvetica
                      </span>
                    </div>
                    {/* font-size 16px on mobile (text-base sm:text-sm) prevents iOS Safari auto-zoom! */}
                    <input
                      type="text"
                      value={config.text}
                      onChange={(e) => onChange({ text: e.target.value })}
                      placeholder="e.g. KEYS, LAB 04, EXIT"
                      className={`w-full rounded-xl sm:rounded-lg px-3 py-2 text-base sm:text-sm font-sans tracking-wide border focus:outline-none transition-colors min-h-[44px] sm:min-h-0 ${
                        isLight
                          ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900'
                          : 'bg-zinc-950 border-zinc-700 text-white focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300'
                      }`}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                      Font Weight
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => onChange({ fontVariant: 'regular' })}
                        className={`py-2 sm:py-1.5 text-xs font-medium rounded-xl sm:rounded-lg border transition-colors min-h-[42px] sm:min-h-0 ${
                          config.fontVariant === 'regular'
                            ? isLight
                              ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                              : 'bg-white text-zinc-950 border-white shadow-sm'
                            : isLight
                            ? 'bg-zinc-100 border-zinc-300 text-zinc-600 hover:text-zinc-900'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                        }`}
                      >
                        Regular
                      </button>
                      <button
                        onClick={() => onChange({ fontVariant: 'bold' })}
                        className={`py-2 sm:py-1.5 text-xs font-bold rounded-xl sm:rounded-lg border transition-colors min-h-[42px] sm:min-h-0 ${
                          config.fontVariant === 'bold'
                            ? isLight
                              ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                              : 'bg-white text-zinc-950 border-white shadow-sm'
                            : isLight
                            ? 'bg-zinc-100 border-zinc-300 text-zinc-600 hover:text-zinc-900'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                        }`}
                      >
                        Bold
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-3 flex items-center pt-1 md:pt-5">
                    <label className={`flex items-center gap-2.5 cursor-pointer text-xs font-medium min-h-[40px] sm:min-h-0 ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                      <input
                        type="checkbox"
                        checked={config.isUppercase}
                        onChange={(e) => onChange({ isUppercase: e.target.checked })}
                        className="rounded bg-zinc-950 border-zinc-600 text-zinc-900 focus:ring-zinc-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Force Uppercase</span>
                    </label>
                  </div>
                </div>

                {/* Font Size Slider for Line 1 (3 mm to 100 mm) */}
                <div className={`pt-2 border-t ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
                  <div className="flex justify-between items-center text-xs mb-1.5 flex-wrap gap-1">
                    <span className={`font-semibold ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                      Line 1 Font Size (3 - 100 mm)
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                        {[
                          { size: 6.5, label: 'Key 6.5' },
                          { size: 15.0, label: 'Desk 15' },
                          { size: 35.0, label: 'Door 35' },
                          { size: 60.0, label: 'Sign 60' },
                        ].map((chip) => (
                          <button
                            key={chip.size}
                            onClick={() => onChange({ fontSize: chip.size })}
                            className={`text-[10px] px-2 py-1 rounded-md border transition-colors shrink-0 ${
                              Math.abs(config.fontSize - chip.size) < 0.2
                                ? isLight
                                ? 'bg-zinc-900 text-white border-zinc-900'
                                : 'bg-white text-zinc-950 border-white'
                              : isLight
                              ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-300'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                            }`}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                      <span className={`font-mono font-bold shrink-0 ${isLight ? 'text-zinc-950' : 'text-white'}`}>
                        {config.fontSize.toFixed(1)} mm
                      </span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="3.0"
                    max="100.0"
                    step={config.fontSize >= 20 ? 1.0 : 0.5}
                    value={config.fontSize}
                    onChange={(e) => onChange({ fontSize: parseFloat(e.target.value) })}
                    className={`w-full cursor-pointer ${isLight ? 'accent-zinc-900' : 'accent-white'}`}
                  />
                  <div className={`flex justify-between text-[10px] mt-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    <span>3 mm</span>
                    <span>25 mm</span>
                    <span>50 mm</span>
                    <span>75 mm</span>
                    <span>100 mm</span>
                  </div>
                </div>

                {/* Second Line of Text (Option with Different Font Size) */}
                <div className={`p-3 rounded-xl border transition-colors ${
                  config.hasSecondLine
                    ? isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-zinc-950/60 border-zinc-700'
                    : isLight ? 'bg-zinc-100/50 border-dashed border-zinc-300' : 'bg-zinc-900/40 border-dashed border-zinc-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold min-h-[38px] sm:min-h-0">
                      <input
                        type="checkbox"
                        checked={config.hasSecondLine}
                        onChange={(e) => onChange({ hasSecondLine: e.target.checked })}
                        className="rounded bg-zinc-950 border-zinc-600 text-zinc-900 focus:ring-zinc-500 w-4 h-4 cursor-pointer"
                      />
                      <span className={isLight ? 'text-zinc-900' : 'text-white'}>
                        Add Second Line of Text
                      </span>
                    </label>
                    <span className={`text-[11px] font-mono ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {config.hasSecondLine ? 'Active' : 'Off'}
                    </span>
                  </div>

                  {config.hasSecondLine && (
                    <div className="mt-3 space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        <div className="sm:col-span-7">
                          <label className={`block text-[11px] font-semibold mb-1 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                            Second Line Content
                          </label>
                          <input
                            type="text"
                            value={config.textLine2 || ''}
                            onChange={(e) => onChange({ textLine2: e.target.value })}
                            placeholder="e.g. ROOM 101, STUDIO"
                            className={`w-full rounded-xl sm:rounded-lg px-3 py-2 text-base sm:text-xs font-sans tracking-wide border focus:outline-none transition-colors min-h-[44px] sm:min-h-0 ${
                              isLight
                                ? 'bg-white border-zinc-300 text-zinc-900 focus:border-zinc-900'
                                : 'bg-zinc-900 border-zinc-700 text-white focus:border-zinc-300'
                            }`}
                          />
                        </div>

                        <div className="sm:col-span-5">
                          <div className="flex justify-between items-center text-[11px] mb-1">
                            <span className={`font-semibold ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                              Vertical Line Gap
                            </span>
                            <span className={`font-mono font-bold ${isLight ? 'text-zinc-950' : 'text-white'}`}>
                              {(config.lineSpacing ?? 1.8).toFixed(1)} mm
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="20.0"
                            step="0.5"
                            value={config.lineSpacing ?? 1.8}
                            onChange={(e) => onChange({ lineSpacing: parseFloat(e.target.value) })}
                            className={`w-full cursor-pointer ${isLight ? 'accent-zinc-900' : 'accent-white'}`}
                          />
                        </div>
                      </div>

                      {/* Font Size for Line 2 */}
                      <div>
                        <div className="flex justify-between items-center text-[11px] mb-1 flex-wrap gap-1">
                          <span className={`font-semibold ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                            Line 2 Font Size (3 - 100 mm)
                          </span>
                          <span className={`font-mono font-bold ${isLight ? 'text-zinc-950' : 'text-white'}`}>
                            {(config.fontSize2 || 4.5).toFixed(1)} mm
                          </span>
                        </div>
                        <input
                          type="range"
                          min="3.0"
                          max="100.0"
                          step={(config.fontSize2 || 4.5) >= 20 ? 1.0 : 0.5}
                          value={config.fontSize2 || 4.5}
                          onChange={(e) => onChange({ fontSize2: parseFloat(e.target.value) })}
                          className={`w-full cursor-pointer ${isLight ? 'accent-zinc-900' : 'accent-white'}`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Tracking and Letter Outline Fillet */}
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
                  {/* Option to fillet outline of the text curves */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className={`font-semibold ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                        Letter Curve Fillet (Max {maxLetterFillet.toFixed(2)}mm)
                      </span>
                      <span className={`font-mono font-bold ${isLight ? 'text-zinc-950' : 'text-white'}`}>
                        {Math.min(config.letterFillet || 0, maxLetterFillet).toFixed(2)} mm
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max={maxLetterFillet}
                      step={maxLetterFillet > 1 ? 0.05 : 0.02}
                      value={Math.min(config.letterFillet || 0, maxLetterFillet)}
                      onChange={(e) => onChange({ letterFillet: parseFloat(e.target.value) })}
                      className={`w-full cursor-pointer ${isLight ? 'accent-zinc-900' : 'accent-white'}`}
                    />
                    <div className={`flex justify-between text-[10px] mt-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      <span>0.0 mm (Sharp)</span>
                      <span>{(maxLetterFillet / 2).toFixed(2)} mm</span>
                      <span>{maxLetterFillet.toFixed(2)} mm (Max)</span>
                    </div>
                  </div>

                  {/* Letter Spacing (Tracking) */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className={`font-semibold ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                        Letter Spacing (Tracking)
                      </span>
                      <span className={`font-mono font-bold ${isLight ? 'text-zinc-950' : 'text-white'}`}>
                        {config.letterSpacing.toFixed(1)} mm
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max={maxLetterSpacing}
                      step="0.1"
                      value={config.letterSpacing}
                      onChange={(e) => onChange({ letterSpacing: parseFloat(e.target.value) })}
                      className={`w-full cursor-pointer ${isLight ? 'accent-zinc-900' : 'accent-white'}`}
                    />
                    <div className={`flex justify-between text-[10px] mt-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      <span>0.0 mm (Tight)</span>
                      <span>{(maxLetterSpacing / 2).toFixed(1)} mm</span>
                      <span>{maxLetterSpacing.toFixed(1)} mm</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. BASE & FILLET EDGES TAB */}
            {activeTab === 'base' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Dynamic Base Thickness based on font size */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className={`font-semibold ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                        Base Thickness (0.4 - {maxBaseThickness.toFixed(1)} mm)
                      </span>
                      <span className={`font-mono font-bold ${isLight ? 'text-zinc-950' : 'text-white'}`}>
                        {config.baseThickness.toFixed(1)} mm
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.4"
                      max={maxBaseThickness}
                      step={maxBaseThickness > 10 ? 0.5 : 0.2}
                      value={Math.min(config.baseThickness, maxBaseThickness)}
                      onChange={(e) => onChange({ baseThickness: parseFloat(e.target.value) })}
                      className={`w-full cursor-pointer ${isLight ? 'accent-zinc-900' : 'accent-white'}`}
                    />
                    <div className={`flex justify-between text-[10px] mt-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      <span>0.4 mm</span>
                      <span>{(maxBaseThickness / 2).toFixed(1)} mm</span>
                      <span>{maxBaseThickness.toFixed(1)} mm</span>
                    </div>
                  </div>

                  {/* Dynamic Fillet Radius based on font size */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className={`font-semibold ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                        Fillet Edges Radius
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onChange({ filletRadius: maxFillet })}
                          className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                            isLight
                              ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                          }`}
                        >
                          Pill Shape
                        </button>
                        <span className={`font-mono font-bold ${isLight ? 'text-zinc-950' : 'text-white'}`}>
                          {config.filletRadius.toFixed(1)} mm
                        </span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max={maxFillet}
                      step={maxFillet > 20 ? 1.0 : 0.5}
                      value={Math.min(config.filletRadius, maxFillet)}
                      onChange={(e) => onChange({ filletRadius: parseFloat(e.target.value) })}
                      className={`w-full cursor-pointer ${isLight ? 'accent-zinc-900' : 'accent-white'}`}
                    />
                    <div className={`flex justify-between text-[10px] mt-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      <span>0.5 mm</span>
                      <span>{(maxFillet / 2).toFixed(1)} mm</span>
                      <span>{maxFillet.toFixed(1)} mm</span>
                    </div>
                  </div>
                </div>

                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
                  {/* Dynamic Minimal Text Margin / Padding */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className={`font-semibold ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                        Margin / Padding (1 - {maxPadding} mm)
                      </span>
                      <span className={`font-mono font-bold ${isLight ? 'text-zinc-950' : 'text-white'}`}>
                        {config.padding.toFixed(1)} mm
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max={maxPadding}
                      step={maxPadding > 20 ? 1.0 : 0.5}
                      value={Math.min(config.padding, maxPadding)}
                      onChange={(e) => onChange({ padding: parseFloat(e.target.value) })}
                      className={`w-full cursor-pointer ${isLight ? 'accent-zinc-900' : 'accent-white'}`}
                    />
                    <div className={`flex justify-between text-[10px] mt-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      <span>1.0 mm (Minimal)</span>
                      <span>{(maxPadding / 2).toFixed(1)} mm</span>
                      <span>{maxPadding.toFixed(1)} mm</span>
                    </div>
                  </div>

                  {/* Top Edge Tactile Chamfer / Bevel */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className={`font-semibold ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                        Top-Edge Smooth Bevel
                      </span>
                      <span className={`font-mono font-bold ${isLight ? 'text-zinc-950' : 'text-white'}`}>
                        {config.edgeBevel.toFixed(1)} mm
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max={Math.max(1.0, Math.min(3.0, config.baseThickness * 0.3))}
                      step="0.1"
                      value={config.edgeBevel}
                      onChange={(e) => onChange({ edgeBevel: parseFloat(e.target.value) })}
                      className={`w-full cursor-pointer ${isLight ? 'accent-zinc-900' : 'accent-white'}`}
                    />
                    <div className={`flex justify-between text-[10px] mt-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      <span>0.0 mm (Sharp)</span>
                      <span>0.5 mm</span>
                      <span>{Math.max(1.0, Math.min(3.0, config.baseThickness * 0.3)).toFixed(1)} mm</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. HOLE OPTIONS TAB with Guaranteed Clearance Margin */}
            {activeTab === 'holes' && (
              <div className="space-y-4">
                {/* Hole Placement Selector */}
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                    Hole Placement (Top, Left, Symmetrical)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: 'left', label: 'Left Edge' },
                      { id: 'top', label: 'Top Edge' },
                      { id: 'right', label: 'Right Edge' },
                      { id: 'both-ends', label: 'Both Ends' },
                      { id: 'none', label: 'None (Plain)' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => onChange({ holePlacement: item.id as HolePlacement })}
                        className={`py-2.5 sm:py-2 px-2 text-xs font-semibold rounded-xl sm:rounded-lg border transition-all text-center min-h-[42px] sm:min-h-0 ${
                          config.holePlacement === item.id
                            ? isLight
                              ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                              : 'bg-white text-zinc-950 border-white shadow-sm'
                            : isLight
                            ? 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:text-zinc-950 active:bg-zinc-200'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white active:bg-zinc-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {config.holePlacement !== 'none' && (
                  <>
                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
                      {/* Symmetrical Hole Count Option */}
                      <div>
                        <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                          Hole Count & Symmetry
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { count: 1 as const, label: '1 Center Hole' },
                            { count: 2 as const, label: '2 Holes' },
                          ].map((opt) => (
                            <button
                              key={opt.count}
                              onClick={() => onChange({ holeCount: opt.count })}
                              className={`py-2 sm:py-1.5 px-3 text-xs font-semibold rounded-xl sm:rounded-lg border transition-colors min-h-[42px] sm:min-h-0 ${
                                config.holeCount === opt.count
                                  ? isLight
                                    ? 'bg-zinc-900 text-white border-zinc-900'
                                    : 'bg-white text-zinc-950 border-white'
                                  : isLight
                                  ? 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:text-zinc-900 active:bg-zinc-200'
                                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white active:bg-zinc-700'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Dynamic Hole Size based on font size */}
                      <div>
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className={`font-semibold ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                            Hole Diameter (2 - {maxHoleDiameter} mm)
                          </span>
                          <span className={`font-mono font-bold ${isLight ? 'text-zinc-950' : 'text-white'}`}>
                            Ø {config.holeDiameter.toFixed(1)} mm
                          </span>
                        </div>
                        <input
                          type="range"
                          min="2.0"
                          max={maxHoleDiameter}
                          step={maxHoleDiameter > 12 ? 1.0 : 0.5}
                          value={Math.min(config.holeDiameter, maxHoleDiameter)}
                          onChange={(e) => onChange({ holeDiameter: parseFloat(e.target.value) })}
                          className={`w-full cursor-pointer ${isLight ? 'accent-zinc-900' : 'accent-white'}`}
                        />
                        <div className={`flex justify-between text-[10px] mt-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          <span>Ø 2.0 mm</span>
                          <span>Ø {(maxHoleDiameter / 2).toFixed(1)} mm</span>
                          <span>Ø {maxHoleDiameter.toFixed(1)} mm</span>
                        </div>
                      </div>
                    </div>

                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
                      {/* Strict Clearance Margin between hole and text + border */}
                      <div>
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <div>
                            <span className={`font-semibold block ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                              Clearance Margin (Hole-to-Text)
                            </span>
                            <span className={`text-[10px] ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                              Guarantees wall safety around hole
                            </span>
                          </div>
                          <span className={`font-mono font-bold ${isLight ? 'text-zinc-950' : 'text-white'}`}>
                            {config.holeEdgeMargin.toFixed(1)} mm
                          </span>
                        </div>
                        <input
                          type="range"
                          min="2.0"
                          max={maxHoleMargin}
                          step={maxHoleMargin > 15 ? 1.0 : 0.5}
                          value={Math.min(config.holeEdgeMargin, maxHoleMargin)}
                          onChange={(e) => onChange({ holeEdgeMargin: parseFloat(e.target.value) })}
                          className={`w-full cursor-pointer ${isLight ? 'accent-zinc-900' : 'accent-white'}`}
                        />
                        <div className={`flex justify-between text-[10px] mt-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          <span>2.0 mm (Min)</span>
                          <span>{(maxHoleMargin / 2).toFixed(1)} mm</span>
                          <span>{maxHoleMargin.toFixed(1)} mm</span>
                        </div>
                      </div>

                      {/* Symmetrical Spacing */}
                      {config.holeCount === 2 && (
                        <div>
                          <div className="flex justify-between items-center text-xs mb-1.5">
                            <span className={`font-semibold ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                              Symmetrical Hole Spacing
                            </span>
                            <span className={`font-mono font-bold ${isLight ? 'text-zinc-950' : 'text-white'}`}>
                              {config.holeSymmetricalSpacing.toFixed(1)} mm
                            </span>
                          </div>
                          <input
                            type="range"
                            min="8.0"
                            max={maxHoleSpacing}
                            step={maxHoleSpacing > 100 ? 5.0 : 1.0}
                            value={Math.min(config.holeSymmetricalSpacing, maxHoleSpacing)}
                            onChange={(e) => onChange({ holeSymmetricalSpacing: parseFloat(e.target.value) })}
                            className={`w-full cursor-pointer ${isLight ? 'accent-zinc-900' : 'accent-white'}`}
                          />
                          <div className={`flex justify-between text-[10px] mt-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                            <span>8 mm</span>
                            <span>{(maxHoleSpacing / 2).toFixed(1)} mm</span>
                            <span>{maxHoleSpacing.toFixed(1)} mm</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 4. COLORS & 3D STYLE TAB */}
            {activeTab === 'style' && (
              <div className="space-y-4">
                {/* Tag 3D Style */}
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                    3D Printing Tag Style
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'embossed', title: 'Embossed (Raised)', desc: 'Ideal for 2-color / AMS 3D print' },
                      { id: 'debossed', title: 'Debossed (Engraved)', desc: 'Carved flush into surface' },
                      { id: 'cutout', title: 'Cutout (Stencil)', desc: 'Punched through with island bridges' },
                    ].map((style) => (
                      <button
                        key={style.id}
                        onClick={() => onChange({ tagStyle: style.id as TagStyle })}
                        className={`p-3 sm:p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[52px] ${
                          config.tagStyle === style.id
                            ? isLight
                              ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                              : 'bg-white text-zinc-950 border-white shadow-sm'
                            : isLight
                            ? 'bg-zinc-100 border-zinc-300 hover:border-zinc-400 text-zinc-800'
                            : 'bg-zinc-800/80 border-zinc-700 hover:border-zinc-600 text-zinc-200'
                        }`}
                      >
                        <span className="text-xs font-bold">{style.title}</span>
                        <span className={`text-[11px] sm:text-[10px] mt-1 leading-tight ${
                          config.tagStyle === style.id
                            ? isLight ? 'text-zinc-300' : 'text-zinc-600'
                            : isLight ? 'text-zinc-500' : 'text-zinc-400'
                        }`}>
                          {style.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cutout Controls: Stencil Gap & Bridges */}
                {config.tagStyle === 'cutout' && (
                  <div className={`pt-2 border-t space-y-3 ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`text-xs font-semibold block ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>
                          Stencil Island Bridges
                        </span>
                        <span className={`text-[11px] ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          Preserves centers in A, B, D, O, P, R, 0, 8
                        </span>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold min-h-[36px]">
                        <input
                          type="checkbox"
                          checked={config.stencilBridges !== false}
                          onChange={(e) => onChange({ stencilBridges: e.target.checked })}
                          className="rounded bg-zinc-950 border-zinc-600 text-zinc-900 focus:ring-zinc-500 w-4 h-4 cursor-pointer"
                        />
                        <span>{config.stencilBridges !== false ? 'Enabled' : 'Off'}</span>
                      </label>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className={`font-semibold ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                          Bridge Width (0.6 - {maxStencilGap.toFixed(1)} mm)
                        </span>
                        <span className={`font-mono font-bold ${isLight ? 'text-zinc-950' : 'text-white'}`}>
                          {(config.stencilGap || 1.0).toFixed(1)} mm
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.6"
                        max={maxStencilGap}
                        step={maxStencilGap > 5 ? 0.5 : 0.1}
                        value={Math.min(config.stencilGap || 1.0, maxStencilGap)}
                        onChange={(e) => onChange({ stencilGap: parseFloat(e.target.value) })}
                        className={`w-full cursor-pointer ${isLight ? 'accent-zinc-900' : 'accent-white'}`}
                      />
                    </div>
                  </div>
                )}

                {/* Text Relief Height / Engraving Depth Slider (min 0.6 mm) */}
                {config.tagStyle !== 'cutout' && (
                  <div className={`pt-2 border-t ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className={`font-semibold ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                        {config.tagStyle === 'embossed' ? 'Relief Height (Raised, min 0.6mm)' : 'Engraving Depth (min 0.6mm)'}
                      </span>
                      <span className={`font-mono font-bold ${isLight ? 'text-zinc-950' : 'text-white'}`}>
                        {Math.max(0.6, config.reliefHeight).toFixed(1)} mm
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.6"
                      max={maxRelief}
                      step={maxRelief > 5 ? 0.5 : 0.2}
                      value={Math.min(Math.max(0.6, config.reliefHeight), maxRelief)}
                      onChange={(e) => onChange({ reliefHeight: parseFloat(e.target.value) })}
                      className={`w-full cursor-pointer ${isLight ? 'accent-zinc-900' : 'accent-white'}`}
                    />
                    <div className={`flex justify-between text-[10px] mt-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      <span>0.6 mm (3 layers)</span>
                      <span>{(maxRelief / 2).toFixed(1)} mm</span>
                      <span>{maxRelief.toFixed(1)} mm</span>
                    </div>
                  </div>
                )}

                {/* Center text alignment in tag base */}
                <div className={`pt-2 border-t flex items-center justify-between ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
                  <div>
                    <span className={`text-xs font-semibold block ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>
                      Symmetric Tag Margins
                    </span>
                    <span className={`text-[11px] ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      Borders expand symmetrically on both sides
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold min-h-[36px]">
                    <input
                      type="checkbox"
                      checked={config.centerTextInBase !== false}
                      onChange={(e) => onChange({ centerTextInBase: e.target.checked })}
                      className="rounded bg-zinc-950 border-zinc-600 text-zinc-900 focus:ring-zinc-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Symmetric</span>
                  </label>
                </div>

                {/* Monochrome Color Swatches with Touch Hitboxes */}
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                      Tag Base Color
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {MONOCHROME_COLORS.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => onChange({ baseColor: c.value })}
                          title={c.name}
                          aria-label={c.name}
                          style={{ backgroundColor: c.value }}
                          className={`w-7 h-7 sm:w-6 sm:h-6 rounded-lg border transition-transform cursor-pointer ${
                            config.baseColor.toLowerCase() === c.value.toLowerCase()
                              ? 'scale-110 border-zinc-950 ring-2 ring-zinc-500/50'
                              : isLight ? 'border-zinc-300' : 'border-zinc-700'
                          }`}
                        />
                      ))}
                      <input
                        type="color"
                        value={config.baseColor}
                        onChange={(e) => onChange({ baseColor: e.target.value })}
                        className="w-7 h-7 sm:w-6 sm:h-6 rounded-lg bg-transparent border-0 cursor-pointer"
                        title="Custom Color"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                      Lettering Color
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {MONOCHROME_COLORS.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => onChange({ textColor: c.value })}
                          title={c.name}
                          aria-label={c.name}
                          style={{ backgroundColor: c.value }}
                          className={`w-7 h-7 sm:w-6 sm:h-6 rounded-lg border transition-transform cursor-pointer ${
                            config.textColor.toLowerCase() === c.value.toLowerCase()
                              ? 'scale-110 border-zinc-950 ring-2 ring-zinc-500/50'
                              : isLight ? 'border-zinc-300' : 'border-zinc-700'
                          }`}
                        />
                      ))}
                      <input
                        type="color"
                        value={config.textColor}
                        onChange={(e) => onChange({ textColor: e.target.value })}
                        className="w-7 h-7 sm:w-6 sm:h-6 rounded-lg bg-transparent border-0 cursor-pointer"
                        title="Custom Color"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
