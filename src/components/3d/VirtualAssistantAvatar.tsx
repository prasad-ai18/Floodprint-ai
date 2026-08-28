import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export type AssistantState = 'idle' | 'listening' | 'analyzing' | 'speaking';

interface VirtualAssistantAvatarProps {
  state?: AssistantState;
  size?: number;
  interactive?: boolean;
}

export const VirtualAssistantAvatar: React.FC<VirtualAssistantAvatarProps> = ({
  state = 'idle',
  size = 280,
  interactive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const stateRef = useRef<AssistantState>(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(0, 0, 9.5);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x0284c7, 3, 20);
    pointLight.position.set(0, 0, 5);
    scene.add(pointLight);

    const cyanLight = new THREE.PointLight(0x06b6d4, 2.5, 20);
    cyanLight.position.set(-4, 3, 2);
    scene.add(cyanLight);

    // 4. Central 3D Core Sphere with Realistic Wave Distortion
    const coreGeo = new THREE.IcosahedronGeometry(2.1, 32);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.7,
      roughness: 0.1,
      metalness: 0.2,
      transmission: 0.65,
      ior: 1.4,
      transparent: true,
      opacity: 0.9,
      wireframe: false,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    scene.add(coreMesh);

    // 5. Outer Holographic Wireframe Cage
    const outerGeo = new THREE.IcosahedronGeometry(2.5, 3);
    const outerMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    scene.add(outerMesh);

    // 6. Orbital Energy Particle Rings
    const ringGroup = new THREE.Group();

    // Ring 1 (Equatorial)
    const ring1Geo = new THREE.TorusGeometry(3.2, 0.04, 16, 64);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.8,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    ringGroup.add(ring1);

    // Ring 2 (Polar)
    const ring2Geo = new THREE.TorusGeometry(3.5, 0.03, 16, 64);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.7,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.y = Math.PI / 4;
    ringGroup.add(ring2);

    scene.add(ringGroup);

    // 7. Ambient Particle Swarm
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 3.2 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      particlePos[i] = radius * Math.sin(phi) * Math.cos(theta);
      particlePos[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePos[i + 2] = radius * Math.cos(phi);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x7dd3fc,
      size: 0.08,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 8. Interactive Mouse Look-At Dynamics
    let targetRotation = { x: 0, y: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const y = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      targetRotation = { x: y * 0.4, y: x * 0.4 };
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 9. 60 FPS Render Loop with Dynamic State Reactions
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      const currentState = stateRef.current;

      // Adjust animation speed and colors based on assistant state
      let speed = 1.0;
      let pulseAmp = 0.06;

      if (currentState === 'speaking') {
        speed = 2.5;
        pulseAmp = 0.18;
        coreMat.color.setHex(0x0284c7);
        coreMat.emissive.setHex(0x0284c7);
        coreMat.emissiveIntensity = 1.1;
      } else if (currentState === 'listening') {
        speed = 1.8;
        pulseAmp = 0.14;
        coreMat.color.setHex(0x10b981);
        coreMat.emissive.setHex(0x059669);
        coreMat.emissiveIntensity = 1.0;
      } else if (currentState === 'analyzing') {
        speed = 3.2;
        pulseAmp = 0.12;
        coreMat.color.setHex(0x8b5cf6);
        coreMat.emissive.setHex(0x7c3aed);
        coreMat.emissiveIntensity = 1.2;
      } else {
        // Idle
        speed = 1.0;
        pulseAmp = 0.05;
        coreMat.color.setHex(0x0284c7);
        coreMat.emissive.setHex(0x0369a1);
        coreMat.emissiveIntensity = 0.6;
      }

      // Pulse breathing
      const scale = 1 + Math.sin(time * 3 * speed) * pulseAmp;
      coreMesh.scale.set(scale, scale, scale);

      // Core wave vertex ripple
      const pos = coreGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i);
        const v = pos.getY(i);
        const w = pos.getZ(i);
        const len = Math.sqrt(u * u + v * v + w * w);
        if (len > 0) {
          const disp = Math.sin(len * 4 + time * 4 * speed) * 0.04;
          pos.setXYZ(i, (u / len) * (2.1 + disp), (v / len) * (2.1 + disp), (w / len) * (2.1 + disp));
        }
      }
      coreGeo.computeVertexNormals();
      coreGeo.attributes.position.needsUpdate = true;

      // Rotations
      coreMesh.rotation.y += 0.008 * speed;
      coreMesh.rotation.x += 0.004 * speed;

      outerMesh.rotation.y -= 0.006 * speed;
      outerMesh.rotation.z += 0.004 * speed;

      ring1.rotation.z += 0.012 * speed;
      ring2.rotation.x += 0.01 * speed;
      ringGroup.rotation.y += 0.005;

      particleSystem.rotation.y -= 0.003 * speed;

      // Interactive mouse follow damping
      scene.rotation.y += (targetRotation.y - scene.rotation.y) * 0.05;
      scene.rotation.x += (targetRotation.x - scene.rotation.x) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      renderer.dispose();
    };
  }, [size, interactive]);

  return (
    <div className="relative flex items-center justify-center select-none">
      <div ref={containerRef} style={{ width: size, height: size }} />
      
      {/* State Glow Ring */}
      <div 
        className={`absolute inset-0 rounded-full blur-2xl pointer-events-none transition-opacity duration-500 ${
          state === 'speaking' ? 'bg-sky-400/25 opacity-100 animate-pulse' :
          state === 'listening' ? 'bg-emerald-400/25 opacity-100 animate-pulse' :
          state === 'analyzing' ? 'bg-purple-400/25 opacity-100 animate-pulse' :
          'bg-sky-400/10 opacity-70'
        }`}
      />
    </div>
  );
};
