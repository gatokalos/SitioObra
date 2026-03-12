import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import loadMindAR from '@/lib/loadMindAR';
import loadThree from '@/lib/loadThree';

const MODEL_URL = '/models/hashtag_black-draco.glb';
const BASE_ROT = { x: -0.25, y: 0.6, z: -0.12 };

const buildFallbackPortal = (THREE) => {
  const group = new THREE.Group();

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.35, 1),
    new THREE.MeshStandardMaterial({
      color: '#c084fc',
      emissive: '#6b21a8',
      metalness: 0.2,
      roughness: 0.35,
      transparent: true,
      opacity: 0.9,
    }),
  );

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.5, 0.035, 14, 48),
    new THREE.MeshBasicMaterial({
      color: '#e879f9',
      transparent: true,
      opacity: 0.65,
    }),
  );
  halo.rotation.x = Math.PI / 2;

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 16),
    new THREE.MeshBasicMaterial({
      color: '#a5b4fc',
      transparent: true,
      opacity: 0.35,
    }),
  );

  group.add(core);
  group.add(halo);
  group.add(glow);

  return group;
};

const MindARScene = forwardRef(
  (
    {
      targetSrc = '/assets/targets.mind',
      isCameraReady = false,
      className = '',
      message = 'La taza te escucha.', // ya no se usa, pero lo dejamos por compatibilidad
      showScanGuide = false,
      guideImageSrc = '',
      guideLabel = 'Alinea el marcador con el contorno para activar la escena.',
      overlay = null,
      onError = null,
    },
    ref,
  ) => {
    const resolvedTargetSrc = useMemo(() => {
      if (!targetSrc) return targetSrc;

      const absoluteUrlRegex = /^(https?:)?\/\//i;
      if (absoluteUrlRegex.test(targetSrc)) {
        return targetSrc;
      }

      const baseUrl = import.meta.env.BASE_URL ?? '/';
      const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      const trimmed = targetSrc.replace(/^\/+/, '');

      if (typeof window === 'undefined') {
        return `${normalizedBase}${trimmed}`;
      }

      try {
        const resolved = new URL(trimmed, `${window.location.origin}${normalizedBase}`);
        return resolved.toString();
      } catch (e) {
        return `${normalizedBase}${trimmed}`;
      }
    }, [targetSrc]);

  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const rendererRef = useRef(null);
  const rendererInstanceRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);

    const [status, setStatus] = useState('idle');
    const [error, setError] = useState('');
    const [hasTarget, setHasTarget] = useState(false);

    useEffect(() => {
      if (!isCameraReady || !containerRef.current || !resolvedTargetSrc) {
        return undefined;
      }

      let mindarThree = null;
      let renderer = null;
      let animationLoop = null;
      let attachedVideo = null;
      let catModel = null;
      let mat = null;
      let isActive = true;

      const start = async () => {
        setStatus('loading');
        setError('');
        setHasTarget(false);
        try {
          const THREE = await loadThree();
          const MINDAR_IMAGE = await loadMindAR();

          if (navigator?.mediaDevices?.enumerateDevices) {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasVideoInput = devices.some((d) => d.kind === 'videoinput');
            if (!hasVideoInput) {
              throw new Error('No encontramos una cámara disponible en este dispositivo.');
            }
          }

          mindarThree = new MINDAR_IMAGE.MindARThree({
            container: containerRef.current,
            imageTargetSrc: resolvedTargetSrc,
            uiLoading: 'no',
            uiError: 'no',
            uiScanning: 'no',
          });

          const { renderer: r, scene, camera } = mindarThree;
          renderer = r;
          rendererInstanceRef.current = r;
          sceneRef.current = scene;
          cameraRef.current = camera;
          if (renderer?.domElement) {
            rendererRef.current = renderer.domElement;
            renderer.domElement.style.position = 'absolute';
            renderer.domElement.style.inset = '0';
            renderer.domElement.style.width = '100%';
            renderer.domElement.style.height = '100%';
            renderer.domElement.style.zIndex = '1';
            renderer.domElement.style.pointerEvents = 'none';
          }
          if (renderer) {
            renderer.preserveDrawingBuffer = true;
          }

          // Luces simples y limpias
          const hemi = new THREE.HemisphereLight('#ffffff', '#333344', 1.0);
          scene.add(hemi);

          const dir = new THREE.DirectionalLight('#ffffff', 0.8);
          dir.position.set(0.5, 1, 0.5);
          scene.add(dir);

          // Anchor principal (marcador 0)
          const anchor = mindarThree.addAnchor(0);
          anchor.onTargetFound = () => {
            if (isActive) setHasTarget(true);
          };
          anchor.onTargetLost = () => {
            if (isActive) setHasTarget(false);
          };

          // Loader con soporte Draco para el modelo comprimido
          const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
          const { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js');
          const dracoLoader = new DRACOLoader();
          dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
          const loader = new GLTFLoader();
          loader.setDRACOLoader(dracoLoader);

          let modelScene = null;
          try {
            const gltf = await loader.loadAsync(MODEL_URL);
            modelScene = gltf.scene;
          } catch (modelError) {
            console.warn(
              `[MindARScene] No se pudo cargar ${MODEL_URL}, usando modelo fallback.`,
              modelError,
            );
            modelScene = buildFallbackPortal(THREE);
          }

          // Material oscuro metálico con emissive violeta (igual que en Hero)
          mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#080808'),
            metalness: 0.82,
            roughness: 0.18,
            emissive: new THREE.Color('#9966ff'),
            emissiveIntensity: 0.12,
          });
          modelScene.traverse((child) => {
            if (child.isMesh) child.material = mat;
          });

          catModel = modelScene;
          catModel.scale.set(0.9, 0.9, 0.9);
          catModel.position.set(0, 0.5, 0);
          catModel.rotation.set(BASE_ROT.x, BASE_ROT.y, BASE_ROT.z);

          anchor.group.add(catModel);

          // Iniciar MindAR
          await mindarThree.start();

          // Video de cámara para poder capturar frames
          const video = mindarThree.video;
          if (video) {
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
            if (!containerRef.current.contains(video)) {
              containerRef.current.appendChild(video);
              attachedVideo = video;
            }
            videoRef.current = video;
          }

          if (isActive) {
            setStatus('running');
          }

          const clock = new THREE.Clock();
          let flashStartT = null;
          let lastFlashT = -999;

          animationLoop = () => {
            const elapsed = clock.getElapsedTime();

            if (catModel) {
              // Oscilación sinusoidal (igual que en Hero)
              catModel.rotation.x = BASE_ROT.x + Math.sin(elapsed * 0.4) * 0.12;
              catModel.rotation.y = BASE_ROT.y + Math.sin(elapsed * 0.6) * 0.42;
              catModel.rotation.z = BASE_ROT.z + Math.sin(elapsed * 0.5) * 0.08;

              // Respiración de escala
              const s = 0.9 + Math.sin(elapsed * 0.8) * 0.025;
              catModel.scale.set(s, s, s);
            }

            // Flash periódico en emissiveIntensity (primero a ~2s, luego cada ~9s)
            if (mat) {
              if (flashStartT === null && elapsed > 2 && elapsed - lastFlashT > 9) {
                flashStartT = elapsed;
                lastFlashT = elapsed;
              }
              if (flashStartT !== null) {
                const p = (elapsed - flashStartT) / 0.55;
                if (p >= 1) {
                  flashStartT = null;
                  mat.emissiveIntensity = 0.12;
                } else {
                  mat.emissiveIntensity = 0.12 + Math.sin(p * Math.PI) * 0.55;
                }
              }
            }

            renderer.render(scene, camera);
          };
          renderer.setAnimationLoop(animationLoop);
        } catch (err) {
          console.error('[MindARScene] Error al iniciar AR:', err);
          if (isActive) {
            setError(err?.message ?? 'No pudimos iniciar la experiencia AR.');
            setStatus('error');
            onError?.(err);
          }
        }
      };

      start();

      return () => {
        isActive = false;
        try {
          if (renderer && animationLoop) {
            renderer.setAnimationLoop(null);
          }
          if (mindarThree) {
            try {
              mindarThree.stop?.();
              mindarThree.controller?.stopProcessVideo?.();
            } catch (stopErr) {
              console.warn('[MindARScene] Error al detener MindAR:', stopErr);
            }
            mindarThree.renderer?.dispose?.();
          }
        } catch (cleanupErr) {
          console.warn('[MindARScene] Error al limpiar escena AR:', cleanupErr);
        }
        videoRef.current = null;
        rendererRef.current = null;
        rendererInstanceRef.current = null;
        sceneRef.current = null;
        cameraRef.current = null;
        if (attachedVideo && attachedVideo.parentElement === containerRef.current) {
          containerRef.current.removeChild(attachedVideo);
        }
      };
    }, [isCameraReady, resolvedTargetSrc]);

    // La prop message ya no redibuja nada, pero mantenemos el efecto
    useEffect(() => {
      // En esta versión minimalista el mensaje no modifica el modelo.
      // Se deja el efecto vacío para no romper dependencias externas.
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
        const rendererCanvas = rendererRef.current;
        const scene = sceneRef.current;
        const camera = cameraRef.current;
        const rendererInstance = rendererInstanceRef.current;
        if (rendererCanvas && scene && camera && rendererInstance) {
          try {
            rendererInstance.render(scene, camera);
            ctx.drawImage(rendererCanvas, 0, 0, captureCanvas.width, captureCanvas.height);
          } catch (captureError) {
            console.warn('[MindARScene] No pudimos capturar el render 3D:', captureError);
          }
        }
        if (message) {
          const padding = 18;
          const maxWidth = captureCanvas.width - padding * 2;
          const lineHeight = 28;
          ctx.font = '600 20px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          const words = message.split(' ');
          const lines = [];
          let current = '';
          words.forEach((word) => {
            const next = current ? `${current} ${word}` : word;
            if (ctx.measureText(next).width > maxWidth && current) {
              lines.push(current);
              current = word;
            } else {
              current = next;
            }
          });
          if (current) lines.push(current);
          const boxHeight = lines.length * lineHeight + 20;
          const boxY = captureCanvas.height - boxHeight - 28;
          ctx.fillRect(padding, boxY, captureCanvas.width - padding * 2, boxHeight);
          ctx.fillStyle = '#f8fafc';
          lines.forEach((line, index) => {
            ctx.fillText(
              line,
              captureCanvas.width / 2,
              boxY + 10 + lineHeight / 2 + index * lineHeight,
            );
          });
        }
        return await new Promise((resolve) => {
          captureCanvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95);
        });
      },
    }));

    return (
      <div
        className={`relative w-full bg-transparent rounded-3xl overflow-hidden ${className}`}
        data-ar-container="true"
      >
        <div ref={containerRef} className="absolute inset-0" />

        {status === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm pointer-events-none">
            Esperando a que actives la cámara…
          </div>
        )}

        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-200 text-sm bg-black/40 pointer-events-none">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-300 border-t-transparent mb-3" />
            Preparando portal...
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center text-center px-6 text-sm text-red-300 bg-black/70 pointer-events-none">
            {error}
          </div>
        )}

        {status === 'running' && !hasTarget && (
          <div className="absolute inset-0 flex items-center justify-center text-center px-6 text-sm text-slate-200/90 bg-black/30 pointer-events-none">
            {showScanGuide ? (
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-[98%] max-w-[620px] aspect-[4/3] rounded-[28px] border border-white/15 bg-black/15 overflow-hidden shadow-[0_0_40px_rgba(196,181,253,0.12)]">
                  {guideImageSrc ? (
                    <img
                      src={guideImageSrc}
                      alt="Marcador de la experiencia"
                      className="absolute inset-0 h-full w-full object-contain opacity-35"
                      loading="eager"
                      decoding="async"
                    />
                  ) : null}
                  <div className="ar-scan-line" />
                </div>
                <p className="text-xs text-slate-200/80 max-w-[260px]">{guideLabel}</p>
              </div>
            ) : (
              <p>Busca el marcador y mantén la taza completa en el encuadre.</p>
            )}
          </div>
        )}

        {status === 'running' && hasTarget && message ? (
          <div className="absolute inset-x-0 bottom-20 z-30 flex justify-center pointer-events-none">
            <div className="rounded-full bg-black/60 px-4 py-2 text-xs text-slate-200 border border-white/10 backdrop-blur">
              {message}
            </div>
          </div>
        ) : null}

        {overlay && (
          <div className="absolute inset-0">
            {typeof overlay === 'function' ? overlay() : overlay}
          </div>
        )}
      </div>
    );
  },
);

export default MindARScene;
