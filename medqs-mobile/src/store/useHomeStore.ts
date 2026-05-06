import { create } from 'zustand';

interface HomeState {
  homeData: any | null;
  isLoading: boolean;
  setHomeData: (data: any) => void;
  setLoading: (loading: boolean) => void;
}

export const useHomeStore = create<HomeState>((set) => ({
  homeData: null,
  isLoading: true,
  setHomeData: (homeData) => set({ homeData, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));
