import { useState, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { ToastAction } from '@/components/ui/toast';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import useActiveSubscription from '@/hooks/useActiveSubscription';
import { recordShowcaseLike } from '@/services/showcaseLikeService';
import { safeSetItem } from '@/lib/safeStorage';

const LOGIN_RETURN_KEY = 'gatoencerrado:login-return';

const ShowcaseReactionInline = ({ showcaseId, title, description, buttonLabel, className = '' }) => {
  const { user, session } = useAuth();
  const { hasActiveSubscription } = useActiveSubscription(user?.id, session);
  const isAuthenticated = Boolean(user);
  const metadataSubscriber = Boolean(
    user?.user_metadata?.isSubscriber ||
      user?.user_metadata?.is_subscriber ||
      user?.user_metadata?.subscription_status === 'active' ||
      user?.user_metadata?.subscription_status === 'trialing' ||
      user?.user_metadata?.stripe_subscription_status === 'active' ||
      user?.user_metadata?.stripe_subscription_status === 'trialing' ||
      user?.user_metadata?.plan === 'subscriber' ||
      user?.user_metadata?.tier === 'subscriber' ||
      user?.app_metadata?.subscription_status === 'active' ||
      user?.app_metadata?.subscription_status === 'trialing' ||
      user?.app_metadata?.stripe_subscription_status === 'active' ||
      user?.app_metadata?.stripe_subscription_status === 'trialing' ||
      user?.app_metadata?.roles?.includes?.('subscriber')
  );
  const isSubscriber = metadataSubscriber || hasActiveSubscription;

  const [status, setStatus] = useState('idle');
  const triggerLoginModal = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-login-modal'));
    }
  }, []);

  const handleReaction = useCallback(async () => {
    if (status === 'loading') {
      return;
    }
    if (!isAuthenticated) {
      safeSetItem(
        LOGIN_RETURN_KEY,
        JSON.stringify({ anchor: '#transmedia', action: 'showcase-reaction', showcaseId })
      );
      toast({
        description: 'Inicia sesión para reaccionar en esta vitrina.',
        action: (
          <ToastAction
            altText="Abrir login"
            onClick={triggerLoginModal}
            className="h-auto border-none bg-transparent p-0 text-xs underline underline-offset-2 text-slate-100 hover:bg-transparent hover:text-white"
          >
            Iniciar sesión
          </ToastAction>
        ),
      });
      return;
    }

    setStatus('loading');
    const { success, error } = await recordShowcaseLike({ showcaseId, user });
    if (!success) {
      console.error('[ShowcaseReaction] Error guardando like:', error);
      toast({ description: 'No pudimos registrar el like. Intenta de nuevo más tarde.' });
      setStatus('idle');
      return;
    }

    setStatus('success');
    toast({ description: 'Gracias por tu apoyo en este escaparate.' });
  }, [isAuthenticated, showcaseId, status, triggerLoginModal, user]);

  // Suppress unused variable warning — isSubscriber used for future gating
  void isSubscriber;

  return (
    <div
      className={`mt-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-500">{title}</p>
          <p className="text-sm text-slate-300 leading-relaxed">{description}</p>
        </div>
        <button
          type="button"
          onClick={handleReaction}
          className={`rounded-full p-3 transition ${
            status === 'success'
              ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-yellow-500 shadow-[0_0_25px_rgba(244,114,182,0.6)] text-white border border-transparent'
              : 'bg-gradient-to-r from-purple-600/80 to-indigo-600/80 text-white hover:from-purple-500 hover:to-indigo-500'
          }`}
          disabled={status === 'loading'}
        >
          <Heart size={20} />
        </button>
      </div>
      {buttonLabel ? (
        <p className="text-xs uppercase tracking-[0.3em] text-purple-300">
          {status === 'loading' ? 'Enviando…' : buttonLabel}
        </p>
      ) : null}
    </div>
  );
};

export default ShowcaseReactionInline;
