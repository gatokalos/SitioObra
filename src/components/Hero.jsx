import React, { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
const TicketPurchaseModal = React.lazy(() => import('@/components/TicketPurchaseModal'));
const GatokensRevealModal = React.lazy(() => import('@/components/GatokensRevealModal'));
const VideoNarrativeAutoplay = React.lazy(() => import('@/components/VideoNarrativeAutoplay'));
const isotipoGatoWebp = '/assets/isotipo_hero.webp';
import PWAInstructionsOverlay from '@/components/PWAInstructionsOverlay';
import PWAFirstLaunchWelcome from '@/components/PWAFirstLaunchWelcome';
import { RESONANCE_BRIDGE_VIDEO_ENABLED } from '@/components/transmedia/transmediaConstants';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import useSignalDriftText from '@/hooks/useSignalDriftText';
import { consumeBienvenidaGatokensRevealPending, setBienvenidaReturnPath } from '@/lib/bienvenida';
import {
  getHeroAmbientAudio,
  getHeroAmbientState,
  subscribeHeroAmbient,
  readHeroAudioEnabledPreference,
  writeHeroAudioEnabledPreference,
  pauseHeroAmbient,
  resumeHeroAmbientPlayback,
  toggleHeroAmbientMuted,
  setHeroAmbientMuted,
} from '@/lib/heroAmbientAudio';
import { safeGetItem, safeSetItem } from '@/lib/safeStorage';
import { createHeroStars } from '@/lib/heroStars';
import { extractRecommendedAppId, resolveShowcaseFromAppId } from '@/lib/bienvenidaBridge';
import { NARRATIVE_VIDEO_URL_DESKTOP } from '@/lib/narrativeVideo';
import {
  showcaseDefinitions,
  ORACULO_RECOMMENDED_SHOWCASE_KEY,
} from '@/components/transmedia/transmediaConstants';
import {
  readHeroActivatedFromSession,
  writeHeroActivatedToSession,
  readIndexCueUsedFromSession,
  writeIndexCueUsedToSession,
  readGatHubDismissedFromSession,
} from '@/lib/heroActivation';
import { consumePendingContinuation } from '@/lib/pendingContinuation';

const POZO_HERO_REVEAL_KEY = 'gatoencerrado:pozo-hero-reveal:v1';

const SUPABASE_STORAGE = `${import.meta.env.VITE_SUPABASE_URL || ''}/storage/v1/object/public`;
const HERO_LOGGED_IN_AUDIO_URL = `${SUPABASE_STORAGE}/Sonoridades/audio/A2_Melody_MSTR.m4a`;
const HERO_LOGGED_IN_AUDIO_FALLBACK_URL = `${SUPABASE_STORAGE}/Sonoridades/audio/A2_Melody_MSTR.wav`;
const HERO_LOGGED_IN_AUDIO_VOLUME = 0.35;
const HERO_AUDIO_MIN_AUDIBLE_VOLUME = 0.015;
const HERO_AUDIO_PLAY_RETRY_MS = 2500;
const HERO_AUDIO_IDLE_RETRY_MS = 6000;
// Id del # real en Header.jsx — destino de la animación de transmigración.
const HEADER_INDEX_HASHTAG_ID = 'header-index-hashtag';
const HERO_TITLE = 'GATOENCERRADO';
const HERO_BRAND_LABEL = '#GATOENCERRADO';
const HERO_INACTIVE_ECHO_TEXT = 'Ante la duda, pulsa el gato';
const HERO_INACTIVE_SIGNAL_LOOP_TEXT = `${HERO_INACTIVE_ECHO_TEXT} · `.repeat(9);
// El [#] se queda insinuado hasta que la cascada completa alcanza el umbral.
// Así el brillo del símbolo es la consecuencia visual del eco, no una segunda
// instrucción separada.
const HERO_HASH_INSINUATED_OPACITY = 0.28;
// La espiral sustituye a la vieja frase mecanografiada: nace en el fondo,
// recorre la cinta y, solo cuando alcanza al gato, enciende el [#].
const HERO_INACTIVE_SIGNAL_REVEAL_MS = 5200;
const PWA_HASH_WHISPERS = [
  '¿Me voy contigo?',
  'Soy una obra diferente',
  '¿Miau?',
];
// RANURA DE COPY VACÍA A PROPÓSITO, pendiente del autor. El espacio que
// reserva (~40 px) ya forma parte de la composición del sheet, así que
// llenarla o quitarla cambia lo que se ve: no tocar sin decisión de Carlos.
// Su intención declarada (2026-08-19): puente entre el tono introspectivo del
// Estado Cero y los pasos prácticos de instalación — misma voz en primera
// persona que usan los whispers del #, no tono de soporte técnico.
const PWA_INSTRUCTIONS_EYEBROW = '';
// Aviso suave al pie de las instrucciones, en el registro de «se recomienda el
// uso de audífonos» (Carlos, 21 sep 2026). Un aviso, no una orden.
const PWA_INSTRUCTIONS_SUBTITLE = 'Esta obra se disfruta más con la app instalada';
const GAT_BALANCE_STORAGE_KEY = 'gatoencerrado:gatokens-available';
const readHeroGatBalance = () => {
  const value = Number(safeGetItem(GAT_BALANCE_STORAGE_KEY));
  return Number.isFinite(value) ? Math.max(Math.trunc(value), 0) : 0;
};
// Tras cerrar el sheet de instrucciones, no se vuelve a interceptar el primer
// tap del hashtag hasta que pase este tiempo — sin esto, cada visita nueva
// repetía la misma pregunta aunque el usuario ya hubiera contestado.
const HERO_PWA_PROMPT_DECLINED_KEY = 'gatoencerrado:pwa-install-declined-at';
const HERO_PWA_PROMPT_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;
// La cuarta (30 sep 2026) invita sin preguntar: el eco ya promete «una sola
// pregunta» antes de activar. Va al final del ciclo para pasarle el turno a
// quien visita; como fantasma tardaría casi un minuto en salir.
const HERO_ROTATING_SUBTITLES = [
  'La obra que ocurre en tu mente',                   // 0 · el slogan canónico
  'Basada en una herida emocional compartida',        // 2 · el origen — intacta, es de tus mejores
  'Arte, tecnología y cuidado: una sola función',  // 4 · la función de la obra
  'Tú sabes hasta dónde indagar',                     // la invitación — le pasa el turno a quien visita
  ];

const HERO_GHOST_SUBTITLES = [
  'Sí: aquí hay gato encerrado',                      // 7 · NUEVA — el premio final del que se quedó
  'Una obra con nueve vidas',                         // 5 · NUEVA — el gato escondido en el número
  '(Tal vez esto empieza al revés)',                // 7 · NUEVA — el premio final del que se quedó
];

const HeroInactiveSignal = ({
  prefersReducedMotion = false,
  centerY = null,
  onReachThreshold,
}) => {
  useEffect(() => {
    if (typeof onReachThreshold !== 'function') return undefined;
    // Respaldo de la propia animación SVG: algunos WebKit/Chromium no emiten
    // onAnimationComplete dentro de <mask>. Comparte exactamente la duración
    // de la revelación, así que no crea una segunda coreografía paralela.
    const timerId = window.setTimeout(
      onReachThreshold,
      prefersReducedMotion ? 120 : HERO_INACTIVE_SIGNAL_REVEAL_MS
    );
    return () => window.clearTimeout(timerId);
  }, [onReachThreshold, prefersReducedMotion]);

  return (
    <motion.div
      className="hero-inactive-signal"
      // La cinta completa se anuncia una sola vez: las dos hileras visibles
      // son una misma frase y la segunda funciona como persistencia analógica.
      role="img"
      aria-label={HERO_INACTIVE_ECHO_TEXT}
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={
        prefersReducedMotion
          ? { opacity: 0 }
          : {
              opacity: 0,
              y: '17vh',
              scale: 0.12,
              filter: 'blur(8px)',
            }
      }
      transition={
        prefersReducedMotion
          ? { duration: 0.12 }
          : { duration: 0.58, ease: [0.22, 1, 0.36, 1] }
      }
      style={{
        '--hero-signal-center-y': centerY === null ? '40vh' : `${centerY}px`,
      }}
    >
      <div className="hero-inactive-signal__frame">
        <svg
          className="hero-inactive-signal__svg"
          viewBox="0 0 500 620"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
        <defs>
          <linearGradient
            id="hero-inactive-signal-fade"
            x1="0"
            y1="0"
            x2="0"
            y2="620"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="black" />
            <stop offset="0.16" stopColor="white" stopOpacity="0.08" />
            <stop offset="0.38" stopColor="white" stopOpacity="0.38" />
            <stop offset="0.72" stopColor="white" stopOpacity="0.88" />
            <stop offset="1" stopColor="white" />
          </linearGradient>
          <radialGradient id="hero-inactive-signal-tip-fade" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="black" />
            <stop offset="0.34" stopColor="black" stopOpacity="0.92" />
            <stop offset="0.72" stopColor="black" stopOpacity="0.36" />
            <stop offset="1" stopColor="black" stopOpacity="0" />
          </radialGradient>
          <mask
            id="hero-inactive-signal-mask"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="500"
            height="700"
          >
            <rect width="500" height="700" fill="url(#hero-inactive-signal-fade)" />
            <circle
              cx="250"
              cy="378"
              r="92"
              fill="url(#hero-inactive-signal-tip-fade)"
            />
          </mask>
          <mask
            id="hero-inactive-signal-reveal-mask"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="500"
            height="700"
          >
            <rect width="500" height="700" fill="black" />
            <motion.path
              d="M 248 378 C 268 388 273 414 255 428 C 233 446 197 433 192 403 C 186 367 220 335 262 352 C 318 375 328 445 280 480 C 228 517 154 485 133 417 C 111 345 155 270 235 268 C 329 266 402 341 403 438 C 440 525 395 630 307 665"
              fill="none"
              stroke="white"
              strokeWidth="58"
              strokeLinecap="round"
              initial={{ pathLength: prefersReducedMotion ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: prefersReducedMotion ? 0.12 : HERO_INACTIVE_SIGNAL_REVEAL_MS / 1000,
                ease: [0.42, 0, 0.18, 1],
              }}
              onAnimationComplete={prefersReducedMotion ? undefined : onReachThreshold}
            />
          </mask>
          <path
            id="hero-inactive-signal-path-primary"
            d="M 300 665 C 390 630 440 525 411 438 C 411 337 333 258 235 260 C 150 262 104 342 127 419 C 149 492 229 526 284 486 C 336 448 325 371 265 347 C 218 328 180 363 187 404 C 193 439 234 453 260 433 C 281 417 276 384 251 372"
          />
          <path
            id="hero-inactive-signal-path-memory"
            d="M 314 665 C 400 628 429 523 396 438 C 395 345 324 273 235 275 C 160 277 118 347 139 415 C 159 478 228 508 276 473 C 320 441 311 378 260 358 C 221 343 192 371 197 402 C 202 427 231 438 250 423 C 264 412 261 392 245 384"
          />
          <path
            id="hero-inactive-signal-path-spine"
            d="M 307 665 C 395 630 440 525 403 438 C 402 341 329 266 235 268 C 155 270 111 345 133 417 C 154 485 228 517 280 480 C 328 445 318 375 262 352 C 220 335 186 367 192 403 C 197 433 233 446 255 428 C 273 414 268 388 248 378"
          />
        </defs>

        <g mask="url(#hero-inactive-signal-mask)">
          <g mask="url(#hero-inactive-signal-reveal-mask)">
          <use
            href="#hero-inactive-signal-path-spine"
            className="hero-inactive-signal__spine"
          />
          <text
            className="hero-inactive-signal__text hero-inactive-signal__text--memory"
            textLength="2700"
            lengthAdjust="spacing"
          >
            <textPath href="#hero-inactive-signal-path-memory" startOffset="0">
              {HERO_INACTIVE_SIGNAL_LOOP_TEXT}
              {!prefersReducedMotion ? (
                <animate
                  attributeName="startOffset"
                  from="0"
                  to="-300"
                  dur="21s"
                  repeatCount="indefinite"
                />
              ) : null}
            </textPath>
          </text>

          <text
            className="hero-inactive-signal__text hero-inactive-signal__text--primary"
            textLength="2700"
            lengthAdjust="spacing"
          >
            <textPath href="#hero-inactive-signal-path-primary" startOffset="0">
              {HERO_INACTIVE_SIGNAL_LOOP_TEXT}
              {!prefersReducedMotion ? (
                <animate
                  attributeName="startOffset"
                  from="0"
                  to="-300"
                  dur="18s"
                  repeatCount="indefinite"
                />
              ) : null}
            </textPath>
          </text>
          </g>
        </g>
        </svg>
      </div>
    </motion.div>
  );
};

const HERO_ROTATING_SUBTITLE_PLACEHOLDER =
'Un sistema narrativo transmedial';
const HERO_SUBTITLE_ROTATION_MS = 3800;
// El eslogan canónico (primer subtítulo) compite visualmente con el
// movimiento del # al activarse la escena — le damos un poco más de tiempo
// de lectura solo esa primera vez, antes de entrar al ritmo normal.
const HERO_SUBTITLE_FIRST_ROTATION_EXTRA_MS = 0;
const HERO_STARFIELD_STAR_COUNT_MOBILE = 165;
const HERO_STARFIELD_STAR_COUNT_DESKTOP = 300;

// Estrellas fugaces: pocas, esporádicas (ciclo largo + delay propio) y
// confinadas a la mitad superior, para no cruzar el título ni el # 3D.
const HERO_SHOOTING_STAR_COUNT = 2;

const createHeroShootingStars = () =>
  Array.from({ length: HERO_SHOOTING_STAR_COUNT }).map((_, index) => ({
    id: index,
    x: 15 + Math.random() * 60,
    y: 6 + Math.random() * 30,
    delay: Math.random() * 22,
    duration: 24 + Math.random() * 10,
  }));

// Estrella fugaz "a demanda": una por gesto de swipe/tap/scroll bloqueado,
// con cooldown para que no se sienta como gimmick si el usuario insiste.
const GESTURE_SHOOTING_STAR_COOLDOWN_MS = 3000;
const GESTURE_SHOOTING_STAR_LIFETIME_MS = 1000;

const readIsRunningAsInstalledPwa = () => {
  if (typeof window === 'undefined') return false;
  const isStandaloneDisplay = window.matchMedia?.('(display-mode: standalone)').matches;
  const isIosStandalone = window.navigator?.standalone === true;
  return Boolean(isStandaloneDisplay || isIosStandalone);
};

const readHeroPwaPromptRecentlyDeclined = () => {
  const declinedAt = Number(safeGetItem(HERO_PWA_PROMPT_DECLINED_KEY));
  if (!declinedAt) return false;
  return Date.now() - declinedAt < HERO_PWA_PROMPT_COOLDOWN_MS;
};

const Hero = () => {
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isGatokensModalOpen, setIsGatokensModalOpen] = useState(false);
  const [recommendedVitranaId, setRecommendedVitranaId] = useState(null);
  const [isUmbralReveal, setIsUmbralReveal] = useState(false);
  const [autoVideoFormatId, setAutoVideoFormatId] = useState(null);
  const [isAutoVideoOpen, setIsAutoVideoOpen] = useState(false);
  const [heroSubtitleIndex, setHeroSubtitleIndex] = useState(0);
  const [heroGhostSubtitle, setHeroGhostSubtitle] = useState(null);
  const heroSectionRef = useRef(null);
  const heroContentRef = useRef(null);
  const heroLogoAnchorRef = useRef(null);
  const [heroSignalCenterY, setHeroSignalCenterY] = useState(null);
  const heroAudioMutedRef = useRef(false);
  const audioGestureUnlockRef = useRef(false);
  const lastHeroAudioPlayAttemptRef = useRef(0);
  const [isHeroAudioMuted, setIsHeroAudioMuted] = useState(false);
  const [isHeroAudioPlaying, setIsHeroAudioPlaying] = useState(false);
  // La PWA instalada arranca con la escena ya activada — sin el clic ritual
  // y, por lo tanto, sin depender de que el #3D termine de cargar por red
  // (ver readIsRunningAsInstalledPwa abajo: es la misma lectura que usa
  // isInstalledPwa, pero se necesita aquí antes de que ese estado exista,
  // en el initializer de useState). Carlos, 2026-08-19: "me gustaría
  // empezar con la escena activada automáticamente cuando se abra la PWA."
  const [hasActivatedAudio, setHasActivatedAudio] = useState(
    () => readHeroActivatedFromSession() || readIsRunningAsInstalledPwa()
  );
  const [hasUsedIndexCue, setHasUsedIndexCue] = useState(
    () => readIndexCueUsedFromSession() || readIsRunningAsInstalledPwa()
  );
  const [transmigrationOrigin, setTransmigrationOrigin] = useState(null);
  const hashtagAnchorRef = useRef(null);
  const userActivatedRef = useRef(readHeroActivatedFromSession() || readIsRunningAsInstalledPwa());
  const audioActivatedOnceRef = useRef(readHeroActivatedFromSession() || readIsRunningAsInstalledPwa());
  const [isHeroInViewport, setIsHeroInViewport] = useState(true);
  const [isHeroPwaInstructionsOpen, setIsHeroPwaInstructionsOpen] = useState(false);
  const [pwaHashWhisper, setPwaHashWhisper] = useState(null);
  const lastPwaHashWhisperIndexRef = useRef(-1);
  const lastPwaHashWhisperAtRef = useRef(0);
  const pwaHashWhisperTimerRef = useRef(null);
  const [hasEchoReachedThreshold, setHasEchoReachedThreshold] = useState(false);
  const hasCompletedEchoRevealRef = useRef(false);
  const prefersReducedMotion = useReducedMotion();
  const [isInstalledPwa, setIsInstalledPwa] = useState(readIsRunningAsInstalledPwa);
  const [heroGatBalance, setHeroGatBalance] = useState(readHeroGatBalance);
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  });
  // Cuenta fija al montar (no reactiva a resize) para que las estrellas no
  // se rebarajen si el usuario cruza el breakpoint móvil/desktop en vivo.
  const heroStars = useMemo(
    () => createHeroStars(isMobileViewport ? HERO_STARFIELD_STAR_COUNT_MOBILE : HERO_STARFIELD_STAR_COUNT_DESKTOP),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const heroShootingStars = useMemo(createHeroShootingStars, []);
  // Estrellas fugaces "a demanda" — una por gesto de swipe/tap/scroll
  // mientras el scroll está bloqueado en Estado Cero, para que el usuario
  // sienta respuesta en vez de fricción cuando el gesto no mueve la página.
  const [gestureShootingStars, setGestureShootingStars] = useState([]);
  const lastGestureStarAtRef = useRef(0);
  const gestureStarIdRef = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: isAuthLoading } = useAuth();

  // Se oculta mientras el sheet de instrucciones PWA está abierto — como ese
  // sheet ya no tiene fondo propio (ver PWAInstructionsOverlay), este texto
  // se vería detrás, mezclado con los pasos.
  // El HUB solo reemplaza este espacio cuando hay energía real. Una sesión
  // iniciada con 0 GAT (pero no instalada como PWA) sigue viendo el Estado
  // Cero: ecos, hint y #3D. La PWA instalada ya no pasa por ahí — arranca
  // con la escena activada (ver hasActivatedAudio arriba).
  const isGatLinktreeAudience =
    heroGatBalance > 0 && (Boolean(user) || isInstalledPwa);
  // El HUB de Header.jsx tapa por completo esta zona del Hero mientras está
  // abierto — pero el #3D (HashtagButton3D) igual se montaba debajo, gastando
  // un contexto WebGL real aunque quedara oculto. En iOS eso se acumula hasta
  // matar el contexto ("WebGL: context lost", confirmado con Web Inspector).
  // El valor inicial reusa isGatLinktreeAudience (misma fórmula que ya usa
  // Header.jsx para decidir si el HUB se auto-abre) en vez de duplicarla, así
  // no hay riesgo de que las dos definiciones se desincronicen si una cambia
  // sin la otra. El evento cubre los cambios posteriores (p. ej. cerrar el
  // HUB con Escape, que no activa la escena).
  const [isGatHubOpen, setIsGatHubOpen] = useState(
    () => isGatLinktreeAudience && !readGatHubDismissedFromSession()
  );
  useEffect(() => {
    const handleGatHubOpenChanged = (event) => setIsGatHubOpen(Boolean(event?.detail?.open));
    window.addEventListener('gatoencerrado:gat-hub-open-changed', handleGatHubOpenChanged);
    return () => window.removeEventListener('gatoencerrado:gat-hub-open-changed', handleGatHubOpenChanged);
  }, []);
  // El #3D solo existe para establecer, UNA vez, la relación gato↔símbolo
  // antes de transmigrar al # plano — no tiene que volver a aparecer nunca
  // en la sesión (Carlos, 2026-08-18). Antes se ocultaba/mostraba con cada
  // toggle de hasActivatedAudio/isGatHubOpen (CSS, contexto WebGL siempre
  // vivo); ahora, en cuanto cualquiera de las dos se vuelve true POR PRIMERA
  // VEZ, se apaga para siempre — un solo mount y un solo unmount real por
  // sesión, no un ciclo. Eso también libera su contexto WebGL de verdad
  // antes de que algo más (p.ej. el iframe de Juegos en la pestaña Habitar)
  // lo necesite, en vez de acapararlo indefinidamente.
  const [isHashtag3DRetired, setIsHashtag3DRetired] = useState(
    () => hasActivatedAudio || isGatHubOpen
  );
  useEffect(() => {
    if (hasActivatedAudio || isGatHubOpen) setIsHashtag3DRetired(true);
  }, [hasActivatedAudio, isGatHubOpen]);
  const shouldShowHeroInactiveHint = !hasActivatedAudio && !isHeroPwaInstructionsOpen && !isGatLinktreeAudience;
  // Solo se retiene mientras el hint está corriendo. Si nunca se muestra
  // (audiencia de linktree, sheet de PWA abierto, escena ya activada), el #
  // conserva su entrada completa de siempre.
  const shouldHoldHashtagInsinuated = shouldShowHeroInactiveHint && !hasEchoReachedThreshold;
  const isHeroThresholdReady =
    hasEchoReachedThreshold || !shouldShowHeroInactiveHint || isHeroPwaInstructionsOpen;

  const handleHeroSignalReachedThreshold = useCallback(() => {
    if (hasCompletedEchoRevealRef.current) return;
    hasCompletedEchoRevealRef.current = true;
    setHasEchoReachedThreshold(true);
  }, []);

  const currentHeroSubtitle = hasActivatedAudio
    ? heroGhostSubtitle ?? HERO_ROTATING_SUBTITLES[heroSubtitleIndex]
    : '';
  const isHeroGhostSubtitle = hasActivatedAudio && heroGhostSubtitle !== null;
  const heroTitleSignalDisplay = useSignalDriftText(HERO_BRAND_LABEL, {
    active: hasActivatedAudio,
    // El subtítulo y el glitch pertenecen a un mismo pulso de lectura. El
    // reflejo de la esfera conserva un tempo propio y no depende de esta llave.
    triggerKey: currentHeroSubtitle,
  });
  const heroTitleDisplay = useMemo(
    () => heroTitleSignalDisplay.slice(1) || HERO_TITLE,
    [heroTitleSignalDisplay],
  );
  const { toast } = useToast();
  const narrativeVideoUrl = isMobileViewport ? null : NARRATIVE_VIDEO_URL_DESKTOP;
  useEffect(() => {
    const syncGatBalance = (event) => {
      const eventBalance = Number(event?.detail?.balance);
      setHeroGatBalance(
        Number.isFinite(eventBalance)
          ? Math.max(Math.trunc(eventBalance), 0)
          : readHeroGatBalance()
      );
    };
    window.addEventListener('gatoencerrado:gatokens-balance-update', syncGatBalance);
    window.addEventListener('storage', syncGatBalance);
    return () => {
      window.removeEventListener('gatoencerrado:gatokens-balance-update', syncGatBalance);
      window.removeEventListener('storage', syncGatBalance);
    };
  }, []);

  useEffect(() => {
    writeHeroActivatedToSession(hasActivatedAudio);
  }, [hasActivatedAudio]);

  // Bloquea el scroll mientras dure el Estado Cero (invitado, escena sin
  // activar) — antes se podía hacer scroll y asomarse al resto del sitio
  // por detrás del Hero sin haber activado nada.
  //
  // Se probó position:fixed en body (más robusto contra scroll táctil en
  // iOS) pero rompía el clic de activación del # 3D — probablemente un
  // resize/reset del raycaster de R3F al sacar a body del flujo normal. Se
  // revirtió a overflow-hidden por clase: ya se verificó (incógnito, sesión
  // limpia) que resuelve el caso real reportado, sin ese efecto colateral.
  useLayoutEffect(() => {
    if (typeof document === 'undefined') return undefined;
    if (user || hasActivatedAudio) return undefined;
    document.body.classList.add('overflow-hidden');
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [user, hasActivatedAudio]);

  // El núcleo de la espiral y la esfera activa comparten un mismo punto
  // físico. La esfera permanece en layout aun cuando está invisible, así que
  // podemos medir su centro real en cada viewport y evitar una alineación a
  // ojo distinta para móvil y escritorio.
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const content = heroContentRef.current;
    const logo = heroLogoAnchorRef.current;
    if (!content || !logo) return undefined;

    let frameId = 0;
    const syncSignalCenter = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        // offsetTop/offsetHeight describen la caja de layout y, a diferencia
        // de getBoundingClientRect(), no incluyen el y:50 de entrada de
        // Framer Motion. Sumamos la cadena de offsetParents hasta el contenedor
        // que también posiciona a la espiral.
        let nextCenterY = logo.offsetTop + logo.offsetHeight / 2;
        let offsetParent = logo.offsetParent;
        while (offsetParent && offsetParent !== content) {
          nextCenterY += offsetParent.offsetTop;
          offsetParent = offsetParent.offsetParent;
        }
        if (offsetParent !== content) {
          const contentRect = content.getBoundingClientRect();
          const logoRect = logo.getBoundingClientRect();
          nextCenterY = logoRect.top + logoRect.height / 2 - contentRect.top;
        }
        setHeroSignalCenterY((current) =>
          current !== null && Math.abs(current - nextCenterY) < 0.5
            ? current
            : nextCenterY
        );
      });
    };

    syncSignalCenter();
    const resizeObserver = typeof window.ResizeObserver === 'function'
      ? new window.ResizeObserver(syncSignalCenter)
      : null;
    resizeObserver?.observe(content);
    resizeObserver?.observe(logo);
    window.addEventListener('resize', syncSignalCenter);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', syncSignalCenter);
    };
  }, []);

  // Mientras el scroll está bloqueado, un swipe/tap/scroll que "no hace
  // nada" se siente como fricción — en vez de eso, dispara una estrella
  // fugaz como respuesta. El mismo contrato aplica cuando el HUB personal
  // está abierto, incluso para usuarios autenticados.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const spawnGestureShootingStar = (event) => {
      const isGatHubOpen = document.body?.dataset.gatHubOpen === 'true';
      const isZeroStateLocked = !user && !hasActivatedAudio;
      if (!isZeroStateLocked && !isGatHubOpen) return;
      if (event.target?.closest?.('button, [role="button"], a')) return;
      const internalScrollRegion = event.target?.closest?.('[data-gat-hub-scroll]');
      if (
        internalScrollRegion &&
        internalScrollRegion.scrollHeight > internalScrollRegion.clientHeight
      ) {
        return;
      }
      const now = Date.now();
      if (now - lastGestureStarAtRef.current < GESTURE_SHOOTING_STAR_COOLDOWN_MS) return;
      lastGestureStarAtRef.current = now;
      const id = gestureStarIdRef.current++;
      setGestureShootingStars((prev) => [
        ...prev,
        { id, x: 12 + Math.random() * 66, y: 8 + Math.random() * 34 },
      ]);
      window.setTimeout(() => {
        setGestureShootingStars((prev) => prev.filter((star) => star.id !== id));
      }, GESTURE_SHOOTING_STAR_LIFETIME_MS);
    };

    window.addEventListener('pointerdown', spawnGestureShootingStar, { passive: true });
    window.addEventListener('wheel', spawnGestureShootingStar, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', spawnGestureShootingStar);
      window.removeEventListener('wheel', spawnGestureShootingStar);
    };
  }, [user, hasActivatedAudio]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => setIsInstalledPwa(readIsRunningAsInstalledPwa());
    standaloneQuery.addEventListener?.('change', handleDisplayModeChange);
    return () => {
      standaloneQuery.removeEventListener?.('change', handleDisplayModeChange);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    let dirty = false;

    if (params.get('souvenir') === 'ok') {
      toast({
        title: 'Souvenir descargado',
        description: 'Tu recuerdo del pozo está listo en tu galería.',
        duration: 5000,
      });
      params.delete('souvenir');
      dirty = true;
    }

    const hasGatokensRevealParam = params.get('gatokens') === 'reveal';
    const pendingGatokensReveal = consumeBienvenidaGatokensRevealPending();

    if (hasGatokensRevealParam || pendingGatokensReveal) {
      // Peek at bienvenida recommendation before opening modal so both state updates
      // land in the same React batch — avoids a render with recommendedShowcaseId = null.
      let nextIsUmbralReveal = Boolean(hasGatokensRevealParam || pendingGatokensReveal?.isUmbral);
      let recommendedAppId = extractRecommendedAppId(pendingGatokensReveal);
      try {
        const raw = safeGetItem('bienvenida:transmedia-intent');
        if (raw) {
          const intent = JSON.parse(raw);
          recommendedAppId = extractRecommendedAppId(intent) || recommendedAppId;
          if (intent?.isUmbral) nextIsUmbralReveal = true;
        }
      } catch {}
      const showcaseId = resolveShowcaseFromAppId(recommendedAppId, showcaseDefinitions);
      if (showcaseId) {
        setRecommendedVitranaId(showcaseId);
        safeSetItem(ORACULO_RECOMMENDED_SHOWCASE_KEY, showcaseId);
      }
      if (pendingGatokensReveal?.source?.startsWith?.('bienvenida')) {
        nextIsUmbralReveal = true;
      }
      setIsUmbralReveal(nextIsUmbralReveal);
      if (nextIsUmbralReveal) {
        // Desde el 30 oct 2026 la talega ya no se abre aquí. La frase («Quizás
        // haya un gato encerrado también en ti…») y «Libera su energía» los
        // dice el gato de la cabina, en el pozo, antes de volver; repetirlos
        // en la portada era el doble «continuar» que Carlos señaló. Lo que el
        // cierre del modal hacía por debajo se conserva: el pozo de la portada
        // se da por revelado y el viewport baja a la galería, donde la vitrina
        // recomendada ya quedó marcada arriba.
        if (!user) {
          safeSetItem(POZO_HERO_REVEAL_KEY, '1');
          window.dispatchEvent(new CustomEvent('gatoencerrado:pozo-hero-revealed'));
        }
        if (showcaseId) {
          window.setTimeout(() => {
            document.querySelector('#transmedia')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 600);
        }
      } else {
        // Panel de energía (sin pasar por la Bienvenida): sigue abriéndose.
        setIsGatokensModalOpen(true);
      }
      if (typeof window !== 'undefined') {
        // Al siguiente tick: en una carga desde cero este efecto corre antes
        // de que App registre su oyente (los efectos del hijo van primero) y
        // el evento se perdía; en el regreso normal, por navegación interna,
        // el oyente ya existe y no cambia nada.
        window.setTimeout(() => {
          window.dispatchEvent(new CustomEvent('gatoencerrado:tercera-llamada-completed'));
        }, 0);
      }
      if (hasGatokensRevealParam) {
        params.delete('gatokens');
        dirty = true;
      }
    }

    if (dirty) {
      const cleanSearch = params.toString();
      const cleanUrl = location.pathname + (cleanSearch ? `?${cleanSearch}` : '') + location.hash;
      // navigate(..., {replace:true}) en vez de window.history.replaceState
      // directo: la API cruda del navegador no siempre sincroniza el
      // location interno de React Router con lo que muestra la barra de
      // direcciones. Si no sincroniza, este mismo efecto (que reacciona a
      // location.hash) puede volver a leer location.search con
      // ?gatokens=reveal "fantasma" la próxima vez que el hash cambie —
      // p.ej. al tocar "Gastar energía", que navega a #transmedia?focus=... —
      // reabriendo el salvaguarda entero. Sospecha fuerte del bug "se
      // reabre bienvenida al gastar GAT en datos celulares" reportado
      // 2026-08-18, sin confirmar en dispositivo real todavía.
      navigate(cleanUrl, { replace: true });
    }
  }, [location.hash, location.pathname, location.search, navigate, toast]);

  // Reanuda exactamente la acción que originó el login. La recomendación
  // durable y esta intención de una sola ejecución son datos distintos: un
  // login genérico no debe disparar videos inesperados.
  useEffect(() => {
    if (!user) return;
    const continuation = consumePendingContinuation();
    if (!continuation?.showcaseId) return;
    try {
      localStorage.removeItem('gatoencerrado:pending-vitrana-skip-modal');
    } catch {}
    setAutoVideoFormatId(continuation.showcaseId);
    setIsAutoVideoOpen(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    const handleOpenNarrativeContinuation = (event) => {
      const showcaseId = event?.detail?.showcaseId;
      if (typeof showcaseId !== 'string' || !showcaseId) return;
      setAutoVideoFormatId(showcaseId);
      setIsAutoVideoOpen(true);
    };
    window.addEventListener(
      'gatoencerrado:open-narrative-continuation',
      handleOpenNarrativeContinuation
    );
    return () =>
      window.removeEventListener(
        'gatoencerrado:open-narrative-continuation',
        handleOpenNarrativeContinuation
      );
  }, []);

  const getTargetVolumeByHeroPosition = useCallback(() => {
    const hero = heroSectionRef.current;
    if (!hero) return 0;
    const rect = hero.getBoundingClientRect();
    const travel = Math.max(rect.height * 0.9, 1);
    const progress = Math.min(Math.max((-rect.top) / travel, 0), 1);
    return HERO_LOGGED_IN_AUDIO_VOLUME * (1 - progress);
  }, []);

  const scrollToSection = useCallback((sectionId) => {
    const section = document.querySelector(sectionId);
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const scrollToNextHeroSection = useCallback(() => {
    const target = ['#bienvenida-creador', '#transmedia', '#provoca', '#contact']
      .map((selector) => document.querySelector(selector))
      .find(Boolean);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleOpenMiniverseList = useCallback((tabId = null, contextLabel = null) => {
    if (typeof window !== 'undefined') {
      if (!user) {
        document.documentElement.dataset.bienvenidaFade = 'true';
        setBienvenidaReturnPath(`${location.pathname}${location.search}${location.hash}`);
        pauseHeroAmbient();
        window.setTimeout(() => {
          navigate('/primeracto', { replace: true });
        }, 450);
        return;
      }
      window.dispatchEvent(
        new CustomEvent('gatoencerrado:open-miniverse-list', {
          detail: {
            tabId: typeof tabId === 'string' ? tabId : null,
            contextLabel: typeof contextLabel === 'string' ? contextLabel : null,
          },
        })
      );
    }
  }, [location.hash, location.pathname, location.search, navigate, user]);

  const handleOpenHeroWelcome = useCallback(() => {
    handleOpenMiniverseList(null, 'Explora los miniversos');
  }, [handleOpenMiniverseList]);

  const handleHeroWelcomeKeyDown = useCallback((event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    handleOpenHeroWelcome();
  }, [handleOpenHeroWelcome]);

  const handleCloseTicket = useCallback(() => {
    setIsTicketModalOpen(false);
  }, []);

  useEffect(() => {
    if (!hasActivatedAudio) return undefined;
    const GHOST_PROBABILITY = 0.28;
    const rotate = () => {
      if (Math.random() < GHOST_PROBABILITY) {
        const idx = Math.floor(Math.random() * HERO_GHOST_SUBTITLES.length);
        setHeroGhostSubtitle(HERO_GHOST_SUBTITLES[idx]);
      } else {
        setHeroGhostSubtitle(null);
        setHeroSubtitleIndex((prev) => (prev + 1) % HERO_ROTATING_SUBTITLES.length);
      }
    };

    let intervalId;
    const firstTimeoutId = window.setTimeout(() => {
      rotate();
      intervalId = window.setInterval(rotate, HERO_SUBTITLE_ROTATION_MS);
    }, HERO_SUBTITLE_ROTATION_MS + HERO_SUBTITLE_FIRST_ROTATION_EXTRA_MS);

    return () => {
      window.clearTimeout(firstTimeoutId);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [hasActivatedAudio]);


  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleChange = (event) => setIsMobileViewport(event.matches);
    setIsMobileViewport(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.IntersectionObserver !== 'function') {
      setIsHeroInViewport(true);
      return undefined;
    }
    const section = heroSectionRef.current;
    if (!section) return undefined;
    const observer = new window.IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const isIntersecting = Boolean(entry?.isIntersecting);
        setIsHeroInViewport(isIntersecting);
        if (!isIntersecting) {
          // Apaga el aro pulsante del # del Header (ver Header.jsx) — una vez
          // que el Hero sale de pantalla, ya no hace falta seguir llamando la
          // atención hacia ese destino.
          window.dispatchEvent(new CustomEvent('gatoencerrado:hero-left-viewport'));
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    heroAudioMutedRef.current = isHeroAudioMuted;
  }, [isHeroAudioMuted]);

  useEffect(() => {
    if (isAuthLoading) {
      return undefined;
    }

    const preferredEnabled = readHeroAudioEnabledPreference();
    const nextMuted = preferredEnabled == null
      ? isMobileViewport
      : !preferredEnabled;

    if (preferredEnabled == null) {
      writeHeroAudioEnabledPreference(!nextMuted);
    }

    heroAudioMutedRef.current = nextMuted;
    setIsHeroAudioMuted(nextMuted);
    setIsHeroAudioPlaying(false);

    const audio = getHeroAmbientAudio();
    if (audio) {
      audio.muted = nextMuted;
      audio.volume = nextMuted ? 0 : HERO_LOGGED_IN_AUDIO_VOLUME;
      if (nextMuted && !audio.paused) {
        audio.pause();
      } else if (!nextMuted && hasActivatedAudio && audio.paused) {
        void resumeHeroAmbientPlayback({ targetVolume: HERO_LOGGED_IN_AUDIO_VOLUME });
      }
    }
    return undefined;
  }, [hasActivatedAudio, isAuthLoading, isMobileViewport]);

  // Sincroniza heroAudioMutedRef con el estado compartido de la lib
  // para que el idle-retry no intente reproducir audio muteado desde Header
  useEffect(() => {
    return subscribeHeroAmbient(() => {
      const { isMuted } = getHeroAmbientState();
      heroAudioMutedRef.current = isMuted;
      setIsHeroAudioMuted(isMuted);
    });
  }, []);

  const captureTransmigrationOrigin = useCallback(() => {
    const sourceEl = hashtagAnchorRef.current;
    const destEl = typeof document !== 'undefined'
      ? document.getElementById(HEADER_INDEX_HASHTAG_ID)
      : null;
    if (!sourceEl || !destEl) {
      setTransmigrationOrigin(null);
      return;
    }
    const sourceRect = sourceEl.getBoundingClientRect();
    const destRect = destEl.getBoundingClientRect();
    if (!destRect.width || !destRect.height) {
      setTransmigrationOrigin(null);
      return;
    }
    const sourceCenterX = sourceRect.left + sourceRect.width / 2;
    const sourceCenterY = sourceRect.top + sourceRect.height / 2;
    const destCenterX = destRect.left + destRect.width / 2;
    const destCenterY = destRect.top + destRect.height / 2;
    const scaleRatio = sourceRect.height / destRect.height;
    setTransmigrationOrigin({
      x: sourceCenterX - destCenterX,
      y: sourceCenterY - destCenterY,
      scale: Math.min(Math.max(scaleRatio, 1.6), 3.4),
      // Coordenadas fijas del destino real: el clon vuela renderizado en un
      // portal a document.body, posicionado ahí de reposo (ver JSX abajo).
      destTop: destRect.top,
      destLeft: destRect.left,
      destWidth: destRect.width,
      destHeight: destRect.height,
    });
  }, []);

  const revealHeaderIndexCueFromHero = useCallback(() => {
    if (typeof window === 'undefined') return;
    setHasUsedIndexCue(true);
    writeIndexCueUsedToSession();
    window.dispatchEvent(new CustomEvent('gatoencerrado:hero-index-cue-used'));
  }, []);

  const handleIsotipoClick = useCallback(() => {
    if (!userActivatedRef.current) {
      // Primera activación
      userActivatedRef.current = true;
      if (prefersReducedMotion) {
        revealHeaderIndexCueFromHero();
      } else {
        captureTransmigrationOrigin();
      }
      setHasActivatedAudio(true);
      if (!audioActivatedOnceRef.current) {
        audioActivatedOnceRef.current = true;
        window.dispatchEvent(new CustomEvent('gatoencerrado:audio-activated'));
      }
      if (isHeroAudioMuted) {
        toggleHeroAmbientMuted();
      } else {
        // La escena y el scroll no dependen de que el elemento de audio ya
        // exista. En PWA puede inicializarse unas décimas después; la función
        // compartida reanuda el sonido cuando está disponible sin cancelar la
        // activación narrativa.
        void resumeHeroAmbientPlayback({ targetVolume: HERO_LOGGED_IN_AUDIO_VOLUME });
      }
      return;
    }

    // Toggle de escena: ON ↔ OFF
    if (hasActivatedAudio) {
      setHasActivatedAudio(false);
      setHeroAmbientMuted(true);
      window.dispatchEvent(new CustomEvent('gatoencerrado:audio-deactivated'));
    } else {
      if (prefersReducedMotion) {
        revealHeaderIndexCueFromHero();
      } else {
        captureTransmigrationOrigin();
      }
      setHasActivatedAudio(true);
      setHeroAmbientMuted(false, { targetVolume: HERO_LOGGED_IN_AUDIO_VOLUME });
      window.dispatchEvent(new CustomEvent('gatoencerrado:audio-activated'));
    }
  }, [isHeroAudioMuted, hasActivatedAudio, captureTransmigrationOrigin, prefersReducedMotion, revealHeaderIndexCueFromHero]);

  // Header y Hero son hermanos — cerrar el HUB de accesos rápidos vive en
  // Header.jsx, pero activar la escena (audio + índice) es lógica de Hero.
  // Mismo gesto que ya existe al cerrar PWAInstructionsOverlay
  // (handleDeclineHeroPwaInstall → handleIsotipoClick), coordinado aquí por
  // evento global en vez de subir todo ese estado de audio a un padre común.
  useEffect(() => {
    const handleActivateSceneRequest = () => {
      if (!hasActivatedAudio) handleIsotipoClick();
    };
    window.addEventListener('gatoencerrado:activate-scene-request', handleActivateSceneRequest);
    return () => window.removeEventListener('gatoencerrado:activate-scene-request', handleActivateSceneRequest);
  }, [hasActivatedAudio, handleIsotipoClick]);

  const shouldInterceptHeroActivationForPwa = useCallback(() => (
    isMobileViewport &&
    !user &&
    !isInstalledPwa &&
    !hasActivatedAudio &&
    !readHeroPwaPromptRecentlyDeclined()
  ), [hasActivatedAudio, isInstalledPwa, isMobileViewport, user]);

  const showNextPwaHashWhisper = useCallback(() => {
    const now = Date.now();
    if (now - lastPwaHashWhisperAtRef.current < 650) return;
    lastPwaHashWhisperAtRef.current = now;
    // Los whispers arman una secuencia narrativa deliberada (de "¿me voy
    // contigo?" a "instálame como aplicación") — al azar podían salir fuera
    // de orden. Ahora avanzan uno por uno y dan la vuelta al llegar al final.
    const nextIndex = (lastPwaHashWhisperIndexRef.current + 1) % PWA_HASH_WHISPERS.length;
    lastPwaHashWhisperIndexRef.current = nextIndex;
    setPwaHashWhisper({
      id: now,
      text: PWA_HASH_WHISPERS[nextIndex],
    });
    if (pwaHashWhisperTimerRef.current) {
      window.clearTimeout(pwaHashWhisperTimerRef.current);
    }
    pwaHashWhisperTimerRef.current = window.setTimeout(() => {
      setPwaHashWhisper(null);
      pwaHashWhisperTimerRef.current = null;
    }, 1650);
  }, []);

  useEffect(() => () => {
    if (pwaHashWhisperTimerRef.current) {
      window.clearTimeout(pwaHashWhisperTimerRef.current);
    }
  }, []);

  const handleHeroHashClick = useCallback(() => {
    // En Estado Cero la espiral debe completar el viaje antes de que el gato
    // responda. Sin este guard, un clic temprano rompería la causalidad de la
    // coreografía aunque el símbolo todavía no se hubiera encendido.
    if (!isHeroThresholdReady) return;
    // Mismo trato que PWAInstructionsOverlay: mientras el HUB de accesos
    // rápidos (Header.jsx) está abierto, el # 3D no activa la escena por su
    // cuenta — solo la × del HUB lo hace. Lectura síncrona vía dataset
    // porque este estado vive en un componente hermano, no en un padre.
    if (typeof document !== 'undefined' && document.body?.dataset.gatHubOpen === 'true') {
      return;
    }
    if (isHeroPwaInstructionsOpen) {
      showNextPwaHashWhisper();
      return;
    }
    if (shouldInterceptHeroActivationForPwa()) {
      setIsHeroPwaInstructionsOpen(true);
      return;
    }
    handleIsotipoClick();
  }, [
    handleIsotipoClick,
    isHeroThresholdReady,
    isHeroPwaInstructionsOpen,
    shouldInterceptHeroActivationForPwa,
    showNextPwaHashWhisper,
  ]);

  // Único punto de salida del sheet de instrucciones (la X) — cerrar
  // siempre continúa a la escena, nunca deja al usuario "varado" con el
  // hashtag inerte.
  const handleDeclineHeroPwaInstall = useCallback(() => {
    safeSetItem(HERO_PWA_PROMPT_DECLINED_KEY, String(Date.now()));
    setPwaHashWhisper(null);
    setIsHeroPwaInstructionsOpen(false);
    handleIsotipoClick();
  }, [handleIsotipoClick]);

  const handleHeroHashKeyDown = useCallback((event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    handleHeroHashClick();
  }, [handleHeroHashClick]);

  useEffect(() => {
    if (!hasActivatedAudio || hasUsedIndexCue || isHeroInViewport) return;
    revealHeaderIndexCueFromHero();
  }, [hasActivatedAudio, hasUsedIndexCue, isHeroInViewport, revealHeaderIndexCueFromHero]);

  useEffect(() => {
    if (isAuthLoading) {
      return undefined;
    }

    const audio = getHeroAmbientAudio();
    if (!audio) {
      setIsHeroAudioPlaying(false);
      return undefined;
    }

    let rafId = 0;
    let idleRetryId = 0;
    let mounted = true;
    let shouldResumeAfterVisibility = false;
    let fallbackApplied = false;
    let requiresInteractionAfterBackground = false;
    let isInBackground = false;
    let isShowcaseForeground =
      typeof document !== 'undefined' &&
      (document.documentElement.dataset.gatoShowcaseOpen === 'true' ||
        document.documentElement.dataset.miniverseOpen === 'true');
    let isExternalAmbientHold =
      typeof document !== 'undefined' &&
      document.documentElement.dataset.gatoHeroAmbientHold === 'true';

    audioGestureUnlockRef.current = false;
    lastHeroAudioPlayAttemptRef.current = 0;

    const isShowcaseForegroundActive = () => {
      if (isHeroInViewport) return false;
      const showcaseOpen =
        isShowcaseForeground ||
        (typeof document !== 'undefined' &&
          (document.documentElement.dataset.gatoShowcaseOpen === 'true' ||
            document.documentElement.dataset.miniverseOpen === 'true'));
      if (typeof document === 'undefined') {
        return showcaseOpen || isExternalAmbientHold;
      }
      return (
        showcaseOpen ||
        document.documentElement.dataset.gatoHeroAmbientHold === 'true'
      );
    };

    const attemptPlay = async ({ fromUserGesture = false } = {}) => {
      if (!mounted) return;
      // Ninguna audiencia descarga audio antes de activar la escena.
      if (!userActivatedRef.current) return;
      if (isInBackground) return;
      if (!fromUserGesture && document.visibilityState !== 'visible') return;
      if (isShowcaseForegroundActive()) return;
      if (heroAudioMutedRef.current) return;
      if (!fromUserGesture && requiresInteractionAfterBackground) return;
      const now = performance.now();
      if (!fromUserGesture && now - lastHeroAudioPlayAttemptRef.current < HERO_AUDIO_PLAY_RETRY_MS) return;

      lastHeroAudioPlayAttemptRef.current = now;
      const playbackStarted = await resumeHeroAmbientPlayback({
        targetVolume: audio.volume > HERO_AUDIO_MIN_AUDIBLE_VOLUME
          ? audio.volume
          : HERO_LOGGED_IN_AUDIO_VOLUME,
        allowMutedWarmup: !fromUserGesture,
      });
      audioGestureUnlockRef.current = playbackStarted;
    };

    const updateAudioByScroll = () => {
      if (!audio) return;
      if (isShowcaseForegroundActive()) {
        if (!audio.paused) {
          audio.pause();
        }
        return;
      }
      if (heroAudioMutedRef.current) {
        if (!audio.paused) {
          audio.pause();
        }
        audio.muted = true;
        audio.volume = 0;
        return;
      }
      const targetVolume = getTargetVolumeByHeroPosition();
      audio.muted = false;
      audio.volume = targetVolume;

      if (targetVolume <= HERO_AUDIO_MIN_AUDIBLE_VOLUME) {
        if (!audio.paused) {
          audio.pause();
        }
        return;
      }

      if (audio.paused) {
        void attemptPlay();
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(updateAudioByScroll);
    };

    const onFirstInteraction = () => {
      if (heroAudioMutedRef.current) return;
      requiresInteractionAfterBackground = false;
      if (!audio.paused) return;
      const targetVolume = getTargetVolumeByHeroPosition();
      if (targetVolume <= HERO_AUDIO_MIN_AUDIBLE_VOLUME) return;
      audio.muted = false;
      audio.volume = targetVolume;
      void attemptPlay({ fromUserGesture: true });
    };

    const pauseForBackground = ({ forceInteractionToResume = false } = {}) => {
      shouldResumeAfterVisibility = !audio.paused && audio.volume > HERO_AUDIO_MIN_AUDIBLE_VOLUME;
      if (forceInteractionToResume) {
        requiresInteractionAfterBackground = true;
      }
      audio.pause();
      audio.muted = heroAudioMutedRef.current;
      audio.volume = HERO_LOGGED_IN_AUDIO_VOLUME;
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        pauseForBackground();
        return;
      }

      updateAudioByScroll();
      if (shouldResumeAfterVisibility) {
        void attemptPlay();
      }
      shouldResumeAfterVisibility = false;
    };

    const onWindowBlur = () => {
      isInBackground = true;
      pauseForBackground();
    };

    const onWindowFocus = () => {
      isInBackground = false;
      if (document.visibilityState !== 'visible') return;
      updateAudioByScroll();
      if (shouldResumeAfterVisibility) {
        void attemptPlay();
      }
      shouldResumeAfterVisibility = false;
    };

    const onPageHide = () => {
      pauseForBackground({ forceInteractionToResume: true });
    };

    const onPageFreeze = () => {
      pauseForBackground({ forceInteractionToResume: true });
    };

    const onAudioError = () => {
      if (fallbackApplied) return;
      fallbackApplied = true;
      audio.src = HERO_LOGGED_IN_AUDIO_FALLBACK_URL;
      audio.load();
      void attemptPlay();
    };

    const onAudioPlay = () => {
      setIsHeroAudioPlaying(true);
    };
    const onAudioPause = () => {
      setIsHeroAudioPlaying(false);
    };

    const onShowcaseVisibility = (event) => {
      const open = Boolean(event?.detail?.open);
      isShowcaseForeground = open;
      if (open) {
        if (isHeroInViewport) return;
        shouldResumeAfterVisibility = !audio.paused && audio.volume > HERO_AUDIO_MIN_AUDIBLE_VOLUME;
        audio.pause();
        return;
      }
      updateAudioByScroll();
      if (!requiresInteractionAfterBackground) {
        void attemptPlay();
      }
    };

    const onExternalAmbientHold = (event) => {
      const hold = Boolean(event?.detail?.hold);
      isExternalAmbientHold = hold;
      if (typeof document !== 'undefined') {
        if (hold) {
          document.documentElement.dataset.gatoHeroAmbientHold = 'true';
        } else {
          delete document.documentElement.dataset.gatoHeroAmbientHold;
        }
      }
      if (hold) {
        if (isHeroInViewport) return;
        shouldResumeAfterVisibility = !audio.paused && audio.volume > HERO_AUDIO_MIN_AUDIBLE_VOLUME;
        audio.pause();
        return;
      }
      updateAudioByScroll();
      if (!requiresInteractionAfterBackground) {
        void attemptPlay();
      }
    };

    audio.muted = heroAudioMutedRef.current;
    audio.volume = heroAudioMutedRef.current ? 0 : HERO_LOGGED_IN_AUDIO_VOLUME;
    setIsHeroAudioPlaying(!audio.paused && !heroAudioMutedRef.current);

    void attemptPlay();
    updateAudioByScroll();
    idleRetryId = window.setInterval(() => {
      if (isInBackground || !document.hasFocus() || document.visibilityState !== 'visible') {
        if (!audio.paused) audio.pause();
        return;
      }
      if (requiresInteractionAfterBackground) return;
      if (!audio.paused) return;
      const targetVolume = getTargetVolumeByHeroPosition();
      if (targetVolume <= HERO_AUDIO_MIN_AUDIBLE_VOLUME) return;
      audio.volume = targetVolume;
      void attemptPlay();
    }, HERO_AUDIO_IDLE_RETRY_MS);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scroll', onFirstInteraction, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('pointerdown', onFirstInteraction, { passive: true });
    window.addEventListener('click', onFirstInteraction, { passive: true });
    window.addEventListener('mousedown', onFirstInteraction, { passive: true });
    window.addEventListener('touchstart', onFirstInteraction, { passive: true });
    window.addEventListener('wheel', onFirstInteraction, { passive: true });
    window.addEventListener('keydown', onFirstInteraction);
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('focus', onWindowFocus);
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('freeze', onPageFreeze);

    audio.addEventListener('play', onAudioPlay);
    audio.addEventListener('pause', onAudioPause);
    audio.addEventListener('ended', onAudioPause);
    audio.addEventListener('error', onAudioError);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('gatoencerrado:showcase-visibility', onShowcaseVisibility);
    window.addEventListener('gatoencerrado:hero-ambient-hold', onExternalAmbientHold);

    return () => {
      mounted = false;
      cancelAnimationFrame(rafId);
      window.clearInterval(idleRetryId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', onFirstInteraction);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('click', onFirstInteraction);
      window.removeEventListener('mousedown', onFirstInteraction);
      window.removeEventListener('touchstart', onFirstInteraction);
      window.removeEventListener('wheel', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('focus', onWindowFocus);
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('freeze', onPageFreeze);
      audio.removeEventListener('play', onAudioPlay);
      audio.removeEventListener('pause', onAudioPause);
      audio.removeEventListener('ended', onAudioPause);
      audio.removeEventListener('error', onAudioError);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('gatoencerrado:showcase-visibility', onShowcaseVisibility);
      window.removeEventListener('gatoencerrado:hero-ambient-hold', onExternalAmbientHold);
      if (typeof document !== 'undefined') {
        delete document.documentElement.dataset.gatoHeroAmbientHold;
      }
    };
  }, [getTargetVolumeByHeroPosition, isAuthLoading, isHeroInViewport]);

  return (
    <>
      <section
        id="hero"
        ref={heroSectionRef}
        className="min-h-screen relative overflow-hidden flex flex-col"
      >
        <AnimatePresence>
          {/* Mismo criterio que isHashtag3DRetired: si el HUB ya abrió solo
              (usuario que regresa con GAT>0), la escena ya cuenta como
              activada aunque hasActivatedAudio nunca se haya puesto true a
              mano — el entorno del ritual (estrellas) no debe seguir
              montado detrás del HUB. */}
          {!isHashtag3DRetired && (
              <motion.div
                key="hero-starfield"
                aria-hidden="true"
                className="hero-starfield"
                initial={false}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 1.3, ease: 'easeOut' } }}
              >
                {heroStars.map((star) => (
                  <span
                    key={star.id}
                    className={`hero-star hero-star--${star.tier}${star.twinkle ? ' hero-star--twinkle' : ''}`}
                    style={{
                      top: `${star.y}%`,
                      left: `${star.x}%`,
                      width: `calc(${star.size}px * var(--hero-star-size-scale, 1))`,
                      height: `calc(${star.size}px * var(--hero-star-size-scale, 1))`,
                      opacity: star.opacity,
                      '--star-glow': star.glow,
                      '--star-opacity': star.opacity,
                      '--twinkle-delay': `${star.twinkleDelay}s`,
                      '--twinkle-duration': `${star.twinkleDuration}s`,
                    }}
                  />
                ))}
                {heroShootingStars.map((shootingStar) => (
                  <span
                    key={`shooting-${shootingStar.id}`}
                    className="hero-shooting-star"
                    style={{
                      top: `${shootingStar.y}%`,
                      left: `${shootingStar.x}%`,
                      '--shoot-delay': `${shootingStar.delay}s`,
                      '--shoot-duration': `${shootingStar.duration}s`,
                    }}
                  />
                ))}
                {gestureShootingStars.map((star) => (
                  <span
                    key={`gesture-shooting-${star.id}`}
                    className="hero-shooting-star hero-shooting-star--instant"
                    style={{ top: `${star.y}%`, left: `${star.x}%` }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        {/* Contenido */}
          <div
            ref={heroContentRef}
            className="container mx-auto px-6 text-center relative z-10 flex-1 flex flex-col"
          >

              <AnimatePresence>
                {shouldShowHeroInactiveHint ? (
                  <HeroInactiveSignal
                    key="hero-inactive-signal"
                    prefersReducedMotion={prefersReducedMotion}
                    centerY={heroSignalCenterY}
                    onReachThreshold={handleHeroSignalReachedThreshold}
                  />
                ) : null}
              </AnimatePresence>

              {/* TOP HALF — hash fijo de marca hasta la línea central */}
              <div className="relative flex flex-1 items-end justify-center">
                <div className="flex flex-col items-center">
                  <motion.div
                    ref={heroLogoAnchorRef}
                    aria-hidden="true"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: hasActivatedAudio ? 1 : 0, y: 0 }}
                    transition={{ duration: hasActivatedAudio ? 0.9 : 1, delay: hasActivatedAudio ? 0 : 0.8 }}
                    className="hero-logo hero-logo--portal"
                    style={{
                      width: 'var(--hero-portal-logo-size)',
                      marginBottom: 'clamp(1.05rem, 2.6vh, 1.7rem)',
                      pointerEvents: 'none',
                      visibility: hasActivatedAudio ? 'visible' : 'hidden',
                    }}
                  >
                    <div className="hero-logo-visual">
                      <img
                        src={isotipoGatoWebp}
                        alt=""
                        className="hero-logo-img"
                        fetchpriority="high"
                      />
                      {hasActivatedAudio ? (
                        <span className="hero-logo-orb-reflection" />
                      ) : null}
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* LÍNEA CENTRAL — GATOENCERRADO ancla el 50vh */}
              <div className="max-w-4xl lg:max-w-[72rem] mx-auto w-full">
                {/* Mientras el sheet de instalación está abierto, el título se
                    retira casi del todo: es el único elemento del Hero que
                    compite de verdad con los pasos —el ícono del paso 4 aterriza
                    justo encima de sus letras—. Las estrellas y el # se quedan,
                    porque son textura y no se leen (Carlos, 21 sep 2026). */}
                <h1
                  className="hero-title-stage text-center w-full break-words transition-opacity duration-700"
                  style={{ opacity: isHeroPwaInstructionsOpen ? 0.12 : 1 }}
                  aria-label={HERO_BRAND_LABEL}
                >
                  {/* Esta capa invisible reserva siempre las mismas métricas. Las
                      dos pinturas visibles se funden encima sin cambiar layout. */}
                  <span className="hero-title hero-title--measure" aria-hidden="true">
                    <span>{HERO_TITLE}</span>
                  </span>

                  <span
                    className="hero-title hero-title--pre-scene hero-title-layer hero-title-layer--pre"
                    style={{
                      // La antesala no repite la marca: el nombre aparece al
                      // abrir la escena. La capa de medida evita saltos.
                      opacity: 0,
                      filter: 'brightness(0.84) contrast(1.08)',
                    }}
                    aria-hidden="true"
                  >
                    <span>{HERO_TITLE}</span>
                  </span>

                  <span
                    className="hero-title hero-title--scene-active hero-title-layer hero-title-layer--active"
                    style={{
                      opacity: hasActivatedAudio ? (isMobileViewport ? 1 : 0.96) : 0,
                      filter: isMobileViewport
                        ? 'brightness(1.12) contrast(1.08)'
                        : 'brightness(1) contrast(1.05)',
                    }}
                    aria-hidden="true"
                  >
                    <span>{heroTitleDisplay}</span>
                  </span>
                </h1>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: hasActivatedAudio ? 1.1 : 0.8, ease: 'easeOut', delay: hasActivatedAudio ? 0 : 0.25 }}
                  className="mt-2 flex justify-center px-8"
                >
                  <span className="hero-subtitle-track relative inline-flex min-h-[2.8rem] max-w-[42rem] items-center justify-center text-center text-[0.78rem] leading-snug tracking-[0.18em] text-slate-200/70 sm:min-h-[1.8rem] sm:text-sm">
                    <span className="invisible">{HERO_ROTATING_SUBTITLE_PLACEHOLDER}</span>
                    <AnimatePresence mode="sync" initial={false}>
                      {hasActivatedAudio ? (
                        <motion.span
                          key={currentHeroSubtitle}
                          initial={{ opacity: 0, filter: 'blur(14px)' }}
                          animate={{
                            opacity: 1,
                            filter: 'blur(0px)',
                            transition: {
                              duration: 1.8,
                              ease: [0.2, 1, 0.2, 1],
                              delay: 0,
                            },
                          }}
                          exit={{
                            opacity: 0,
                            filter: 'blur(14px)',
                            transition: {
                              duration: 1.8,
                              ease: [0.2, 1, 0.2, 1],
                              delay: 0,
                            },
                          }}
                          className={`hero-subtitle-copy absolute inset-0 inline-flex items-center justify-center ${isHeroGhostSubtitle ? 'italic' : 'not-italic'}`}
                        >
                          {currentHeroSubtitle}
                        </motion.span>
                      ) : null}
                    </AnimatePresence>
                  </span>
                </motion.div>
                <div className="hero-central-spacer relative mt-5 h-12 sm:mt-2" aria-hidden="true" />
              </div>

              {/* BOTTOM HALF — objeto de obsidiana (gatillo de activación) */}
              <div className="flex-1 flex flex-col items-center justify-start pt-2">

              {/* Hash prerenderizado — al activarse se desvanece rápido para
                  dar paso al # plano que "transmigra" hacia el botón de índice, sin que
                  ambos coexistan visiblemente */}
              <motion.div
                ref={hashtagAnchorRef}
                initial={{ opacity: HERO_HASH_INSINUATED_OPACITY, scale: 0.94 }}
                animate={{
                  opacity: hasActivatedAudio
                    ? 0
                    : shouldHoldHashtagInsinuated
                      ? HERO_HASH_INSINUATED_OPACITY
                      : 1,
                  scale: 1,
                }}
                transition={{
                  ease: 'easeOut',
                  // La escala se asienta tras la cascada de ecos, como siempre:
                  // el # se acomoda en el espacio sin encenderse.
                  scale: {
                    duration: hasActivatedAudio ? 0.18 : 1,
                    delay: hasActivatedAudio
                      ? 0
                      : prefersReducedMotion
                        ? 0.12
                        : HERO_INACTIVE_SIGNAL_REVEAL_MS / 1000,
                  },
                  // La opacidad plena florece cuando la última capa alcanza el
                  // umbral; no lleva un segundo retardo porque el temporizador
                  // del eco ya marca ese instante.
                  opacity: {
                    duration: hasActivatedAudio ? 0.18 : 1,
                    delay:
                      hasActivatedAudio || shouldShowHeroInactiveHint
                        ? 0
                        : HERO_INACTIVE_SIGNAL_REVEAL_MS / 1000,
                  },
                }}
                className="hero-title-mark-slot mt-8 -translate-y-[7vh] sm:mt-10 sm:translate-y-0 md:mt-12"
                style={{
                  pointerEvents:
                    hasActivatedAudio || !isHeroThresholdReady ? 'none' : 'auto',
                }}
                role="button"
                tabIndex={hasActivatedAudio || !isHeroThresholdReady ? -1 : 0}
                onKeyDown={handleHeroHashKeyDown}
                aria-hidden={hasActivatedAudio}
                aria-label="Activar escena"
                aria-disabled={!isHeroThresholdReady}
                onClick={handleHeroHashClick}
              >
                <div className="hero-pwa-hash-whisper-anchor" aria-live="polite">
                  <AnimatePresence mode="wait">
                    {isHeroPwaInstructionsOpen && pwaHashWhisper ? (
                      <motion.span
                        key={pwaHashWhisper.id}
                        initial={{ opacity: 0, y: 7, scale: 0.98, filter: 'blur(7px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -5, scale: 0.99, filter: 'blur(5px)' }}
                        transition={{
                          duration: prefersReducedMotion ? 0.14 : 0.34,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="hero-pwa-hash-whisper"
                      >
                        {pwaHashWhisper.text}
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </div>
                {/* El mismo [#] tipográfico del Programa de mano sustituye al
                    objeto 3D sin alterar la coreografía original del Hero. */}
                <span
                  aria-hidden="true"
                  className={`hero-hashtag-prerendered header-hashtag-mark hero-threshold-index-mark ${hasEchoReachedThreshold || isHeroPwaInstructionsOpen ? 'hero-hashtag-prerendered--awake' : ''}`}
                >
                  [#]
                </span>
              </motion.div>

              {/* El mismo # del gatillo de activación "transmigra" directo a su
                  destino final: el # real del Header (esquina superior
                  izquierda, ver Header.jsx#header-index-hashtag). Se renderiza
                  en un portal a document.body porque el Header vive fijo
                  (position: fixed) fuera del flujo del Hero. Al llegar, revela
                  ese # real (revealHeaderIndexCueFromHero) y se desvanece. */}
              {hasActivatedAudio && typeof document !== 'undefined'
                ? createPortal(
                    <AnimatePresence>
                      {!hasUsedIndexCue && transmigrationOrigin ? (
                        <motion.span
                          key="hero-hashtag-transmigrated"
                          initial={{
                            x: transmigrationOrigin.x,
                            y: transmigrationOrigin.y,
                            scale: transmigrationOrigin.scale,
                            opacity: 0.9,
                          }}
                          animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                          exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeOut' } }}
                          transition={{
                            opacity: { duration: 0.22, ease: 'easeOut' },
                            x: { duration: 0.85, ease: [0.45, 0, 0.15, 1] },
                            y: { duration: 0.85, ease: [0.45, 0, 0.15, 1] },
                            scale: { duration: 0.85, ease: [0.45, 0, 0.15, 1] },
                          }}
                          onAnimationComplete={() => revealHeaderIndexCueFromHero()}
                          className="header-hashtag-mark text-2xl inline-flex fixed pointer-events-none"
                          style={{
                            top: transmigrationOrigin.destTop,
                            left: transmigrationOrigin.destLeft,
                            width: transmigrationOrigin.destWidth,
                            height: transmigrationOrigin.destHeight,
                            zIndex: 60,
                          }}
                          aria-hidden="true"
                        >
                          [#]
                        </motion.span>
                      ) : null}
                    </AnimatePresence>,
                    document.body,
                  )
                : null}

              </div>{/* /bottom half */}

          </div>
          <AnimatePresence>
            {hasActivatedAudio ? (
              <motion.button
                key="hero-scroll-cue"
                type="button"
                initial={{ opacity: 0, y: -4, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -4, filter: 'blur(8px)' }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.35 }}
                onClick={scrollToNextHeroSection}
                className="hero-scroll-cue hero-scroll-cue--hero-bottom"
                aria-label="Continuar hacia la siguiente sección"
              >
                <svg
                  className="hero-scroll-cue__glyph"
                  viewBox="0 0 32 34"
                  fill="none"
                  aria-hidden="true"
                >
                  <path className="hero-scroll-cue__echo hero-scroll-cue__echo--far" d="M8 6.5 16 14l8-7.5" />
                  <path className="hero-scroll-cue__echo hero-scroll-cue__echo--near" d="M8 13.5 16 21l8-7.5" />
                  <path className="hero-scroll-cue__echo hero-scroll-cue__echo--primary" d="M8 20.5 16 28l8-7.5" />
                </svg>
              </motion.button>
            ) : null}
          </AnimatePresence>
      </section>
      <Suspense fallback={null}>
        <TicketPurchaseModal open={isTicketModalOpen} onClose={handleCloseTicket} />
        <VideoNarrativeAutoplay
          key={`${autoVideoFormatId ?? 'none'}-${isAutoVideoOpen ? 'open' : 'closed'}-${isMobileViewport ? 'mobile' : 'desktop'}`}
          open={isAutoVideoOpen}
          onClose={() => setIsAutoVideoOpen(false)}
          formatId={autoVideoFormatId}
          isMobileViewport={isMobileViewport}
          videoUrl={narrativeVideoUrl}
          enabled={RESONANCE_BRIDGE_VIDEO_ENABLED}
        />
        <GatokensRevealModal
          open={isGatokensModalOpen}
          isUmbral={isUmbralReveal}
          onDecline={() => {
            setIsGatokensModalOpen(false);
            setIsUmbralReveal(false);
            if (!user) {
              safeSetItem(POZO_HERO_REVEAL_KEY, '1');
              window.dispatchEvent(new CustomEvent('gatoencerrado:pozo-hero-revealed'));
            }
          }}
          onProvoca={() => {
            setIsGatokensModalOpen(false);
            try {
              const raw = localStorage.getItem('gatoencerrado:provoca-draft');
              const quote = raw ? JSON.parse(raw)?.quote ?? '' : '';
              window.dispatchEvent(
                new CustomEvent('gatoencerrado:provoca-draft', { detail: { quote } })
              );
            } catch {}
            scrollToSection('#provoca');
          }}
          onClose={() => {
            setIsGatokensModalOpen(false);
            setIsUmbralReveal(false);
            if (!user) {
              safeSetItem(POZO_HERO_REVEAL_KEY, '1');
              window.dispatchEvent(new CustomEvent('gatoencerrado:pozo-hero-revealed'));
            }
            // Continuidad: si había un miniverso recomendado, el viewport
            // llega a la vitrina en vez de dejar al usuario donde sea que
            // esté — ORACULO_RECOMMENDED_SHOWCASE_KEY ya se guardó arriba,
            // así que Transmedia.jsx lo resalta solo al montar/re-renderizar.
            if (recommendedVitranaId) {
              window.setTimeout(() => scrollToSection('#transmedia'), 60);
            }
          }}
        />
      </Suspense>
      <PWAInstructionsOverlay
        isOpen={isHeroPwaInstructionsOpen}
        onClose={handleDeclineHeroPwaInstall}
        eyebrow={PWA_INSTRUCTIONS_EYEBROW}
        subtitle={PWA_INSTRUCTIONS_SUBTITLE}
      />
      {/* La app instalada entra directo a la escena; esto sólo se ve la
          primera vez que se abre desde la pantalla de inicio, y el toque que
          lo cierra es el que deja sonar la música. */}
      <PWAFirstLaunchWelcome />
    </>
  );
};

export default Hero;
