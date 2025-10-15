import { Anchor } from '@mantine/core';
import { SpeakerphoneIcon } from './icons/SpeakerphoneIcon';
import Link from 'next/link';

export function Logo({
  size = 'lg',
}: {
  size?: 'lg' | 'md' | 'sm' | 'xs' | 'xxs' | 'l' | 'xl' | 'xxl';
}) {
  return (
    <Anchor
      component={Link}
      href="/rooms"
      c="gray.7"
      fw={700}
      size={size}
      style={{ textDecoration: 'none' }}
    >
      Cheerioo <SpeakerphoneIcon fill="#228be6" />
    </Anchor>
  );
}
