// Lo que viaja de la Memoria a La Réplica (el acto final): el texto de la
// persona, de dónde salió (para corregir o retirar lo guardado, D-38) y la
// palabra de la obra que eligió con el gato (D-45, diseño aprobado el 22 oct
// 2026). About.jsx lee la misma llave y el mismo evento.

export const PROVOCA_DRAFT_KEY = 'gatoencerrado:provoca-draft';
export const PROVOCA_QUOTE_MAX_CHARS = 700;

// Los siete términos de la pregunta rotativa de La Réplica: el vocabulario
// emocional de la obra (D-45, condición 2). Mismo orden que en About.jsx.
export const PALABRAS_DE_LA_OBRA = [
  'el drama',
  'la soledad',
  'la ira reprimida',
  'la desconexión',
  'la búsqueda de sentido',
  'una emoción que no entiendes del todo',
  'querer estar bien',
];

export function escribirBorradorDeReplica({ quote, huella, termino, borradorId = null }) {
  const texto = typeof quote === 'string' ? quote.slice(0, PROVOCA_QUOTE_MAX_CHARS) : '';
  if (!texto) return;
  try {
    const previousRaw = localStorage.getItem(PROVOCA_DRAFT_KEY);
    const previous = previousRaw ? JSON.parse(previousRaw) : {};
    localStorage.setItem(PROVOCA_DRAFT_KEY, JSON.stringify({
      ...previous,
      quote: texto,
      huella,
      ...(termino ? { termino } : {}),
      ...(borradorId ? { borradorId } : {}),
      updatedAt: new Date().toISOString(),
    }));
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent('gatoencerrado:provoca-draft', { detail: { quote: texto, huella, termino, borradorId } }));
  } catch {}
}
