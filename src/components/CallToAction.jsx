// SitioObra/src/components/CallToAction.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';

const CallToAction = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  async function handleCheckout() {
    try {
      setLoading(true);
      setMsg('');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // si más adelante tienes auth, aquí también puedes mandar user_id
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo crear la sesión');
      // redirige al checkout de Stripe
      window.location.href = data.url;
    } catch (e) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto text-center space-y-3">
      <motion.p
        className='text-md text-white'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        ¿Te unes al universo? Inicia tu membresía anual.
      </motion.p>

      <input
        type="email"
        placeholder="tu@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="w-full px-3 py-2 rounded text-black"
      />

      <button
        onClick={handleCheckout}
        disabled={loading || !email}
        className="bg-white/90 text-black px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Creando sesión…' : 'Continuar con Stripe'}
      </button>

      {msg && <p className="text-red-300 text-sm">{msg}</p>}
    </div>
  );
};

export default CallToAction;