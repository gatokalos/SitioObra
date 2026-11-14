import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Flame, Lock, Sparkles } from 'lucide-react';
import ResonanceModal, {
  LEVEL2_QUESTIONS,
  PORTAL_GRADIENT,
  buildL1Acknowledgment,
  buildL2Acknowledgment,
  enviarExpectativa,
} from '@/components/portal/ResonanceModal';
import { getResonanceDramaturgy, PORTAL_EMBLEM_URL } from '@/lib/resonanceDramaturgy';
import { readResonanceProgress } from '@/lib/bitacoraShared';

// El tablero del método, dentro de la tarjeta de la galería (Carlos, 13 nov
// 2026). Después de enviar la primera intuición al dorso, saltar de la tarjeta
// a la ficha completa «se ve totalmente disruptivo»: el recorrido sigue aquí
// mismo —el eco de la intuición y la preparación de escena— hasta el botón que
// abre el artefacto.
// Desde el 14 nov 2026 (Carlos) el artefacto se abre en su propia ventana, sin
// la ficha, y al salir se vuelve a esta tarjeta: En el foco sube al primer
// lugar, con el video del autor y la retención, y las dos primeras escenas
// quedan plegadas debajo. «Mientras tanto» revela la ficha por primera vez; de
// ahí en adelante la tarjeta abre la ficha.
// No es otro método: lee y escribe el mismo registro, con las mismas funciones,
// y En el foco es la misma pieza del tablero completo (ResonanceModal.jsx).
// Es otra hoja porque la del método se acomoda según el ancho de la ventana, no
// el de la tarjeta.
const TableroEnLaTarjeta = ({
  portal,
  formaTitle,
  gradiente = null,
  isDevAuth = false,
  onHabitar,
  onVolver,
  onMientrasTanto,
  onRequireLogin,
}) => {
  const dramaturgia = getResonanceDramaturgy(portal);
  const calibracion = LEVEL2_QUESTIONS[portal] ?? null;
  const gradienteDeLaForma = PORTAL_GRADIENT[portal] ?? PORTAL_GRADIENT.obra;
  const [registro] = useState(() => readResonanceProgress(portal).record);
  const ecoIntuicion = registro.l1_acknowledgment ?? buildL1Acknowledgment(portal, registro.l1_answer);
  const [expectativa, setExpectativa] = useState(() => registro.l2_option ?? null);
  const [ecoExpectativa, setEcoExpectativa] = useState(
    () => registro.l2_acknowledgment ?? buildL2Acknowledgment(portal, registro.l2_option),
  );
  const [enviando, setEnviando] = useState(false);
  // De vuelta del artefacto. Con la escena terminada toca En el foco; si se
  // salió antes, la preparación ofrece volver a la escena.
  const enElFoco = Boolean(registro.l2_escena_terminada || registro.l3_recommendation?.step3);
  const escenaAbierta = Boolean(registro.l2_narrative_opened);
  const sellada = Boolean(registro.experience_ts);

  const elegir = async (opcion) => {
    if (expectativa || enviando) return;
    setExpectativa(opcion);
    setEcoExpectativa(buildL2Acknowledgment(portal, opcion));
    setEnviando(true);
    try {
      await enviarExpectativa({ portal, option: opcion, isDevAuth, onEco: setEcoExpectativa });
    } finally {
      setEnviando(false);
    }
  };

  const escena = 'rounded-2xl border px-4 py-3';
  const eco = 'rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm leading-relaxed text-slate-200/90';

  // Una escena ya vivida, plegada: su esfera encendida y su nombre.
  const plegada = ({ icono: Icono, ceja, titulo, retraso }) => (
    <motion.section
      className={`${escena} flex shrink-0 items-center gap-3 border-white/15 bg-black/50`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: retraso }}
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradienteDeLaForma}`}>
        <Icono className="h-5 w-5 text-white" />
      </span>
      <div className="min-w-0 space-y-0.5">
        <p className="text-[0.56rem] uppercase tracking-[0.18em] text-slate-400/70">{ceja}</p>
        <p className="font-display text-base leading-tight text-white">{titulo}</p>
      </div>
    </motion.section>
  );

  return (
    <div
      data-tablero-en-la-tarjeta={enElFoco ? 'foco' : 'preparacion'}
      className="flex h-full flex-col gap-3 overflow-y-auto rounded-2xl border border-white/10 p-6 text-left"
      // El mismo fondo del dorso: el gradiente de la forma con su velo.
      style={{
        backgroundColor: '#0a0c18',
        backgroundImage: gradiente
          ? `linear-gradient(180deg, rgba(6,8,20,0.5), rgba(6,8,20,0.28)), ${gradiente}`
          : 'radial-gradient(120% 60% at 20% 0%, rgba(110,60,90,0.55), transparent 60%), linear-gradient(160deg, #0d1022 0%, #151a36 50%, #2a1b3c 100%)',
      }}
    >
      <div className="flex shrink-0 items-center justify-between gap-3">
        <p className="text-[0.65rem] uppercase tracking-[0.4em] text-sky-300">
          #Miniversos{formaTitle ? ` · ${formaTitle}` : ''}
        </p>
        {onVolver ? (
          <button
            type="button"
            onClick={onVolver}
            className="shrink-0 text-[0.7rem] text-slate-400 underline underline-offset-4 transition hover:text-slate-100"
          >
            Volver
          </button>
        ) : null}
      </div>

      {enElFoco ? (
        <>
          {/* Tercera escena, al frente: el video del autor y, después, la
              retención con sus tres filas. «Mientras tanto» es `onClose`. */}
          <motion.section
            data-tablero="foco"
            className={`${escena} shrink-0 space-y-3 border-sky-400/50 bg-sky-500/[0.07] shadow-[0_0_28px_rgba(56,189,248,0.18)]`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-sky-300/50 bg-sky-500/10 shadow-[0_0_18px_rgba(56,189,248,0.35)]">
                <Sparkles className="h-5 w-5 text-white" />
              </span>
              <div className="min-w-0 space-y-0.5">
                <p className="text-[0.56rem] uppercase tracking-[0.18em] text-slate-400/70">{dramaturgia.phase3Eyebrow}</p>
                <p className="font-display text-base leading-tight text-white">{dramaturgia.phase3Title}</p>
              </div>
            </div>
            <ResonanceModal
              soloEnElFoco
              open
              portal={portal}
              onClose={() => onMientrasTanto?.()}
              onRequireLogin={onRequireLogin}
            />
          </motion.section>
          {plegada({ icono: Eye, ceja: 'Antes de entrar', titulo: 'Primera intuición', retraso: 0.22 })}
          {plegada({ icono: Flame, ceja: dramaturgia.phase2Eyebrow, titulo: dramaturgia.phase2Title, retraso: 0.34 })}
        </>
      ) : (
        <>
          {/* Primera escena: ya contestada. Su eco. */}
          <motion.section
            className={`${escena} shrink-0 space-y-2 border-white/20 bg-black/50`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
          >
            <div className="flex items-center gap-3">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradienteDeLaForma}`}>
                <Eye className="h-5 w-5 text-white" />
              </span>
              <div className="min-w-0 space-y-0.5">
                <p className="text-[0.56rem] uppercase tracking-[0.18em] text-slate-400/70">Antes de entrar</p>
                <p className="font-display text-base leading-tight text-white">Primera intuición</p>
              </div>
            </div>
            <p className={eco} data-tablero="eco-intuicion">
              {ecoIntuicion || 'Tu primera intuición quedó registrada.'}
            </p>
          </motion.section>

          {/* Segunda escena: la preparación. Primero la pregunta con sus respuestas;
              contestada, su eco y la entrada a la forma. */}
          <motion.section
            className={`${escena} shrink-0 space-y-3 ${
              expectativa
                ? 'border-purple-300/45 bg-black/55'
                : 'border-sky-400/50 bg-sky-500/[0.07] shadow-[0_0_28px_rgba(56,189,248,0.18)]'
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.22 }}
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                  expectativa
                    ? `bg-gradient-to-br ${gradienteDeLaForma}`
                    : 'animate-pulse border border-sky-300/50 bg-sky-500/10 shadow-[0_0_18px_rgba(56,189,248,0.35)]'
                }`}
              >
                <Flame className="h-5 w-5 text-white" />
              </span>
              <div className="min-w-0 space-y-0.5">
                <p className="text-[0.56rem] uppercase tracking-[0.18em] text-slate-400/70">{dramaturgia.phase2Eyebrow}</p>
                <p className="font-display text-base leading-tight text-white">{dramaturgia.phase2Title}</p>
              </div>
            </div>

            {!expectativa && calibracion ? (
              <div className="space-y-3">
                <p className="font-display text-[1.3rem] leading-snug question-voice">{calibracion.question}</p>
                <div className="flex flex-wrap gap-1.5">
                  {calibracion.options.map((opcion) => (
                    <button
                      key={opcion}
                      type="button"
                      data-tablero="opcion"
                      onClick={() => void elegir(opcion)}
                      className="rounded-full border border-amber-400/30 bg-amber-900/20 px-3 py-1.5 text-xs text-amber-100/90 transition hover:border-amber-400/55 hover:bg-amber-900/35 hover:text-amber-50"
                    >
                      {opcion}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {expectativa ? (
              <>
                <p className={eco} data-tablero="eco-expectativa">
                  {ecoExpectativa || buildL2Acknowledgment(portal, expectativa)}
                </p>
                <motion.div
                  className="flex flex-col items-center px-2 pb-1 pt-1 text-center"
                  initial={{ opacity: 0, scale: 0.97, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 210, damping: 22 }}
                >
                  {/* Los mismos textos del tablero completo para quien salió de
                      la escena antes de terminarla. */}
                  <p className="font-display text-base uppercase leading-tight tracking-[0.1em] text-amber-100">
                    {dramaturgia.form} {escenaAbierta || sellada ? 'sigue en escena' : 'entra en escena'}
                  </p>
                  <p className="mt-1 max-w-[30ch] text-xs leading-relaxed text-slate-300/75">
                    {sellada
                      ? 'La conversación quedó abierta en la escena. Vuelve para terminarla.'
                      : escenaAbierta
                        ? 'Saliste antes del gesto. La forma queda abierta donde la dejaste.'
                        : (dramaturgia.entranceDesc ?? dramaturgia.entranceCoda)}
                  </p>
                  {/* La esfera es el botón y el texto su pista, como en el tablero
                      completo (Carlos, 11 oct 2026). */}
                  <motion.button
                    type="button"
                    data-tablero="habitar"
                    onClick={() => onHabitar?.()}
                    className="flex w-full flex-col items-center gap-2 pt-3 transition active:scale-[0.98]"
                    whileHover={{ scale: 1.03 }}
                    aria-label={escenaAbierta || sellada ? 'Volver a la escena' : 'Habitar la forma'}
                  >
                    <span
                      className="relative block h-20 w-20 overflow-hidden rounded-full bg-black ring-2 ring-white/25 motion-safe:animate-[latido_3.2s_ease-in-out_infinite]"
                      style={{ boxShadow: '0 0 60px rgba(0,0,0,0.55)' }}
                    >
                      <img
                        src={PORTAL_EMBLEM_URL[portal] ?? PORTAL_EMBLEM_URL.obra}
                        alt=""
                        className="absolute h-[104%] w-[104%] object-cover"
                        style={{ left: '-2%', top: '-2%' }}
                      />
                      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_-16px_-18px_28px_rgba(0,0,0,0.42),inset_10px_9px_18px_rgba(255,255,255,0.14)]" />
                    </span>
                    <span className="text-sm font-semibold tracking-wide text-amber-200">
                      {escenaAbierta || sellada ? 'Volver a la escena' : 'Habitar la forma'}
                    </span>
                  </motion.button>
                </motion.div>
              </>
            ) : null}
          </motion.section>

          {/* Tercera escena: cerrada. Se abre aquí mismo, al volver del artefacto. */}
          <motion.section
            className={`${escena} flex shrink-0 items-center gap-3 border-white/[0.08] bg-black/35`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.34 }}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-black/25">
              <Lock className="h-4 w-4 text-white/20" />
            </span>
            <div className="min-w-0 space-y-0.5">
              <p className="text-[0.56rem] uppercase tracking-[0.18em] text-white/20">{dramaturgia.phase3Eyebrow}</p>
              <p className="font-display text-base leading-tight text-white/30">{dramaturgia.phase3Title}</p>
            </div>
          </motion.section>
        </>
      )}
    </div>
  );
};

export default TableroEnLaTarjeta;
