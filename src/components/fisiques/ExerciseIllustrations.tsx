import React from 'react';

interface IllustrationProps {
  className?: string;
  isAnimated?: boolean;
}

/**
 * 1. Press de Banca amb Barra
 * Atleta estirat sobre el banc horitzontal, sostenint la barra amb discos sobre el pit
 */
export const BenchPressIllustration: React.FC<IllustrationProps> = ({ className = 'w-24 h-24', isAnimated = false }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        {/* Banc de musculació */}
        <rect x="25" y="78" width="70" height="7" rx="3.5" fill="#1e293b" />
        <rect x="35" y="85" width="8" height="22" rx="2" fill="#334155" />
        <rect x="77" y="85" width="8" height="22" rx="2" fill="#334155" />
        <rect x="28" y="105" width="64" height="4" rx="2" fill="#0f172a" />
        
        {/* Suports de barra (racks) */}
        <rect x="80" y="45" width="5" height="35" rx="1" fill="#475569" />
        <path d="M78 45 L87 45 L87 50 L83 50 L83 55 L78 55 Z" fill="#64748b" />

        {/* Cos de l'atleta estirat */}
        {/* Cap recolzat al banc */}
        <circle cx="37" cy="71" r="7.5" fill="#f87171" />
        <circle cx="36" cy="71" r="6.5" fill="#fca5a5" />
        {/* Tronc i pit */}
        <rect x="44" y="67" width="28" height="12" rx="5" fill="#0284c7" />
        {/* Pantaló / maluc */}
        <rect x="69" y="69" width="14" height="10" rx="3" fill="#1e1b4b" />
        {/* Cames doblades tocant a terra */}
        <path d="M78 77 L88 85 L87 106" stroke="#0284c7" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Peu recolzat fermament a terra */}
        <rect x="84" y="104" width="11" height="4" rx="2" fill="#0f172a" />

        {/* Braços sostenint la barra */}
        <g className={isAnimated ? 'animate-bounce' : ''}>
          {/* Braç i avantbraç */}
          <path d="M54 70 L52 56 L62 48" stroke="#fca5a5" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M58 70 L62 58 L62 48" stroke="#f87171" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Barra olímpica */}
          <line x1="20" y1="46" x2="100" y2="46" stroke="#94a3b8" strokeWidth="3.5" strokeLinecap="round" />
          {/* Maneguets de la barra */}
          <rect x="30" y="44" width="3" height="4" fill="#cbd5e1" />
          <rect x="87" y="44" width="3" height="4" fill="#cbd5e1" />
          {/* Discos de pes (esquerra i dreta) */}
          <rect x="23" y="32" width="6" height="28" rx="2" fill="#e11d48" />
          <rect x="91" y="32" width="6" height="28" rx="2" fill="#e11d48" />
          <rect x="20" y="36" width="3" height="20" rx="1.5" fill="#fb7185" />
          <rect x="97" y="36" width="3" height="20" rx="1.5" fill="#fb7185" />
        </g>
      </svg>
    </div>
  );
};

/**
 * 2. Flexions de Tríceps (Diamant o tancades)
 * Atleta a terra en posició de planxa/flexió estricta amb colzes enganxats
 */
export const TricepsPushupIllustration: React.FC<IllustrationProps> = ({ className = 'w-24 h-24', isAnimated = false }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        {/* Terra / Matalasseta */}
        <rect x="15" y="98" width="90" height="4" rx="2" fill="#334155" />
        
        {/* Punts de recolzament a terra */}
        <line x1="18" y1="99" x2="102" y2="99" stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />

        <g className={isAnimated ? 'animate-pulse' : ''}>
          {/* Peus i puntes a terra */}
          <circle cx="26" cy="94" r="4.5" fill="#0f172a" />
          
          {/* Cames en línia recta */}
          <path d="M26 94 L50 83" stroke="#0284c7" strokeWidth="6" strokeLinecap="round" />
          
          {/* Maluc i glutis */}
          <ellipse cx="52" cy="81" rx="7" ry="5.5" fill="#1e1b4b" />
          
          {/* Tronc i esquena en bloc */}
          <path d="M52 80 L76 71" stroke="#0284c7" strokeWidth="8" strokeLinecap="round" />
          
          {/* Cap mirant endavant-avall */}
          <circle cx="86" cy="65" r="7.5" fill="#fca5a5" />
          {/* Pèl */}
          <path d="M82 60 Q87 57 91 61 Q93 66 91 68" stroke="#1e293b" strokeWidth="2.5" fill="#1e293b" />

          {/* Braços fent la flexió tancada de tríceps */}
          {/* Braç dret */}
          <path d="M72 73 L74 84 L72 97" stroke="#f87171" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Braç esquerre amb colze doblegat a 90 graus enrere */}
          <path d="M76 72 L79 83 L77 97" stroke="#fca5a5" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Mans a terra en forma diamant/tancada */}
          <rect x="71" y="96" width="9" height="3" rx="1.5" fill="#0f172a" />

          {/* Línia d'èmfasi muscular al tríceps */}
          <path d="M76 75 L78 81" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
};

