import { useState, useEffect } from "react";

export function useAutoficcionPreview() {
  const [mode, setMode] = useState("segment");
  const [segments, setSegments] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSegment, setActiveSegment] = useState(null);
  const [activePlan, setActivePlan] = useState(null);
  const [reflection, setReflection] = useState("");
  const [loading, setLoading] = useState(false);
  const [reflectionCount, setReflectionCount] = useState(0);
  const REFLECTION_COST = 25;
  const REFLECTION_LIMIT = 6;
  const [triggerCoins, setTriggerCoins] = useState(false);

  // ---- LOAD SEGMENTS FROM PUBLIC JSON ----
  const loadSegments = async () => {
    try {
      const res = await fetch("/data/novela-preview.json");
      const json = await res.json();
      setSegments(json.segments || []);
    } catch (err) {
      console.error("Error cargando segmentos:", err);
    }
  };

  // ---- OPEN/CLOSE MODAL ----
  const openModal = (segment, plan) => {
    if (reflectionCount >= REFLECTION_LIMIT) {
      return;
    }
    setActiveSegment(segment);
    setActivePlan(plan);
    setReflection("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveSegment(null);
    setActivePlan(null);
    setReflection("");
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage?.getItem("gatoencerrado:novela-questions");
    if (stored && !Number.isNaN(Number.parseInt(stored, 10))) {
      setReflectionCount(Number.parseInt(stored, 10));
    }
  }, []);

  // ---- SEND REFLECTION TO SUPABASE ----
  const sendReflection = async () => {
    if (!reflection.trim()) return;

    setLoading(true);

    try {
      const { data, error } = await fetch(
        "/functions/v1/send-blog-reflection",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            segment_id: activeSegment.id,
            plan: activePlan,
            reflection,
            author: "Invitado",
          }),
        }
      );

      if (error) {
        console.error("Supabase error:", error);
      }

      const nextCount = (prev) => {
        const next = Math.min(prev + 1, REFLECTION_LIMIT);
        if (typeof window !== "undefined") {
          window.localStorage?.setItem("gatoencerrado:novela-questions", String(next));
          window.dispatchEvent(
            new CustomEvent("gatoencerrado:miniverse-spent", {
              detail: { id: "novela", spent: true, amount: REFLECTION_COST, count: next },
            })
          );
        }
        setTriggerCoins(true);
        return next;
      };
      setReflectionCount(nextCount);
      // Esperamos un momento para que se vea la animación antes de cerrar el modal.
      setTimeout(() => {
        closeModal();
      }, 900);
    } catch (err) {
      console.error("Error enviando reflexión:", err);
    }

    setLoading(false);
  };

  return {
    // UI state
    mode,
    setMode,

    // content
    segments,
    loadSegments,

    // modal
    isModalOpen,
    openModal,
    closeModal,
    activeSegment,
    activePlan,
    reflection,
    setReflection,
    loading,
    reflectionCount,
    triggerCoins,
    setTriggerCoins,

    // actions
    sendReflection,
  };
}
