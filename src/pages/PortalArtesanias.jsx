import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Hand, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';
import ContributionModal from '@/components/ContributionModal';
import PortalAuthButton from '@/components/PortalAuthButton';
import PortalHeaderActions from '@/components/portal/PortalHeaderActions';
import ARExperience from '@/components/ar/ARExperience';
import IAInsightCard from '@/components/IAInsightCard';
import CollaboratorsPanel from '@/components/portal/CollaboratorsPanel';
import RelatedReadingTooltipButton from '@/components/portal/RelatedReadingTooltipButton';
import { recordShowcaseLike } from '@/services/showcaseLikeService';
import { startDirectMerchCheckout } from '@/lib/merchCheckout';
import { supabase } from '@/lib/supabaseClient';
import { sanitizeExternalHttpUrl } from '@/lib/urlSafety';
import { hasEnoughGAT } from '@/lib/gatAccess';
import { usePortalTracking } from '@/hooks/usePortalTracking';
import { useVitranaQuestion } from '@/hooks/useVitranaQuestion';
import { ensureAnonId } from '@/lib/identity';

const MARIANA_GALLERY = [
  {
    type: 'image',
    url: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/prototito_transmedia.jpeg',
    caption: '#Cat.in.a.Box',
  },
];

const ARTESANIAS_INTRO =       (
<>
  <p className="text-base leading-relaxed text-slate-300">
     Cada pieza está vinculada a un sentimiento; cada sentimiento, a una historia personal.
  </p>

  <p className="text-base leading-relaxed text-slate-300 mt-3">
    En el universo #GatoEncerrado, las artesanías no son simple mercancía ni souvenir. 
    Son pequeñas piezas narrativas que acompañan conversaciones, silencios y momentos de reflexión compartida.
  </p>

          <p className="text-lg leading-relaxed font-medium text-white mt-4">
    A veces las historias aparecen mientras sostenemos algo entre las manos.
  </p>
</>
);
const ARTESANIAS_SUBTITLE =       (
<>
  <p className="text-base leading-relaxed text-slate-300">
    Un objeto cotidiano convertido en <strong>símbolo de comunión</strong>.<br/>
  </p>
</>
);
const ARTESANIAS_NOTE = 'Apunta tu cámara y aparecera tu frase';
const ARTESANIAS_IMAGE =
  'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/taza_h.png';
const ARTESANIAS_PHRASES = ['Esto no es una taza, es un umbral.'];
const ARTESANIAS_INSTRUCTIONS = [
  'Permite el acceso a tu cámara para iniciar.',
  'Coloca la taza completa en cuadro, con buena iluminación.',
  'Mantén el marcador visible hasta que aparezca una orbe.',
];
const ARTESANIAS_COLLABORATORS = [
  {
    id: 'miroslava-wilson',
    name: 'Miroslava Wilson',
    role: 'Vinculacion y gestion institucional',
    bio: 'Acompañó el proceso que permitio integrar la taza al circuito institucional del CECUT, facilitando su presencia como parte de la preventa de la obra.',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/Miroslava%20.jpg',
  },
  {
    id: 'taller-paco-padilla',
    name: 'Taller Paco Padilla',
    role: 'Cerámica artesanal de Tlaquepaque',
    bio: 'Puso sus manos y su fuego en la primera serie de tazas del universo. Cada pieza salio de su horno con una vibración artesanal unica.',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/pacopadilla.jpeg',
  },
  {
    id: 'yeraldin-roman',
    name: 'Yeraldín Roman',
    role: 'Diseñoo gráfico, fotografía y enlace local',
    bio: 'Afino la estética de la taza y registro marcas que hacen de #GatoEncerrado un universo.',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/yeraldin.png',
  },
  {
    id: 'rocio-morgan',
    name: 'Rocío Morgan',
    role: 'Coordinación de entregas',
    bio: 'Coordino la entrega de las primeras tazas y las primeras activaciones del objeto artesanal.',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/rocio.jpg',
  },
  {
    id: 'mariana-nunez',
    name: 'Mariana Núñez de León',
    role: 'Cerámica · Experimentación y objeto narrativo',
    bio: 'Ceramista tijuanense cuya práctica explora el molde, el volumen y la experimentación material. En #GatoEncerrado articula el paso de lo digital a lo físico, integrando la cerámica como parte del sistema narrativo donde el proceso y sus contingencias forman parte de la obra.',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/mariana-nunez.png',
  },
];
const ARTESANIAS_NOTA_AUTORAL = {
  title: '#ElSentidoEnLasManos',
  verse: 'Tomé un objeto.\nSu forma me sostuvo.\nSu sentido calmó mis manos.',
};
const ARTESANIAS_TILE = {
  gradient: 'linear-gradient(135deg, rgba(44,20,30,0.95), rgba(101,45,66,0.85), rgba(196,111,86,0.6))',
  border: 'rgba(251,191,36,0.35)',
  text: '#fef3c7',
  accent: '#fde68a',
  background: 'rgba(44,20,30,0.72)',
};
const ARTESANIAS_IA_PROFILE = {
  type: 'IA ligera para pistas contextuales + WebAR.',
  interaction: '1 activación guiada por objeto (escaneo breve).',
  tokensRange: '90-140 tokens por activación.',
  coverage: 'Cubierto por suscriptores; no hay costo directo por usuario.',
  footnote: 'La IA solo guia la pista; el ritual lo completa quien sostiene la taza.',
};
const ARTESANIAS_BLOG_KEYS = [
  'lataza',
  'la_taza',
  'la-taza',
  'artesanias',
  'taza',
  'miniversotaza',
  'miniverso_taza',
  'miniverso-taza',
];
const ARTESANIAS_BLOG_KEY_SET = new Set(ARTESANIAS_BLOG_KEYS.map((key) => key.trim().toLowerCase()));

