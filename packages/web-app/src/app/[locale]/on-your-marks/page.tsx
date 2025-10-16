'use client';

import { Container, Stack } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import HomeClient from '@/components/HomeClient';

export default function OnYourMarksPage() {
  const t = useTranslations('onYourMarks');

  // Configure the header for this page
  useHeaderConfig({
    pageTitle: t('title'),
    showNavigationLinks: true,
  });

  return (
    <Container size="md">
      <Stack gap="lg">
        <HomeClient />
      </Stack>
    </Container>
  );
}
