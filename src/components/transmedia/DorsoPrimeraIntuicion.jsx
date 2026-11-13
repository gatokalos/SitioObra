import { useId, useState } from 'react';

// El dorso de la tarjeta recomendada en la galería (Carlos, 13 nov 2026).
// La pregunta madre se contesta aquí, antes de abrir la ficha: leer sobre la
// forma y su obra antes de contestar iba contra el protocolo (D-66, D-67: la
// pregunta se declara «sin nada delante a la hora de contestar»). De tres
// muestras, Carlos eligió la C: ya con el estilo del segundo acto, sin el pozo.
// Los campos son los mismos del primer paso del método (ResonanceModal.jsx):
// cómo firmas, tu intuición y el consentimiento. Aquí el consentimiento va en
// una línea con «Leer completo», para que quepa en la tarjeta.
const CONSENTIMIENTO_COMPLETO =
  'Tus respuestas forman parte de una investigación doctoral sobre cómo se interpretan y se recuerdan las experiencias narrativas. Se guardan sin tu nombre —salvo que decidas firmarlas— y puedes detenerte cuando quieras. Lo que escribes se procesa fuera de este sitio para poder devolvértelo. La investigación la realiza Carlos A. Pérez H. en el marco del doctorado en ICONOS.';

const DorsoPrimeraIntuicion = ({ question, formaTitle, gradiente = null, onEnviar, onVolver }) => {
  const [nombre, setNombre] = useState('');
  const [firmando, setFirmando] = useState(false);
  const [respuesta, setRespuesta] = useState('');
  const [acepta, setAcepta] = useState(false);
  const [leyendo, setLeyendo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  // La galería dibuja la tarjeta dos veces (carrusel y cuadrícula): los ids no
  // pueden ser fijos.
  const uid = useId();
  const idIntuicion = `${uid}-intuicion`;
  const idAcepto = `${uid}-acepto`;

  const puedeEnviar = Boolean(respuesta.trim()) && acepta && !enviando;

  const enviar = async (e) => {
    e.preventDefault();
    if (!puedeEnviar) return;
    setEnviando(true);
    try {
      await onEnviar?.({ nombre, respuesta: respuesta.trim() });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form
      onSubmit={enviar}
      className="flex h-full flex-col gap-4 overflow-y-auto rounded-2xl border border-white/10 p-6 text-left"
      // El dorso lleva el gradiente de su forma, el mismo del panel del frente
      // (el verdoso de El riesgo, por ejemplo), con un velo oscuro encima para
      // que el texto se lea igual en las nueve (Carlos, 13 nov 2026).
      style={{
        backgroundColor: '#0a0c18',
        backgroundImage: gradiente
          ? `linear-gradient(180deg, rgba(6,8,20,0.5), rgba(6,8,20,0.28)), ${gradiente}`
          : 'radial-gradient(120% 60% at 20% 0%, rgba(110,60,90,0.55), transparent 60%), linear-gradient(160deg, #0d1022 0%, #151a36 50%, #2a1b3c 100%)',
      }}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
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
        <p className="font-display text-[1.45rem] italic leading-tight question-voice">{question}</p>
      </div>

      <div aria-hidden="true" className="h-px shrink-0 bg-white/10" />

      <div className="space-y-1">
        <p className="text-xs font-medium text-slate-200">Cómo firmas</p>
        {firmando || nombre.trim() ? (
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            autoFocus={firmando}
            aria-label="Tu nombre o seudónimo"
            placeholder="Tu nombre o seudónimo"
            className="form-surface w-full px-3 py-2 text-base"
          />
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <span className="text-sm text-slate-300">Anónimo</span>
            <button
              type="button"
              onClick={() => setFirmando(true)}
              className="text-right text-[0.7rem] text-purple-200/85 underline underline-offset-4 transition hover:text-white"
            >
              Firmar con mi nombre o seudónimo
            </button>
          </div>
        )}
      </div>

      <div className="flex min-h-[9rem] flex-1 flex-col gap-1">
        <label htmlFor={idIntuicion} className="text-xs font-medium text-slate-200">
          Tu intuición
        </label>
        <textarea
          id={idIntuicion}
          data-dorso="intuicion"
          value={respuesta}
          onChange={(e) => setRespuesta(e.target.value)}
          required
          placeholder="No tienes que llenar todo este espacio. Pero puedes."
          className="form-surface w-full flex-1 resize-none px-3 py-2 text-base placeholder:text-slate-600/70"
        />
      </div>

      <div className="flex items-start gap-2 text-[0.7rem] leading-relaxed text-slate-300/90">
        <input
          id={idAcepto}
          data-dorso="acepto"
          type="checkbox"
          checked={acepta}
          onChange={(e) => setAcepta(e.target.checked)}
          className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-white/30 bg-transparent accent-purple-500"
        />
        <span>
          <label htmlFor={idAcepto}>Entiendo y acepto participar en una investigación doctoral.</label>{' '}
          <button
            type="button"
            onClick={() => setLeyendo((v) => !v)}
            aria-expanded={leyendo}
            className="underline underline-offset-4 transition hover:text-white"
          >
            {leyendo ? 'Ocultar' : 'Leer completo'}
          </button>
          {leyendo ? <span className="mt-1 block text-slate-400">{CONSENTIMIENTO_COMPLETO}</span> : null}
        </span>
      </div>

      <button
        type="submit"
        disabled={!puedeEnviar}
        className="w-full shrink-0 rounded-full border border-purple-500/70 px-4 py-2.5 text-xs uppercase tracking-[0.25em] text-purple-100 shadow-[0_15px_45px_rgba(67,56,202,0.45)] transition hover:bg-purple-500/20 disabled:opacity-50"
      >
        {enviando ? 'Enviando…' : 'Enviar'}
      </button>
    </form>
  );
};

export default DorsoPrimeraIntuicion;