/**
 * 3. Fons per a Tríceps i Pit Inferior (Dips a banc o paral·leles)
 * Atleta en posició de fons suspesos amb flexió de colzes i inclinació
 */
export const DipsIllustration: React.FC<IllustrationProps> = ({ className = 'w-24 h-24', isAnimated = false }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        {/* Terra */}
        <rect x="20" y="104" width="80" height="4" rx="2" fill="#334155" />

        {/* Banc o estructura de suport posterior */}
        <rect x="25" y="68" width="30" height="8" rx="2.5" fill="#1e293b" />
        <rect x="28" y="76" width="6" height="28" rx="1" fill="#475569" />
        <rect x="46" y="76" width="6" height="28" rx="1" fill="#475569" />

        <g className={isAnimated ? 'animate-bounce' : ''}>
          {/* Mans recolzades a la vora del banc */}
          <rect x="50" y="66" width="7" height="4" rx="2" fill="#f87171" />

          {/* Braços amb èmfasi als tríceps (colzes doblats a 90 graus) */}
          <path d="M53 68 L53 52 L62 50" stroke="#fca5a5" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Tronc d'atleta vertical / lleugerament inclinat per al pit inferior */}
          <path d="M62 49 L65 72" stroke="#0284c7" strokeWidth="8" strokeLinecap="round" />
          
          {/* Cap */}
          <circle cx="63" cy="38" r="7.5" fill="#fca5a5" />
          <path d="M58 34 Q64 30 68 34" stroke="#1e293b" strokeWidth="2.5" />

          {/* Maluc i cames esteses endavant amb talons al terra */}
          <ellipse cx="66" cy="73" rx="6" ry="5" fill="#1e1b4b" />
          <path d="M67 74 L84 84 L94 102" stroke="#0284c7" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Talons ferms a terra */}
          <rect x="91" y="101" width="8" height="4" rx="2" fill="#0f172a" />

          {/* Indicadors de treball muscular (Tríceps + Pit) */}
          <circle cx="53" cy="58" r="2.5" fill="#f59e0b" />
          <circle cx="63" cy="54" r="2.5" fill="#ef4444" />
        </g>
      </svg>
    </div>
  );
};

/**
 * 4. Circuït d'Agilitat Oficial
 * Cons, tanques a saltar/passar per sota i traçada
 */
export const CircuitIllustration: React.FC<IllustrationProps> = ({ className = 'w-24 h-24' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        {/* Pista poliesportiva amb línies */}
        <rect x="10" y="20" width="100" height="80" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="2" />
        
        {/* Traçada del circuit en bucle (8) amb fletxes */}
        <path 
          d="M25 80 Q 25 35 60 50 Q 95 65 95 35 Q 95 25 75 30 Q 40 50 25 80" 
          stroke="#f59e0b" 
          strokeWidth="2.5" 
          strokeDasharray="4 3" 
          strokeLinecap="round" 
        />
        
        {/* Cons de sortida i viratge */}
        {/* Con 1 */}
        <polygon points="25,82 21,90 29,90" fill="#f97316" />
        <rect x="20" y="90" width="10" height="2" fill="#ea580c" />

        {/* Con 2 */}
        <polygon points="95,32 91,40 99,40" fill="#f97316" />
        <rect x="90" y="40" width="10" height="2" fill="#ea580c" />

        {/* Tanques (hurdles) oficials a 0.70m */}
        <g>
          {/* Tanca 1 */}
          <rect x="42" y="38" width="18" height="3" rx="1" fill="#ef4444" />
          <line x1="44" y1="41" x2="44" y2="48" stroke="#cbd5e1" strokeWidth="2" />
          <line x1="58" y1="41" x2="58" y2="48" stroke="#cbd5e1" strokeWidth="2" />
          <text x="45" y="36" fill="#fca5a5" fontSize="6" fontWeight="bold">0.70m</text>
        </g>

        <g>
          {/* Tanca 2 */}
          <rect x="68" y="68" width="18" height="3" rx="1" fill="#ef4444" />
          <line x1="70" y1="71" x2="70" y2="78" stroke="#cbd5e1" strokeWidth="2" />
          <line x1="84" y1="71" x2="84" y2="78" stroke="#cbd5e1" strokeWidth="2" />
        </g>

        {/* Matalàs de caiguda / salt */}
        <rect x="52" y="76" width="14" height="8" rx="2" fill="#0284c7" opacity="0.8" />
        
        {/* Línia de sortida / arribada */}
        <line x1="18" y1="84" x2="32" y2="84" stroke="#ffffff" strokeWidth="2" strokeDasharray="2 2" />
        <circle cx="25" cy="84" r="3" fill="#10b981" />
      </svg>
    </div>
  );
};

