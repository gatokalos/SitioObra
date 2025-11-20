import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import loadMindAR from '@/lib/loadMindAR';
import loadThree from '@/lib/loadThree';

const createTextPanel = (THREE, message) => {
  const canvas = document.createElement('canvas');
  const size = 512;
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);

  const panelMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
  });
  const panelGeometry = new THREE.PlaneGeometry(1.9, 0.72);
  const panel = new THREE.Mesh(panelGeometry, panelMaterial);
  panel.position.set(0, 1.05, 0.02);

  const glowGeometry = new THREE.PlaneGeometry(2.1, 0.9);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: '#6b46c1',
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.set(0, 1.05, -0.01);

  const accentGeometry = new THREE.PlaneGeometry(1.7, 0.09);
  const accentMaterial = new THREE.MeshBasicMaterial({
    color: '#f5d657',
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  const accent = new THREE.Mesh(accentGeometry, accentMaterial);
  accent.position.set(0, 1.15, 0.04);

  const haloGeometry = new THREE.TorusGeometry(0.5, 0.012, 32, 140);
  const haloMaterial = new THREE.MeshBasicMaterial({
    color: '#f5d657',
    transparent: true,
    opacity: 0.5,
  });
  const halo = new THREE.Mesh(haloGeometry, haloMaterial);
  halo.rotation.x = Math.PI / 2;
  halo.position.set(0, 0.35, 0);

  // Steam texture
  const steamCanvas = document.createElement('canvas');
  steamCanvas.width = 64;
  steamCanvas.height = 256;
  const steamCtx = steamCanvas.getContext('2d');
  const steamGradient = steamCtx.createLinearGradient(0, 0, 0, 256);
  steamGradient.addColorStop(0, 'rgba(255,255,255,0)');
  steamGradient.addColorStop(0.2, 'rgba(255,255,255,0.3)');
  steamGradient.addColorStop(1, 'rgba(255,255,255,0)');
  steamCtx.fillStyle = steamGradient;
  steamCtx.fillRect(0, 0, 64, 256);
  const steamTexture = new THREE.CanvasTexture(steamCanvas);

  const steamMaterial = new THREE.MeshBasicMaterial({
    map: steamTexture,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const steamPlanes = Array.from({ length: 4 }).map(() => {
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 1.2), steamMaterial.clone());
    plane.position.set((Math.random() - 0.5) * 0.4, 0.25, (Math.random() - 0.5) * 0.1);
    plane.material.opacity = 0.25 + Math.random() * 0.2;
    return plane;
  });

  const group = new THREE.Group();
  group.add(glow);
  group.add(panel);
  group.add(accent);
  group.add(halo);
  steamPlanes.forEach((plane) => group.add(plane));
  group.position.set(0, 0.25, -0.08);

  const drawMessage = (text) => {
    context.clearRect(0, 0, size, size);
    context.fillStyle = 'rgba(3, 3, 9, 0.85)';
    context.fillRect(0, size * 0.27, size, size * 0.46);
    context.font = 'bold 48px "Space Grotesk", sans-serif';
    context.fillStyle = '#f5d657';
    context.textAlign = 'center';
    context.fillText(text, size / 2, size / 2 + 16);
    texture.needsUpdate = true;
  };

  drawMessage(message);

  const animate = (elapsed) => {
    group.rotation.z = Math.sin(elapsed * 0.4) * 0.04;
    halo.rotation.z += 0.01;
    steamPlanes.forEach((plane, index) => {
      const speed = 0.15 + index * 0.05;
      plane.position.y = 0.2 + ((elapsed * speed + index * 0.2) % 1.2);
      plane.material.opacity = 0.2 + 0.15 * Math.sin(elapsed * 0.8 + index);
    });
  };

  return { group, update: drawMessage, animate };
};

const MindARScene = forwardRef(({
  targetSrc = '/assets/targets.mind',
  isCameraReady = false,
  className = '',
  message = 'La taza te escucha.',
  overlay = null,
}, ref) => {
  const containerRef = useRef(null);
  const panelRef = useRef(null);
  const videoRef = useRef(null);
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

        // Text panel
        const { group, update, animate } = createTextPanel(THREE, message);
        panelRef.current = { update, animate };
        anchor.group.add(group);

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
          videoRef.current = video;
        }

        setStatus('running');

        const clock = new THREE.Clock();
        animationLoop = () => {
          const elapsed = clock.getElapsedTime();
          panelRef.current?.animate?.(elapsed);
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
      panelRef.current = null;
      videoRef.current = null;
      if (attachedVideo && attachedVideo.parentElement === containerRef.current) {
        containerRef.current.removeChild(attachedVideo);
      }
    };
  }, [isCameraReady, targetSrc]);

  useEffect(() => {
    if (panelRef.current?.update) {
      panelRef.current.update(message);
    }
  }, [message]);

  useImperativeHandle(ref, () => ({
    async captureFrame() {
      const video = videoRef.current;
      if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
        return null;
      }
      const captureCanvas = document.createElement('canvas');
      captureCanvas.width = video.videoWidth;
      captureCanvas.height = video.videoHeight;
      const ctx = captureCanvas.getContext('2d');
      ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
      return await new Promise((resolve) => {
        captureCanvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95);
      });
    },
  }), []);

  return (
    <div
      className={`relative w-full bg-transparent rounded-3xl overflow-hidden ${className}`}
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
          Preparando portal...
        </div>
      ) : null}
      {status === 'error' ? (
        <div className="absolute inset-0 flex items-center justify-center text-center px-6 text-sm text-red-300 bg-black/70 pointer-events-none">
          {error}
        </div>
      ) : null}
      {overlay ? (
        <div className="absolute inset-0">{typeof overlay === 'function' ? overlay() : overlay}</div>
      ) : null}
    </div>
  );
});

export default MindARScene;
