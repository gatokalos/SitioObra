import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const PayButton = ({ priceId }) => {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!priceId) {
      console.error('priceId es requerido para iniciar el checkout');
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error('Error obteniendo usuario de Supabase', userError);
        return;
      }

      if (!user) {
        console.error('No hay usuario autenticado para iniciar el pago');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          mode: 'payment',
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          metadata: {
            user_id: user.id,
          },
        },
      });

      if (error) {
        console.error('Error creando sesión de pago', error);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        console.error('Stripe no devolvió una URL de Checkout', data);
      }
    } catch (err) {
      console.error('Fallo inesperado iniciando el Checkout', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCheckout}
      disabled={loading || !priceId}
      className="rounded-md bg-black px-4 py-2 text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? 'Redirigiendo...' : 'Pagar con Stripe'}
    </button>
  );
};

export default PayButton;
