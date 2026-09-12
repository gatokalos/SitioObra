import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { ensureAnonId } from '@/lib/identity';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { CATALOG, clearGlobalConsent } from '@/lib/bitacoraShared';

// La huella (D-34, 11 sep 2026): después de responder En escena, la persona
// ve su propio recorrido — qué escribió antes de entrar a cada forma, qué
// gesto dejó, y lo que acaba de responder. Plantilla, no generación: nadie
// escribe prosa sobre la experiencia de nadie; se insertan sus palabras.
//
// Habla el apuntador: tercera persona, documental. Muestra, no interpreta.
// Cierra con pregunta, nunca con veredicto (§2.4 del handoff del 8 sep).
//
// Dondequiera que se vea la huella la acompañan dos acciones (D-38):
// corregir y retirar. En pantalla se llaman así, en registro llano —
// "derecho de réplica" es vocabulario de tesis y no entra a interfaz.

const OBRA_API_URL = (import.meta.env.VITE_OBRA_API_URL ?? 'https://api.gatoencerrado.ai').replace(/\/+$/, '');

const EDITABLE = [
  { key: 'intuicion_answer',     label: 'Antes de entrar escribiste' },
  { key: 'bitacora_p1_response', label: 'Días después dijiste' },
  { key: 'bitacora_p2_response', label: 'Dónde te encontró' },
  { key: 'bitacora_p3_response', label: 'Lo que ves distinto' },
];

const formName = (key) => {
  const entry = CATALOG.find((c) => c.key === key);
  return entry?.form ?? entry?.name ?? key;
};

const formColor = (key) => CATALOG.find((c) => c.key === key)?.color ?? 'text-slate-200';

// Al retirar la huella, este navegador tampoco debe seguir mostrando un
// recorrido que ya no existe en ningún corpus.
const clearLocalResonance = () => {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k && k.startsWith('gatoencerrado:resonance:')) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {}
  clearGlobalConsent();
};

const Quote = ({ children }) => (
  <p className="font-display text-base leading-snug text-white/90 sm:text-lg">
    «{children}»
  </p>
);

function SesionCard({ sesion, onSave, saving }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});

  const startEdit = () => {
    setDraft(Object.fromEntries(EDITABLE.map(({ key }) => [key, sesion[key] ?? ''])));
    setEditing(true);
  };

  const save = async () => {
    const patch = {};
    EDITABLE.forEach(({ key }) => {
      const next = (draft[key] ?? '').trim();
      const prev = (sesion[key] ?? '').trim();
      if (next !== prev) patch[key] = next || null;
    });
    if (Object.keys(patch).length > 0) await onSave(sesion.id, patch);
    setEditing(false);
  };

  const respondio = Boolean(sesion.bitacora_completed_at);
  const dijoNo = respondio && sesion.bitacora_p1_afirmativa === false;
  const visibleFields = EDITABLE.filter(({ key }) => {
    if (key === 'intuicion_answer') return true;
    return respondio && !dijoNo;
  });

  return (
    <section className="rounded-2xl border border-white/10 bg-black/35 px-4 py-4 sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <p className={`text-[0.62rem] uppercase tracking-[0.32em] ${formColor(sesion.miniverso_id)}`}>
          {formName(sesion.miniverso_id)}
        </p>
        {!editing ? (
          <button
            type="button"
            onClick={startEdit}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-slate-300 transition hover:border-white/30 hover:text-white"
          >
            <Pencil size={11} aria-hidden /> Corregir
          </button>
        ) : null}
      </div>

      <div className="mt-3 space-y-3">
        {visibleFields.map(({ key, label }) => {
          const value = sesion[key];
          if (!editing && !value) return null;
          return (
            <div key={key}>
              <p className="text-[0.65rem] uppercase tracking-[0.22em] text-slate-400/80">{label}</p>
              {editing ? (
                <textarea
                  value={draft[key] ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                  rows={2}
                  className="form-surface mt-1 w-full resize-none px-3 py-2 text-sm"
                />
              ) : (
                <Quote>{value}</Quote>
              )}
            </div>
          );
        })}

        {!editing && sesion.expectativa_chip ? (
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.22em] text-slate-400/80">Elegiste</p>
            <Quote>{sesion.expectativa_chip}</Quote>
          </div>
        ) : null}

        {!editing && dijoNo ? (
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.22em] text-slate-400/80">Días después</p>
            <p className="text-sm text-slate-300/85">Dijiste que nada había vuelto. Eso también quedó.</p>
          </div>
        ) : null}

        {!editing && !respondio ? (
          <p className="text-xs text-slate-500">Todavía no has vuelto a esta forma días después.</p>
        ) : null}
      </div>

      {editing ? (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-full border border-purple-400/70 bg-purple-600/25 px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.18em] text-white transition hover:bg-purple-500/40 disabled:opacity-40"
          >
            <Check size={11} aria-hidden /> Guardar
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.18em] text-slate-300 transition hover:text-white"
          >
            <X size={11} aria-hidden /> Dejar como estaba
          </button>
        </div>
      ) : null}
    </section>
  );
}

