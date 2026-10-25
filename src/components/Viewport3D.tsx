/**
 * 3D Viewport with Three.js, Studio PBR Lighting, White-Grey-Black Styling,
 * Dynamic Zoom-Scaled Dimensions, and Automatic Model Framing
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RotateCcw, Crosshair } from 'lucide-react';
import { GeneratedTagModel } from '../utils/tagGeometry';
import { TagConfig, AppTheme } from '../types/tag';

interface Viewport3DProps {
  model: GeneratedTagModel | null;
  config: TagConfig;
  theme: AppTheme;
  isLoading: boolean;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({ model, config, theme, isLoading }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const tagGroupRef = useRef<THREE.Group>(new THREE.Group());
  const dimensionGroupRef = useRef<THREE.Group>(new THREE.Group());
  const bedGridRef = useRef<THREE.Group>(new THREE.Group());
  const bedMeshRef = useRef<THREE.Mesh | null>(null);

  const [activePresetView, setActivePresetView] = useState<'iso' | 'top' | 'front' | 'side'>('iso');

  const isLight = theme === 'light';

  // Helper to dynamically scale all dimension sprites based on camera zoom / distance
  const updateDimensionScales = () => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const dimGroup = dimensionGroupRef.current;
    if (!camera || !controls || !dimGroup) return;

    const distance = camera.position.distanceTo(controls.target);
    // Maintain constant readable size on screen regardless of zoom level
    const baseHeight = Math.max(0.18, distance * 0.038);

    dimGroup.traverse((child) => {
      if (child instanceof THREE.Sprite) {
        const aspect = (child.userData?.aspect as number) || 2.2;
        child.scale.set(baseHeight * aspect, baseHeight, 1);
      }
    });
  };

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(isLight ? 0xf4f4f5 : 0x09090b);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 3000);
    camera.position.set(0, -90, 75);
    camera.up.set(0, 0, 1);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isLight ? 1.05 : 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Orbit Controls with explicit touch gestures
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.08;
    controls.maxDistance = 1500;
    controls.minDistance = 5;
    controls.target.set(0, 0, 2);
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };

    // Studio Environment Map via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3-Point Studio Lighting Rig
    const keyLight = new THREE.DirectionalLight(0xffffff, isLight ? 2.0 : 2.2);
    keyLight.position.set(60, -80, 100);
    keyLight.castShadow = !isSoftwareGl;
    if (!isSoftwareGl) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 10;
      keyLight.shadow.camera.far = 400;
      const d = 100;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xf4f4f5, isLight ? 1.2 : 0.8);
    fillLight.position.set(-80, 60, 60);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
    rimLight.position.set(0, 80, 30);
    scene.add(rimLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, isLight ? 0xe4e4e7 : 0x18181b, isLight ? 0.8 : 0.6);
    scene.add(hemiLight);

    // Dynamic Build Plate
    const buildPlateGroup = new THREE.Group();
    bedGridRef.current = buildPlateGroup;

    const initialBedSize = 250;
    const bedGeo = new THREE.PlaneGeometry(initialBedSize, initialBedSize);
    const bedMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0xe4e4e7 : 0x18181b,
      roughness: 0.9,
      metalness: 0.05,
    });
    const bedMesh = new THREE.Mesh(bedGeo, bedMat);
    bedMesh.position.set(0, 0, -0.05);
    bedMesh.receiveShadow = !isSoftwareGl;
    bedMeshRef.current = bedMesh;
    buildPlateGroup.add(bedMesh);

    const gridMajor = new THREE.GridHelper(initialBedSize, 25, 0x71717a, isLight ? 0xd4d4d8 : 0x27272a);
    gridMajor.rotation.x = Math.PI / 2;
    gridMajor.position.z = 0.01;
    buildPlateGroup.add(gridMajor);

    const originAxes = new THREE.AxesHelper(15);
    originAxes.position.set(-initialBedSize / 2 + 10, -initialBedSize / 2 + 10, 0.05);
    buildPlateGroup.add(originAxes);

    scene.add(buildPlateGroup);
    scene.add(tagGroupRef.current);
    scene.add(dimensionGroupRef.current);

    // Render loop with zoom scale updates
    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;

    function renderScene() {
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        renderDirty = false;
        controls.update();
        updateDimensionScales();
        renderer.render(scene, camera);
        renderBusy = false;
        if (renderDirty) renderScene();
      });
    }

    controls.addEventListener('change', renderScene);
    renderScene();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderScene();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(frameId);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Scene Theme (Background, Bed, Lighting)
  useEffect(() => {
    const scene = sceneRef.current;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (!scene) return;

    scene.background = new THREE.Color(isLight ? 0xf4f4f5 : 0x09090b);

    if (bedMeshRef.current) {
      (bedMeshRef.current.material as THREE.MeshStandardMaterial).color.set(isLight ? 0xe4e4e7 : 0x18181b);
    }

    if (renderer && camera) {
      renderer.toneMappingExposure = isLight ? 1.05 : 1.15;
      renderer.render(scene, camera);
    }
  }, [theme, isLight]);

  // Update Model Meshes and dynamically adjust camera/bed sizing
  useEffect(() => {
    const group = tagGroupRef.current;
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
    }

    if (!model) return;

    if (model.solidMesh) {
      group.add(model.solidMesh);
    } else {
      group.add(model.baseMesh);
      if (model.textMesh) {
        group.add(model.textMesh);
      }
    }

    // Dynamic camera framing when model dimensions change drastically
    const maxDim = Math.max(model.dimensions.totalLength, model.dimensions.totalWidth, 30);
    if (controlsRef.current && cameraRef.current) {
      controlsRef.current.maxDistance = Math.max(800, maxDim * 6);
      controlsRef.current.minDistance = Math.max(3, maxDim * 0.08);
    }

    // Dynamic build plate grid scaling for large signs
    const bedGroup = bedGridRef.current;
    if (bedGroup) {
      const neededBedSize = Math.max(200, Math.ceil((maxDim * 1.35) / 50) * 50);
      const currentScale = neededBedSize / 250;
      bedGroup.scale.set(currentScale, currentScale, 1);
    }

    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, [model]);

  // Update Build Plate visibility
  useEffect(() => {
    if (bedGridRef.current) {
      bedGridRef.current.visible = config.showBuildPlate;
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    }
  }, [config.showBuildPlate]);

  // Update 3D Dimension Callouts / Calipers with zoom-proportional offset and tick sizes
  useEffect(() => {
    const dimGroup = dimensionGroupRef.current;
    while (dimGroup.children.length > 0) {
      dimGroup.remove(dimGroup.children[0]);
    }

    if (!model || !config.showDimensions3D) {
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      return;
    }

    const { rawBounds, dimensions } = model;
    const { minX, maxX, minY, maxY } = rawBounds;
    const totalZ = dimensions.totalHeight;

    // Proportional offset distance based on tag size
    const maxDimension = Math.max(dimensions.totalLength, dimensions.totalWidth);
    const offsetDist = Math.max(5.0, Math.min(22.0, maxDimension * 0.11));
    const arrowLen = Math.max(2.0, Math.min(6.0, maxDimension * 0.035));
    const arrowW = arrowLen * 0.42;

    const boxW = maxX - minX;
    const boxH = maxY - minY;
    const boxD = Math.max(0.4, totalZ);
    const boxCenterX = (minX + maxX) / 2;
    const boxCenterY = (minY + maxY) / 2;
    const boxCenterZ = boxD / 2;

    // 1. Dotted line material for the 3D bounding box (retained around tag geometry)
    const dottedLineMaterial = new THREE.LineDashedMaterial({
      color: isLight ? 0x27272a : 0xe4e4e7,
      dashSize: Math.max(0.7, Math.min(2.0, maxDimension * 0.016)),
      gapSize: Math.max(0.7, Math.min(2.0, maxDimension * 0.016)),
      transparent: true,
      opacity: isLight ? 0.75 : 0.85,
      depthTest: false,
    });

    // 2. Continuous solid line material for dimension lines & simple arrows
    const dimensionLineMaterial = new THREE.LineBasicMaterial({
      color: isLight ? 0x18181b : 0xf4f4f5,
      linewidth: 1.5,
      transparent: true,
      opacity: isLight ? 0.9 : 0.95,
      depthTest: false,
    });

    // Primary 3D Bounding Box enclosing the tag (dotted lines only, NO background fill)
    const mainBoxGeom = new THREE.BoxGeometry(boxW, boxH, boxD);
    const mainBoxEdges = new THREE.EdgesGeometry(mainBoxGeom);
    const mainBoxWire = new THREE.LineSegments(mainBoxEdges, dottedLineMaterial);
    mainBoxWire.position.set(boxCenterX, boxCenterY, boxCenterZ);
    mainBoxWire.computeLineDistances();
    dimGroup.add(mainBoxWire);

    // Length Dimension: Continuous line with simple arrows at ends, extensions suppressed (L: ... mm)
    const yText = minY - offsetDist;
    const lenPoints: THREE.Vector3[] = [];
    // Continuous dimension line (stops strictly at minX and maxX, no extensions)
    lenPoints.push(new THREE.Vector3(minX, yText, 0.01), new THREE.Vector3(maxX, yText, 0.01));
    // Left simple arrow pointing to minX
    lenPoints.push(new THREE.Vector3(minX, yText, 0.01), new THREE.Vector3(minX + arrowLen, yText + arrowW, 0.01));
    lenPoints.push(new THREE.Vector3(minX, yText, 0.01), new THREE.Vector3(minX + arrowLen, yText - arrowW, 0.01));
    // Right simple arrow pointing to maxX
    lenPoints.push(new THREE.Vector3(maxX, yText, 0.01), new THREE.Vector3(maxX - arrowLen, yText + arrowW, 0.01));
    lenPoints.push(new THREE.Vector3(maxX, yText, 0.01), new THREE.Vector3(maxX - arrowLen, yText - arrowW, 0.01));

    const lenGeom = new THREE.BufferGeometry().setFromPoints(lenPoints);
    const lenWire = new THREE.LineSegments(lenGeom, dimensionLineMaterial);
    dimGroup.add(lenWire);

    const lengthSprite = createTextSprite(`L: ${dimensions.totalLength} mm`, isLight);
    lengthSprite.position.set(boxCenterX, yText, 0.05);
    dimGroup.add(lengthSprite);

    // Width Dimension: Continuous line with simple arrows at ends, extensions suppressed (W: ... mm)
    const xText = maxX + offsetDist;
    const widPoints: THREE.Vector3[] = [];
    // Continuous dimension line (stops strictly at minY and maxY, no extensions)
    widPoints.push(new THREE.Vector3(xText, minY, 0.01), new THREE.Vector3(xText, maxY, 0.01));
    // Bottom simple arrow pointing to minY
    widPoints.push(new THREE.Vector3(xText, minY, 0.01), new THREE.Vector3(xText + arrowW, minY + arrowLen, 0.01));
    widPoints.push(new THREE.Vector3(xText, minY, 0.01), new THREE.Vector3(xText - arrowW, minY + arrowLen, 0.01));
    // Top simple arrow pointing to maxY
    widPoints.push(new THREE.Vector3(xText, maxY, 0.01), new THREE.Vector3(xText + arrowW, maxY - arrowLen, 0.01));
    widPoints.push(new THREE.Vector3(xText, maxY, 0.01), new THREE.Vector3(xText - arrowW, maxY - arrowLen, 0.01));

    const widGeom = new THREE.BufferGeometry().setFromPoints(widPoints);
    const widWire = new THREE.LineSegments(widGeom, dimensionLineMaterial);
    dimGroup.add(widWire);

    const widthSprite = createTextSprite(`W: ${dimensions.totalWidth} mm`, isLight);
    widthSprite.position.set(xText, boxCenterY, 0.05);
    dimGroup.add(widthSprite);

    // Height Dimension: Continuous line with simple arrows at ends, extensions suppressed (H: ... mm)
    const hX = minX - offsetDist * 0.75;
    const hY = maxY;
    const hTextX = hX - Math.max(6.0, offsetDist * 0.55);
    const hArrowLen = Math.min(arrowLen, totalZ * 0.35);
    const hArrowW = hArrowLen * 0.45;
    const hPoints: THREE.Vector3[] = [];
    // Continuous dimension line along Z (stops strictly at 0 and totalZ, no extensions)
    hPoints.push(new THREE.Vector3(hX, hY, 0), new THREE.Vector3(hX, hY, totalZ));
    // Bottom simple arrow pointing to 0
    hPoints.push(new THREE.Vector3(hX, hY, 0), new THREE.Vector3(hX + hArrowW, hY, hArrowLen));
    hPoints.push(new THREE.Vector3(hX, hY, 0), new THREE.Vector3(hX - hArrowW, hY, hArrowLen));
    // Top simple arrow pointing to totalZ
    hPoints.push(new THREE.Vector3(hX, hY, totalZ), new THREE.Vector3(hX + hArrowW, hY, totalZ - hArrowLen));
    hPoints.push(new THREE.Vector3(hX, hY, totalZ), new THREE.Vector3(hX - hArrowW, hY, totalZ - hArrowLen));

    const hGeom = new THREE.BufferGeometry().setFromPoints(hPoints);
    const hWire = new THREE.LineSegments(hGeom, dimensionLineMaterial);
    dimGroup.add(hWire);

    const zSprite = createTextSprite(`H: ${dimensions.totalHeight} mm`, isLight);
    zSprite.position.set(hTextX, hY, boxCenterZ);
    dimGroup.add(zSprite);

    // Hole Diameters
    for (const h of model.holes) {
      const holeSprite = createTextSprite(`Ø${h.diameter}mm`, isLight);
      holeSprite.position.set(h.x, h.y, totalZ + 1.5);
      dimGroup.add(holeSprite);
    }

    updateDimensionScales();

    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, [model, config.showDimensions3D, theme, isLight]);

  // Sharp text sprite generator with compact outline box adjusted to text content
  function createTextSprite(text: string, light: boolean): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // Keep dimension text font identical (bold 22px)
    const fontSize = 22;
    ctx.font = `bold ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    const metrics = ctx.measureText(text);
    const textWidth = Math.ceil(metrics.width);

    // Smaller outline box with width adjusted snugly to text content
    const padX = 12; // 12px horizontal padding
    const padY = 6;  // 6px vertical padding
    const boxW = textWidth + padX * 2;
    const boxH = fontSize + padY * 2;

    // Canvas size with border margin
    canvas.width = boxW + 8;
    canvas.height = boxH + 8;

    // Canvas resize resets 2D context, re-apply font
    ctx.font = `bold ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const x = 4;
    const y = 4;
    const r = 6;

    // Semi-translucent filling (only the text box has semi-translucent filling)
    ctx.fillStyle = light ? 'rgba(255, 255, 255, 0.90)' : 'rgba(24, 24, 27, 0.90)';
    // Dashed outline border
    ctx.strokeStyle = light ? 'rgba(24, 24, 27, 0.85)' : 'rgba(244, 244, 245, 0.85)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 3]);

    ctx.beginPath();
    ctx.roundRect(x, y, boxW, boxH, r);
    ctx.fill();
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.fillStyle = light ? '#18181b' : '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + boxW / 2, y + boxH / 2 + 1);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;

    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(spriteMaterial);

    const aspect = canvas.width / canvas.height;
    sprite.userData = { aspect };
    sprite.scale.set(3.0 * aspect, 3.0, 1);
    return sprite;
  }

  // Camera preset views with smart distance scaling
  const setCameraView = (view: 'iso' | 'top' | 'front' | 'side') => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    setActivePresetView(view);

    const maxDim = model ? Math.max(model.dimensions.totalLength, model.dimensions.totalWidth, 30) : 60;
    const dist = maxDim * 1.6;

    if (view === 'iso') {
      camera.position.set(0, -dist * 0.9, dist * 0.7);
      controls.target.set(0, 0, 2);
    } else if (view === 'top') {
      camera.position.set(0, 0, dist * 1.3);
      controls.target.set(0, 0, 0);
    } else if (view === 'front') {
      camera.position.set(0, -dist * 1.2, 3);
      controls.target.set(0, 0, 2);
    } else if (view === 'side') {
      camera.position.set(dist * 1.2, 0, 3);
      controls.target.set(0, 0, 2);
    }

    camera.lookAt(controls.target);
    controls.update();
    updateDimensionScales();

    if (rendererRef.current && sceneRef.current) {
      rendererRef.current.render(sceneRef.current, camera);
    }
  };

  return (
    <div
      className={`relative w-full h-full select-none overflow-hidden transition-colors duration-200 ${
        isLight ? 'bg-zinc-100' : 'bg-zinc-950'
      }`}
    >
      <div 
        ref={containerRef} 
        style={{ touchAction: 'none' }}
        className="w-full h-full cursor-grab active:cursor-grabbing" 
      />

      {isLoading && (
        <div
          className={`absolute inset-0 flex items-center justify-center pointer-events-none z-20 backdrop-blur-[2px] transition-colors ${
            isLight ? 'bg-white/40' : 'bg-black/40'
          }`}
        >
          <div
            className={`px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-mono border ${
              isLight
                ? 'bg-white border-zinc-300 text-zinc-900 shadow-zinc-300/60'
                : 'bg-zinc-900 border-zinc-700 text-zinc-200 shadow-black'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 border-2 rounded-full animate-spin ${
                isLight ? 'border-zinc-900 border-t-transparent' : 'border-white border-t-transparent'
              }`}
            />
            Computing Watertight Mesh...
          </div>
        </div>
      )}

      {/* Floating Viewport Quick Controls (Touch-optimized) */}
      <div
        className={`absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1 rounded-xl p-1 shadow-lg z-10 backdrop-blur-md border transition-colors ${
          isLight
            ? 'bg-white/95 border-zinc-300 text-zinc-800 shadow-zinc-300/40'
            : 'bg-zinc-900/95 border-zinc-800 text-zinc-200 shadow-black'
        }`}
      >
        {(['iso', 'top', 'front', 'side'] as const).map((view) => (
          <button
            key={view}
            onClick={() => setCameraView(view)}
            title={`${view.toUpperCase()} View`}
            className={`px-2 sm:px-2.5 py-1.5 sm:py-1 text-xs font-semibold rounded-lg transition-colors capitalize min-h-[34px] sm:min-h-0 min-w-[34px] sm:min-w-0 flex items-center justify-center ${
              activePresetView === view
                ? isLight
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'bg-white text-zinc-950 shadow-sm'
                : isLight
                ? 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <span className="sm:hidden">{view === 'iso' ? 'Iso' : view}</span>
            <span className="hidden sm:inline">{view === 'iso' ? 'Isometric' : view}</span>
          </button>
        ))}

        {/* Quick Reset / Re-center Camera Button */}
        <button
          onClick={() => setCameraView('iso')}
          title="Reset Camera View"
          aria-label="Reset Camera View"
          className={`p-1.5 rounded-lg transition-colors min-h-[34px] min-w-[34px] flex items-center justify-center ${
            isLight ? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mobile Touch Gesture Tip (Discreet, disappears or quiet) */}
      <div
        className={`absolute top-3 left-3 sm:hidden flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-lg border pointer-events-none transition-colors backdrop-blur-md opacity-80 ${
          isLight
            ? 'bg-white/80 border-zinc-300 text-zinc-600'
            : 'bg-zinc-950/80 border-zinc-800 text-zinc-400'
        }`}
      >
        <span>1-finger: rotate</span>
        <span className="opacity-40">·</span>
        <span>2-finger: zoom</span>
      </div>

      {/* Desktop Viewport Interaction Legend */}
      <div
        className={`absolute bottom-4 left-4 hidden sm:flex items-center gap-2.5 text-[11px] font-mono px-3 py-1.5 rounded-lg border pointer-events-none transition-colors ${
          isLight
            ? 'bg-white/90 border-zinc-300 text-zinc-600 shadow-sm'
            : 'bg-zinc-950/90 border-zinc-800 text-zinc-400 shadow-black'
        }`}
      >
        <span>Rotate: Left Click</span>
        <span className="opacity-40">•</span>
        <span>Pan: Right Click</span>
        <span className="opacity-40">•</span>
        <span>Zoom: Scroll</span>
      </div>
    </div>
  );
};
