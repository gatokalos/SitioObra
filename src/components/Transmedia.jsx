import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const formats = [/* ... lo que ya tienes ... */];

const Transmedia = () => {
  const handleFormatClick = () => {
    alert("Esta función aún no está implementada 😸");
  };

  // 🚀 Nueva función: redirigir a Stripe
  const handleSubscribe = async () => {
    try {
      const res = await fetch("http://localhost:5050/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "demo-user-uuid" }), // aquí pondrás el user_id real de Supabase
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // redirige a Stripe Checkout
      } else {
        alert("Error creando la sesión de pago.");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("No se pudo iniciar el pago.");
    }
  };

  return (
    <section id="transmedia" className="py-24 relative">
      <div className="section-divider mb-24"></div>

      <div className="container mx-auto px-6">
        {/* Título */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-medium mb-6 text-gradient italic">
            Universo Transmedia
          </h2>
          <p className="text-lg text-slate-300/80 max-w-3xl mx-auto leading-relaxed font-light">
            #GatoEncerrado es un ecosistema narrativo que se expande a través de múltiples 
            plataformas, ofreciendo diferentes puertas de entrada a la misma historia.
          </p>
        </motion.div>

        {/* Tarjetas */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {formats.map((format, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
              viewport={{ once: true }}
              className="group glass-effect rounded-xl p-8 hover-glow cursor-pointer flex flex-col transition-all duration-300 hover:border-purple-400/50"
              onClick={handleFormatClick}
            >
              <div className="flex items-center justify-start mb-6 transition-all duration-300 group-hover:scale-110">
                <img
                  src={format.icon}
                  alt={format.title}
                  className="w-14 h-14 object-contain drop-shadow-[0_0_12px_rgba(168,85,247,0.4)] group-hover:drop-shadow-[0_0_20px_rgba(99,102,241,0.6)]"
                />
              </div>

              <h3 className="font-display text-2xl font-medium text-slate-100 mb-3">
                {format.title}
              </h3>

              <p className="text-slate-300/70 text-base leading-relaxed mb-4 flex-grow font-light">
                {format.description}
              </p>

              <div className="text-purple-300 flex items-center gap-2 font-semibold transition-all duration-300 group-hover:gap-3">
                Descubrir
                <ArrowRight size={18} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Botón Suscríbete */}
        <div className="text-center mt-16">
          <button
            onClick={handleSubscribe}
            className="px-8 py-3 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg"
          >
            Suscríbete
          </button>
        </div>
      </div>
    </section>
  );
};

export default Transmedia;