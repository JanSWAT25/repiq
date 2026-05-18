import { create } from 'zustand';

export interface SetLog {
  setNumber: number;
  targetReps: number;
  actualReps: number;
  rir: number | null;
  formScore: number | null;
  cvVerified: boolean;
  durationSec: number;
  completedAt: string;
}

export interface ExerciseBlock {
  exerciseId: string;
  exerciseName: string;
  muscleGroups: string[];
  sets: number;
  targetReps: number;
  rir: number;
  restSec: number;
  tempo: string;
  category: string;
  tier: number;
  logs: SetLog[];
}

export interface ActiveWorkout {
  sessionId: string;
  date: string;
  workoutType: string;
  blocks: ExerciseBlock[];
  startedAt: string;
}

interface WorkoutState {
  activeWorkout: ActiveWorkout | null;
  currentBlockIndex: number;
  currentSetIndex: number;
  isResting: boolean;
  restSecondsRemaining: number;
  sessionStartedAt: string | null;

  startWorkout: (workout: ActiveWorkout) => void;
  logSet: (blockIndex: number, setLog: SetLog) => void;
  nextSet: () => void;
  nextBlock: () => void;
  setResting: (isResting: boolean, seconds?: number) => void;
  tickRest: () => void;
  endWorkout: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  activeWorkout: null,
  currentBlockIndex: 0,
  currentSetIndex: 0,
  isResting: false,
  restSecondsRemaining: 0,
  sessionStartedAt: null,

  startWorkout: (workout) =>
    set({
      activeWorkout: workout,
      currentBlockIndex: 0,
      currentSetIndex: 0,
      isResting: false,
      sessionStartedAt: new Date().toISOString(),
    }),

  logSet: (blockIndex, setLog) =>
    set((state) => {
      if (!state.activeWorkout) return state;
      const blocks = [...state.activeWorkout.blocks];
      blocks[blockIndex] = {
        ...blocks[blockIndex],
        logs: [...blocks[blockIndex].logs, setLog],
      };
      return {
        activeWorkout: { ...state.activeWorkout, blocks },
      };
    }),

  nextSet: () =>
    set((state) => {
      const { activeWorkout, currentBlockIndex, currentSetIndex } = state;
      if (!activeWorkout) return state;
      const block = activeWorkout.blocks[currentBlockIndex];
      if (currentSetIndex < block.sets - 1) {
        return { currentSetIndex: currentSetIndex + 1 };
      }
      return state;
    }),

  nextBlock: () =>
    set((state) => ({
      currentBlockIndex: state.currentBlockIndex + 1,
      currentSetIndex: 0,
    })),

  setResting: (isResting, seconds) =>
    set({ isResting, restSecondsRemaining: seconds ?? 0 }),

  tickRest: () =>
    set((state) => ({
      restSecondsRemaining: Math.max(0, state.restSecondsRemaining - 1),
      isResting: state.restSecondsRemaining > 1,
    })),

  endWorkout: () =>
    set({
      activeWorkout: null,
      currentBlockIndex: 0,
      currentSetIndex: 0,
      isResting: false,
      restSecondsRemaining: 0,
      sessionStartedAt: null,
    }),
}));
