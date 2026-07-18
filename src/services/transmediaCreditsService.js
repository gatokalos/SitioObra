import { ensureAnonId } from '@/lib/identity';
import { supabase } from '@/lib/supabaseClient';

const DEFAULT_STATE = {
  available_tokens: 0,
  sonoro_spent: false,
  graphic_spent: false,
  novela_questions: 0,
  taza_activations: 0,
  showcase_boosts: {},
};

const normalizeState = (raw) => {
  const state = raw && typeof raw === 'object' ? raw : {};
  return {
    available_tokens: Number.isFinite(state.available_tokens)
      ? Number(state.available_tokens)
      : DEFAULT_STATE.available_tokens,
    sonoro_spent: Boolean(state.sonoro_spent),
    graphic_spent: Boolean(state.graphic_spent),
    novela_questions: Number.isFinite(state.novela_questions) ? Number(state.novela_questions) : 0,
    taza_activations: Number.isFinite(state.taza_activations) ? Number(state.taza_activations) : 0,
    showcase_boosts:
      state.showcase_boosts && typeof state.showcase_boosts === 'object' ? state.showcase_boosts : {},
  };
};

export function createTransmediaIdempotencyKey(prefix = 'event') {
  const randomPart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `transmedia:${prefix}:${randomPart}`;
}

export async function fetchTransmediaCreditState() {
  const anonId = ensureAnonId();
  const { data, error } = await supabase.rpc('get_transmedia_credit_state', {
    p_anon_id: anonId,
  });

  if (error) {
    return { state: DEFAULT_STATE, error };
  }

  return { state: normalizeState(data), error: null };
}

export async function claimTransmediaAnonCreditEvents() {
  const anonId = ensureAnonId();
  if (!anonId) {
    return { state: null, migratedCount: 0, error: null };
  }

  const { data, error } = await supabase.rpc('claim_transmedia_anon_credit_events', {
    p_anon_id: anonId,
  });

  if (error) {
    return { state: null, migratedCount: 0, error };
  }

  const result = data && typeof data === 'object' ? data : {};
  const migratedCount = Number.isFinite(result.migrated_count) ? Number(result.migrated_count) : 0;
  return {
    state: normalizeState(result.state),
    migratedCount,
    error: null,
  };
}

const normalizeEvent = (raw) => ({
  id: raw?.id ?? null,
  eventKey: typeof raw?.event_key === 'string' ? raw.event_key : '',
  amount: Number.isFinite(raw?.amount) ? Number(raw.amount) : 0,
  metadata: raw?.metadata && typeof raw.metadata === 'object' ? raw.metadata : {},
  createdAt: typeof raw?.created_at === 'string' ? raw.created_at : null,
});

// Historial de eventos del ledger (no solo el agregado) — para mostrar de dónde
// vinieron los GAT y, leyendo metadata.recommended en resonance:l3-reward:%,
// en qué vitrina se recomienda gastarlos después.
export async function fetchTransmediaCreditEvents(limit = 20) {
  const anonId = ensureAnonId();
  const { data, error } = await supabase.rpc('get_transmedia_credit_events', {
    p_anon_id: anonId,
    p_limit: limit,
  });

  if (error) {
    return { events: [], error };
  }

  const events = Array.isArray(data) ? data.map(normalizeEvent) : [];
  return { events, error: null };
}

export async function registerTransmediaCreditEvent({
  eventKey,
  amount = 0,
  metadata = {},
  oncePerIdentity = false,
  idempotencyKey = createTransmediaIdempotencyKey(eventKey || 'event'),
} = {}) {
  if (!eventKey) {
    return { state: DEFAULT_STATE, duplicate: false, error: new Error('eventKey is required') };
  }

  const anonId = ensureAnonId();
  const payload = {
    p_event_key: eventKey,
    p_amount: Number.isFinite(amount) ? Number(amount) : 0,
    p_idempotency_key: idempotencyKey,
    p_anon_id: anonId,
    p_metadata: metadata && typeof metadata === 'object' ? metadata : {},
    p_once_per_identity: Boolean(oncePerIdentity),
  };

  const { data, error } = await supabase.rpc('register_transmedia_credit_event', payload);

  if (error) {
    return { state: DEFAULT_STATE, duplicate: false, error };
  }

  const result = data && typeof data === 'object' ? data : {};
  return {
    state: normalizeState(result.state),
    duplicate: Boolean(result.duplicate),
    error: null,
  };
}
