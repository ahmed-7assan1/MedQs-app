import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ChatConfigState {
  backgroundImage: string | null;
  bubbleColor: string;
  userBubbleColor: string;
  setBackgroundImage: (uri: string | null) => void;
  setBubbleColor: (color: string) => void;
  setUserBubbleColor: (color: string) => void;
  resetConfig: () => void;
}

export const useChatConfigStore = create<ChatConfigState>()(
  persist(
    (set) => ({
      backgroundImage: null,
      bubbleColor: 'white/5', // default assistant bubble color
      userBubbleColor: '#111827', // default user bubble color
      setBackgroundImage: (uri) => set({ backgroundImage: uri }),
      setBubbleColor: (color) => set({ bubbleColor: color }),
      setUserBubbleColor: (color) => set({ userBubbleColor: color }),
      resetConfig: () => set({ backgroundImage: null, bubbleColor: 'white/5', userBubbleColor: '#111827' }),
    }),
    {
      name: 'chat-config-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
