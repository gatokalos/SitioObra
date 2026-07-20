import React, { useRef, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';

useGLTF.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

const BASE = { x: -0.25, y: 0.6, z: -0.12 };

// Grano sutil (feTurbulence) para romper la planitud del negro digital,
// sin tocar el render 3D — puramente escenografía encima del canvas.
const GRAIN_SVG_URL = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>'
)}`;

// ─── Model ────────────────────────────────────────────────────────────────────

function HashtagModel({ onClick, isPressed, onReady }) {
  const groupRef   = useRef();
  const matRef     = useRef(null); // referencia al material para animar envMapIntensity
  const [hovered, setHovered] = useState(false);
  const tRef       = useRef(0);

  const { scene } = useGLTF('/models/hashtag_black-draco.glb');

  React.useLayoutEffect(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#080808'),
      metalness: 0.92,
      roughness: 0.09,
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
    onReady?.();
    return () => mat.dispose();
  }, [onReady, scene]);

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
  onReady,
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
      {/* Halo ambiental que envuelve el objeto entero (no solo el piso) —
          imita la luz atmosférica difusa del mockup de referencia, como si
          hubiera polvo/niebla captando un spot desde arriba. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '-22%',
          background: 'radial-gradient(circle closest-side at 50% 56%, rgba(231, 210, 255, 0.22) 0%, rgba(217, 160, 255, 0.08) 55%, transparent 100%)',
          filter: 'blur(20px)',
          pointerEvents: 'none',
          opacity: showGlow ? 1 : 0,
          transition: 'opacity 1.1s ease',
          zIndex: 0,
        }}
      />
      {/* Glow de suelo controlado por el Hero; no pulsa por sí mismo.
          bottom se calibró midiendo en píxeles dónde termina realmente el
          glifo dentro del canvas (~74% de la caja, por el padding de la
          cámara/FOV) — antes el glow quedaba muy por debajo, desconectado. */}

      {/* contentScale se aplica como % real de ancho/alto + translate de
          centrado — NO como transform:scale(). R3F mide su contenedor con
          getBoundingClientRect() (incluye transforms de ancestros); con
          scale() eso hace que mida el tamaño YA reducido y luego el propio
          canvas se vuelve a encoger al heredar ese mismo scale del padre,
          multiplicando el achique (~0.92² en vez de 0.92) y descuadrando el
          centrado en mobile. translate() no afecta el tamaño medido, así
          que no compone. */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: `${contentScale * 100}%`,
          height: `${contentScale * 100}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: 1,
        }}
      >
        <Canvas
          camera={{ position: [0, 0.2, 4.2], fov: 35 }}
          gl={{ antialias: true, alpha: true }}
          style={{
            background: 'transparent',
            position: 'relative',
            zIndex: 1,
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ambientLight intensity={0.55} />
          <directionalLight position={[-1.5, 4, 5]} intensity={3.2} />
          <directionalLight position={[3, 3, 1]} intensity={1.2} />
          <directionalLight position={[-3, 1, -3]} intensity={0.6} />

          <Environment files="/textures/starfield-env.hdr" background={false} />

          <React.Suspense fallback={null}>
            <HashtagModel onClick={handleClick} isPressed={isPressed} onReady={onReady} />
          </React.Suspense>
        </Canvas>
      </div>
      {/* Grano fino — siempre presente pero casi invisible en negro puro;
          solo se asoma donde ya hay algo de luz, como grano fotográfico real. */}

    </div>
  );
}

useGLTF.preload('/models/hashtag_black-draco.glb');
