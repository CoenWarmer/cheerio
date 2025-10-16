'use client';

import { useEffect, useRef } from 'react';
import { useHeader } from '@/providers/HeaderProvider';

interface UseHeaderConfigOptions {
  pageTitle?: string;
  showCheerButton?: boolean;
  showChatButton?: boolean;
  eventSlug?: string;
  eventId?: string;
  isChatCollapsed?: boolean;
  selectedUserId?: string | null;
  showNavigationLinks?: boolean;
  onChatToggle?: () => void;
  onUserSelect?: (userId: string | null) => void;
}

/**
 * Hook to configure the AppHeader from within a page component.
 * Updates the header configuration when the component mounts or when dependencies change.
 */
export function useHeaderConfig(config: UseHeaderConfigOptions) {
  const { setConfig } = useHeader();

  // Store callbacks in refs to avoid triggering effects when they change
  const onChatToggleRef = useRef(config.onChatToggle);
  const onUserSelectRef = useRef(config.onUserSelect);

  // Update refs when callbacks change
  useEffect(() => {
    onChatToggleRef.current = config.onChatToggle;
    onUserSelectRef.current = config.onUserSelect;
  }, [config.onChatToggle, config.onUserSelect]);

  // Set config directly (replaces the entire config, not merging)
  useEffect(() => {
    setConfig({
      pageTitle: config.pageTitle,
      showCheerButton: config.showCheerButton ?? false,
      showChatButton: config.showChatButton ?? false,
      eventSlug: config.eventSlug,
      eventId: config.eventId,
      isChatCollapsed: config.isChatCollapsed,
      selectedUserId: config.selectedUserId,
      showNavigationLinks: config.showNavigationLinks,
      onChatToggle: onChatToggleRef.current,
      onUserSelect: onUserSelectRef.current,
    });

    // Cleanup: reset config when component unmounts
    return () => {
      setConfig({});
    };
  }, [
    config.pageTitle,
    config.showCheerButton,
    config.showChatButton,
    config.eventSlug,
    config.eventId,
    config.isChatCollapsed,
    config.selectedUserId,
    config.showNavigationLinks,
    setConfig,
  ]);
}
