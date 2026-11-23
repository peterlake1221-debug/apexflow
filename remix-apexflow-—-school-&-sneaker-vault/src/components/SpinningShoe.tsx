import React, { useState } from 'react';
import { getPresetImageForModel } from '../utils/sneakerMath';

interface SpinningShoeProps {
  imageUrl?: string;
  modelName: string;
  paused?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const SpinningShoe: React.FC<SpinningShoeProps> = ({
  imageUrl,
  modelName,
  paused = false,
  size = 'md',
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const src = imageUrl && imageUrl.trim() ? imageUrl : getPresetImageForModel(modelName);

  const sizeClasses =
    size === 'sm'
      ? 'w-24 h-17'
      : size === 'lg'
        ? 'w-34 h-24'
        : 'w-28 h-20';

  return (
    <div
      className={`sneaker-spin-container relative flex flex-col items-center justify-center rounded-xl bg-gradient-to-b from-slate-900/95 via-[#07131e]/95 to-slate-950 border border-cyan-400/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_0_22px_rgba(16,185,129,0.16)] overflow-hidden shrink-0 ${sizeClasses} ${
        paused ? 'sneaker-motion-paused' : ''
      }`}
      title={paused ? 'Holographic turntable paused' : 'Hover to pause holographic turntable'}
    >
      {/* Holographic Scanlines & Radial Chamber Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 holo-scanline-grid opacity-60"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(34,211,238,0.22),rgba(16,185,129,0.08)_55%,transparent_80%)]"
      />
      {/* Light Sweep Reflection */}
      <div
        aria-hidden="true"
        className="holo-light-sweep pointer-events-none absolute inset-x-0 h-6 bg-gradient-to-b from-transparent via-cyan-300/20 to-transparent"
      />

      <div className="sneaker-spin-stage relative z-10 w-full h-full flex items-center justify-center p-1.5">
        {!imgFailed ? (
          <img
            src={src}
            alt={modelName}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="sneaker-spin-shoe w-full h-full object-contain select-none pointer-events-none drop-shadow-[0_10px_12px_rgba(0,0,0,0.75)]"
          />
        ) : (
          <svg
            viewBox="0 0 120 72"
            className="sneaker-spin-shoe w-4/5 h-4/5 text-emerald-400"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M14 48 C18 32, 34 22, 48 26 L64 16 C72 24, 84 30, 102 36 C108 38, 110 46, 106 52 L14 52 Z"
              stroke="currentColor"
              strokeWidth="2.5"
              fill="rgba(16,185,129,0.14)"
            />
            <path d="M12 52 L108 52 L106 58 L14 58 Z" fill="rgba(6,182,212,0.35)" />
          </svg>
        )}
      </div>

      {/* Glowing Holographic Base Ring & Pedestal */}
      <div
        aria-hidden="true"
        className="sneaker-spin-pedestal pointer-events-none absolute bottom-1 w-4/5 h-2.5 rounded-full bg-gradient-to-r from-transparent via-emerald-400/75 to-transparent blur-[3px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-1.5 w-3/4 h-[1.5px] rounded-full bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_8px_rgba(34,211,238,0.9)]"
      />
    </div>
  );
};
