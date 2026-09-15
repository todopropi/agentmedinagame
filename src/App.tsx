import React, { useState, useEffect } from 'react';
import { UserProfile, SpecializedShield, DuelGame } from './types';
import { 
  initAuthListener, 
  logOutUser, 
  syncUserProfileUpdate, 
  loadUserProfile,
  updateUserPresence,
  getActiveUsers,
  createDirectChallengeGame
} from './firebase';
import { calculateRank } from './data/ranks';
import { SPECIALIZED_SHIELDS } from './data/badges';
import { AuthModal } from './components/AuthModal';
import { Navbar, ActiveTab } from './components/Navbar';
import { ModeCampanya } from './components/ModeCampanya';
import { ModeDuels } from './components/ModeDuels';
import { TiendaEscuts } from './components/TiendaEscuts';
import { SeccioRepas } from './components/SeccioRepas';
import { RankingGlobal } from './components/RankingGlobal';
import { ImportQuestionsModal } from './components/ImportQuestionsModal';
import { ActiveUsersModal } from './components/ActiveUsersModal';
import confetti from 'canvas-confetti';
import { Upload, Sparkles, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('campanya');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showActiveUsersModal, setShowActiveUsersModal] = useState(false);
  const [activeUsersCount, setActiveUsersCount] = useState(3);
  const [directDuelGame, setDirectDuelGame] = useState<DuelGame | null>(null);
  const [rankUpNotification, setRankUpNotification] = useState<string | null>(null);

  // Initialize Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = initAuthListener(async (user) => {
      if (user) {
        const fullProfile = await loadUserProfile(user.uid);
        if (fullProfile) {
          // Re-calculate rank based on XP
          fullProfile.rank = calculateRank(fullProfile.xp);
          fullProfile.isOnline = true;
          fullProfile.lastActive = Date.now();
          setCurrentUser(fullProfile);
        } else {
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
      }
      setAuthChecked(true);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Periodic Presence Heartbeat & Active Users Count Update
  useEffect(() => {
    if (!currentUser) return;

    const refreshPresence = async () => {
      try {
        await updateUserPresence(currentUser.uid, true);
        const active = await getActiveUsers(currentUser.uid);
        setActiveUsersCount(active.length);
      } catch (err) {
        // silent
      }
    };

    refreshPresence();
    const interval = setInterval(refreshPresence, 60 * 1000); // every minute

    return () => clearInterval(interval);
  }, [currentUser?.uid]);

  // Handle Logout
  const handleLogout = async () => {
    if (currentUser) {
      await updateUserPresence(currentUser.uid, false);
    }
    await logOutUser();
    setCurrentUser(null);
  };

  // Launch direct duel with a challenged user
  const handleStartDirectDuel = (game: DuelGame) => {
    setDirectDuelGame(game);
    setActiveTab('duels');
  };

  const handleChallengeFromRanking = async (player: UserProfile) => {
    if (!currentUser) return;
    try {
      const newGame = await createDirectChallengeGame(currentUser, player);
      handleStartDirectDuel(newGame);
    } catch (err) {
      console.error('Error starting duel from ranking:', err);
    }
  };

  // Update Stats: XP, Merits, Failed question, Saved question
  const handleUpdateStats = async (
    xpGained: number, 
    meritsGained: number, 
    failedId?: string, 
    savedId?: string
  ) => {
    if (!currentUser) return;

    const newXp = currentUser.xp + xpGained;
    const newMerits = currentUser.merits + meritsGained;
    const oldRank = currentUser.rank;
    const newRank = calculateRank(newXp);

    let updatedFailed = [...(currentUser.failedQuestionIds || [])];
    if (failedId && !updatedFailed.includes(failedId)) {
      updatedFailed.push(failedId);
    }

    let updatedSaved = [...(currentUser.savedQuestionIds || [])];
    if (savedId && !updatedSaved.includes(savedId)) {
      updatedSaved.push(savedId);
    }

    // Check if user ascended to a new rank
    if (newRank.id !== oldRank.id && xpGained > 0) {
      setRankUpNotification(`🎉 Ascens Policial! Has assolit el rang de: ${newRank.name} (${newRank.categoryName})`);
      confetti({
        particleCount: 140,
        spread: 100,
        origin: { y: 0.5 }
      });
      setTimeout(() => setRankUpNotification(null), 5000);
    }

    const updatedUser: UserProfile = {
      ...currentUser,
      xp: newXp,
      merits: newMerits,
      rank: newRank,
      failedQuestionIds: updatedFailed,
      savedQuestionIds: updatedSaved
    };

    setCurrentUser(updatedUser);
    await syncUserProfileUpdate(updatedUser);
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
  };

  // Equip Shield
  const handleEquipShield = async (shieldId: string) => {
    if (!currentUser) return;
    const updatedUser: UserProfile = {
      ...currentUser,
      equippedShieldId: shieldId
    };
    setCurrentUser(updatedUser);
    await syncUserProfileUpdate(updatedUser);
  };

  // Buy Shield with Merits
  const handleBuyShield = async (shield: SpecializedShield) => {
    if (!currentUser || currentUser.merits < shield.preuMerits) return;
    const updatedUnlocked = [...(currentUser.unlockedShieldIds || []), shield.id];
    const updatedUser: UserProfile = {
      ...currentUser,
      merits: currentUser.merits - shield.preuMerits,
      unlockedShieldIds: updatedUnlocked,
      equippedShieldId: shield.id // auto-equip upon purchase
    };
    setCurrentUser(updatedUser);
    await syncUserProfileUpdate(updatedUser);
  };

  // If auth is still checking initial state
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-400">Carregant plataforma Agent Medina...</p>
      </div>
    );
  }

  // Mandatory Authentication Gate: User MUST login to access the game
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center relative">
        <AuthModal onLoginSuccess={(profile) => setCurrentUser(profile)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Rank Up Global Toast */}
      {rankUpNotification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 p-4 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-2xl shadow-2xl flex items-center gap-3 border border-white animate-in slide-in-from-top duration-300">
          <Sparkles className="w-6 h-6 shrink-0 text-slate-950" />
          <span className="text-sm">{rankUpNotification}</span>
        </div>
      )}

      {/* Main App Navigation Bar */}
      <Navbar
        user={currentUser}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        onOpenActiveUsers={() => setShowActiveUsersModal(true)}
        activeUsersCount={activeUsersCount}
      />

      {/* Main Game Screen View */}
      <main className="flex-1 pb-24 sm:pb-16">
        {activeTab === 'campanya' && (
          <ModeCampanya
            user={currentUser}
            onUpdateUserStats={(xp, merits, failedId) => handleUpdateStats(xp, merits, failedId)}
            onSaveQuestionToggle={handleToggleSaveQuestion}
          />
        )}

        {activeTab === 'duels' && (
          <ModeDuels
            user={currentUser}
            onUpdateUserStats={(xp, merits, failedId) => handleUpdateStats(xp, merits, failedId)}
            onSaveQuestionToggle={handleToggleSaveQuestion}
            onOpenActiveUsers={() => setShowActiveUsersModal(true)}
            initialActiveGame={directDuelGame}
          />
        )}

        {activeTab === 'tienda' && (
          <TiendaEscuts
            user={currentUser}
            onEquipShield={handleEquipShield}
            onBuyShield={handleBuyShield}
          />
        )}

        {activeTab === 'repas' && (
          <SeccioRepas
            user={currentUser}
            onRemoveFailedQuestion={handleRemoveFailedQuestion}
            onToggleSaveQuestion={handleToggleSaveQuestion}
            onUpdateStats={(xp, merits) => handleUpdateStats(xp, merits)}
          />
        )}

        {activeTab === 'ranking' && (
          <RankingGlobal 
            currentUser={currentUser} 
            onOpenActiveUsers={() => setShowActiveUsersModal(true)}
            onChallengePlayer={handleChallengeFromRanking}
          />
        )}
      </main>

      {/* Floating Bottom Quick Action: Import Questions (elevated on mobile so it doesn't overlap bottom bar) */}
      <div className="fixed bottom-20 sm:bottom-4 right-3 sm:right-4 z-30">
        <button
          type="button"
          onClick={() => setShowImportModal(true)}
          title="Importar preguntes d'arxius externs"
          className="px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-900/95 hover:bg-slate-800 text-sky-400 hover:text-sky-300 border border-slate-700/80 rounded-2xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 shadow-xl backdrop-blur cursor-pointer transition-all hover:scale-105"
        >
          <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Importar Preguntes (.json)</span>
          <span className="sm:hidden text-[11px]">Banc</span>
        </button>
      </div>

      {/* Import Modal */}
      <ImportQuestionsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onQuestionsImported={(count) => {
          alert(`S'han afegit ${count} noves preguntes al teu banc interactiu!`);
        }}
      />

      {/* Active Users & Search Modal */}
      {currentUser && (
        <ActiveUsersModal
          isOpen={showActiveUsersModal}
          onClose={() => setShowActiveUsersModal(false)}
          currentUser={currentUser}
          onStartDuelWithUser={handleStartDirectDuel}
        />
      )}
    </div>
  );
}
