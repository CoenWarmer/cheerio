'use client';

import { Anchor, Text } from '@mantine/core';
import { SpeakerphoneIcon } from './icons/SpeakerphoneIcon';
import Link from 'next/link';
import { useMediaQuery } from '@mantine/hooks';

export function Logo({
  mode,
  size = 'lg',
}: {
  mode: 'navbar' | 'big';
  size?: 'lg' | 'md' | 'sm' | 'xs' | 'xxs' | 'l' | 'xl' | 'xxl';
}) {
  const isMobile = useMediaQuery('(max-width: 48em)');

  return mode === 'navbar' ? (
    <Anchor
      component={Link}
      href="/events"
      c="gray.7"
      fw={700}
      size={size}
      style={{ textDecoration: 'none' }}
    >
      {!isMobile ? 'Cheerioo' : null}
      <SpeakerphoneIcon fill="#228be6" />
    </Anchor>
  ) : (
    <Text size={size} c="gray.7" fw={700}>
      Cheerioo <SpeakerphoneIcon fill="#228be6" />
    </Text>
  );
}
