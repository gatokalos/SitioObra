// El carril de las vitrinas (Carlos, 24 nov 2026). Empezó como prueba detrás
// de ?carril=1; Carlos lo aprobó el mismo día y desde entonces es el de
// siempre, para todos. Se deja la función para no tocar a quien la llama, y se
// borra la marca vieja que guardaba el navegador.
export const leerCarril = () => {
  if (typeof window !== 'undefined') {
    try { window.localStorage.removeItem('gatoencerrado:carril'); } catch { /* sin almacenamiento */ }
  }
  return true;
};
