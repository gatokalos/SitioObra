import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Flame, Sparkles, Check, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import FarewellVideoPanel from '@/components/portal/FarewellVideoPanel';
import {
  RESONANCE_DRAMATURGY_BY_PORTAL,
  RESONANCE_SHARED_DRAMATURGY,
} from '@/lib/resonanceDramaturgy';

// Mesa editorial aislada del producto real. No lee ni escribe Supabase,
// localStorage, consentimientos, GAT o progreso de ResonanceModal. Los cambios
// viven solo mientras esta pestaña permanezca abierta.
// Ruta: ?Lab=ResonanceAccordion&portal=artesanias&level=2

const PORTAL_OPTIONS = [
  {
    id: 'obra', label: 'Dramaturgia', form: 'El drama',
    phase2Eyebrow: 'Preparación de escena', phase2Title: 'Ubica desde dónde miras',
    phase2Description: 'Antes de entrar en escena, ubica hacia quién diriges lo que estás por decir. Esa referencia nos ayudará a comprender desde dónde miras lo que viene.',
    phase2Question: '¿Qué esperas encontrar cuando alguien se expone frente a otros?',
    phase1Answer: 'Para ti, exponerse frente a otros empieza por la verdad.',
    phase2Answer: 'Antes de entrar en escena, tu mirada busca verdad.',
  },
  {
    id: 'literatura', label: 'Literatura', form: 'La escritura',
    phase2Eyebrow: 'Preparación de escena', phase2Title: 'Reconoce lo que buscas',
    phase2Description: 'Antes de abrir la historia, reconoce qué esperas encontrar en ella. Esa expectativa será el punto desde el que comenzarás a leer.',
    phase2Question: '¿Qué esperas encontrar cuando una historia se abre contigo?',
    phase1Answer: 'Una historia deja de ser ajena cuando te devuelve una herida conocida.',
    phase2Answer: 'Abres la historia esperando encontrar una herida conocida.',
  },
  {
    id: 'artesanias', label: 'Artesanías', form: 'El objeto',
    phase2Eyebrow: 'Preparación de escena', phase2Title: 'Reconoce lo que conservas',
    phase2Description: 'Antes de acercarte a lo que alguien conserva, reconoce qué objetos siguen teniendo un lugar en ti aunque su utilidad haya terminado.',
    phase2Question: '¿Qué cosas te cuesta dejar ir aunque ya no tengan utilidad?',
    phase1Answer: 'Un objeto deja de ser para ti solo un objeto cuando alguien más lo recuerda contigo.',
    phase2Answer: 'Los recuerdos pequeños son lo que más te cuesta dejar ir, aunque ya no tengan utilidad.',
  },
  {
    id: 'grafico', label: 'Gráficos', form: 'La imagen',
    phase2Eyebrow: 'Preparación de escena', phase2Title: 'Afina tu mirada',
    phase2Description: 'Antes de mirar de frente, reconoce qué clase de imagen suele quedarse observándote cuando todo lo demás se retira.',
    phase2Question: '¿Qué imágenes sientes que te observan cuando vuelves a estar a solas?',
    phase1Answer: 'Una imagen deja de ser superficie cuando en ella reconoces una mirada.',
    phase2Answer: 'Cuando vuelves a estar a solas, lo que permanece ante tu mirada es una mirada.',
  },
  {
    id: 'cine', label: 'Cine', form: 'La proyección',
    phase2Eyebrow: 'Preparación de escena', phase2Title: 'Sostén la mirada',
    phase2Description: 'Antes de que comience la escena, reconoce qué momentos suelen hacerte apartar la mirada. Esa será tu posición frente a lo que viene.',
    phase2Question: '¿Qué tipo de momentos te cuesta mirar de frente en una historia?',
    phase1Answer: 'Mirar una historia de frente también significa encontrarte con la vulnerabilidad.',
    phase2Answer: 'En una historia, apartas la mirada cuando aparece la vulnerabilidad.',
  },
  {
    id: 'sonoridades', label: 'Sonoridades', form: 'La vibración',
    phase2Eyebrow: 'Preparación de escena', phase2Title: 'Afina el oído',
    phase2Description: 'Antes de escuchar, reconoce qué sonidos regresan cuando el ruido se apaga. Esa memoria afinará tu manera de entrar.',
    phase2Question: '¿Qué sonidos sientes que regresan cuando estás solo?',
    phase1Answer: 'Un sonido permanece cuando vuelve a ti como una voz conocida.',
    phase2Answer: 'Cuando el ruido se apaga, vuelve contigo una voz conocida.',
  },
  {
    id: 'movimiento', label: 'Movimiento', form: 'El cuerpo',
    phase2Eyebrow: 'Preparación de escena', phase2Title: 'Escucha tu cuerpo',
    phase2Description: 'Antes de moverte, observa qué hace tu cuerpo cuando todavía no encuentras palabras. Esa reacción también es una forma de mirar.',
    phase2Question: '¿Qué hace tu cuerpo cuando aún no entiendes lo que sientes?',
    phase1Answer: 'Tu cuerpo empieza a responder antes que las palabras cuando cambia la respiración.',
    phase2Answer: 'Cuando aún no entiendes lo que sientes, tu respiración cambia.',
  },
  {
    id: 'juegos', label: 'Juegos', form: 'El riesgo',
    phase2Eyebrow: 'Preparación de escena', phase2Title: 'Reconoce tu impulso',
    phase2Description: 'Antes de elegir, reconoce cuál suele ser tu primer impulso. Esa decisión inicial será la coordenada de tu recorrido.',
    phase2Question: 'Cuando una experiencia te obliga a elegir, ¿qué sueles hacer primero?',
    phase1Answer: 'Una decisión cambia la historia cuando tu primer impulso es seguir tu intuición.',
    phase2Answer: 'Cuando una experiencia te obliga a elegir, primero decides seguir tu intuición.',
  },
  {
    id: 'oraculo', label: 'Oráculo', form: 'La pregunta',
    phase2Eyebrow: 'Preparación de escena', phase2Title: 'Sostén la pregunta',
    phase2Description: 'Antes de formular otra pregunta, reconoce qué haces con aquellas que se quedan contigo. Esa disposición orientará la consulta.',
    phase2Question: '¿Qué haces cuando una pregunta sigue contigo más tiempo del esperado?',
    phase1Answer: 'Una pregunta permanece contigo cuando decides darle vueltas en silencio.',
    phase2Answer: 'Cuando una pregunta permanece contigo, eliges darle vueltas en silencio.',
  },
].map((portal) => ({
  ...portal,
  ...RESONANCE_DRAMATURGY_BY_PORTAL[portal.id],
  ...RESONANCE_SHARED_DRAMATURGY,
}));

