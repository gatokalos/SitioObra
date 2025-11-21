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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-black/80 border border-white/10 rounded-xl max-w-lg w-full p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-slate-100 mb-2">
          {plan === "academic" && "Plano Académico"}
          {plan === "psychological" && "Plano Psicológico"}
          {plan === "narrative" && "Plano Narrativo"}
          {plan === "theatrical" && "Plano Teatral"}
        </h2>

        <p className="text-slate-300 text-sm mb-4">
          {segment?.questions?.[plan]}
        </p>

        <textarea
          className="w-full h-28 p-3 rounded-lg bg-black/50 border border-white/10 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
          placeholder="Escribe tu reflexión aquí…"
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
        />

        <div className="flex justify-between mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-300 hover:text-white"
          >
            Cancelar
          </button>

          <button
            onClick={onSubmit}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-slate-600"
          >
            {loading ? "Enviando…" : "Enviar reflexión"}
          </button>
        </div>
      </div>
    </div>
  );
}