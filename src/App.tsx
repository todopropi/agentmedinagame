import React, { useState, useEffect } from 'react';
import { UserProfile, SpecializedShield, AppSectionConfig, Question } from './types';
import { 
  initAuthListener, 
  logOutUser, 
  syncUserProfileUpdate, 
  loadUserProfile,
  getStoredLocalUser,
  saveStoredLocalUser,
  getUnauthorizedDomainAlert,
  subscribeUnauthorizedDomainAlert,
  startOnlinePresence,
  UnauthorizedDomainInfo
} from './firebase';
import { calculateRank } from './data/ranks';
import { SPECIALIZED_SHIELDS, initCloudStoreCatalog, getCustomShields } from './data/badges';
import { initCloudQuestions, onQuestionsUpdated } from './data/questionsBank';
import { 
  syncSupabaseProfile, 
  fetchSupabaseProfile, 
  syncSupabaseUserGameData, 
  fetchSupabaseUserGameData,
  fetchSupabaseAppConfig,
  syncSupabaseUserProgression,
  fetchSupabaseUserProgression,
  fetchActiveBroadcastMessage,
  AdminBroadcastMessage
} from '../supabase';
import { AuthModal } from './components/AuthModal';
import { Navbar, ActiveTab } from './components/Navbar';
import { ModeCampanya } from './components/ModeCampanya';
import { ModeDuels } from './components/ModeDuels';
import { TiendaEscuts } from './components/TiendaEscuts';
import { SeccioRepas } from './components/SeccioRepas';
import { RankingGlobal } from './components/RankingGlobal';
import { ImportQuestionsModal } from './components/ImportQuestionsModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { ImpugnarModal } from './components/ImpugnarModal';
import { NotificationsCenterModal } from './components/NotificationsCenterModal';
import { LegalTermsModal } from './components/LegalTermsModal';
import { TurnNotificationToast } from './components/TurnNotificationToast';
import { RankUpCelebrationModal } from './components/RankUpCelebrationModal';
import { InAppNotification, NotificationPreferences } from './types';
import { requestPushPermissionAndToken, subscribeToUserNotifications } from './utils/pushNotifications';
import confetti from 'canvas-confetti';
import { Upload, Sparkles, AlertCircle, Copy, Check, X, ShieldAlert, Megaphone, Flame, ArrowDownCircle, CheckCircle2, TrendingUp } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('campanya');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [impugnarQuestion, setImpugnarQuestion] = useState<Question | null>(null);
  const [rankUpNotification, setRankUpNotification] = useState<string | null>(null);
  const [rankUpModalData, setRankUpModalData] = useState<{ newRank: any; oldRank: any } | null>(null);
  const [leaderboardRiseNotification, setLeaderboardRiseNotification] = useState<{ previousPos: number; newPos: number; opponentName?: string } | null>(null);
  const [domainAlert, setDomainAlert] = useState<UnauthorizedDomainInfo | null>(getUnauthorizedDomainAlert());
  const [domainCopied, setDomainCopied] = useState(false);
  const [sectionConfig, setSectionConfig] = useState<AppSectionConfig | null>(null);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [activePushNotification, setActivePushNotification] = useState<InAppNotification | null>(null);
  const [activeBroadcast, setActiveBroadcast] = useState<AdminBroadcastMessage | null>(null);
  const [xpDecayNotification, setXpDecayNotification] = useState<{ daysMissed: number; xpLost: number } | null>(null);

  // Escolta per instal·lació d'APK directa a Android (beforeinstallprompt)
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Generació de Token del Dispositiu i Subscripció a Notificacions Push (FCM)
  useEffect(() => {
    if (!currentUser?.uid) return;

    // 1. Registre de token del dispositiu a la BD
    requestPushPermissionAndToken(currentUser.uid).catch(console.warn);

    // 2. Subscripció en temps real a ordres de torn enviades a Firebase
    const unsubscribe = subscribeToUserNotifications(currentUser.uid, (notif) => {
      setActivePushNotification(notif);
    });

    return unsubscribe;
  }, [currentUser?.uid]);

  // Actualitzar preferències personalitzades de notificacions de l'usuari
  const handleUpdateNotificationPreferences = async (preferences: NotificationPreferences) => {
    if (!currentUser) return;
    const updatedUser = {
      ...currentUser,
      notificationPreferences: preferences
    };
    setCurrentUser(updatedUser);
    try {
      await syncUserProfileUpdate({
        uid: currentUser.uid,
        notificationPreferences: preferences
      });
      await syncSupabaseProfile(updatedUser);
    } catch (e) {
      console.warn('Error syncing notification preferences:', e);
    }
  };

  // Subscribe to unauthorized domain notices
  useEffect(() => {
    const unsub = subscribeUnauthorizedDomainAlert((info) => {
      setDomainAlert(info);
    });
    return unsub;
  }, []);

  // Listen to open_impugnar_modal global event
  useEffect(() => {
    const handleOpenImpugnar = (e: any) => {
      if (e.detail) {
        setImpugnarQuestion(e.detail);
      }
    };
    window.addEventListener('open_impugnar_modal', handleOpenImpugnar);

    // Escolta d'ascens en el Rànquing Policial
    const handleRankAdvanced = (e: any) => {
      if (e.detail) {
        setLeaderboardRiseNotification(e.detail);
        setTimeout(() => {
          setLeaderboardRiseNotification(null);
        }, 6000);
      }
    };
    window.addEventListener('leaderboard_position_advanced', handleRankAdvanced);

    // Escolta de concessió d'accés a la radiografia d'estudi
    const handleStudyReportAccess = (e: any) => {
      if (e.detail) {
        setCurrentUser(prev => {
          if (!prev) return prev;
          if (prev.uid === e.detail.userId) {
            const updated = { ...prev, canViewStudyReport: Boolean(e.detail.allowed) };
            syncUserProfileUpdate(updated).catch(() => {});
            return updated;
          }
          return prev;
        });
      }
    };
    window.addEventListener('study_report_access_updated', handleStudyReportAccess);

    return () => {
      window.removeEventListener('open_impugnar_modal', handleOpenImpugnar);
      window.removeEventListener('leaderboard_position_advanced', handleRankAdvanced);
      window.removeEventListener('study_report_access_updated', handleStudyReportAccess);
    };
  }, []);

  // Initialize Cloud Questions & Store Catalog from Supabase
  const [, setQuestionsTick] = useState(0);
  useEffect(() => {
    initCloudQuestions().catch(console.warn);
    initCloudStoreCatalog().catch(console.warn);
    fetchSupabaseAppConfig().then(config => {
      if (config) setSectionConfig(config);
    }).catch(console.warn);

    // Consulta periòdica de comunicats globals de l'administrador
    const checkBroadcast = () => {
      fetchActiveBroadcastMessage().then(b => {
        if (b && b.active) {
          setActiveBroadcast(b);
        } else {
          setActiveBroadcast(null);
        }
      }).catch(console.warn);
    };

    checkBroadcast();
    const broadcastInterval = setInterval(checkBroadcast, 6000);

    const handleNewBroadcast = (e: any) => {
      if (e.detail) {
        setActiveBroadcast(e.detail);
      } else {
        setActiveBroadcast(null);
      }
    };
    window.addEventListener('new_admin_broadcast', handleNewBroadcast);

    const unsubscribe = onQuestionsUpdated(() => {
      setQuestionsTick(t => t + 1);
    });
    return () => {
      clearInterval(broadcastInterval);
      window.removeEventListener('new_admin_broadcast', handleNewBroadcast);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Merge Cloud Game Data from Supabase into UserProfile
  const enrichUserWithCloudData = async (baseUser: UserProfile): Promise<UserProfile> => {
    const uid = baseUser.uid || (baseUser as any).id || '';
    if (!uid) return baseUser;

    try {
      const [cloudGameData, cloudProfile] = await Promise.all([
        fetchSupabaseUserProgression(uid),
        fetchSupabaseProfile(uid)
      ]);

      let enriched = { ...baseUser };

      if (cloudProfile) {
        if (cloudProfile.username && cloudProfile.username !== 'Aspirant' && cloudProfile.username !== 'Aspirant Medina') {
          enriched.displayName = cloudProfile.username;
        } else if (!enriched.displayName || enriched.displayName === 'Aspirant' || enriched.displayName === 'Aspirant Medina') {
          if (cloudProfile.username) {
            enriched.displayName = cloudProfile.username;
          }
        }
        if (typeof cloudProfile.total_points === 'number' && cloudProfile.total_points > (enriched.xp || 0)) {
          enriched.xp = cloudProfile.total_points;
        }
        if (cloudProfile.role) {
          enriched.role = cloudProfile.role;
        }
        if (cloudProfile.subscription_status) {
          enriched.subscriptionStatus = cloudProfile.subscription_status;
        }
        if (cloudProfile.subscription_expires_at) {
          enriched.subscriptionExpiresAt = cloudProfile.subscription_expires_at;
        }
        if (typeof cloudProfile.is_unlimited === 'boolean') {
          enriched.isUnlimited = cloudProfile.is_unlimited;
        }
        if (cloudProfile.role === 'admin' || enriched.email?.toLowerCase().trim() === 'opossscar@gmail.com') {
          enriched.isAdmin = true;
          enriched.role = 'admin';
          enriched.isUnlimited = true;
          enriched.subscriptionStatus = 'unlimited';
        }
        if (typeof cloudProfile.can_view_study_report === 'boolean') {
          enriched.canViewStudyReport = cloudProfile.can_view_study_report;
        }
      } else {
        // Si no té perfil encara a Supabase i no és admin, assignar 48h de cortesia
        const isAdmin = enriched.email?.toLowerCase().trim() === 'opossscar@gmail.com';
        if (isAdmin) {
          enriched.isAdmin = true;
          enriched.role = 'admin';
          enriched.isUnlimited = true;
          enriched.subscriptionStatus = 'unlimited';
        } else if (!enriched.subscriptionExpiresAt) {
          enriched.subscriptionStatus = 'trial';
          enriched.subscriptionExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
        }
      }

      if (cloudGameData) {
        if (typeof cloudGameData.merits === 'number') {
          enriched.merits = cloudGameData.merits;
        }
        if (typeof cloudGameData.xp === 'number' && cloudGameData.xp > enriched.xp) {
          enriched.xp = cloudGameData.xp;
        }
        if (typeof cloudGameData.wildcardsCount === 'number') {
          enriched.wildcardsCount = cloudGameData.wildcardsCount;
        }
        if (Array.isArray(cloudGameData.unlockedShieldIds) && cloudGameData.unlockedShieldIds.length > 0) {
          enriched.unlockedShieldIds = Array.from(new Set([
            ...(enriched.unlockedShieldIds || []),
            ...cloudGameData.unlockedShieldIds
          ]));
        }
        if (cloudGameData.equippedShieldId) {
          enriched.equippedShieldId = cloudGameData.equippedShieldId;
        }
        if (Array.isArray(cloudGameData.failedQuestionIds)) {
          enriched.failedQuestionIds = Array.from(new Set([
            ...(enriched.failedQuestionIds || []),
            ...cloudGameData.failedQuestionIds
          ]));
        }
        if (Array.isArray(cloudGameData.savedQuestionIds)) {
          enriched.savedQuestionIds = Array.from(new Set([
            ...(enriched.savedQuestionIds || []),
            ...cloudGameData.savedQuestionIds
          ]));
        }
        if (Array.isArray(cloudGameData.answeredQuestionIds)) {
          enriched.answeredQuestionIds = Array.from(new Set([
            ...(enriched.answeredQuestionIds || []),
            ...cloudGameData.answeredQuestionIds
          ]));
        }
        if (Array.isArray(cloudGameData.correctQuestionIds)) {
          enriched.correctQuestionIds = Array.from(new Set([
            ...(enriched.correctQuestionIds || []),
            ...cloudGameData.correctQuestionIds
          ]));
        }
        if (cloudGameData.questionMistakesCount && typeof cloudGameData.questionMistakesCount === 'object') {
          enriched.questionMistakesCount = {
            ...(enriched.questionMistakesCount || {}),
            ...cloudGameData.questionMistakesCount
          };
        }
        if (Array.isArray(cloudGameData.savedMnemonicIds)) {
          enriched.savedMnemonicIds = Array.from(new Set([
            ...(enriched.savedMnemonicIds || []),
            ...cloudGameData.savedMnemonicIds
          ]));
        }
        if (Array.isArray(cloudGameData.completedAmbits)) {
          enriched.completedAmbits = cloudGameData.completedAmbits;
        }
        if (cloudGameData.boardProgress && typeof cloudGameData.boardProgress === 'object') {
          enriched.boardProgress = cloudGameData.boardProgress;

          // Auto-desbloqueig automàtic dels escuts de campanya per casella 50
          try {
            const storeShields = getCustomShields();
            const unlockedSet = new Set(enriched.unlockedShieldIds || []);
            let hasNewUnlock = false;

            Object.entries(cloudGameData.boardProgress).forEach(([ambit, tile]) => {
              if (Number(tile) >= 50) {
                const matched = storeShields.filter(s => s.ambitDesbloqueig === ambit);
                matched.forEach(m => {
                  if (!unlockedSet.has(m.id)) {
                    unlockedSet.add(m.id);
                    hasNewUnlock = true;
                  }
                });
              }
            });

            if (hasNewUnlock) {
              enriched.unlockedShieldIds = Array.from(unlockedSet);
            }
          } catch (e) {
            console.warn('Error auto-unlocking shields from boardProgress in enrichUser:', e);
          }
        }
        if (cloudGameData.lastActiveDay) {
          enriched.lastActiveDay = cloudGameData.lastActiveDay;
        }
        if (typeof cloudGameData.canViewStudyReport === 'boolean') {
          enriched.canViewStudyReport = cloudGameData.canViewStudyReport;
        }
        if (Array.isArray(cloudGameData.readBroadcastIds)) {
          enriched.readBroadcastIds = cloudGameData.readBroadcastIds;
        }
      }

      // -------------------------------------------------------------
      // Mecanisme de Decaïment d'XP per Inactivitat (-20 XP / dia, sòl 0 XP)
      // -------------------------------------------------------------
      try {
        const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const lastActive = enriched.lastActiveDay;
        const decayCheckKey = `agent_medina_decay_${uid}_${todayStr}`;
        const alreadyCheckedToday = localStorage.getItem(decayCheckKey) === '1' || sessionStorage.getItem(decayCheckKey) === '1';

        // Només calculem decaïment si no s'ha comprovat ja avui i l'usuari tenia un dia anterior registrat
        if (!alreadyCheckedToday && lastActive && lastActive !== todayStr) {
          const lastDate = new Date(lastActive + 'T00:00:00');
          const todayDate = new Date(todayStr + 'T00:00:00');
          const diffMs = todayDate.getTime() - lastDate.getTime();
          const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

          // Si ha estat 1 o més dies naturals sense connectar-se
          if (diffDays > 0) {
            const decayPerDay = 20;
            const potentialLoss = diffDays * decayPerDay;
            const currentXp = enriched.xp || 0;
            const actualLoss = Math.min(currentXp, potentialLoss); // Mai baixa de 0 XP

            if (actualLoss > 0) {
              enriched.xp = Math.max(0, currentXp - actualLoss);
              // Notificar a l'usuari amb banner
              setXpDecayNotification({
                daysMissed: diffDays,
                xpLost: actualLoss
              });
            }
          }
          // Marcar comprovat per avui per no repetir en cada recàrrega
          localStorage.setItem(decayCheckKey, '1');
          sessionStorage.setItem(decayCheckKey, '1');
        } else if (lastActive === todayStr) {
          // L'usuari ja ha estat actiu avui, no hi ha cap pèrdua
          localStorage.setItem(decayCheckKey, '1');
        }

        // Actualitzar el dia actiu a avui
        enriched.lastActiveDay = todayStr;
      } catch (decayErr) {
        console.warn('Error calculant decaïment d\'XP per inactivitat:', decayErr);
      }

      enriched.rank = calculateRank(enriched.xp);
      return enriched;
    } catch (e) {
      console.warn('Error loading cloud user game data:', e);
      return baseUser;
    }
  };

  // Initialize Firebase Auth Listener & Supabase Cloud Sync
  useEffect(() => {
    let isMounted = true;

    // 1. Restaurar sessió inicial des de localStorage
    const stored = getStoredLocalUser();
    if (stored) {
      stored.rank = calculateRank(stored.xp);
      setCurrentUser(stored);

      // Enriquir amb Supabase en segon pla
      enrichUserWithCloudData(stored).then(enriched => {
        if (isMounted) {
          setCurrentUser(enriched);
          saveStoredLocalUser(enriched);
          const uid = enriched.uid || (enriched as any).id || '';
          syncSupabaseProfile({
            uid,
            username: enriched.displayName || 'Aspirant',
            email: enriched.email,
            total_points: enriched.xp ?? 0,
            xp: enriched.xp ?? 0,
            merits: enriched.merits ?? 0,
            avatar_url: enriched.equippedShieldId || 'generic_pvc',
            equippedShieldId: enriched.equippedShieldId || 'generic_pvc'
          });
          syncSupabaseUserProgression(uid, {
            username: enriched.displayName || 'Aspirant',
            xp: enriched.xp ?? 0,
            merits: enriched.merits ?? 0,
            equippedShieldId: enriched.equippedShieldId || 'generic_pvc',
            wildcardsCount: enriched.wildcardsCount || 0,
            unlockedShieldIds: enriched.unlockedShieldIds || [],
            failedQuestionIds: enriched.failedQuestionIds || [],
            savedQuestionIds: enriched.savedQuestionIds || [],
            savedMnemonicIds: enriched.savedMnemonicIds || [],
            lastActiveDay: enriched.lastActiveDay,
            readBroadcastIds: enriched.readBroadcastIds || []
          });
        }
      });
    }

    const timeoutId = setTimeout(() => {
      if (isMounted) setAuthChecked(true);
    }, 1500);

    const unsubscribe = initAuthListener(async (user) => {
      clearTimeout(timeoutId);
      if (user) {
        user.rank = calculateRank(user.xp);
        const enriched = await enrichUserWithCloudData(user);
        if (isMounted) {
          setCurrentUser(enriched);
          saveStoredLocalUser(enriched);
          const uid = enriched.uid || (enriched as any).id || '';
          syncSupabaseProfile({
            uid,
            username: enriched.displayName || 'Aspirant',
            email: enriched.email,
            total_points: enriched.xp ?? 0,
            xp: enriched.xp ?? 0,
            merits: enriched.merits ?? 0,
            avatar_url: enriched.equippedShieldId || 'generic_pvc',
            equippedShieldId: enriched.equippedShieldId || 'generic_pvc'
          });
          syncSupabaseUserProgression(uid, {
            username: enriched.displayName || 'Aspirant',
            xp: enriched.xp ?? 0,
            merits: enriched.merits ?? 0,
            equippedShieldId: enriched.equippedShieldId || 'generic_pvc',
            wildcardsCount: enriched.wildcardsCount || 0,
            unlockedShieldIds: enriched.unlockedShieldIds || [],
            failedQuestionIds: enriched.failedQuestionIds || [],
            savedQuestionIds: enriched.savedQuestionIds || [],
            savedMnemonicIds: enriched.savedMnemonicIds || [],
            lastActiveDay: enriched.lastActiveDay,
            readBroadcastIds: enriched.readBroadcastIds || []
          });
        }
      } else {
        if (!getStoredLocalUser()) {
          if (isMounted) setCurrentUser(null);
        }
      }
      if (isMounted) setAuthChecked(true);
    });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Latido de Presencia mientras haya un usuario con sesión activa
  useEffect(() => {
    if (!currentUser?.uid) return;
    const stopPresence = startOnlinePresence(currentUser.uid);
    return () => stopPresence();
  }, [currentUser?.uid]);

  // Handle Logout
  const handleLogout = async () => {
    await logOutUser();
    setCurrentUser(null);
  };

  // Update Stats: XP, Merits, Failed question, Saved question (100% Sincronitzat a Supabase)
  const handleUpdateStats = async (
    xpGained: number, 
    meritsGained: number, 
    failedId?: string, 
    savedId?: string,
    answeredId?: string,
    isCorrect?: boolean
  ) => {
    if (!currentUser) return;

    const newXp = currentUser.xp + xpGained;
    const newMerits = Math.max(0, currentUser.merits + meritsGained);
    const oldRank = currentUser.rank;
    const newRank = calculateRank(newXp);

    let updatedFailed = [...(currentUser.failedQuestionIds || [])];
    const currentMistakes = { ...(currentUser.questionMistakesCount || {}) };

    if (failedId) {
      if (!updatedFailed.includes(failedId)) {
        updatedFailed.push(failedId);
      }
      currentMistakes[failedId] = (currentMistakes[failedId] || 0) + 1;
    }

    let updatedSaved = [...(currentUser.savedQuestionIds || [])];
    if (savedId && !updatedSaved.includes(savedId)) {
      updatedSaved.push(savedId);
    }

    let updatedAnswered = [...(currentUser.answeredQuestionIds || [])];
    if (answeredId && !updatedAnswered.includes(answeredId)) {
      updatedAnswered.push(answeredId);
    } else if (failedId && !updatedAnswered.includes(failedId)) {
      updatedAnswered.push(failedId);
    }

    let updatedCorrect = [...(currentUser.correctQuestionIds || [])];
    if (answeredId && isCorrect && !updatedCorrect.includes(answeredId)) {
      updatedCorrect.push(answeredId);
    }

    // Check if user ascended to a new rank
    let finalMerits = newMerits;
    let finalWildcards = currentUser.wildcardsCount || 0;
    if (newRank.id !== oldRank?.id && xpGained > 0 && newRank.minXp > (oldRank?.minXp || 0)) {
      // Bonificació extra per ascens oficial: +50 Mèrits i +1 Comodí
      finalMerits += 50;
      finalWildcards += 1;

      // Disparar doble onada de confeti d'alta intensitat
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        confetti({
          particleCount: 160,
          spread: 120,
          origin: { y: 0.4 }
        });
      }, 400);

      // Obrir la targeta emergent sofisticada amb bonificacions
      setRankUpModalData({
        newRank,
        oldRank: oldRank || null
      });
    }

    const updatedUser: UserProfile = {
      ...currentUser,
      xp: newXp,
      merits: finalMerits,
      wildcardsCount: finalWildcards,
      rank: newRank,
      failedQuestionIds: updatedFailed,
      savedQuestionIds: updatedSaved,
      answeredQuestionIds: updatedAnswered,
      correctQuestionIds: updatedCorrect,
      questionMistakesCount: currentMistakes
    };

    setCurrentUser(updatedUser);
    await syncUserProfileUpdate(updatedUser);

    // SINCRONIZACIÓN NÚVOL DIRECTA A SUPABASE
    await Promise.all([
      syncSupabaseProfile({
        uid: updatedUser.uid,
        username: updatedUser.displayName || 'Aspirant',
        email: updatedUser.email,
        total_points: updatedUser.xp ?? 0,
        xp: updatedUser.xp ?? 0,
        merits: updatedUser.merits ?? 0,
        avatar_url: updatedUser.equippedShieldId || 'generic_pvc',
        equippedShieldId: updatedUser.equippedShieldId || 'generic_pvc'
      }),
      syncSupabaseUserProgression(updatedUser.uid, {
        username: updatedUser.displayName,
        merits: updatedUser.merits,
        xp: updatedUser.xp,
        wildcardsCount: updatedUser.wildcardsCount || 0,
        unlockedShieldIds: updatedUser.unlockedShieldIds || [],
        equippedShieldId: updatedUser.equippedShieldId || 'generic_pvc',
        failedQuestionIds: updatedUser.failedQuestionIds || [],
        savedQuestionIds: updatedUser.savedQuestionIds || [],
        answeredQuestionIds: updatedUser.answeredQuestionIds || [],
        correctQuestionIds: updatedUser.correctQuestionIds || [],
        questionMistakesCount: updatedUser.questionMistakesCount || {},
        canViewStudyReport: updatedUser.canViewStudyReport || false,
        savedMnemonicIds: updatedUser.savedMnemonicIds || []
      })
    ]);
  };

  // Actualitzar quantitat de Comodins 50%
  const handleUpdateWildcards = async (delta: number) => {
    if (!currentUser) return;
    const current = currentUser.wildcardsCount || 0;
    const updated = Math.max(0, current + delta);
    const updatedUser: UserProfile = {
      ...currentUser,
      wildcardsCount: updated
    };
    setCurrentUser(updatedUser);
    await syncUserProfileUpdate(updatedUser);
    await syncSupabaseUserProgression(updatedUser.uid, {
      wildcardsCount: updated
    });
  };

  // Comprar Comodí 50% a la botiga per 10 Mèrits
  const handleBuyWildcard = async () => {
    if (!currentUser || currentUser.merits < 10) {
      alert("Et calen almenys 10 Mèrits per adquirir un Comodí 50%.");
      return;
    }
    const updatedUser: UserProfile = {
      ...currentUser,
      merits: currentUser.merits - 10,
      wildcardsCount: (currentUser.wildcardsCount || 0) + 1
    };
    setCurrentUser(updatedUser);
    await syncUserProfileUpdate(updatedUser);
    await Promise.all([
      syncSupabaseProfile({
        uid: updatedUser.uid,
        username: updatedUser.displayName || 'Aspirant',
        total_points: updatedUser.xp ?? 0,
        xp: updatedUser.xp ?? 0,
        merits: updatedUser.merits ?? 0,
        avatar_url: updatedUser.equippedShieldId || 'generic_pvc',
        equippedShieldId: updatedUser.equippedShieldId || 'generic_pvc'
      }),
      syncSupabaseUserProgression(updatedUser.uid, {
        merits: updatedUser.merits,
        wildcardsCount: updatedUser.wildcardsCount
      })
    ]);
  };

  // Remove question from failed list once mastered
  const handleRemoveFailedQuestion = async (questionId: string) => {
    if (!currentUser) return;
    const updatedFailed = (currentUser.failedQuestionIds || []).filter(id => id !== questionId);
    const updatedUser: UserProfile = {
      ...currentUser,
      failedQuestionIds: updatedFailed
    };
    setCurrentUser(updatedUser);
    await syncUserProfileUpdate(updatedUser);
    await syncSupabaseUserProgression(updatedUser.uid, {
      failedQuestionIds: updatedFailed
    });
  };

  // Toggle Save Question for review
  const handleToggleSaveQuestion = async (questionId: string) => {
    if (!currentUser) return;
    let updatedSaved = [...(currentUser.savedQuestionIds || [])];
    if (updatedSaved.includes(questionId)) {
      updatedSaved = updatedSaved.filter(id => id !== questionId);
    } else {
      updatedSaved.push(questionId);
    }
    const updatedUser: UserProfile = {
      ...currentUser,
      savedQuestionIds: updatedSaved
    };
    setCurrentUser(updatedUser);
    await syncUserProfileUpdate(updatedUser);
    await syncSupabaseUserProgression(updatedUser.uid, {
      savedQuestionIds: updatedSaved
    });
  };

  // Toggle Save Mnemonic Rule or Trap for review
  const handleToggleSaveMnemonic = async (ruleId: string) => {
    if (!currentUser) return;
    let updatedRules = [...(currentUser.savedMnemonicIds || [])];
    if (updatedRules.includes(ruleId)) {
      updatedRules = updatedRules.filter(id => id !== ruleId);
    } else {
      updatedRules.push(ruleId);
    }
    const updatedUser: UserProfile = {
      ...currentUser,
      savedMnemonicIds: updatedRules
    };
    setCurrentUser(updatedUser);
    await syncUserProfileUpdate(updatedUser);
    await syncSupabaseUserProgression(updatedUser.uid, {
      savedMnemonicIds: updatedRules
    });
  };

  // Equip Shield
  const handleEquipShield = async (shieldId: string) => {
    if (!currentUser) return;
    const unlocked = currentUser.unlockedShieldIds?.includes(shieldId)
      ? currentUser.unlockedShieldIds
      : [...(currentUser.unlockedShieldIds || []), shieldId];
    const updatedUser: UserProfile = {
      ...currentUser,
      equippedShieldId: shieldId,
      unlockedShieldIds: unlocked
    };
    setCurrentUser(updatedUser);
    await syncUserProfileUpdate(updatedUser);
    await Promise.all([
      syncSupabaseProfile({
        uid: updatedUser.uid,
        username: updatedUser.displayName || 'Aspirant',
        total_points: updatedUser.xp ?? 0,
        xp: updatedUser.xp ?? 0,
        merits: updatedUser.merits ?? 0,
        avatar_url: shieldId,
        equippedShieldId: shieldId
      }),
      syncSupabaseUserProgression(updatedUser.uid, {
        equippedShieldId: shieldId,
        unlockedShieldIds: unlocked
      })
    ]);
  };

  // Award / Unlock Shield when completing an ambit on board
  const handleUnlockShield = async (shieldId: string) => {
    if (!currentUser) return;
    if (currentUser.unlockedShieldIds?.includes(shieldId)) return;
    const updatedUnlocked = [...(currentUser.unlockedShieldIds || []), shieldId];
    const updatedUser: UserProfile = {
      ...currentUser,
      unlockedShieldIds: updatedUnlocked
    };
    setCurrentUser(updatedUser);
    await syncUserProfileUpdate(updatedUser);
    await Promise.all([
      syncSupabaseProfile({
        uid: updatedUser.uid,
        username: updatedUser.displayName || 'Aspirant',
        email: updatedUser.email,
        total_points: updatedUser.xp ?? 0,
        xp: updatedUser.xp ?? 0,
        merits: updatedUser.merits ?? 0,
        avatar_url: updatedUser.equippedShieldId || shieldId,
        equippedShieldId: updatedUser.equippedShieldId || shieldId
      }),
      syncSupabaseUserProgression(updatedUser.uid, {
        unlockedShieldIds: updatedUnlocked
      })
    ]);
  };

  // Buy Shield with Merits
  const handleBuyShield = async (shield: SpecializedShield) => {
    if (!currentUser || currentUser.merits < shield.preuMerits) return;
    const updatedUnlocked = [...(currentUser.unlockedShieldIds || []), shield.id];
    const updatedUser: UserProfile = {
      ...currentUser,
      merits: currentUser.merits - shield.preuMerits,
      unlockedShieldIds: updatedUnlocked,
      equippedShieldId: shield.id
    };
    setCurrentUser(updatedUser);
    await syncUserProfileUpdate(updatedUser);
    await Promise.all([
      syncSupabaseProfile({
        uid: updatedUser.uid,
        username: updatedUser.displayName || 'Aspirant',
        email: updatedUser.email,
        total_points: updatedUser.xp ?? 0,
        xp: updatedUser.xp ?? 0,
        merits: updatedUser.merits ?? 0,
        avatar_url: shield.id,
        equippedShieldId: shield.id
      }),
      syncSupabaseUserProgression(updatedUser.uid, {
        merits: updatedUser.merits,
        unlockedShieldIds: updatedUnlocked,
        equippedShieldId: shield.id
      })
    ]);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-400">Carregant plataforma Agent Medina...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center relative">
        <AuthModal onLoginSuccess={async (profile) => {
          const enriched = await enrichUserWithCloudData(profile);
          setCurrentUser(enriched);
          const uid = enriched.uid || (enriched as any).id || '';
          syncSupabaseProfile({
            uid,
            username: enriched.displayName || 'Aspirant',
            total_points: enriched.xp ?? 0,
            xp: enriched.xp ?? 0,
            merits: enriched.merits ?? 0,
            avatar_url: enriched.equippedShieldId || 'generic_pvc',
            equippedShieldId: enriched.equippedShieldId || 'generic_pvc'
          });
          syncSupabaseUserProgression(uid, {
            username: enriched.displayName || 'Aspirant',
            xp: enriched.xp ?? 0,
            merits: enriched.merits ?? 0,
            equippedShieldId: enriched.equippedShieldId || 'generic_pvc',
            wildcardsCount: enriched.wildcardsCount || 0,
            unlockedShieldIds: enriched.unlockedShieldIds || []
          });
        }} />
      </div>
    );
  }

  const isAdminUser = Boolean(
    currentUser?.isAdmin || 
    currentUser?.role === 'admin' || 
    currentUser?.email?.toLowerCase().trim() === 'opossscar@gmail.com'
  );

  const isSubscriptionExpired = Boolean(
    currentUser &&
    !isAdminUser &&
    !currentUser.isUnlimited &&
    currentUser.subscriptionStatus !== 'unlimited' &&
    (!currentUser.subscriptionExpiresAt || new Date(currentUser.subscriptionExpiresAt).getTime() <= Date.now())
  );

  const handleSubscriptionUpdated = (newExpiresAt: string | null, isUnlimited: boolean) => {
    if (!currentUser) return;
    setCurrentUser(prev => prev ? {
      ...prev,
      subscriptionExpiresAt: newExpiresAt,
      isUnlimited,
      subscriptionStatus: isUnlimited ? 'unlimited' : 'active'
    } : null);
    setShowSubscriptionModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {domainAlert && (
        <div className="bg-amber-950/90 border-b border-amber-800/80 text-amber-200 text-xs px-4 py-2.5 flex items-center justify-between gap-3 shadow-md z-40 backdrop-blur">
          <div className="flex items-center gap-2 max-w-4xl truncate">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">
              <strong className="text-amber-300">Mode Local actiu:</strong> El domini <code className="bg-amber-900/60 px-1.5 py-0.5 rounded text-white font-mono text-[11px]">{domainAlert.domain}</code> no està autoritzat a Firebase Auth. Les dades i el progrés es desen al perfil local i al núvol Supabase.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(domainAlert.domain);
                setDomainCopied(true);
                setTimeout(() => setDomainCopied(false), 3000);
              }}
              title="Copiar domini per afegir-lo a Firebase Console"
              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-xs font-bold flex items-center gap-1 border border-amber-500/40 cursor-pointer"
            >
              {domainCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{domainCopied ? 'Copiat!' : 'Copiar Domini'}</span>
            </button>
            <button
              type="button"
              onClick={() => setDomainAlert(null)}
              className="p-1 hover:bg-amber-900/60 rounded-md text-amber-400 hover:text-white cursor-pointer"
              title="Tancar avís"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {rankUpNotification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 p-4 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-2xl shadow-2xl flex items-center gap-3 border border-white animate-in slide-in-from-top duration-300">
          <Sparkles className="w-6 h-6 shrink-0 text-slate-950" />
          <span className="text-sm">{rankUpNotification}</span>
        </div>
      )}

      <Navbar
        user={currentUser}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        onOpenAdminPanel={() => setShowAdminModal(true)}
        onOpenSubscriptionModal={() => setShowSubscriptionModal(true)}
        onOpenNotificationsModal={() => setShowNotificationsModal(true)}
        onOpenLegalModal={() => setShowLegalModal(true)}
        sectionLabels={sectionConfig as any}
      />

      {/* Notificació Toast en Temps Real de Torn de Duel o Avançament */}
      <TurnNotificationToast
        notification={activePushNotification}
        onOpenMatch={(matchId) => {
          if (activePushNotification?.type === 'oca_overtake') {
            setActiveTab('campanya');
          } else {
            setActiveTab('duels');
          }
          setActivePushNotification(null);
        }}
        onDismiss={() => setActivePushNotification(null)}
      />

      <main className="flex-1 pb-10">
        {activeTab === 'campanya' && (
          <ModeCampanya
            user={currentUser}
            onUpdateUserStats={(xp, merits, failedId, savedId, answeredId, isCorrect) => 
              handleUpdateStats(xp, merits, failedId, savedId, answeredId, isCorrect)
            }
            onSaveQuestionToggle={handleToggleSaveQuestion}
            onUnlockShield={handleUnlockShield}
            onUpdateWildcards={handleUpdateWildcards}
          />
        )}

        {activeTab === 'duels' && (
          <ModeDuels
            user={currentUser}
            onUpdateUserStats={(xp, merits, failedId, savedId, answeredId, isCorrect) => 
              handleUpdateStats(xp, merits, failedId, savedId, answeredId, isCorrect)
            }
            onSaveQuestionToggle={handleToggleSaveQuestion}
            onUpdateWildcards={handleUpdateWildcards}
          />
        )}

        {activeTab === 'tienda' && (
          <TiendaEscuts
            user={currentUser}
            onEquipShield={handleEquipShield}
            onBuyShield={handleBuyShield}
            onBuyWildcard={handleBuyWildcard}
          />
        )}

        {activeTab === 'repas' && (
          <SeccioRepas
            user={currentUser}
            onRemoveFailedQuestion={handleRemoveFailedQuestion}
            onToggleSaveQuestion={handleToggleSaveQuestion}
            onToggleSaveMnemonic={handleToggleSaveMnemonic}
            onUpdateStats={(xp, merits, failedId, savedId, answeredId, isCorrect) => 
              handleUpdateStats(xp, merits, failedId, savedId, answeredId, isCorrect)
            }
          />
        )}

        {activeTab === 'ranking' && (
          <RankingGlobal currentUser={currentUser} />
        )}
      </main>

      {/* FOOTER OFICIAL: AVÍS LEGAL I DESCÀRREC DE RESPONSABILITAT */}
      <footer className="w-full py-6 px-4 border-t border-slate-900 bg-slate-950/80 text-center text-[11px] text-slate-400 mt-auto">
        <div className="max-w-4xl mx-auto space-y-2">
          <p className="font-semibold text-slate-300">
            Agent Medina • Preparació Oficial i Gamificació d'Oposicions CME
          </p>
          <p className="leading-relaxed">
            <strong>Avís legal i descàrrec de responsabilitat:</strong> Aquesta plataforma és una eina independent de formació i gamificació desenvolupada per a la preparació d'oposicions. No té cap vinculació oficial, aval ni representació amb el Departament d'Interior, la Generalitat de Catalunya ni la Direcció General de la Policia (Cos de Mossos d'Esquadra).
          </p>
          <div>
            <button
              type="button"
              onClick={() => setShowLegalModal(true)}
              className="text-amber-400/90 hover:text-amber-300 underline decoration-amber-500/40 hover:decoration-amber-300 font-bold transition-colors cursor-pointer text-xs"
            >
              📜 Condicions d'Ús, Propietat Intel·lectual i Prohibició de Lucrament
            </button>
          </div>
        </div>
      </footer>

      <ImportQuestionsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onQuestionsImported={(count) => {
          alert(`S'han afegit ${count} noves preguntes al teu banc interactiu!`);
        }}
      />

      <AdminPanelModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        currentUserEmail={currentUser.email}
        currentUserRole={currentUser.role || (isAdminUser ? 'admin' : 'aspirant')}
      />

      {/* Modal de Subscripció i Canje de Codis (Bloquejant si ha caducat) */}
      <SubscriptionModal
        isOpen={showSubscriptionModal || isSubscriptionExpired}
        onClose={() => setShowSubscriptionModal(false)}
        currentUser={currentUser}
        isLockedMode={isSubscriptionExpired}
        onSubscriptionUpdated={handleSubscriptionUpdated}
      />

      {/* Modal d'Impugnació de Preguntes */}
      <ImpugnarModal
        isOpen={impugnarQuestion !== null}
        onClose={() => setImpugnarQuestion(null)}
        question={impugnarQuestion}
        currentUser={currentUser}
      />

      {/* Modal de Configuració de Notificacions Personals */}
      {currentUser && (
        <NotificationsCenterModal
          user={currentUser}
          isOpen={showNotificationsModal}
          onClose={() => setShowNotificationsModal(false)}
          onUpdatePreferences={handleUpdateNotificationPreferences}
          deferredPrompt={deferredPrompt}
        />
      )}

      {/* Modal de Condicions d'Ús i Propietat Intel·lectual */}
      <LegalTermsModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
      />

      {/* =========================================================================
          TARGETA EMERGENT SOFISTICADA D'ASCENS POLICIAL I BONIFICACIONS
         ========================================================================= */}
      {rankUpModalData && (
        <RankUpCelebrationModal
          isOpen={true}
          onClose={() => setRankUpModalData(null)}
          newRank={rankUpModalData.newRank}
          oldRank={rankUpModalData.oldRank}
          currentXp={currentUser?.xp || 0}
          bonusMeritsAwarded={50}
        />
      )}

      {/* =========================================================================
          NOTIFICACIÓ MODESTA D'ASCENS EN EL RÀNQUING GLOBAL (SUPERAR OPOSITOR)
         ========================================================================= */}
      {leaderboardRiseNotification && (
        <div className="fixed top-18 right-4 sm:right-6 z-50 max-w-xs p-3.5 bg-gradient-to-r from-slate-900 to-slate-950 border border-emerald-500/50 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-right duration-300">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
            <TrendingUp className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="font-bold text-xs text-white flex items-center gap-1.5">
              <span>Escalada al Rànquing!</span>
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                #{leaderboardRiseNotification.newPos}
              </span>
            </h5>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
              Has pujat de la posició <span className="line-through text-slate-500">#{leaderboardRiseNotification.previousPos}</span> a la <strong className="text-emerald-300">#{leaderboardRiseNotification.newPos}</strong> superant a {leaderboardRiseNotification.opponentName}!
            </p>
          </div>
          <button
            onClick={() => setLeaderboardRiseNotification(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* =========================================================================
          AVÍS DE DECAÏMENT D'XP PER INACTIVITAT (-20 XP per dia sense connectar-se)
         ========================================================================= */}
      {xpDecayNotification && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 max-w-sm p-4 bg-slate-900 border border-amber-500/50 rounded-2xl shadow-2xl flex items-start gap-3 animate-in slide-in-from-bottom duration-300">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
            <ArrowDownCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
              <span>Resta per Inactivitat</span>
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-200">
                -{xpDecayNotification.xpLost} XP
              </span>
            </h5>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
              Has estat <strong className="text-white">{xpDecayNotification.daysMissed} {xpDecayNotification.daysMissed === 1 ? 'dia' : 'dies'}</strong> sense connectar-te (-20 XP/dia). Repassa avui per recuperar punts i no baixar de rang!
            </p>
          </div>
          <button
            onClick={() => setXpDecayNotification(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =========================================================================
          COMUNICAT OFICIAL DE L'ADMINISTRADOR AL MIG DE LA PANTALLA
          Apareix al mig i bloqueja fins que l'aspirant premi a "Llegit"
         ========================================================================= */}
      {(() => {
        if (!activeBroadcast || !activeBroadcast.active) return null;
        const readList = currentUser?.readBroadcastIds || [];
        let localRead: string[] = [];
        try {
          localRead = JSON.parse(localStorage.getItem('medina_read_broadcasts') || '[]');
        } catch {}

        if (readList.includes(activeBroadcast.id) || localRead.includes(activeBroadcast.id)) {
          return null;
        }

        const isUrgent = activeBroadcast.priority === 'urgent';
        const isImportant = activeBroadcast.priority === 'important' || !activeBroadcast.priority;

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
            <div className={`w-full max-w-lg rounded-3xl p-6 sm:p-8 flex flex-col shadow-2xl border-2 transition-all relative overflow-hidden ${
              isUrgent
                ? 'bg-slate-900 border-red-500/80 shadow-red-500/20'
                : isImportant
                  ? 'bg-slate-900 border-amber-500/80 shadow-amber-500/20'
                  : 'bg-slate-900 border-sky-500/80 shadow-sky-500/20'
            }`}>
              {/* Glow decoratiu superior */}
              <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-2 rounded-full ${
                isUrgent ? 'bg-red-500' : isImportant ? 'bg-amber-500' : 'bg-sky-500'
              }`} />

              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-2xl shrink-0 ${
                  isUrgent 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                    : isImportant
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                }`}>
                  <Megaphone className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    isUrgent
                      ? 'bg-red-500/20 text-red-300 border-red-500/30'
                      : isImportant
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                  }`}>
                    {isUrgent ? '🚨 Comunicat Urgent' : isImportant ? '📢 Comunicat Oficial de l\'Acadèmia' : 'ℹ️ Avís Informativa'}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white mt-1 leading-snug">
                    {activeBroadcast.title}
                  </h3>
                </div>
              </div>

              {/* Missatge central */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-slate-200 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed max-h-[50vh] overflow-y-auto mb-6">
                {activeBroadcast.message}
              </div>

              {/* Peu amb informació d'emissió i Botó He Llegit */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
                <span className="text-[11px] text-slate-500 font-mono text-center sm:text-left">
                  Emès per: {activeBroadcast.authorName || 'Direcció Pedagògica'}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    const broadcastId = activeBroadcast.id;
                    // Guardar també a localStorage immediatament
                    try {
                      const localRead = JSON.parse(localStorage.getItem('medina_read_broadcasts') || '[]');
                      if (!localRead.includes(broadcastId)) {
                        localRead.push(broadcastId);
                        localStorage.setItem('medina_read_broadcasts', JSON.stringify(localRead));
                      }
                    } catch {}

                    if (!currentUser) {
                      setActiveBroadcast(null);
                      return;
                    }
                    const newRead = Array.from(new Set([...(currentUser.readBroadcastIds || []), broadcastId]));
                    const updated: UserProfile = {
                      ...currentUser,
                      readBroadcastIds: newRead
                    };
                    setCurrentUser(updated);
                    await syncUserProfileUpdate({
                      uid: currentUser.uid,
                      readBroadcastIds: newRead
                    } as any);
                    await syncSupabaseUserProgression(currentUser.uid, {
                      readBroadcastIds: newRead
                    });
                  }}
                  className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-black text-xs sm:text-sm transition-all shadow-xl cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                    isUrgent
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : isImportant
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        : 'bg-sky-600 hover:bg-sky-500 text-white'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>He llegit el comunicat</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
