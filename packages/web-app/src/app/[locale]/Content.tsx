'use client';

import { useHeader } from '@/providers/HeaderProvider';

export function Content({ children }: { children: React.ReactNode }) {
  const { headerHeight } = useHeader();
  return <div style={{ paddingTop: headerHeight }}>{children}</div>;
}
