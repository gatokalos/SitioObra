// Lo que viaja de la Memoria a La Réplica (el acto final): el texto de la
// persona, de dónde salió (para corregir o retirar lo guardado, D-38) y la
// palabra de la obra que eligió con el gato (D-45, diseño aprobado el 22 oct
// 2026). About.jsx lee la misma llave y el mismo evento.

import { guardarBorradorDeForma } from '@/lib/misReplicas';

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

// Las siete palabras están escritas para la pregunta de La Réplica, que habla
// de tú («¿Qué te provoca una emoción que no entiendes del todo?»). Cuando una
// pasa a la respuesta de la persona, que habla de yo, su verbo cambia con ella
// (Carlos, 15 nov 2026: «está mal escrito porque no se conjuga la emoción»).
// Solo una de las siete lleva verbo conjugado. El servidor hace lo mismo al
// escribir la respuesta tentativa; aquí se repite para lo que ya estaba
// guardado en este navegador.
const EN_PRIMERA_PERSONA = [
  ['una emoción que no entiendes del todo', 'una emoción que no entiendo del todo'],
];
export function palabraEnPrimeraPersona(texto) {
  if (typeof texto !== 'string') return texto;
  return EN_PRIMERA_PERSONA.reduce(
    (t, [deTu, deYo]) => t.replace(`lo que me provoca ${deTu}`, `lo que me provoca ${deYo}`),
    texto,
  );
}

// «otra»: ninguna de las siete se acerca (Carlos, 15 nov 2026: «lo más honesto
// es que agreguemos el chip de otra cuando ninguna se acerca»). No es una
// palabra de la obra: queda fuera de su vocabulario, y por eso no entra en
// PALABRAS_DE_LA_OBRA. Se guarda como categoría propia —no como hueco— para
// poder leer aparte esas réplicas, que contestan otra pregunta. Se distingue de
// «una emoción que no entiendes del todo», que sí es palabra de la obra: aquella
// dice «siento algo y no sé nombrarlo»; esta, «lo mío no está en esta lista».
// En pantalla y en el registro dice «otro», en masculino, porque el rótulo de
// la tarjeta habla de «nombres» (copy de Carlos, 15 nov 2026).
export const FUERA_DE_LA_LISTA = 'otro';
export const PREGUNTA_FUERA_DE_LA_LISTA = '¿Qué te provocó esta obra?';

// El borrador lleva su forma (19 nov 2026): con ella, el acto final sabe de
// qué forma salió cada réplica, y cada forma guarda su propio borrador para que
// el de una segunda no pise al de la primera (lib/misReplicas.js).
export function escribirBorradorDeReplica({ quote, huella, termino, borradorId = null, portal = null }) {
  const texto = typeof quote === 'string' ? palabraEnPrimeraPersona(quote).slice(0, PROVOCA_QUOTE_MAX_CHARS) : '';
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
      ...(portal ? { portal } : {}),
      updatedAt: new Date().toISOString(),
    }));
  } catch {}
  guardarBorradorDeForma(portal, { quote: texto, huella, termino, borradorId });
  try {
    window.dispatchEvent(new CustomEvent('gatoencerrado:provoca-draft', { detail: { quote: texto, huella, termino, borradorId, portal } }));
  } catch {}
}
