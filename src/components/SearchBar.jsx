import { useRef, useEffect } from 'react';
import { useSearch } from '@/hooks/useSearch';

/**
 * SearchBar — Barra de búsqueda inteligente RAG de GatoEncerrado.
 *
 * Uso mínimo:
 *   <SearchBar />
 *
 * Props:
 *   placeholder  {string}   Texto del input. Default: "Buscá en GatoEncerrado..."
 *   onClose      {Function} Callback opcional para cerrar un overlay/modal.
 *   className    {string}   Clases extra para el wrapper externo.
 */
export default function SearchBar({
  placeholder = 'Buscá en GatoEncerrado...',
  onClose,
  className = '',
}) {
  const { query, setQuery, answer, sources, status, errorMessage, search, reset, isLoading } =
    useSearch();

  const inputRef = useRef(null);

  // Auto-focus al montar
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim().length >= 2) search();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      reset();
      onClose?.();
    }
  };

  const hasResult = status === 'streaming' || status === 'done';
  const hasError = status === 'error';

  return (
    <div className={`search-bar-wrapper ${className}`} onKeyDown={handleKeyDown}>
      {/* ── Formulario ── */}
      <form onSubmit={handleSubmit} className="search-bar-form">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label="Buscar en GatoEncerrado"
          disabled={isLoading}
          className="search-bar-input"
        />

        <button
          type="submit"
          disabled={isLoading || query.trim().length < 2}
          className="search-bar-submit"
          aria-label="Buscar"
        >
          {isLoading ? (
            <span className="search-bar-spinner" aria-hidden="true" />
          ) : (
            <SearchIcon />
          )}
        </button>

        {(hasResult || hasError) && (
          <button
            type="button"
            onClick={reset}
            className="search-bar-clear"
            aria-label="Limpiar búsqueda"
          >
            <CloseIcon />
          </button>
        )}
      </form>

      {/* ── Estado: buscando ── */}
      {status === 'searching' && (
        <p className="search-bar-status">Buscando en el universo GatoEncerrado…</p>
      )}

      {/* ── Respuesta de Claude ── */}
      {hasResult && (
        <div className="search-bar-result" role="region" aria-live="polite" aria-label="Respuesta">
          <p className="search-bar-answer">
            {answer}
            {status === 'streaming' && <span className="search-bar-cursor" aria-hidden="true" />}
          </p>

          {/* Fuentes */}
          {status === 'done' && sources.length > 0 && (
            <div className="search-bar-sources">
              <p className="search-bar-sources-label">Artículos relacionados:</p>
              <ul>
                {sources.map((s) => (
                  <li key={s.slug}>
                    <a href={`/blog/${s.slug}`} className="search-bar-source-link">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Error ── */}
      {hasError && (
        <p className="search-bar-error" role="alert">
          {errorMessage || 'No se pudo completar la búsqueda. Intentá de nuevo.'}
        </p>
      )}
    </div>
  );
}

// ─── Iconos inline (sin dependencias extra) ───────────────────────────────────
function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
