import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Flame, PawPrint, Check } from 'lucide-react';
import FarewellVideoPanel from '@/components/portal/FarewellVideoPanel';

// Mockup vivo, con datos de ejemplo — NO cablea nada del estado real de
// ResonanceModal (Supabase, localStorage por portal, l3Rec, etc). Objetivo:
// que Carlos confirme la interacción (tarjeta activa se reordena arriba con
// transición, copy+respuesta+desbloqueo fusionados en una sola tarjeta, L3
// sin el gato de cabina) antes de tocar el componente real.
// Solo vive detrás de ?Lab=ResonanceAccordion (ver main.jsx).

const LEVELS = [
  {
    num: 1,
    icon: Eye,
    eyebrow: 'Antes de entrar',
    title: 'Primera intuición',
    description: 'Respondiste antes de saber algo más. Eso tiene valor científico.',
    answer: 'Un objeto deja de ser para ti solo un objeto cuando alguien más lo recuerda contigo.',
  },
  {
    num: 2,
    icon: Flame,
    eyebrow: 'Calibración',
    title: 'Afina tu mirada',
    description: 'Antes de acercarte a lo que alguien conserva, reconoce qué objetos siguen teniendo un lugar en ti aunque su utilidad haya terminado.',
    answer: 'Los recuerdos pequeños son lo que más te cuesta dejar ir, aunque ya no tengan utilidad.',
    artifactUnlocked: 'El objeto',
  },
  {
    num: 3,
    icon: PawPrint,
    eyebrow: 'Días después',
    title: 'En el foco',
    description: 'Este recorrido ha concluido. Las respuestas registradas permiten estudiar cómo las experiencias narrativas son interpretadas, recordadas y resignificadas por distintas personas.',
  },
];

const ArtifactBadge = ({ label }) => (
  <div className="mt-3 text-center">
    <p className="text-sm font-semibold uppercase tracking-[0.1em] text-white">
      Has desbloqueado el artefacto: {label}
    </p>
    <div className="mx-auto mt-3 h-14 w-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 shadow-[0_0_24px_rgba(217,158,44,0.45)]" />
  </div>
);

const L3Extras = () => {
  const [videoSeen, setVideoSeen] = useState(false);
  const [waSent, setWaSent] = useState(false);

  return (
    <div className="mt-3 space-y-2">
      {!videoSeen && (
        <FarewellVideoPanel portal="artesanias" onSeen={() => setVideoSeen(true)} />
      )}
      {!waSent ? (
        <button
          type="button"
          onClick={() => setWaSent(true)}
          className="w-full rounded-full border border-white/20 bg-black/35 px-3 py-2 text-xs text-slate-200 transition hover:bg-black/50"
        >
          Avísame por WhatsApp →
        </button>
      ) : (
        <p className="flex items-center gap-2 text-xs text-emerald-300/90">
          <Check size={12} /> Te avisamos cuando sea momento de volver.
        </p>
      )}
      <button
        type="button"
        className="flex w-full items-center gap-3 rounded-2xl border border-white/15 bg-black/35 px-3 py-2.5 text-left transition hover:bg-black/50"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-700 shadow-[0_8px_32px_rgba(0,0,0,0.55)]" />
        <span className="text-xs font-semibold tracking-[0.05em] text-amber-300/90">
          Agregar recordatorio
        </span>
      </button>
    </div>
  );
};

const ResonanceAccordionLab = () => {
  const [activeLevel, setActiveLevel] = useState(2);
  const [completed, setCompleted] = useState({ 1: true, 2: false, 3: false });

  const ordered = [...LEVELS].sort((a, b) => {
    if (a.num === activeLevel) return -1;
    if (b.num === activeLevel) return 1;
    return a.num - b.num;
  });

  const handleSelect = (num) => {
    setActiveLevel(num);
    setCompleted((prev) => (num > 1 ? { ...prev, [num - 1]: true } : prev));
  };

  return (
    <div className="min-h-screen bg-[#050308] px-4 py-10 text-white">
      <p className="mx-auto mb-6 max-w-md text-center text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">
        Lab · Acordeón unificado de Resonancia Colectiva
      </p>
      <div className="mx-auto flex max-w-md flex-col gap-2">
        <AnimatePresence initial={false}>
          {ordered.map((level) => {
            const isActive = level.num === activeLevel;
            const isDone = completed[level.num];
            const isLocked = level.num > 1 && !completed[level.num - 1] && !isActive;
            const Icon = level.icon;

            return (
              <motion.div
                key={level.num}
                layout
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                role={!isLocked ? 'button' : undefined}
                tabIndex={!isLocked ? 0 : undefined}
                onClick={() => !isLocked && handleSelect(level.num)}
                className={`rounded-2xl border px-4 py-4 transition-colors ${
                  isLocked ? 'cursor-default' : 'cursor-pointer'
                } ${
                  isActive
                    ? 'border-purple-300/45 bg-black/60 shadow-[0_0_20px_rgba(168,85,247,0.10)]'
                    : isLocked
                      ? 'border-white/[0.08] bg-black/35'
                      : 'border-white/20 bg-black/55'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                      isLocked
                        ? 'border border-white/10 bg-black/25'
                        : 'bg-gradient-to-br from-purple-400 via-fuchsia-500 to-rose-500'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isLocked ? 'text-white/25' : 'text-white'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.6rem] uppercase tracking-[0.2em] text-slate-500">
                      {level.eyebrow}
                    </p>
                    <p className="truncate font-display text-lg leading-tight text-white">
                      {level.title}
                    </p>
                  </div>
                </div>

                <div className="min-w-0">
                    <AnimatePresence initial={false}>
                      {isActive ? (
                        <motion.div
                          key="expanded"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <p className="mt-1.5 text-xs leading-relaxed text-slate-300/85">
                            {level.description}
                          </p>
                          {level.answer && (
                            <p className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-slate-200/90">
                              {level.answer}
                            </p>
                          )}
                          {level.artifactUnlocked && <ArtifactBadge label={level.artifactUnlocked} />}
                          {level.num === 3 && <L3Extras />}
                        </motion.div>
                      ) : !isLocked && isDone ? (
                        <motion.p
                          key="done"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-1 flex items-center gap-1.5 text-xs italic text-emerald-300/80"
                        >
                          <Check size={12} /> Completado
                        </motion.p>
                      ) : null}
                    </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ResonanceAccordionLab;
