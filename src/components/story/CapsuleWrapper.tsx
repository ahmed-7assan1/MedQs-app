"use client";

import { useState, createContext, useContext, useCallback } from "react";
import { StoryCapsule } from "@/components/landing/StoryCapsule";

interface CapsuleCtx {
  capsuleOpen: boolean;
  setCapsuleOpen: (v: boolean) => void;
}

const CapsuleContext = createContext<CapsuleCtx>({
  capsuleOpen: false,
  setCapsuleOpen: () => {},
});

export function useCapsule() {
  return useContext(CapsuleContext);
}

export function CapsuleWrapper({ children }: { children: React.ReactNode }) {
  const [capsuleOpen, setCapsuleOpen] = useState(false);
  const open = useCallback(() => setCapsuleOpen(true), []);
  const close = useCallback(() => setCapsuleOpen(false), []);

  return (
    <CapsuleContext.Provider value={{ capsuleOpen, setCapsuleOpen: open }}>
      {children}
      <StoryCapsule isOpen={capsuleOpen} onClose={close} />
    </CapsuleContext.Provider>
  );
}