const PORTAL_BY_ID = Object.fromEntries(PORTAL_OPTIONS.map((portal) => [portal.id, portal]));

const readInitialPortal = () => {
  if (typeof window === 'undefined') return 'artesanias';
  const requested = new URLSearchParams(window.location.search).get('portal');
  return PORTAL_BY_ID[requested] ? requested : 'artesanias';
};

const readInitialLevel = () => {
  if (typeof window === 'undefined') return 3;
  const requested = Number(new URLSearchParams(window.location.search).get('level'));
  return [1, 2, 3].includes(requested) ? requested : 3;
};

const syncLabUrl = ({ portal, level }) => {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.set('portal', portal);
  url.searchParams.set('level', String(level));
  window.history.replaceState({}, '', url);
};

const createInitialDrafts = () => Object.fromEntries(PORTAL_OPTIONS.map((portal) => [portal.id, { ...portal }]));

const ArtifactBadge = ({ label, coda }) => (
  <div className="mt-4 text-center">
    <p className="font-display text-base uppercase tracking-[0.12em] text-white">{label} entra en escena</p>
    <p className="mt-1 text-xs leading-relaxed text-slate-300/75">{coda}</p>
    <div className="mx-auto mt-3 h-14 w-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 shadow-[0_0_24px_rgba(217,158,44,0.45)]" />
  </div>
);

const L3Extras = ({ copy }) => (
  <div className="mt-4 space-y-3">
    <div className="rounded-2xl border border-purple-300/15 bg-purple-950/10 px-4 py-4">
      <p className="font-display text-base text-white">{copy.returnLead}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-300/80">{copy.returnBody}</p>
      <button type="button" className="mt-3 w-full rounded-full border border-purple-200/25 bg-purple-400/10 px-3 py-2.5 text-xs font-semibold text-purple-100 transition hover:bg-purple-400/20">
        {copy.returnCta}
      </button>
    </div>
    <button type="button" className="flex w-full items-center gap-3 rounded-2xl border border-white/15 bg-black/35 px-3 py-2.5 text-left transition hover:bg-black/50">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-700 shadow-[0_8px_32px_rgba(0,0,0,0.55)]" />
      <span className="text-xs font-semibold tracking-[0.05em] text-amber-300/90">{copy.souvenirCta}</span>
    </button>
    <div className="px-2 pb-1 pt-5 text-center">
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/20" />
        <span className="h-1 w-1 rotate-45 bg-purple-200/50" />
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/20" />
      </div>
      <p className="mt-4 text-[0.6rem] font-semibold uppercase tracking-[0.32em] text-purple-200/65">Fin del primer acto</p>
      <p className="mt-1 font-display text-xl tracking-[0.14em] text-white">Intermedio</p>
      <p className="mt-1.5 text-[0.68rem] leading-relaxed text-slate-400/75">{copy.closingLine}</p>
    </div>
  </div>
);