const MiniVersoCard = ({ title, verse, palette }) => {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className="relative [perspective:1200px]" onClick={() => setIsActive((prev) => !prev)}>
      <motion.div
        animate={{ rotateY: isActive ? 180 : 0 }}
        transition={{ duration: 0.7, ease: 'easeInOut' }}
        className="relative min-h-[220px] [transform-style:preserve-3d]"
      >
        <div
          className="absolute inset-0 rounded-2xl border flex flex-col items-center justify-center gap-4 text-sm [backface-visibility:hidden]"
          style={{
            backgroundImage: palette.gradient,
            borderColor: palette.border,
            color: palette.text,
          }}
        >
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-[0.6rem] uppercase tracking-[0.35em] shadow-lg"
            style={{
              color: palette.accent,
              backgroundColor: `${palette.background}cc`,
              border: `1px solid ${palette.border}`,
            }}
          >
            {title}
          </span>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/15 text-white/85 shadow-[0_0_16px_rgba(255,255,255,0.18)]">
            <Hand size={16} className="animate-pulse" />
          </span>
        </div>
        <div
          className="absolute inset-0 rounded-2xl border px-6 py-5 [backface-visibility:hidden] flex items-center justify-center text-sm"
          style={{
            backgroundImage: palette.gradient,
            borderColor: palette.border,
            color: palette.text,
            transform: 'rotateY(180deg)',
          }}
        >
          <p className="leading-relaxed whitespace-pre-line text-center font-light">{verse}</p>
        </div>
      </motion.div>
    </div>
  );
};

const ShowcaseReactionInline = ({ status, onReact }) => (
  <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-500">Resonancia colectiva</p>
        <p className="text-sm text-slate-300 leading-relaxed">
          Haz clic y deja un pulso para mantener vivo el ritual de la taza.
        </p>
      </div>
      <button
        type="button"
        onClick={onReact}
        className={`rounded-full p-3 transition ${
          status === 'success'
            ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-yellow-500 shadow-[0_0_25px_rgba(244,114,182,0.6)] text-white border border-transparent'
            : 'bg-gradient-to-r from-purple-600/80 to-indigo-600/80 text-white hover:from-purple-500 hover:to-indigo-500'
        }`}
        disabled={status === 'loading'}
      >
        <Heart size={20} />
      </button>
    </div>
    <p className="text-xs uppercase tracking-[0.3em] text-purple-300">
      {status === 'loading' ? 'Enviando...' : 'Resonar con la taza'}
    </p>
  </div>
);

