import { CATALOG, readResonanceRecord } from '@/lib/bitacoraShared';
import { safeGetItem } from '@/lib/safeStorage';

/**
 * El GAToken es un pasaporte, no una moneda (Carlos, 22 sep 2026).
 *
 * Se emite al terminar el primer acto y se sella en cada forma cuyo artefacto
 * se completa. No se gana, no se gasta, no se acumula y no tiene precio: su
 * valor es simbólico y su única función es llevar un orden — que nadie abra el
 * artefacto de una forma sin haber terminado el anterior.
 *
 * La regla, completa:
 *   · Sin GAToken no se abre ningún artefacto. El token llega al terminar el
 *     primer acto, y queda disponible aunque la persona no lo use en la forma
 *     que le recomendaron, aunque se autentique después, y aunque entre al
 *     segundo acto por otra puerta.
 *   · El primer artefacto se abre sin sello: basta tener el token.
 *   · Del segundo en adelante hace falta el sello del anterior, y el sello
 *     sólo lo da TERMINARLO. Quien abre uno y lo deja a medias no abre otro:
 *     vuelve al que dejó. Es un pasaporte, no una llave maestra.
 *
 * Esto sustituye a la economía de la arquitectura inicial —saldos, precios por
 * miniverso, premios por revelar vitrinas, bloqueos por falta de fondos—, que
 * venía de querer gamificar el recorrido y ya no describe esta plataforma.
 */

// Lo escribe App.jsx al volver del primer acto.
const BIENVENIDA_COMPLETED_KEY = 'gatoencerrado:bienvenida-completed';

const PORTALES = CATALOG.map((forma) => forma.key);

/** ¿La persona trae el pasaporte? Lo da haber terminado el primer acto. */
export const tieneGAToken = () => {
  try {
    return safeGetItem(BIENVENIDA_COMPLETED_KEY) === '1';
  } catch {
    return false;
  }
};

/** Formas cuyo artefacto quedó TERMINADO. Son los sellos del pasaporte. */
export const sellos = () =>
  PORTALES.filter((portal) => !!readResonanceRecord(portal).experience_ts);

/**
 * Formas cuyo artefacto se ABRIÓ y no se terminó. Por la regla de orden sólo
 * puede haber una a la vez; se devuelve lista porque un registro viejo, hecho
 * cuando la regla no existía, puede traer varias.
 */
export const artefactosACuestas = () =>
  PORTALES.filter((portal) => {
    const registro = readResonanceRecord(portal);
    return !!registro.experience_opened_ts && !registro.experience_ts;
  });

/**
 * La puerta del artefacto. Devuelve por qué no se puede, para que cada pantalla
 * diga lo suyo en vez de un "no" a secas.
 *
 * @returns {{ puede: boolean, motivo: 'ok'|'sin-token'|'hay-uno-a-medias', pendiente: string|null }}
 */
export const puedeAbrirArtefacto = (portal) => {
  if (!tieneGAToken()) {
    return { puede: false, motivo: 'sin-token', pendiente: null };
  }
  const registro = readResonanceRecord(portal);
  // Ya lo terminó: puede volver a entrar cuando quiera.
  if (registro.experience_ts) return { puede: true, motivo: 'ok', pendiente: null };
  // Ya lo tenía abierto: seguir donde quedó es justamente lo que la regla pide.
  if (registro.experience_opened_ts) return { puede: true, motivo: 'ok', pendiente: null };

  const aMedias = artefactosACuestas();
  if (aMedias.length > 0) {
    return { puede: false, motivo: 'hay-uno-a-medias', pendiente: aMedias[0] };
  }
  return { puede: true, motivo: 'ok', pendiente: null };
};

/**
 * Sella la entrada al puerto. Se llama en el momento en que el artefacto se
 * abre, no cuando se termina — el cierre lo marca `experience_ts`, que ya
 * existía. No sobreescribe: la primera vez es la que cuenta.
 */
export const marcarArtefactoAbierto = (portal) => {
  try {
    const key = `gatoencerrado:resonance:${portal}`;
    const registro = readResonanceRecord(portal);
    if (registro.experience_opened_ts) return;
    localStorage.setItem(
      key,
      JSON.stringify({ ...registro, experience_opened_ts: Date.now() })
    );
  } catch {}
};
