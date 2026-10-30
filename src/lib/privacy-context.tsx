'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface PrivacyContextType {
  isBalanceHidden: boolean;
  toggleBalanceHidden: () => void;
  setBalanceHidden: (hidden: boolean) => void;
}

const PrivacyContext = createContext<PrivacyContextType>({
  isBalanceHidden: false,
  toggleBalanceHidden: () => {},
  setBalanceHidden: () => {},
});

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('rupia_privacy_mode');
      if (stored !== null) {
        setIsBalanceHidden(stored === 'true');
      }
    } catch {
      // Ignore localStorage exceptions in restricted contexts
    }
  }, []);

  const toggleBalanceHidden = () => {
    setIsBalanceHidden((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('rupia_privacy_mode', String(next));
      } catch {}
      return next;
    });
  };

  const setBalanceHidden = (hidden: boolean) => {
    setIsBalanceHidden(hidden);
    try {
      localStorage.setItem('rupia_privacy_mode', String(hidden));
    } catch {}
  };

  return (
    <PrivacyContext.Provider
      value={{
        isBalanceHidden,
        toggleBalanceHidden,
        setBalanceHidden,
      }}
    >
      {children}
    </PrivacyContext.Provider>
  );
}

export function useBalancePrivacy() {
  return useContext(PrivacyContext);
}

