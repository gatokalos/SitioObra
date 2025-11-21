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
    if (reflectionCount >= 4) {
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

      setReflectionCount((prev) => Math.min(prev + 1, 4));
      alert("Reflexión enviada.");
      closeModal();
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

    // actions
    sendReflection,
  };
}
