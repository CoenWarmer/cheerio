'use client';

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from 'react';

interface HeaderConfig {
  pageTitle?: string;
  showCheerButton?: boolean;
  showChatButton?: boolean;
  showNavigationLinks?: boolean;
  eventSlug?: string;
  eventId?: string;
  isChatCollapsed?: boolean;
  selectedUserId?: string | null;
  onChatToggle?: () => void;
  onUserSelect?: (userId: string | null) => void;
}

interface HeaderContextType {
  config: HeaderConfig;
  setConfig: (config: HeaderConfig) => void;
  updateConfig: (updates: Partial<HeaderConfig>) => void;
  headerHeight: number;
  setHeaderHeight: (height: number) => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<HeaderConfig>({});
  const [headerHeight, setHeaderHeight] = useState(0);

  const updateConfig = useCallback((updates: Partial<HeaderConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <HeaderContext.Provider
      value={{ config, setConfig, updateConfig, headerHeight, setHeaderHeight }}
    >
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeader() {
  const context = useContext(HeaderContext);
  if (context === undefined) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
}
