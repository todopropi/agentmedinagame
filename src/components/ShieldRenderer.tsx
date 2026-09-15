import React from 'react';
import { SPECIALIZED_SHIELDS } from '../data/badges';

interface ShieldRendererProps {
  shieldId: string;
  size?: number;
  showName?: boolean;
  glow?: boolean;
}

/**
 * Renderitzador d'Escuts i Patches Oficials
 * Basat exactament en els patches de PVC de TiendaMossos.com aportats per l'usuari
 */
export const ShieldRenderer: React.FC<ShieldRendererProps> = ({ 
  shieldId, 
  size = 72, 
  showName = false,
  glow = false 
}) => {
  const shield = SPECIALIZED_SHIELDS.find(s => s.id === shieldId) || SPECIALIZED_SHIELDS[0];
  const uid = React.useId().replace(/:/g, '');

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div 
        className="relative flex items-center justify-center transition-transform hover:scale-105"
        style={{ 
          width: size, 
          height: size * 1.18,
          filter: glow 
            ? 'drop-shadow(0 0 12px rgba(234, 179, 8, 0.45)) drop-shadow(0 4px 6px rgba(0,0,0,0.7))'
            : 'drop-shadow(0 3px 5px rgba(0,0,0,0.65))'
        }}
      >
        <svg viewBox="0 0 100 118" className="w-full h-full overflow-visible">
          <defs>
            {/* Gold metallic gradient for PVC borders */}
            <linearGradient id={`goldGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF2A3" />
              <stop offset="35%" stopColor="#EAB308" />
              <stop offset="70%" stopColor="#CA8A04" />
              <stop offset="100%" stopColor="#854D0E" />
            </linearGradient>

            {/* Silver gradient for DIC & Tactical badges */}
            <linearGradient id={`silverGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#64748B" />
            </linearGradient>

            {/* Red Senyera square gradient */}
            <linearGradient id={`redSquareGrad_${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#B91C1C" />
            </linearGradient>
          </defs>

          {/* 1. BASE PATCH SHAPE (Oval or Shield depending on unit) */}
          {shield.id === 'generic_pvc' || shield.id === 'generic_bw' || shield.id === 'dic' || shield.id === 'usaq' || shield.id === 'subsol' ? (
            /* Shield shape with indented waist */
            <g>
              <path
                d="M 50,4 
                   C 66,4 82,8 92,12
                   C 90,26 87,40 85,55
                   C 83,63 86,76 92,90
                   C 90,103 76,115 50,117
                   C 24,115 10,103 8,90
                   C 14,76 17,63 15,55
                   C 13,40 10,26 8,12
                   C 18,8 34,4 50,4 Z"
                fill={shield.id === 'generic_bw' ? '#18181b' : '#090d16'}
                stroke={shield.id === 'generic_bw' ? `url(#silverGrad_${uid})` : `url(#goldGrad_${uid})`}
                strokeWidth="2.5"
              />
              <path
                d="M 50,7 
                   C 64,7 78,11 88,14
                   C 86,27 83,40 81,55
                   C 79,63 82,75 88,88
                   C 86,99 74,109 50,111
                   C 26,109 14,99 12,88
                   C 18,75 21,63 19,55
                   C 17,40 14,27 12,14
                   C 22,11 36,7 50,7 Z"
                fill="none"
                stroke={shield.id === 'generic_bw' ? `url(#silverGrad_${uid})` : `url(#goldGrad_${uid})`}
                strokeWidth="0.8"
                opacity="0.75"
              />
            </g>
          ) : (
            /* Oval patch with raised border */
            <g>
              <ellipse 
                cx="50" 
                cy="59" 
                rx="44" 
                ry="55" 
                fill={shield.id === 'brimo_fluo' ? '#a3e635' : shield.id === 'muntanya' ? '#1e293b' : '#090d16'} 
                stroke={shield.id === 'brimo_fluo' ? '#65a30d' : shield.id === 'gei_stealth' ? '#3f3f46' : `url(#goldGrad_${uid})`} 
                strokeWidth="2.8" 
              />
              <ellipse 
                cx="50" 
                cy="59" 
                rx="40" 
                ry="51" 
                fill="none" 
                stroke={shield.id === 'brimo_fluo' ? '#4d7c0f' : shield.id === 'gei_stealth' ? '#27272a' : `url(#goldGrad_${uid})`} 
                strokeWidth="0.8" 
                opacity="0.8" 
              />
            </g>
          )}

          {/* 2. THE 4 RED SQUARES (QUATRE DAUS VERMELLS) ON LEFT BORDER (for units that have them) */}
          {(shield.id === 'usc' || shield.id === 'usc_blueline' || shield.id === 'dic' || shield.id === 'usaq' || 
            shield.id === 'subsol' || shield.id === 'transit' || shield.id === 'canina' || shield.id === 'tedax' || 
            shield.id === 'muntanya' || shield.id === 'maritima') && (
            <g transform="translate(15, 26)">
              <rect x="0" y="0" width="5.5" height="7" rx="1" fill={`url(#redSquareGrad_${uid})`} stroke="#7f1d1d" strokeWidth="0.5" />
              <rect x="0" y="11" width="5.5" height="7" rx="1" fill={`url(#redSquareGrad_${uid})`} stroke="#7f1d1d" strokeWidth="0.5" />
              <rect x="0" y="22" width="5.5" height="7" rx="1" fill={`url(#redSquareGrad_${uid})`} stroke="#7f1d1d" strokeWidth="0.5" />
              <rect x="0" y="33" width="5.5" height="7" rx="1" fill={`url(#redSquareGrad_${uid})`} stroke="#7f1d1d" strokeWidth="0.5" />
            </g>
          )}

          {/* 3. UNIT SPECIFIC ARTWORK MATCHING USER'S PHOTOS */}

          {/* ESCUT GENÈRIC PVC (Color) */}
          {shield.id === 'generic_pvc' && (
            <g transform="translate(50, 58)">
              <text x="0" y="-36" textAnchor="middle" fill={`url(#goldGrad_${uid})`} fontSize="8.5" fontWeight="900" fontFamily="sans-serif" letterSpacing="1.5">POLICIA</text>
              {/* Medallion with 4 red stripes */}
              <ellipse cx="0" cy="0" rx="16" ry="18" fill="#eab308" stroke={`url(#goldGrad_${uid})`} strokeWidth="1.5" />
              <g clipPath={`url(#genericClip_${uid})`}>
                <rect x="-10" y="-18" width="3.5" height="36" fill="#dc2626" />
                <rect x="-4" y="-18" width="3.5" height="36" fill="#dc2626" />
                <rect x="2" y="-18" width="3.5" height="36" fill="#dc2626" />
                <rect x="8" y="-18" width="3.5" height="36" fill="#dc2626" />
              </g>
              <text x="0" y="42" textAnchor="middle" fill={`url(#goldGrad_${uid})`} fontSize="5.5" fontWeight="900" fontFamily="sans-serif" letterSpacing="0.8">MOSSOS D'ESQUADRA</text>
            </g>
          )}

          {/* ESCUT GENÈRIC B&W (Tàctic) */}
          {shield.id === 'generic_bw' && (
            <g transform="translate(50, 58)">
              <text x="0" y="-36" textAnchor="middle" fill={`url(#silverGrad_${uid})`} fontSize="8.5" fontWeight="900" fontFamily="sans-serif" letterSpacing="1.5">POLICIA</text>
              <ellipse cx="0" cy="0" rx="16" ry="18" fill="#3f3f46" stroke={`url(#silverGrad_${uid})`} strokeWidth="1.5" />
              <rect x="-10" y="-14" width="3.5" height="28" fill="#f8fafc" />
              <rect x="-4" y="-14" width="3.5" height="28" fill="#f8fafc" />
              <rect x="2" y="-14" width="3.5" height="28" fill="#f8fafc" />
              <rect x="8" y="-14" width="3.5" height="28" fill="#f8fafc" />
              <text x="0" y="42" textAnchor="middle" fill={`url(#silverGrad_${uid})`} fontSize="5.5" fontWeight="900" fontFamily="sans-serif" letterSpacing="0.8">MOSSOS D'ESQUADRA</text>
            </g>
          )}

          {/* USC (Seguretat Ciutadana) */}
          {(shield.id === 'usc' || shield.id === 'usc_blueline') && (
            <g transform="translate(50, 58)">
              <text x="6" y="-32" textAnchor="middle" fill={`url(#goldGrad_${uid})`} fontSize="15" fontWeight="900" fontFamily="sans-serif" letterSpacing="1">USC</text>
              {/* Centurion Helmet */}
              <g transform="translate(4, 5)">
                {/* Red Plume */}
                <path d="M -8,-22 C 0,-34 18,-24 20,-10 C 16,-14 6,-18 -4,-16 Z" fill="#dc2626" />
                {/* Gold Helmet Shell */}
                <path d="M -6,-14 C 12,-16 18,-4 16,8 C 14,14 4,18 -4,14 C -6,6 -8,-4 -6,-14 Z" fill={`url(#goldGrad_${uid})`} stroke="#78350f" strokeWidth="0.8" />
                {/* Visor Slits */}
                <rect x="-2" y="-2" width="12" height="2" rx="1" fill="#090d16" />
                <rect x="-2" y="2" width="12" height="2" rx="1" fill="#090d16" />
                {/* Thin Blue Line if special edition */}
                {shield.id === 'usc_blueline' && (
                  <rect x="-22" y="0" width="44" height="3" fill="#0284c7" />
                )}
              </g>
              <text x="0" y="43" textAnchor="middle" fill={`url(#goldGrad_${uid})`} fontSize="5" fontWeight="800" fontFamily="sans-serif">mossos d'esquadra</text>
            </g>
          )}

          {/* ARRO (Roaring Golden Lion) */}
          {shield.id === 'arro' && (
            <g transform="translate(50, 58)">
              <text x="0" y="-34" textAnchor="middle" fill={`url(#goldGrad_${uid})`} fontSize="13" fontWeight="900" fontFamily="sans-serif" letterSpacing="1">ARRO</text>
              {/* Lion Head & Red Claws */}
              <g transform="translate(-2, 2)">
                <path d="M -12,12 C -18,2 -14,-14 2,-18 C 16,-16 22,-2 16,14 C 10,18 2,16 -2,12 C -6,14 -10,16 -12,12 Z" fill={`url(#goldGrad_${uid})`} />
                <circle cx="2" cy="-4" r="2" fill="#090d16" />
                {/* Red Claw Slashes */}
                <path d="M -18,6 L -10,-12" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M -14,12 L -6,-6" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M -10,18 L -2,0" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
              </g>
              <text x="0" y="44" textAnchor="middle" fill={`url(#goldGrad_${uid})`} fontSize="5" fontWeight="800" fontFamily="sans-serif">mossos d'esquadra</text>
            </g>
          )}

          {/* BRIMO (Knight Helmet & Dragon Crest) */}
          {(shield.id === 'brimo' || shield.id === 'brimo_fluo') && (
            <g transform="translate(50, 58)">
              <text x="0" y="-35" textAnchor="middle" fill={shield.id === 'brimo_fluo' ? '#0f172a' : `url(#goldGrad_${uid})`} fontSize="7.5" fontWeight="900" fontFamily="sans-serif">brigada mòbil</text>
              {/* Medieval Knight Helmet */}
              <g transform="translate(0, 3)">
                {/* Dragon Crest / Red & Yellow Wing */}
                <path d="M -4,-22 C 12,-30 20,-14 14,-2 C 8,-6 2,-12 -4,-14 Z" fill="#dc2626" />
                <path d="M 0,-18 C 10,-24 16,-12 10,-2 Z" fill="#facc15" />
                {/* Helmet visor */}
                <path d="M -14,-4 C -12,-16 8,-16 12,-4 C 14,10 4,16 -4,14 C -14,12 -16,4 -14,-4 Z" fill={shield.id === 'brimo_fluo' ? '#1e293b' : '#334155'} stroke={shield.id === 'brimo_fluo' ? '#0284c7' : '#94a3b8'} strokeWidth="1" />
                <circle cx="-1" cy="2" r="2.5" fill="#facc15" />
                <line x1="-10" y1="4" x2="6" y2="4" stroke="#0f172a" strokeWidth="2" />
              </g>
              <text x="0" y="44" textAnchor="middle" fill={shield.id === 'brimo_fluo' ? '#0f172a' : `url(#goldGrad_${uid})`} fontSize="5" fontWeight="800" fontFamily="sans-serif">mossos d'esquadra</text>
            </g>
          )}

          {/* GEI (Eagle Falcon & Sniper Reticle) */}
          {(shield.id === 'gei' || shield.id === 'gei_stealth') && (
            <g transform="translate(50, 58)">
              <text x="0" y="-28" textAnchor="middle" fill={shield.id === 'gei_stealth' ? '#52525b' : `url(#goldGrad_${uid})`} fontSize="18" fontWeight="900" fontFamily="sans-serif" letterSpacing="1">GEI</text>
              {/* Crosshair inside E */}
              <circle cx="2" cy="-33" r="4" fill="none" stroke={shield.id === 'gei_stealth' ? '#3f3f46' : '#ffffff'} strokeWidth="0.8" opacity="0.8" />
              {/* Fierce Eagle Head */}
              <g transform="translate(0, 10)">
                <path d="M -14,8 C -18,-8 2,-16 14,-6 C 18,2 14,14 -2,16 C -12,16 -16,12 -14,8 Z" fill={shield.id === 'gei_stealth' ? '#3f3f46' : `url(#goldGrad_${uid})`} />
                {/* Beak */}
                <path d="M 12,-4 L 20,2 L 12,6 Z" fill={shield.id === 'gei_stealth' ? '#27272a' : '#ffffff'} />
                {/* Sharp Eye */}
                <circle cx="4" cy="-4" r="2.5" fill="#090d16" />
                <circle cx="5" cy="-5" r="1" fill="#facc15" />
              </g>
              <text x="0" y="45" textAnchor="middle" fill={shield.id === 'gei_stealth' ? '#52525b' : `url(#goldGrad_${uid})`} fontSize="3.8" fontWeight="900" fontFamily="sans-serif">GRUP ESPECIAL D'INTERVENCIÓ</text>
            </g>
          )}

          {/* DIC (Divisió d'Investigació Criminal) */}
          {shield.id === 'dic' && (
            <g transform="translate(50, 58)">
              <text x="4" y="-34" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900" fontFamily="sans-serif" letterSpacing="3">D I C</text>
              {/* 8-Point Compass Star & Laurel */}
              <g transform="translate(4, 5)">
                {/* Silver Laurel */}
                <path d="M -18,12 C -24,2 -18,-12 -8,-16" fill="none" stroke="#e2e8f0" strokeWidth="1.5" />
                <path d="M 18,12 C 24,2 18,-12 8,-16" fill="none" stroke="#e2e8f0" strokeWidth="1.5" />
                {/* Star */}
                <polygon points="0,-16 4,-4 16,0 4,4 0,16 -4,4 -16,0 -4,-4" fill="#ffffff" stroke="#64748b" strokeWidth="0.8" />
                <circle cx="0" cy="0" r="3" fill="#090d16" />
              </g>
            </g>
          )}

          {/* USAQ (Subaquàtica - Diver Mask) */}
          {shield.id === 'usaq' && (
            <g transform="translate(50, 58)">
              <text x="4" y="-36" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontWeight="900" fontFamily="sans-serif">subaquàtica</text>
              {/* Diving Scuba Mask & Regulator */}
              <g transform="translate(4, 4)">
                <ellipse cx="0" cy="-6" rx="14" ry="8" fill="#1e293b" stroke="#e2e8f0" strokeWidth="2" />
                <circle cx="-5" cy="-6" r="3" fill="#38bdf8" opacity="0.6" />
                <circle cx="5" cy="-6" r="3" fill="#38bdf8" opacity="0.6" />
                <ellipse cx="0" cy="10" rx="8" ry="6" fill="#e2e8f0" />
                <circle cx="0" cy="10" r="3" fill="#090d16" />
              </g>
              <text x="0" y="44" textAnchor="middle" fill="#94a3b8" fontSize="4.5" fontWeight="800" fontFamily="sans-serif">mossos d'esquadra</text>
            </g>
          )}

          {/* SUBSÒL (Gas Mask & Bat) */}
          {shield.id === 'subsol' && (
            <g transform="translate(50, 58)">
              {/* Bat silhouette */}
              <path d="M -6,-28 C 0,-34 8,-34 14,-28 C 18,-32 24,-24 22,-18 C 16,-20 8,-18 4,-16 C 0,-18 -4,-20 -6,-28 Z" fill="#f8fafc" />
              {/* Dual canister gas mask */}
              <g transform="translate(4, 8)">
                <circle cx="-10" cy="-2" r="5" fill="#f8fafc" />
                <circle cx="10" cy="-2" r="5" fill="#f8fafc" />
                <circle cx="0" cy="10" r="7" fill="#f8fafc" />
                <circle cx="0" cy="10" r="4" fill="#0f172a" />
              </g>
            </g>
          )}

          {/* TRÀNSIT (Motorcycle Silhouette) */}
          {shield.id === 'transit' && (
            <g transform="translate(50, 58)">
              <text x="4" y="-35" textAnchor="middle" fill={`url(#goldGrad_${uid})`} fontSize="9" fontWeight="900" fontFamily="sans-serif">trànsit</text>
              {/* Motorcycle Banking */}
              <g transform="translate(4, 2)">
                <ellipse cx="-8" cy="10" rx="6" ry="4" fill="none" stroke="#ffffff" strokeWidth="2" />
                <ellipse cx="14" cy="8" rx="6" ry="4" fill="none" stroke="#ffffff" strokeWidth="2" />
                <path d="M -6,8 L 0,-6 L 8,-4 L 14,6" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                <circle cx="2" cy="-10" r="3" fill="#38bdf8" />
              </g>
              <text x="0" y="44" textAnchor="middle" fill={`url(#goldGrad_${uid})`} fontSize="5" fontWeight="800" fontFamily="sans-serif">mossos d'esquadra</text>
            </g>
          )}

          {/* CANINA (German Shepherd Dog Head) */}
          {shield.id === 'canina' && (
            <g transform="translate(50, 58)">
              <text x="4" y="-35" textAnchor="middle" fill={`url(#goldGrad_${uid})`} fontSize="9.5" fontWeight="900" fontFamily="sans-serif">canina</text>
              {/* Police Dog Profile */}
              <g transform="translate(4, 4)">
                {/* Ears */}
                <polygon points="-8,-20 -2,-8 -12,-8" fill={`url(#goldGrad_${uid})`} />
                <polygon points="6,-20 10,-8 0,-8" fill={`url(#goldGrad_${uid})`} />
                {/* Head & Muzzle */}
                <path d="M -10,-6 C -12,8 0,16 6,14 C 12,12 10,2 8,-6 Z" fill={`url(#goldGrad_${uid})`} />
                <polygon points="0,4 6,2 6,8 0,10" fill="#090d16" />
                <circle cx="-3" cy="-2" r="1.8" fill="#090d16" />
              </g>
              <text x="0" y="44" textAnchor="middle" fill={`url(#goldGrad_${uid})`} fontSize="5" fontWeight="800" fontFamily="sans-serif">mossos d'esquadra</text>
            </g>
          )}

          {/* TEDAX-NRBQ (Lightning & Bomb) */}
          {shield.id === 'tedax' && (
            <g transform="translate(50, 58)">
              <text x="4" y="-34" textAnchor="middle" fill={`url(#goldGrad_${uid})`} fontSize="8.5" fontWeight="900" fontFamily="sans-serif">TEDAX NRBQ</text>
              {/* Bomb and Lightning Bolt */}
              <g transform="translate(4, 4)">
                <circle cx="-6" cy="8" r="9" fill="#475569" stroke="#090d16" strokeWidth="1" />
                <path d="M -6,-1 C -6,-6 -2,-8 2,-7" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
                {/* Spark/Flame */}
                <circle cx="3" cy="-7" r="2.5" fill="#ef4444" />
                {/* Yellow Lightning Bolt */}
                <polygon points="-12,-16 4,-12 -2,-4 14,0 -4,18 0,4 -10,0" fill="#facc15" stroke="#b45309" strokeWidth="0.8" />
              </g>
              <text x="0" y="44" textAnchor="middle" fill={`url(#goldGrad_${uid})`} fontSize="5" fontWeight="800" fontFamily="sans-serif">mossos d'esquadra</text>
            </g>
          )}

          {/* MUNTANYA (UIM - Chamois & Edelweiss) */}
          {shield.id === 'muntanya' && (
            <g transform="translate(50, 58)">
              <text x="4" y="-35" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="900" fontFamily="sans-serif">muntanya</text>
              <g transform="translate(4, 4)">
                {/* Mountain Silhouette */}
                <polygon points="-14,-6 0,-18 14,-6 8,6 -8,6" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
                {/* Crossed Ice Axes */}
                <line x1="-12" y1="-2" x2="12" y2="14" stroke="#e2e8f0" strokeWidth="1.8" />
                <line x1="12" y1="-2" x2="-12" y2="14" stroke="#e2e8f0" strokeWidth="1.8" />
                {/* Edelweiss */}
                <circle cx="0" cy="6" r="3.5" fill="#ffffff" stroke="#f59e0b" strokeWidth="1" />
              </g>
              <text x="0" y="44" textAnchor="middle" fill="#94a3b8" fontSize="5" fontWeight="800" fontFamily="sans-serif">mossos d'esquadra</text>
            </g>
          )}

          {/* INFORMACIÓ / ASTOR (Claw Marks & White Eagle) */}
          {shield.id === 'informacio' && (
            <g transform="translate(50, 58)">
              <text x="0" y="-34" textAnchor="middle" fill={`url(#goldGrad_${uid})`} fontSize="9" fontWeight="900" fontFamily="sans-serif">Informació</text>
              {/* 3 Vivid Red Claw Slashes */}
              <g transform="translate(0, 0)">
                <path d="M -8,-18 L -2,14" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
                <path d="M 0,-20 L 6,12" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
                <path d="M 8,-16 L 14,16" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
                {/* Flying White Eagle */}
                <path d="M -16,4 C -6,-10 0,-2 4,-6 C 10,-12 18,2 14,8 C 6,10 -2,4 -10,12 Z" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.8" />
              </g>
              <text x="0" y="44" textAnchor="middle" fill={`url(#goldGrad_${uid})`} fontSize="5" fontWeight="800" fontFamily="sans-serif">mossos d'esquadra</text>
            </g>
          )}

          {/* MARÍTIMA (Naval Anchor & Rope) */}
          {shield.id === 'maritima' && (
            <g transform="translate(50, 58)">
              {/* Large Gold Anchor */}
              <g transform="translate(4, 5)">
                {/* Top ring */}
                <circle cx="0" cy="-20" r="4.5" fill="none" stroke={`url(#goldGrad_${uid})`} strokeWidth="2.2" />
                {/* Crossbar */}
                <line x1="-12" y1="-12" x2="12" y2="-12" stroke={`url(#goldGrad_${uid})`} strokeWidth="3" strokeLinecap="round" />
                {/* Vertical Shank */}
                <line x1="0" y1="-20" x2="0" y2="16" stroke={`url(#goldGrad_${uid})`} strokeWidth="3.5" />
                {/* Curved Flukes */}
                <path d="M -16,4 C -12,18 12,18 16,4" fill="none" stroke={`url(#goldGrad_${uid})`} strokeWidth="3.5" strokeLinecap="round" />
                {/* Cable/Rope winding around shank */}
                <path d="M -4,-16 C 4,-12 -4,-4 4,2" fill="none" stroke="#f8fafc" strokeWidth="1.2" />
              </g>
            </g>
          )}
        </svg>
      </div>

      {showName && (
        <span className="text-xs font-bold text-amber-400 mt-1.5 tracking-wide text-center">
          {shield.nom}
        </span>
      )}
    </div>
  );
};
