import { useCallback, useMemo, useState } from 'react';

const CONFETTI_COLORS = ['#f472b6', '#a855f7', '#facc15', '#34d399'];

export const ConfettiBurst = ({ seed }) => {
  const pieces = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.2,
      color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    }));
  }, [seed]);

  return (
    <div className="confetti-layer" aria-hidden="true">
      {pieces.map((piece, index) => (
        <span
          key={`${seed}-${index}`}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            top: `${Math.random() * 20}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

export const useConfettiBursts = () => {
  const [bursts, setBursts] = useState([]);

  const fireConfetti = useCallback(() => {
    const id = Date.now();
    setBursts((prev) => [...prev, id]);
    setTimeout(() => {
      setBursts((prev) => prev.filter((item) => item !== id));
    }, 1100);
  }, []);

  return {
    bursts,
    fireConfetti,
  };
};
