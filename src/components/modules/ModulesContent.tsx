"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getView, subscribe, setView } from "@/lib/view-store";
import SavedView from "@/components/modules/SavedView";

export default function ModulesContent({ children }: { children: ReactNode }) {
  const [view, setViewState] = useState(getView());

  useEffect(() => {
    const unsub = subscribe((v) => { setViewState(v); });
    return unsub;
  }, []);

  return (
    <AnimatePresence mode="wait">
      {view === "saved" ? (
        <motion.div
          key="saved"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          <SavedView onBack={() => setView("modules")} />
        </motion.div>
      ) : (
        <motion.div
          key="modules"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
