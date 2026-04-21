"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setModalState({
        isOpen: true,
        options,
        resolve,
      });
    });
  }, []);

  const handleConfirm = () => {
    if (modalState) {
      modalState.resolve(true);
      setModalState({ ...modalState, isOpen: false });
    }
  };

  const handleCancel = () => {
    if (modalState) {
      modalState.resolve(false);
      setModalState({ ...modalState, isOpen: false });
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {modalState && (
        <ConfirmationModal
          isOpen={modalState.isOpen}
          title={modalState.options.title}
          message={modalState.options.message}
          confirmLabel={modalState.options.confirmLabel}
          cancelLabel={modalState.options.cancelLabel}
          variant={modalState.options.variant}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context.confirm;
}
