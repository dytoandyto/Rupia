'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface StitchThreeBackgroundProps {
  className?: string;
  particleColor?: number;
  interactive?: boolean;
}

/**
 * Stitch Three.js Ambient Particle Lattice / Flow Canvas
 * Corresponds to Google Stitch Screen 2 (Three.js ID: 4a77594515984da8ab3ea840e3e0bccc)
 */
export default function StitchThreeBackground({
  className = 'w-full h-full',
  particleColor = 0x167a55,
  interactive = true,
}: StitchThreeBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 300;
    const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 80;
    camera.position.y = 15;
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // 2. Wavy Particle Plane (Emerald Flow)
    const countX = 45;
    const countY = 45;
    const separation = 3;
    const numParticles = countX * countY;

    const positions = new Float32Array(numParticles * 3);
    const scales = new Float32Array(numParticles);

    let i = 0;
    let j = 0;
    for (let ix = 0; ix < countX; ix++) {
      for (let iy = 0; iy < countY; iy++) {
        positions[i] = ix * separation - (countX * separation) / 2; // x
        positions[i + 1] = 0; // y
        positions[i + 2] = iy * separation - (countY * separation) / 2; // z
        scales[j] = 1.5;
        i += 3;
        j++;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    // Particle Material with Soft Emerald Glow
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
      gradient.addColorStop(0, '#7ed8ac');
      gradient.addColorStop(0.4, '#167a55');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 16, 16);
    }
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 2.2,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: particleColor,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // 3. Interaction & Animation Loop
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!interactive) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const rect = container.getBoundingClientRect();
      targetX = ((clientX - rect.left) / width) * 2 - 1;
      targetY = -(((clientY - rect.top) / height) * 2 - 1);
    };

    if (interactive) {
      window.addEventListener('mousemove', handlePointerMove, { passive: true });
      window.addEventListener('touchmove', handlePointerMove, { passive: true });
    }

    let animationFrameId: number;
    let step = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      step += 0.035;
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      const posArray = particles.geometry.attributes.position.array as Float32Array;
      let idx = 0;

      for (let ix = 0; ix < countX; ix++) {
        for (let iy = 0; iy < countY; iy++) {
          // Dynamic sine wave height calculation
          posArray[idx + 1] =
            Math.sin((ix + step) * 0.3) * 3 +
            Math.sin((iy + step) * 0.4) * 3 +
            Math.cos((ix + iy + step) * 0.2) * 2;
          idx += 3;
        }
      }

      particles.geometry.attributes.position.needsUpdate = true;
      particles.rotation.y = mouseX * 0.3;
      particles.rotation.x = -mouseY * 0.15;

      renderer.render(scene, camera);
    };

    animate();

    // 4. Resize Handling
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight || 300;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (interactive) {
        window.removeEventListener('mousemove', handlePointerMove);
        window.removeEventListener('touchmove', handlePointerMove);
      }
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
    };
  }, [particleColor, interactive]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden pointer-events-none select-none ${className}`}
      aria-hidden="true"
    />
  );
}