const EditorialField = ({ label, value, onChange, multiline = false, rows = 3 }) => (
  <label className="grid gap-1.5">
    <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</span>
    {multiline ? (
      <textarea value={value} rows={rows} onChange={(event) => onChange(event.target.value)} className="w-full resize-y rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm leading-relaxed text-slate-100 outline-none transition focus:border-purple-300/45 focus:bg-purple-300/[0.04]" />
    ) : (
      <input value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-purple-300/45 focus:bg-purple-300/[0.04]" />
    )}
  </label>
);

const ResonancePreview = ({ portal, copy, activeLevel, onLevelChange }) => {
  const levels = useMemo(() => [
    { num: 1, icon: Eye, eyebrow: 'Antes de entrar', title: 'Primera intuición', description: 'Respondiste antes de saber algo más. Eso tiene valor científico.', answer: copy.phase1Answer },
    { num: 2, icon: Flame, eyebrow: copy.phase2Eyebrow, title: copy.phase2Title, description: copy.phase2Description, question: copy.phase2Question, answer: copy.phase2Answer, form: copy.form },
    { num: 3, icon: Sparkles, eyebrow: copy.phase3Eyebrow, title: copy.phase3Title, description: copy.phase3Description },
  ], [copy]);

  const ordered = [...levels].sort((a, b) => {
    if (a.num === activeLevel) return -1;
    if (b.num === activeLevel) return 1;
    return a.num - b.num;
  });

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {ordered.map((level) => {
          const isActive = level.num === activeLevel;
          const isDone = level.num < 3;
          const Icon = level.icon;
          return (
            <motion.div
              key={`${portal.id}-${level.num}`}
              layout
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              role="button"
              tabIndex={0}
              onClick={() => onLevelChange(level.num)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') onLevelChange(level.num);
              }}
              className={`cursor-pointer rounded-2xl border px-4 py-4 transition-colors ${isActive ? 'border-purple-300/45 bg-black/65 shadow-[0_0_24px_rgba(168,85,247,0.12)]' : 'border-white/15 bg-black/45 hover:border-white/25'}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 via-fuchsia-500 to-rose-500">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.6rem] uppercase tracking-[0.2em] text-slate-500">{level.eyebrow}</p>
                  <p className="truncate font-display text-lg leading-tight text-white">{level.title}</p>
                </div>
              </div>
              <div className="min-w-0">
                <AnimatePresence initial={false}>
                  {isActive ? (
                    <motion.div key="expanded" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                      {level.num === 3 && (
                        <>
                          <p className="mb-2 mt-3 text-center text-[0.68rem] leading-relaxed tracking-[0.08em] text-slate-300/80">{copy.appearanceCue}</p>
                          <FarewellVideoPanel portal={portal.id} onSeen={() => {}} mediaAspectClassName="aspect-square" showUnavailablePlaceholder caption="El autor toma la palabra" unavailableLabel="El autor toma la palabra" />
                        </>
                      )}
                      <p className="mt-2 text-xs leading-relaxed text-slate-300/85">{level.description}</p>
                      {level.question && (
                        <div className="mt-3 rounded-xl border border-purple-200/15 bg-purple-300/[0.04] px-3 py-3">
                          <p className="text-[0.58rem] uppercase tracking-[0.18em] text-purple-200/50">La pregunta</p>
                          <p className="mt-1 font-display text-sm leading-snug text-purple-50/90">{level.question}</p>
                        </div>
                      )}
                      {level.answer && <p className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-slate-200/90">{level.answer}</p>}
                      {level.form && <ArtifactBadge label={level.form} coda={copy.entranceCoda} />}
                      {level.num === 3 && <L3Extras copy={copy} />}
                    </motion.div>
                  ) : isDone ? (
                    <motion.p key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1 flex items-center gap-1.5 text-xs italic text-emerald-300/80">
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
  );
};

const ResonanceAccordionLab = () => {
  const [selectedPortal, setSelectedPortal] = useState(readInitialPortal);
  const [activeLevel, setActiveLevel] = useState(readInitialLevel);
  const [drafts, setDrafts] = useState(createInitialDrafts);
  const [isMobileEditorOpen, setIsMobileEditorOpen] = useState(false);
  const activePortal = PORTAL_BY_ID[selectedPortal];
  const activeDraft = drafts[selectedPortal];

  const updateDraft = (field, value) => setDrafts((current) => ({ ...current, [selectedPortal]: { ...current[selectedPortal], [field]: value } }));
  const handlePortalChange = (portalId) => {
    setSelectedPortal(portalId);
    syncLabUrl({ portal: portalId, level: activeLevel });
  };
  const handleLevelChange = (level) => {
    setActiveLevel(level);
    syncLabUrl({ portal: selectedPortal, level });
  };
  const resetActiveDraft = () => setDrafts((current) => ({ ...current, [selectedPortal]: { ...PORTAL_BY_ID[selectedPortal] } }));

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_16%_8%,rgba(88,28,135,0.18),transparent_34%),radial-gradient(circle_at_88%_78%,rgba(190,24,93,0.10),transparent_32%),linear-gradient(135deg,#050308_0%,#0b0711_48%,#07040b_100%)] px-3 pb-28 pt-4 text-white sm:px-6 sm:pt-6 lg:h-screen lg:overflow-hidden lg:px-8 lg:py-8">
      <div className="mx-auto grid h-full max-w-7xl gap-6 lg:grid-cols-[minmax(360px,0.9fr)_minmax(420px,1.1fr)] lg:items-start">
        <section className="min-w-0 lg:sticky lg:top-0 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto lg:pr-2" aria-label="Preview de Resonancia Colectiva">
          <div className="mb-4 flex items-end justify-between gap-4 px-1">
            <div>
              <p className="text-[0.62rem] uppercase tracking-[0.28em] text-purple-200/45">Preview vivo</p>
              <h1 className="mt-1 font-display text-2xl text-white">Resonancia Colectiva</h1>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-200">{activePortal.label}</p>
              <p className="text-[0.65rem] text-slate-500">{activeDraft.form}</p>
            </div>
          </div>
          <ResonancePreview portal={activePortal} copy={activeDraft} activeLevel={activeLevel} onLevelChange={handleLevelChange} />
        </section>

        <aside
          className={`${isMobileEditorOpen ? 'fixed inset-0 z-50 block overflow-y-auto bg-[#08050b]' : 'hidden'} min-w-0 p-4 sm:p-5 lg:static lg:z-auto lg:block lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto lg:rounded-3xl lg:border lg:border-white/10 lg:bg-black/45 lg:shadow-[0_28px_90px_rgba(0,0,0,0.42)] lg:backdrop-blur-xl`}
          aria-label="Controles editoriales del laboratorio"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.62rem] uppercase tracking-[0.24em] text-purple-200/50">UI Lab · Copy</p>
              <h2 className="mt-1 font-display text-2xl leading-tight text-white">Mesa dramatúrgica</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">Misma estructura, una voz propia para cada miniverso.</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={resetActiveDraft} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[0.65rem] text-slate-300 transition hover:border-white/20 hover:bg-white/[0.08]">
                <RotateCcw size={12} /> Restablecer
              </button>
              <button
                type="button"
                onClick={() => setIsMobileEditorOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 lg:hidden"
                aria-label="Cerrar editor de copy"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-slate-500">Miniverso</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label="Seleccionar miniverso">
              {PORTAL_OPTIONS.map((portal) => {
                const isActive = portal.id === selectedPortal;
                return (
                  <button key={portal.id} type="button" onClick={() => handlePortalChange(portal.id)} className={`min-h-14 rounded-xl border px-3 py-2 text-left transition ${isActive ? 'border-amber-300/55 bg-amber-300/10 text-amber-50' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-purple-300/30 hover:bg-purple-300/[0.05]'}`}>
                    <span className="block text-xs font-semibold">{portal.label}</span>
                    <span className={`mt-0.5 block text-[0.58rem] ${isActive ? 'text-amber-200/65' : 'text-slate-600'}`}>{drafts[portal.id].form}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-slate-500">Estado del preview</p>
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Seleccionar fase">
              {[{ level: 1, label: 'Intuición' }, { level: 2, label: 'Preparación' }, { level: 3, label: 'Clímax' }].map((phase) => (
                <button key={phase.level} type="button" onClick={() => handleLevelChange(phase.level)} className={`rounded-xl border px-2 py-2.5 text-xs font-semibold transition ${activeLevel === phase.level ? 'border-purple-300/45 bg-purple-300/10 text-purple-100' : 'border-white/10 bg-white/[0.03] text-slate-500 hover:text-slate-300'}`}>
                  {phase.level} · {phase.label}
                </button>
              ))}
            </div>
          </div>

          <details open className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025]">
            <summary className="cursor-pointer px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Preparación · Fase 2</summary>
            <div className="grid gap-3 border-t border-white/[0.07] p-4">
              <EditorialField label="Eyebrow" value={activeDraft.phase2Eyebrow} onChange={(value) => updateDraft('phase2Eyebrow', value)} />
              <EditorialField label="Título" value={activeDraft.phase2Title} onChange={(value) => updateDraft('phase2Title', value)} />
              <EditorialField label="Descripción" value={activeDraft.phase2Description} onChange={(value) => updateDraft('phase2Description', value)} multiline rows={3} />
              <EditorialField label="Pregunta" value={activeDraft.phase2Question} onChange={(value) => updateDraft('phase2Question', value)} multiline rows={2} />
              <EditorialField label="Reconocimiento de la respuesta" value={activeDraft.phase2Answer} onChange={(value) => updateDraft('phase2Answer', value)} multiline rows={2} />
              <EditorialField label="Forma que entra en escena" value={activeDraft.form} onChange={(value) => updateDraft('form', value)} />
              <EditorialField label="Coda de entrada" value={activeDraft.entranceCoda} onChange={(value) => updateDraft('entranceCoda', value)} />
            </div>
          </details>

          <details className="mt-3 rounded-2xl border border-white/10 bg-white/[0.025]">
            <summary className="cursor-pointer px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Clímax e intermedio · Fase 3</summary>
            <div className="grid gap-3 border-t border-white/[0.07] p-4">
              <EditorialField label="Eyebrow" value={activeDraft.phase3Eyebrow} onChange={(value) => updateDraft('phase3Eyebrow', value)} />
              <EditorialField label="Título" value={activeDraft.phase3Title} onChange={(value) => updateDraft('phase3Title', value)} />
              <EditorialField label="Entrada del autor" value={activeDraft.appearanceCue} onChange={(value) => updateDraft('appearanceCue', value)} />
              <EditorialField label="Descripción académica" value={activeDraft.phase3Description} onChange={(value) => updateDraft('phase3Description', value)} multiline rows={3} />
              <EditorialField label="Promesa" value={activeDraft.returnLead} onChange={(value) => updateDraft('returnLead', value)} />
              <EditorialField label="Consentimiento narrativo" value={activeDraft.returnBody} onChange={(value) => updateDraft('returnBody', value)} multiline rows={3} />
              <EditorialField label="CTA del llamado" value={activeDraft.returnCta} onChange={(value) => updateDraft('returnCta', value)} />
              <EditorialField label="CTA del recuerdo" value={activeDraft.souvenirCta} onChange={(value) => updateDraft('souvenirCta', value)} />
              <EditorialField label="Línea de cierre" value={activeDraft.closingLine} onChange={(value) => updateDraft('closingLine', value)} />
            </div>
          </details>

          <div className="mt-4 rounded-xl border border-emerald-300/10 bg-emerald-300/[0.035] px-3 py-2.5 text-[0.65rem] leading-relaxed text-emerald-100/55">Aislado de producción · Los cambios no se guardan ni afectan respuestas reales.</div>
        </aside>
      </div>

      <nav
        className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 rounded-2xl border border-white/15 bg-black/85 p-2 shadow-[0_18px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl lg:hidden"
        aria-label="Consola móvil del laboratorio"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <label className="min-w-0">
            <span className="sr-only">Miniverso activo</span>
            <select
              value={selectedPortal}
              onChange={(event) => handlePortalChange(event.target.value)}
              className="h-10 w-full truncate rounded-xl border border-white/10 bg-white/[0.06] px-3 text-xs font-semibold text-slate-100 outline-none"
            >
              {PORTAL_OPTIONS.map((portal) => (
                <option key={portal.id} value={portal.id} className="bg-slate-950">
                  {portal.label} · {drafts[portal.id].form}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setIsMobileEditorOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-purple-300/30 bg-purple-300/10 px-3 text-xs font-semibold text-purple-100"
            aria-expanded={isMobileEditorOpen}
          >
            <SlidersHorizontal size={14} /> Copy
          </button>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1.5" role="group" aria-label="Fase visible">
          {[{ level: 1, label: 'Intuición' }, { level: 2, label: 'Preparación' }, { level: 3, label: 'Clímax' }].map((phase) => (
            <button
              key={phase.level}
              type="button"
              onClick={() => handleLevelChange(phase.level)}
              className={`rounded-lg px-2 py-2 text-[0.65rem] font-semibold transition ${activeLevel === phase.level ? 'bg-white/[0.12] text-white ring-1 ring-white/20' : 'text-slate-500'}`}
            >
              {phase.level} · {phase.label}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
};

export default ResonanceAccordionLab;
