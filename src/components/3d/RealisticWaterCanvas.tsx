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

    // Particle nodes representing atmospheric humidity and water droplet refractions
    const nodeCount = Math.min(35, Math.floor(window.innerWidth / 40));
    const nodes: Array<{
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      alpha: number;
      phase: number;
    }> = [];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 3 + 1.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: Math.random() * 0.4 + 0.2, // gentle downward rain drift
        alpha: Math.random() * 0.25 + 0.1,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      // Subtle flowing water wave caustics
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, 'rgba(2, 132, 199, 0.015)');
      gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.02)');
      gradient.addColorStop(1, 'rgba(56, 189, 248, 0.015)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Render 3D Fluid Particle Droplets
      nodes.forEach((node) => {
        node.x += node.vx + Math.sin(time + node.phase) * 0.2;
        node.y += node.vy;

        if (node.y > height + 20) {
          node.y = -20;
          node.x = Math.random() * width;
        }
        if (node.x > width + 20) node.x = -20;
        if (node.x < -20) node.x = width + 20;

        // Draw 3D refractive glowing droplet
        const dropGrad = ctx.createRadialGradient(
          node.x - node.radius * 0.3,
          node.y - node.radius * 0.3,
          0,
          node.x,
          node.y,
          node.radius * 2
        );
        dropGrad.addColorStop(0, `rgba(255, 255, 255, ${node.alpha * 1.5})`);
        dropGrad.addColorStop(0.4, `rgba(2, 132, 199, ${node.alpha})`);
        dropGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 2, 0, Math.PI * 2);
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
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.85 }}
    />
  );
};
