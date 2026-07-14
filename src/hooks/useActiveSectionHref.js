import { useEffect, useState } from 'react';

// "¿Dónde estoy?" — recorre las secciones top-level del índice de arriba hacia
// abajo y devuelve el href de la última cuyo borde superior ya cruzó la línea
// de referencia (justo debajo del header fijo). Corre en segundo plano todo
// el tiempo, no solo con el índice abierto, para que al abrirlo el punto ya
// esté en el lugar correcto — sin parpadeo ni salto.
const ACTIVE_SECTION_REFERENCE_OFFSET = 140;

const useActiveSectionHref = (hrefs) => {
  const [activeHref, setActiveHref] = useState(null);
  const hrefsKey = hrefs.join('|');

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const sectionIds = hrefsKey
      .split('|')
      .filter((href) => href.startsWith('#') && !href.includes('?'))
      .map((href) => href.slice(1));

    if (sectionIds.length === 0) return undefined;

    let tickingId = null;

    const computeActive = () => {
      tickingId = null;
      let currentHref = null;
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= ACTIVE_SECTION_REFERENCE_OFFSET) {
          currentHref = `#${id}`;
        }
      }
      setActiveHref(currentHref ?? `#${sectionIds[0]}`);
    };

    const handleScroll = () => {
      if (tickingId === null) {
        tickingId = window.requestAnimationFrame(computeActive);
      }
    };

    computeActive();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      if (tickingId !== null) window.cancelAnimationFrame(tickingId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [hrefsKey]);

  return activeHref;
};

export default useActiveSectionHref;
