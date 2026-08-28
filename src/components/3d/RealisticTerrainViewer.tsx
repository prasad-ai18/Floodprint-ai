import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Layers, Droplets, RotateCcw } from 'lucide-react';

interface RealisticTerrainViewerProps {
  locationName?: string;
  latitude?: number;
  longitude?: number;
  floodLevel?: number; // 0 to 100
  interactive?: boolean;
  height?: string;
}

export const RealisticTerrainViewer: React.FC<RealisticTerrainViewerProps> = ({
  locationName = 'Chittoor District Topography (AP, India)',
  latitude = 13.2172,
  longitude = 79.1003,
  floodLevel: initialFloodLevel = 45,
  height = '380px',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [waterLevel, setWaterLevel] = useState<number>(initialFloodLevel);
  const [isWireframe, setIsWireframe] = useState<boolean>(false);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [simulatedRain, setSimulatedRain] = useState<boolean>(true);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const waterMeshRef = useRef<THREE.Mesh | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const rainSystemRef = useRef<THREE.Points | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const heightNum = containerRef.current.clientHeight || 380;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    scene.fog = new THREE.FogExp2(0xf1f5f9, 0.015);
    sceneRef.current = scene;

    // 2. Camera Setup (Isometric 3D Perspective)
    const camera = new THREE.PerspectiveCamera(45, width / heightNum, 0.1, 1000);
    camera.position.set(30, 24, 38);
    camera.lookAt(0, 0, 0);

    // 3. Realistic WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance' 
    });
    renderer.setSize(width, heightNum);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Realistic Environmental Lighting
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.9);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.4);
    sunLight.position.set(25, 40, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -25;
    sunLight.shadow.camera.right = 25;
    sunLight.shadow.camera.top = 25;
    sunLight.shadow.camera.bottom = -25;
    scene.add(sunLight);

    const cyanRimLight = new THREE.DirectionalLight(0x0284c7, 0.6);
    cyanRimLight.position.set(-20, 15, -25);
    scene.add(cyanRimLight);

    // 5. 3D Digital Elevation Terrain Mesh
    const terrainSize = 36;
    const terrainSegments = 70;
    const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegments, terrainSegments);
    terrainGeo.rotateX(-Math.PI / 2);

    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Realistic multi-frequency elevation displacement algorithm
      const elev1 = Math.sin(x * 0.18) * Math.cos(z * 0.18) * 3.5;
      const elev2 = Math.sin(x * 0.35 + 1.2) * Math.sin(z * 0.35 + 0.8) * 1.5;
      const elev3 = Math.cos(x * 0.7) * Math.sin(z * 0.7) * 0.5;
      const riverBed = -Math.exp(-(Math.pow(x - z * 0.4, 2) / 16)) * 4.2;
      const totalElev = elev1 + elev2 + elev3 + riverBed;
      pos.setY(i, totalElev);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.65,
      metalness: 0.1,
      flatShading: false,
      wireframe: isWireframe,
    });

    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = true;
    scene.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    // 6. 3D Realistic Fluid Water Layer
    const waterGeo = new THREE.PlaneGeometry(terrainSize * 0.98, terrainSize * 0.98, 48, 48);
    waterGeo.rotateX(-Math.PI / 2);

    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      transmission: 0.6,
      opacity: 0.85,
      transparent: true,
      roughness: 0.1,
      ior: 1.333,
      reflectivity: 0.9,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });

    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = (waterLevel / 100) * 5 - 2.5;
    waterMesh.receiveShadow = true;
    scene.add(waterMesh);
    waterMeshRef.current = waterMesh;

    // 7. 3D Spatial Beacon Pin (Chittoor Focal Hub)
    const beaconGroup = new THREE.Group();
    const pinGeo = new THREE.SphereGeometry(0.7, 16, 16);
    const pinMat = new THREE.MeshStandardMaterial({ 
      color: 0x0284c7, 
      emissive: 0x0369a1, 
      emissiveIntensity: 0.6,
      roughness: 0.2 
    });
    const pinMesh = new THREE.Mesh(pinGeo, pinMat);
    pinMesh.position.set(0, 4.5, 0);
    beaconGroup.add(pinMesh);

    const stemGeo = new THREE.CylinderGeometry(0.08, 0.08, 4, 8);
    const stemMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.7 });
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    stemMesh.position.set(0, 2.5, 0);
    beaconGroup.add(stemMesh);

    scene.add(beaconGroup);

    // 8. 3D Environmental Rain Particle System
    const rainCount = 600;
    const rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount * 3; i += 3) {
      rainPositions[i] = (Math.random() - 0.5) * 40;
      rainPositions[i + 1] = Math.random() * 30;
      rainPositions[i + 2] = (Math.random() - 0.5) * 40;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.15,
      transparent: true,
      opacity: 0.6,
    });
    const rainSystem = new THREE.Points(rainGeo, rainMat);
    scene.add(rainSystem);
    rainSystemRef.current = rainSystem;

    // 9. Interactive Mouse Drag Orbit Controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      scene.rotation.y += deltaX * 0.008;
      camera.position.y = Math.max(10, Math.min(45, camera.position.y - deltaY * 0.08));
      camera.lookAt(0, 0, 0);

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // 10. Animation Loop (60 FPS fluid rendering)
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Fluid Wave Dynamics on Water Plane
      if (waterMeshRef.current) {
        const waterPos = waterGeo.attributes.position;
        for (let i = 0; i < waterPos.count; i++) {
          const u = waterPos.getX(i);
          const v = waterPos.getZ(i);
          const wave = Math.sin(u * 0.6 + elapsedTime * 2.2) * Math.cos(v * 0.6 + elapsedTime * 1.8) * 0.12;
          waterPos.setY(i, wave);
        }
        waterGeo.computeVertexNormals();
        waterGeo.attributes.position.needsUpdate = true;
      }

      // Rain Precipitation Particle Physics
      if (rainSystemRef.current && simulatedRain) {
        const rainPos = rainGeo.attributes.position;
        for (let i = 1; i < rainCount * 3; i += 3) {
          let y = rainPos.getY(i / 3);
          y -= 0.65;
          if (y < 0) y = 30;
          rainPos.setY(i / 3, y);
        }
        rainGeo.attributes.position.needsUpdate = true;
      }

      // Gentle auto-rotation
      if (isRotating && !isDragging) {
        scene.rotation.y += 0.0025;
      }

      // Beacon breathing pulse
      beaconGroup.position.y = Math.sin(elapsedTime * 3) * 0.2;

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight || 380;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      renderer.dispose();
    };
  }, [isWireframe, isRotating, simulatedRain]);

  // Update 3D Water Level when slider moves
  useEffect(() => {
    if (waterMeshRef.current) {
      const targetY = (waterLevel / 100) * 5 - 2.5;
      waterMeshRef.current.position.y = targetY;
    }
  }, [waterLevel]);

  return (
    <div className="relative rounded-3xl overflow-hidden border border-[#cbd5e1] bg-white shadow-xl shadow-slate-200/50 select-none group font-sans">
      
      {/* 3D WebGL Canvas Viewport */}
      <div 
        ref={containerRef} 
        style={{ height, width: '100%' }} 
        className="cursor-grab active:cursor-grabbing"
      />

      {/* Top Floating Spatial HUD */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-[#cbd5e1] shadow-md pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-[#0284c7] animate-ping" />
          <div>
            <div className="text-xs font-bold text-[#0f172a] flex items-center gap-1">
              <span>💧</span>
              <span>{locationName}</span>
            </div>
            <div className="text-[10px] font-mono text-[#64748b]">
              3D Real-time DEM Mesh &bull; {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
            </div>
          </div>
        </div>

        {/* 3D Viewport Controls */}
        <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1 rounded-2xl border border-[#cbd5e1] shadow-md pointer-events-auto">
          <button
            type="button"
            onClick={() => setIsWireframe(!isWireframe)}
            className={`p-2 rounded-xl transition text-xs font-bold flex items-center gap-1 cursor-pointer ${
              isWireframe 
                ? 'bg-[#0284c7] text-white shadow-xs' 
                : 'text-[#475569] hover:bg-[#f1f5f9]'
            }`}
            title="Toggle Topographic Wireframe Contours"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Wireframe</span>
          </button>

          <button
            type="button"
            onClick={() => setIsRotating(!isRotating)}
            className={`p-2 rounded-xl transition text-xs font-bold flex items-center gap-1 cursor-pointer ${
              isRotating 
                ? 'bg-[#0284c7] text-white shadow-xs' 
                : 'text-[#475569] hover:bg-[#f1f5f9]'
            }`}
            title="Toggle Auto-Orbit Rotation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Orbit</span>
          </button>

          <button
            type="button"
            onClick={() => setSimulatedRain(!simulatedRain)}
            className={`p-2 rounded-xl transition text-xs font-bold flex items-center gap-1 cursor-pointer ${
              simulatedRain 
                ? 'bg-[#0284c7] text-white shadow-xs' 
                : 'text-[#475569] hover:bg-[#f1f5f9]'
            }`}
            title="Toggle 3D Rain Precipitation Simulation"
          >
            <Droplets className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Rain FX</span>
          </button>
        </div>
      </div>

      {/* Bottom Interactive Flood Depth Slider HUD */}
      <div className="absolute bottom-3 left-3 right-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-[#cbd5e1] shadow-lg pointer-events-auto">
        <div className="flex items-center gap-3">
          <span className="text-base">🌊</span>
          <div>
            <div className="text-xs font-bold text-[#0f172a] uppercase tracking-wider font-mono">
              3D Simulated Flood Inundation Depth
            </div>
            <div className="text-[11px] text-[#64748b] font-mono">
              Water Level: <span className="font-bold text-[#0284c7]">+{((waterLevel / 100) * 3.5).toFixed(2)}m Above Riverbed</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-1 max-w-xs">
          <span className="text-[10px] font-mono text-[#64748b]">0m</span>
          <input
            type="range"
            min={0}
            max={100}
            value={waterLevel}
            onChange={(e) => setWaterLevel(Number(e.target.value))}
            className="w-full accent-[#0284c7] cursor-pointer"
          />
          <span className="text-[10px] font-mono text-[#0284c7] font-bold">+3.5m</span>
        </div>
      </div>

    </div>
  );
};