/**
 * 5. Cursa Llançadora / Course Navette (20 metres)
 */
export const CourseNavetteIllustration: React.FC<IllustrationProps> = ({ className = 'w-24 h-24' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        {/* Pista de 20 metres */}
        <rect x="15" y="30" width="90" height="60" rx="6" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />
        
        {/* Línies límit dels 20m a banda i banda */}
        <line x1="28" y1="35" x2="28" y2="85" stroke="#ef4444" strokeWidth="3" />
        <line x1="92" y1="35" x2="92" y2="85" stroke="#ef4444" strokeWidth="3" />
        <text x="22" y="93" fill="#94a3b8" fontSize="7" fontWeight="bold">0m</text>
        <text x="86" y="93" fill="#94a3b8" fontSize="7" fontWeight="bold">20m</text>

        {/* Fletxa doble de 20 metres d'anada i tornada */}
        <path d="M34 50 L86 50" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
        <polygon points="86,47 91,50 86,53" fill="#38bdf8" />
        <polygon points="34,47 29,50 34,53" fill="#38bdf8" />

        {/* Corredor en ple sprint */}
        <circle cx="60" cy="58" r="5" fill="#fca5a5" />
        <path d="M59 63 L61 74" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" />
        <path d="M60 67 L53 71" stroke="#fca5a5" strokeWidth="3" strokeLinecap="round" />
        <path d="M60 67 L68 64" stroke="#fca5a5" strokeWidth="3" strokeLinecap="round" />
        <path d="M61 74 L54 82" stroke="#1e1b4b" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M61 74 L69 79 L71 85" stroke="#1e1b4b" strokeWidth="3.5" strokeLinecap="round" />

        {/* Indicador d'ones de xiulet / so oficial */}
        <path d="M84 38 Q 88 42 84 46" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M87 35 Q 93 42 87 49" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
};

/**
 * 6. Escalfament i Mobilitat Articular
 * Atleta dempeus fent rotació i mobilitat d'espatlles i maneguet rotador
 */
export const WarmupIllustration: React.FC<IllustrationProps> = ({ className = 'w-24 h-24', isAnimated = false }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        {/* Terra */}
        <line x1="30" y1="105" x2="90" y2="105" stroke="#334155" strokeWidth="3" strokeLinecap="round" />

        {/* Atleta dempeus en postura d'escalfament */}
        {/* Cames */}
        <path d="M52 75 L48 103" stroke="#0284c7" strokeWidth="5.5" strokeLinecap="round" />
        <path d="M68 75 L72 103" stroke="#0284c7" strokeWidth="5.5" strokeLinecap="round" />
        {/* Calçat */}
        <rect x="42" y="101" width="9" height="4" rx="2" fill="#0f172a" />
        <rect x="69" y="101" width="9" height="4" rx="2" fill="#0f172a" />

        {/* Maluc i tronc */}
        <rect x="48" y="65" width="24" height="12" rx="3" fill="#1e1b4b" />
        <path d="M50 48 L70 48 L68 66 L52 66 Z" fill="#0284c7" />

        {/* Cap */}
        <circle cx="60" cy="35" r="7.5" fill="#fca5a5" />
        <path d="M55 30 Q60 26 65 30" stroke="#1e293b" strokeWidth="2.5" />

        {/* Braços fent cercles de mobilitat d'espatlles */}
        <g className={isAnimated ? 'animate-spin' : ''}>
          <path d="M50 50 L35 45 L32 32" stroke="#fca5a5" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M70 50 L85 45 L88 32" stroke="#f87171" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Fletxes de rotació d'escalfament */}
          <path d="M28 35 A 8 8 0 1 1 36 27" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 2" />
          <path d="M84 27 A 8 8 0 1 1 92 35" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 2" />
        </g>

        {/* Efecte d'activació muscular */}
        <circle cx="60" cy="50" r="2.5" fill="#10b981" />
      </svg>
    </div>
  );
};
