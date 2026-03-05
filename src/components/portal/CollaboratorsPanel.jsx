import React, { useMemo, useState } from 'react';

const PLACEHOLDER_COLLABORATOR_IMAGE = '/assets/logoapp.webp';

const resolveCollaboratorId = (collaborator, index) => collaborator?.id ?? `collaborator-${index}`;

const resolveCollaboratorImage = (collaborator) => {
  if (typeof collaborator?.image === 'string' && collaborator.image.trim()) {
    return collaborator.image.trim();
  }
  return PLACEHOLDER_COLLABORATOR_IMAGE;
};

const handleCollaboratorImageError = (event) => {
  const target = event.currentTarget;
  if (!target || target.dataset.fallbackApplied === '1') return;
  target.dataset.fallbackApplied = '1';
  target.src = PLACEHOLDER_COLLABORATOR_IMAGE;
};

const CollaboratorsPanel = ({
  collaborators = [],
  title = 'Colaboradores',
  accentClassName = 'text-purple-300',
  extraContent = null,
}) => {
  const normalizedCollaborators = useMemo(
    () =>
      (Array.isArray(collaborators) ? collaborators : [])
        .map((collaborator, index) => ({
          ...collaborator,
          _id: resolveCollaboratorId(collaborator, index),
          _image: resolveCollaboratorImage(collaborator),
        }))
        .filter((collaborator) => Boolean(collaborator.name)),
    [collaborators]
  );

  const [selectedId, setSelectedId] = useState(null);

  if (!normalizedCollaborators.length) return null;

  const selected = normalizedCollaborators.find((collaborator) => collaborator._id === selectedId) ?? null;
  const avatarsToShow = selected
    ? normalizedCollaborators.filter((collaborator) => collaborator._id !== selected._id)
    : normalizedCollaborators;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-5">
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {avatarsToShow.map((collaborator) => (
            <button
              key={collaborator._id}
              type="button"
              onClick={() => setSelectedId(collaborator._id)}
              className="h-16 w-16 md:h-14 md:w-14 rounded-full border border-white/15 bg-white/5 overflow-hidden transition hover:border-purple-300/60 shadow-lg shadow-black/30"
              title={collaborator.name}
            >
              <img
                src={collaborator._image}
                alt={`Retrato de ${collaborator.name}`}
                className="h-full w-full object-cover"
                loading="lazy"
                onError={handleCollaboratorImageError}
              />
            </button>
          ))}
        </div>
        <p className={`text-xs uppercase tracking-[0.35em] text-center ${accentClassName}`}>{title}</p>

        {selected ? (
          <div className="border border-white/10 rounded-2xl bg-black/20 p-4 flex flex-col items-center text-center">
            <img
              src={selected._image}
              alt={`Retrato de ${selected.name}`}
              className="h-24 w-24 rounded-full object-cover border border-white/10 flex-shrink-0 shadow-lg shadow-black/30"
              loading="lazy"
              onError={handleCollaboratorImageError}
            />
            <div className="mt-4 space-y-2">
              <p className="text-slate-100 font-semibold text-2xl">{selected.name}</p>
              {selected.role ? (
                <p className={`text-[11px] uppercase tracking-[0.3em] ${accentClassName}`}>{selected.role}</p>
              ) : null}
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="text-xs uppercase tracking-[0.3em] text-slate-400 hover:text-white transition"
                aria-label="Cerrar ficha de colaborador"
              >
                Cerrar ✕
              </button>
              {selected.bio ? <p className="text-sm text-slate-200/90 leading-relaxed">{selected.bio}</p> : null}
            </div>
          </div>
        ) : null}

        {selected ? extraContent : null}
      </div>
    </div>
  );
};

export default CollaboratorsPanel;
