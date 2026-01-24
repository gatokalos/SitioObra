import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  BookOpen,
  HeartHandshake,
  Feather,
  Palette,
  Smartphone,
  Coffee,
  Drama,
  Film,
  Video,
  Music,
  Heart,
  Brain,
  Map,
  Scan,
  Users,
  RadioTower,
  Sparkles,
  MapIcon,
  Coins,
  CheckCheckIcon,
  Mic,
  Play,
  Square,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import MiniverseModal from '@/components/MiniverseModal';
import CallToAction from '@/components/CallToAction';
import InstallPWACTA from '@/components/InstallPWACTA';
import ContributionModal from '@/components/ContributionModal';
import ReserveModal from '@/components/ReserveModal';
import { fetchBlogPostBySlug } from '@/services/blogService';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase, supabasePublic } from '@/lib/supabaseClient';
import { ensureAnonId } from '@/lib/identity';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import ARExperience from '@/components/ar/ARExperience';
import MiniversoSonoroPreview from '@/components/miniversos/sonoro/MiniversoSonoroPreview';
import AutoficcionPreview from '@/components/novela/AutoficcionPreview';
import { recordShowcaseLike } from '@/services/showcaseLikeService';
import { useMobileVideoPresentation } from '@/hooks/useMobileVideoPresentation';
import IAInsightCard from '@/components/IAInsightCard';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';
import DiosasCarousel from '@/components/DiosasCarousel';
import { fetchApprovedContributions } from '@/services/contributionService';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
const GAT_COSTS = {
  quironFull: 300,
  graficoSwipe: 110,
  novelaChapter: 150,
  sonoroMix: 130,
  tazaActivation: 90,
  movimientoRuta: 280,
};
const SHOWCASE_BADGE_IDS = [
  'miniversos',
  'lataza',
  'miniversoNovela',
  'miniversoGrafico',
  'copycats',
  'miniversoSonoro',
  'miniversoMovimiento',
  'oraculo',
  'apps',
];
const EXPLORER_BADGE_STORAGE_KEY = 'gatoencerrado:explorer-badge';
const EXPLORER_BADGE_REWARD = 1000;
const EXPLORER_BADGE_NAME = 'Errante Consagrado';
const SILVESTRE_QUESTIONS_STORAGE_KEY = 'gatoencerrado:silvestre-questions-spent';
const SILVESTRE_TRIGGER_QUESTIONS = [
  '¿Don Polo viene de este mundo… o de otro?',
  '¿Lo de las marcianas es literal o se me fue algo?',
  '¿La Doctora realmente entiende a Silvestre?',
  '¿Y si Silvestre no está angustiado por sí mismo, sino por el mundo?',
];
const DEFAULT_BADGE_STATE = {
  unlocked: false,
  unlockedAt: null,
  rewardClaimed: false,
  claimedAt: null,
  claimedType: null,
};
const requestCameraAccess = async () => {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('getUserMedia no disponible en este navegador');
  }
  const attempts = [
    { video: true },
    { video: {} },
    { video: { facingMode: 'environment' } },
    { video: { facingMode: { ideal: 'environment' } } },
    { video: { facingMode: { ideal: 'user' } } },
    { video: { width: { ideal: 640 }, height: { ideal: 480 } } },
  ];
  let lastError = null;
  for (const constraints of attempts) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error) {
      lastError = error;
      // Si falló por restricciones o permisos, probamos el siguiente intento.
      continue;
    }
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter((d) => d.kind === 'videoinput');
    for (const device of videoInputs) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: device.deviceId } },
        });
        stream.getTracks().forEach((track) => track.stop());
        return true;
      } catch (error) {
        lastError = error;
        continue;
      }
    }
  } catch (error) {
    lastError = error;
  }

  throw lastError ?? new Error('No pudimos usar la cámara en este dispositivo.');
};
const MINIVERSO_TILE_GRADIENTS = {
  miniversos: 'linear-gradient(135deg, rgba(31,21,52,0.95), rgba(64,36,93,0.85), rgba(122,54,127,0.65))',
  copycats: 'linear-gradient(135deg, rgba(16,27,54,0.95), rgba(38,63,109,0.85), rgba(92,47,95,0.7))',
  miniversoGrafico: 'linear-gradient(135deg, rgba(37,19,52,0.95), rgba(70,32,86,0.85), rgba(141,58,121,0.65))',
  miniversoNovela: 'linear-gradient(135deg, rgba(26,24,60,0.95), rgba(59,43,95,0.85), rgba(108,56,118,0.7))',
  miniversoSonoro: 'linear-gradient(135deg, rgba(18,29,62,0.95), rgba(32,65,103,0.85), rgba(70,91,146,0.65))',
  lataza: 'linear-gradient(135deg, rgba(44,20,30,0.95), rgba(101,45,66,0.85), rgba(196,111,86,0.6))',
  miniversoMovimiento: 'linear-gradient(135deg, rgba(24,30,45,0.95), rgba(40,64,65,0.85), rgba(74,123,102,0.65))',
  apps: 'linear-gradient(135deg, rgba(30,41,59,0.95), rgba(22,163,74,0.75), rgba(34,211,238,0.65))',
  oraculo: 'linear-gradient(135deg, rgba(38,18,56,0.95), rgba(86,33,115,0.85), rgba(168,68,139,0.65))',
  default: 'linear-gradient(135deg, rgba(20,14,35,0.95), rgba(47,28,71,0.85), rgba(90,42,100,0.65))',
};
const MINIVERSO_TILE_COLORS = {
  miniversos: {
    background: 'rgba(31,21,52,0.75)',
    border: 'rgba(186,131,255,0.35)',
    text: '#e9d8ff',
    accent: '#f4c8ff',
  },
  copycats: {
    background: 'rgba(16,27,54,0.75)',
    border: 'rgba(132,176,255,0.35)',
    text: '#dbeafe',
    accent: '#c6f6ff',
  },
  miniversoGrafico: {
    background: 'rgba(37,19,52,0.75)',
    border: 'rgba(214,146,255,0.35)',
    text: '#fce7f3',
    accent: '#fed7e2',
  },
  miniversoNovela: {
    background: 'rgba(26,24,60,0.75)',
    border: 'rgba(163,148,255,0.35)',
    text: '#e0e7ff',
    accent: '#c7d2fe',
  },
  miniversoSonoro: {
    background: 'rgba(18,29,62,0.75)',
    border: 'rgba(122,179,255,0.35)',
    text: '#e0f2fe',
    accent: '#bae6fd',
  },
  lataza: {
    background: 'rgba(44,20,30,0.75)',
    border: 'rgba(255,173,145,0.35)',
    text: '#ffedd5',
    accent: '#fed7aa',
  },
  miniversoMovimiento: {
    background: 'rgba(24,30,45,0.75)',
    border: 'rgba(163,233,208,0.35)',
    text: '#d1fae5',
    accent: '#a7f3d0',
  },
  apps: {
    background: 'rgba(16,185,129,0.18)',
    border: 'rgba(110,231,183,0.45)',
    text: '#d1fae5',
    accent: '#99f6e4',
  },
  oraculo: {
    background: 'rgba(38,18,56,0.75)',
    border: 'rgba(225,160,235,0.35)',
    text: '#fbe7ff',
    accent: '#f3d1ff',
  },
  default: {
    background: 'rgba(20,14,35,0.7)',
    border: 'rgba(186,131,255,0.3)',
    text: '#f3e8ff',
    accent: '#e9d8fd',
  },
};
const ORACULO_URL = (() => {
  const raw =
    import.meta.env?.VITE_ORACULO_URL ??
    import.meta.env?.VITE_BIENVENIDA_URL ??
    '';
  return raw ? raw.replace(/\/+$/, '') : '';
})();
const CAUSE_SITE_URL = 'https://www.ayudaparalavida.com/index.html';
const TOPIC_BY_SHOWCASE = {
  miniversos: 'obra_escenica',
  copycats: 'cine',
  miniversoGrafico: 'graficos',
  miniversoNovela: 'novela',
  miniversoSonoro: 'sonoro',
  miniversoMovimiento: 'movimiento',
  lataza: 'artesanias',
  apps: 'apps',
  oraculo: 'oraculo',
};
// Enable the editorial shield only when explicitly requested.
const MINIVERSO_EDITORIAL_INTERCEPTION_ENABLED =
  import.meta.env?.VITE_MINIVERSO_INTERCEPTION === 'true';
const CONTRIBUTION_CATEGORY_BY_SHOWCASE = {
  miniversos: 'obra_escenica',
  copycats: 'cine',
  miniversoGrafico: 'grafico',
  miniversoNovela: 'miniverso_novela',
  miniversoSonoro: 'sonoro',
  miniversoMovimiento: 'movimiento',
  lataza: 'taza',
  apps: 'apps',
  oraculo: 'oraculo',
};
const readStoredJson = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage?.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
};

