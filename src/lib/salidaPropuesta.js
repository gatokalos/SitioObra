// Quien baja a la Salida desde el botón del Camerino «¿Nos compartes algo de tu
// autoría?» viene a proponer un texto (Carlos, 12 nov 2026): la ficha le habla
// de su texto y el título de la Salida se queda tenue. Vive en memoria: dura lo
// que dura la visita, hasta que manda su texto o elige escribir otra cosa. Al
// recargar, o si llega por cualquier otro lado, la Salida es la de siempre.
export const SALIDA_PROPUESTA_EVENT = 'gatoencerrado:salida-propuesta';

let llegoDesdeCamerino = false;

export const vieneDelCamerino = () => llegoDesdeCamerino;

export const marcarLlegadaDesdeCamerino = () => {
  llegoDesdeCamerino = true;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SALIDA_PROPUESTA_EVENT));
  }
};

export const olvidarLlegadaDesdeCamerino = () => {
  llegoDesdeCamerino = false;
};
