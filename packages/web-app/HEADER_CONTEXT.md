# Header Context System

## Overview

The AppHeader is now persistent across all routes and managed through a context-based system. This means:

- The header stays visible when navigating between pages (no re-render)
- Pages can configure the header dynamically using the `useHeaderConfig` hook
- The header automatically resets when leaving a page

## Files Created/Modified

### New Files:

1. **`src/providers/HeaderProvider.tsx`** - Context provider for header configuration
2. **`src/hooks/useHeaderConfig.ts`** - Hook for pages to configure the header

### Modified Files:

1. **`src/app/[locale]/layout.tsx`** - Added `<HeaderProvider>` and `<AppHeader />`
2. **`src/components/AppHeader.tsx`** - Now reads from context instead of only props
3. **`src/components/EventPageClient.tsx`** - Uses `useHeaderConfig` instead of rendering AppHeader
4. **`src/app/[locale]/events/page.tsx`** - Uses `useHeaderConfig` instead of rendering AppHeader
5. **`src/app/[locale]/profile/page.tsx`** - Uses `useHeaderConfig` instead of rendering AppHeader

## How to Use

### Basic Page (with just a title)

```tsx
'use client';

import { useHeaderConfig } from '@/hooks/useHeaderConfig';

export default function MyPage() {
  useHeaderConfig({
    pageTitle: 'My Page Title',
  });

  return <div>{/* Your page content */}</div>;
}
```

### Event Page (with dynamic features)

```tsx
'use client';

import { useState } from 'react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';

export default function EventPage({ eventSlug }: { eventSlug: string }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useHeaderConfig({
    pageTitle: 'Event Name',
    showCheerButton: true,
    showChatButton: true,
    eventSlug: eventSlug,
    eventId: 'event-id',
    isChatCollapsed: isSidebarCollapsed,
    onChatToggle: () => setIsSidebarCollapsed(!isSidebarCollapsed),
    selectedUserId,
    onUserSelect: setSelectedUserId,
  });

  return <div>{/* Your page content */}</div>;
}
```

## Benefits

1. **Better Performance** - Header doesn't re-render when navigating between pages
2. **Cleaner Code** - No need to pass header around or render it in every page
3. **Flexible** - Pages can configure the header with any options they need
4. **Automatic Cleanup** - Header resets when leaving a page (unmount)

## Available Header Options

```typescript
interface HeaderConfig {
  pageTitle?: string; // Page title shown in header
  showCheerButton?: boolean; // Show cheer button (event pages)
  showChatButton?: boolean; // Show chat toggle button
  eventSlug?: string; // Event slug for audio recording
  eventId?: string; // Event ID for active users
  isChatCollapsed?: boolean; // Chat sidebar state
  onChatToggle?: () => void; // Chat toggle callback
  selectedUserId?: string | null; // Selected user for tracking
  onUserSelect?: (userId: string | null) => void; // User selection callback
}
```
