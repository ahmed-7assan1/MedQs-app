"use client";

import { motion } from "framer-motion";
import {
  House,
  Compass,
  Plus,
  Bell,
  User,
} from "@phosphor-icons/react";
import type { TabType } from "./types";

interface BottomNavProps {
  active: TabType;
  onTab: (t: TabType) => void;
}

const TABS: { key: TabType; label: string; icon: typeof House }[] = [
  { key: "home", label: "Home", icon: House },
  { key: "explore", label: "Explore", icon: Compass },
    { key: "create", label: "", icon: Plus },
  { key: "activity", label: "Activity", icon: Bell },
  { key: "profile", label: "Profile", icon: User },
];

export function BottomNav({ active, onTab }: BottomNavProps) {
  return (
    <div className="px-2 pb-2">
      <div
        className="community-glass rounded-2xl px-3 py-2 flex items-center justify-around"
      >
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          const isCreate = key === "create";

          if (isCreate) {
            return (
              <motion.button
                key={key}
                whileTap={{ scale: 0.9 }}
                onClick={() => onTab(key)}
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 44,
                  height: 44,
                  background: "var(--brand)",
                  boxShadow: "0 4px 16px rgba(110, 64, 255, 0.4)",
                }}
              >
                <Icon size={20} weight="bold" className="text-white" />
              </motion.button>
            );
          }

          return (
            <button
              key={key}
              onClick={() => onTab(key)}
              className="flex flex-col items-center gap-0.5 relative px-3 py-1"
              style={{ minWidth: 48 }}
            >
              <Icon
                size={20}
                weight={isActive ? "fill" : "regular"}
                style={{
                  color: isActive ? "var(--brand)" : "var(--text-muted)",
                  transition: "color 0.2s",
                }}
              />
              {label && (
                <span
                  className="text-[10px] font-medium"
                  style={{
                    color: isActive ? "var(--brand)" : "var(--text-muted)",
                  }}
                >
                  {label}
                </span>
              )}
              {isActive && (
                <motion.div
                  layoutId="nav-dot"
                  className="absolute -bottom-0.5 w-1 h-1 rounded-full"
                  style={{ background: "var(--brand)" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
