import { useEffect, useState } from "react";
import { useAutoficcionPreview } from "@/hooks/useAutoficcionPreview";
import { useHideIconsOnScroll } from "@/hooks/useHideIconsOnScroll";
import ReflectionModal from "./ReflectionModal";
import PlanIcons from "./PlanIcons";

export default function AutoficcionPreview() {
  const {
    segments,
    loadSegments,
    openModal,
    activeSegment,
    activePlan,
    reflection,
    setReflection,
    isModalOpen,
    closeModal,
    sendReflection,
    loading,
    reflectionCount,
    triggerCoins,
    setTriggerCoins,
  } = useAutoficcionPreview();
  const iconsVisible = useHideIconsOnScroll();
  const limitReached = reflectionCount >= 6;
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [readingMode, setReadingMode] = useState("dark");

  const readingClasses = {
    dark: "bg-black/40 border-white/10 text-slate-100",
    premium:
      "bg-[#f7f2e8] border-[#c4bdae] text-[#3b2a1f] shadow-[0_20px_35px_rgba(0,0,0,0.15)]",
  };
  const segmentTextClass = {
    dark: "text-slate-100",
    premium: "text-[#3b2a1f]",
  };
  const fontFamilies = {
    dark: '"Literata", "Times New Roman", serif',
    premium: '"Cormorant Garamond", "Palatino Linotype", serif',
  };
  const continuousTextClass = readingMode === "dark" ? "text-slate-100" : "text-[#3b2a1f]";

  useEffect(() => {
    loadSegments();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const touch =
      "ontouchstart" in window ||
      (navigator.maxTouchPoints ?? 0) > 0 ||
      (navigator.msMaxTouchPoints ?? 0) > 0;
    setIsTouchDevice(touch);
  }, []);

  return (
    <div className="w-full min-h-screen px-4 py-8 text-slate-100">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="flex gap-3 items-center">
            {["dark", "premium"].map((modeKey) => (
              <button
                key={modeKey}
                onClick={() => setReadingMode(modeKey)}
                className={`w-8 h-8 rounded-full border transition ${
                  readingMode === modeKey
                    ? "border-white/90 bg-white/80 shadow-lg"
                    : "border-white/30 bg-black/20"
                }`}
                aria-label={`Modo ${modeKey}`}
              >
                <span className="hidden">{modeKey}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Nota: quitamos el banner superior para no bloquear el cierre; el límite sigue activo internamente */}

        <div className="space-y-6">
            {segments.map((segment) => (
              <div
                key={segment.id}
                className={`group mx-auto max-w-[650px] space-y-6 rounded-3xl border px-8 py-10 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.45)] transition-colors duration-500 ${readingClasses[readingMode]}`}
              >
                <p
                  className={`text-base leading-relaxed ${segmentTextClass[readingMode]}`}
                  style={{ fontFamily: fontFamilies[readingMode], lineHeight: 1.8 }}
                >
                  {segment.text}
                </p>
                <PlanIcons
                  onSelect={(plan) => openModal(segment, plan)}
                  iconsVisible={iconsVisible}
                  isTouchDevice={isTouchDevice}
                  disabled={limitReached}
                  readingMode={readingMode}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <ReflectionModal
        isOpen={isModalOpen}
        onClose={closeModal}
        segment={activeSegment}
        plan={activePlan}
        reflection={reflection}
        setReflection={setReflection}
        loading={loading}
        onSubmit={sendReflection}
        triggerCoins={triggerCoins}
        setTriggerCoins={setTriggerCoins}
      />
    </div>
  );
}
