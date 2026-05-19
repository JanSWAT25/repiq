import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Badge {
  id: string;
  name: string;
  category: string;
  unlockedAt: string;
  xpAwarded: number;
}

interface UserState {
  // Identity
  userName: string;
  // Streak
  streak: number;
  lastCompletedDate: string | null;
  longestStreak: number;
  freezesAvailable: number;
  // XP & Level
  totalXP: number;
  level: number;
  // Badges
  badges: Badge[];
  // Actions
  setUserName: (name: string) => void;
  addXP: (amount: number) => void;
  incrementStreak: (date: string) => void;
  resetStreak: () => void;
  consumeFreeze: () => void;
  addBadge: (badge: Badge) => void;
  getXPForNextLevel: () => number;
}

function levelThreshold(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      userName: 'Athlete',
      streak: 0,
      lastCompletedDate: null,
      longestStreak: 0,
      freezesAvailable: 2,
      totalXP: 0,
      level: 1,
      badges: [],

      setUserName: (name) => set({ userName: name }),

      addXP: (amount) =>
        set((state) => {
          const newXP = state.totalXP + amount;
          let newLevel = state.level;
          while (newXP >= levelThreshold(newLevel + 1)) {
            newLevel++;
          }
          return { totalXP: newXP, level: newLevel };
        }),

      incrementStreak: (date) =>
        set((state) => {
          const newStreak = state.streak + 1;
          return {
            streak: newStreak,
            lastCompletedDate: date,
            longestStreak: Math.max(state.longestStreak, newStreak),
          };
        }),

      resetStreak: () => set({ streak: 0 }),

      consumeFreeze: () =>
        set((state) => ({
          freezesAvailable: Math.max(0, state.freezesAvailable - 1),
        })),

      addBadge: (badge) =>
        set((state) => {
          if (state.badges.find((b) => b.id === badge.id)) return state;
          return { badges: [...state.badges, badge] };
        }),

      getXPForNextLevel: () => {
        const { level } = get();
        return levelThreshold(level + 1);
      },
    }),
    {
      name: 'repiq-user-store',
    skipHydration: true,
    }
  )
);
