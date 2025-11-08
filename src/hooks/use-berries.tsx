'use client';

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

type BerriesContextType = {
  berries: number;
  setBerries: Dispatch<SetStateAction<number>>;
};

const BerriesContext = createContext<BerriesContextType | undefined>(undefined);

export function BerriesProvider({ children }: { children: ReactNode }) {
  const [berries, setBerries] = useState(1250);

  return (
    <BerriesContext.Provider value={{ berries, setBerries }}>
      {children}
    </BerriesContext.Provider>
  );
}

export function useBerries() {
  const context = useContext(BerriesContext);
  if (context === undefined) {
    throw new Error('useBerries must be used within a BerriesProvider');
  }
  return context;
}
