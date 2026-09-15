import React from 'react';

interface TedaxBadgeProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

export const TedaxBadge: React.FC<TedaxBadgeProps> = ({ size = 160, className = '', glow = false }) => {
  // Parche ovalado oficial negro con borde amarillo, texto "TEDAX NRBQ", 
  // 4 barretas rojas a la izquierda y emblema central (boina roja con espadas cruzadas y llama).
  return (
    <div 
      className={`inline-block relative select-none ${className}`}
      style={{ width: size, height: size * 0.75 }}
    >
      <svg
        viewBox="0 0 320 240"
        className="w-full h-full drop-shadow-md"
        style={{
          filter: glow ? 'drop-shadow(0 0 14px rgba(234, 179, 8, 0.6))' : 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))'
        }}
      >
        <defs>
          <linearGradient id="yellowBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FACC15" />
            <stop offset="50%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#CA8A04" />
          </linearGradient>
          <linearGradient id="innerYellowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="100%" stopColor="#EAB308" />
          </linearGradient>
          <linearGradient id="flameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#DC2626" />
            <stop offset="45%" stopColor="#EA580C" />
            <stop offset="85%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#FEF08A" />
          </linearGradient>
          <linearGradient id="silverBlade" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F1F5F9" />
            <stop offset="50%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>
          <filter id="badgeShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* Borde exterior bordado amarillo */}
        <ellipse cx="160" cy="120" rx="155" ry="112" fill="none" stroke="url(#yellowBorderGrad)" strokeWidth="9" strokeDasharray="3 1" />
        <ellipse cx="160" cy="120" rx="150" ry="107" fill="#0c0d10" stroke="#1c1d22" strokeWidth="2" />
        
        {/* Línea decorativa interior dorada fina */}
        <ellipse cx="160" cy="120" rx="142" ry="99" fill="none" stroke="url(#innerYellowGrad)" strokeWidth="2.5" />

        {/* 4 BARRETAS ROJAS A LA IZQUIERDA (SENYERA) */}
        <g transform="translate(32, 70)">
          {/* Fondo o marco dorado para las barres */}
          <rect x="0" y="0" width="38" height="100" rx="4" fill="#1e1e24" stroke="#eab308" strokeWidth="1.5" />
          {/* Barra 1 */}
          <rect x="4" y="5" width="5.5" height="90" rx="2" fill="#dc2626" />
          {/* Barra 2 */}
          <rect x="13" y="5" width="5.5" height="90" rx="2" fill="#dc2626" />
          {/* Barra 3 */}
          <rect x="22" y="5" width="5.5" height="90" rx="2" fill="#dc2626" />
          {/* Barra 4 */}
          <rect x="30.5" y="5" width="5.5" height="90" rx="2" fill="#dc2626" />
        </g>

        {/* TEXTO SUPERIOR: TEDAX */}
        <g>
          <text 
            x="180" 
            y="52" 
            textAnchor="middle" 
            fill="url(#innerYellowGrad)" 
            fontFamily="'Space Grotesk', 'Arial Black', sans-serif" 
            fontWeight="900" 
            fontSize="30" 
            letterSpacing="6"
            filter="url(#badgeShadow)"
          >
            TEDAX
          </text>
        </g>

        {/* TEXTO INFERIOR: NRBQ */}
        <g>
          <text 
            x="180" 
            y="204" 
            textAnchor="middle" 
            fill="url(#innerYellowGrad)" 
            fontFamily="'Space Grotesk', 'Arial Black', sans-serif" 
            fontWeight="900" 
            fontSize="26" 
            letterSpacing="8"
            filter="url(#badgeShadow)"
          >
            NRBQ
          </text>
        </g>

        {/* EMBLEMA CENTRAL: BOINA ROJA AMB DUES ESPASES CREUADES I FLAMA */}
        <g transform="translate(180, 122)">
          {/* Resplandor / Explosió de fons */}
          <circle cx="0" cy="0" r="44" fill="#000000" stroke="#ca8a04" strokeWidth="1" opacity="0.6" />

          {/* LLAMA / FLAMA DE L'ARTEFACTE EXPLOSIU */}
          <path
            d="M 0,-42 C 10,-32 18,-20 12,-8 C 16,-12 18,-18 20,-10 C 22,2 14,12 8,16 C 14,14 18,8 18,2 C 18,-4 14,-10 16,-18 C 10,-8 4,4 0,8 C -4,4 -10,-8 -16,-18 C -14,-10 -18,-4 -18,2 C -18,8 -14,14 -8,16 C -14,12 -22,2 -20,-10 C -18,-18 -16,-12 -12,-8 C -18,-20 -10,-32 0,-42 Z"
            fill="url(#flameGrad)"
            filter="url(#badgeShadow)"
          />
          {/* Nucli interior de la flama */}
          <path
            d="M 0,-28 C 5,-20 10,-12 6,-2 C 8,-6 10,-10 10,-4 C 10,2 6,8 2,10 C 6,8 8,4 8,0 C 4,0 2,4 0,6 C -2,4 -4,0 -8,0 C -8,4 -6,8 -2,10 C -6,8 -10,2 -10,-4 C -10,-10 -8,-6 -6,-2 C -10,-12 -5,-20 0,-28 Z"
            fill="#FEF08A"
          />

          {/* ESPASA 1 (Diagonal /) */}
          <g transform="rotate(45)">
            {/* Fulla */}
            <path d="M -2.5,-38 L 2.5,-38 L 2,24 L -2,24 Z" fill="url(#silverBlade)" />
            {/* Punta */}
            <path d="M -2.5,-38 L 0,-44 L 2.5,-38 Z" fill="#F8FAFC" />
            {/* Guarda daurada */}
            <rect x="-10" y="24" width="20" height="4.5" rx="1.5" fill="#EAB308" stroke="#CA8A04" strokeWidth="0.5" />
            {/* Empunyadura */}
            <rect x="-2" y="28.5" width="4" height="12" fill="#78350F" />
            {/* Pom */}
            <circle cx="0" cy="42" r="3.5" fill="#EAB308" stroke="#CA8A04" strokeWidth="0.5" />
          </g>

          {/* ESPASA 2 (Diagonal \) */}
          <g transform="rotate(-45)">
            {/* Fulla */}
            <path d="M -2.5,-38 L 2.5,-38 L 2,24 L -2,24 Z" fill="url(#silverBlade)" />
            {/* Punta */}
            <path d="M -2.5,-38 L 0,-44 L 2.5,-38 Z" fill="#F8FAFC" />
            {/* Guarda daurada */}
            <rect x="-10" y="24" width="20" height="4.5" rx="1.5" fill="#EAB308" stroke="#CA8A04" strokeWidth="0.5" />
            {/* Empunyadura */}
            <rect x="-2" y="28.5" width="4" height="12" fill="#78350F" />
            {/* Pom */}
            <circle cx="0" cy="42" r="3.5" fill="#EAB308" stroke="#CA8A04" strokeWidth="0.5" />
          </g>

          {/* BOINA ROJA DE MOSSOS D'ESQUADRA */}
          <g transform="translate(0, 2)">
            {/* Plec de la boina vermella */}
            <path
              d="M -24,-4 C -22,-16 0,-20 18,-14 C 28,-10 32,-2 26,6 C 20,12 -2,12 -18,8 C -24,6 -26,2 -24,-4 Z"
              fill="#B91C1C"
              stroke="#7F1D1D"
              strokeWidth="1.5"
              filter="url(#badgeShadow)"
            />
            {/* Volum superior de la boina */}
            <path
              d="M -20,-3 C -14,-14 2,-16 16,-11 C 24,-8 25,-1 18,2 C 10,4 -6,4 -16,2 Z"
              fill="#DC2626"
            />
            {/* Banda inferior negra de la boina */}
            <path
              d="M -18,6 C -10,9 6,9 18,5 C 19,7 18,9 17,10 C 6,13 -9,13 -17,8 Z"
              fill="#1E293B"
              stroke="#0F172A"
              strokeWidth="0.8"
            />
            {/* Detall insígnia mini a la boina */}
            <circle cx="-6" cy="1" r="3" fill="#EAB308" />
            <circle cx="-6" cy="1" r="1.5" fill="#B91C1C" />
          </g>
        </g>
      </svg>
    </div>
  );
};
