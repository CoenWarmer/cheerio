'use client';

import { Container, Stack } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import HomeClient from '@/components/HomeClient';
import { useMediaQuery } from '@mantine/hooks';

export default function OnYourMarksPage() {
  const t = useTranslations('onYourMarks');
  const isMobile = useMediaQuery('(max-width: 48em)');

  useHeaderConfig({
    pageTitle: t('title'),
    showNavigationLinks: true,
    showLogoText: !isMobile,
  });

  return (
    <Container size="md">
      <Stack gap="lg">
        <HomeClient />
      </Stack>
    </Container>
  );
}
