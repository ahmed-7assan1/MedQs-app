"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface SidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  isCollapsed: boolean;
  setCollapsed: (v: boolean) => void;
  toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: true,
  toggle: () => {},
  close: () => {},
  isCollapsed: false,
  setCollapsed: () => {},
  toggleCollapsed: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setCollapsed] = useState(false);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggleCollapsed = useCallback(() => setCollapsed((prev) => !prev), []);

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, close, isCollapsed, setCollapsed, toggleCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
