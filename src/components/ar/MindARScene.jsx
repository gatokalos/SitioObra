import React, { useEffect, useRef, useState } from 'react';
import loadMindAR from '@/lib/loadMindAR';
import loadThree from '@/lib/loadThree';

const createTextSprite = (THREE, message) => {
  const canvas = document.createElement('canvas');
  const size = 512;
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, size, size);
  context.fillStyle = 'rgba(9, 6, 21, 0.8)';
  context.fillRect(0, size * 0.25, size, size * 0.5);
  context.font = 'bold 48px "Space Grotesk", sans-serif';
  context.fillStyle = '#f5d657';
  context.textAlign = 'center';
  context.fillText(message, size / 2, size / 2 + 16);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.6, 0.9, 1);
  sprite.position.set(0, 0.4, 0);
  return sprite;
};

const MindARScene = ({
  targetSrc = '/assets/targets.mind',
  isCameraReady = false,
  className = '',
  message = 'La taza te escucha.',
}) => {
  const containerRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isCameraReady || !containerRef.current) {
      return undefined;
    }

    let mindarThree = null;
    let renderer = null;
    let animationLoop = null;
    let attachedVideo = null;

    const start = async () => {
      setStatus('loading');
      setError('');
      try {
        const THREE = await loadThree();
        const MINDAR_IMAGE = await loadMindAR();
        mindarThree = new MINDAR_IMAGE.MindARThree({
          container: containerRef.current,
          imageTargetSrc: targetSrc,
          uiLoading: 'no',
          uiError: 'no',
          uiScanning: 'no',
        });

        const { scene, camera } = mindarThree;
        renderer = mindarThree.renderer;

        // Ambient lighting
        scene.add(new THREE.HemisphereLight('#ffffff', '#444444', 1));
        const pointLight = new THREE.PointLight('#f5d657', 1.2);
        pointLight.position.set(0, 1, 0.5);
        scene.add(pointLight);

        const anchor = mindarThree.addAnchor(0);

        // Text sprite
        const sprite = createTextSprite(THREE, message);
        anchor.group.add(sprite);

        // Orbital object
        const torusGeometry = new THREE.TorusKnotGeometry(0.25, 0.07, 120, 16);
        const torusMaterial = new THREE.MeshStandardMaterial({
          color: '#bc8cff',
          metalness: 0.7,
          roughness: 0.2,
          emissive: '#4b1d66',
        });
        const torus = new THREE.Mesh(torusGeometry, torusMaterial);
        torus.position.set(0, -0.1, 0);
        anchor.group.add(torus);

        const pulseGeometry = new THREE.RingGeometry(0.32, 0.34, 32);
        const pulseMaterial = new THREE.MeshBasicMaterial({
          color: '#ffffff',
          opacity: 0.8,
          transparent: true,
          side: THREE.DoubleSide,
        });
        const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
        pulse.rotation.x = -Math.PI / 2;
        anchor.group.add(pulse);

        await mindarThree.start();

        const video = mindarThree.video;
        if (video && !containerRef.current.contains(video)) {
          video.setAttribute('playsinline', 'true');
          video.muted = true;
          video.style.position = 'absolute';
          video.style.top = '0';
          video.style.left = '0';
          video.style.width = '100%';
          video.style.height = '100%';
          video.style.objectFit = 'cover';
          video.style.zIndex = '0';
          video.style.display = 'block';
          containerRef.current.appendChild(video);
          attachedVideo = video;
        }

        setStatus('running');

        const clock = new THREE.Clock();
        animationLoop = () => {
          const elapsed = clock.getElapsedTime();
          torus.rotation.y += 0.02;
          pulse.material.opacity = 0.5 + 0.5 * Math.sin(elapsed * 2);
          renderer.render(scene, camera);
        };
        renderer.setAnimationLoop(animationLoop);
      } catch (err) {
        console.error('[MindARScene] Error al iniciar AR:', err);
        setError(err?.message ?? 'No pudimos iniciar la experiencia AR.');
        setStatus('error');
      }
    };

    start();

    return () => {
      if (renderer && animationLoop) {
        renderer.setAnimationLoop(null);
      }
      if (mindarThree) {
        mindarThree.stop();
        mindarThree.renderer?.dispose();
      }
      if (attachedVideo && attachedVideo.parentElement === containerRef.current) {
        containerRef.current.removeChild(attachedVideo);
      }
    };
  }, [isCameraReady, targetSrc, message]);

  return (
    <div
      className={`relative w-full aspect-[3/4] bg-transparent rounded-3xl overflow-hidden ${className}`}
      data-ar-container="true"
    >
      <div ref={containerRef} className="absolute inset-0" />
      {status === 'idle' ? (
        <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm pointer-events-none">
          Esperando a que actives la cámara…
        </div>
      ) : null}
      {status === 'loading' ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-200 text-sm bg-black/40 pointer-events-none">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-300 border-t-transparent mb-3"></div>
          Preparando constelación…
        </div>
      ) : null}
      {status === 'error' ? (
        <div className="absolute inset-0 flex items-center justify-center text-center px-6 text-sm text-red-300 bg-black/70 pointer-events-none">
          {error}
        </div>
      ) : null}
    </div>
  );
};

export default MindARScene;
