import { supabase } from '@/lib/supabaseClient';
import { ensureAnonId } from '@/lib/identity';
import { isInstalledPWA } from '@/lib/pwaDetection';
import { safeGetItem, safeSetItem } from '@/lib/safeStorage';

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
 */
export function registrarCuenta(user) {
  if (!user?.id) return;
  const creada = Date.parse(user.created_at ?? '');
  const cuentaNueva = Number.isFinite(creada) && Date.now() - creada < 30 * 60 * 1000;
  unaVez(`gx_cuenta_registrada:${user.id}`, () =>
    registrarEventoSitio('cuenta_vinculada', {
      userId: user.id,
      metadata: { cuenta_nueva: cuentaNueva, proveedor: user.app_metadata?.provider ?? null },
    })
  );
}