const readStoredInt = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage?.getItem(key);
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const readStoredBool = (key, fallback = false) => {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage?.getItem(key);
  if (raw === null || raw === undefined) return fallback;
  return raw === 'true';
};
const MiniVersoCard = ({
  title,
  verse,
  palette,
  effect = 'reveal',
  isTragedia = false,
  onFirstReveal = null,
  celebration = false,
}) => {
  const [isActive, setIsActive] = useState(false);
  const textClass = isTragedia ? 'text-sm' : 'text-sm leading-relaxed';
  const handleCardToggle = () => {
    setIsActive((prev) => {
      const next = !prev;
      if (!prev && next && typeof onFirstReveal === 'function') {
        onFirstReveal();
      }
      return next;
    });
  };

  const renderCelebration = () => {
    if (!celebration) return null;
    return (
      <div className="pointer-events-none absolute inset-0 z-20">
        {Array.from({ length: 7 }).map((_, index) => {
          const offsetX = (index - 3) * 22;
          const offsetY = -50 - index * 10;
          return (
            <motion.span
              key={`mini-coin-${index}`}
              className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-amber-200 to-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.5)]"
              initial={{ opacity: 0.95, scale: 0.7, x: 0, y: 0 }}
              animate={{ opacity: 0, scale: 1.1, x: offsetX, y: offsetY, rotate: 90 + index * 25 }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: index * 0.04 }}
            />
          );
        })}
      </div>
    );
  };

  const baseCard = (
    <motion.div
      key={title}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`rounded-2xl border min-h-[220px] flex flex-col justify-between relative overflow-hidden cursor-pointer ${textClass}`}
      style={{
        backgroundImage: palette.gradient,
        backgroundSize: '220% 220%',
        borderColor: palette.border,
        color: palette.text,
        boxShadow: isActive
          ? '0 10px 30px rgba(0,0,0,0.55)'
          : '0 0 25px rgba(0,0,0,0.35)',
      }}
      onClick={handleCardToggle}
    >
      {renderCelebration()}
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_60%)] pointer-events-none" />
      <div className="relative z-10 mb-3 flex justify-center">
        <span
          className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-[0.6rem] uppercase tracking-[0.35em] shadow-lg transition"
          style={{
            color: palette.accent,
            backgroundColor: `${palette.background}cc`,
            border: `1px solid ${palette.border}`,
          }}
        >
          {title}
        </span>
      </div>
      <div className="relative z-10 flex-1 flex items-center justify-center px-4">
        <p
          className={`leading-relaxed whitespace-pre-line text-center font-light transition-all duration-500 ${
            isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {verse}
        </p>
        <div
          className={`absolute inset-0 flex items-center justify-center text-xs uppercase tracking-[0.35em] text-white/70 transition-all duration-500 ${
            isActive ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
        >
          Toca para revelar
        </div>
      </div>
    </motion.div>
  );

  if (effect === 'flip') {
    return (
      <div className="relative [perspective:1200px]" onClick={handleCardToggle}>
        {renderCelebration()}
        <motion.div
          animate={{ rotateY: isActive ? 180 : 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="relative min-h-[220px] [transform-style:preserve-3d]"
        >
          <div
            className={`absolute inset-0 rounded-2xl border flex flex-col items-center justify-center gap-4 ${textClass} [backface-visibility:hidden]`}
            style={{
              backgroundImage: palette.gradient,
              borderColor: palette.border,
              color: palette.text,
              inset: 0,
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
            <span className="text-xs tracking-[0.35em] text-white/70">Toca para leer</span>
          </div>
          <div
            className={`absolute inset-0 rounded-2xl border px-6 py-5 [backface-visibility:hidden] flex items-center justify-center ${textClass}`}
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
  }

  return baseCard;
};
const MINIVERSO_VERSE_EFFECTS = {
  miniversoNovela: 'flip',
  miniversoSonoro: 'flip',
  lataza: 'flip',
  copycats: 'flip',
  miniversos: 'flip',
  miniversoGrafico: 'flip',
  miniversoMovimiento: 'flip',
  oraculo: 'flip',
  default: 'flip',
};

let hasInjectedMiniversoBreathStyle = false;
function ensureMiniversoBreathStyle() {
  if (hasInjectedMiniversoBreathStyle || typeof document === 'undefined') {
    return;
  }

  const style = document.createElement('style');
  style.id = 'miniverso-breath-style';
  style.textContent = `
    @keyframes miniverso-breath {
      0% {
        background-position: 0% 0%;
        transform: scale(1);
        filter: brightness(1);
      }
      50% {
        background-position: 50% 50%;
        transform: scale(1.03);
        filter: brightness(1.08);
      }
      100% {
        background-position: 100% 100%;
        transform: scale(1);
        filter: brightness(1);
      }
    }
  `;
  document.head.appendChild(style);
  hasInjectedMiniversoBreathStyle = true;
}

function shuffleArray(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
const showcaseDefinitions = {
  miniversos: {
    label: 'Miniverso Obra',
    type: 'tragedia',
    intro:
      'Aquí nace la obra dentro de la obra. El gato encerrado de Es un gato encerrado.',
    cartaTitle: '#VibraciónEscénica',
    notaAutoral: 'De la escena brotó el universo:\nvoz, trance y cuerpo\nabriendo portales.',

    ctaLabel: 'Hablar con La Obra',
    conversationStarters: [
      '¿Qué hace que la obra siga “presente” después de haber terminado?',
      '¿Por qué la obra no explica del todo lo que le pasa a Silvestre?',
      '¿Qué es más importante en la obra: lo que ocurre o lo que se siente?',
      '¿Desde dónde habla la obra cuando Silvestre se queda solo con su mente?',
      '¿Qué cambia si vuelvo a mirar la obra con más calma?',
      '¿Por qué todo en la obra parece girar alrededor de Silvestre, incluso cuando no habla?',
      '¿Silvestre está recordando… o pensando cosas que no puede detener?',
      '¿Qué lugar ocupa el humor cuando la obra habla de cosas difíciles?',
      '¿Por qué algunas preguntas de la obra regresan sin resolverse?',
      '¿La rabia que aparece en escena pertenece solo a Silvestre?',
      '¿Qué decide mostrar la obra y qué prefiere dejar fuera?',
      '¿Qué se siente estar atrapado en un sistema que solo repite?',
      '¿Por qué los espacios de la obra no se sienten como refugio?',
      '¿Por qué ciertos números, palabras o gestos se repiten?',
      'Después de verla, ¿la obra se cierra… o sigue acompañando?',
      '¿Qué significa que Silvestre sea un eje y no un protagonista clásico?',
      '¿Por qué la obra deja cosas abiertas incluso después de salir del teatro?',
    ],
    iaProfile: {
      type: 'GPT-4o afinada para voz literaria y contención emocional.',
      interaction: '1 a 3 mensajes con la obra (texto o voz).',
      tokensRange: '250–600 tokens.',
      coverage: 'Cubierto por suscriptores; entra en el plan de soporte colectivo.',
      footnote: 'Cada conversación tiene un costo real. Gracias por mantenerla viva.',
    },
    collaborators: [
      {
        id: 'carlos-perez',
        name: 'Carlos Pérez',
        role: 'Coordinador de diálogo',
        bio: 'Mi trabajo se enfocó en pensar cómo la experiencia escénica podía continuar más allá de la función, no desde la explicación, sino desde preguntas cuidadas y abiertas. Diseñé este espacio que respeta la ambigüedad de la obra y acompaña al espectador sin imponer interpretaciones.',
        image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/autores/carlos_perez_avatar.png',
      },
      {
        id: 'incendio-producciones',
        name: 'Incendio Producciones',
        role: 'Producción ejecutiva asociada',
        bio: 'Esta versión del chat fue adaptada para acompañar la puesta en escena de Gilberto Corrales. El trabajo de dirección y producción transformó la obra, y este espacio fue ajustado para dialogar con esa nueva forma.',
        image: '/assets/incendiologo.png',
      },
    ],
  },
  copycats: {
    label: 'Miniverso Cine',
    type: 'cinema',
    intro: 'El cine dentro de #GatoEncerrado es un laboratorio donde la realidad se revela por roce, no por imitación. Obra, proceso y mirada se mezclan hasta volver indistinguibles sus fronteras.',
    promise: 'Aquí no solo ves cine: te invitamos a entrar a su laboratorio.',
    theme:
      'La doble vida de una imagen: aquello que se ve y aquello que tiembla detrás. CopyCats (farsa lúcida) y Quirón (herida íntima) responden a la misma pregunta en dos lenguajes.',
    tone: ['Premiere íntima', 'Laboratorio abierto', 'Cine con memoria'],
    cartaTitle: '#LuzQueHiere',
    copycats: {
      title: 'CopyCats',
      description: 'Un juego serio sobre cómo nos repetimos sin notarlo. Mira su bitácora creativa y descubre cómo surgió esta pieza.',

      assets: [
        {
          id: 'copycats-carta',
          label: 'Ensayo abierto (4:02)',
          url: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Cine%20-%20teasers/ensayos/La%20Cadena%20del%20Gesto.mp4',
        },
      ],
      tags: ['teaser', 'Identidad Digital', 'Archivo autoficcional'],
    },
    quiron: {
      title: 'Quirón',
      description: 'Mira el teaser de un cortometraje que busca la vulnerabilidad donde casi nunca se nombra.',
            tags: ['Cine-ensayo', 'Identidad Digital', 'Archivo autoficcional'],

     
      fullVideo: {
        id: 'quiron-full',
        label: 'Cortometraje completo',
        url: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Cine%20-%20teasers/Quiron_10min.mp4',
      },
      teaser: {
        id: 'quiron-teaser',
        label: 'Teaser oficial',
        url: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Cine%20-%20teasers/Quiron.mp4',
      },
     
    },
    collaborators: [
      {
        id: 'viviana-gonzalez',
        name: 'Viviana González',
        role: 'Dirección de foto y registro creativo',
        bio: 'Viviana acompaña al Miniverso Cine con una mirada que piensa. Comunicóloga y docente en la Ibero, su experiencia ilumina procesos más que superficies. Fue quien sostuvo el pulso visual de Quirón y CopyCats: cámara, escucha y diálogo creativo continuo. Su presencia abrió rutas nuevas para traducir lo íntimo, lo incierto y lo que apenas empieza a nacer en pantalla',
        image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/placeholder-colaboradores.jpg',
        anchor: '#team',
      },
      {
        id: 'diego-madera',
        name: 'Diego Madera',
        role: 'Compositor · Tema musical',
        bio: 'Diego tiende puentes entre emoción y estructura. Compositor de formación precisa y sensibilidad abierta, su música respira junto al material filmado: acompaña, sostiene y revela. En el Miniverso Cine, sus partituras funcionan como una línea de vida, un lugar donde el caos ordena su ritmo. Es también maestro de piano, y esa pedagogía silenciosa terminó resonando en la obra.',
        image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/diego.png',
        anchor: '#team',
      },
       {
        id: 'lia-perez',
        name: 'Lía Pérez, MPSE',
        role: 'Diseño Sonoro & Pulso emocional',
        bio: 'Lía se sumó a Cine de #GatoEncerrado con una entrega luminosa: sin pedir nada a cambio y afinando cada capa de sonido en Quirón y CopyCats. Su oído construye atmósferas que no se escuchan: se sienten. Entre risas, ruidos, silencios y tormentas interiores, su trabajo sostuvo el timbre emocional de las piezas y dejó una huella discreta, pero imprescindible.',
        image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/lia.jpg',
      },
      {
        id: 'maria-diana-laura-rodriguez',
        name: 'María Diana Laura Rodriguez',
        role: 'Producción en línea & Cuerpo en escena',
        bio: 'María Diana Laura cruzó el Miniverso Cine desde dos frentes: coordinó la producción en línea del cortometraje y encarnó a Cirila en el oráculo, llevando esa figura entre lo ritual y lo doméstico a la pantalla. Su energía organizativa y su presencia performática sostuvieron momentos clave del proceso, dejando constancia de que producir también es un acto de imaginación.',
        image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/mariadianalaura.jpg',
        anchor: '#team',
      },
      {
        id: 'tania-fraire',
        name: 'Tania Fraire Vázques',
        role: 'Autoficción & Presenica natural en pantalla',
        bio: 'Tania llegó a este proyecto transmedia desde la autoficción, pero pronto reveló algo más: una actriz natural, sin artificio, capaz de sostener la cámara como si respirara con ella. En el screening privado de Quirón, el maestro Gilberto Corrales lo señaló con asombro: su actuación encendía la escena desde un lugar genuino, vulnerable y preciso. Su participación abrió una grieta luminosa por donde la historia pudo volverse más humana. Tania colabora en una non-profit, es diseñadora gráfica y transfronteriza de corazón.',
        image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/tania.jpg',
        anchor: '#team',
      },
    ],
    comments: [
      {
        id: 'copycats-comment-1',
        quote: '“En el screening sentí que CopyCats nos dejó ver la forma en que nos copiamos para sobrevivir.”',
        author: 'Invitada al laboratorio',
      },
      {
        id: 'copycats-comment-2',
        quote: '“Quirón me dejó en silencio, como si me hablara al oído.”',
        author: 'Asistente al teaser privado',
      },
    ],
    bridge: {
      title: 'Una línea que vibra entre ambas historias',
      description:
        'CopyCats y Quirón dialogan desde extremos distintos del mismo territorio. Una filma el desgaste creativo y la fractura del proceso;la otra abre una confesión íntima que decide hablar del suicidio sin rodeos.',
      note:
        'Dos películas, dos vulnerabilidades distintas, un mismo impulso: usar el arte para tocar aquello que no queremos decir en voz alta y encontrar otra manera de contarlo.',
    },
    screening: {
      title: 'Mayo 2026 · Cineteca CECUT',
      description:
        'Únete al universo transmedia y asegura tu acceso al primer screening doble de CopyCats + Quirón, con conservatorio del equipo.',
      cta: 'Quiero ser parte del screening',
      footnote: 'El cine es otro modo de entrar al encierro. Acompáñanos en marzo para ver ambas películas antes que nadie.',
    },
    notaAutoral: 'Cuando la escena no basta,\nla cámara sostiene la memoria\nQuirón, CopyCats:\nel mismo espacio, expuesto de otra forma.',
    iaProfile: {
      type: 'GPT-4o mini + subtítulos vivos y notas críticas asistidas.',
      interaction: 'Notas críticas y captions contextuales por espectador.',
      tokensRange: '200–450 tokens por visita.',
      coverage: 'Incluido en las suscripciones transmedia.',
      footnote: 'La IA acompaña la mirada; la decisión sigue siendo humana.',
    },
  },
  lataza: {
    label: 'Miniverso Artesanías',
    type: 'object-webar',
    slug: 'taza-que-habla',
    subtitle: 'Esta no es una taza. Es un portal.',
    intro:
      'Un objeto cotidiano convertido en símbolo de comunión. Cada taza está vinculada a un sentimiento. Cada sentimiento, a una historia personal.',
    note: 'Apunta tu cámara y aparecerá tu frase',
    ctaLabel: 'Activa tu taza',
    ctaMessage: 'Cuando liberes la activación WebAR, descubrirás la pista que le corresponde a tu taza.',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/taza_h.png',
    phrases: ['La taza te habla.'],
    instructions: [
      'Permite el acceso a tu cámara para iniciar.',
      'Coloca la taza completa en cuadro, con buena iluminación.',
      'Mantén el marcador visible hasta que aparezca una orbe.',
    ],
    collaborators: [
       {
        id: 'miroslava-wilson',
        name: 'Miroslava Wilson',
        role: 'Vinculación y gestión institucional',
        bio: 'Miroslava acompañó el proceso que permitió integrar la taza al circuito institucional del CECUT, facilitando su presencia como parte de la preventa de la obra. Su gestión ayudó a tender el puente entre el objeto y el espacio escénico.',
        image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/Miroslava%20.jpg',
      },
      {
        id: 'taller-paco-padilla',
        name: 'Taller Paco Padilla',
        role: 'Cerámica artesanal de Tlaquepaque',
        bio: 'Referente de la cerámica artesanal de Tlaquepaque.El Taller Paco Padilla puso sus manos y su fuego en la primera serie de tazas del universo. Cada pieza salió de su horno con una vibración artesanal única, sosteniendo en barro el pulso íntimo de Gato Encerrado y regalándole un hogar físico a lo que antes era solo símbolo.',
        image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/pacopadilla.jpeg',
      },
      
      {
        id: 'yeraldin-roman',
        name: 'Yeraldín Román',
        role: 'Diseño gráfico, fotografía y enlace local',
        bio: 'Desde su experiencia en diseño gráfico, afinó la estética de la taza. Fue la primera en tenerla en sus manos y fotografiarla. En su trabajo continuo con Isabel Ayuda para la Vida y en este miniverso, se encargó de registrar marcas que hacen de #GatoEncerrado un universo.',
        image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/yeraldin.png',
      },
         {
        id: 'rocio-morgan',
        name: 'Rocío Morgan',
        role: 'Coordinación de entregas',
        bio: 'Rocío coordinó la entrega de las primeras tazas como un gesto de agradecimiento dentro del proceso de Es un gato encerrado, cuidando que llegaran tanto al equipo como a personas cercanas al proyecto. Marcando así las primeras activaciones de nuestro primer objeto artesanal.',
        image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/rocio.jpg',
      },
    ],
    comments: [
      {
        id: 'la-taza-comment-1',
        quote: '“La taza me mostró una frase que me persiguió toda la semana.”',
        author: 'Usuario anónimo',
      },
      {
        id: 'la-taza-comment-2',
        quote: '“No entendí nada… hasta que le agarré el modo.”',
        author: 'Sofía B.',
      },
    ],
    cartaTitle: '#EstoNoEsUnaTaza',
    notaAutoral: 'Una taza que escucha.\nUn marcador que mira.\nLo cotidiano también es ritual.',
    iaProfile: {
      type: 'IA ligera para pistas contextuales + WebAR.',
      interaction: '1 activación guiada por objeto (escaneo breve).',
      tokensRange: '90–140 tokens por activación.',
      coverage: 'Cubierto por suscriptores; no hay costo directo por usuario.',
      footnote: 'La IA solo guía la pista; el ritual lo completa quien sostiene la taza.',
    },
  },
  miniversoNovela: {
    label: 'Miniverso Literatura',
    type: 'blog-series',
    slug: null,
    intro:
      'Aquí la escritura no es un registro, sino un territorio que respira: fragmentos, voces, monólogos, poemas y apuntes que expanden la mente de Silvestre y la memoria de quienes lo rodean. Este es el espacio donde la literatura se vuelve espejo de lo escénico, preludio de lo cinematográfico y eco de lo humano.',
    cartaTitle: '#PáginaViva',
    notaAutoral:
      'La palabra devolvió lo que el gato se tragó:\nMi Gato Encerrado\nhuyó de sí misma y se encontró.',
    collaborators: [
      {
        id: 'pepe-rojo',
        name: 'Pepe Rojo',
        role: 'Escritor y prólogo de Mi Gato Encerrado',
        bio: 'Pepe Rojo acompañó el Miniverso Literatura con una lectura precisa y generosa. Autor emblemático de la narrativa fronteriza, ofreció el prólogo de Mi Gato Encerrado, abriendo el libro desde una mirada que entiende el artificio, la herida y la imaginación como un mismo territorio. Su intervención dio claridad y ruta al futuro de la obra.',
        image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/peperojo.jpeg',
      },
      {
        id: 'groppe-imprenta',
        name: 'Groppe Libros',
        role: 'Edición física',
        bio: 'Acompañaron la primera edición física de Mi Gato Encerrado con oficio paciente y preciso. Pusieron forma donde antes había solo palabras: papel, tinta y cuidado. Gracias a su trabajo, este universo encontró también su cuerpo de libro.',
        image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/groppelibros.png',
      },
    ],
    entries: [
      {
        id: 'compra-libro',
        title: 'Despierta dentro del libro',
        description:
          'Lectura como acto de conciencia: cruzar sus páginas es recorrer la mente misma.',
        image: '/assets/edicion-fisica.png',
        type: 'purchase-link',
        url: '/comprar-novela',
        snippet: {
          tagline: 'Tu ejemplar como portal',
          text:
            'Escanea el QR de tu libro para acceder a lecturas ocultas y conversaciones con otros lectores del universo #GatoEncerrado.',
        },
        app: {
          id: 'autoficcion-app',
          ctaLabel: 'Leer fragmentos',
          ctaAction: 'openAutoficcionPreview',
        },
      },
      {
        id: 'comentarios-lectores',
        title: 'Ecos del Club de Lectura',
        type: 'quotes',
        quotes: [
          {
            quote: '“No sabía que un libro podía hablarme a mitad de la página.”',
            author: 'Lectora anónima',
          },
          {
            quote:
              '“Volví a subrayar y entendí que la obra también estaba escribiendo mi propia memoria.”',
            author: 'Club de Lectura Frontera',
          },
        ],
      },
    ],
    ctaLabel: 'Leer los primeros fragmentos',
    iaProfile: {
      type: 'GPT-4o mini + voz sintética para fragmentos.',
      interaction: 'Guía de lectura y acompañamiento breve por capítulo.',
      tokensRange: '150–320 tokens por fragmento leído.',
      coverage: 'Cubierto por suscriptores; lectura sin costo adicional.',
      footnote: 'La IA susurra; la historia sigue siendo tuya.',
    },
  },
  miniversoSonoro: {
    label: 'Miniverso Sonoridades',
    type: 'audio-dream',
    intro:
      'Este miniverso mezcla imágenes errantes, pistas sonoras y palabras móviles para que crees tu propia atmósfera. Solo entra, prende un video, ponle la música que quieras, elige un poema… y deja que la combinación te sorprenda.',
    highlights: [
      'Video que fluye solo.',
      'Música que tú eliges.',
      'Poemas que respiran en pantalla.',
    ],
    exploration: [
      'El video corre por su cuenta — cambia con cada visita.',
      'Tú eliges la música — ajusta el ánimo del sueño.',
      'Escoge un poema — y observa cómo se desliza mientras todo ocurre.',
    ],
    closing: [
      'Sueño en tres capas',
      'Cada combinación abre un sueño distinto.',
      'Entra y crea el tuyo.',
    ],
    videoUrl:
      'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Sonoridades/videos-v/Vacio.mov',
    musicOptions: [
      {
        id: 'silencio',
        label: 'Silencio',
        url: '',
      },
      {
        id: 'ensayo-abierto',
        label: 'Ensayo Abierto (pista)',
        url: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Sonoridades/audio/cat_theme.m4a',
      },
    ],
    poems: [
      {
        id: 'pulmon',
        label: 'Poema 1 — “Pulmón”',
        text: 'La noche se abre como un pulmón cansado.',
      },
      {
        id: 'cuerpo',
        label: 'Poema 2 — “Cuerpo”',
        text: 'Lo que cae del sueño también cae del cuerpo.',
      },
    ],
    cartaTitle: '#SueñoEnCapas',
    notaAutoral: 'Sueña una imagen.\nAjusta el pulso.\nPwermite que el poema respire sin ti.',
    iaProfile: {
      type: 'GPT-4o mini para poemas móviles + curaduría sonora.',
      interaction: 'Selección de poema y mezcla guiada.',
      tokensRange: '130–280 tokens por mezcla.',
      coverage: 'Incluido en la suscripción transmedia.',
      footnote: 'La IA elige la forma; tú eliges el ánimo.',
    },
    collaborators: [
      {
        id: 'lia-perez',
        name: 'Lía Pérez, MPSE',
        role: 'Diseño Sonoro',
        bio: 'Artista sonora con más de doce años de experiencia. Fundadora de Concrete Sounds, ha colaborado en filmes como “Ya no estoy aquí” y “Monos”. Su especialidad es la creación de paisajes inmersivos que amplían la dimensión sensorial del teatro.',
        image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/lia.jpg',
      },
      {
        id: 'diego-madera',
        name: 'Diego Madera',
        role: 'Compositor',
        bio: 'Músico y compositor cuyo trabajo explora la tensión entre sonido y silencio. Su pieza original acompaña los pasajes emocionales de la obra.',
        image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/diego.png',
      },
    ],
    comments: [
      {
        id: 'sonoro-comment-1',
        quote: '“La mezcla se sintió como respirar dentro del sueño.”',
        author: 'Escucha anónima',
      },
      {
        id: 'sonoro-comment-2',
        quote: '“Elegí la pista incorrecta y terminé llorando. Gracias por eso.”',
        author: 'Residencia Sonora',
      },
    ],
  },
  miniversoGrafico: {
    label: 'Miniverso Gráfico',
    type: 'graphic-lab',
    intro:
      'Colección viva de exploraciones visuales: cómics en curso, viñetas interactivas, posters simbólicos, caricaturas conceptuales, murales colaborativos y avances con IA/técnicas mixtas.',
    cartaTitle: '#FronteraAbierta',
    notaAutoral:
      'Garabatea tu límite, dibuja tu refugio.\nLo gráfico como portal emocional.\nCada trazo se siente antes de entenderse.',
    collaborators: [
      {
        id: 'manuel-sarabia',
        name: 'Manuel Sarabia',
        role: 'Ilustrador y crítico de cine',
        bio: 'Desde Sadaka Estudio trazó los primeros storyboards de Tres pies al gato, ayudando a imaginar cómo se ve un mundo cuando aún no existe.',
        image: '/images/placeholder-colaboradores.jpg',
      },
    ],
    collection: [
      'Cómic impreso por venir',
      'Viñetas interactivas',
      'Posters simbólicos',
      'Caricaturas conceptuales',
      'Murales colaborativos',
      'Avances con IA y técnicas mixtas',
    ],
    swipe: {
      title: 'Swipe narrativo (modo viñeta)',
      description: 'Haz scroll hacia arriba para navegar por tarjetas verticales.',
      steps: [
        'Cada tarjeta revela una escena, una decisión o una herida.',
        'Desliza y elige: ¿quieres ver lo que pasa o lo que duele?',
      ],
    },
    swipeShowcases: [
      {
        id: 'tres-pies-galeria',
        title: 'Tres Pies al Gato',
        description: 'Exploraciones de la novela gráfica.',
        previewImage: '/assets/silvestre-comic.jpeg',
        type: 'internal-reading',
        previewMode: 'pdf',
        previewPdfUrl:
          'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/grafico/Cap%20Aula.pdf',
        swipeNotes: [
          'Swipe vertical en PDF; cada página es una viñeta-ritual.',
          'Optimizado para móvil y tableta.',
        ],
      },
    ],
    comments: [
      {
        id: 'grafico-comment-1',
        quote: '“Cada viñeta parecía escucharme; terminé subrayando con colores.”',
        author: 'Residencia gráfica MX',
      },
      {
        id: 'grafico-comment-2',
        quote: '“El swipe me hizo sentir que estaba dentro del storyboard.”',
        author: 'Colectivo Tres Pies',
      },
    ],
    ctas: {
      primary: 'Explora el miniverso gráfico',
      secondary: 'Súmate a la residencia gráfica',
    },
    iaProfile: {
      type: 'IA asistida para glifos y variaciones gráficas.',
      interaction: 'Swipe narrativo con prompts curados.',
      tokensRange: '110–220 tokens por sesión.',
      coverage: 'Cubierto por suscriptores; sin costo por visitante.',
      footnote: 'La IA abre caminos; el trazo final sigue siendo humano.',
    },
  },
  miniversoMovimiento: {
    label: 'Miniverso Movimiento',
     intro:'En este miniverso, el cuerpo se convierte en meta-. La danza, en escritura. Y la ciudad… en altar vivo.',
         type: 'movement-ritual',
    pendingName: 'La Ruta de las Diosas',
    tagline: 'Meta-corporeidad',
    overview: [
      'La Ruta de las Diosas es una experiencia coreográfica transmedial que recorre plazas, parques y espacios públicos para activar un ritual contemporáneo con avatares, realidad aumentada y movimiento colectivo.',
    ],
    diosaHighlights: [
      'Una presencia digital inspirada en mitologías mesoamericanas.',
      'Diseñada con motion capture.',
      'Acompañada de música original.',
      'Proyectada con videomapping láser durante las noches.',
    ],
    dayNight: [
      'Durante el día, los talleres coreográficos en comunidad trazan mapas sensibles sobre el territorio.',
      'Durante la noche, los cuerpos físicos y virtuales se funden en un mismo acto escénico.',
    ],
    invitation: '¿Y tú? ¿Bailarás con nosotrxs o solo mirarás pasar a las diosas?',
    actions: [
      {
        id: 'ruta',
        label: 'Explora su ruta',
        description: 'Sigue el mapa interactivo o la línea de tiempo animada de cada estación (Tijuana, La Paz, etc.).',
        badge: 'CTA principal',
        buttonLabel: 'Explorar',
        toastMessage: 'Muy pronto liberaremos el mapa coreográfico y el timeline de estaciones.',
        icon: Map,
      },
      {
        id: 'marcador-ar',
        label: 'Activa un marcador AR en tu ciudad',
        description: 'Activa la cámara (WebAR) o abre la guía para instalar la app y recibir instrucciones.',
        buttonLabel: 'Activar AR',
        toastMessage: 'La guía WebAR se está terminando; te avisaremos cuando la cámara pueda abrir el portal.',
        icon: Scan,
      },
      {
        id: 'talleres',
        label: 'Inscríbete a los talleres coreográficos',
        description: 'Conecta con la comunidad y reserva tu lugar en los talleres diurnos que trazan la ruta.',
        buttonLabel: 'Inscribirme',
        toastMessage: 'Abriremos el formulario conectado a Supabase para registrar tu participación.',
        icon: Users,
      },
      {
        id: 'livestream',
        label: 'Sigue el livestream de la función final',
        description: 'Activa un embed o cuenta regresiva para ver la ruta completa cuando llegue la noche.',
        buttonLabel: 'Ver livestream',
        toastMessage: 'El livestream y su countdown estarán activos antes de la función final.',
        icon: RadioTower,
      },
    ],
    diosasGallery: [
      {
        id: 'coatlicue-360',
        title: 'Coatlicue — giro 360°',
        description: 'Avatar ritual en rotación completa.',
        badge: 'Portal AR',
        location: 'CDMX',
        meta: '9:16 / video 360°',
        videoUrl: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/diosas/coatlicue.mp4',
        gradient: 'linear-gradient(165deg, rgba(16,185,129,0.65), rgba(59,130,246,0.55), rgba(168,85,247,0.55))',
      },
      {
        id: 'chanico-360',
        title: 'Chanico — giro 360°',
        description: 'Diosa cuenta-cuentos en giro completo.',
        badge: 'Portal AR',
        location: 'Ruta norte',
        meta: '9:16 / video 360°',
        videoUrl: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/diosas/chanico.mp4',
        gradient: 'linear-gradient(175deg, rgba(14,165,233,0.55), rgba(52,211,153,0.45), rgba(8,47,73,0.75))',
      },
      {
        id: 'chicomecoatl-360',
        title: 'Chicomecóatl — giro 360°',
        description: 'Giro completo para el marcador AR.',
        badge: 'Portal AR',
        location: 'Ruta sur',
        meta: '9:16 / video 360°',
        videoUrl: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/diosas/chicomecoatl.mp4',
        gradient: 'linear-gradient(175deg, rgba(99,102,241,0.52), rgba(20,184,166,0.45), rgba(109,40,217,0.55))',
      },
      {
        id: 'xochiquetzal-360',
        title: 'Xochiquetzal — giro 360°',
        description: 'Flor y arte en giro completo.',
        badge: 'Portal AR',
        location: 'Ruta centro',
        meta: '9:16 / video 360°',
        videoUrl: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/diosas/Xochiquetzal.mp4',
        gradient: 'linear-gradient(170deg, rgba(244,114,182,0.55), rgba(59,130,246,0.45), rgba(16,185,129,0.5))',
      },
      {
        id: 'tzitzimime-360',
        title: 'Tzitzimime — giro 360°',
        description: 'Presencia estelar con giro completo.',
        badge: 'Portal AR',
        location: 'Ruta cosmos',
        meta: '9:16 / video 360°',
        videoUrl: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/diosas/tzitzimime.mp4',
        gradient: 'linear-gradient(180deg, rgba(99,102,241,0.6), rgba(168,85,247,0.5), rgba(14,165,233,0.45))',
      },
      {
        id: 'ixchel-360',
        title: 'Ixchel — giro 360°',
        description: 'Luz y agua en giro completo.',
        badge: 'Portal AR',
        location: 'Ruta maya',
        meta: '9:16 / video 360°',
        videoUrl: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/diosas/Ixchel.mp4',
        gradient: 'linear-gradient(170deg, rgba(56,189,248,0.55), rgba(34,211,238,0.5), rgba(59,130,246,0.45))',
      },
    ],
    collaborators: [],
  
    cartaTitle: '#RutaCoreográfica',
    notaAutoral: 'El cuerpo es conjuro.\nLa ciudad tiembla y abre un portal.\nLa ruta solo existe si alguien baila.',
    iaProfile: {
      type: 'IA de ruta + prompts de movimiento guiados en app.',
      interaction: 'Selección de estación y avatar ritual en AR.',
      tokensRange: '180–320 tokens por usuario.',
      coverage: 'Incluido en la suscripción transmedia.',
      footnote: 'La IA guía; el rito sucede cuando alguien baila.',
    },
  },
  apps: {
    id: 'apps',
    label: 'Miniverso Juegos',
    type: 'apps',
    tagline: 'Juegos como portales • Apps como rituales felinos.',
    intro:
      'Demos jugables del tablero TRAZO: eliges avatar (Maestra, Saturnina, Don Polo…) y el gato anfitrión te abre el telón en 3 taps.',
    cartaTitle: '#GatologíaEnJuego',
    notaAutoral:
      'Nadie vence.\nEnsayamos.\nAl llegar juntxs,\nel Gato habla.',
    tapDemo: {
      title: 'Tap-to-advance demo',
      steps: [
        {
          id: 'step-1',
          title: 'Elige tu avatar',
          description:
            'La Maestra afila tiza, Saturnina trae glitch, Don Polo cobra peaje. Cada uno cambia el tono y las casillas.',
        },
        {
          id: 'step-2',
          title: 'Desbloquea el portal',
          description: 'Toca para abrir la escena: el gato suelta prefijos, el telón sube y aparece la siguiente casilla.',
        },
        {
          id: 'step-3',
          title: 'Recompensa',
          description: 'Guardas la gatología, desbloqueas la siguiente ronda y sumas +20 GAT para seguir improvisando.',
        },
      ],
      ctaLabel: 'Jugar demo',
    },
    actions: [
      {
        id: 'download',
        label: 'Descargar app',
        description: 'APK / TestFlight / PWA con tablero, camerino y gatologías offline.',
        buttonLabel: 'Descargar',
      },
      {
        id: 'watch',
        label: 'Ver walkthrough',
        description: 'Video corto: splash → selector de personaje → telón → gatología guardada.',
        buttonLabel: 'Ver video',
      },
    ],
    iaProfile: {
      type: 'IA para misiones y ritmo de juego felino.',
      interaction: 'Tap / swipe progresivo; sugiere palabras en la voz del personaje.',
      tokensRange: '90–180 tokens por sesión.',
      coverage: 'Incluido en suscripción (no gasta tus GAT).',
      footnote: 'La IA propone el siguiente giro; tú das el tap y decides cuándo cerrar el telón.',
    },
  },
  oraculo: {
    label: 'Miniverso Oráculo',
    type: 'oracle',
    intro:
      'Preguntas que no buscan respuestas, sino resonancia. Alimenta la mente del Gato y gana GATokens por compartir tu pensamiento. El Oráculo no da respuestas, pero sí te recompensa por cada huella que dejas en la red del misterio. Tu pensamiento también construye este universo.',
    loops: [
      'Responde preguntas simbólicas, filosóficas, existenciales, absurdas o personales.',
      'Cada respuesta se guarda como semilla de conocimiento simbólico para IA, literatura y obra interactiva.',
      'Mientras más participas, más GATokens generas (proof-of-resonance con límites diarios anti-spam).',
    ],
    rewards: [
      { title: 'Responder a una pregunta profunda', tokens: '+20 GAT', description: 'Comparte una reflexión que vibre en lo simbólico o emocional.' },
      { title: 'Elegir y comentar reflexiones de otrxs', tokens: '+30 GAT', description: 'Modo foro: amplifica ideas y suma tu mirada.' },
      { title: 'Volver tras una semana', tokens: '+30 GAT', description: 'Retorno que sostiene el hilo y da seguimiento a tu huella.' },
      { title: 'Invitar a alguien con su primera reflexión', tokens: '+50 GAT', description: 'Trae a otra mente al Oráculo. Recompensa única por invitación.' },
    ],
    limitsNote: 'Límites por día para evitar spam y mantener el valor simbólico.',
    seedNotes: [
      'Las respuestas se almacenan como semillas de conocimiento simbólico.',
      'Enriquecen una base de datos viviente para literatura, IA personalizada y obra interactiva.',
      'Cada huella deja señal en la mente del Gato.',
    ],
    ctaLabel: 'Pregunta, responde y mintea',
    ctaDescription:
      'El Oráculo no da respuestas, pero sí te recompensa con GATokens por cada huella que dejas en la red del misterio. Tu pensamiento también construye este universo.',
    tagline: '🧠 Interacción que deja huella. 🪙 Reflexión que te recompensa.',
    cartaTitle: '#MinadoSimbólico',
    notaAutoral: 'Juega con el misterio.\nPiensa con el corazón.\nMintea con el alma.',
    iaProfile: {
      type: 'GPT-4o + embeddings simbólicos curados por la comunidad.',
      interaction: '1–3 reflexiones cortas por sesión; foro breve guiado.',
      tokensRange: '20–120 tokens por reflexión (promedio ~20 GAT).',
      coverage: 'Cubierto por suscriptores; las recompensas son GATokens internos.',
      footnote: 'El minado es simbólico y humano: no es financiero, es resonancia.',
    },
  },
};

const ShowcaseReactionInline = ({ showcaseId, title, description, buttonLabel, className = '' }) => {
  const { user } = useAuth();
  const isAuthenticated = Boolean(user);
  const isSubscriber = Boolean(
    user?.user_metadata?.isSubscriber ||
      user?.user_metadata?.is_subscriber ||
      user?.user_metadata?.subscription_status === 'active' ||
      user?.app_metadata?.roles?.includes?.('subscriber')
  );

  useEffect(() => {
    ensureMiniversoBreathStyle();
  }, []);
  const [status, setStatus] = useState('idle');

  const handleReaction = useCallback(async () => {
    if (status === 'loading') {
      return;
    }

    setStatus('loading');
    const { success, error } = await recordShowcaseLike({ showcaseId, user });
    if (!success) {
      console.error('[ShowcaseReaction] Error guardando like:', error);
      toast({ description: 'No pudimos registrar el like. Intenta de nuevo más tarde.' });
      setStatus('idle');
      return;
    }

    setStatus('success');
    toast({ description: 'Gracias por tu apoyo en este escaparate.' });
  }, [showcaseId, status, user]);

  return (
    <div
      className={`mt-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-500">{title}</p>
          <p className="text-sm text-slate-300 leading-relaxed">{description}</p>
        </div>
        <button
          type="button"
          onClick={handleReaction}
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
      {buttonLabel ? (
        <p className="text-xs uppercase tracking-[0.3em] text-purple-300">
          {status === 'loading' ? 'Enviando…' : buttonLabel}
        </p>
      ) : null}
    </div>
  );
};

const formats = [
  {
    id: 'miniversos',
    title: 'La Obra',
    icon: Drama,
    iconClass: 'text-purple-300',
    instruccion: 'Habla con la obra sobre la obra.',
    iaTokensNote: 'Energía requerida: ~300 GAT',
  },
  {
    id: 'lataza',
    title: 'Artesanías',
    icon: Coffee,
    iconClass: 'text-amber-300',
    instruccion: 'Escanea tu taza. Descubre tu frase.',
    iaTokensNote: 'Mantener ritual: ~90 GAT.',
  },
  {
    id: 'miniversoNovela',
    title: 'Literatura',
    icon: BookOpen,
    iconClass: 'text-emerald-300',
    instruccion: 'Forma parte del club de lectura.',
    iaTokensNote: 'Energía viva: ~150 GAT.',
  },
  {
    id: 'miniversoGrafico',
    title: 'Gráficos',
    icon: Palette,
    iconClass: 'text-fuchsia-300',
    instruccion: 'Refúgiate en nuestros garabatos. ¡Dibuja el tuyo!',
    iaTokensNote: 'Requiere ~110 GAT.',
  },
  {
    id: 'copycats',
    title: 'Cine',
    icon: Film,
    iconClass: 'text-rose-300',
    instruccion: 'Acumula para entradas a la cineteca.',
    iaTokensNote: 'Requiere ~250 de atención.',
  },
  {
    id: 'miniversoSonoro',
    title: 'Sonoridades',
    icon: Music,
    iconClass: 'text-cyan-300',
    instruccion: 'Para compositortes de sueños y poesía.',
    iaTokensNote: 'Requiere ~130 GAT de mezcla.',
  },
  {
    id: 'miniversoMovimiento',
    title: 'Movimiento',
    icon: MapIcon,
    iconClass: 'text-sky-300',
    instruccion: 'Queremos que todo México conozca este proyecto.',
    iaTokensNote: '~280 por mapa.',
  },
  {
    id: 'apps',
    title: 'Juegos / Apps',
    icon: Smartphone,
    iconClass: 'text-lime-300',
    instruccion: 'Aquí reinventamos el clásico gato.',
    iaTokensNote: 'IA marca el ritmo felino (90–180 tokens; no gasta tus GAT).',
  },
  {
    id: 'oraculo',
    title: 'Oráculo',
    icon: Brain,
    iconClass: 'text-indigo-300',
    instruccion: '¡Ponte a minar para generar GATokens!',
    iaTokensNote: 'Aquí el Gato te regala GAT.',
  },
];

const CAUSE_ACCORDION = [
  {
    id: 'tratamientos',
    title: 'Tratamientos emocionales',
    description:
      'Tu apoyo asigna hasta 6 sesiones a un joven sin costo para su familia. Isabel Ayuda para la Vida, A.C. activa las sesiones cuando se detecta riesgo emocional.',
    icon: HeartHandshake,
    metric: '6 sesiones promedio por suscriptor',
    imageAlt: 'Foto de archivo de acompañamiento emocional.',
    imageLabel: 'Foto de archivo',
    imageUrls: [
  'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/causa%20social/seguimiento1.jpg',
  'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/causa%20social/seguimiento3.jpg',
    'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/causa%20social/seguimiento2.jpg',
    'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/causa%20social/seguimiento4.jpg',  
],

  },
  {
    id: 'residencias',
    title: 'Residencias creativas',
    description:
      'Laboratorios de 2 meses donde arte y acompañamiento reparan memoria y cuerpo. Cada 17 suscripciones financian una residencia completa.',
    icon: Palette,
    metric: '3 residencias activas por temporada',
    imageAlt: 'Foto de archivo de residencias creativas.',
    imageLabel: 'Foto de archivo',
    imageUrls: [
      'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/causa%20social/residencias_creativas.jpeg',
      'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/causa%20social/residencias2.jpg',
      'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/causa%20social/residencias3.jpg',
      'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/causa%20social/residencias.jpg',
    ],
  },
  {
    id: 'app-escolar',
  title: 'App Causa Social en escuelas',
  description:
    'Implementación y seguimiento semestral de la app de detección temprana. 75 suscripciones financian 1 escuela por semestre.',
  icon: Smartphone,
  metric: '5 escuelas atendidas por ciclo escolar',
  imageAlt: 'Captura de la app Causa Social en escuelas (versión beta).',
  imageLabel: 'Capturas beta de la app',
    imageUrls: [
      'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/causa%20social/aplicacion_app1.png',
      'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/causa%20social/aplicacion_estudiante.png',
       'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/causa%20social/app_estarbien.png',
      'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/causa%20social/app_estarbien2.png',
     
    
    ],
  },
];

const CauseImpactAccordion = ({ items, onOpenImagePreview }) => {
  const [openCauseId, setOpenCauseId] = useState(null);
  const [activeSlideById, setActiveSlideById] = useState({});

  const handleCarouselScroll = (itemId, event, total) => {
    const target = event.currentTarget;
    if (!target || !total) {
      return;
    }
    const nextIndex = Math.round(target.scrollLeft / target.offsetWidth);
    setActiveSlideById((prev) => {
      if (prev[itemId] === nextIndex) {
        return prev;
      }
      return { ...prev, [itemId]: nextIndex };
    });
  };

  return (
    <div className="mt-4 space-y-3">
      {items.map((item) => {
        const Icon = item.icon;
        const isOpen = openCauseId === item.id;
        const images = Array.isArray(item.imageUrls)
          ? item.imageUrls.filter(Boolean)
          : [];
        const fullImages = Array.isArray(item.imageUrlsFull)
          ? item.imageUrlsFull.filter(Boolean)
          : [];
        const primaryImage = images[0];
        const getFullImage = (index) => fullImages[index] || images[index];
        return (
          <div
            key={item.id}
            className="border border-white/10 rounded-2xl bg-black/20 overflow-hidden transition"
          >
            <button
              type="button"
              onClick={() => setOpenCauseId((prev) => (prev === item.id ? null : item.id))}
              className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-500/15 text-purple-200">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="font-medium text-slate-100">{item.title}</p>
                  <p className="text-xs text-slate-400">{item.metric}</p>
                </div>
              </div>
              <span className="text-xs uppercase tracking-[0.35em] text-slate-500">
                {isOpen ? 'Ocultar' : 'Ver impacto'}
              </span>
            </button>
            {isOpen ? (
              <div className="px-4 pb-4 text-sm text-slate-300/90">
                <div className="flex flex-col gap-3">
                  <div className="md:pr-4">
                    <p>{item.description}</p>
                    <div className="mt-4 hidden md:block">
                      {primaryImage ? (
                        <div className="grid grid-cols-4 gap-3">
                          {Array.from({ length: 4 }).map((_, index) => (
                            <button
                              key={`${item.id}-desk-img-${index}`}
                              type="button"
                              onClick={() =>
                                onOpenImagePreview({
                                  src: getFullImage(index) || getFullImage(0),
                                  title: item.title,
                                  description: item.description,
                                  label: item.imageLabel,
                                })
                              }
                              className="rounded-xl border border-white/10 bg-black/20 hover:border-purple-300/60 hover:shadow-[0_0_18px_rgba(168,85,247,0.2)]"
                              aria-label="Abrir foto de archivo"
                            >
                              <img
                                src={images[index] || images[0]}
                                alt={item.imageAlt || `Foto de ${item.title}`}
                                className="h-[90px] w-full rounded-xl object-cover opacity-80"
                                loading="lazy"
                                decoding="async"
                              />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-3">
                          {Array.from({ length: 4 }).map((_, index) => (
                            <div
                              key={`${item.id}-desk-placeholder-${index}`}
                              className="rounded-xl border border-white/10 bg-black/20"
                            >
                              <div className="flex h-[90px] w-full items-center justify-center rounded-xl text-[10px] uppercase tracking-[0.3em] text-slate-500/80">
                                Foto
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-3 md:hidden">
                      {images.length ? (
                        <>
                          <div
                            className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3"
                            onScroll={(event) =>
                              handleCarouselScroll(item.id, event, images.length)
                            }
                            style={{ minHeight: '256px' }}
                          >
                            {images.map((imageUrl, index) => (
                              <button
                                key={`${item.id}-mobile-img-${index}`}
                                type="button"
                                onClick={() =>
                                  onOpenImagePreview({
                                    src: getFullImage(index),
                                    title: item.title,
                                    description: item.description,
                                    label: item.imageLabel,
                                  })
                                }
                                className="w-full shrink-0 snap-start rounded-xl border border-white/10 bg-black/20 hover:border-purple-300/60 hover:shadow-[0_0_18px_rgba(168,85,247,0.2)]"
                                aria-label="Abrir foto de archivo"
                                style={{ minWidth: '100%', aspectRatio: '1 / 1' }}
                              >
                                <img
                                  src={imageUrl}
                                  alt={item.imageAlt || `Foto de ${item.title}`}
                                  className="w-full h-full rounded-xl object-cover opacity-80"
                                  loading="lazy"
                                  decoding="async"
                                />
                              </button>
                            ))}
                          </div>
                          {images.length > 1 ? (
                            <div className="mt-2 flex items-center justify-center gap-2">
                              {images.map((_, index) => (
                                <span
                                  key={`${item.id}-dot-${index}`}
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    (activeSlideById[item.id] ?? 0) === index
                                      ? 'bg-purple-200'
                                      : 'bg-white/20'
                                  }`}
                                />
                              ))}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <div className="rounded-xl border border-white/10 bg-black/20">
                          <div className="flex aspect-square items-center justify-center rounded-xl text-[10px] uppercase tracking-[0.3em] text-slate-500/80">
                            Foto
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

const AutoficcionPreviewOverlay = ({ open, onClose }) => {
  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] overflow-auto bg-black/80 backdrop-blur-xl p-6">
      <div className="max-w-3xl mx-auto">
        <button
          type="button"
          onClick={onClose}
          className="text-slate-300 hover:text-white mb-6"
        >
          Cerrar ✕
        </button>

        <AutoficcionPreview />
      </div>
    </div>,
    document.body,
  );
};

const Transmedia = () => {
  const baseEnergyByShowcase = useMemo(() => {
    const map = {};
    const parseFromNote = (note) => {
      if (typeof note !== 'string') return 0;
      const match = note.match(/(\d+)/);
      return match ? Number.parseInt(match[1], 10) : 0;
    };
    const registerEnergy = (id, note) => {
      if (map[id]) {
        return;
      }
      let baseAmount = 0;
      switch (id) {
        case 'copycats':
          baseAmount = GAT_COSTS.quironFull;
          break;
        case 'miniversoGrafico':
          baseAmount = GAT_COSTS.graficoSwipe;
          break;
        case 'miniversoNovela':
          baseAmount = GAT_COSTS.novelaChapter;
          break;
        case 'miniversoSonoro':
          baseAmount = GAT_COSTS.sonoroMix;
          break;
        case 'lataza':
          baseAmount = GAT_COSTS.tazaActivation;
          break;
        case 'miniversoMovimiento':
          baseAmount = GAT_COSTS.movimientoRuta;
          break;
        default:
          baseAmount = 0;
      }
      if (!baseAmount) {
        baseAmount = parseFromNote(note);
      }
      map[id] = baseAmount;
    };
    formats.forEach((format) => registerEnergy(format.id, format.iaTokensNote));
    return map;
  }, []);
  const initialQuironSpent = readStoredBool('gatoencerrado:quiron-spent', false);
  const initialNovelaQuestions = readStoredInt('gatoencerrado:novela-questions', 0);
  const initialGraphicSpent = readStoredBool('gatoencerrado:graphic-spent', false);
  const initialSonoroSpent = readStoredBool('gatoencerrado:sonoro-spent', false);
  const initialTazaActivations = readStoredInt('gatoencerrado:taza-activations', 0);
  const initialAvailableGATokens = readStoredInt('gatoencerrado:gatokens-available', 150);
  const storedEnergy = readStoredJson('gatoencerrado:showcase-energy', null);
  const initialShowcaseEnergy = storedEnergy
    ? { ...baseEnergyByShowcase, ...storedEnergy }
    : baseEnergyByShowcase;
  const initialShowcaseBoosts = readStoredJson('gatoencerrado:showcase-boosts', {});
  const initialSpentSilvestreQuestions = readStoredJson(SILVESTRE_QUESTIONS_STORAGE_KEY, []);
  const storedBadge = readStoredJson(EXPLORER_BADGE_STORAGE_KEY, null);
  const initialExplorerBadge = storedBadge
    ? { ...DEFAULT_BADGE_STATE, ...storedBadge }
    : DEFAULT_BADGE_STATE;

  const [isMiniverseOpen, setIsMiniverseOpen] = useState(false);
  const [miniverseContext, setMiniverseContext] = useState(null);
  const [activeShowcase, setActiveShowcase] = useState(null);
  const [showcaseContent, setShowcaseContent] = useState({});
  const showcaseRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [pdfNumPages, setPdfNumPages] = useState(null);
  const [pdfLoadError, setPdfLoadError] = useState(null);
  const pdfContainerRef = useRef(null);
  const supportSectionRef = useRef(null);
  const [isMiniversoEditorialModalOpen, setIsMiniversoEditorialModalOpen] = useState(false);
  const [pdfContainerWidth, setPdfContainerWidth] = useState(0);
  const pdfPageWidth = Math.max(pdfContainerWidth - 48, 320);
  const [isTazaARActive, setIsTazaARActive] = useState(false);
  const [isMobileARFullscreen, setIsMobileARFullscreen] = useState(false);
  const [showAutoficcionPreview, setShowAutoficcionPreview] = useState(false);
  const [micPromptVisible, setMicPromptVisible] = useState(false);
  const [hasShownMicPrompt, setHasShownMicPrompt] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [micError, setMicError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showSilvestreCoins, setShowSilvestreCoins] = useState(false);
  const [isSilvestreResponding, setIsSilvestreResponding] = useState(false);
  const [isSilvestreFetching, setIsSilvestreFetching] = useState(false);
  const [isSilvestrePlaying, setIsSilvestrePlaying] = useState(false);
  const [pendingSilvestreAudioUrl, setPendingSilvestreAudioUrl] = useState(null);
  const [spentSilvestreQuestions, setSpentSilvestreQuestions] = useState(
    Array.isArray(initialSpentSilvestreQuestions) ? initialSpentSilvestreQuestions : []
  );
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const micTimeoutRef = useRef(null);
  const silvestreAudioRef = useRef(null);
  const silvestreAudioUrlRef = useRef(null);
  const silvestreRequestIdRef = useRef(0);
  const silvestreAbortRef = useRef(null);
  const ignoreNextTranscriptRef = useRef(false);
  const [isMovementCreditsOpen, setIsMovementCreditsOpen] = useState(false);
  const [openCollaboratorId, setOpenCollaboratorId] = useState(null);
  const { isMobileViewport, canUseInlinePlayback, requestMobileVideoPresentation } = useMobileVideoPresentation();
  const { user } = useAuth();
  const [quironSpent, setQuironSpent] = useState(initialQuironSpent);
  const [graphicSpent, setGraphicSpent] = useState(initialGraphicSpent);
  const [novelaQuestions, setNovelaQuestions] = useState(initialNovelaQuestions);
  const [isNovelaReserveOpen, setIsNovelaReserveOpen] = useState(false);
  const [sonoroSpent, setSonoroSpent] = useState(initialSonoroSpent);
  const [tazaActivations, setTazaActivations] = useState(initialTazaActivations);
  const [showQuironCommunityPrompt, setShowQuironCommunityPrompt] = useState(false);
  const [isQuironUnlocking, setIsQuironUnlocking] = useState(false);
  const [showQuironCoins, setShowQuironCoins] = useState(false);
  const [isQuironFullVisible, setIsQuironFullVisible] = useState(initialQuironSpent);
  const [availableGATokens, setAvailableGATokens] = useState(initialAvailableGATokens);
  const [isNovelaSubmitting, setIsNovelaSubmitting] = useState(false);
  const [showNovelaCoins, setShowNovelaCoins] = useState(false);
  const [showSonoroCoins, setShowSonoroCoins] = useState(false);
  const [showTazaCoins, setShowTazaCoins] = useState(false);
  const [isTazaActivating, setIsTazaActivating] = useState(false);
  const [tazaCameraReady, setTazaCameraReady] = useState(false);
  const [showGraphicCoins, setShowGraphicCoins] = useState(false);
  const [isGraphicUnlocking, setIsGraphicUnlocking] = useState(false);
  const [tapIndex, setTapIndex] = useState(0);
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [contributionCategoryId, setContributionCategoryId] = useState(null);
  const [explorerBadge, setExplorerBadge] = useState(initialExplorerBadge);
  const [showBadgeCoins, setShowBadgeCoins] = useState(false);
  const [showBadgeLoginOverlay, setShowBadgeLoginOverlay] = useState(false);
  const [showcaseEnergy, setShowcaseEnergy] = useState(initialShowcaseEnergy);
  const [showcaseBoosts, setShowcaseBoosts] = useState(initialShowcaseBoosts);
  const [celebratedShowcaseId, setCelebratedShowcaseId] = useState(null);
  const celebrationTimeoutRef = useRef(null);
  const badgeCoinsTimeoutRef = useRef(null);
  const [publicContributions, setPublicContributions] = useState({});
  const [publicContributionsLoading, setPublicContributionsLoading] = useState({});
  const [publicContributionsError, setPublicContributionsError] = useState({});
  const [commentCarouselIndex, setCommentCarouselIndex] = useState(0);
  const [isOraculoOpen, setIsOraculoOpen] = useState(false);
  const [isCauseSiteOpen, setIsCauseSiteOpen] = useState(false);
  const [showInstallPwaCTA, setShowInstallPwaCTA] = useState(false);
  const spentSilvestreSet = useMemo(
    () => new Set(spentSilvestreQuestions),
    [spentSilvestreQuestions]
  );
  const isAuthenticated = Boolean(user);
  const isSubscriber = Boolean(
    user?.user_metadata?.isSubscriber ||
      user?.user_metadata?.is_subscriber ||
      user?.user_metadata?.subscription_status === 'active' ||
      user?.app_metadata?.roles?.includes?.('subscriber')
  );
  const allShowcasesUnlocked = useMemo(
    () => SHOWCASE_BADGE_IDS.every((id) => showcaseBoosts?.[id]),
    [showcaseBoosts]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isMobile = /iphone|ipad|ipod|android/i.test(userAgent);
    const mediaQuery = window.matchMedia
      ? window.matchMedia('(display-mode: standalone)')
      : null;

    const updateVisibility = () => {
      const isStandalone =
        Boolean(mediaQuery?.matches) ||
        Boolean(typeof navigator !== 'undefined' && navigator.standalone === true);
      setShowInstallPwaCTA(isMobile && !isStandalone);
    };

    updateVisibility();

    const mediaListener = () => updateVisibility();
    if (mediaQuery?.addEventListener) {
      mediaQuery.addEventListener('change', mediaListener);
    } else if (mediaQuery?.addListener) {
      mediaQuery.addListener(mediaListener);
    }

    window.addEventListener('appinstalled', updateVisibility);

    return () => {
      if (mediaQuery?.removeEventListener) {
        mediaQuery.removeEventListener('change', mediaListener);
      } else if (mediaQuery?.removeListener) {
        mediaQuery.removeListener(mediaListener);
      }
      window.removeEventListener('appinstalled', updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storage = window.localStorage;
    if (!storage) return;
    if (!storage.getItem('gatoencerrado:gatokens-available')) {
      storage.setItem('gatoencerrado:gatokens-available', String(initialAvailableGATokens));
    }
    if (!storage.getItem('gatoencerrado:showcase-energy')) {
      storage.setItem('gatoencerrado:showcase-energy', JSON.stringify(baseEnergyByShowcase));
    }
  }, [baseEnergyByShowcase, initialAvailableGATokens]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage?.setItem(
      SILVESTRE_QUESTIONS_STORAGE_KEY,
      JSON.stringify(spentSilvestreQuestions)
    );
  }, [spentSilvestreQuestions]);

  const markSilvestreQuestionSpent = useCallback((question) => {
    if (!question) return;
    setSpentSilvestreQuestions((prev) => {
      if (prev.includes(question)) return prev;
      return [...prev, question];
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleResumeContribution = () => setIsContributionOpen(true);
    window.addEventListener('gatoencerrado:resume-contribution', handleResumeContribution);
    return () => window.removeEventListener('gatoencerrado:resume-contribution', handleResumeContribution);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    window.localStorage?.setItem(EXPLORER_BADGE_STORAGE_KEY, JSON.stringify(explorerBadge));
    return undefined;
  }, [explorerBadge]);

  useEffect(() => {
    return () => {
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current);
      }
      if (badgeCoinsTimeoutRef.current) {
        clearTimeout(badgeCoinsTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleStorage = (event) => {
      if (event.key === 'gatoencerrado:novela-questions') {
        const value = event.newValue ? Number.parseInt(event.newValue, 10) : 0;
        if (!Number.isNaN(value)) {
          setNovelaQuestions(value);
        }
      }
      if (event.key === 'gatoencerrado:sonoro-spent' && event.newValue === 'true') {
        setSonoroSpent(true);
      }
      if (event.key === 'gatoencerrado:sonoro-spent' && event.newValue === null) {
        setSonoroSpent(false);
      }
      if (event.key === 'gatoencerrado:graphic-spent') {
        setGraphicSpent(event.newValue === 'true');
      }
      if (event.key === 'gatoencerrado:taza-activations') {
        const value = event.newValue ? Number.parseInt(event.newValue, 10) : 0;
        if (!Number.isNaN(value)) {
          setTazaActivations(value);
        }
      }
    };

    const handleCustomSpent = (event) => {
      if (event?.detail?.id === 'novela' && typeof event.detail.count === 'number') {
        setNovelaQuestions(event.detail.count);
      }
      if (event?.detail?.id === 'sonoro' && typeof event.detail.spent === 'boolean') {
        setSonoroSpent(event.detail.spent);
      }
      if (event?.detail?.id === 'grafico' && typeof event.detail.spent === 'boolean') {
        setGraphicSpent(event.detail.spent);
      }
      if (event?.detail?.id === 'taza' && typeof event.detail.count === 'number') {
        setTazaActivations(event.detail.count);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('gatoencerrado:miniverse-spent', handleCustomSpent);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('gatoencerrado:miniverse-spent', handleCustomSpent);
    };
  }, []);

  useEffect(() => {
    if (!allShowcasesUnlocked || explorerBadge.unlocked) {
      return;
    }
    setExplorerBadge((prev) => ({
      ...prev,
      unlocked: true,
      unlockedAt: Date.now(),
    }));
  }, [allShowcasesUnlocked, explorerBadge.unlocked]);

  const handleNovelaQuestionSend = useCallback(() => {
    if (isNovelaSubmitting) {
      return;
    }
    setIsNovelaSubmitting(true);
    setShowNovelaCoins(true);
    const delayPromise = new Promise((resolve) => setTimeout(resolve, 1100));
    delayPromise.then(() => {
      setShowNovelaCoins(false);
      setIsNovelaSubmitting(false);
      setNovelaQuestions((prev) => {
        const next = prev + 1;
        if (typeof window !== 'undefined') {
          window.localStorage?.setItem('gatoencerrado:novela-questions', String(next));
          window.dispatchEvent(
            new CustomEvent('gatoencerrado:miniverse-spent', {
              detail: { id: 'novela', spent: true, amount: 25, count: next },
            })
          );
        }
        return next;
      });
    });
  }, [isNovelaSubmitting]);

  const handleSonoroEnter = useCallback(() => {
    if (sonoroSpent) {
      return;
    }
    setShowSonoroCoins(true);
    setTimeout(() => setShowSonoroCoins(false), 1100);
    setSonoroSpent(true);
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem('gatoencerrado:sonoro-spent', 'true');
      window.dispatchEvent(
        new CustomEvent('gatoencerrado:miniverse-spent', {
          detail: { id: 'sonoro', spent: true, amount: 130 },
        })
      );
    }
  }, [sonoroSpent]);

  const handleToggleQuironPrompt = useCallback(() => {
    if (!user) {
      setShowQuironCommunityPrompt((prev) => !prev);
      return;
    }

    if (isQuironUnlocking) {
      return;
    }

    if (availableGATokens < GAT_COSTS.quironFull) {
      setShowQuironCommunityPrompt(false);
      toast({
        description: `Necesitas ${GAT_COSTS.quironFull} GATokens para ver el cortometraje completo. Tu saldo actual es ${availableGATokens}.`,
      });
      return;
    }

    setShowQuironCommunityPrompt(false);
    setIsQuironUnlocking(true);
    setShowQuironCoins(true);

    const delayPromise = new Promise((resolve) => setTimeout(resolve, 1100));
    delayPromise.then(() => {
      setIsQuironFullVisible(true);
      setShowQuironCoins(false);
      setIsQuironUnlocking(false);
      setQuironSpent(true);
      const nextBalance = Math.max(availableGATokens - GAT_COSTS.quironFull, 0);
      setAvailableGATokens(nextBalance);
      if (typeof window !== 'undefined') {
        window.localStorage?.setItem('gatoencerrado:quiron-spent', 'true');
        window.localStorage?.setItem('gatoencerrado:gatokens-available', String(nextBalance));
        window.dispatchEvent(
          new CustomEvent('gatoencerrado:miniverse-spent', {
            detail: { id: 'cine', spent: true, amount: GAT_COSTS.quironFull },
          })
        );
      }
    });
  }, [availableGATokens, isQuironUnlocking, user]);

  const handleCloseQuironFull = useCallback(() => {
    setIsQuironFullVisible(false);
  }, []);

  const renderMobileVideoBadge = () =>
    isMobileViewport ? (
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/80">
          <Video size={14} />
          Ver video
        </div>
      </div>
    ) : null;

  const handleOpenMiniverses = useCallback((contextLabel = null) => {
    const normalizedLabel = typeof contextLabel === 'string' ? contextLabel : null;
    setMiniverseContext(normalizedLabel);
    setIsMiniverseOpen(true);
  }, []);

  const handleCloseMiniverses = useCallback(() => {
    setIsMiniverseOpen(false);
    setMiniverseContext(null);
  }, []);

  const loadShowcaseContent = useCallback(async (showcaseId) => {
    const definition = showcaseDefinitions[showcaseId];
    if (!definition || definition.type === 'blog-series' || !definition.slug) {
      return;
    }

    setShowcaseContent((prev) => ({
      ...prev,
      [showcaseId]: { ...(prev[showcaseId] ?? {}), status: 'loading', error: null },
    }));

    try {
      const post = await fetchBlogPostBySlug(definition.slug);
      if (!post) {
        throw new Error('No encontramos el texto asociado a este miniverso.');
      }

      setShowcaseContent((prev) => ({
        ...prev,
        [showcaseId]: { status: 'success', post, error: null },
      }));
    } catch (error) {
      setShowcaseContent((prev) => ({
        ...prev,
        [showcaseId]: {
          status: 'error',
          post: null,
          error: error?.message ?? 'Ocurrió un error al cargar este escaparate.',
        },
      }));
    }
  }, []);

  const openMiniverseById = useCallback(
    (formatId) => {
      if (!formatId || !showcaseDefinitions[formatId]) return;
      setActiveShowcase(formatId);
      const definition = showcaseDefinitions[formatId];
      if (definition.slug && definition.type !== 'blog-series') {
        const entry = showcaseContent[formatId];
        if (!entry || entry.status === 'error') {
          loadShowcaseContent(formatId);
        }
      }
    },
    [loadShowcaseContent, showcaseContent]
  );

  const handleSelectMiniverse = useCallback(
    (formatId) => {
      if (!formatId) return;
      if (MINIVERSO_EDITORIAL_INTERCEPTION_ENABLED) {
        setIsMiniversoEditorialModalOpen(true);
        return;
      }
      if (showcaseDefinitions[formatId]) {
        if (typeof document !== 'undefined') {
          const anchor = document.querySelector('#transmedia');
          if (anchor) {
            const target = anchor.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({ top: target, behavior: 'smooth' });
            const startTs = performance.now();
            const maxWait = 1200;
            const waitForScroll = () => {
              const currentY = window.scrollY;
              if (Math.abs(currentY - target) < 12 || performance.now() - startTs > maxWait) {
                openMiniverseById(formatId);
                return;
              }
              requestAnimationFrame(waitForScroll);
            };
            requestAnimationFrame(waitForScroll);
          } else {
            openMiniverseById(formatId);
          }
        } else {
          openMiniverseById(formatId);
        }
      }
      setIsMiniverseOpen(false);
      setMiniverseContext(null);
    },
    [openMiniverseById, setIsMiniversoEditorialModalOpen]
  );

  const handleFormatClick = useCallback(
    (formatId) => {
      if (MINIVERSO_EDITORIAL_INTERCEPTION_ENABLED) {
        setIsMiniversoEditorialModalOpen(true);
        return;
      }
      if (showcaseDefinitions[formatId]) {
        setActiveShowcase((prev) => (prev === formatId ? null : formatId));
        const definition = showcaseDefinitions[formatId];
        if (definition.slug && definition.type !== 'blog-series') {
          const entry = showcaseContent[formatId];
          if (!entry || entry.status === 'error') {
            loadShowcaseContent(formatId);
          }
        }
        return;
      }
      handleOpenMiniverses();
    },
    [handleOpenMiniverses, loadShowcaseContent, showcaseContent]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleOpenMiniverseList = () => {
      handleOpenMiniverses('Explora los miniversos');
    };
    window.addEventListener('gatoencerrado:open-miniverse-list', handleOpenMiniverseList);
    return () =>
      window.removeEventListener('gatoencerrado:open-miniverse-list', handleOpenMiniverseList);
  }, [handleOpenMiniverses]);

  const handleOpenBlogEntry = useCallback((slug) => {
    if (!slug) {
      return;
    }
    window.dispatchEvent(
      new CustomEvent('gatoencerrado:open-blog', {
        detail: { slug },
      })
    );
    document.getElementById('dialogo-critico')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const stopSilvestreAudio = useCallback(() => {
    if (silvestreAudioRef.current) {
      silvestreAudioRef.current.pause();
      silvestreAudioRef.current.src = '';
      silvestreAudioRef.current = null;
    }
    if (silvestreAudioUrlRef.current) {
      URL.revokeObjectURL(silvestreAudioUrlRef.current);
      silvestreAudioUrlRef.current = null;
    }
    setIsSilvestrePlaying(false);
    setPendingSilvestreAudioUrl(null);
  }, []);

  const stopSilvestreResponse = useCallback(() => {
    if (silvestreAbortRef.current) {
      silvestreAbortRef.current.abort();
      silvestreAbortRef.current = null;
    }
    silvestreRequestIdRef.current += 1;
    stopSilvestreAudio();
    setIsSilvestreFetching(false);
    setIsSilvestreResponding(false);
  }, [stopSilvestreAudio]);

  const recordObraChat = useCallback(
    async ({ question, answer, source }) => {
      if (!question) return;
      const shouldRecordObraChat = false;
      if (!shouldRecordObraChat) {
        return;
      }
      try {
        const anonId = ensureAnonId();
        // Use anon client to avoid session roles like admin blocking PostgREST.
        const { error } = await supabasePublic.from('miniverso_obra_interactions').insert({
          interaction_type: 'chat',
          question,
          answer: answer || null,
          source: source || null,
          user_id: user?.id ?? null,
          anon_id: anonId ?? null,
        });
        if (error) {
          console.error('[La Obra Chat] Supabase insert error:', error);
        }
      } catch (error) {
        console.error('[La Obra Chat] Supabase insert failed:', error);
      }
    },
    [user]
  );

  const sendTranscript = useCallback(async (message, options = {}) => {
    if (!message) {
      return false;
    }
    const source = options.source || null;
    let requestId = 0;
    try {
      if (silvestreAbortRef.current) {
        silvestreAbortRef.current.abort();
      }
      stopSilvestreAudio();
      const controller = new AbortController();
      silvestreAbortRef.current = controller;
      requestId = (silvestreRequestIdRef.current += 1);
      setIsSilvestreFetching(true);
      setIsSilvestreResponding(true);
      const apiBase = import.meta.env.VITE_OBRA_API_URL;
      const forceConciencia =
        (import.meta.env.VITE_OBRA_FORCE_CONCIENCIA ?? 'false') === 'true';
      const useObraConciencia =
        (import.meta.env.VITE_OBRA_USE_CONCIENCIA ?? 'true') === 'true';
      const isPreset = source === 'preset';
      const useConcienciaForThisRequest = forceConciencia || (useObraConciencia && isPreset);
      const userId = user?.id ?? 'anonymous';
      const candidates = useConcienciaForThisRequest
        ? [
            {
              endpoint: '/api/obra-conciencia',
              payload: { pregunta: message, user_id: userId },
              label: 'conciencia',
            },
          ]
        : [
            {
              endpoint: '/api/obra-voz',
              payload: { mensaje: message },
              label: 'voz',
            },
            {
              endpoint: '/api/obra-conciencia',
              payload: { pregunta: message, user_id: userId },
              label: 'conciencia (fallback)',
            },
          ];

      let audioBlob = null;
      let responseText = null;
      let lastError = null;

      for (const candidate of candidates) {
        try {
          const response = await fetch(`${apiBase}${candidate.endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': userId,
            },
            body: JSON.stringify(candidate.payload),
            signal: controller.signal,
          });
          if (requestId !== silvestreRequestIdRef.current) {
            return false;
          }
          if (!response.ok) {
            throw new Error(`${candidate.label} responded ${response.status}`);
          }
          responseText =
            response.headers.get('x-silvestre-text') ||
            response.headers.get('x-silvestre-answer') ||
            null;
          const blob = await response.blob();
          if (requestId !== silvestreRequestIdRef.current) {
            return false;
          }
          if (!blob || !(blob.type || '').startsWith('audio/')) {
            throw new Error(`${candidate.label} returned non-audio payload (${blob?.type || 'unknown'})`);
          }
          audioBlob = blob;
          break;
        } catch (error) {
          console.error('[Silvestre Voice] candidate error:', error);
          lastError = error;
        }
      }

      if (!audioBlob) {
        throw lastError || new Error('No se pudo obtener audio de La Obra');
      }
      if (requestId === silvestreRequestIdRef.current) {
        setIsSilvestreFetching(false);
      }
      await recordObraChat({ question: message, answer: responseText, source });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.playsInline = true;
      silvestreAudioRef.current = audio;
      silvestreAudioUrlRef.current = audioUrl;
      audio.addEventListener(
        'play',
        () => {
          setIsSilvestrePlaying(true);
        },
        { once: true }
      );
      audio.addEventListener(
        'ended',
        () => {
          if (silvestreAudioUrlRef.current === audioUrl) {
            URL.revokeObjectURL(audioUrl);
            silvestreAudioUrlRef.current = null;
            silvestreAudioRef.current = null;
            setIsSilvestreResponding(false);
            setIsSilvestrePlaying(false);
            setShowSilvestreCoins(true);
            setTimeout(() => setShowSilvestreCoins(false), 1200);
            setPendingSilvestreAudioUrl(null);
          }
        },
        { once: true }
      );
      try {
        await audio.play();
      } catch (playError) {
        if (playError?.name === 'NotAllowedError') {
          setPendingSilvestreAudioUrl(audioUrl);
          setIsSilvestreResponding(false);
          setIsSilvestrePlaying(false);
          setMicError('Toca “Reproducir” para escuchar la respuesta.');
          return true;
        }
        if (silvestreAudioUrlRef.current === audioUrl) {
          URL.revokeObjectURL(audioUrl);
          silvestreAudioUrlRef.current = null;
          silvestreAudioRef.current = null;
          setIsSilvestreResponding(false);
          setIsSilvestrePlaying(false);
        }
        throw playError;
      }
      setMicError('');
      return true;
    } catch (error) {
      if (error?.name === 'AbortError') {
        if (requestId === silvestreRequestIdRef.current) {
          setIsSilvestreFetching(false);
          setIsSilvestreResponding(false);
        }
        return false;
      }
      console.error('[Silvestre Voice] Error sending transcript:', error);
      setMicError('No pudimos enviar tu mensaje a Silvestre. Intenta nuevamente más tarde.');
      if (requestId === silvestreRequestIdRef.current) {
        setIsSilvestreFetching(false);
        setIsSilvestreResponding(false);
      }
      return false;
    }
  }, [recordObraChat, stopSilvestreAudio, user]);

  const stopSilvestreListening = useCallback((options = {}) => {
    const { discardTranscript = false } = options;
    if (discardTranscript) {
      ignoreNextTranscriptRef.current = true;
      transcriptRef.current = '';
      setTranscript('');
    }
    if (micTimeoutRef.current) {
      clearTimeout(micTimeoutRef.current);
      micTimeoutRef.current = null;
    }
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('[Silvestre Voice] stop error:', err);
      }
    }
    setIsListening(false);
  }, [isListening]);

  const handlePlayPendingAudio = useCallback(async () => {
    if (!pendingSilvestreAudioUrl) return;
    let audio = silvestreAudioRef.current;
    if (!audio || silvestreAudioUrlRef.current !== pendingSilvestreAudioUrl) {
      audio = new Audio(pendingSilvestreAudioUrl);
      audio.playsInline = true;
      silvestreAudioRef.current = audio;
      silvestreAudioUrlRef.current = pendingSilvestreAudioUrl;
      audio.addEventListener(
        'ended',
        () => {
          if (silvestreAudioUrlRef.current === pendingSilvestreAudioUrl) {
            URL.revokeObjectURL(pendingSilvestreAudioUrl);
            silvestreAudioUrlRef.current = null;
            silvestreAudioRef.current = null;
            setIsSilvestreResponding(false);
            setIsSilvestrePlaying(false);
            setPendingSilvestreAudioUrl(null);
          }
        },
        { once: true }
      );
    }
    try {
      await audio.play();
      setIsSilvestrePlaying(true);
      setIsSilvestreResponding(false);
      setPendingSilvestreAudioUrl(null);
      setMicError('');
    } catch (err) {
      console.error('[Silvestre Voice] play pending error:', err);
      setMicError('No pudimos reproducir el audio. Intenta tocar de nuevo.');
    }
  }, [pendingSilvestreAudioUrl]);

  const handleOpenSilvestreChat = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (
      pendingSilvestreAudioUrl &&
      !isListening &&
      !isSilvestrePlaying &&
      !isSilvestreResponding &&
      !isSilvestreFetching
    ) {
      handlePlayPendingAudio();
      return;
    }
    if (isSilvestreFetching) {
      return;
    }

    if (!hasShownMicPrompt) {
      setMicPromptVisible(true);
      setHasShownMicPrompt(true);
    } else if (!micPromptVisible) {
      setMicPromptVisible(true);
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError(
        'Tu navegador no permite activar el micrófono. Puedes escribirle a Silvestre si prefieres.'
      );
      window.dispatchEvent(new CustomEvent('gatoencerrado:open-silvestre'));
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-MX';
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        const results = Array.from(event.results);
        const text = results.map((result) => result[0]?.transcript ?? '').join(' ');
        transcriptRef.current = text;
        setTranscript(text);
      };
      recognition.onerror = (event) => {
        console.error('[Silvestre Voice] recognition error:', event);
        setMicError('No pudimos acceder al micrófono. Intenta nuevamente.');
        setIsListening(false);
      };
      recognition.onend = () => {
        setIsListening(false);
        if (ignoreNextTranscriptRef.current) {
          ignoreNextTranscriptRef.current = false;
          return;
        }
        const finalText = transcriptRef.current.trim();
        if (finalText) {
          sendTranscript(finalText, { source: 'mic' });
          transcriptRef.current = '';
        }
      };
      recognitionRef.current = recognition;
    }

    if (isListening) {
      stopSilvestreListening();
        return;
      }

      try {
        recognitionRef.current.start();
        setIsListening(true);
        setMicError('');
        if (micTimeoutRef.current) {
          clearTimeout(micTimeoutRef.current);
        }
        micTimeoutRef.current = setTimeout(() => {
          stopSilvestreListening();
        }, 45000);
      } catch (error) {
        console.error('[Silvestre Voice] start error:', error);
        setMicError('No pudimos abrir el micrófono. Intenta nuevamente.');
      }

    window.dispatchEvent(new CustomEvent('gatoencerrado:open-silvestre'));
  }, [
    handlePlayPendingAudio,
    hasShownMicPrompt,
    isSilvestrePlaying,
    isSilvestreResponding,
    isSilvestreFetching,
    pendingSilvestreAudioUrl,
    isListening,
    micPromptVisible,
    sendTranscript,
    stopSilvestreListening,
  ]);

  const handleSendSilvestrePreset = useCallback(
    async (starter) => {
      if (!starter) {
        return;
      }

      if (isListening) {
        stopSilvestreListening({ discardTranscript: true });
      }

      setTranscript(starter);
      await sendTranscript(starter, { source: 'preset' });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('gatoencerrado:open-silvestre', {
            detail: { source: 'preset', mensaje: starter },
          })
        );
      }
    },
    [isListening, sendTranscript, stopSilvestreListening]
  );

  useEffect(() => {
    return () => {
      if (micTimeoutRef.current) {
        clearTimeout(micTimeoutRef.current);
      }
      if (silvestreAbortRef.current) {
        silvestreAbortRef.current.abort();
      }
      stopSilvestreAudio();
    };
  }, [stopSilvestreAudio]);

  const handleOpenImagePreview = useCallback((payload) => {
    if (!payload?.src) {
      return;
    }
    setImagePreview({
      src: payload.src,
      title: payload.title ?? '',
      description: payload.description ?? '',
      label: payload.label ?? '',
    });
  }, []);

  const handleCloseImagePreview = useCallback(() => {
    setImagePreview(null);
  }, []);

  const handleCloseMiniversoEditorialModal = useCallback(() => {
    setIsMiniversoEditorialModalOpen(false);
  }, []);

  const handleEditorialCtaClick = useCallback(() => {
    setIsMiniversoEditorialModalOpen(false);
    setTimeout(() => {
      supportSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }, []);

  const handleScrollToSupport = useCallback(() => {
    supportSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleOpenPdfPreview = useCallback((payload) => {
    if (!payload?.src) {
      return;
    }
    setPdfPreview({
      src: payload.src,
      title: payload.title ?? '',
      description: payload.description ?? '',
    });
    setPdfNumPages(null);
    setPdfLoadError(null);
  }, []);

  const handleClosePdfPreview = useCallback(() => {
    setPdfPreview(null);
    setPdfNumPages(null);
    setPdfLoadError(null);
  }, []);

  const handleOpenGraphicSwipe = useCallback(
    (entry) => {
      if (!entry?.previewPdfUrl || isGraphicUnlocking) {
        return;
      }

      setIsGraphicUnlocking(true);

      const openPdf = () => {
        handleOpenPdfPreview({
          src: entry.previewPdfUrl,
          title: entry.title,
          description: entry.description
            ? `${entry.description} · Modo swipe vertical.`
            : 'Modo swipe vertical del lector visual interactivo.',
        });
        setTimeout(() => setIsGraphicUnlocking(false), 150);
      };

      if (!graphicSpent) {
        setGraphicSpent(true);
        setShowGraphicCoins(true);
        setTimeout(() => setShowGraphicCoins(false), 1100);
        if (typeof window !== 'undefined') {
          window.localStorage?.setItem('gatoencerrado:graphic-spent', 'true');
          window.dispatchEvent(
            new CustomEvent('gatoencerrado:miniverse-spent', {
              detail: { id: 'grafico', spent: true, amount: GAT_COSTS.graficoSwipe },
            })
          );
        }
        setTimeout(openPdf, 900);
        return;
      }

      openPdf();
    },
    [graphicSpent, handleOpenPdfPreview, isGraphicUnlocking]
  );

  const handleActivateAR = useCallback(() => {
    if (isTazaActivating) {
      return;
    }

    setIsTazaActivating(true);
    setShowTazaCoins(true);
    setTazaCameraReady(false);

    const next = tazaActivations + 1;
    setTazaActivations(next);
    setIsTazaARActive(true);
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches) {
      setIsMobileARFullscreen(true);
      document.body.classList.add('overflow-hidden');
    } else {
      setIsMobileARFullscreen(false);
    }
    setTimeout(() => {
      setShowTazaCoins(false);
      setIsTazaActivating(false);
    }, 700);
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem('gatoencerrado:taza-activations', String(next));
      window.dispatchEvent(
        new CustomEvent('gatoencerrado:miniverse-spent', {
          detail: { id: 'taza', spent: true, amount: 30, count: next },
        })
      );
    }
  }, [isTazaActivating, tazaActivations]);

  const handleCloseARExperience = useCallback(() => {
    setIsTazaARActive(false);
    setIsMobileARFullscreen(false);
    document.body.classList.remove('overflow-hidden');
    setIsTazaActivating(false);
    setTazaCameraReady(false);
  }, []);

  const handleARError = useCallback(
    (err) => {
      const description =
        err?.message ||
        'No pudimos iniciar la activación WebAR. Revisa permisos de cámara, luz y conexión.';
      toast({ description });
      setIsTazaARActive(false);
      setIsMobileARFullscreen(false);
      setTazaCameraReady(false);
      document.body.classList.remove('overflow-hidden');
    },
    [toast]
  );

  const handleResetCredits = useCallback(() => {
    setQuironSpent(false);
    setIsQuironFullVisible(false);
    setNovelaQuestions(0);
    setSonoroSpent(false);
    setShowSonoroCoins(false);
    setGraphicSpent(false);
    setShowGraphicCoins(false);
    setIsGraphicUnlocking(false);
    setTazaActivations(0);
    setShowTazaCoins(false);
    setSpentSilvestreQuestions([]);
    if (typeof window !== 'undefined') {
      window.localStorage?.removeItem('gatoencerrado:quiron-spent');
      window.localStorage?.removeItem('gatoencerrado:novela-questions');
      window.localStorage?.removeItem('gatoencerrado:sonoro-spent');
      window.localStorage?.removeItem('gatoencerrado:graphic-spent');
      window.localStorage?.removeItem('gatoencerrado:taza-activations');
      window.localStorage?.removeItem(SILVESTRE_QUESTIONS_STORAGE_KEY);
      window.dispatchEvent(
        new CustomEvent('gatoencerrado:miniverse-spent', {
          detail: { id: 'novela', spent: false, amount: 0, count: 0 },
        })
      );
      window.dispatchEvent(
        new CustomEvent('gatoencerrado:miniverse-spent', {
          detail: { id: 'cine', spent: false, amount: 0 },
        })
      );
      window.dispatchEvent(
        new CustomEvent('gatoencerrado:miniverse-spent', {
          detail: { id: 'sonoro', spent: false, amount: 0 },
        })
      );
      window.dispatchEvent(
        new CustomEvent('gatoencerrado:miniverse-spent', {
          detail: { id: 'grafico', spent: false, amount: 0 },
        })
      );
      window.dispatchEvent(
        new CustomEvent('gatoencerrado:miniverse-spent', {
          detail: { id: 'taza', spent: false, amount: 0, count: 0 },
        })
      );
    }
  }, []);

  const handlePdfLoadSuccess = useCallback(({ numPages }) => {
    setPdfNumPages(numPages);
  }, []);

  const handleOpenOraculo = useCallback(() => {
    if (!ORACULO_URL) {
      toast({
        description: 'Falta configurar la URL del Oráculo (VITE_ORACULO_URL).',
      });
      return;
    }
    setIsOraculoOpen(true);
  }, []);

  const handleCloseOraculo = useCallback(() => {
    setIsOraculoOpen(false);
  }, []);

  const handleOpenCauseSite = useCallback(() => {
    if (!CAUSE_SITE_URL) {
      toast({
        description: 'Falta configurar la URL de la causa social.',
      });
      return;
    }
    setIsCauseSiteOpen(true);
  }, []);

  const handleCloseCauseSite = useCallback(() => {
    setIsCauseSiteOpen(false);
  }, []);

  const activeDefinition = activeShowcase ? showcaseDefinitions[activeShowcase] : null;
  const activeData = activeShowcase ? showcaseContent[activeShowcase] : null;
  const isCinematicShowcaseOpen = Boolean(activeDefinition);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isTazaARActive && isMobile && !isMobileARFullscreen) {
      setIsMobileARFullscreen(true);
    }
    if (isTazaARActive && isMobile) {
      document.body.classList.add('overflow-hidden');
    } else if (!isCinematicShowcaseOpen) {
      document.body.classList.remove('overflow-hidden');
    }
    return undefined;
  }, [isTazaARActive, isMobileARFullscreen, isCinematicShowcaseOpen]);
  const scrollLockYRef = useRef(0);
  const wasCinematicOpenRef = useRef(false);
  const tragicoStarters = useMemo(() => {
    if (!activeDefinition || activeDefinition.type !== 'tragedia') {
      return [];
    }
    const base = activeDefinition.conversationStarters ?? [];
    return shuffleArray([...base, ...SILVESTRE_TRIGGER_QUESTIONS]);
  }, [activeDefinition]);
  const activeParagraphs = useMemo(() => {
    if (!activeData?.post?.content) {
      return [];
    }
    return activeData.post.content.split(/\n{2,}/).map((chunk) => chunk.trim()).filter(Boolean);
  }, [activeData]);

  useEffect(() => {
    setOpenCollaboratorId(null);
  }, [activeDefinition]);

  const renderCollaboratorsSection = useCallback(
    (collaborators, prefix = 'collab') => {
      if (!Array.isArray(collaborators) || !collaborators.length) return null;
      const normalized = collaborators.map((collab, idx) => ({
        ...collab,
        _avatarId: collab.id ?? `${prefix}-${idx}`,
        _image: collab.image || '/images/placeholder-colaboradores.jpg',
      }));
      const selected = normalized.find((collab) => collab._avatarId === openCollaboratorId);
      const avatarsToShow = normalized.filter((collab) => collab._avatarId !== selected?._avatarId);
      return (
        <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-4 md:space-y-3">
          <div className="flex flex-col md:grid md:grid-cols-[1fr_auto] md:items-center gap-3">
            <motion.div layout className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
              {avatarsToShow.map((collab) => {
                const isActive = selected?._avatarId === collab._avatarId;
                return (
                  <motion.button
                    key={collab._avatarId}
                    type="button"
                    layout
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    onClick={() => setOpenCollaboratorId(collab._avatarId)}
                    className={`h-16 w-16 md:h-12 md:w-12 rounded-full border ${
                      isActive ? 'border-purple-300/80 ring-2 ring-purple-400/50' : 'border-white/15'
                    } bg-white/5 overflow-hidden transition hover:border-purple-300/60 shadow-lg shadow-black/30`}
                    title={collab.name}
                  >
                    <img
                      src={collab._image}
                      alt={`Retrato de ${collab.name}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </motion.button>
                );
              })}
            </motion.div>
            <p className="text-xs uppercase tracking-[0.35em] text-purple-300 text-center md:text-right">
              Colaboradores
            </p>
          </div>
          {selected ? (
            <div className="border border-white/10 rounded-2xl bg-black/20 p-4 flex flex-col md:flex-row gap-4 items-center md:items-start text-center md:text-left">
              <img
                src={selected._image}
                alt={`Retrato de ${selected.name}`}
                className="h-24 w-24 md:h-18 md:w-18 rounded-full object-cover border border-white/10 flex-shrink-0 shadow-lg shadow-black/30"
                loading="lazy"
              />
              <div className="space-y-2 flex-1 min-w-0 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-3">
                  <div className="space-y-1">
                    <p className="text-slate-100 font-semibold">{selected.name}</p>
                    {selected.role ? (
                      <p className="text-[11px] uppercase tracking-[0.3em] text-purple-300">
                        {selected.role}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenCollaboratorId(null)}
                    className="text-xs uppercase tracking-[0.3em] text-slate-400 hover:text-white transition self-center md:self-start"
                    aria-label="Cerrar ficha de colaborador"
                  >
                    Cerrar ✕
                  </button>
                </div>
                {selected.bio ? (
                  <p className="text-sm text-slate-200/90 leading-relaxed">{selected.bio}</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      );
    },
    [openCollaboratorId]
  );

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    if (isCinematicShowcaseOpen) {
      wasCinematicOpenRef.current = true;
      scrollLockYRef.current = window.scrollY;
      body.style.position = 'fixed';
      body.style.top = `-${scrollLockYRef.current}px`;
      body.style.left = '0';
      body.style.right = '0';
      body.style.width = '100%';
      body.style.overflow = 'hidden';
      html.style.overflow = 'hidden';
      return;
    }

    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.width = '';
    body.style.overflow = '';
    document.documentElement.style.overflow = '';

    if (wasCinematicOpenRef.current) {
      window.scrollTo(0, scrollLockYRef.current || 0);
    }
    wasCinematicOpenRef.current = false;
    scrollLockYRef.current = 0;
  }, [isCinematicShowcaseOpen]);

  useEffect(() => {
    if (!isCinematicShowcaseOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActiveShowcase(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCinematicShowcaseOpen]);

  useEffect(() => {
    if (activeShowcase !== 'apps') {
      return;
    }
    setTapIndex(0);
  }, [activeShowcase]);

  useEffect(() => {
    if (activeShowcase !== 'copycats') {
      setOpenCollaboratorId(null);
    }
  }, [activeShowcase]);

  useEffect(() => {
    if (activeShowcase !== 'oraculo') {
      setIsOraculoOpen(false);
    }
  }, [activeShowcase]);

  useEffect(() => {
    if (activeShowcase !== 'lataza') {
      setIsTazaARActive(false);
      setIsMobileARFullscreen(false);
      if (!isCinematicShowcaseOpen) {
        document.body.classList.remove('overflow-hidden');
      }
    }
  }, [activeShowcase, isCinematicShowcaseOpen]);

  useEffect(() => {
    if (!isOraculoOpen) {
      return undefined;
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === 'function') {
          event.stopImmediatePropagation();
        }
        setIsOraculoOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOraculoOpen]);

  useEffect(() => {
    if (!isCauseSiteOpen) {
      return undefined;
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === 'function') {
          event.stopImmediatePropagation();
        }
        setIsCauseSiteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isCauseSiteOpen]);

  useEffect(() => {
    if (!imagePreview && !pdfPreview) {
      return undefined;
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (imagePreview) {
          handleCloseImagePreview();
        }
        if (pdfPreview) {
          handleClosePdfPreview();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imagePreview, pdfPreview, handleCloseImagePreview, handleClosePdfPreview]);

  useEffect(() => {
    if (!isMiniversoEditorialModalOpen) {
      return undefined;
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleCloseMiniversoEditorialModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMiniversoEditorialModalOpen, handleCloseMiniversoEditorialModal]);

  useEffect(() => {
    if (!pdfPreview) {
      return undefined;
    }
    const updateWidth = () => {
      if (pdfContainerRef.current) {
        setPdfContainerWidth(pdfContainerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [pdfPreview]);

  useEffect(() => {
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort?.();
      recognitionRef.current = null;
    };
  }, []);

  const handleLaunchWebAR = (message) => {
    toast({
      description: message || 'Muy pronto liberaremos la activación WebAR de este objeto.',
    });
  };

  const handleOpenCameraForQR = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      toast({ description: 'Tu dispositivo no permite abrir la cámara desde el navegador.' });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });
      stream.getTracks().forEach((track) => track.stop());
      toast({
        description: 'Listo. En la versión final validaremos el QR con geolocalización para redimir tu ejemplar.',
      });
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      toast({ description: 'No pudimos acceder a la cámara. Revisa los permisos e inténtalo de nuevo.' });
    }
  }, []);

  const handleNovelAppCTA = useCallback(
    (app) => {
      if (!app) return;

      if (app.ctaUrl) {
        window.open(app.ctaUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      if (app.ctaAction === 'openCamera') {
        handleOpenCameraForQR();
        return;
      }

      if (app.ctaAction === 'openAutoficcionPreview') {
        setShowAutoficcionPreview(true);
        return;
      }

      toast({
        description: app.ctaMessage || 'Muy pronto liberaremos esta app interactiva.',
      });
    },
    [handleOpenCameraForQR]
  );

  const handleMovementAction = useCallback(
    (action, contextLabel = null) => {
      if (!action) {
        return;
      }
      handleOpenMiniverses(contextLabel);
    },
    [handleOpenMiniverses]
  );

  const handleOpenExperienceSite = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.open('https://gatoencerrado.ai', '_blank', 'noopener,noreferrer');
  }, []);

  const handleOpenContribution = useCallback((categoryId = null) => {
    setContributionCategoryId(categoryId);
    setIsContributionOpen(true);
  }, []);

  const handleBadgeLogin = useCallback(() => {
    setShowBadgeLoginOverlay(true);
  }, []);

  const handleCloseBadgeLogin = useCallback(() => {
    setShowBadgeLoginOverlay(false);
  }, []);

  const handleBadgeSubscribe = useCallback(() => {
    const ctaSection = document.getElementById('cta');
    if (ctaSection) {
      ctaSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setIsContributionOpen(true);
  }, []);

  const handleExplorerReward = useCallback(
    (rewardType = 'subscriber') => {
      if (!allShowcasesUnlocked || explorerBadge.rewardClaimed) {
        return;
      }
      const rewardAmount = rewardType === 'subscriber' ? EXPLORER_BADGE_REWARD : 0;
      if (rewardAmount <= 0) {
        return;
      }
      setShowBadgeCoins(true);
      setAvailableGATokens((prev) => {
        const next = prev + rewardAmount;
        if (typeof window !== 'undefined') {
          window.localStorage?.setItem('gatoencerrado:gatokens-available', String(next));
        }
        return next;
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('gatoencerrado:miniverse-spent', {
            detail: { id: 'explorer-badge', boost: true, amount: rewardAmount },
          })
        );
      }
      setExplorerBadge((prev) => ({
        ...prev,
        rewardClaimed: true,
        claimedType: rewardType,
        claimedAt: Date.now(),
      }));
      if (badgeCoinsTimeoutRef.current) {
        clearTimeout(badgeCoinsTimeoutRef.current);
      }
      badgeCoinsTimeoutRef.current = setTimeout(() => setShowBadgeCoins(false), 1300);
    },
    [allShowcasesUnlocked, explorerBadge.rewardClaimed]
  );

  const handleShowcaseRevealBoost = useCallback(
    (showcaseId) => {
      if (!showcaseId || showcaseBoosts?.[showcaseId]) {
        return;
      }
      const boostAmount = baseEnergyByShowcase[showcaseId] ?? 0;
      if (!boostAmount) {
        return;
      }
      setShowcaseBoosts((prev = {}) => {
        const next = { ...prev, [showcaseId]: true };
        if (typeof window !== 'undefined') {
          window.localStorage?.setItem('gatoencerrado:showcase-boosts', JSON.stringify(next));
        }
        return next;
      });
      setShowcaseEnergy((prev = {}) => {
        const currentValue = prev?.[showcaseId] ?? baseEnergyByShowcase[showcaseId];
        const updatedValue = currentValue + boostAmount;
        const next = { ...prev, [showcaseId]: updatedValue };
        if (typeof window !== 'undefined') {
          window.localStorage?.setItem('gatoencerrado:showcase-energy', JSON.stringify(next));
        }
        return next;
      });
      setAvailableGATokens((prev) => {
        const next = prev + boostAmount;
        if (typeof window !== 'undefined') {
          window.localStorage?.setItem('gatoencerrado:gatokens-available', String(next));
        }
        return next;
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('gatoencerrado:miniverse-spent', {
            detail: { id: showcaseId, boost: true, amount: boostAmount },
          })
        );
      }
      setCelebratedShowcaseId(showcaseId);
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current);
      }
      celebrationTimeoutRef.current = setTimeout(() => {
        setCelebratedShowcaseId((current) => (current === showcaseId ? null : current));
      }, 1400);
    },
    [baseEnergyByShowcase, showcaseBoosts]
  );

  const getTopicForShowcase = useCallback(
    (showcaseId) => TOPIC_BY_SHOWCASE[showcaseId] ?? showcaseId,
    []
  );

  const getContributionCategoryForShowcase = useCallback(
    (showcaseId) => CONTRIBUTION_CATEGORY_BY_SHOWCASE[showcaseId] ?? showcaseId,
    []
  );

  const fetchPublicComments = useCallback(
    async (showcaseId) => {
      if (!showcaseId) return;
      const topic = getTopicForShowcase(showcaseId);
      setPublicContributionsLoading((prev) => ({ ...prev, [showcaseId]: true }));
      setPublicContributionsError((prev) => ({ ...prev, [showcaseId]: null }));
      const { data, error } = await fetchApprovedContributions(topic);
      if (error) {
        console.error('Error fetching contributions', { showcaseId, error });
        setPublicContributionsError((prev) => ({
          ...prev,
          [showcaseId]: 'No pudimos cargar comentarios.',
        }));
      } else {
        setPublicContributions((prev) => ({ ...prev, [showcaseId]: data || [] }));
      }
      setPublicContributionsLoading((prev) => ({ ...prev, [showcaseId]: false }));
    },
    [getTopicForShowcase]
  );

  const renderCommunityBlock = useCallback(
    (
      showcaseId,
      {
        heading = 'Comentarios de la comunidad',
        ctaLabel = 'Agrega tu comentario',
        emptyMessage = 'Aún no hay comentarios aprobados.',
        reactionProps = null,
        className = 'rounded-3xl border border-white/10 bg-black/30 p-6 space-y-5',
        hideReaction = false,
      } = {}
    ) => {
      if (!showcaseId) return null;
      const comments = publicContributions[showcaseId] ?? [];
      const isLoading = publicContributionsLoading[showcaseId];
      const error = publicContributionsError[showcaseId];
      const categoryId = getContributionCategoryForShowcase(showcaseId);

      return (
        <div className={className}>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">{heading}</p>
          {isLoading ? (
            <p className="text-sm text-slate-400">Cargando comentarios…</p>
          ) : error ? (
            <p className="text-sm text-red-300">{error}</p>
          ) : comments.length ? (
            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {(() => {
                  const visibleCount = comments.length >= 3 ? 2 : 1;
                  const start = commentCarouselIndex % comments.length;
                  const visible = [];
                  for (let i = 0; i < visibleCount; i += 1) {
                    visible.push(comments[(start + i) % comments.length]);
                  }
                  return (
                    <motion.div
                      key={`${showcaseId}-${commentCarouselIndex}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className="space-y-4"
                    >
                      {visible.map((comment) => (
                        <div
                          key={`${showcaseId}-${comment.id}`}
                          className="rounded-2xl border border-white/5 bg-black/20 p-4"
                        >
                          <p className="text-slate-100 font-light leading-relaxed mb-2">{comment.proposal}</p>
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                            {comment.name || 'Anónimo'}
                          </p>
                        </div>
                      ))}
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </div>
          ) : (
            <p className="text-sm text-slate-400">{emptyMessage}</p>
          )}
          <div className="pt-4 mt-1 border-t border-white/10">
            <div className="mx-auto w-full max-w-md">
              <Button
                variant="outline"
                className="w-full rounded-full border border-purple-500/70 text-purple-100 shadow-[0_15px_45px_rgba(67,56,202,0.45)] hover:bg-purple-500/20 tracking-[0.25em] text-xs uppercase"
                onClick={() => handleOpenContribution(categoryId)}
              >
                {ctaLabel}
              </Button>
            </div>
          </div>
          {!hideReaction && reactionProps && activeShowcase === showcaseId ? (
            <ShowcaseReactionInline {...reactionProps} />
          ) : null}
        </div>
      );
    },
    [
      activeShowcase,
      getContributionCategoryForShowcase,
      getTopicForShowcase,
      handleOpenContribution,
      publicContributions,
      publicContributionsError,
      publicContributionsLoading,
    ]
  );

  useEffect(() => {
    if (!activeShowcase) return;
    if (publicContributions[activeShowcase]) return;
    fetchPublicComments(activeShowcase);
  }, [activeShowcase, fetchPublicComments, publicContributions]);

  useEffect(() => {
    setCommentCarouselIndex(0);
  }, [activeShowcase]);

  useEffect(() => {
    if (!activeShowcase) return;
    const comments = publicContributions[activeShowcase];
    if (!comments || comments.length === 0) return;
    const interval = setInterval(() => {
      setCommentCarouselIndex((prev) => prev + 1);
    }, 2600);
    return () => clearInterval(interval);
  }, [activeShowcase, publicContributions]);

  useEffect(() => {
    if (!allShowcasesUnlocked || !isSubscriber || explorerBadge.rewardClaimed) {
      return;
    }
    handleExplorerReward('subscriber');
  }, [allShowcasesUnlocked, explorerBadge.rewardClaimed, handleExplorerReward, isSubscriber]);

const rendernotaAutoral = () => {
  if (!activeDefinition?.notaAutoral) return null;

  const activeId = activeDefinition.id ?? activeShowcase;
  const tileColors = MINIVERSO_TILE_COLORS[activeId] ?? MINIVERSO_TILE_COLORS.default;
  const tileGradient = MINIVERSO_TILE_GRADIENTS[activeId] ?? MINIVERSO_TILE_GRADIENTS.default;
  const isTragedia = activeDefinition.type === 'tragedia';
  const effect = MINIVERSO_VERSE_EFFECTS[activeId] ?? MINIVERSO_VERSE_EFFECTS.default;

  return (
    <div className="relative flex flex-col gap-3">
      <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Mini-verso Autoral</p>
      <MiniVersoCard
        title={activeDefinition.cartaTitle || 'Nota autoral'}
        verse={activeDefinition.notaAutoral}
        palette={{
          gradient: tileGradient,
          border: tileColors.border,
          text: tileColors.text,
          accent: tileColors.accent,
          background: tileColors.background,
        }}
        effect={effect}
        isTragedia={isTragedia}
        onFirstReveal={() => handleShowcaseRevealBoost(activeId)}
        celebration={celebratedShowcaseId === activeId}
      />
    </div>
  );
};


  const renderPostDetails = (emptyMessage = 'Pronto liberaremos la carta completa de este miniverso.') => {
    if (!activeDefinition?.slug) {
      return null;
    }

    if (activeData?.status === 'loading') {
      return <p className="text-slate-400 text-sm">Cargando la carta que acompaña a este miniverso…</p>;
    }

    if (activeData?.status === 'error') {
      return <p className="text-red-300 text-sm">{activeData.error}</p>;
    }

    if (activeData?.status === 'success' && activeData.post) {
      return (
        <>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-4">
            {activeData.post.author ? (
              <span className="inline-flex items-center gap-2">
                <Feather size={16} />
                {activeData.post.author}
                {activeData.post.author_role ? (
                  <span className="text-slate-500">/ {activeData.post.author_role}</span>
                ) : null}
              </span>
            ) : null}
            {activeData.post.published_at ? (
              <span>
                {new Date(activeData.post.published_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            ) : null}
          </div>
          <h4 className="font-display text-2xl text-slate-100 mb-6">{activeData.post.title}</h4>
          <div className="space-y-5 text-slate-200 leading-relaxed font-light">
            {activeParagraphs.length === 0 ? (
              <p>Muy pronto abriremos el expediente completo de este miniverso. Gracias por tu curiosidad.</p>
            ) : (
              activeParagraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)
            )}
          </div>
        </>
      );
    }

    return <p className="text-slate-400 text-sm">{emptyMessage}</p>;
  };

  const renderShowcaseContent = () => {
    if (!activeDefinition) {
      return (
        <p className="text-slate-400 text-sm">
          Selecciona un miniverso para explorar su carta y materiales.
        </p>
      );
    }

  if (activeDefinition.type === 'object-webar') {
    const objectWebArVideoId = `${activeShowcase ?? 'object-webar'}-video`;
    const isTazaUnlimited = true;
    const remainingTazaGatokens = isTazaUnlimited ? Number.POSITIVE_INFINITY : Math.max(90 - tazaActivations * 30, 0);

      return (
        <div className="space-y-8">
          {isQuironFullVisible && activeDefinition.quiron?.fullVideo ? (
            <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-sm p-4 sm:p-6 overflow-auto">
              <div className="max-w-5xl mx-auto space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-amber-200">
                    Cortometraje completo desbloqueado
                  </p>
                  <Button
                    variant="outline"
                    className="border-white/30 text-slate-100 hover:bg-white/10"
                    onClick={handleCloseQuironFull}
                  >
                    Cerrar
                  </Button>
                </div>
                <div className="rounded-2xl border border-white/15 bg-black/40 overflow-hidden shadow-2xl">
                  {renderMedia({
                    id: activeDefinition.quiron.fullVideo.id || 'quiron-full',
                    label: activeDefinition.quiron.fullVideo.label || 'Cortometraje completo',
                    url: activeDefinition.quiron.fullVideo.url,
                  })}
                </div>
              </div>
            </div>
          ) : null}
          {renderCollaboratorsSection(activeDefinition.collaborators, 'object-webar')}

          <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 overflow-hidden bg-black/30">
  <div className="flex items-center justify-between gap-3 px-6 pt-4">
    <p className="text-xs uppercase tracking-[0.3em] text-slate-400/70">
      Activa tu objeto
    </p>
  </div>

  {activeShowcase === 'lataza' && isTazaARActive && !isMobileARFullscreen ? (
        <div className="p-0 sm:p-4">
        <ARExperience
          targetSrc="/assets/taza.mind"
          phrases={activeDefinition.phrases}
          showScanGuide
        guideImageSrc="/assets/taza_transp.png"
        guideLabel="Alinea la ilustración de la taza con el contorno. No necesita ser exacto."
          onExit={handleCloseARExperience}
          initialCameraReady={tazaCameraReady}
          onError={handleARError}
        />
    </div>
  ) : (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      {/* ───────── Columna izquierda: taza ───────── */}
      <div className="flex flex-col gap-4">
        <div className="relative w-full aspect-[4/3] max-h-[260px] overflow-hidden rounded-2xl bg-black/50">
          {/\.mp4($|\?)/i.test(activeDefinition.image) ? (
            <video
              src={activeDefinition.image}
              className="absolute inset-0 h-full w-full object-contain"
              autoPlay
              playsInline
              muted
              loop
              controls={canUseInlinePlayback(objectWebArVideoId)}
              poster={activeDefinition.imagePoster}
            />
          ) : (
            <img
              src={activeDefinition.image}
              alt="Ilustración de La Taza"
              className="absolute inset-0 h-full w-full object-contain"
              loading="lazy"
              decoding="async"
            />
          )}
        </div>

        <p className="text-sm text-slate-400 uppercase tracking-[0.3em]">
          {activeDefinition.note}
        </p>

        {activeDefinition.instructions ? (
          <ul className="text-sm text-slate-300/90 space-y-2">
            {activeDefinition.instructions.map((step, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-purple-300 mt-1">●</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {activeShowcase === 'lataza' ? (
          <div className="relative inline-flex overflow-visible">
            <Button
              className="relative border-purple-400/40 text-purple-200 hover:bg-purple-500/10 overflow-visible"
              variant="outline"
              onClick={handleActivateAR}
              disabled={isTazaActivating}
            >
              {isTazaActivating ? 'Procesando...' : activeDefinition.ctaLabel}
            </Button>
          </div>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-amber-100">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/60 bg-amber-500/15 px-3 py-1">
            <Coins size={14} />
            {Number.isFinite(remainingTazaGatokens) ? remainingTazaGatokens : '∞'} gatokens
          </span>
          <span className="text-slate-400">Energía ilimitada</span>
        </div>
      </div>

      {/* ───────── Columna derecha: Próximos encuentros ───────── */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col gap-3">
        <h4 className="text-xs uppercase tracking-[0.35em] text-slate-300">
          Próximos encuentros
        </h4>

        <p className="text-sm text-slate-400 leading-relaxed">
          Aquí aparecerán los espacios donde la taza se activa en comunidad:
          cafés, librerías y colaboraciones futuras.
        </p>

        <button
          type="button"
          onClick={() => handleOpenContribution(getContributionCategoryForShowcase('lataza'))}
          className="mt-2 text-xs uppercase tracking-[0.3em] text-purple-300 hover:text-purple-200 self-start"
        >
          Quiero saber dónde juntarnos
        </button>
      </div>
    </div>
  )}
</div>

            {activeDefinition.sentiments ? (
              <div className="rounded-2xl border border-white/10 p-6 bg-black/30">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400/70 mb-4">Sentimientos vinculados</p>
                <ul className="space-y-3 text-slate-300/80 text-sm leading-relaxed">
                  {activeDefinition.sentiments.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            {renderCommunityBlock('lataza', {
              ctaLabel: 'Agrega tu comentario',
              reactionProps: {
                showcaseId: 'lataza',
                description: 'Haz clic para guardar un like que conecta a la comunidad alrededor de la taza.',
                buttonLabel: 'Resonar con la taza',
              },
            })}
          </div>
        </div>
        </div>
      );
    }

    if (activeDefinition.type === 'audio-dream') {
    return (
      <div className="space-y-8">
        {renderCollaboratorsSection(activeDefinition.collaborators, 'sonoro')}

        <div className="space-y-8">
          <div className="rounded-3xl border border-white/10 bg-black/30 p-0 lg:p-6">
            <MiniversoSonoroPreview
              videoUrl={activeDefinition.videoUrl}
              videoTitle={activeDefinition.label}
              videoArtist="Residencia #GatoEncerrado"
              audioOptions={activeDefinition.musicOptions}
              poemOptions={activeDefinition.poems}
              showHeader
              showCTA
              onEnterExperience={handleSonoroEnter}
              isSpent={sonoroSpent}
              coinBlast={showSonoroCoins}
              costLabel="130 gatokens"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-4">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Cómo explorar</p>
                <ol className="list-decimal list-inside space-y-3 text-slate-200 text-sm leading-relaxed md:text-base">
                  {activeDefinition.exploration?.map((step, index) => (
                    <li key={`sonoro-step-${index}`}>{step}</li>
                  ))}
                </ol>
              </div>
              {activeDefinition.closing?.length ? (
                <div className="rounded-3xl border border-white/10 bg-black/20 p-6 space-y-3 text-sm text-slate-300">
                  {activeDefinition.closing.map((line, index) => (
                    <p key={`sonoro-closing-${index}`}>{line}</p>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-6">
              {renderCommunityBlock('miniversoSonoro', {
                ctaLabel: 'suma tu voz',
                reactionProps: {
                  showcaseId: 'miniversoSonoro',
                  title: 'La voz de quienes escuchan',
                  description: 'Comparte tu vibración y deja un like que resuene en este miniverso.',
                  buttonLabel: 'Hacer latir la resonancia',
                  className: 'mt-0',
                },
              })}
            </div>
          </div>
        </div>
      </div>
    );
    }

    if (activeDefinition.type === 'oracle') {
      return (
        <div className="grid gap-6 lg:gap-10 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-4">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Minado simbólico</p>
              {activeDefinition.loops ? (
                <ul className="space-y-2 text-sm text-slate-200/90 leading-relaxed">
                  {activeDefinition.loops.map((step, index) => (
                    <li key={`oraculo-loop-${index}`} className="flex items-start gap-2">
                      <span className="text-purple-300 mt-1">●</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {activeDefinition.tagline ? (
                <p className="text-sm text-purple-200/90">{activeDefinition.tagline}</p>
              ) : null}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="border-purple-400/40 text-purple-200 hover:bg-purple-500/10"
                  onClick={handleOpenOraculo}
                >
                  {activeDefinition.ctaLabel}
                </Button>
                <p className="text-xs text-slate-400 leading-relaxed">{activeDefinition.ctaDescription}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-4">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Sistema de recompensas</p>
              <div className="grid gap-3 md:grid-cols-2">
                {activeDefinition.rewards?.map((reward, index) => (
                  <div
                    key={`oraculo-reward-${index}`}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-100">{reward.title}</p>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-200">
                        <Coins size={14} className="text-amber-200" />
                        {reward.tokens}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300/90 leading-relaxed">{reward.description}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500">{activeDefinition.limitsNote}</p>
            </div>
          </div>

          <div className="space-y-4 lg:space-y-6">
            <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-3">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Semillas de conocimiento</p>
              <ul className="space-y-2 text-sm text-slate-300/85 leading-relaxed">
                {activeDefinition.seedNotes?.map((seed, index) => (
                  <li key={`oraculo-seed-${index}`} className="flex items-start gap-2">
                    <Sparkles size={14} className="mt-1 text-amber-200" />
                    <span>{seed}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-3">
              <div className="flex items-center gap-3">
                <Brain size={18} className="text-purple-200" />
                <p className="text-sm text-slate-200 font-semibold">Interacción que deja huella</p>
              </div>
              <p className="text-sm text-slate-300/85 leading-relaxed">
                Tus reflexiones afinan la mente del Gato: entrenamiento simbólico, no binario y emocional. Cada
                participación se audita para evitar ruido.
              </p>
              <p className="text-xs text-slate-500">El Oráculo es un espacio curado; el minado es resonancia, no dinero.</p>
            </div>
          </div>
        </div>
      );
    }

    if (activeDefinition.type === 'tragedia') {
      const onClose = () => setActiveShowcase(null);
      const visibleStarters = tragicoStarters.filter((starter) => !spentSilvestreSet.has(starter));
      const marqueeStarters = [...visibleStarters, ...visibleStarters];
      const conversationBlock = visibleStarters.length ? (
        <div className="space-y-3 border-t border-white/10 pt-4">
          <p className="text-xs uppercase tracking-[0.35em] text-pink-200">¿Ya sabes qué decir?</p>
          <p className="text-sm text-slate-200/80 leading-relaxed">
            Elige una pregunta y envíala tal cual.
          </p>
          <div className="starter-marquee">
            <ul className="starter-marquee__list text-sm text-purple-50/90">
              {marqueeStarters.map((starter, idx) => (
                <li
                  key={`tragico-paragraph-${starter}-${idx}`}
                  className="rounded-2xl border border-white/10 bg-black/15"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (spentSilvestreSet.has(starter)) return;
                      markSilvestreQuestionSpent(starter);
                      handleSendSilvestrePreset(starter);
                    }}
                    className="flex w-full items-start gap-2 px-4 py-2 text-left transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={spentSilvestreSet.has(starter)}
                  >
                    <span className="text-purple-200 font-semibold">•</span>
                    <span className="leading-relaxed">{starter}</span>
                    {spentSilvestreSet.has(starter) ? (
                      <span className="ml-auto text-[10px] uppercase tracking-[0.3em] text-slate-400">
                        Gastada
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null;

      const reactionDetails = {
        showcaseId: 'miniversos',
        title: 'Resonancia colectiva',
        description: 'Haz clic para dejar un pulso que mantenga viva la conversación de Silvestre.',
        buttonLabel: 'Enviar pulsaciones',
        className: 'mt-4',
      };

      return (
        <div className="space-y-2">
          <div className="flex justify-end">
            <button
              onClick={() => setActiveShowcase(null)}
              className="text-sm text-slate-400 hover:text-white transition"
              aria-label="Cerrar escaparate"
            >
              Cerrar ✕
            </button>
          </div>
          <div className="rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-slate-900/85 via-black/60 to-rose-900/35 shadow-[0_25px_65px_rgba(15,23,42,0.65)]">
            <div className="grid gap-10 p-6 sm:p-8 lg:p-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <div className="space-y-6">
     
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.4em] text-purple-300">Escaparate</p>
                    <h3 className="font-display text-3xl leading-tight text-white md:text-4xl">{activeDefinition.label}</h3>
                  </div>
                
                </div>
                <div className="space-y-4 text-lg text-slate-200/85 leading-relaxed font-light">
                  <p>{activeDefinition.intro}</p>
                  {activeDefinition.narrative?.map((paragraph, index) => (
                    <p key={`tragico-paragraph-${index}`} className="text-sm text-slate-300/90 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
               
                {activeDefinition.iaProfile ? (
                  <IAInsightCard {...activeDefinition.iaProfile} compact />
                ) : null}
              </div>
              <div className="flex flex-col gap-6">
                {rendernotaAutoral()}
              </div>
              
            </div>
          </div>

          {renderCollaboratorsSection(activeDefinition.collaborators, 'tragedia')}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="rounded-3xl border border-white/10 bg-black/35 p-6 shadow-[0_20px_45px_rgba(0,0,0,0.45)] space-y-4">
              <div className="space-y-2">
            
              </div>
              <div className="flex flex-col items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="silvestre-cta relative flex h-20 w-20 items-center justify-center rounded-full border border-purple-300/60 bg-purple-500/10 text-purple-50 shadow-[0_0_45px_rgba(197,108,255,0.75)] transition hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handleOpenSilvestreChat}
              aria-label={
                isSilvestrePlaying
                  ? 'Escuchando la respuesta'
                  : pendingSilvestreAudioUrl
                    ? 'Reproducir respuesta'
                  : isSilvestreFetching || isSilvestreResponding
                    ? 'La Obra está pensando'
                  : isListening
                    ? 'Detén la grabación'
                    : activeDefinition.ctaLabel
              }
              disabled={isSilvestreFetching || isSilvestreResponding}
            >
              {showSilvestreCoins ? (
                <div className="pointer-events-none absolute inset-0 z-10">
                  {Array.from({ length: 7 }).map((_, index) => {
                    const offsetX = (index - 3) * 12;
                    const offsetY = -20 - index * 6;
                    return (
                      <motion.span
                        key={`silvestre-coin-${index}`}
                        className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-amber-200 to-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.55)]"
                        initial={{ opacity: 0.95, scale: 0.7, x: 0, y: 0 }}
                        animate={{ opacity: 0, scale: 1.1, x: offsetX, y: offsetY, rotate: 90 + index * 30 }}
                        transition={{ duration: 1, ease: 'easeOut', delay: index * 0.03 }}
                      />
                    );
                  })}
                </div>
              ) : null}
              {isSilvestrePlaying ? (
                <span className="silvestre-mic-wave" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                    </span>
                  ) : null}
                  {!isSilvestrePlaying ? (
                    pendingSilvestreAudioUrl ? (
                      <Play className="h-8 w-8 relative z-10" />
                    ) : isListening ? (
                      <Square className="h-8 w-8 relative z-10" />
                    ) : (
                      <Mic className="h-8 w-8 relative z-10" />
                    )
                  ) : null}
              </Button>
              <span
                className={`text-xs uppercase tracking-[0.35em] text-purple-200 text-center ${
                  isSilvestreFetching || isSilvestreResponding ? 'thinking-blink' : ''
                }`}
              >
                {isSilvestrePlaying
                  ? 'Escuchando la respuesta'
                  : pendingSilvestreAudioUrl
                    ? 'Reproducir respuesta'
                  : isSilvestreFetching || isSilvestreResponding
                    ? 'La Obra está pensando'
                  : isListening
                    ? 'Detén la grabación'
                    : micPromptVisible
                      ? 'Habla con la obra'
                      : activeDefinition.ctaLabel}
              </span>
            </div>
            {micError && !isListening && !transcript ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
                <p className="text-xs uppercase tracking-[0.35em] text-red-300">Sin micrófono</p>
                <p>Tu navegador no permite activar el micrófono. Puedes escribirle a Silvestre si prefieres.</p>
              </div>
              ) : null}
              {transcript ? (
                <div className="rounded-2xl border border-purple-500/40 bg-white/5 p-4 text-sm text-slate-100">
                  
                  <p className="break-words">{transcript}</p>
                </div>
              ) : null}
              {pendingSilvestreAudioUrl ? (
                <div className="rounded-2xl border border-purple-400/40 bg-white/5 p-4 text-sm text-slate-100 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-purple-200">Audio listo</p>
                    <p>Toca reproducir para escuchar la respuesta.</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handlePlayPendingAudio}
                    className="shrink-0"
                  >
                    Reproducir
                  </Button>
                </div>
              ) : null}
              {conversationBlock}
            </div>
            <div className="space-y-6">
              {renderCommunityBlock('miniversos', {
                ctaLabel: 'suma tu voz',
                emptyMessage: 'Todavía no hay voces en este miniverso.',
                className: 'rounded-3xl border border-white/10 bg-black/30 p-6',
                hideReaction: true,
              })}
              <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
                <ShowcaseReactionInline {...reactionDetails} />
              </div>
            </div>
          </div>
        </div>
      );
    }
    if (activeDefinition.type === 'graphic-lab') {
      const swipeShowcases = activeDefinition.swipeShowcases ?? [];
      const swipeMeta = activeDefinition.swipe ?? {};

      return (
        <div className="space-y-8">
          {renderCollaboratorsSection(activeDefinition.collaborators, 'grafico')}

        <div className="grid gap-6 lg:gap-8 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-black/20 p-6 space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Colección viva</p>
            <div className="flex flex-wrap gap-2">
              {activeDefinition.collection?.map((item, index) => (
                <span
                  key={`collection-pill-${index}`}
                  className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-slate-100"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {(swipeMeta.title || swipeMeta.description || (swipeMeta.steps?.length ?? 0) > 0) ? (
            <div className="rounded-3xl border border-white/10 bg-black/25 p-6 space-y-3">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Cómo funciona</p>
              <h4 className="font-display text-2xl text-slate-100">{swipeMeta.title ?? 'Swipe narrativo activo'}</h4>
              {swipeMeta.description ? (
                <p className="text-sm text-slate-300/85 leading-relaxed">{swipeMeta.description}</p>
              ) : null}
              {swipeMeta.steps?.length ? (
                <ul className="space-y-2 text-sm text-slate-200/90 leading-relaxed">
                  {swipeMeta.steps.map((step, index) => (
                    <li key={`swipe-meta-step-${index}`} className="flex items-start gap-2">
                      <span className="text-fuchsia-200 mt-1">●</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

            {swipeShowcases.length ? (
              <div className="space-y-4">
                {swipeShowcases.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[32px] border border-white/10 bg-gradient-to-r from-slate-900/80 via-black/60 to-fuchsia-900/40 overflow-hidden shadow-[0_20px_60px_rgba(15,23,42,0.65)]"
                  >
                    <div className="grid gap-0 lg:grid-cols-[1fr_1.3fr]">
                      {entry.previewImage ? (
                        <div className="relative h-full min-h-[240px]">
                          <img
                            src={entry.previewImage}
                            alt={entry.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-transparent" />
                          <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white">
                            <Scan size={14} className="text-fuchsia-200" />
                            Swipe PDF
                          </div>
                          <div className="absolute left-4 bottom-4 text-sm text-white/90">
                            Lector visual · scroll vertical
                          </div>
                        </div>
                      ) : null}

                      <div className="flex flex-col space-y-4 p-6">
                        <p className="text-xs uppercase tracking-[0.35em] text-fuchsia-200/80">
                          Lector visual activo
                        </p>
                        <h4 className="font-display text-2xl text-slate-100">{entry.title}</h4>
                        {entry.description ? (
                          <p className="text-sm text-slate-200/90 leading-relaxed">{entry.description}</p>
                        ) : null}
                        {entry.swipeNotes?.length ? (
                          <ul className="space-y-2 text-sm text-slate-100 leading-relaxed">
                            {entry.swipeNotes.map((point, index) => (
                              <li key={`${entry.id}-note-${index}`} className="flex items-start gap-2">
                                <span className="text-fuchsia-200 mt-1">●</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        <div className="flex flex-wrap gap-3">
                          {entry.previewImage ? (
                            <Button
                              className="sm:flex-none justify-center bg-gradient-to-r from-fuchsia-600/80 to-purple-500/80 hover:from-fuchsia-500 hover:to-purple-400 text-white"
                              onClick={() =>
                                handleOpenImagePreview({
                                  src: entry.previewImage,
                                  title: entry.title,
                                  description: entry.description,
                                })
                              }
                            >
                              Ver portada
                            </Button>
                          ) : null}
                          {entry.previewPdfUrl ? (
                            <div className="relative inline-flex overflow-visible">
                              {showGraphicCoins ? (
                                <motion.div
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: -6 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="absolute -top-7 right-0 rounded-full border border-amber-200/60 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-100 shadow-[0_0_12px_rgba(250,204,21,0.25)]"
                                >
                                  -{GAT_COSTS.graficoSwipe} gat
                                </motion.div>
                              ) : null}
                              <Button
                                variant="outline"
                                disabled={isGraphicUnlocking}
                                onClick={() => handleOpenGraphicSwipe(entry)}
                                className="w-full sm:w-auto justify-center border-fuchsia-300/40 text-fuchsia-200 hover:bg-fuchsia-500/10 relative overflow-visible"
                              >
                                <span className="relative z-10">
                                  {graphicSpent ? 'Abrir swipe en PDF' : isGraphicUnlocking ? 'Aplicando...' : 'Aplicar y abrir'}
                                </span>
                                {showGraphicCoins ? (
                                  <span className="pointer-events-none absolute inset-0">
                                    {Array.from({ length: 6 }).map((_, index) => {
                                      const endX = 140 + index * 14;
                                      const endY = -140 - index * 12;
                                      return (
                                        <motion.span
                                          key={`graphic-coin-${index}`}
                                          className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-amber-200 to-yellow-500 shadow-[0_0_12px_rgba(250,204,21,0.5)]"
                                          initial={{ opacity: 0.9, scale: 0.7, x: 0, y: 0 }}
                                          animate={{
                                            opacity: 0,
                                            scale: 1.05,
                                            x: endX,
                                            y: endY,
                                            rotate: 120 + index * 18,
                                          }}
                                          transition={{ duration: 1.1, ease: 'easeOut', delay: 0.05 }}
                                        />
                                      );
                                    })}
                                  </span>
                                ) : null}
                              </Button>
                            </div>
                          ) : null}
                        </div>
                        <p className="text-[11px] uppercase tracking-[0.3em] text-gray-100/80">
                          Prototipo del Capítulo 1
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-4">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Acciones</p>
              <p className="text-sm text-slate-300/80 leading-relaxed">
                Activa el lector visual o súmate a la residencia gráfica.
              </p>
              <div className="rounded-2xl border border-amber-200/40 bg-amber-500/10 px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-amber-100 font-semibold">
                  <Coins size={16} />
                  <span>{graphicSpent ? '0 gatokens' : `~${GAT_COSTS.graficoSwipe} gatokens`}</span>
                </div>
                <span className="text-[11px] uppercase tracking-[0.3em] text-amber-100/80">
                  {graphicSpent ? 'Aplicado' : ''}
                </span>
              </div>
              <p className="text-[11px] text-amber-100/70">
                {graphicSpent
                  ? 'Ya aplicaste tus gatokens.'
                  : 'Al abrir el swipe en PDF se descontarán todas las gatokens disponibles.'}
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => handleOpenMiniverses('Miniverso Gráfico')}
                  className="w-full justify-center bg-gradient-to-r from-purple-600/80 to-fuchsia-500/80 hover:from-purple-500 hover:to-fuchsia-400 text-white"
                >
                  {activeDefinition.ctas?.primary}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOpenMiniverses('Miniverso Gráfico')}
                  className="w-full justify-center border-purple-400/40 text-purple-200 hover:bg-purple-500/10"
                >
                  {activeDefinition.ctas?.secondary}
                </Button>
              </div>
            </div>
            {renderCommunityBlock('miniversoGrafico', {
              ctaLabel: 'suma tu voz',
              reactionProps: {
                showcaseId: 'miniversoGrafico',
                title: 'Validación gráfica',
                description: 'Haz clic para dejar un like y seguir curando esta colección.',
                buttonLabel: 'Resonar con el trazo',
                className: 'mt-0 bg-gradient-to-r from-fuchsia-900/20 to-black/40',
              },
            })}
          </div>
        </div>
        </div>
      );
    }

    if (activeDefinition.type === 'movement-ritual') {
      const hasMovementCollaborators =
        Array.isArray(activeDefinition.collaborators) && activeDefinition.collaborators.length > 0;
      const hasDiosasGallery =
        Array.isArray(activeDefinition.diosasGallery) && activeDefinition.diosasGallery.length > 0;

      return (
        <div className="space-y-10">
          <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.35em] text-purple-300">Colaboradores</p>
              {hasMovementCollaborators ? (
                <button
                  type="button"
                  onClick={() => setIsMovementCreditsOpen((prev) => !prev)}
                  className="text-xs uppercase tracking-[0.3em] text-slate-300 hover:text-white transition"
                >
                  {isMovementCreditsOpen ? 'Ocultar' : 'Ver'}
                </button>
              ) : null}
            </div>
            {hasMovementCollaborators ? (
              isMovementCreditsOpen ? (
                <div className="space-y-3">
                  {activeDefinition.collaborators.map((collab, index) => {
                    const isOpen = openCollaboratorId === collab.id;
                    const imageSrc = collab.image || '/images/placeholder-colaboradores.jpg';
                    return (
                      <div key={collab.id || `movement-collab-${index}`} className="border border-white/10 rounded-2xl bg-black/20">
                        <button
                          type="button"
                          onClick={() => setOpenCollaboratorId((prev) => (prev === collab.id ? null : collab.id))}
                          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/5 transition"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={imageSrc}
                              alt={`Retrato de ${collab.name}`}
                              className="h-12 w-12 rounded-full object-cover border border-white/10"
                              loading="lazy"
                            />
                            <div>
                              <p className="text-slate-100 font-semibold">{collab.name}</p>
                              {collab.role ? (
                                <p className="text-[11px] uppercase tracking-[0.3em] text-purple-300">{collab.role}</p>
                              ) : null}
                            </div>
                          </div>
                          <span className="text-slate-400 text-lg">{isOpen ? '−' : '+'}</span>
                        </button>
                        {isOpen ? (
                          <div className="px-4 pb-4 text-sm text-slate-200/90 leading-relaxed space-y-3">
                            {collab.bio ? <p>{collab.bio}</p> : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-300/85 leading-relaxed">Aún no hay colaboradores confirmados para esta ruta.</p>
                <Button
                  type="button"
                  onClick={() => handleOpenContribution(getContributionCategoryForShowcase('miniversoMovimiento'))}
                  className="w-full sm:w-auto justify-center bg-gradient-to-r from-emerald-500/90 to-emerald-600/90 hover:from-emerald-400/90 hover:to-emerald-500/90 text-white"
                >
                  Proponer colaboración
                </Button>
              </div>
            )}
          </div>

          <div className="grid gap-6 lg:gap-10 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-5 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/80 via-black/60 to-purple-900/30 p-6 lg:p-8">
              <h3 className="font-display text-3xl text-slate-100">{activeDefinition.tagline}</h3>
              <p className="text-2 text-slate-100/80 italic">Cuando el cuerpo deja de ser solo uno.</p>
              {hasDiosasGallery ? (
                <DiosasCarousel
                  items={activeDefinition.diosasGallery}
                  label="Swipe-horizontal"
                  caption="Cada clip muestra un giro 360° de las diosas cuenta-cuentos."
                />
              ) : null}
              <div className="space-y-4 text-slate-300/85 leading-relaxed text-sm md:text-base">
                {activeDefinition.overview?.map((paragraph, index) => (
                  <p key={`movement-overview-${index}`}>{paragraph}</p>
                ))}
                {activeDefinition.diosaHighlights?.length ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">
                      Cada estación revela una diosa distinta
                    </p>
                    <ul className="mt-3 space-y-2">
                      {activeDefinition.diosaHighlights.map((item, index) => (
                        <li key={`movement-highlight-${index}`} className="flex items-start gap-2">
                          <span className="text-purple-300 mt-1">●</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {activeDefinition.dayNight?.map((sentence, index) => (
                  <p key={`movement-daynight-${index}`}>{sentence}</p>
                ))}
                {activeDefinition.invitation ? (
                  <p className="text-lg text-slate-100 italic">{activeDefinition.invitation}</p>
                ) : null}
              </div>
              <div className="mt-6">
                <ShowcaseReactionInline
                  showcaseId="miniversoMovimiento"
                  title="Resonancia colectiva"
                  description="Haz clic y deja un pulso para que la Ruta de las Diosas siga viva."
                  buttonLabel="Hacer vibrar la ruta"
                  className="mt-0"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-amber-200/40 bg-amber-500/10 px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-amber-100 font-semibold">
                  <Coins size={16} />
                  <span>~280 gatokens</span>
                </div>
                <span className="text-[11px] uppercase tracking-[0.3em] text-amber-100/80">Mapa + estación</span>
              </div>
              <p className="text-[11px] text-amber-100/70">
                Se aplican al liberar la ruta, los talleres o el marcador AR; las suscripciones cubren el saldo.
              </p>
              {activeDefinition.actions?.map((action) => {
                const ActionIcon = action.icon || ArrowRight;
                return (
                  <div
                    key={action.id}
                    className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3 hover:border-purple-400/40 transition"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full border border-white/10 bg-white/5 p-3">
                          <ActionIcon size={20} className="text-purple-200" />
                        </div>
                        <div>
                          {action.badge ? (
                            <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-500">{action.badge}</p>
                          ) : null}
                          <p className="font-semibold text-slate-100">{action.label}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-purple-400/40 text-purple-200 hover:bg-purple-500/10 w-full sm:w-auto justify-center"
                        onClick={() =>
                          handleMovementAction(action, activeDefinition.pendingName || activeDefinition.label)
                        }
                      >
                        {action.buttonLabel ?? 'Activar'}
                      </Button>
                    </div>
                    {action.description ? (
                      <p className="text-sm text-slate-300/80 leading-relaxed">{action.description}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {activeDefinition.microinteractions?.length ? (
            <div className="grid gap-6 md:grid-cols-2">
              {activeDefinition.microinteractions.map((micro, index) => (
                <div
                  key={`movement-micro-${index}`}
                  className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-3 text-sm leading-relaxed"
                >
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">{micro.title}</p>
                  {micro.description ? <p className="text-slate-300/85">{micro.description}</p> : null}
                  {micro.items?.length ? (
                    <ul className="space-y-2 text-slate-200/85">
                      {micro.items.map((item, bulletIndex) => (
                        <li key={`movement-micro-item-${index}-${bulletIndex}`} className="flex items-start gap-2">
                          <span className="text-purple-300 mt-1">●</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      );
    }

    if (activeDefinition.type === 'apps') {
      const steps = activeDefinition.tapDemo?.steps ?? [];
      const tapCount = steps.length || 1;
      const currentStep = steps[tapIndex % tapCount] ?? {};
      const handleTapAdvance = () => setTapIndex((prev) => (tapCount ? (prev + 1) % tapCount : 0));
      const isRead = Boolean(showcaseBoosts?.[activeShowcase]);
      const publicComments = publicContributions[activeShowcase] ?? [];
      const isLoadingComments = publicContributionsLoading[activeShowcase];
      const commentsError = publicContributionsError[activeShowcase];

      return (
        <div className="space-y-8">
          

          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Tap-to-advance demo</p>
                  <h4 className="font-display text-xl text-slate-100">{activeDefinition.tapDemo?.title}</h4>
                </div>
                <span className="rounded-full border border-emerald-200/40 bg-emerald-500/10 px-3 py-1 text-[0.7rem] uppercase tracking-[0.25em] text-emerald-100">
                  {tapIndex + 1}/{tapCount}
                </span>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-emerald-200/30 bg-gradient-to-br from-slate-900/60 via-black/40 to-purple-900/30 p-5 space-y-3 shadow-[0_15px_45px_rgba(0,0,0,0.45)]">
                <p className="text-[0.7rem] uppercase tracking-[0.35em] text-emerald-100/80">Paso {tapIndex + 1}</p>
                <h5 className="text-lg font-semibold text-slate-100">{currentStep.title}</h5>
                <p className="text-sm text-slate-200/85 leading-relaxed">{currentStep.description}</p>
                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={() => {
                      handleTapAdvance();
                      if (!showcaseBoosts?.apps && tapIndex + 1 >= tapCount - 1) {
                        handleShowcaseRevealBoost('apps');
                      }
                    }}
                    className="w-full justify-center bg-gradient-to-r from-emerald-500/80 to-emerald-600/80 hover:from-emerald-400/80 hover:to-emerald-500/80 text-white"
                  >
                    Tap siguiente
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  {steps.map((step, idx) => (
                    <span
                      key={step.id || `apps-step-${idx}`}
                      className={`h-2 w-2 rounded-full transition ${
                        idx === tapIndex ? 'bg-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-emerald-300/30'
                      }`}
                    />
                  ))}
                </div>
              </div>

             
            </div>

            <div className="space-y-5">
              <div className="rounded-3xl border border-white/10 bg-black/30 p-5 space-y-4">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Acciones</p>
                <div className="space-y-3">
                  {activeDefinition.actions?.map((action) => (
                    <div
                      key={action.id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3"
                    >
                      <div>
                        <p className="text-[0.7rem] uppercase tracking-[0.3em] text-slate-400/70">{action.label}</p>
                        <p className="text-sm text-slate-200/85 leading-relaxed">{action.description}</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-center border-emerald-300/40 text-emerald-100 hover:bg-emerald-500/10"
                        onClick={() => toast({ description: 'Muy pronto liberaremos esta acción.' })}
                      >
                        {action.buttonLabel || 'Abrir'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {renderCommunityBlock('apps', {
                reactionProps: {
                  showcaseId: 'apps',
                  title: 'Resonancia lúdica',
                  description: 'Deja un pulso para que el gato anfitrión abra más telones.',
                  buttonLabel: 'Hacer vibrar este miniverso',
                  className: 'mt-0',
                },
              })}

            </div>
          </div>
        </div>
      );
    }

    if (activeDefinition.type === 'cinema') {
      const copycatsAssets = (() => {
        const seen = new Set();
        return (activeDefinition.copycats?.assets ?? []).filter((asset) => {
          const key = asset?.id || asset?.url;
          if (!key) {
            return true;
          }
          if (seen.has(key)) {
            return false;
          }
          seen.add(key);
          return true;
        });
      })();

      const quironStills = (() => {
        const seen = new Set();
        return (activeDefinition.quiron?.stills ?? []).filter((still, index) => {
          const key = typeof still === 'string' ? still : still?.id || still?.url || `idx-${index}`;
          if (seen.has(key)) {
            return false;
          }
          seen.add(key);
          return true;
        });
      })();
      const toneTags = activeDefinition.tone ?? [];

      const renderMedia = (asset) => {
        if (!asset?.url) return null;
        const isVideoFile = /\.mp4($|\?)/i.test(asset.url);
        const videoId = asset?.id || asset?.url;
        return (
          <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/40">
            <div className="aspect-video w-full bg-black/60">
              {isVideoFile ? (
                <div className="relative h-full w-full">
                  {isMobileViewport ? (
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/55" />
                  ) : null}
                  {renderMobileVideoBadge()}
                  <video
                    src={asset.url}
                    title={asset.label}
                    className="w-full h-full object-cover"
                    controls={canUseInlinePlayback(videoId)}
                    onClick={(event) => requestMobileVideoPresentation(event, videoId)}
                    playsInline
                    preload="metadata"
                  />
                </div>
              ) : (
                <iframe
                  src={asset.url}
                  title={asset.label}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                ></iframe>
              )}
            </div>
            {asset.label ? (
              <div className="px-4 py-3 text-sm text-slate-300 flex items-center justify-between gap-3">
                <span>{asset.label}</span>
              </div>
            ) : null}
          </div>
        );
      };

      return (
        <div className="space-y-8">
          {renderCollaboratorsSection(activeDefinition.collaborators, 'cine')}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Meta-documental</p>
                    <h4 className="font-display text-xl text-slate-100">{activeDefinition.copycats?.title}</h4>
                  </div>
                
                </div>
                <p className="text-sm text-slate-300/80 leading-relaxed">
                  {activeDefinition.copycats?.description}
                </p>
                <p className="text-sm text-slate-200/90 leading-relaxed">{activeDefinition.copycats?.microcopy}</p>
                {activeDefinition.copycats?.tags?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {activeDefinition.copycats.tags.map((tag, index) => (
                      <span
                        key={`copycats-tag-${index}`}
                        className="px-3 py-1 rounded-full border border-purple-400/30 bg-purple-900/20 text-xs text-purple-100"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                {copycatsAssets.length ? (
                  <div className="space-y-4">
                    {copycatsAssets.map((asset) => (
                      <div key={asset.id}>{renderMedia(asset)}</div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900/80 via-black/60 to-purple-900/40 p-6 space-y-4">
                <span className="absolute top-4 right-4 inline-flex items-center gap-2 rounded-full border border-amber-300/50 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-100 shadow-[0_0_25px_rgba(251,191,36,0.25)]">
                  <Coins size={14} />
                  {quironSpent ? 'Liberado' : `${GAT_COSTS.quironFull} GATokens`}
                </span>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Screening privado</p>
                <h4 className="font-display text-2xl text-slate-100">{activeDefinition.screening?.title}</h4>
                <p className="text-sm text-slate-200/90 leading-relaxed">{activeDefinition.screening?.description}</p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    onClick={() =>
                      toast({
                        description:
                          'Guardaremos tu interés; pronto abriremos la lista de suscriptores para el screening doble en CECUT.',
                      })
                    }
                    className="w-full justify-center bg-gradient-to-r from-purple-600/80 to-indigo-500/80 hover:from-purple-500 hover:to-indigo-400 text-white sm:w-auto"
                  >
                    {activeDefinition.screening?.cta}
                  </Button>
                  {quironSpent ? (
                    <span className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-500/10 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-100 sm:w-auto">
                      <Coins size={14} />
                      Cortometraje desbloqueado
                    </span>
                  ) : (
                    <div className="relative flex-1 sm:flex-none">
                      <Button
                        variant="outline"
                        onClick={handleToggleQuironPrompt}
                        disabled={isQuironUnlocking}
                        className="relative w-full justify-center border-purple-400/40 text-purple-200 hover:bg-purple-500/10 overflow-hidden"
                      >
                        {isQuironUnlocking ? 'Procesando…' : 'Ver cortometraje completo'}
                      </Button>
                      {showQuironCoins ? (
                        <div className="pointer-events-none absolute inset-0 overflow-visible">
                          {Array.from({ length: 6 }).map((_, index) => {
                            const startLeft = 0.35 + index * 0.04;
                            const startTop = 0.7;
                            const x = 220 + index * 8;
                            const y = -240 - index * 18;
                            return (
                              <motion.span
                                key={`quiron-coin-flight-${index}`}
                                className="absolute h-6 w-6 rounded-full bg-gradient-to-br from-amber-200 to-yellow-500 shadow-[0_0_18px_rgba(250,204,21,0.55)]"
                                style={{ left: `${startLeft * 100}%`, top: `${startTop * 100}%` }}
                                initial={{ opacity: 0.95, scale: 0.8, rotate: 0, x: 0, y: 0 }}
                                animate={{ opacity: 0, scale: 1, rotate: 140 + index * 18, x, y }}
                                transition={{ duration: 1.15, ease: 'easeOut' }}
                              />
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
                
                {showQuironCommunityPrompt ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="rounded-2xl border border-amber-200/40 bg-amber-500/10 p-4 text-sm text-amber-100"
                  >
                    Únete a la comunidad para usar tus gatokens y desbloquear experiencias completas. Muy pronto podrás conectar tu saldo y suscripción aquí mismo.
                  </motion.div>
                ) : null}
                <p className="text-xs text-slate-400 leading-relaxed">
                  Al desbloquear, el cortometraje se abre en vista completa fuera de esta tarjeta.
                </p>
                {activeDefinition.screening?.footnote ? (
                  <p className="text-xs text-slate-400 leading-relaxed">{activeDefinition.screening.footnote}</p>
                ) : null}
              </div>

            </div>

            <div className="space-y-6">
              <div className="relative rounded-3xl border border-white/10 bg-black/30 p-6 space-y-4">
                <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Cortometraje</p>
                <div className="flex flex-wrap items-baseline gap-2">
                  <h4 className="font-display text-xl text-slate-100">{activeDefinition.quiron?.title}</h4>
                  
                </div>
                
              </div>
              <p className="text-sm text-slate-300/80 leading-relaxed">{activeDefinition.quiron?.description}</p>
              <p className="text-sm text-slate-200/90 leading-relaxed">{activeDefinition.quiron?.microcopy}</p>
              {activeDefinition.copycats.tags.map((tag, index) => (
                      <span
                        key={`quiron-tag-${index}`}
                        className="px-3 py-1 rounded-full border border-purple-400/30 bg-purple-900/20 text-xs text-purple-100"
                      >
                        {tag}
                      </span>
                    ))}
              {activeDefinition.quiron?.teaser ? (
                <div>{renderMedia(activeDefinition.quiron.teaser)}</div>
              ) : null}
                {quironStills.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {quironStills.map((still, index) => {
                      const label = typeof still === 'string' ? still : still.label || `Still ${index + 1}`;
                      const url = typeof still === 'string' ? null : still.url;
                      return url ? (
                        <div
                          key={still.id || `quiron-still-${index}`}
                          className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                        >
                          <div className="aspect-[4/3] bg-black/40">
                            <img
                              src={url}
                              alt={label}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <p className="px-4 py-3 text-xs uppercase tracking-[0.25em] text-slate-200">{label}</p>
                        </div>
                      ) : (
                        <span
                          key={`quiron-still-pill-${index}`}
                          className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-slate-100"
                        >
                          {label}
                        </span>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              {renderCommunityBlock('copycats', {
                ctaLabel: 'suma tu voz',
                className: 'rounded-3xl border border-white/10 bg-black/25 p-6 space-y-5',
                reactionProps: {
                  showcaseId: 'copycats',
                  title: 'Validación cinematográfica',
                  description: 'Haz clic para dejar un like y amplificar el screening de CopyCats + Quirón.',
                  buttonLabel: 'Sumar mi aplauso',
                  className: 'mt-2 bg-gradient-to-r from-slate-900/40 to-purple-900/20',
                },
              })}
            </div>
          </div>
        </div>
      );
    }

    if (activeDefinition.type === 'blog-series') {
      const entries = activeDefinition.entries ?? [];
      const renderEntryAction = (entry) => {
        switch (entry.type) {
          case 'internal-reading':
            if (entry.previewMode === 'pdf' && entry.previewPdfUrl) {
              return (
                <>
                  <Button
                    onClick={() => setShowAutoficcionPreview(true)}
                    className="w-full sm:w-auto justify-center"
                  >
                    Leer fragmento
                  </Button>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-amber-100">
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/60 bg-amber-500/15 px-3 py-1 text-amber-50">
                      <Coins size={14} className="text-amber-50" />
                      150 gatokens
                    </span>
                    <span className="text-slate-400">Lectura y desbloqueo del PDF interactivo</span>
                  </div>
                </>
              );
            }
            if (entry.previewMode === 'image' && entry.previewImage) {
              return (
                <Button
                  onClick={() =>
                    handleOpenImagePreview({
                      src: entry.previewImage,
                      title: entry.title,
                      description: entry.description,
                    })
                  }
                  className="w-full sm:w-auto justify-center"
                >
                  Ver fragmento
                </Button>
              );
            }
            return entry.contentSlug ? (
              <>
                <Button onClick={() => handleOpenBlogEntry(entry.contentSlug)} className="w-full sm:w-auto justify-center">
                  Leer fragmento
                </Button>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-amber-100">
                  <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/60 bg-amber-500/15 px-3 py-1 text-amber-50">
                    <Coins size={14} className="text-amber-50" />
                    150 gatokens
                  </span>
                  <span className="text-slate-400">Lectura y desbloqueo del fragmento</span>
                </div>
              </>
            ) : null;
          case 'purchase-link':
            if (entry.app) {
              return (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setIsNovelaReserveOpen(true)}
                    className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-purple-400/40 text-purple-200 hover:bg-purple-500/10 px-6 py-2 font-semibold transition"
                  >
                    Comprar edición física
                  </button>
                  <Button
                    onClick={() => handleNovelAppCTA(entry.app)}
                    className="w-full sm:w-auto justify-center bg-purple-600/80 hover:bg-purple-600 text-white rounded-full"
                  >
                    {entry.app.ctaLabel || 'Leer fragmentos'}
                  </Button>
                </div>
              );
            }

            return (
              <button
                type="button"
                onClick={() => setIsNovelaReserveOpen(true)}
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-purple-400/40 text-purple-200 hover:bg-purple-500/10 px-6 py-2 font-semibold transition"
              >
                Comprar edición
              </button>
            );
          case 'qr-scan':
            return (
              <Button
                variant="outline"
                className="border-purple-400/40 text-purple-200 hover:bg-purple-500/10 w-full sm:w-auto justify-center"
                onClick={() =>
                  toast({
                    title: 'Escanea el QR',
                    description: 'Abre la cámara de tu dispositivo y apunta al código para activar la experiencia.',
                  })
                }
              >
                Escanear QR
              </Button>
            );
          default:
            return null;
        }
      };

      return (
        <div className="space-y-10">
          {renderCollaboratorsSection(activeDefinition.collaborators, 'novela')}
          <div>{renderPostDetails()}</div>
          {entries.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-[3fr_2fr]">
              {entries.map((entry) => {
                if (entry.type === 'horizontal-gallery') {
                  return (
                    <div
                      key={entry.id}
                      className="md:col-span-2 rounded-2xl border border-white/10 p-6 bg-black/30 space-y-4"
                    >
                      <div className="space-y-2">
                        <h5 className="font-display text-xl text-slate-100">{entry.title}</h5>
                        {entry.description ? (
                          <p className="text-sm text-slate-300/80 leading-relaxed">{entry.description}</p>
                        ) : null}
                      </div>
                      <div className="flex gap-4 overflow-x-auto pb-2">
                        {entry.images?.map((image, index) => (
                          <div
                            key={`${entry.id}-${index}`}
                            className="w-48 h-32 flex-shrink-0 rounded-xl overflow-hidden border border-white/5 bg-black/40"
                          >
                            <img
                              src={image}
                              alt={`${entry.title} ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                if (entry.type === 'quotes') {
                  return (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-white/10 p-6 bg-black/30 space-y-6"
                >
                  <h5 className="font-display text-xl text-slate-100">{entry.title}</h5>
                 
                  <div className="space-y-4">
                        {entry.quotes?.map((quote, index) => (
                          <blockquote
                            key={`${entry.id}-quote-${index}`}
                            className="rounded-2xl border border-white/5 bg-black/20 p-4 text-slate-100 font-light leading-relaxed"
                          >
                            <p>{quote.quote}</p>
                            {quote.author ? (
                              <p className="text-xs text-slate-500 mt-2">{quote.author}</p>
                            ) : null}
                          </blockquote>
                        ))}
                      </div>
                      <div className="mt-2 space-y-2">
                        <ShowcaseReactionInline
                          showcaseId="miniversoNovela"
                          description="Haz clic para guardar un like y amplificar las conversaciones que la novela susurra."
                          buttonLabel="Apoyar la novela"
                          className="bg-gradient-to-br from-purple-900/20 to-black/40"
                        />
                      </div>
                    </div>
                  );
                }

                const imageSrc = entry.previewImage || entry.image;
                const action = renderEntryAction(entry);

                return (
                  <div key={entry.id} className="rounded-2xl border border-white/10 p-6 bg-black/30 space-y-4">
                    {imageSrc ? (
                      <div className="rounded-xl overflow-hidden border border-white/5 bg-black/40 h-52 sm:h-64">
                        <img src={imageSrc} alt={entry.title} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    ) : null}
                    <div className="space-y-2">
                      <h5 className="font-display text-xl text-slate-100">{entry.title}</h5>
                      {entry.description ? (
                        <p className="text-sm text-slate-300/80 leading-relaxed">{entry.description}</p>
                      ) : null}
                    </div>
                    {entry.snippet ? (
                      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 space-y-2">
                        <p className="text-xs uppercase tracking-[0.3em] text-purple-300">{entry.snippet.tagline}</p>
                        {entry.snippet.text ? (
                          <p className="text-sm text-slate-200/90 leading-relaxed">{entry.snippet.text}</p>
                        ) : null}
                      </div>
                    ) : null}
                    {action}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Muy pronto liberaremos el resto de la serie.</p>
          )}
        </div>
      );
    }

    const videos = activeDefinition.videos ?? [];

    return (
      <div className="space-y-10">
        <div>
          {renderPostDetails(
            'Pronto liberaremos la carta completa de este miniverso. Mientras tanto puedes explorar la galería audiovisual.'
          )}
        </div>

        {videos.length > 0 ? (
          <div>
            <h5 className="font-display text-xl text-slate-100 mb-4">Galería audiovisual</h5>
            <div className="grid gap-6 md:grid-cols-2">
              {videos.map((video, index) => {
                const videoId = video.id || video.url || `video-${index}`;
                return (
                  <div
                    key={video.id || video.url || `video-${index}`}
                    className="rounded-2xl border border-white/10 overflow-hidden bg-black/40 flex flex-col"
                  >
                    <div className="relative aspect-video w-full">
                      {/\.mp4($|\?)/i.test(video.url) ? (
                        <>
                          {isMobileViewport ? (
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/55" />
                          ) : null}
                          {renderMobileVideoBadge()}
                          <video
                            src={video.url}
                            title={video.title}
                            className="w-full h-full object-cover bg-black"
                            controls={canUseInlinePlayback(videoId)}
                            onClick={(event) => requestMobileVideoPresentation(event, videoId)}
                            playsInline
                            preload="metadata"
                            poster={video.poster}
                          />
                        </>
                      ) : (
                        <iframe
                          src={video.url}
                          title={video.title}
                          className="w-full h-full"
                          frameBorder="0"
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      )}
                    </div>
                    <div className="p-4 space-y-1 text-sm text-slate-300">
                      <p className="font-semibold text-slate-100">{video.title}</p>
                      {video.author ? <p>{video.author}</p> : null}
                      {video.duration ? <p className="text-slate-500">Duración: {video.duration}</p> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
        {activeShowcase === 'copycats' ? (
          <ShowcaseReactionInline
            showcaseId="copycats"
            description="Guarda un like que celebra las miradas que quedarán en escena."
            title="Opiniones después del corte"
          />
        ) : null}
      </div>
    );
  };

  const renderExplorerBadge = () => {
    if (!explorerBadge.unlocked) {
      return null;
    }
    const badgeStatus = !isAuthenticated ? 'guest' : isSubscriber ? 'subscriber' : 'member';
    const alias =
      user?.user_metadata?.alias ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.display_name ||
      'Errante anónimo';
    const statusCopy = {
      guest:
        'Inicia sesión para guardar esta insignia, nombrarla y recibir futuras recompensas vinculadas a tu cuenta.',
      member:
        'Tu badge ya está en tu cuenta. Hazte suscriptor para transformar este logro en energía real y recibir recargas automáticas.',
      subscriber: `Recompensa activada. Sumamos ${EXPLORER_BADGE_REWARD} GATokens a tu saldo como agradecimiento.`,
    };
    const cta =
      badgeStatus === 'guest' ? (
        <Button onClick={handleBadgeLogin} className="bg-purple-600/80 hover:bg-purple-600 text-white">
          Iniciar sesión
        </Button>
      ) : badgeStatus === 'member' ? (
        <Button
          onClick={handleBadgeSubscribe}
          variant="outline"
          className="border-amber-300/60 text-amber-200 hover:bg-amber-200/10"
        >
          Suscribirme
        </Button>
      ) : null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        viewport={{ once: true }}
        className="mt-10 rounded-2xl border border-purple-500/40 bg-gradient-to-br from-slate-900/70 to-purple-900/30 p-6 md:p-8 shadow-[0_20px_80px_rgba(115,73,255,0.15)]"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4 md:gap-6">
            <div className="relative h-16 w-16 rounded-2xl border border-purple-400/40 bg-black/40 flex items-center justify-center">
              <Sparkles className="text-purple-200" size={28} />
              {showBadgeCoins ? (
                <span className="pointer-events-none absolute inset-0">
                  {Array.from({ length: 6 }).map((_, index) => {
                    const endX = (index - 2.5) * 18;
                    const endY = -50 - index * 12;
                    return (
                      <motion.span
                        key={`badge-coin-${index}`}
                        className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-amber-200 to-yellow-500 shadow-[0_0_12px_rgba(250,204,21,0.4)]"
                        initial={{ opacity: 0.95, scale: 0.7, x: 0, y: 0 }}
                        animate={{ opacity: 0, scale: 1.05, x: endX, y: endY, rotate: 100 + index * 24 }}
                        transition={{ duration: 1.05, ease: 'easeOut', delay: index * 0.03 }}
                      />
                    );
                  })}
                </span>
              ) : null}
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-purple-200/80">Insignia secreta</p>
              <h4 className="font-display text-2xl text-white">{EXPLORER_BADGE_NAME}</h4>
              <p className="text-sm text-slate-300/80 leading-relaxed">
                Leíste los nueve mini-versos autorales y abriste cada portal. {alias} ahora figura en el registro de
                errantes.
              </p>
              <p className="text-xs text-slate-300/70 uppercase tracking-[0.25em]">{statusCopy[badgeStatus]}</p>
              {badgeStatus === 'subscriber' && explorerBadge.rewardClaimed ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-500/10 px-4 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-emerald-200">
                  <Coins size={14} className="text-emerald-200" />
                  +{EXPLORER_BADGE_REWARD} GAT
                </div>
              ) : null}
            </div>
          </div>
          {cta ? <div className="flex-shrink-0">{cta}</div> : null}
        </div>
      </motion.div>
    );
  };

  const showcaseOverlay = typeof document !== 'undefined'
    ? createPortal(
      <AnimatePresence>
        {activeDefinition ? (
          <motion.div
            key="showcase-overlay"
            className="fixed inset-0 z-[140] flex items-center justify-center px-5 py-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-black/95 via-slate-950/90 to-black/95"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveShowcase(null)}
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-60 sm:opacity-75 mix-blend-screen"
              aria-hidden="true"
              style={{
                backgroundImage:
                  'radial-gradient(1px 1px at 8% 12%, rgba(248,250,252,0.8), transparent 65%),' +
                  'radial-gradient(2px 2px at 14% 28%, rgba(241,245,249,0.65), transparent 70%),' +
                  'radial-gradient(1px 1px at 22% 44%, rgba(255,255,255,0.45), transparent 70%),' +
                  'radial-gradient(1.5px 1.5px at 30% 18%, rgba(226,232,240,0.6), transparent 70%),' +
                  'radial-gradient(2px 2px at 38% 62%, rgba(241,245,249,0.6), transparent 70%),' +
                  'radial-gradient(1px 1px at 46% 30%, rgba(255,255,255,0.4), transparent 70%),' +
                  'radial-gradient(1.5px 1.5px at 54% 16%, rgba(241,245,249,0.55), transparent 70%),' +
                  'radial-gradient(2px 2px at 62% 48%, rgba(226,232,240,0.6), transparent 70%),' +
                  'radial-gradient(1px 1px at 70% 22%, rgba(255,255,255,0.35), transparent 70%),' +
                  'radial-gradient(1.5px 1.5px at 78% 66%, rgba(241,245,249,0.55), transparent 70%),' +
                  'radial-gradient(2px 2px at 86% 38%, rgba(226,232,240,0.6), transparent 70%),' +
                  'radial-gradient(1px 1px at 92% 80%, rgba(255,255,255,0.35), transparent 70%)',
              }}
            />
            <motion.div
              ref={showcaseRef}
              className="relative z-10 w-full max-w-6xl max-h-[88vh] overflow-y-auto rounded-[28px] border border-white/15 bg-slate-950/55 backdrop-blur-2xl p-6 md:p-10 shadow-[0_35px_120px_rgba(0,0,0,0.65)]"
              initial={{ scale: 0.96, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 18 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            >
              {activeDefinition.type !== 'tragedia' ? (
                <div className="flex justify-end">
                  <button
                    onClick={() => setActiveShowcase(null)}
                    className="text-sm text-slate-400 hover:text-white transition"
                    aria-label="Cerrar escaparate"
                  >
                    Cerrar ✕
                  </button>
                </div>
              ) : null}
              {activeDefinition.type !== 'tragedia' ? (
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-10 pr-0">
                  <div className="flex-1 space-y-6">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-400/70 mb-2">Escaparate</p>
                    <h3 className="font-display text-3xl text-slate-100 mb-3">{activeDefinition.label}</h3>
                    <p className="text-slate-300/80 leading-relaxed font-light max-w-3xl">{activeDefinition.intro}</p>
                    {activeDefinition.iaProfile ? (
                      <div className="max-w-xl">
                        <IAInsightCard {...activeDefinition.iaProfile} compact />
                      </div>
                    ) : null}
                  </div>
                  <div className="md:w-[360px] flex-shrink-0">
                    {rendernotaAutoral()}
                  </div>
                </div>
              ) : null}

              <div className="mt-8">{renderShowcaseContent()}</div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>,
      document.body,
    )
    : null;

  const oraculoOverlay = typeof document !== 'undefined'
    ? createPortal(
      <AnimatePresence>
        {isOraculoOpen ? (
          <motion.div
            key="oraculo-iframe"
            className="fixed inset-0 z-[170] flex items-center justify-center px-4 py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseOraculo}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Oráculo interactivo"
              className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/90 shadow-[0_35px_120px_rgba(0,0,0,0.65)]"
              initial={{ scale: 0.96, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 18 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            >
              <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Oráculo en vivo</p>
                  <h3 className="font-display text-2xl text-slate-100">Demo completa</h3>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {ORACULO_URL ? (
                    <a
                      href={ORACULO_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-200 underline underline-offset-4 hover:text-white"
                    >
                      Abrir en nueva pestaña
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleCloseOraculo}
                    className="text-slate-300 hover:text-white transition"
                  >
                    Cerrar ✕
                  </button>
                </div>
              </div>
              <div className="h-[72vh] bg-black">
                {ORACULO_URL ? (
                  <iframe
                    title="Oráculo interactivo"
                    src={ORACULO_URL}
                    className="h-full w-full"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    URL del Oráculo no configurada.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>,
      document.body,
    )
    : null;

  const causeSiteOverlay = typeof document !== 'undefined'
    ? createPortal(
      <AnimatePresence>
        {isCauseSiteOpen ? (
          <motion.div
            key="cause-site-iframe"
            className="fixed inset-0 z-[175] flex items-center justify-center px-4 py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseCauseSite}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Isabel Ayuda para la Vida"
              className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/90 shadow-[0_35px_120px_rgba(0,0,0,0.65)]"
              initial={{ scale: 0.96, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 18 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            >
              <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Causa social</p>
                  <h3 className="font-display text-2xl text-slate-100">Isabel Ayuda para la Vida</h3>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {CAUSE_SITE_URL ? (
                    <a
                      href={CAUSE_SITE_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-200 underline underline-offset-4 hover:text-white"
                    >
                      Abrir en nueva pestaña
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleCloseCauseSite}
                    className="text-slate-300 hover:text-white transition"
                  >
                    Cerrar ✕
                  </button>
                </div>
              </div>
              <div className="relative w-full aspect-[16/10] bg-black">
                {CAUSE_SITE_URL ? (
                  <iframe
                    src={CAUSE_SITE_URL}
                    title="Isabel Ayuda para la Vida"
                    className="h-full w-full"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-slate-300">
                    No se pudo cargar el sitio.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>,
      document.body,
    )
    : null;

  return (
    <>
      <section
        id="transmedia"
        className="py-24 relative min-h-[1800px] md:min-h-[1600px] lg:min-h-[1500px]"
      >
        {import.meta.env?.DEV ? (
          <div className="fixed bottom-4 right-4 z-50">
            <button
              type="button"
              onClick={handleResetCredits}
              className="rounded-full border border-amber-300/40 bg-amber-500/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-amber-200 shadow-[0_10px_25px_rgba(0,0,0,0.35)] hover:bg-amber-500/20"
            >
              Reset créditos
            </button>
          </div>
        ) : null}
        <div className="section-divider mb-24"></div>

        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-6 min-h-[240px] md:min-h-[260px]"
          >
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400/70">Universo Transmedia</p>
            <h2 className="font-display text-4xl md:text-5xl font-medium text-gradient italic">
              Escaparate de Miniversos
            </h2>
            <p className="text-lg text-slate-300/80 max-w-3xl mx-auto leading-relaxed font-light">
              El universo de #GatoEncerrado se expande en <strong>nueve miniversos</strong>. Cada uno late por su cuenta —ya estaba ahí antes de que llegaras— y forma parte del mismo organismo narrativo. Al explorarlos, activas <span className="font-semibold text-purple-200">GATokens</span>: una energía simbólica que impulsa la experiencia artística y contribuye al sostenimiento de la causa social de {' '}
              <button
                type="button"
                onClick={handleScrollToSupport}
                className="text-purple-200 underline underline-offset-4 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded-sm"
              >
                Isabel Ayuda para la Vida, A.C.
              </button>
             {' '} </p>

          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 min-h-[720px]">
            {formats.map((format, index) => {
              const Icon = format.icon;
              const iconClass = format.iconClass ?? 'text-purple-200';
              const tileGradient =
                MINIVERSO_TILE_GRADIENTS[format.id] ?? MINIVERSO_TILE_GRADIENTS.default;
              const isActiveTile = activeShowcase === format.id;
              const isDimmedTile = isCinematicShowcaseOpen && !isActiveTile;
              return (
                <motion.div
                  key={format.id}
                  initial={false}
                  animate={{
                    opacity: isDimmedTile ? 0 : 1,
                    scale: isCinematicShowcaseOpen ? (isActiveTile ? 1.06 : 0.96) : 1,
                    y: isCinematicShowcaseOpen ? (isActiveTile ? -8 : 10) : 0,
                    filter: isCinematicShowcaseOpen
                      ? isActiveTile
                        ? 'saturate(1.1)'
                        : 'saturate(0.6) blur(3px)'
                      : 'saturate(1)',
                  }}
                  transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
                  className={`group glass-effect rounded-xl p-8 hover-glow cursor-pointer flex flex-col transition-all duration-300 hover:border-purple-400/50 relative overflow-hidden ${
                    isDimmedTile ? 'pointer-events-none' : ''
                  }`}
                  onClick={() => handleFormatClick(format.id)}
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 opacity-80 group-hover:opacity-100 transition duration-500 pointer-events-none"
                    style={{
                      backgroundImage: tileGradient,
                      filter: 'saturate(1.1)',
                      backgroundSize: '160% 160%',
                      backgroundPosition: '0% 0%',
                      animation: 'miniverso-breath 14s ease-in-out infinite alternate',
                      willChange: 'background-position, transform',
                    }}
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 opacity-35 mix-blend-screen pointer-events-none"
                    style={{
                      backgroundImage:
                        'radial-gradient(1px 1px at 12% 18%, rgba(248,250,252,0.8), transparent 65%),' +
                        'radial-gradient(1.5px 1.5px at 24% 42%, rgba(241,245,249,0.65), transparent 70%),' +
                        'radial-gradient(2px 2px at 36% 28%, rgba(226,232,240,0.6), transparent 70%),' +
                        'radial-gradient(1px 1px at 44% 62%, rgba(255,255,255,0.45), transparent 70%),' +
                        'radial-gradient(1.5px 1.5px at 52% 18%, rgba(241,245,249,0.55), transparent 70%),' +
                        'radial-gradient(2px 2px at 64% 48%, rgba(226,232,240,0.6), transparent 70%),' +
                        'radial-gradient(1px 1px at 72% 30%, rgba(255,255,255,0.4), transparent 70%),' +
                        'radial-gradient(1.5px 1.5px at 80% 66%, rgba(241,245,249,0.55), transparent 70%),' +
                        'radial-gradient(2px 2px at 88% 22%, rgba(226,232,240,0.6), transparent 70%),' +
                        'radial-gradient(1px 1px at 18% 78%, rgba(255,255,255,0.35), transparent 70%),' +
                        'radial-gradient(1.5px 1.5px at 58% 78%, rgba(241,245,249,0.55), transparent 70%),' +
                        'radial-gradient(1px 1px at 90% 82%, rgba(255,255,255,0.35), transparent 70%)',
                    }}
                  />
                  <div className="absolute inset-0 opacity-30 mix-blend-screen pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_55%)]" />
                  <div className="relative z-10 flex flex-col h-full">

  {/* BADGE SUPERIOR DERECHO (miniverso leído) */}
  {(() => {
    const boostApplied = Boolean(showcaseBoosts?.[format.id]);
    if (boostApplied) {
      return (
        <div className="absolute top-4 right-4 bg-emerald-900/40 text-emerald-200 text-[0.65rem] uppercase tracking-[0.25em] px-3 py-1 rounded-full border border-emerald-300/40 shadow-[0_0_10px_rgba(16,185,129,0.3)] backdrop-blur-sm">
          Miniverso expandido
        </div>
      );
    }
    return null;
  })()}

  {/* Ícono y título */}
  <div className="flex items-center justify-start mb-6 transition-all duration-300 group-hover:scale-110">
    <Icon
      size={32}
      className={`${iconClass} drop-shadow-[0_0_12px_rgba(168,85,247,0.4)]`}
    />
  </div>

  <h3 className="font-display text-2xl font-medium text-slate-100 mb-1">
    {format.title}
  </h3>

  {/* SUBTEXTO — instrucción breve por miniverso */}
  <p className="font-display italic text-sm text-slate-200/90 tracking-wide mb-4 leading-snug">
    {format.instruccion}
  </p>

  <p className="text-slate-200/80 text-base leading-relaxed mb-4 flex-grow font-light">
    {format.description}
  </p>

  {/* BLOQUE DE ENERGÍA */}
  {(() => {
    const baseValue = baseEnergyByShowcase[format.id] ?? 0;
    const currentValue =
      showcaseEnergy?.[format.id] ?? (baseValue > 0 ? baseValue : 0);
    const boostApplied = Boolean(showcaseBoosts?.[format.id]);
    const toneClass = 'text-amber-200';
    const label = boostApplied ? 'Energía acumulada:' : 'Energía inicial:';
    if (format.id === 'lataza') {
      return (
        <div className="mb-4 text-xs text-slate-200/80 flex flex-wrap items-center gap-2">
          <Coins size={14} className={toneClass} />
          <span className="uppercase tracking-[0.25em] text-slate-100/70">
            Energía:
          </span>
          <span className={`font-semibold ${toneClass}`}>∞</span>
        </div>
      );
    }
    return (
      <div className="mb-4 text-xs text-slate-200/80 flex flex-wrap items-center gap-2">
        <Coins size={14} className={toneClass} />
        <span className="uppercase tracking-[0.25em] text-slate-100/70">
          {label}
        </span>
        <span className={`font-semibold ${toneClass}`}>{currentValue} GAT</span>
      </div>
    );
  })()}

  {/* CTA */}
  <div className="text-purple-300 flex items-center gap-2 font-semibold transition-all duration-300 group-hover:gap-3">
    Gastar Gatokens
    <ArrowRight size={18} />
  </div>
</div>
                </motion.div>
              );
            })}
          </div>
          {showcaseOverlay}
          {oraculoOverlay}
          {causeSiteOverlay}

          {renderExplorerBadge()}

          <div className="mt-16 grid lg:grid-cols-[3fr_2fr] gap-10">
            <motion.div
              id="apoya"
              ref={supportSectionRef}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
              viewport={{ once: true }}
              className="glass-effect rounded-2xl p-8 md:p-10 flex flex-col justify-between relative overflow-hidden opacity-100"
              style={{ opacity: 1 }}
            >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-5 bg-no-repeat bg-center bg-[length:auto_100%] md:bg-[length:200%]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(5,5,10,0.85), rgba(5,5,10,0.85)), url(/assets/bg-logo.png)',
                backgroundBlendMode: 'screen',
                filter: 'grayscale(0.25)',
              }}
            />
            <div className="space-y-5">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400/80">Apoya el proyecto</p>
                <h3 className="font-display text-3xl text-slate-100">
                  Nuestro impacto social crece contigo
                </h3>
                <p className="text-slate-300/80 leading-relaxed font-light">
                  La taquilla mantiene la obra en escena; el universo transmedia financia acompañamiento emocional real.
                  Cada suscripción se distribuye en tres frentes que opera Isabel Ayuda para la Vida, A.C.{' '}
                  <button
                    type="button"
                    onClick={handleOpenCauseSite}
                    className="text-purple-200 underline underline-offset-4 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded-sm"
                  >
                    Visita su sitio
                  </button>
                </p>
                     <p className="text-[11px] leading-4 text-slate-300/80 pt-2">
          * La asociación no cobra al estudiante por sesión. Las sesiones se asignan sin costo para
          las familias cuando se detecta riesgo, gracias a la combinación de suscripciones, aportes simbólicos y apoyos institucionales.
        </p>

                <CauseImpactAccordion
                  items={CAUSE_ACCORDION}
                  onOpenImagePreview={handleOpenImagePreview}
                />
              </div>

              <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center">
                <Button
                  onClick={handleOpenMiniverses}
                  variant="ghost"
                  className="text-purple-200 hover:text-white hover:bg-white/10 justify-start md:justify-center"
                >
                  🧪 Ver miniversos activos
                </Button>
                <div className="flex items-center gap-3 text-slate-400 text-sm">
                  <HeartHandshake size={20} className="text-purple-300" />
                  <span>Tu suscripción = Apoyo directo</span>
                </div>
              </div>
            </motion.div>
            

            <motion.div
              id="cta"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
              viewport={{ once: true }}
              className="glass-effect rounded-2xl p-6 border border-white/10 bg-slate-950/50 shadow-2xl"
            >
              <CallToAction />
            </motion.div>
            {showInstallPwaCTA ? (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                viewport={{ once: true }}
                className="glass-effect rounded-2xl p-6 border border-white/10 bg-slate-950/50 shadow-2xl"
              >
                <InstallPWACTA />
              </motion.div>
            ) : null}
          </div>
        </div>
      </section>

      <MiniverseModal
        open={isMiniverseOpen}
        onClose={handleCloseMiniverses}
        contextLabel={miniverseContext}
        onSelectMiniverse={handleSelectMiniverse}
      />
      <ContributionModal
        open={isContributionOpen}
        onClose={() => {
          setIsContributionOpen(false);
          setContributionCategoryId(null);
        }}
        initialCategoryId={contributionCategoryId}
        presentation="sheet"
      />
      <ReserveModal
        open={isNovelaReserveOpen}
        onClose={() => setIsNovelaReserveOpen(false)}
        mode="offseason"
        initialPackages={['novela-400']}
        overlayZClass="z-[210]"
      />
      {showBadgeLoginOverlay ? <LoginOverlay onClose={handleCloseBadgeLogin} /> : null}

      {pdfPreview ? (
        <div className="fixed inset-0 z-[190] flex items-center justify-center px-4 py-10">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClosePdfPreview} />
          <div className="relative z-10 w-full max-w-5xl space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400/70">Lectura en progreso</p>
                <h4 className="font-display text-2xl text-slate-100">{pdfPreview.title || 'Fragmento en PDF'}</h4>
                {pdfPreview.description ? (
                  <p className="text-sm text-slate-300/80 leading-relaxed max-w-2xl">{pdfPreview.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={handleClosePdfPreview}
                className="self-start rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 hover:text-white hover:border-white/30 transition"
              >
                Cerrar ✕
              </button>
            </div>

            <div
              ref={pdfContainerRef}
              className="rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl p-4 max-h-[75vh] overflow-auto"
            >
              {pdfLoadError ? (
                <p className="text-sm text-red-300 text-center py-8">{pdfLoadError}</p>
              ) : (
                <Document
                  file={pdfPreview.src}
                  onLoadSuccess={handlePdfLoadSuccess}
                  onLoadError={(error) => {
                    console.error('Error al cargar PDF del miniverso:', error);
                    setPdfLoadError('No pudimos cargar el fragmento en PDF. Intenta de nuevo más tarde.');
                  }}
                  loading={<p className="text-sm text-slate-400 text-center py-8">Preparando páginas…</p>}
                >
                  {pdfNumPages
                    ? Array.from(new Array(pdfNumPages), (_, index) => (
                        <div key={`pdf-page-${index + 1}`} className="mb-6 last:mb-0">
                          <Page
                            pageNumber={index + 1}
                            width={pdfPageWidth}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                          />
                        </div>
                      ))
                    : null}
                </Document>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {MINIVERSO_EDITORIAL_INTERCEPTION_ENABLED && isMiniversoEditorialModalOpen ? (
        <div className="fixed inset-0 z-[190] flex items-center justify-center px-4 py-10">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleCloseMiniversoEditorialModal} />
          <div className="relative z-10 w-full max-w-xl">
            <div className="glass-effect rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl p-8 md:p-10 text-center space-y-6">
              <h3 className="font-display text-3xl md:text-4xl text-slate-50">
                “Este espacio se activará después de la función.”
              </h3>
              <p className="text-base md:text-lg text-slate-200/90 leading-relaxed">
                Las expansiones narrativas ya están en marcha,<br />
                pero hoy el foco está en la obra en escena.<br />
                <br />
                Nos vemos en el teatro.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:items-center">
          
                <button
                  type="button"
                  onClick={handleEditorialCtaClick}
                  className="px-4 py-2 rounded-full bg-white/10 text-sm font-semibold uppercase tracking-[0.3em] text-purple-100 hover:bg-white/20 transition"
                >
                  ¿Conoces nuestra causa social?
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {imagePreview ? (
        <div className="fixed inset-0 z-[190] flex items-center justify-center px-4 py-10">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleCloseImagePreview} />
          <div className="relative z-10 w-full max-w-3xl">
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={handleCloseImagePreview}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 hover:text-white hover:border-white/30 transition"
              >
                Cerrar ✕
              </button>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl overflow-hidden">
              <div className="relative w-full aspect-[4/3] bg-black/60">
                <img
                  src={imagePreview.src}
                  alt={imagePreview.title || 'Vista previa'}
                  className="absolute inset-0 w-full h-full object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              {(imagePreview.title || imagePreview.description) ? (
                <div className="p-6 space-y-2">
                  {imagePreview.title ? (
                    <h4 className="font-display text-2xl text-slate-100">{imagePreview.title}</h4>
                  ) : null}
                  {imagePreview.description ? (
                    <p className="text-sm text-slate-300/80 leading-relaxed">{imagePreview.description}</p>
                  ) : null}
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
                    {imagePreview.label || 'Ilustración de la novela'}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {isTazaARActive && isMobileARFullscreen ? (
        <div className="fixed inset-0 z-40 bg-black">
          <ARExperience
            targetSrc="/assets/taza.mind"
            phrases={showcaseDefinitions.lataza.phrases}
            showScanGuide
            guideImageSrc="/assets/taza_transp.png"
            guideLabel="Alinea la ilustración de la taza con el contorno. No necesita ser exacto."
            onExit={handleCloseARExperience}
            initialCameraReady={tazaCameraReady}
            onError={handleARError}
          />
        </div>
      ) : null}
      <AutoficcionPreviewOverlay
        open={showAutoficcionPreview}
        onClose={() => setShowAutoficcionPreview(false)}
      />
    </>
  );
};

export default Transmedia;
