import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Eye, Flame, Lock, Sparkles } from 'lucide-react';
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
// mismo —el eco de la intuición y la Sentir la escena— hasta el botón que
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
  // La forma todavía no tiene artefacto: el recorrido sigue sin él.
  sinArtefacto = false,
  onVolver,
  onMientrasTanto,
  onIrALaMemoria,
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
  // «Aún queda escena» (Carlos, 24 nov 2026): quien vuelve con la escena a
  // medias llega viendo lo pendiente. Al voltearse, la tarjeta se desliza sola
  // hasta dejar «Volver a la escena» a la vista; lo ya contestado queda arriba,
  // a un deslizar de distancia.
  const tableroRef = useRef(null);
  const pendienteAbierto = escenaAbierta || sellada;
  useEffect(() => {
    if (!pendienteAbierto) return undefined;
    const espera = window.setTimeout(() => {
      const caja = tableroRef.current;
      const boton = caja?.querySelector('[data-tablero="habitar"]');
      if (!caja || !boton || caja.scrollHeight <= caja.clientHeight + 1) return;
      const abajo = boton.getBoundingClientRect().bottom - caja.getBoundingClientRect().bottom;
      if (abajo <= -12) return;
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      caja.scrollTo({ top: caja.scrollTop + abajo + 24, behavior: reduce ? 'auto' : 'smooth' });
    }, 650);
    return () => window.clearTimeout(espera);
  }, [pendienteAbierto]);

  // Al elegir una respuesta, la pregunta se desvanece, entra su eco y luego
  // «… entra en escena» con la esfera; cuando la esfera ya está, la tarjeta se
  // desliza sola hasta dejarla a la vista (Carlos, 24 nov 2026).
  const recienElegidaRef = useRef(false);
  useEffect(() => {
    if (!expectativa || !recienElegidaRef.current) return undefined;
    recienElegidaRef.current = false;
    const espera = window.setTimeout(() => {
      const caja = tableroRef.current;
      const boton = caja?.querySelector('[data-tablero="habitar"]');
      if (!caja || !boton) return;
      const abajo = boton.getBoundingClientRect().bottom - caja.getBoundingClientRect().bottom;
      if (abajo <= -12) return;
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      caja.scrollTo({ top: caja.scrollTop + abajo + 24, behavior: reduce ? 'auto' : 'smooth' });
    }, 900);
    return () => window.clearTimeout(espera);
  }, [expectativa]);
  const elegir = async (opcion) => {
    if (expectativa || enviando) return;
    recienElegidaRef.current = true;
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
  // En teléfono la escena que va al frente no lleva caja propia: su caja es la
  // tarjeta (Carlos, 15 nov 2026: «quitar el contenedor, usar el contenedor de
  // la tarjeta ya como su contenedor»). En el carrusel (<1024) una caja dentro
  // de otra le quitaba ancho al video y a las filas.
  // Desde el 24 nov 2026 también en escritorio: en el carril la tarjeta es la
  // misma en todas las pantallas y la caja era una tarjeta dentro de otra. El
  // relleno de 16 px se queda (alinea el encabezado con los íconos de las
  // escenas cerradas); el video y bambalinas lo cruzan (index.css).
  // El borde se queda, transparente: así el ícono cae al mismo píxel que el
  // de las escenas con caja.
  const alFrente = 'rounded-none border-transparent bg-transparent shadow-none';
  const eco = 'rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm leading-relaxed text-slate-200/90';

  // La palomita sobre la esfera de cada escena ya vivida (Carlos, 15 nov 2026:
  // «faltaría un check mark o algún indicador que refuerce el recorrido»; el
  // tablero viejo la traía como «✓» al inicio de la descripción).
  const palomita = (
    <span className="palomita-de-escena" data-palomita aria-hidden="true">
      <Check size={10} strokeWidth={3.2} />
    </span>
  );
  // Una escena ya vivida, plegada: su esfera encendida y su nombre.
  const plegada = ({ icono: Icono, ceja, titulo, retraso }) => (
    <motion.section
      className={`${escena} flex shrink-0 items-center gap-3 border-white/15 bg-black/50`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: retraso }}
    >
      <span className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradienteDeLaForma}`}>
        <Icono className="h-5 w-5 text-white" />
        {palomita}
      </span>
      <div className="min-w-0 space-y-0.5">
        <p className="text-[0.56rem] uppercase tracking-[0.18em] text-slate-400/70">{ceja}</p>
        <p className="font-display text-base leading-tight text-white">{titulo}</p>
      </div>
    </motion.section>
  );

  return (
    <div
      ref={tableroRef}
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
      {/* Sin la ceja «#Miniversos · forma»: el retorno es la X de la esquina
          (BotonDeRetorno, Carlos, 24 nov 2026). El contenido sube al renglón
          que dejó; solo el encabezado de la primera escena libra la esquina
          del botón (index.css). */}

      {enElFoco ? (
        <>
          {/* Tercera escena, al frente: el video del autor y, después, la
              retención con sus tres filas. «Mientras tanto» es `onClose`. */}
          <motion.section
            data-tablero="foco"
            className={`${escena} ${alFrente} shrink-0 space-y-3 border-sky-400/50 bg-sky-500/[0.07] shadow-[0_0_28px_rgba(56,189,248,0.18)]`}
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
              onIrALaMemoria={onIrALaMemoria ?? null}
              onRequireLogin={onRequireLogin}
            />
          </motion.section>
          {plegada({ icono: Eye, ceja: 'Antes de entrar', titulo: 'Primera intuición', retraso: 0.22 })}
          {plegada({ icono: Flame, ceja: dramaturgia.phase2Eyebrow, titulo: dramaturgia.phase2Title, retraso: 0.34 })}
        </>
      ) : (
        <>
          {/* Primera escena: ya contestada. Su eco. */}
          {/* También sin caja (Carlos, 24 nov 2026): las dos escenas abiertas
              van igual, sobre la tarjeta. */}
          <motion.section
            data-escena-al-frente=""
            className={`${escena} ${alFrente} shrink-0 space-y-2`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
          >
            <div className="flex items-center gap-3">
              <span className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradienteDeLaForma}`}>
                <Eye className="h-5 w-5 text-white" />
                {palomita}
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
          {/* Va al frente sin caja propia, como «El foco cambia» (Carlos, 24 nov
              2026): el encabezado queda alineado con los íconos de arriba y lo
              demás (la pregunta, las respuestas, el eco y la entrada) mide lo
              mismo que la escena cerrada de arriba (index.css). */}
          <motion.section
            data-escena-al-frente=""
            className={`${escena} ${alFrente} shrink-0 space-y-3`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.22 }}
          >
            <div className="flex items-center gap-3">
              <span
                className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                  expectativa
                    ? `bg-gradient-to-br ${gradienteDeLaForma}`
                    : 'animate-pulse border border-sky-300/50 bg-sky-500/10 shadow-[0_0_18px_rgba(56,189,248,0.35)]'
                }`}
              >
                <Flame className="h-5 w-5 text-white" />
                {expectativa ? palomita : null}
              </span>
              <div className="min-w-0 space-y-0.5">
                <p className="text-[0.56rem] uppercase tracking-[0.18em] text-slate-400/70">{dramaturgia.phase2Eyebrow}</p>
                <p className="font-display text-base leading-tight text-white">{dramaturgia.phase2Title}</p>
              </div>
            </div>

            <AnimatePresence mode="wait" initial={false}>
            {!expectativa && calibracion ? (
              <motion.div
                key="pregunta"
                className="space-y-3"
                exit={{ opacity: 0, y: -6, transition: { duration: 0.25 } }}
              >
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
              </motion.div>
            ) : null}

            {expectativa ? (
              <motion.div
                key="entrada"
                className="space-y-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
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
                    {sinArtefacto ? `${dramaturgia.form} aún no abre su escena` : `${dramaturgia.form} ${escenaAbierta || sellada ? 'sigue en escena' : 'entra en escena'}`}
                  </p>
                  <p className="mt-1 max-w-[30ch] text-xs leading-relaxed text-slate-300/75">
                    {sinArtefacto
                      ? 'El artefacto de esta forma está en construcción. El recorrido sigue sin él.'
                      : sellada
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
                    data-sin-artefacto={sinArtefacto ? '' : undefined}
                    aria-label={sinArtefacto ? 'Seguir el recorrido' : escenaAbierta || sellada ? 'Volver a la escena' : 'Habitar la forma'}
                  >
                    <span
                      className="relative block h-20 w-20 overflow-hidden rounded-full bg-black ring-2 ring-white/25 motion-safe:animate-[latido_3.2s_ease-in-out_infinite]"
                      style={{ boxShadow: '0 0 60px rgba(0,0,0,0.55)' }}
                    >
                      <img
                        src={PORTAL_EMBLEM_URL[portal] ?? PORTAL_EMBLEM_URL.obra}
                        alt=""
                        className="absolute h-[104%] w-[104%] max-w-none object-cover"
                        style={{ left: '-2%', top: '-2%' }}
                      />
                      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_-16px_-18px_28px_rgba(0,0,0,0.42),inset_10px_9px_18px_rgba(255,255,255,0.14)]" />
                    </span>
                    <span className="text-sm font-semibold tracking-wide text-amber-200">
                      {sinArtefacto ? 'Seguir el recorrido' : escenaAbierta || sellada ? 'Volver a la escena' : 'Habitar la forma'}
                    </span>
                  </motion.button>
                </motion.div>
              </motion.div>
            ) : null}
            </AnimatePresence>
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
