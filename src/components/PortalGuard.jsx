import React, { useEffect, useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { MINIVERSE_PORTAL_REGISTRY } from '@/lib/miniversePortalRegistry';
import { ORACULO_RECOMMENDED_SHOWCASE_KEY } from '@/components/transmedia/transmediaConstants';

// Guardián de las nueve rutas de portal.
//
// Hasta el 18 de septiembre de 2026 estaban sueltas: escribir /portal-cine en la
// barra bastaba para entrar, con sesión o sin ella. La regla de acceso vivía
// solo en el toque de la vitrina (`handleFormatClick` en Transmedia.jsx), así
// que cualquier enlace directo la saltaba entera.
//
// La regla, ahora también en la puerta: quien tiene cuenta entra a las nueve;
// quien no, entra únicamente a la forma que el Oráculo le recomendó, y sólo si
// pasó por la Bienvenida. El resto vuelve al inicio, que es donde el recorrido
// empieza de verdad.
//
// Dentro de su forma, el invitado hace todo: la resonancia colectiva es suya sin
// cuenta, y el regreso a los tres días también. La sesión no es la puerta de la
// obra; es la puerta para cruzar a las demás formas.

const rutaAFormatId = new Map(
  MINIVERSE_PORTAL_REGISTRY
    .filter((entry) => entry.route && entry.formatId)
    .map((entry) => [entry.route, entry.formatId]),
);

const leerRecomendada = () => {
  try {
    return window.localStorage.getItem(ORACULO_RECOMMENDED_SHOWCASE_KEY);
  } catch {
    return null;
  }
};

const pasoPorBienvenida = () => {
  try {
    return window.localStorage.getItem('gatoencerrado:bienvenida-completed') === '1';
  } catch {
    return false;
  }
};

const PortalGuard = ({ children }) => {
  const { user, isDevAuth } = useAuth();
  const { toast } = useToast();
  const location = useLocation();

  const permitido = useMemo(() => {
    // La vista previa de desarrollo no se bloquea: es como se prueban los nueve.
    if (user || isDevAuth) return true;
    const formatId = rutaAFormatId.get(location.pathname);
    // Una ruta que no está en el registro no la gobierna este guardián.
    if (!formatId) return true;
    return pasoPorBienvenida() && leerRecomendada() === formatId;
  }, [user, isDevAuth, location.pathname]);

  useEffect(() => {
    if (permitido) return;
    toast({
      description:
        'Esa forma se abre con tu sesión iniciada. Sin cuenta, el recorrido empieza por la que el Oráculo te recomendó.',
    });
  }, [permitido, toast]);

  if (!permitido) return <Navigate to="/" replace />;
  return children;
};

export default PortalGuard;
