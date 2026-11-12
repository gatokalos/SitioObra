// Quien baja a la Salida para proponer un texto —desde el botón del Camerino
// «¿Nos compartes algo de tu autoría?» o desde «Improvisa una respuesta» en una
// vitrina— encuentra una ficha para su texto, y el título de la Salida se queda
// tenue (Carlos, 12 nov 2026). Vive en memoria: dura lo que dura la visita, hasta
// que manda su texto o elige escribir otra cosa. Al recargar, o si llega por
// cualquier otro lado, la Salida es la de siempre.
export const SALIDA_PROPUESTA_EVENT = 'gatoencerrado:salida-propuesta';

// De dónde viene quien propone ('camerino', o el id de la vitrina). Viaja a la
// función de la Salida, que lo anota en el Backstage.
let llegaParaProponerDesde = null;

export const lugarDeLlegada = () => llegaParaProponerDesde;

export const marcarLlegadaParaProponer = (desde) => {
  llegaParaProponerDesde = /^[a-z0-9-]{1,40}$/i.test(String(desde || '')) ? String(desde) : 'sitio';
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SALIDA_PROPUESTA_EVENT));
  }
};

export const marcarLlegadaDesdeCamerino = () => marcarLlegadaParaProponer('camerino');

export const olvidarLlegadaParaProponer = () => {
  llegaParaProponerDesde = null;
};
