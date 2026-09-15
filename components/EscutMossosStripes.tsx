import React from 'react';

interface EscutMossosStripesProps {
  stripesCount: number; // 0 to 4
  size?: number; // width in pixels
  className?: string;
  glow?: boolean;
  animated?: boolean;
  label?: string;
}

/**
 * Escut Oficial Mossos d'Esquadra Genèric en PVC
 * Renders the exact official chest badge silhouette:
 * - Arched top with side notches
 * - Indented waist (narrower center, curved contour)
 * - Arched bottom with "MOSSOS D'ESQUADRA"
 * - Arched top with "POLICIA" in embossed gold lettering
 * - Central oval medallion with the 4 vertical stripes (Quatre Barres)
 * - Stripes light up 1 by 1 in official police red (#DA291C) as the user scores points
 */
export const EscutMossosStripes: React.FC<EscutMossosStripesProps> = ({
  stripesCount = 0,
  size = 140,
  className = '',
  glow = true,
  animated = true,
  label
}) => {
  const safeStripes = Math.max(0, Math.min(4, stripesCount));
  const uid = React.useId().replace(/:/g, '');

  return (
    <div 
      className={`inline-flex flex-col items-center select-none ${className}`}
      style={{ width: size }}
    >
      <div className="relative w-full aspect-[220/260] flex items-center justify-center">
        <svg
          viewBox="0 0 220 260"
          className="w-full h-full overflow-visible"
          style={{
            filter: glow && safeStripes > 0
              ? `drop-shadow(0 0 ${safeStripes * 4}px rgba(218, 41, 28, ${0.4 + safeStripes * 0.15})) drop-shadow(0 4px 10px rgba(0,0,0,0.8))`
              : 'drop-shadow(0 4px 8px rgba(0,0,0,0.75))'
          }}
        >
          <defs>
            {/* Gold metallic gradient for raised PVC outer border & lettering */}
            <linearGradient id={`pvcGoldGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF2A3" />
              <stop offset="25%" stopColor="#EAB308" />
              <stop offset="50%" stopColor="#CA8A04" />
              <stop offset="75%" stopColor="#FACC15" />
              <stop offset="100%" stopColor="#854D0E" />
            </linearGradient>

            {/* Dark PVC texture & beveled surface gradient */}
            <radialGradient id={`pvcBgGrad_${uid}`} cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#1e2430" />
              <stop offset="60%" stopColor="#111622" />
              <stop offset="100%" stopColor="#080b12" />
            </radialGradient>

            {/* Central oval yellow background */}
            <linearGradient id={`senyeraBgGrad_${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFF066" />
              <stop offset="50%" stopColor="#F5B800" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>

            {/* Vivid police red for lit stripes */}
            <linearGradient id={`litRedStripe_${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF4A38" />
              <stop offset="35%" stopColor="#DA291C" />
              <stop offset="100%" stopColor="#991B1B" />
            </linearGradient>

            {/* Soft unlit stripe appearance (subtle embossed gold on yellow) */}
            <linearGradient id={`unlitStripe_${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#CA8A04" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#854D0E" stopOpacity="0.5" />
            </linearGradient>

            {/* Glow filter */}
            <filter id={`stripeGlow_${uid}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Clip path for the central Senyera oval */}
            <clipPath id={`senyeraOvalClip_${uid}`}>
              <ellipse cx="110" cy="130" rx="34" ry="40" />
            </clipPath>

            {/* Text path for POLICIA (Arched along top) */}
            <path
              id={`pathPolicia_${uid}`}
              d="M 38,62 Q 110,42 182,62"
              fill="none"
            />

            {/* Text path for MOSSOS D'ESQUADRA (Arched along bottom) */}
            <path
              id={`pathMossos_${uid}`}
              d="M 28,198 C 50,246 170,246 192,198"
              fill="none"
            />
          </defs>

          {/* 1. OUTER SHIELD SILHOUETTE (Authentic Mossos PVC Crest contour)
              - Arched top: starts (110,12), curves to right ear (196,28)
              - Indented side: curves inward at waist (182,125), then flares out (198,180)
              - Rounded bottom: curves smoothly down to (110,250) and back up symmetrically
          */}
          <path
            d="M 110,12 
               C 142,12 178,20 196,28
               C 192,55 186,85 183,115
               C 180,130 186,155 198,185
               C 194,212 165,242 110,252
               C 55,242 26,212 22,185
               C 34,155 40,130 37,115
               C 34,85 28,55 24,28
               C 42,20 78,12 110,12 Z"
            fill={`url(#pvcBgGrad_${uid})`}
            stroke={`url(#pvcGoldGrad_${uid})`}
            strokeWidth="4.5"
            strokeLinejoin="round"
          />

          {/* Inner Recessed Bevel Border */}
          <path
            d="M 110,18 
               C 140,18 172,25 189,33
               C 185,58 180,86 177,115
               C 174,130 180,154 191,181
               C 187,206 160,234 110,244
               C 60,234 33,206 29,181
               C 40,154 46,130 43,115
               C 40,86 35,58 31,33
               C 48,25 80,18 110,18 Z"
            fill="none"
            stroke={`url(#pvcGoldGrad_${uid})`}
            strokeWidth="1.8"
            opacity="0.85"
          />

          {/* Stitched PVC Trench Dots/Perforations */}
          <path
            d="M 110,22 
               C 138,22 168,28 184,36
               C 180,60 176,87 173,115
               C 170,130 176,152 186,178
               C 182,201 156,228 110,238
               C 64,228 38,201 34,178
               C 44,152 50,130 47,115
               C 44,87 40,60 36,36
               C 52,28 82,22 110,22 Z"
            fill="none"
            stroke="#FACC15"
            strokeWidth="0.8"
            strokeDasharray="2.5 3"
            opacity="0.65"
          />

          {/* 2. UPPER TEXT: POLICIA */}
          <text
            fill={`url(#pvcGoldGrad_${uid})`}
            fontSize="18"
            fontWeight="900"
            fontFamily="'Outfit', sans-serif"
            letterSpacing="5"
            filter="drop-shadow(0 1px 2px rgba(0,0,0,0.95))"
          >
            <textPath href={`#pathPolicia_${uid}`} startOffset="50%" textAnchor="middle">
              POLICIA
            </textPath>
          </text>

          {/* 3. CENTRAL OVAL MEDALLION & LAUREL FLANKING (Official crest detail) */}
          <g transform="translate(110, 130)">
            {/* Laurel sprigs flanking medallion */}
            <g fill={`url(#pvcGoldGrad_${uid})`} opacity="0.9">
              {/* Left laurel leaves */}
              <path d="M -38,-15 C -46,-22 -44,-8 -37,2 C -45,10 -42,22 -34,26 C -37,14 -35,4 -36,-4 Z" />
              <path d="M -32,-28 C -40,-32 -41,-22 -37,-14 C -34,-20 -31,-24 -32,-28 Z" />
              <path d="M -24,30 C -30,36 -20,40 -14,36 C -18,34 -22,32 -24,30 Z" />

              {/* Right laurel leaves */}
              <path d="M 38,-15 C 46,-22 44,-8 37,2 C 45,10 42,22 34,26 C 37,14 35,4 36,-4 Z" />
              <path d="M 32,-28 C 40,-32 41,-22 37,-14 C 34,-20 31,-24 32,-28 Z" />
              <path d="M 24,30 C 30,36 20,40 14,36 C 18,34 22,32 24,30 Z" />
            </g>
          </g>

          {/* Medallion Outer Gold Ring Frame */}
          <ellipse
            cx="110"
            cy="130"
            rx="37"
            ry="43"
            fill="none"
            stroke={`url(#pvcGoldGrad_${uid})`}
            strokeWidth="3.2"
          />
          <ellipse
            cx="110"
            cy="130"
            rx="34.5"
            ry="40.5"
            fill={`url(#senyeraBgGrad_${uid})`}
            stroke="#854D0E"
            strokeWidth="1"
          />

          {/* 4. LES QUATRE BARRES (THE 4 VERTICAL RED STRIPES) */}
          <g clipPath={`url(#senyeraOvalClip_${uid})`}>
            {/* Base Yellow/Gold Background */}
            <rect x="70" y="80" width="80" height="100" fill={`url(#senyeraBgGrad_${uid})`} />

            {/* BARRA 1 (Leftmost) */}
            <g>
              <rect
                x="87"
                y="80"
                width="8.5"
                height="100"
                fill={safeStripes >= 1 ? `url(#litRedStripe_${uid})` : `url(#unlitStripe_${uid})`}
                stroke={safeStripes >= 1 ? '#7F1D1D' : '#854D0E'}
                strokeWidth={safeStripes >= 1 ? '0.8' : '0.4'}
                filter={safeStripes >= 1 ? `url(#stripeGlow_${uid})` : undefined}
                className={safeStripes >= 1 && animated ? 'transition-all duration-500' : ''}
              />
              {safeStripes >= 1 && (
                <line x1="91" y1="92" x2="91" y2="168" stroke="#FF9988" strokeWidth="1" opacity="0.6" />
              )}
            </g>

            {/* BARRA 2 */}
            <g>
              <rect
                x="100"
                y="80"
                width="8.5"
                height="100"
                fill={safeStripes >= 2 ? `url(#litRedStripe_${uid})` : `url(#unlitStripe_${uid})`}
                stroke={safeStripes >= 2 ? '#7F1D1D' : '#854D0E'}
                strokeWidth={safeStripes >= 2 ? '0.8' : '0.4'}
                filter={safeStripes >= 2 ? `url(#stripeGlow_${uid})` : undefined}
                className={safeStripes >= 2 && animated ? 'transition-all duration-500' : ''}
              />
              {safeStripes >= 2 && (
                <line x1="104" y1="90" x2="104" y2="170" stroke="#FF9988" strokeWidth="1" opacity="0.6" />
              )}
            </g>

            {/* BARRA 3 */}
            <g>
              <rect
                x="113"
                y="80"
                width="8.5"
                height="100"
                fill={safeStripes >= 3 ? `url(#litRedStripe_${uid})` : `url(#unlitStripe_${uid})`}
                stroke={safeStripes >= 3 ? '#7F1D1D' : '#854D0E'}
                strokeWidth={safeStripes >= 3 ? '0.8' : '0.4'}
                filter={safeStripes >= 3 ? `url(#stripeGlow_${uid})` : undefined}
                className={safeStripes >= 3 && animated ? 'transition-all duration-500' : ''}
              />
              {safeStripes >= 3 && (
                <line x1="117" y1="90" x2="117" y2="170" stroke="#FF9988" strokeWidth="1" opacity="0.6" />
              )}
            </g>

            {/* BARRA 4 (Rightmost) */}
            <g>
              <rect
                x="126"
                y="80"
                width="8.5"
                height="100"
                fill={safeStripes >= 4 ? `url(#litRedStripe_${uid})` : `url(#unlitStripe_${uid})`}
                stroke={safeStripes >= 4 ? '#7F1D1D' : '#854D0E'}
                strokeWidth={safeStripes >= 4 ? '0.8' : '0.4'}
                filter={safeStripes >= 4 ? `url(#stripeGlow_${uid})` : undefined}
                className={safeStripes >= 4 && animated ? 'transition-all duration-500' : ''}
              />
              {safeStripes >= 4 && (
                <line x1="130" y1="92" x2="130" y2="168" stroke="#FF9988" strokeWidth="1" opacity="0.6" />
              )}
            </g>
          </g>

          {/* 5. LOWER TEXT: MOSSOS D'ESQUADRA */}
          <text
            fill={`url(#pvcGoldGrad_${uid})`}
            fontSize="10"
            fontWeight="900"
            fontFamily="'Outfit', sans-serif"
            letterSpacing="2.2"
            filter="drop-shadow(0 1px 2px rgba(0,0,0,0.95))"
          >
            <textPath href={`#pathMossos_${uid}`} startOffset="50%" textAnchor="middle">
              MOSSOS D'ESQUADRA
            </textPath>
          </text>
        </svg>
      </div>

      {label && (
        <span className="text-[11px] font-black text-amber-300 mt-1 uppercase tracking-wider bg-slate-900/90 px-2 py-0.5 rounded-full border border-amber-500/30">
          {label}
        </span>
      )}
    </div>
  );
};
