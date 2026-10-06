import { supabase } from '@/lib/supabaseClient';
import { ensureAnonId } from '@/lib/identity';
import { isInstalledPWA } from '@/lib/pwaDetection';
import { safeGetItem, safeSetItem } from '@/lib/safeStorage';
import { clearOrigenAcceso, readOrigenAcceso } from '@/lib/pendingContinuation';

// La misma clave que ORACULO_RECOMMENDED_SHOWCASE_KEY (transmediaConstants.jsx);
// se repite aquí para no cargar ese módulo en el arranque del sitio.
const VITRINA_RECOMENDADA_KEY = 'gatoencerrado:oraculo-recommended-showcase';
// Un botón cuenta como origen del acceso si la persona entra dentro de este plazo.
const VIGENCIA_DEL_ORIGEN_MS = 2 * 60 * 60 * 1000;

// Eventos del sitio que Primer Contacto necesita y nadie registraba (Carlos,
// 1 oct 2026): instalar la app y entrar con cuenta. Van a la misma tabla que
// los de la Bienvenida (miniverso_oraculo_interactions), con el identificador
// del navegador en el sitio, para que el panel siga a la misma persona desde la
// bienvenida hasta sus recorridos. Nunca detienen la página: si fallan, avisan
// en la consola y ya.

const enCurso = new Set();

/** Devuelve true si la base aceptó el registro. */
export async function registrarEventoSitio(tipo, { userId = null, metadata = {} } = {}) {
  const anonId = ensureAnonId();
  if (!anonId) return false;
  try {
    const { error } = await supabase.from('miniverso_oraculo_interactions').insert({
      interaction_type: tipo,
      anon_id: anonId,
      user_id: userId,
      reflection_id: null,
      metadata: { ...metadata, fuente: 'sitio' },
    });
    if (error) {
      console.warn(`[registro] ${tipo}:`, error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.warn(`[registro] ${tipo}:`, error);
    return false;
  }
}

/** Una sola vez por navegador para cada clave; se marca hecho solo si la base lo aceptó. */
function unaVez(clave, registrar) {
  if (safeGetItem(clave) === '1' || enCurso.has(clave)) return;
  enCurso.add(clave);
  registrar()
    .then((ok) => {
      if (ok) safeSetItem(clave, '1');
    })
    .finally(() => enCurso.delete(clave));
}

/**
 * Registra una vez por navegador que la app está instalada: cuando el navegador
 * avisa la instalación (Android, escritorio) o cuando el sitio se abre ya como
 * app, que es la única señal en iPhone. Devuelve la limpieza del aviso.
 */
export function vigilarAppInstalada() {
  if (typeof window === 'undefined') return () => {};
  const registrar = (como) =>
    unaVez('gx_app_instalada_registrada', () => registrarEventoSitio('app_instalada', { metadata: { como } }));
  if (isInstalledPWA()) registrar('abierta_como_app');
  const alInstalar = () => registrar('instalacion');
  window.addEventListener('appinstalled', alInstalar);
  return () => window.removeEventListener('appinstalled', alInstalar);
}

/**
 * Registra una vez por cuenta y navegador que alguien entró con cuenta, y si la
 * cuenta se acababa de crear. Liga el navegador (anon_id) con la cuenta
 * (user_id): el puente que faltaba (pendiente 4 del registro de decisiones).
 * Si la persona llegó desde un botón que deja nota —una vitrina bloqueada, el
 * de los GATokens, «siguiente acto»—, anota cuál, qué vitrina era la suya
 * recomendada y cuántos minutos pasaron (Carlos, 6 oct 2026).
 */
export function registrarCuenta(user) {
  if (!user?.id) return;
  const creada = Date.parse(user.created_at ?? '');
  const cuentaNueva = Number.isFinite(creada) && Date.now() - creada < 30 * 60 * 1000;
  unaVez(`gx_cuenta_registrada:${user.id}`, async () => {
    const nota = readOrigenAcceso();
    const edad = nota ? Date.now() - nota.createdAt : Infinity;
    const origen =
      nota && edad >= 0 && edad < VIGENCIA_DEL_ORIGEN_MS
        ? {
            boton: nota.source,
            vitrina: nota.showcaseId,
            forma: nota.forma,
            recomendada: safeGetItem(VITRINA_RECOMENDADA_KEY) || null,
            minutos: Math.round(edad / 60000),
          }
        : null;
    const ok = await registrarEventoSitio('cuenta_vinculada', {
      userId: user.id,
      metadata: {
        cuenta_nueva: cuentaNueva,
        proveedor: user.app_metadata?.provider ?? null,
        ...(origen ? { origen } : {}),
      },
    });
    if (ok) clearOrigenAcceso();
    return ok;
  });
}

const vitrinasVistas = new Set();

/**
 * Registra que alguien sin cuenta abrió la pregunta de una vitrina bloqueada,
 * una vez por vitrina mientras la página siga abierta: qué preguntas despiertan
 * curiosidad aunque nadie inicie sesión (Carlos, 6 oct 2026).
 */
export function registrarVitrinaBloqueada(vitrina, { recomendada = null, pantalla = null } = {}) {
  if (!vitrina || vitrinasVistas.has(vitrina)) return;
  vitrinasVistas.add(vitrina);
  void registrarEventoSitio('vitrina_bloqueada_vista', {
    metadata: { vitrina, recomendada: recomendada || null, pantalla },
  });
}
