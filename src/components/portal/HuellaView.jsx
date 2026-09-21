import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ensureAnonId } from '@/lib/identity';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import VitranaQuestionReveal from '@/components/portal/VitranaQuestionReveal';

// La huella ya no se expone en la Memoria. Este bloque sólo explica qué
// encontrará la persona y la conduce a La Réplica; allí, en el textarea del
// acto final, aparece la última palabra devuelta por el backend.

const OBRA_API_URL = (import.meta.env.VITE_OBRA_API_URL ?? 'https://api.gatoencerrado.ai').replace(/\/+$/, '');
const PROVOCA_DRAFT_KEY = 'gatoencerrado:provoca-draft';
const PROVOCA_QUOTE_MAX_CHARS = 700;
const HUELLA_DESCRIPTION = 'Aquí volvió lo que escribiste antes de entrar y lo que respondiste días después. Puedes corregirlo, conservarlo como regresó o retirarlo.';

// Segundo estado (20 sep 2026). Hasta hoy este bloque decía lo mismo antes y
// después de publicar, y volver a pulsar el botón recargaba el texto en el
// editor: se podía publicar dos veces la misma réplica. Ahora, si ya publicó,
// lo que ofrece es retirarla. La réplica se retira sola: no arrastra la huella
// del recorrido, igual que retirar la huella no borraba la réplica.
const REPLICA_DESCRIPTION = 'Ya publicaste tu réplica. Está en el acto final, firmada como la dejaste. Si no estás a gusto con ella, puedes retirarla.';
const CONFIRMA_RETIRO = 'Se retira tu réplica del acto final. Lo que escribiste en tu recorrido se queda. No se puede deshacer.';

// Devuelve el texto y de dónde salió. El origen es lo que permite que editar en
// La Réplica corrija la huella guardada, y no sólo el borrador (D-38: corregir y
// retirar acompañan a la huella dondequiera que se muestre).
const selectReplicaText = (sessions = [], portal = null) => {
  const conHuella = sessions.filter((session) => (
    (!portal || session.miniverso_id === portal)
    && (session.intuicion_answer || session.bitacora_completed_at)
  ));
  const latest = conHuella[conHuella.length - 1] ?? null;
  if (!latest) return null;
  const campos = [
    ['bitacora_p3_response', latest.bitacora_p3_response],
    ['bitacora_p2_response', latest.bitacora_p2_response],
    ['bitacora_p1_response', latest.bitacora_p1_response],
    ['intuicion_answer', latest.intuicion_answer],
  ];
  const elegido = campos.find(([, valor]) => typeof valor === 'string' && valor.trim());
  if (!elegido) return null;
  return { texto: elegido[1].trim(), sessionId: latest.id, campo: elegido[0] };
};

const HuellaView = ({ portal, onGoToSite, onReplicaPublicada }) => {
  const { isDevAuth } = useAuth();
  const anonId = useMemo(() => ensureAnonId(), []);
  const [sessions, setSessions] = useState(null);
  const [replicas, setReplicas] = useState([]);

  const fetchHuella = useCallback(async () => {
    if (isDevAuth) {
      setSessions([]);
      return [];
    }
    try {
      const response = await fetch(`${OBRA_API_URL}/api/huella?anon_id=${encodeURIComponent(anonId)}`);
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error();
      const nextSessions = data.sesiones ?? [];
      setSessions(nextSessions);
      return nextSessions;
    } catch {
      setSessions([]);
      return [];
    }
  }, [anonId, isDevAuth]);

  const fetchReplicas = useCallback(async () => {
    if (isDevAuth) return;
    try {
      const response = await fetch(`${OBRA_API_URL}/api/replica?anon_id=${encodeURIComponent(anonId)}`);
      const data = await response.json();
      if (response.ok && data.ok) setReplicas(data.replicas ?? []);
    } catch {}
  }, [anonId, isDevAuth]);

  useEffect(() => { void fetchReplicas(); }, [fetchReplicas]);

  // Lo sabe también la puerta del acordeón: si ya publicó, no puede seguir
  // diciendo "llevarlo al acto final".
  useEffect(() => { onReplicaPublicada?.(replicas.length > 0); }, [replicas.length, onReplicaPublicada]);

  const retirarReplica = async () => {
    if (typeof window !== 'undefined' && !window.confirm(CONFIRMA_RETIRO)) return;
    try {
      const response = await fetch(`${OBRA_API_URL}/api/replica`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anonId, anon_id: anonId }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error();
      setReplicas([]);
    } catch {
      await fetchReplicas();
    }
  };

  // La consulta ocurre en segundo plano al abrir el acordeón. No mostramos el
  // resultado aquí: sólo lo preparamos para el textarea de La Réplica.
  useEffect(() => {
    void fetchHuella();
  }, [fetchHuella]);

  const handleIrAlActoFinal = async () => {
    const availableSessions = sessions ?? await fetchHuella();
    const origen = selectReplicaText(availableSessions, portal);
    const quote = origen ? origen.texto.slice(0, PROVOCA_QUOTE_MAX_CHARS) : '';
    if (quote) {
      // `huella` viaja con el borrador para que el acto final pueda corregir o
      // retirar lo guardado, no sólo lo que se va a publicar.
      const huella = {
        anonId,
        sessionId: origen.sessionId,
        campo: origen.campo,
        original: quote,
      };
      try {
        const previousRaw = localStorage.getItem(PROVOCA_DRAFT_KEY);
        const previous = previousRaw ? JSON.parse(previousRaw) : {};
        localStorage.setItem(PROVOCA_DRAFT_KEY, JSON.stringify({
          ...previous,
          quote,
          huella,
          updatedAt: new Date().toISOString(),
        }));
        window.dispatchEvent(new CustomEvent('gatoencerrado:provoca-draft', { detail: { quote, huella } }));
      } catch {}
    }
    onGoToSite?.('#provoca');
  };

  return (
    <motion.div
      key="huella"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="huella-view huella-view--embedded"
    >
      <div className="huella-view__contenido huella-view__contenido--embedded">
        <div className="huella-view__revelacion">
          <VitranaQuestionReveal
            key={replicas.length > 0 ? 'publicada' : 'pendiente'}
            question={replicas.length > 0 ? REPLICA_DESCRIPTION : HUELLA_DESCRIPTION}
            label={null}
            buttonLabel={replicas.length > 0 ? 'Retirar mi réplica' : 'Continuar al acto final'}
            onAnswer={() => void (replicas.length > 0 ? retirarReplica() : handleIrAlActoFinal())}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default HuellaView;
