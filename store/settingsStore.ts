import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Equipment = 'floor' | 'pullup_bar' | 'rings' | 'dip_bars' | 'vest';
export type Difficulty = 'easy' | 'normal' | 'hard';

interface SettingsState {
  equipment: Equipment[];
  difficulty: Difficulty;
  weightKg: number;
  habitStack: string;
  cvEnabled: boolean;
  notificationsEnabled: boolean;
  notificationTime: string; // HH:MM
  toggleEquipment: (item: Equipment) => void;
  setDifficulty: (d: Difficulty) => void;
  setWeightKg: (w: number) => void;
  setHabitStack: (s: string) => void;
  setCvEnabled: (v: boolean) => void;
  setNotificationsEnabled: (v: boolean) => void;
  setNotificationTime: (t: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      equipment: ['floor'],
      difficulty: 'normal',
      weightKg: 75,
      habitStack: '',
      cvEnabled: false,
      notificationsEnabled: false,
      notificationTime: '19:00',

      toggleEquipment: (item) =>
        set((state) => ({
          equipment: state.equipment.includes(item)
            ? state.equipment.filter((e) => e !== item)
            : [...state.equipment, item],
        })),
      setDifficulty: (difficulty) => set({ difficulty }),
      setWeightKg: (weightKg) => set({ weightKg }),
      setHabitStack: (habitStack) => set({ habitStack }),
      setCvEnabled: (cvEnabled) => set({ cvEnabled }),
      setNotificationsEnabled: (notificationsEnabled) =>
        set({ notificationsEnabled }),
      setNotificationTime: (notificationTime) => set({ notificationTime }),
    }),
    { name: 'repiq-settings' }
  )
);
