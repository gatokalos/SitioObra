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
  const flashTRef  = useRef(null);
  const lastFlashT = useRef(-999);

  const { scene } = useGLTF('/models/hashtag_black-draco.glb');

  React.useLayoutEffect(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#080808'),
      metalness: 0.82,
      roughness: 0.18,
      envMapIntensity: 0.35, // azul city suave en reposo
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
      matRef.current.emissiveIntensity ?? 0, hovered ? 0.06 : 0, delta * 8
    );
    matRef.current.emissive.set('#9966ff');

    // ── Trigger flash: primero a ~2s, luego cada ~9s ─────────────────────────
    if (flashTRef.current === null && t > 2 && t - lastFlashT.current > 9) {
      flashTRef.current = 0;
      lastFlashT.current = t;
    }

    // ── Animar envMapIntensity con curva en campana ───────────────────────────
    const DURATION   = 0.55;
    const PEAK_ENV   = 2.2; // cuánto reflejo aparece en el pico

    let targetEnv = 0.35; // vuelve al azul idle tras el flash

    if (flashTRef.current !== null) {
      flashTRef.current += delta;
      if (flashTRef.current >= DURATION) {
        flashTRef.current = null;
      } else {
        const p = flashTRef.current / DURATION;
        targetEnv = Math.sin(p * Math.PI) * PEAK_ENV;
      }
    }

    // Lerp suave hacia el target (sube rápido, baja natural)
    matRef.current.envMapIntensity = THREE.MathUtils.lerp(
      matRef.current.envMapIntensity, targetEnv, delta * 14
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
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${contentScale})`,
          transformOrigin: 'center center',
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

          {/* El entorno que el material refleja durante el flash */}
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
