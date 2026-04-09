import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const GATO_API_URL = (import.meta.env.VITE_OBRA_API_URL ?? 'https://api.gatoencerrado.ai').replace(/\/+$/, '');

const CHARACTER_META = {
  'reina-de-espadas': { nombre_visible: 'La Reina de Espadas', genero_literario: 'Aforismo filosófico', sticker: '/assets/reina_sticker.svg' },
  'don-polo':         { nombre_visible: 'Don Polo',            genero_literario: 'Cronicón costumbrista', sticker: '/assets/polo_sticker.svg' },
  saturnina:          { nombre_visible: 'Saturnina',           genero_literario: 'Haiku expandido / microcuento', sticker: '/assets/saturnina_sticker.svg' },
  lucinda:            { nombre_visible: 'Lucinda',             genero_literario: 'Carta confesional', sticker: '/assets/lucinda_sticker.svg' },
  'payasito-triste':  { nombre_visible: 'Payasito Triste',     genero_literario: 'Poema en prosa / cuento breve onírico', sticker: '/assets/payasito_sticker.svg' },
  'la-maestra':       { nombre_visible: 'La Maestra',          genero_literario: 'Ensayo corto', sticker: '/assets/maestra_sticker.svg' },
  'la-doctora':       { nombre_visible: 'La Doctora',          genero_literario: 'Análisis simbólico', sticker: '/assets/doctora_sticker.svg' },
  silvestre:          { nombre_visible: 'Silvestre',           genero_literario: 'Monólogo dramático', sticker: '/assets/silvestre_sticker.svg' },
  andy:               { nombre_visible: 'Andy',                genero_literario: 'Flash fiction / meme narrativo', sticker: '/assets/andy_sticker.svg' },
};

const Trazos = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const transformacionId = searchParams.get('transformacion') ?? '';
  const personajeId = searchParams.get('personaje') ?? '';

  const [transformacion, setTransformacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [entered, setEntered] = useState(false);
  const rafRef = useRef(null);

  const meta = CHARACTER_META[personajeId] ?? null;

  useEffect(() => {
    if (!transformacionId) {
      setError('No se encontró la transformación.');
      setLoading(false);
      return;
    }

    fetch(`${GATO_API_URL}/api/transformar/${encodeURIComponent(transformacionId)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setTransformacion(data);
        setLoading(false);
        rafRef.current = requestAnimationFrame(() => setEntered(true));
      })
      .catch(() => {
        setError('No pudimos cargar el texto transformado.');
        setLoading(false);
      });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [transformacionId]);

  const lines = transformacion?.texto_transformado
    ? transformacion.texto_transformado.split('\n').filter(Boolean)
    : [];

  const nombreVisible = meta?.nombre_visible ?? transformacion?.personaje_id ?? personajeId;
  const generoLiterario = meta?.genero_literario ?? '';

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-[#0a0610] overflow-hidden"
      style={{ fontFamily: "'Fraunces', 'Georgia', serif" }}
    >
      {/* Fondo atmosférico */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0e2e]/80 to-[#0a0610]" />
        <div
          className="absolute inset-0 opacity-20"
          style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(138,100,255,0.35) 0%, transparent 70%)' }}
        />
      </div>

      {/* Atril + panel — animación de entrada lateral */}
      <div
        className="relative z-10 flex items-center gap-6 px-6 transition-transform duration-[900ms] ease-out"
        style={{ transform: entered ? 'translateX(0)' : 'translateX(-120%)' }}
      >
        {/* Imagen del atril */}
        <img
          src="/assets/atril.png"
          alt="Atril"
          className="hidden sm:block w-[clamp(140px,20vmin,220px)] h-auto drop-shadow-[0_18px_28px_rgba(8,5,14,0.7)]"
        />

        {/* Panel de texto */}
        <div
          className="max-w-[min(72vw,500px)] rounded-[18px] border border-[rgba(255,220,200,0.18)] p-[clamp(18px,4vmin,28px)]"
          style={{
            background: 'rgba(22,16,38,0.92)',
            boxShadow: '0 20px 48px rgba(6,3,12,0.65)',
          }}
        >
          {/* Personaje */}
          <div className="flex items-center gap-3 mb-3">
            {meta?.sticker && (
              <img src={meta.sticker} alt={nombreVisible} className="w-9 h-9 object-contain" />
            )}
            <div>
              <span className="block text-[clamp(11px,1.6vmin,13px)] uppercase tracking-[0.12em] text-[rgba(255,220,200,0.7)]">
                {generoLiterario}
              </span>
              <h2 className="text-[clamp(18px,3vmin,26px)] font-bold text-[#fff3e4] leading-tight">
                {nombreVisible}
              </h2>
            </div>
          </div>

          {/* Texto transformado */}
          <div className="text-[clamp(14px,2.3vmin,17px)] leading-relaxed text-[rgba(245,236,248,0.92)] mb-5">
            {loading && (
              <p className="italic text-[rgba(255,226,210,0.65)]">Invocando la transformación…</p>
            )}
            {!loading && error && (
              <p className="italic text-[rgba(255,120,100,0.8)]">{error}</p>
            )}
            {!loading && !error && lines.map((line, idx) => (
              <p key={idx} className="mb-2 last:mb-0">{line}</p>
            ))}
          </div>

          {/* CTAs */}
          {!loading && !error && (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex-1 rounded-full border border-[rgba(255,220,200,0.3)] bg-[rgba(255,174,106,0.9)] hover:bg-[rgba(255,174,106,1)] text-[#2a1b12] font-bold py-2.5 px-4 text-[clamp(13px,2vmin,15px)] transition hover:-translate-y-px"
              >
                Volver al universo
              </button>
              {/* Punto de extensión: CTA hacia Trazos runtime */}
              {/* <button onClick={() => navigate al runtime externo}>Continuar en Trazos</button> */}
            </div>
          )}

          {!loading && error && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-full border border-[rgba(255,220,200,0.3)] bg-transparent text-[rgba(255,220,200,0.8)] py-2.5 px-4 text-[clamp(13px,2vmin,15px)] transition hover:border-white"
            >
              Volver
            </button>
          )}
        </div>
      </div>

      {/* Botón cerrar */}
      <button
        type="button"
        onClick={() => navigate('/')}
        className="absolute right-6 top-6 z-20 rounded-full border border-white/20 bg-black/60 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white hover:bg-black/80"
      >
        Cerrar
      </button>
    </div>
  );
};

export default Trazos;
