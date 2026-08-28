import React, { useEffect, useRef } from 'react';

export const RealisticWaterCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouse = { x: width / 2, y: height / 2 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 3D Particles with depth layer Z
    const nodeCount = Math.min(45, Math.floor(window.innerWidth / 35));
    const nodes: Array<{
      x: number;
      y: number;
      z: number; // 0.2 (far) to 1.0 (near)
      radius: number;
      vx: number;
      vy: number;
      alpha: number;
      phase: number;
    }> = [];

    for (let i = 0; i < nodeCount; i++) {
      const z = Math.random() * 0.8 + 0.2;
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z,
        radius: (Math.random() * 3 + 1.2) * z,
        vx: (Math.random() - 0.5) * 0.25 * z,
        vy: (Math.random() * 0.35 + 0.15) * z,
        alpha: (Math.random() * 0.25 + 0.1) * z,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let time = 0;

    const render = () => {
      time += 0.012;
      ctx.clearRect(0, 0, width, height);

      // Subtle 3D volumetric light caustics
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, 'rgba(2, 132, 199, 0.015)');
      gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.02)');
      gradient.addColorStop(1, 'rgba(56, 189, 248, 0.012)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Render 3D Droplets with Parallax & Mouse Repulsion
      nodes.forEach((node) => {
        // Parallax mouse drift
        const dx = mouse.x - node.x;
        const dy = mouse.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150) {
          node.x -= (dx / dist) * 0.6 * node.z;
          node.y -= (dy / dist) * 0.6 * node.z;
        }

        node.x += node.vx + Math.sin(time + node.phase) * (0.25 * node.z);
        node.y += node.vy;

        if (node.y > height + 20) {
          node.y = -20;
          node.x = Math.random() * width;
        }
        if (node.x > width + 20) node.x = -20;
        if (node.x < -20) node.x = width + 20;

        // Render luminous 3D droplet
        const dropGrad = ctx.createRadialGradient(
          node.x - node.radius * 0.3,
          node.y - node.radius * 0.3,
          0,
          node.x,
          node.y,
          node.radius * 2.2
        );
        dropGrad.addColorStop(0, `rgba(255, 255, 255, ${node.alpha * 1.8})`);
        dropGrad.addColorStop(0.35, `rgba(2, 132, 199, ${node.alpha})`);
        dropGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = dropGrad;
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.9 }}
    />
  );
};
