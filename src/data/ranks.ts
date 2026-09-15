import { PoliceRank } from '../types';

export interface OfficialRankInfo {
  id: string;
  scale: string;
  title: string;
  minXp: number;
  icon: string;
  desc: string;
  category: string;
  categoryName: string;
  color: string;
}

export const OFFICIAL_RANKS_LIST: OfficialRankInfo[] = [
  { 
    id: 'mosso',
    scale: "Escala bàsica", 
    category: 'escala_basica',
    categoryName: 'Escala Bàsica',
    title: "Mosso/a", 
    minXp: 0, 
    icon: "👮‍♂️", 
    color: '#3b82f6',
    desc: "Categoria inicial d'accés al cos. Tasques executives derivades del compliment de les funcions policials." 
  },
  { 
    id: 'caporal',
    scale: "Escala bàsica", 
    category: 'escala_basica',
    categoryName: 'Escala Bàsica',
    title: "Caporal/a", 
    minXp: 1200, 
    icon: "🔽", 
    color: '#2563eb',
    desc: "Categoria més alta de l'escala bàsica i responsable de liderar els seus companys." 
  },
  { 
    id: 'sergent',
    scale: "Escala intermèdia", 
    category: 'escala_intermedia',
    categoryName: 'Escala Intermèdia',
    title: "Sergent/a", 
    minXp: 3000, 
    icon: "⏬", 
    color: '#10b981',
    desc: "Grau més baix de l'escala intermèdia. Comandament operatiu i supervisió." 
  },
  { 
    id: 'sotsinspector',
    scale: "Escala intermèdia", 
    category: 'escala_intermedia',
    categoryName: 'Escala Intermèdia',
    title: "Sotsinspector/a", 
    minXp: 5500, 
    icon: "📑", 
    color: '#059669',
    desc: "Grau més alt de l'escala intermèdia. Comandament operatiu i supervisió de grups i subgrups." 
  },
  { 
    id: 'inspector',
    scale: "Escala executiva", 
    category: 'escala_executiva',
    categoryName: 'Escala Executiva',
    title: "Inspector/a", 
    minXp: 9000, 
    icon: "⭐", 
    color: '#f59e0b',
    desc: "Únic comandament de l'escala executiva. Gestió d'àrees, unitats i comissaries comarcals." 
  },
  { 
    id: 'intendent',
    scale: "Escala superior", 
    category: 'escala_superior',
    categoryName: 'Escala Superior',
    title: "Intendent/a", 
    minXp: 14000, 
    icon: "🎖️", 
    color: '#8b5cf6',
    desc: "Tercer comandament de l'escala superior. Dirigeix àrees o divisions policials sencerers." 
  },
  { 
    id: 'comissari',
    scale: "Escala superior", 
    category: 'escala_superior',
    categoryName: 'Escala Superior',
    title: "Comissari/ària", 
    minXp: 20000, 
    icon: "🏛️", 
    color: '#ec4899',
    desc: "Segon comandament més alt del Cos de Mossos d'Esquadra." 
  },
  { 
    id: 'major',
    scale: "Escala superior", 
    category: 'escala_superior',
    categoryName: 'Escala Superior',
    title: "Major", 
    minXp: 28000, 
    icon: "👑", 
    color: '#dc2626',
    desc: "Oficial de màxima categoria a l'escala superior i comandament més alt de la policia catalana." 
  }
];

export const POLICE_RANKS: PoliceRank[] = OFFICIAL_RANKS_LIST.map(r => ({
  id: r.id,
  name: r.title,
  category: r.category as any,
  categoryName: r.categoryName,
  minXp: r.minXp,
  badgeIcon: r.icon,
  color: r.color,
  description: r.desc
}));

export function calculateRank(xp: number): PoliceRank {
  for (let i = POLICE_RANKS.length - 1; i >= 0; i--) {
    if (xp >= POLICE_RANKS[i].minXp) {
      return POLICE_RANKS[i];
    }
  }
  return POLICE_RANKS[0];
}

export function getNextRank(currentXp: number): { nextRank: PoliceRank | null; xpNeeded: number; progressPercent: number } {
  const currentRank = calculateRank(currentXp);
  const currentIndex = POLICE_RANKS.findIndex(r => r.id === currentRank.id);
  
  if (currentIndex >= POLICE_RANKS.length - 1) {
    return { nextRank: null, xpNeeded: 0, progressPercent: 100 };
  }
  
  const nextRank = POLICE_RANKS[currentIndex + 1];
  const currentRankMin = currentRank.minXp;
  const nextRankMin = nextRank.minXp;
  const xpInLevel = currentXp - currentRankMin;
  const xpSpan = nextRankMin - currentRankMin;
  const progressPercent = Math.min(100, Math.max(0, Math.round((xpInLevel / xpSpan) * 100)));

  return {
    nextRank,
    xpNeeded: Math.max(0, nextRankMin - currentXp),
    progressPercent,
  };
}
