import { create } from 'zustand';

interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  image?: string;
}

interface QuizState {
  pastPaperId: string | null;
  questions: Question[];
  answers: Record<string, number>; // questionId -> optionIndex
  flagged: string[]; // list of questionIds
  currentIndex: number;
  timeRemaining: number;
  focusLossCount: number;
  isCompleted: boolean;

  setQuestions: (questions: Question[]) => void;
  setPastPaperId: (id: string) => void;
  setAnswer: (questionId: string, optionIndex: number) => void;
  toggleFlag: (questionId: string) => void;
  setCurrentIndex: (index: number) => void;
  tickTimer: () => void;
  incrementFocusLoss: () => void;
  reset: () => void;
  complete: () => void;
}

export const useQuizStore = create<QuizState>((set) => ({
  pastPaperId: null,
  questions: [],
  answers: {},
  flagged: [],
  currentIndex: 0,
  timeRemaining: 0,
  focusLossCount: 0,
  isCompleted: false,

  setQuestions: (questions) => set({ questions }),
  setPastPaperId: (pastPaperId) => set({ pastPaperId }),
  setAnswer: (questionId, optionIndex) => 
    set((state) => ({ answers: { ...state.answers, [questionId]: optionIndex } })),
  toggleFlag: (questionId) => 
    set((state) => ({
      flagged: state.flagged.includes(questionId)
        ? state.flagged.filter((id) => id !== questionId)
        : [...state.flagged, questionId]
    })),
  setCurrentIndex: (currentIndex) => set({ currentIndex }),
  tickTimer: () => set((state) => ({ timeRemaining: Math.max(0, state.timeRemaining - 1) })),
  incrementFocusLoss: () => set((state) => ({ focusLossCount: state.focusLossCount + 1 })),
  reset: () => set({
    questions: [],
    answers: {},
    flagged: [],
    currentIndex: 0,
    timeRemaining: 0,
    focusLossCount: 0,
    isCompleted: false,
    pastPaperId: null,
  }),
  complete: () => set({ isCompleted: true }),
}));
