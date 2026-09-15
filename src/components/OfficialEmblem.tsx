import React from 'react';

interface OfficialEmblemProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

export const OfficialEmblem: React.FC<OfficialEmblemProps> = ({ 
  size = 140, 
  className = '',
  glow = true 
}) => {
  return (
    <div 
      className={`inline-block relative select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg 
        viewBox="0 0 400 400" 
        className="w-full h-full drop-shadow-lg"
        style={{
          filter: glow 
            ? 'drop-shadow(0 0 16px rgba(245, 158, 11, 0.45)) drop-shadow(0 4px 10px rgba(0,0,0,0.8))' 
            : 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))'
        }}
      >
        <defs>
          <linearGradient id="goldCrownGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#A16207" />
          </linearGradient>
          <linearGradient id="goldRayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="30%" stopColor="#FACC15" />
            <stop offset="70%" stopColor="#CA8A04" />
            <stop offset="100%" stopColor="#854D0E" />
          </linearGradient>
          <linearGradient id="shieldDarkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0B132B" />
            <stop offset="50%" stopColor="#080C1A" />
            <stop offset="100%" stopColor="#030712" />
          </linearGradient>
          <linearGradient id="bannerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#111827" />
            <stop offset="100%" stopColor="#030712" />
          </linearGradient>
          <filter id="emblemShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.8" />
          </filter>
        </defs>

        {/* 1. RAIGS DAURATS RADIATS EXTERIORS (SOL POLICIAL) */}
        <g transform="translate(200, 215)">
          {Array.from({ length: 40 }).map((_, i) => {
            const angle = (i * 360) / 40;
            const isLong = i % 2 === 0;
            return (
              <path
                key={i}
                d={isLong ? "M -9, -152 L 0, -178 L 9, -152 L 5, -125 L -5, -125 Z" : "M -7, -145 L 0, -165 L 7, -145 L 4, -125 L -4, -125 Z"}
                fill="url(#goldRayGrad)"
                stroke="#713f12"
                strokeWidth="0.8"
                transform={`rotate(${angle})`}
              />
            );
          })}
        </g>

        {/* 2. CORONA MURAL SUPERIOR (POLICIA LOCAL) */}
        <g transform="translate(200, 72)">
          {/* Base de la corona mural */}
          <path
            d="M -60, -20 L -50, -62 L -34, -62 L -30, -38 L -14, -38 L -10, -70 L 10, -70 L 14, -38 L 30, -38 L 34, -62 L 50, -62 L 60, -20 Z"
            fill="url(#goldCrownGrad)"
            stroke="#78350F"
            strokeWidth="2"
            filter="url(#emblemShadow)"
          />
          {/* Línies de blocs i finestres de la muralla */}
          <rect x="-44" y="-32" width="6" height="8" rx="2" fill="#451A03" />
          <rect x="-18" y="-32" width="6" height="8" rx="2" fill="#451A03" />
          <rect x="12" y="-32" width="6" height="8" rx="2" fill="#451A03" />
          <rect x="38" y="-32" width="6" height="8" rx="2" fill="#451A03" />
          <path d="M -50,-24 L 50,-24" stroke="#78350F" strokeWidth="1.5" />
        </g>

        {/* 3. ESCUT OVALAT PRINCIPAL CENTRAL (FONS FOSC DE POLICIA) */}
        <g transform="translate(200, 215)">
          {/* Marc exterior daurat amb vora */}
          <path
            d="M 0,-140 C 95,-140 145,-75 145,20 C 145,95 85,150 0,170 C -85,150 -145,95 -145,20 C -145,-75 -95,-140 0,-140 Z"
            fill="url(#shieldDarkGrad)"
            stroke="url(#goldRayGrad)"
            strokeWidth="8"
            filter="url(#emblemShadow)"
          />
          <path
            d="M 0,-132 C 88,-132 135,-70 135,18 C 135,88 80,140 0,160 C -80,140 -135,88 -135,18 C -135,-70 -88,-132 0,-132 Z"
            fill="none"
            stroke="#FDE047"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
        </g>

        {/* 4. PART SUPERIOR: "POLICIA LOCAL", LLORER I ESCUT MUNICIPAL */}
        <g transform="translate(200, 155)">
          {/* Arc de text POLICIA LOCAL */}
          <path id="curvePoliciaLocal" d="M -110,-12 C -60,-55 60,-55 110,-12" fill="none" />
          <text fill="#F8FAFC" fontSize="19" fontWeight="900" fontFamily="'Space Grotesk', sans-serif" letterSpacing="3">
            <textPath href="#curvePoliciaLocal" startOffset="50%" textAnchor="middle">
              POLICIA LOCAL
            </textPath>
          </text>

          {/* Llorer esquerre */}
          <g transform="translate(-48, 12)">
            <ellipse cx="0" cy="-14" rx="4" ry="8" fill="#F8FAFC" transform="rotate(-35)" />
            <ellipse cx="-4" cy="-4" rx="4" ry="8" fill="#F8FAFC" transform="rotate(-20)" />
            <ellipse cx="-2" cy="8" rx="4" ry="8" fill="#F8FAFC" transform="rotate(-5)" />
          </g>

          {/* Llorer dret */}
          <g transform="translate(48, 12)">
            <ellipse cx="0" cy="-14" rx="4" ry="8" fill="#F8FAFC" transform="rotate(35)" />
            <ellipse cx="4" cy="-4" rx="4" ry="8" fill="#F8FAFC" transform="rotate(20)" />
            <ellipse cx="2" cy="8" rx="4" ry="8" fill="#F8FAFC" transform="rotate(5)" />
          </g>

          {/* Escut petit municipal al centre amb corona i tauler escacat */}
          <g transform="translate(0, 8)">
            {/* Corona petita */}
            <path d="M -22,-24 L -18,-35 L -10,-28 L 0,-37 L 10,-28 L 18,-35 L 22,-24 Z" fill="#FACC15" stroke="#78350F" strokeWidth="1" />
            {/* Contorn escut blanc */}
            <path d="M -24,-22 L 24,-22 L 24,0 C 24,18 0,30 0,30 C 0,30 -24,18 -24,0 Z" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
            {/* Tauler en rombe al centre */}
            <g transform="rotate(45)">
              <rect x="-10" y="-10" width="10" height="10" fill="#000000" />
              <rect x="0" y="-10" width="10" height="10" fill="#FFFFFF" />
              <rect x="-10" y="0" width="10" height="10" fill="#FFFFFF" />
              <rect x="0" y="0" width="10" height="10" fill="#000000" />
            </g>
          </g>
        </g>

        {/* 5. FRANJA / BANNER CENTRAL: "MEED" */}
        <g transform="translate(200, 215)">
          {/* Marc de la cinta horitzontal amb vora daurada */}
          <path
            d="M -150,-24 L -130,-30 L 130,-30 L 150,-24 L 140,24 L 125,30 L -125,30 L -140,24 Z"
            fill="url(#bannerGrad)"
            stroke="url(#goldRayGrad)"
            strokeWidth="4"
            filter="url(#emblemShadow)"
          />
          {/* Text MEED (ME en blau elèctric, ED en vermell carmesí oficial) */}
          <text 
            x="0" 
            y="17" 
            textAnchor="middle" 
            fontFamily="'Space Grotesk', 'Arial Black', sans-serif" 
            fontWeight="900" 
            fontSize="54" 
            letterSpacing="4"
          >
            <tspan fill="#0284C7">ME</tspan>
            <tspan fill="#DC2626">ED</tspan>
          </text>
        </g>

        {/* 6. PART INFERIOR: SENYERA I "mossos d'esquadra" */}
        <g transform="translate(200, 298)">
          {/* La Senyera en cercle daurat amb ornaments florals */}
          <g>
            {/* Ornaments florals daurats als costats */}
            <path d="M -38,-10 C -48,-15 -48,15 -38,10 C -34,2 -34,-2 -38,-10 Z" fill="#CA8A04" />
            <path d="M 38,-10 C 48,-15 48,15 38,10 C 34,2 34,-2 38,-10 Z" fill="#CA8A04" />

            {/* Cercle Senyera */}
            <circle cx="0" cy="0" r="28" fill="#FACC15" stroke="#EAB308" strokeWidth="2.5" />
            {/* 4 barres vermelles verticals */}
            <g clipPath="url(#senyeraClip)">
              <rect x="-18" y="-28" width="5" height="56" fill="#DC2626" />
              <rect x="-6" y="-28" width="5" height="56" fill="#DC2626" />
              <rect x="6" y="-28" width="5" height="56" fill="#DC2626" />
              <rect x="18" y="-28" width="5" height="56" fill="#DC2626" />
            </g>
            <clipPath id="senyeraClip">
              <circle cx="0" cy="0" r="27" />
            </clipPath>
          </g>

          {/* Arc de text: mossos d'esquadra */}
          <path id="curveMossos" d="M -115,-8 C -80,48 80,48 115,-8" fill="none" />
          <text fill="#FEF08A" fontSize="17" fontWeight="800" fontFamily="'Space Grotesk', sans-serif" letterSpacing="2">
            <textPath href="#curveMossos" startOffset="50%" textAnchor="middle">
              mossos d'esquadra
            </textPath>
          </text>
        </g>
      </svg>
    </div>
  );
};
