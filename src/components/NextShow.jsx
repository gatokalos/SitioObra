import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReserveModal from '@/components/ReserveModal';
import TicketPurchaseModal from '@/components/TicketPurchaseModal';

const NextShow = () => {
  const [isReserveOpen, setIsReserveOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  const handleOpenReserve = useCallback(() => {
    setIsReserveOpen(true);
  }, []);

  const handleCloseReserve = useCallback(() => {
    setIsReserveOpen(false);
  }, []);

  const handleOpenTicket = useCallback(() => {
    setIsTicketModalOpen(true);
  }, []);

  const handleCloseTicket = useCallback(() => {
    setIsTicketModalOpen(false);
  }, []);

  return (
    <>
      <section id="next-show" className="py-24 relative">
        <div className="section-divider mb-24"></div>
        
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
            className="glass-effect rounded-2xl p-8 md:p-12 text-center overflow-hidden"
          >
            <div className="relative z-10">
              <h2 className="font-display text-4xl md:text-5xl font-medium mb-4 text-gradient italic">
                Próxima Función
              </h2>
              
              <div className="flex items-center justify-center gap-4 mb-6">
                <Calendar size={24} className="text-purple-300" />
                <span className="font-display text-2xl md:text-3xl text-slate-100 font-semibold">
                  28 de Diciembre
                </span>
              </div>

              <p className="text-lg text-slate-300/80 max-w-2xl mx-auto leading-relaxed mb-8 italic font-light">
                "En el Día de los Santos Inocentes, te invitamos a dudar de todo, 
                incluso de lo que crees ver en escena. Quizás la mayor inocentada 
                es pensar que algo es real."
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleOpenTicket}
                  className="bg-gradient-to-r from-orange-500/90 via-rose-500/90 to-pink-500/90 hover:from-orange-400 hover:to-pink-400 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 shadow-lg shadow-orange-500/40 transition"
                >
                  <Ticket size={20} />
                  Compra tu boleto
                </Button>
                <Button
                  variant="outline"
                  onClick={handleOpenReserve}
                  className="border-slate-100/30 text-slate-200 hover:bg-white/5 px-6 py-3 rounded-full font-semibold flex items-center gap-2"
                >
                  RSVP
                </Button>
              </div>
            </div>
            
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-900/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-900/20 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
          </motion.div>
        </div>
      </section>

      <ReserveModal open={isReserveOpen} onClose={handleCloseReserve} initialInterest="recordatorio" />
      <TicketPurchaseModal open={isTicketModalOpen} onClose={handleCloseTicket} />
    </>
  );
};

export default NextShow;
