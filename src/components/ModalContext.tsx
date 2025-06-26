import React, { createContext, useContext, useState } from 'react';

interface ModalContextType {
  modalAberto: boolean;
  setModalAberto: (aberto: boolean) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function useModalAberto() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModalAberto deve ser usado dentro do ModalProvider');
  return ctx;
}

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modalAberto, setModalAberto] = useState(false);
  return (
    <ModalContext.Provider value={{ modalAberto, setModalAberto }}>
      {children}
    </ModalContext.Provider>
  );
} 