import { useState, useCallback } from 'react';
import { ToastAction } from '@/components/ui/toast';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import useActiveSubscription from '@/hooks/useActiveSubscription';
import { recordShowcaseLike } from '@/services/showcaseLikeService';
import { safeSetItem } from '@/lib/safeStorage';
import PulseReactionCard from '@/components/portal/PulseReactionCard';

const LOGIN_RETURN_KEY = 'gatoencerrado:login-return';

const ShowcaseReactionInline = ({ showcaseId, title, description, buttonLabel, bounceKey = 0, className = '' }) => {
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
    <PulseReactionCard
      title={title}
      description={description}
      buttonLabel={buttonLabel}
      status={status}
      onReact={handleReaction}
      bounceKey={bounceKey}
      className={className}
    />
  );
};

export default ShowcaseReactionInline;
