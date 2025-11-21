import { BookOpen, Brain, Feather, Theater } from "lucide-react";

const PLAN_ICONS = [
  { plan: "academic", label: "Académico", Icon: BookOpen },
  { plan: "psychological", label: "Psicológico", Icon: Brain },
  { plan: "narrative", label: "Narrativo", Icon: Feather },
  { plan: "theatrical", label: "Teatral", Icon: Theater },
];

export default function PlanIcons({
  iconsVisible = true,
  onSelect,
  disabled = false,
  isTouchDevice = false,
  readingMode = "dark",
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {PLAN_ICONS.map(({ plan, label, Icon }) => {
        const visibilityClass = isTouchDevice
          ? iconsVisible
            ? "opacity-100"
            : "opacity-50"
          : "opacity-0 group-hover:opacity-100";
        const textClass = readingMode === "premium" ? "text-[#3b2a1f]" : "text-white";
        const iconStroke = readingMode === "premium" ? "stroke-[#3b2a1f]" : "stroke-current";

        return (
          <button
            key={plan}
            type="button"
            onClick={() => !disabled && onSelect(plan)}
            disabled={disabled}
            className={`group flex flex-col items-center justify-center rounded-full border border-white/10 bg-white/5 py-3 text-[0.6rem] uppercase tracking-[0.4em] text-white transition-opacity duration-300 ${visibilityClass} ${
              disabled
                ? "cursor-not-allowed opacity-40"
                : `hover:border-purple-400 hover:text-white ${textClass}`
            }`}
            aria-label={`Abrir plano ${label}`}
          >
            <Icon size={18} className={iconStroke} />
            <span className={`mt-1 ${textClass}`}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