const GaleriaMarianaCard = ({ index, setIndex, onCtaClick }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col gap-5">
    {index === null ? (
      <>
        <div className="border-l-2 border-amber-400/50 pl-4 space-y-2">
          <div>
            <p className="font-display text-base text-slate-100">#Cat.in.a.Box</p>
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500 mt-1">Cerámica esmaltada · 2026</p>
          </div>
          <p className="text-sm text-slate-300/80 leading-relaxed">
            Este &ldquo;gato&rdquo; —el hashtag que usamos en código y redes para conectar— aquí se vuelve objeto: un volumen que cabe en una caja.
          </p>
          <p className="text-sm text-slate-300/80 leading-relaxed">
            Ya no organiza contenido; se guarda. Un nodo físico dentro del sistema transmedial de #GatoEncerrado.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIndex(0)}
          className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/10"
        >
          <img
            src={MARIANA_GALLERY[0].url}
            alt={MARIANA_GALLERY[0].caption}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <p className="text-xs uppercase tracking-[0.35em] text-white">Ver proceso</p>
          </div>
        </button>
        {onCtaClick && (
          <button
            type="button"
            onClick={onCtaClick}
            className="w-full rounded-full border border-amber-400/40 py-2 text-xs uppercase tracking-[0.35em] text-amber-300 transition-colors hover:bg-amber-400/10"
          >
            Inscríbete al taller
          </button>
        )}
      </>
    ) : (
      <>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIndex(null)}
            className="text-xs uppercase tracking-[0.3em] text-amber-400/80 hover:text-amber-300 transition-colors"
          >
            ← Cédula
          </button>
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
            {index + 1} / {MARIANA_GALLERY.length}
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/10">
          {MARIANA_GALLERY[index].type === 'video' ? (
            <video src={MARIANA_GALLERY[index].url} controls className="w-full" />
          ) : (
            <img
              src={MARIANA_GALLERY[index].url}
              alt={MARIANA_GALLERY[index].caption}
              className="w-full object-contain"
            />
          )}
        </div>
        <p className="text-center text-xs text-slate-400">{MARIANA_GALLERY[index].caption}</p>
        {MARIANA_GALLERY.length > 1 && (
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + MARIANA_GALLERY.length) % MARIANA_GALLERY.length)}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition-colors hover:bg-white/10"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % MARIANA_GALLERY.length)}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition-colors hover:bg-white/10"
            >
              →
            </button>
          </div>
        )}
      </>
    )}
  </div>
);

