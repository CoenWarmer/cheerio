'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { Select } from '@mantine/core';
import { useParams } from 'next/navigation';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const handleChange = (value: string | null) => {
    if (!value) return;

    // Use the localized router which handles locale switching automatically
    router.replace(
      // @ts-expect-error -- TypeScript will complain about the params type
      { pathname, params },
      { locale: value }
    );
  };

  return (
    <Select
      value={locale}
      onChange={handleChange}
      checked={false}
      data={[
        { value: 'nl', label: '🇳🇱' },
        { value: 'en', label: '🇬🇧' },
        { value: 'es', label: '🇪🇸' },
        { value: 'fr', label: '🇫🇷' },
        { value: 'ru', label: '🇷🇺' },
      ]}
      w={70}
      px={4}
      size="sm"
    />
  );
}
