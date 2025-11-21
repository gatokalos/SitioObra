import { useEffect } from "react";

export default function ReflectionModal({
  isOpen,
  onClose,
  segment,
  plan,
  reflection,
  setReflection,
  onSubmit,
  loading,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const planLabels = {
    academic: "Plano Académico",
    psychological: "Plano Psicológico",
    narrative: "Plano Narrativo",
    theatrical: "Plano Teatral",
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-3xl px-4">
      <div className="w-full max-w-xl rounded-3xl border border-purple-400/40 bg-black/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.75)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-purple-300/80">Plano</p>
            <h2 className="text-2xl font-semibold text-white">
              {planLabels[plan] ?? "Plano"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-sm text-slate-300 hover:text-white"
          >
            Cerrar ✕
          </button>
        </div>

        <p className="text-sm text-slate-300/80 mb-6 leading-relaxed">
          {segment?.questions?.[plan]}
        </p>

        <textarea
          className="w-full min-h-[160px] rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-slate-100 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition"
          placeholder="Escribe tu reflexión aquí…"
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
        />

        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="text-sm uppercase tracking-[0.4em] text-slate-400 hover:text-white"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="rounded-full bg-gradient-to-r from-purple-600/90 to-indigo-600/80 px-6 py-3 text-sm font-semibold text-white transition hover:from-purple-500/90 hover:to-indigo-500/90 disabled:opacity-60"
          >
            {loading ? "Enviando…" : "Enviar reflexión"}
          </button>
        </div>
      </div>
    </div>
  );
}
