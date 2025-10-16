'use client';

import { useState, useEffect } from 'react';
import { Text, Group, Stack } from '@mantine/core';
import { useTranslations, useLocale } from 'next-intl';

interface CountdownProps {
  targetDate: Date;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function Countdown({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const t = useTranslations('countdown');
  const locale = useLocale();

  useEffect(() => {
    const calculateTimeLeft = (): TimeLeft | null => {
      const difference = targetDate.getTime() - new Date().getTime();

      if (difference <= 0) {
        return null;
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) {
    return null;
  }

  return (
    <Stack gap="xs" align="center">
      {/* Show the target date/time for verification */}
      <Text size="sm" c="dimmed" ta="center">
        {t('startTime')}{' '}
        {targetDate.toLocaleString(locale, {
          dateStyle: 'full',
          timeStyle: 'short',
        })}
        .
      </Text>

      <Group gap="xs" align="center">
        {timeLeft.days > 0 && (
          <Stack gap={0} align="center">
            <Text size="xl" fw={700} c="blue.6">
              {timeLeft.days}
            </Text>
            <Text size="xs" c="dimmed">
              {timeLeft.days === 1 ? t('day') : t('days')}
            </Text>
          </Stack>
        )}

        <Stack gap={0} align="center">
          <Text size="xl" fw={700} c="blue.6">
            {String(timeLeft.hours).padStart(2, '0')}
          </Text>
          <Text size="xs" c="dimmed">
            {t('hours')}
          </Text>
        </Stack>

        <Text size="xl" fw={700} c="gray.4">
          :
        </Text>

        <Stack gap={0} align="center">
          <Text size="xl" fw={700} c="blue.6">
            {String(timeLeft.minutes).padStart(2, '0')}
          </Text>
          <Text size="xs" c="dimmed">
            {t('minutes')}
          </Text>
        </Stack>

        <Text size="xl" fw={700} c="gray.4">
          :
        </Text>

        <Stack gap={0} align="center">
          <Text size="xl" fw={700} c="blue.6">
            {String(timeLeft.seconds).padStart(2, '0')}
          </Text>
          <Text size="xs" c="dimmed">
            {t('seconds')}
          </Text>
        </Stack>
      </Group>
    </Stack>
  );
}
