/**
 * TagForge 3D - Watertight 3D Printable Tag Generator
 * Real-world millimeter CAD engine, Helvetica typography, minimal fillet bounding box,
 * customizable holes, and live STL export.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import * as opentype from 'opentype.js';
import { TagConfig, TagDimensions, AppTheme } from './types/tag';
import { DEFAULT_TAG_CONFIG } from './utils/presets';
import { loadHelveticaFont } from './utils/fontLoader';
import { generateTagModel, GeneratedTagModel } from './utils/tagGeometry';
import { exportSTL, exportMultiPartSTL, getSafeFilename } from './utils/stlExporter';
import { Viewport3D } from './components/Viewport3D';
import { TopHeader } from './components/TopHeader';
import { ControlDock } from './components/ControlDock';
import { DimensionsPanel } from './components/DimensionsPanel';

export default function App() {
  const [theme, setTheme] = useState<AppTheme>('light'); // Default white / light mode
  const [config, setConfig] = useState<TagConfig>(DEFAULT_TAG_CONFIG);
  const [font, setFont] = useState<opentype.Font | null>(null);
  const [model, setModel] = useState<GeneratedTagModel | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFontLoading, setIsFontLoading] = useState<boolean>(true);
  const [showSpecsModal, setShowSpecsModal] = useState<boolean>(false);

  const debounceTimerRef = useRef<number | null>(null);
  const currentModelRef = useRef<GeneratedTagModel | null>(null);

  // 1. Initial Font Loading (Helvetica)
  useEffect(() => {
    let isMounted = true;
    setIsFontLoading(true);

    loadHelveticaFont(config.fontVariant)
      .then((loadedFont) => {
        if (isMounted) {
          setFont(loadedFont);
          setIsFontLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load Helvetica font:', err);
        if (isMounted) {
          setIsFontLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [config.fontVariant]);

  // 2. Generate 3D Parametric Mesh when config or font changes
  const updateGeometry = useCallback(
    (cfg: TagConfig, activeFont: opentype.Font) => {
      setIsLoading(true);
      generateTagModel(cfg, activeFont)
        .then((generated) => {
          setModel(generated);
          currentModelRef.current = generated;
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Failed to generate tag geometry:', err);
          setIsLoading(false);
        });
    },
    []
  );

  useEffect(() => {
    if (!font) return;

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    // Fast 30ms debounce for silky-smooth slider scrubbing
    debounceTimerRef.current = window.setTimeout(() => {
      updateGeometry(config, font);
    }, 35);

    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [config, font, updateGeometry]);

  // Handle configuration updates
  const handleUpdateConfig = (partial: Partial<TagConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  };

  // STL Export Handlers
  const handleExportSTL = (binary: boolean) => {
    const active = currentModelRef.current;
    if (!active) return;

    const line1 = config.text ? config.text.trim() : '';
    const line2 = config.hasSecondLine && config.textLine2 ? `_${config.textLine2.trim()}` : '';
    const filename = getSafeFilename(`${line1}${line2}`, binary ? '' : '_ascii');
    exportSTL(active.exportGeometry, {
      filename,
      binary,
    });
  };

  const handleExportMultiPart = () => {
    const active = currentModelRef.current;
    if (!active) return;

    const line1 = config.text ? config.text.trim().replace(/[^a-zA-Z0-9_-]/g, '_') : 'Tag';
    const line2 = config.hasSecondLine && config.textLine2 ? `_${config.textLine2.trim().replace(/[^a-zA-Z0-9_-]/g, '_')}` : '';
    exportMultiPartSTL(active.baseGeometry, active.textGeometry, `Tag_${line1}${line2}`);
  };

  return (
    <div
      className={`flex flex-col h-screen h-[100dvh] w-screen overflow-hidden transition-colors duration-200 ${
        theme === 'light' ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-950 text-zinc-100'
      }`}
    >
      {/* Top Navigation & Live Metric Bar with Monochrome Theme Toggle */}
      <TopHeader
        config={config}
        dimensions={model?.dimensions || null}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
        onUpdateConfig={handleUpdateConfig}
        onExportSTL={handleExportSTL}
        onExportMultiPart={handleExportMultiPart}
        onOpenSpecsModal={() => setShowSpecsModal(true)}
      />

      {/* Main 3D Viewport Area */}
      <main className="relative flex-1 w-full h-[calc(100dvh-56px)] overflow-hidden">
        <Viewport3D
          model={model}
          config={config}
          theme={theme}
          isLoading={isLoading || isFontLoading}
        />

        {/* Floating Ergonomic Bottom Dock (Collapsible, zero viewport occlusion) */}
        <ControlDock
          config={config}
          theme={theme}
          onChange={handleUpdateConfig}
          onExportSTL={handleExportSTL}
          onOpenSpecs={showSpecsModal ? undefined : () => setShowSpecsModal(true)}
        />

        {/* Detailed 3D Print Specs & Dimensions Modal */}
        <DimensionsPanel
          isOpen={showSpecsModal}
          onClose={() => setShowSpecsModal(false)}
          dimensions={model?.dimensions || null}
          config={config}
          theme={theme}
        />
      </main>
    </div>
  );
}
