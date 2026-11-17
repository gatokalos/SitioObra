import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Flame, Sparkles, BookOpen } from 'lucide-react';
import { momentoDeLaForma, patchResonanceRecord, readResonanceRecord, ROTULO_DEL_MOMENTO } from '@/lib/bitacoraShared';

const stripEslabon = (text) => {
  if (!text) return text;
  const colonIdx = text.indexOf(': ');
  return colonIdx !== -1 ? text.slice(colonIdx + 2) : text;
};

const PORTAL_GRADIENT = {
  obra:        'from-purple-400 via-fuchsia-500 to-rose-500',
  literatura:  'from-emerald-400 via-teal-500 to-cyan-500',
  artesanias:  'from-amber-400 via-orange-500 to-rose-500',
  grafico:     'from-fuchsia-400 via-purple-500 to-indigo-500',
  cine:        'from-rose-500 via-red-500 to-fuchsia-500',
  sonoridades: 'from-sky-400 via-cyan-500 to-indigo-500',
  movimiento:  'from-sky-400 via-emerald-500 to-cyan-500',
  juegos:      'from-amber-400 via-yellow-500 to-orange-500',
  oraculo:     'from-indigo-400 via-violet-500 to-purple-500',
};

// Las insignias nombran lo que la persona ya hizo con los rótulos que ve en
// pantalla. Decían "Nivel 1/2/3 completado" y "Bitácora completada": los
// niveles dejaron de mostrarse (línea de D-42) y "bitácora" es palabra de
// tesis y de backend, no de pantalla (Carlos, 21 sep 2026).
const VitranaQuestionReveal = ({
  question,
  onAnswer,
  onReveal,
  buttonLabel = 'Improvisa una respuesta',
  label = '',
  autoReveal = false,
  portal = null,
  l2Done = false,
  l3Done = false,
  l3Step3 = null,
  l3FormaLabel = null,
  onL3CTA = null,
  bitacoraCompleted = false,
  showAction = true,
  enLaFicha = false,
}) => {
  const [isRevealed, setIsRevealed] = useState(autoReveal);
  const portalGradient = PORTAL_GRADIENT[portal] ?? 'from-purple-400 via-fuchsia-500 to-rose-500';
  const hasProgressBadges = autoReveal || l2Done || l3Done || bitacoraCompleted;
  const oracularPhrase = l3Done && l3Step3 ? stripEslabon(l3Step3) : null;

  // ── El toque que destapa lo que quedó (Carlos, 17 nov 2026) ──
  // El revelado destapaba la pregunta madre; desde que esa pregunta se contesta
  // al dorso de la tarjeta, la ficha abre con el recorrido hecho y la frase se
  // enseñaba sola. Carlos: «mantener la animación de los iconos como
  // actualmente aparecen pero dejar el revelado como el toque que revela el
  // CTA. Y la frase que necesita». Las insignias llegan solas; la frase y el
  // botón, con el toque. Solo la primera vez: queda anotado en el registro de
  // la forma y después el recuadro abre destapado.
  const conRecorrido = autoReveal || Boolean(oracularPhrase);
  const [destapado, setDestapado] = useState(
    () => !enLaFicha || !portal || Boolean(readResonanceRecord(portal).recuadro_destapado),
  );
  const velado = enLaFicha && conRecorrido && !destapado;
  // Quien destapó la pregunta en esta misma visita y luego la contestó no
  // vuelve a encontrar el velo.
  const tocoLaPregunta = useRef(false);
  useEffect(() => {
    if (!enLaFicha || !portal || destapado || !conRecorrido || !tocoLaPregunta.current) return;
    setDestapado(true);
    patchResonanceRecord(portal, { recuadro_destapado: Date.now() });
  }, [enLaFicha, portal, destapado, conRecorrido]);

  // El botón dice el momento de la forma, con la palabra de la línea.
  const momento = enLaFicha ? momentoDeLaForma(portal) : null;
  const rotulo = ROTULO_DEL_MOMENTO[momento] ? `${ROTULO_DEL_MOMENTO[momento]} →` : buttonLabel;

  // Sincroniza si autoReveal llega tarde (p.ej. tras verificar Supabase)
  useEffect(() => {
    if (autoReveal) setIsRevealed(true);
  }, [autoReveal]);

  const reveal = () => {
    if (velado) {
      setDestapado(true);
      patchResonanceRecord(portal, { recuadro_destapado: Date.now() });
      onReveal?.();
      return;
    }
    if (!isRevealed) {
      tocoLaPregunta.current = true;
      setIsRevealed(true);
      onReveal?.();
    }
  };
  // Hay algo que destapar: la pregunta todavía sin contestar, o lo que quedó.
  const porTocar = velado || !oracularPhrase;
  const aLaVista = !velado && (isRevealed || Boolean(oracularPhrase));

  return (
    <div className="flex flex-col gap-5">
      {label ? <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">{label}</p> : null}

      {/* Wrapper para los badges flotantes */}
      <div className={`relative ${hasProgressBadges ? 'pt-7' : ''}`}>
        {hasProgressBadges && (
          <div className="absolute right-2 top-0 z-10 flex items-center gap-1.5">
            {autoReveal && (
              <motion.div
                className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${portalGradient} shadow-[0_4px_18px_rgba(0,0,0,0.4)]`}
                initial={{ opacity: 0, scale: 0.55, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                title="Primera intuición, respondida"
              >
                <Eye size={20} className="text-white drop-shadow-sm" />
              </motion.div>
            )}
            {l2Done && (
              <motion.div
                className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${portalGradient} shadow-[0_4px_18px_rgba(0,0,0,0.4)]`}
                initial={{ opacity: 0, scale: 0.55, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.22 }}
                title="Afina tu mirada, hecho"
              >
                <Flame size={20} className="text-white drop-shadow-sm" />
              </motion.div>
            )}
            {l3Done && (
              <motion.div
                className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${portalGradient} shadow-[0_4px_18px_rgba(0,0,0,0.4)]`}
                initial={{ opacity: 0, scale: 0.55, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.34 }}
                title="En el foco, visto"
              >
                <Sparkles size={20} className="text-white drop-shadow-sm" />
              </motion.div>
            )}
            {bitacoraCompleted && (
              <motion.div
                className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${portalGradient} shadow-[0_4px_18px_rgba(0,0,0,0.4)]`}
                initial={{ opacity: 0, scale: 0.55, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.46 }}
                title="Memoria"
              >
                <BookOpen size={20} className="text-white drop-shadow-sm" />
              </motion.div>
            )}
          </div>
        )}

        <div
          className="form-surface relative overflow-hidden px-6 py-8 cursor-pointer"
          data-recuadro-de-la-duda={velado ? 'velado' : 'destapado'}
          /* Lo que quedó se destapa con un toque o un clic, no al pasar el
             cursor: la ficha se abre debajo del cursor que acaba de tocar la
             tarjeta y se destapaba sola. La pregunta sin contestar conserva
             su revelado al pasar. */
          onMouseEnter={porTocar && !velado ? reveal : undefined}
          onClick={porTocar ? reveal : undefined}
          role={porTocar ? 'button' : undefined}
          tabIndex={porTocar ? 0 : undefined}
          onKeyDown={porTocar ? (e) => { if (e.key === 'Enter' || e.key === ' ') reveal(); } : undefined}
          aria-label={velado ? 'Revelar lo que deja la duda' : !oracularPhrase ? 'Revelar pregunta de resonancia' : undefined}
        >
          {oracularPhrase ? (
            <motion.div
              initial={false}
              animate={{ filter: velado ? 'blur(10px)' : 'blur(0px)' }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            >
              <p className="mb-3 text-[0.62rem] uppercase tracking-[0.3em] text-slate-500/70 text-center select-none">Sedimento</p>
              <p className="text-slate-800 text-base leading-relaxed italic text-center font-light select-none">
                {oracularPhrase}
              </p>
            </motion.div>
          ) : (
            <motion.div
              animate={{ filter: isRevealed && !velado ? 'blur(0px)' : 'blur(10px)' }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            >
              {question ? (
                <p className="text-slate-800 text-base leading-relaxed italic text-center font-light select-none">
                  {question}
                </p>
              ) : (
                <p className="text-slate-400/60 text-sm text-center py-2 select-none">···</p>
              )}
            </motion.div>
          )}

          {(velado || (!isRevealed && !oracularPhrase)) && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="vitrana-sweep-beam" />
            </div>
          )}
        </div>
      </div>

      {showAction && (
        <motion.div
          className={`mx-auto w-full max-w-md ${aLaVista ? '' : 'pointer-events-none'}`}
          aria-hidden={aLaVista ? undefined : true}
          animate={aLaVista
            ? { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }
            : { opacity: 0, y: 10, scale: 0.93, filter: 'blur(4px)' }}
          transition={{ type: 'spring', stiffness: 300, damping: 18, delay: aLaVista ? (autoReveal && !enLaFicha ? 0.1 : 0.45) : 0 }}
        >
          <motion.button
            type="button"
            className="w-full rounded-full border border-purple-500/70 text-purple-100 hover:bg-purple-500/20 tracking-[0.25em] text-xs uppercase px-4 py-2.5"
            tabIndex={aLaVista ? undefined : -1}
            animate={aLaVista ? { boxShadow: [
              '0 0 0px rgba(139,92,246,0)',
              '0 0 32px rgba(139,92,246,0.55)',
              '0 15px 45px rgba(67,56,202,0.45)',
            ]} : { boxShadow: '0 0 0px rgba(139,92,246,0)' }}
            transition={{ duration: 1.1, delay: autoReveal ? 0.35 : 0.75, ease: 'easeOut' }}
            onClick={onAnswer}
          >
            {rotulo}
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};

export default VitranaQuestionReveal;
