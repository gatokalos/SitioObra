import React from 'react';
import UmbralWelcomeContent from '@/components/UmbralWelcomeContent';

// Vista aislada del mismo contenido y orden aprobados para el modal real.
// Solo vive detrás de ?Lab=HashtagDorado (ver main.jsx).
const HashtagDoradoLab = () => {
  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-[#04020f] px-4 backdrop-blur-[18px]">
      <div className="font-display relative flex w-full max-w-md flex-col items-center px-5 py-10 text-center">
        <UmbralWelcomeContent titleFirst onContinue={() => window.location.assign('/#transmedia')} />
      </div>
    </div>
  );
};

export default HashtagDoradoLab;
