'use client';

import { Anchor, Text } from '@mantine/core';
import { SpeakerphoneIcon } from './icons/SpeakerphoneIcon';
import Link from 'next/link';
import { useMediaQuery } from '@mantine/hooks';

export function Logo({
  mode,
  size = 'lg',
  showText = true,
}: {
  mode: 'navbar' | 'big';
  size?: 'lg' | 'md' | 'sm' | 'xs' | 'xxs' | 'l' | 'xl' | 'xxl';
  showText?: boolean;
}) {
  const isMobile = useMediaQuery('(max-width: 48em)');
  console.log(showText);
  let sizeNumber = 28;
  switch (size) {
    case 'xxs':
      sizeNumber = 16;
      break;
    case 'xs':
      sizeNumber = 18;
      break;
    case 'sm':
      sizeNumber = 20;
      break;
    case 'md':
      sizeNumber = 24;
      break;
    case 'lg':
      sizeNumber = 28;
      break;
    case 'xl':
      sizeNumber = 32;
      break;
    case 'xxl':
      sizeNumber = 36;
      break;
  }

  return mode === 'navbar' ? (
    <Anchor
      component={Link}
      href="/events"
      c="gray.7"
      fw={700}
      size={size}
      style={{ textDecoration: 'none' }}
    >
      {showText ? 'Cheerioo' : null}
      <SpeakerphoneIcon fill="#228be6" size={sizeNumber} />
    </Anchor>
  ) : (
    <Text size={size} c="gray.7" fw={700}>
      Cheerioo <SpeakerphoneIcon fill="#228be6" />
    </Text>
  );
}