const PortalArtesanias = () => {
  const { user } = useAuth();
  usePortalTracking('artesanias');
  const { question: vitranaQuestion } = useVitranaQuestion('artesanias');
  const isAuthenticated = Boolean(user);
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [showLoginHint, setShowLoginHint] = useState(false);
  const [isTazaARActive, setIsTazaARActive] = useState(false);
  const [isTazaActivating, setIsTazaActivating] = useState(false);
  const [tazaActivations, setTazaActivations] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const stored = window.localStorage?.getItem('gatoencerrado:taza-activations');
    const parsed = stored ? Number.parseInt(stored, 10) : 0;
    return Number.isNaN(parsed) ? 0 : parsed;
  });
  const [arError, setArError] = useState('');
  const [latestArtesaniasReading, setLatestArtesaniasReading] = useState(null);
  const [isReadingTooltipOpen, setIsReadingTooltipOpen] = useState(false);
  const [galeriaMarianaIndex, setGaleriaMarianaIndex] = useState(null);
  const [reactionStatus, setReactionStatus] = useState('idle');
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [isTazaCheckoutLoading, setIsTazaCheckoutLoading] = useState(false);
  const readingTooltipRef = useRef(null);

  const handleOpenLogin = useCallback(() => {
    if (!isAuthenticated) {
      setShowLoginOverlay(true);
    }
  }, [isAuthenticated]);

  const handleCloseLogin = useCallback(() => {
    setShowLoginOverlay(false);
  }, []);

  const requireAuth = useCallback((forceAuth = false) => {
    if (isAuthenticated) return true;
    if (!forceAuth && hasEnoughGAT()) return true;
    setShowLoginOverlay(true);
    setShowLoginHint(true);
    window.setTimeout(() => setShowLoginHint(false), 2200);
    return false;
  }, [isAuthenticated]);


  useEffect(() => {
    let cancelled = false;
    const loadLatestArtesaniasReading = async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .not('slug', 'is', null)
        .not('miniverso', 'is', null)
        .order('published_at', { ascending: false })
        .limit(60);

      if (cancelled) return;
      if (error) {
        console.warn('[PortalArtesanias] No se pudo detectar lectura relacionada:', error);
        setLatestArtesaniasReading(null);
        return;
      }

      const firstMatch =
        Array.isArray(data) && data.length
          ? data.find((post) => {
              const key = String(post?.miniverso || '').trim().toLowerCase();
              return ARTESANIAS_BLOG_KEY_SET.has(key);
            }) ?? null
          : null;
      setLatestArtesaniasReading(firstMatch?.slug ? firstMatch : null);
    };

    loadLatestArtesaniasReading();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (latestArtesaniasReading?.slug) return;
    setIsReadingTooltipOpen(false);
  }, [latestArtesaniasReading?.slug]);

  useEffect(() => {
    if (!isReadingTooltipOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!readingTooltipRef.current) return;
      if (!readingTooltipRef.current.contains(event.target)) {
        setIsReadingTooltipOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsReadingTooltipOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isReadingTooltipOpen]);


  const handleActivateAR = useCallback(async () => {
    if (!requireAuth()) return;
    if (isTazaActivating) return;

    setIsTazaActivating(true);
    setArError('');

    // Pedir permiso de cámara dentro del gesto del usuario para evitar
    // el diálogo de confirmación intermedio de CameraPermissionPrompt.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      stream.getTracks().forEach((t) => t.stop());
    } catch (err) {
      const name = err?.name ?? '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setArError('Permiso de cámara denegado. Actívalo en la configuración de tu navegador.');
      } else {
        setArError('No pudimos acceder a la cámara. Verifica que tu dispositivo tenga una disponible.');
      }
      setIsTazaActivating(false);
      return;
    }

    const next = tazaActivations + 1;
    setTazaActivations(next);
    setIsTazaARActive(true);

    if (typeof window !== 'undefined') {
      window.localStorage?.setItem('gatoencerrado:taza-activations', String(next));
      window.dispatchEvent(
        new CustomEvent('gatoencerrado:miniverse-spent', {
          detail: { id: 'taza', spent: true, amount: 30, count: next },
        }),
      );
    }

    window.setTimeout(() => {
      setIsTazaActivating(false);
    }, 700);
  }, [isTazaActivating, requireAuth, tazaActivations]);

  const handleCloseARExperience = useCallback(() => {
    setIsTazaARActive(false);
    setIsTazaActivating(false);
  }, []);

  const handleARError = useCallback((error) => {
    setArError(error?.message || 'No pudimos iniciar la activacion. Revisa permisos de camara, luz y conexion.');
    setIsTazaARActive(false);
    setIsTazaActivating(false);
  }, []);

  useEffect(() => {
    if (!isTazaARActive) return undefined;
    document.body.classList.add('overflow-hidden');
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isTazaARActive]);

  const handleOpenTazaCheckout = useCallback(async () => {
    if (!requireAuth()) return;
    if (isTazaCheckoutLoading) return;

    supabase.from('miniverso_artesanias_interactions').insert({
      interaction_type: 'cta_click',
      cta_id: 'taza-250',
      anon_id: ensureAnonId() ?? null,
      user_id: user?.id ?? null,
      metadata: { recorded_at: new Date().toISOString() },
    }).then(({ error }) => { if (error) console.warn('[artesanias] cta_click:', error.message); });

    setIsTazaCheckoutLoading(true);
    try {
      await startDirectMerchCheckout({
        packageId: 'taza-250',
        customerEmail: user?.email ?? '',
        metadata: {
          source: 'portal-artesanias',
          package: 'taza-250',
        },
      });
    } catch (error) {
      console.error('[PortalArtesanias] Checkout error:', error);
      toast({ description: 'No pudimos abrir el checkout. Intenta nuevamente.' });
    } finally {
      setIsTazaCheckoutLoading(false);
    }
  }, [isTazaCheckoutLoading, requireAuth, user?.email]);

  const handleOpenCommunityComposer = useCallback(() => {
    if (!requireAuth()) return;
    setIsContributionOpen(true);
  }, [requireAuth]);

  const handleSendPulse = useCallback(async () => {
    if (!requireAuth()) return;
    if (reactionStatus === 'loading') return;

    setReactionStatus('loading');
    const { success } = await recordShowcaseLike({ showcaseId: 'lataza', user });
    if (success) {
      setReactionStatus('success');
    } else {
      setReactionStatus('idle');
    }
  }, [reactionStatus, requireAuth, user]);

  const artesaniasReadingAuthorLabel = (latestArtesaniasReading?.author || '').trim() || 'autor invitado';
  const artesaniasReadingThumbnailUrl =
    sanitizeExternalHttpUrl(latestArtesaniasReading?.featured_image_url) ||
    sanitizeExternalHttpUrl(latestArtesaniasReading?.cover_image) ||
    sanitizeExternalHttpUrl(latestArtesaniasReading?.image_url) ||
    sanitizeExternalHttpUrl(latestArtesaniasReading?.author_avatar_url) ||
    null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-black to-slate-900 text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 md:py-14">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <PortalAuthButton onOpenLogin={handleOpenLogin} />
            {showLoginHint ? (
              <div className="rounded-xl border border-amber-300/60 bg-amber-500/10 px-3 py-2 text-xs text-amber-100 shadow-[0_10px_30px_rgba(251,191,36,0.2)]">
                Inicia sesion para continuar. Usa el boton de arriba.
              </div>
            ) : null}
          </div>
          <PortalHeaderActions />
        </div>

        <div className="mt-6 space-y-6">
          <div className="rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-slate-900/85 via-black/60 to-amber-900/25 shadow-[0_25px_65px_rgba(15,23,42,0.65)]">
            <div className="grid gap-10 p-6 sm:p-8 lg:p-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.4em] text-amber-300">Vitrina</p>
                  <h3 className="font-display text-3xl leading-tight text-white md:text-4xl">Artesanias</h3>
                </div>
                <div className="space-y-3 text-lg text-slate-200/85 leading-relaxed font-light">
                  <p>{ARTESANIAS_SUBTITLE}</p>
                  <p>{ARTESANIAS_INTRO}</p>
                </div>
                <div className="hidden lg:block">
                  <IAInsightCard {...ARTESANIAS_IA_PROFILE} compact />
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="lg:hidden">
                  <CollaboratorsPanel collaborators={ARTESANIAS_COLLABORATORS} accentClassName="text-amber-200/90" />
                </div>
                <div className="relative flex flex-col gap-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Mini-verso autoral</p>
                  <MiniVersoCard
                    title={ARTESANIAS_NOTA_AUTORAL.title}
                    verse={ARTESANIAS_NOTA_AUTORAL.verse}
                    palette={ARTESANIAS_TILE}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <CollaboratorsPanel collaborators={ARTESANIAS_COLLABORATORS} accentClassName="text-amber-200/90" />
          </div>
          <div className="lg:hidden">
            <IAInsightCard {...ARTESANIAS_IA_PROFILE} compact />
          </div>

          <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 overflow-hidden bg-black/30">
                <div className="flex items-center justify-between gap-3 px-6 pt-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400/70">Activa tu objeto</p>
                  <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
                    Activaciones: {tazaActivations}
                  </p>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div className="flex flex-col gap-4">
                    <div className="relative w-full aspect-[4/3] max-h-[260px] overflow-hidden rounded-2xl bg-black/50">
                      <img
                        src={ARTESANIAS_IMAGE}
                        alt="Ilustracion de la taza"
                        className="absolute inset-0 h-full w-full object-contain"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>

                    <p className="text-sm text-slate-400 uppercase tracking-[0.3em]">{ARTESANIAS_NOTE}</p>

                    <ul className="text-sm text-slate-300/90 space-y-2">
                      {ARTESANIAS_INSTRUCTIONS.map((step, index) => (
                        <li key={`artesanias-step-${index}`} className="flex items-start gap-2">
                          <span className="text-purple-300 mt-1">●</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="relative inline-flex overflow-visible flex-col gap-2">
                      <Button
                        className="relative border-purple-400/40 text-purple-200 hover:bg-purple-500/10 overflow-visible"
                        variant="outline"
                        onClick={handleActivateAR}
                        disabled={isTazaActivating}
                      >
                        {isTazaActivating ? 'Procesando...' : 'Activa tu taza'}
                      </Button>
                      <button
                        type="button"
                        onClick={handleOpenTazaCheckout}
                        disabled={isTazaCheckoutLoading}
                        className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-purple-400/40 text-purple-200 hover:bg-purple-500/10 px-6 py-2 font-semibold transition"
                      >
                        {isTazaCheckoutLoading ? 'Abriendo checkout...' : 'Comprar tu taza'}
                      </button>
                    </div>
                    {arError ? (
                      <p className="text-xs text-amber-200/90">{arError}</p>
                    ) : null}
                  </div>

                  <div className="hidden md:block">
                    <GaleriaMarianaCard index={galeriaMarianaIndex} setIndex={setGaleriaMarianaIndex} onCtaClick={() => setIsContributionOpen(true)} />
                  </div>
                </div>
              </div>
            </div>
            <div className="md:hidden">
              <GaleriaMarianaCard index={galeriaMarianaIndex} setIndex={setGaleriaMarianaIndex} onCtaClick={() => setIsContributionOpen(true)} />
            </div>

            <div className="space-y-5">
              <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-5">
                <div className="mb-1 flex items-start justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Archivo de experiencia narrativa</p>
                  <RelatedReadingTooltipButton
                    slug={latestArtesaniasReading?.slug}
                    authorLabel={artesaniasReadingAuthorLabel}
                    thumbnailUrl={artesaniasReadingThumbnailUrl}
                    ariaLabel="Mostrar lectura relacionada de Artesanías"
                    tone="cyan"
                  />
                </div>
                <div className="rounded-2xl bg-white/90 px-6 py-8 shadow-[0_4px_24px_rgba(0,0,0,0.10)]">
                  {vitranaQuestion ? (
                    <p className="text-slate-800 text-base leading-relaxed italic text-center font-light">
                      {vitranaQuestion}
                    </p>
                  ) : (
                    <p className="text-slate-400/60 text-sm text-center py-2">···</p>
                  )}
                </div>
                <p className="text-xs text-slate-400/70 leading-relaxed mt-4 px-1">
                  Esta plataforma investiga cómo distintas personas atraviesan experiencias narrativas, emocionales y simbólicas.
                </p>
                <div className="mx-auto w-full max-w-md mt-4">
                  <button
                    type="button"
                    className="w-full rounded-full border border-purple-500/70 text-purple-100 shadow-[0_15px_45px_rgba(67,56,202,0.45)] hover:bg-purple-500/20 tracking-[0.25em] text-xs uppercase px-4 py-2"
                    onClick={handleOpenCommunityComposer}
                  >
                    Registra tu experiencia
                  </button>
                </div>

                <ShowcaseReactionInline status={reactionStatus} onReact={handleSendPulse} />
              </div>
            </div>
          </div>
        </div>

        {showLoginOverlay ? <LoginOverlay onClose={handleCloseLogin} /> : null}
        <ContributionModal
          open={isContributionOpen}
          onClose={() => setIsContributionOpen(false)}
          initialCategoryId="taza"
        />
      </div>

      {isTazaARActive ? (
        <div className="fixed inset-0 z-[220] bg-black">
          <ARExperience
            targetSrc="/webar/taza/taza.mind"
            phrases={ARTESANIAS_PHRASES}
            showScanGuide
            guideImageSrc="/webar/taza/taza-marker.jpg"
            guideLabel="Alinea la ilustracion de la taza con el contorno. No necesita ser exacto."
            onExit={handleCloseARExperience}
            initialCameraReady
            onError={handleARError}
          />
        </div>
      ) : null}
    </div>
  );
};

export default PortalArtesanias;
