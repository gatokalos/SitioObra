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

const MindARScene = forwardRef(
  (
    {
      targetSrc = '/assets/targets.mind',
      isCameraReady = false,
      className = '',
      message = 'La taza te escucha.', // ya no se usa, pero lo dejamos por compatibilidad
      overlay = null,
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
      if (targetSrc.startsWith(baseUrl)) {
        return targetSrc;
      }

      const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      const trimmed = targetSrc.replace(/^\/+/, '');
      return `${normalizedBase}${trimmed}`;
    }, [targetSrc]);

    const containerRef = useRef(null);
    const videoRef = useRef(null);

    const [status, setStatus] = useState('idle');
    const [error, setError] = useState('');

    useEffect(() => {
      if (!isCameraReady || !containerRef.current || !resolvedTargetSrc) {
        return undefined;
      }

      let mindarThree = null;
      let renderer = null;
      let animationLoop = null;
      let attachedVideo = null;
      let catModel = null;

      const start = async () => {
        setStatus('loading');
        setError('');
        try {
          const THREE = await loadThree();
          const MINDAR_IMAGE = await loadMindAR();

          mindarThree = new MINDAR_IMAGE.MindARThree({
            container: containerRef.current,
            imageTargetSrc: resolvedTargetSrc,
            uiLoading: 'no',
            uiError: 'no',
            uiScanning: 'no',
          });

          const { renderer: r, scene, camera } = mindarThree;
          renderer = r;

          // Luces simples y limpias
          const hemi = new THREE.HemisphereLight('#ffffff', '#333344', 1.0);
          scene.add(hemi);

          const dir = new THREE.DirectionalLight('#ffffff', 0.8);
          dir.position.set(0.5, 1, 0.5);
          scene.add(dir);

          // Anchor principal (marcador 0)
          const anchor = mindarThree.addAnchor(0);

          // Loader para el modelo 3D
          const { GLTFLoader } = await import(
            'three/examples/jsm/loaders/GLTFLoader.js'
          );
          const loader = new GLTFLoader();

          // 🔴 AJUSTA LA RUTA SI ES NECESARIO
          const gltf = await loader.loadAsync('/webar/taza/gato-abstracto.glb');

          catModel = gltf.scene;
          // Ajustes de escala / posición: aquí se hace fino
          catModel.scale.set(0.6, 0.6, 0.6);
          catModel.position.set(0, 0.3, 0); // flotando sobre el marcador
          catModel.rotation.set(0, Math.PI, 0); // girado hacia la cámara

          anchor.group.add(catModel);

          // Iniciar MindAR
          await mindarThree.start();

          // Video de cámara para poder capturar frames
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

            // Animación suave del gato abstracto (rotación lenta, respiración ligera)
            if (catModel) {
              catModel.rotation.y = elapsed * 0.4;
              const s = 0.6 + Math.sin(elapsed * 0.8) * 0.03;
              catModel.scale.set(s, s, s);
            }

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
        videoRef.current = null;
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