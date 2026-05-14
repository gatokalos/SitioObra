import React, { useRef, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';

useGLTF.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

const BASE = { x: -0.25, y: 0.6, z: -0.12 };

// ─── Model ────────────────────────────────────────────────────────────────────

function HashtagModel({ onClick, isPressed }) {
  const groupRef   = useRef();
  const matRef     = useRef(null); // referencia al material para animar envMapIntensity
  const [hovered, setHovered] = useState(false);
  const tRef       = useRef(0);

  const { scene } = useGLTF('/models/hashtag_black-draco.glb');

  React.useLayoutEffect(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#080808'),
      metalness: 0.82,
      roughness: 0.18,
      envMapIntensity: 0.35,
      emissive: new THREE.Color('#9966ff'),
      emissiveIntensity: 0,
    });

    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = mat;
        child.castShadow = true;
      }
    });

    matRef.current = mat;
    return () => mat.dispose();
  }, [scene]);

  useFrame((_, delta) => {
    if (!groupRef.current || !matRef.current) return;
    tRef.current += delta;
    const t = tRef.current;

    // Oscilación
    groupRef.current.rotation.x = BASE.x + Math.sin(t * 0.4) * 0.12;
    groupRef.current.rotation.y = BASE.y + Math.sin(t * 0.6) * 0.42;
    groupRef.current.rotation.z = BASE.z + Math.sin(t * 0.5) * 0.08;

    // Escala
    const targetScale = isPressed ? 0.93 : hovered ? 1.06 : 1.0;
    groupRef.current.scale.setScalar(
      THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, delta * 10)
    );

    // Emissive hover
    matRef.current.emissiveIntensity = THREE.MathUtils.lerp(
      matRef.current.emissiveIntensity, hovered ? 0.06 : 0, delta * 8
    );

    matRef.current.envMapIntensity = THREE.MathUtils.lerp(
      matRef.current.envMapIntensity, 0.35, delta * 4
    );
  });

  const onOver = useCallback((e) => {
    e.stopPropagation(); setHovered(true);
    document.body.style.cursor = 'pointer';
  }, []);
  const onOut = useCallback((e) => {
    e.stopPropagation(); setHovered(false);
    document.body.style.cursor = 'auto';
  }, []);

  return (
    <group ref={groupRef} onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
      <primitive object={scene} />
    </group>
  );
}

// ─── Canvas wrapper ───────────────────────────────────────────────────────────

export default function HashtagButton3D({
  onClick,
  className = '',
  style = {},
  width = '100%',
  height = '420px',
  contentScale = 1,
  showGlow = false,
}) {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = useCallback(() => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 160);
    onClick?.();
  }, [onClick]);

  return (
    <div
      className={className}
      style={{ width, height, cursor: 'pointer', position: 'relative', ...style }}
    >
      {/* Glow de suelo — se revela cuando el audio está activo */}
      <div
        style={{
          position: 'absolute',
          bottom: '-8%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '140%',
          height: '38%',
          background: 'radial-gradient(ellipse at center, rgba(220,220,255,0.38) 0%, rgba(180,180,255,0.12) 45%, transparent 70%)',
          filter: 'blur(6px)',
          pointerEvents: 'none',
          opacity: showGlow ? 1 : 0,
          transition: 'opacity 1.1s ease',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${contentScale})`,
          transformOrigin: 'center center',
          zIndex: 1,
        }}
      >
        <Canvas
          camera={{ position: [0, 0.2, 4.2], fov: 35 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent', position: 'relative', zIndex: 1, pointerEvents: 'auto' }}
        >
          <ambientLight intensity={0.55} />
          <directionalLight position={[-1.5, 4, 5]} intensity={3.2} />
          <directionalLight position={[3, 3, 1]} intensity={1.2} />
          <directionalLight position={[-3, 1, -3]} intensity={0.6} />

          <Environment preset="city" />

          <React.Suspense fallback={null}>
            <HashtagModel onClick={handleClick} isPressed={isPressed} />
          </React.Suspense>
        </Canvas>
      </div>
    </div>
  );
}

useGLTF.preload('/models/hashtag_black-draco.glb');
