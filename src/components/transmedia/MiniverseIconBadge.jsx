import React from 'react';
import {
  MINIVERSE_ICON_IMAGES,
  MINIVERSE_ICON_PLACEHOLDER,
} from '@/components/transmedia/transmediaConstants';

const MiniverseIconBadge = ({ formatId, className = '' }) => (
  <span
    aria-hidden="true"
    className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/35 bg-white/15 shadow-[0_12px_28px_rgba(0,0,0,0.45)] ring-[5px] ring-purple-200/30 ${className}`}
  >
    <span className="h-[46px] w-[46px] overflow-hidden rounded-full">
      <img
        src={MINIVERSE_ICON_IMAGES[formatId] ?? MINIVERSE_ICON_PLACEHOLDER}
        alt=""
        className="h-full w-full scale-[1.12] object-cover"
        loading="lazy"
        decoding="async"
      />
    </span>
  </span>
);

export default MiniverseIconBadge;