const HuellaView = ({ onContinue, onNavigateToRecommendation, recommendedFormatId, onGoToSite, onRetired }) => {
  const { user, isDevAuth } = useAuth();
  const [sesiones, setSesiones] = useState(null);
  const [compartir, setCompartir] = useState(false);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmRetiro, setConfirmRetiro] = useState(false);
  const [retirando, setRetirando] = useState(false);

  const anonId = useMemo(() => ensureAnonId(), []);
  const userId = user?.id ?? null;

  useEffect(() => {
    if (isDevAuth) {
      // Vista previa: sin servidor no hay huella que mostrar.
      setSesiones([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${OBRA_API_URL}/api/huella?anon_id=${encodeURIComponent(anonId)}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data.ok) throw new Error();
        setSesiones(data.sesiones);
        setCompartir(Boolean(data.compartir_autorizado));
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => { cancelled = true; };
  }, [anonId, isDevAuth]);

  const handleSave = useCallback(async (id, patch) => {
    setSaving(true);
    try {
      const res = await fetch(`${OBRA_API_URL}/api/huella/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anon_id: anonId, user_id: userId, ...patch }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setSesiones((prev) => (prev ?? []).map((s) => (s.id === id ? data.sesion : s)));
      }
    } catch {}
    setSaving(false);
  }, [anonId, userId]);

  const handleCompartir = useCallback(async (next) => {
    setCompartir(next);
    try {
      await fetch(`${OBRA_API_URL}/api/huella/compartir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anon_id: anonId, user_id: userId, autorizado: next }),
      });
    } catch {
      setCompartir(!next);
    }
  }, [anonId, userId]);

  const handleRetirar = useCallback(async () => {
    setRetirando(true);
    try {
      const res = await fetch(`${OBRA_API_URL}/api/huella`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anon_id: anonId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error();
      clearLocalResonance();
      onRetired?.();
    } catch {
      setRetirando(false);
      setConfirmRetiro(false);
      setError(true);
    }
  }, [anonId, onRetired]);

  const conHuella = (sesiones ?? []).filter((s) => s.intuicion_answer || s.bitacora_completed_at);

  return (
    <motion.div
      key="huella"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full overflow-y-auto"
    >
      <div aria-hidden="true" className="h-16 sm:h-24 lg:hidden" />

      <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-10 lg:pb-10 lg:pt-14">
        <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.62rem] uppercase tracking-[0.32em] text-white/70 backdrop-blur-md">
          Memoria
        </div>
        <h3 className="mt-3 font-display text-2xl leading-tight tracking-tight text-white sm:text-3xl">
          Esto es lo que dejaste.
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-300/80">
          Lo que escribiste antes de entrar y lo que respondiste días después, tal como lo dijiste.
          Es tuyo: puedes corregirlo o retirarlo cuando quieras.
        </p>

        {error ? (
          <p className="mt-6 text-sm text-rose-200/80">No se pudo recuperar tu huella ahora. Vuelve a intentarlo más tarde.</p>
        ) : null}

        {sesiones === null && !error ? (
          <p className="mt-6 text-sm text-slate-400/80">…</p>
        ) : null}

        {sesiones !== null && conHuella.length === 0 && !error ? (
          <p className="mt-6 text-sm text-slate-400/80">Todavía no hay nada guardado bajo este recorrido.</p>
        ) : null}

        <div className="mt-6 space-y-4">
          {conHuella.map((sesion) => (
            <SesionCard key={sesion.id} sesion={sesion} onSave={handleSave} saving={saving} />
          ))}
        </div>

        {sesiones !== null && conHuella.length > 0 ? (
          <div className="mt-6 space-y-4">
            {/* D-37 §3.2 — consentimiento de compartir: opcional, separado, revocable.
                No se prometen mecanismos; se promete anonimato. */}
            <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/35 px-4 py-3.5 text-sm leading-relaxed text-slate-200/90">
              <input
                type="checkbox"
                checked={compartir}
                onChange={(e) => void handleCompartir(e.target.checked)}
                className="mt-1 h-3.5 w-3.5 shrink-0 rounded border-white/30 bg-transparent accent-purple-500"
              />
              <span>
                Otras personas podrán encontrar lo que escribiste, sin tu nombre.
                <span className="block text-xs text-slate-400/80">Puedes cambiarlo cuando quieras. Retirar tu huella también retira esto.</span>
              </span>
            </label>

            {!confirmRetiro ? (
              <button
                type="button"
                onClick={() => setConfirmRetiro(true)}
                className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400 transition hover:text-rose-200"
              >
                <Trash2 size={12} aria-hidden /> Retirar mi huella
              </button>
            ) : (
              <div className="rounded-2xl border border-rose-300/25 bg-rose-950/20 px-4 py-4">
                <p className="text-sm leading-relaxed text-rose-100/90">
                  Se borra todo lo que escribiste en las nueve formas y lo que respondiste después. Sale de la investigación y de cualquier lugar donde otros pudieran encontrarlo. No se puede deshacer.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleRetirar()}
                    disabled={retirando}
                    className="rounded-full border border-rose-300/60 bg-rose-600/25 px-4 py-2 text-[0.65rem] uppercase tracking-[0.2em] text-white transition hover:bg-rose-500/40 disabled:opacity-40"
                  >
                    {retirando ? 'Retirando…' : 'Sí, retirar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRetiro(false)}
                    disabled={retirando}
                    className="rounded-full border border-white/15 px-4 py-2 text-[0.65rem] uppercase tracking-[0.2em] text-slate-300 transition hover:text-white disabled:opacity-40"
                  >
                    Conservarla
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Invitación final — pregunta, nunca veredicto (§2.4). Orden: acto final,
            intermedio, otra forma, resto del sitio. La aportación vía Stripe iría
            última y no condiciona nada; no hay hoy una página propia para ella. */}
        <div className="mt-8 border-t border-white/10 pt-6">
          <p className="font-display text-lg leading-snug text-white/90">¿Hacia dónde sigues?</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onGoToSite?.('#about')}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-slate-100 transition hover:bg-white/10"
            >
              Acto final
            </button>
            <button
              type="button"
              onClick={() => onGoToSite?.('#blog-contribuye')}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-slate-100 transition hover:bg-white/10"
            >
              Intermedio
            </button>
            {recommendedFormatId ? (
              <button
                type="button"
                onClick={() => onNavigateToRecommendation?.(recommendedFormatId)}
                className="rounded-full border border-purple-400/60 bg-purple-600/25 px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-purple-500/40"
              >
                Otra forma
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onGoToSite?.(null)}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-slate-100 transition hover:bg-white/10"
            >
              El resto del sitio
            </button>
          </div>
          <button
            type="button"
            onClick={onContinue}
            className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-400 transition hover:text-white"
          >
            Ver la Memoria holográfica →
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default HuellaView;
