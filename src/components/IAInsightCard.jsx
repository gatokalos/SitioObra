import React, { useMemo, useState } from 'react';
import { ChevronDown, Cpu, MessageCircle, ShieldCheck, Sparkles, Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { apiFetch } from '@/lib/apiClient';

const IAInsightCard = ({
  title = 'Información de IA',
  type,
  interaction,
  tokensRange,
  coverage,
  footnote,
  compact = false,
}) => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState('idle'); // idle | loading | success | error | auth
  const [isOpen, setIsOpen] = useState(!compact);
  const hasBody = type || interaction || tokensRange || coverage;
  const apiBase = useMemo(() => import.meta.env.VITE_API_URL?.replace(/\/+$/, ''), []);
  const apiPaths = useMemo(() => ['/tokens/me', '/api/tokens/me'], []);
  const canFetchBackendBalance = useMemo(() => {
    if (!apiBase) return false;
    if (import.meta.env.VITE_ALLOW_CROSS_ORIGIN_API === 'true') return true;
    if (typeof window === 'undefined') return false;
    try {
      return new URL(apiBase).origin === window.location.origin;
    } catch {
      return false;
    }
  }, [apiBase]);

  const getLocalBalance = () => {
    if (typeof window === 'undefined') return 0;
    const raw = window.localStorage?.getItem('gatoencerrado:gatokens-available');
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const getFunctionsBaseUrl = () => {
    const explicit = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
    if (explicit) return explicit.replace(/\/+$/, '');
    const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
    if (apiUrl) {
      return apiUrl.endsWith('/functions/v1') ? apiUrl : `${apiUrl}/functions/v1`;
    }
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, '');
    return supabaseUrl ? `${supabaseUrl}/functions/v1` : null;
  };

  const fetchBackendBalance = async () => {
    if (!session?.access_token || !apiBase || !canFetchBackendBalance) {
      if (import.meta.env.DEV && apiBase && !canFetchBackendBalance) {
        console.debug('[IAInsightCard] skipping backend balance fetch (cross-origin)', { apiBase });
      }
      return null;
    }
    for (const path of apiPaths) {
      try {
        const res = await apiFetch(path, {
          cache: 'no-store',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        if (!res.ok) {
          continue;
        }
        const data = await res.json();
        if (typeof data?.balance === 'number') {
          return data.balance;
        }
      } catch (error) {
        console.warn('[IAInsightCard] fetch backend balance fallback', { path, error });
      }
    }
    return null;
  };

  const invokeMigrateTokens = async (payload) => {
    // Primer intento: cliente supabase (usa configuración por defecto)
    try {
      const { data, error } = await supabase.functions.invoke('migrate-tokens', {
        body: payload,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (error) throw error;
      return data;
    } catch (primaryError) {
      console.warn('[IAInsightCard] primary migrate-tokens failed, trying direct fetch', primaryError);
      // Fallback directo a la URL de Functions (útil si invoke falla por CORS/rutas)
      const baseUrl = getFunctionsBaseUrl();
      if (!baseUrl) throw primaryError;
      const anonKey =
        import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const response = await fetch(`${baseUrl}/migrate-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(anonKey ? { apikey: anonKey } : {}),
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'unknown');
        throw new Error(`Fallback migrate-tokens failed: ${errorBody}`);
      }
      return response.json().catch(() => ({}));
    }
  };

  const handleMigrateTokens = async () => {
    if (!user || !session?.access_token) {
      setStatus('auth');
      toast({ description: 'Inicia sesión para migrar tus GATokens.' });
      return;
    }

    setStatus('loading');
    try {
      const [backendBalance, localBalance] = await Promise.all([
        fetchBackendBalance(),
        Promise.resolve(getLocalBalance()),
      ]);

      const data = await invokeMigrateTokens({
        user_id: user.id,
        source: 'sitio-obra',
        local_balance: localBalance,
        backend_balance: backendBalance,
        requested_at: new Date().toISOString(),
        origin_meta: {
          path: typeof window !== 'undefined' ? window.location.pathname : undefined,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        },
      });

      if (typeof window !== 'undefined') {
        window.localStorage?.setItem('gatokens:last-migrated', new Date().toISOString());
      }

      toast({ description: 'Migramos tus GATokens al hub principal.' });
      setStatus('success');
      return data;
    } catch (err) {
      console.error('[IAInsightCard] migrate-tokens', err);
      toast({ variant: 'destructive', description: 'No pudimos migrar tus GATokens.' });
      setStatus('error');
      return null;
    }
  };

  if (!hasBody && !footnote) {
    return null;
  }

  return (
    <div className="rounded-xl border border-purple-700/30 bg-purple-950/25 p-5 text-sm text-purple-100 backdrop-blur-md shadow-[0_10px_35px_rgba(0,0,0,0.4)]">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-amber-200" />
          <h4 className="text-base font-semibold text-purple-200">{title}</h4>
        </div>
        <ChevronDown
          size={18}
          className={`text-purple-200 transition ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <div className="mt-4 space-y-2 text-purple-100/90">
          {type ? (
            <div className="flex items-start gap-2 leading-relaxed">
              <Cpu size={16} className="mt-0.5 text-purple-200" />
              <p>
                <strong>Tipo de IA:</strong> {type}
              </p>
            </div>
          ) : null}
          {interaction ? (
            <div className="flex items-start gap-2 leading-relaxed">
              <MessageCircle size={16} className="mt-0.5 text-purple-200" />
              <div>
        <strong>Interacción esperada:</strong>{' '}
        <span>{interaction}</span>
      </div>
            </div>
          ) : null}
          {tokensRange ? (
            <div className="flex items-start gap-2 leading-relaxed">
              <Sparkles size={16} className="mt-0.5 text-amber-200" />
              <div className="flex items-start gap-2">
  <Sparkles size={16} />
  <div>
    <strong>Tokens estimados:</strong>{' '}
    <span>{tokensRange}</span>
  </div>
</div>
            </div>
          ) : null}
          {coverage ? (
            <div className="flex items-start gap-2 leading-relaxed">
              <ShieldCheck size={16} className="mt-0.5 text-emerald-200" />
              <div>
              <strong>Costos cubiertos:</strong>{' '}
              <span>{coverage}</span>
            </div>
            </div>
          ) : null}

          <div className="pt-3">
            <button
              type="button"
              onClick={handleMigrateTokens}
              disabled={status === 'loading'}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500/90 px-3 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {status === 'loading'
                ? 'Migrando…'
                : status === 'success'
                  ? 'Migrado'
                  : 'Migrar mis GATokens'}
            </button>
            {status === 'auth' ? (
              <p className="mt-2 text-xs text-amber-200">Necesitas iniciar sesión para sincronizar tu saldo.</p>
            ) : null}
          </div>

          {footnote ? <p className="pt-1 text-purple-300/85 italic">{footnote}</p> : null}
        </div>
      ) : null}
    </div>
  );
};

export default IAInsightCard;
