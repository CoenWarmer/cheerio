'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  Button,
  Stack,
  Alert,
  Center,
  Card,
  Group,
} from '@mantine/core';
import { useTranslations } from 'next-intl';
import { useAnonymousUser } from '@/hooks/useAnonymousUser';

type Step = 'choose' | 'setup';

export default function AnonymousSetup() {
  const router = useRouter();
  const t = useTranslations('auth.anonymous');
  const { createAnonymousProfile } = useAnonymousUser();

  const [step, setStep] = useState<Step>('choose');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnonymousSetup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      setError(t('displayNameRequired'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createAnonymousProfile(displayName.trim());
      // Redirect to events after successful setup
      router.push('/events');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'setup') {
    return (
      <Center p="md">
        <Container size="xs" w="100%">
          <Paper shadow="sm" p="xl" radius="md" withBorder>
            <Stack gap="md">
              <Title order={1} ta="center">
                {t('setupTitle')}
              </Title>
              <Text c="gray.6" ta="center" size="sm">
                {t('setupSubtitle')}
              </Text>

              <form onSubmit={handleAnonymousSetup}>
                <Stack gap="md">
                  <TextInput
                    label={t('displayName')}
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    required
                    placeholder={t('displayNamePlaceholder')}
                    size="md"
                    autoFocus
                  />

                  {error && (
                    <Alert color="red" variant="light">
                      {error}
                    </Alert>
                  )}

                  <Button type="submit" loading={loading} fullWidth size="md">
                    {loading ? t('creating') : t('getStarted')}
                  </Button>
                </Stack>
              </form>
            </Stack>
          </Paper>
        </Container>
      </Center>
    );
  }

  return (
    <Center p="md">
      <Container size="md" w="100%">
        <Stack gap="xl">
          <Stack gap="sm" align="center">
            <Title order={1} ta="center">
              {t('title')}
            </Title>
            <Text c="gray.6" ta="center" size="lg">
              {t('subtitle')}
            </Text>
          </Stack>

          <Group gap="md" align="stretch" grow>
            {/* Anonymous Option */}
            <Card
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              style={{ cursor: 'pointer', flex: 1 }}
              onClick={() => setStep('setup')}
            >
              <Stack gap="sm">
                <Group justify="space-between" align="flex-start">
                  <Stack gap={4} style={{ flex: 1 }}>
                    <Text size="xl" fw={600}>
                      {t('continueAnonymously')}
                    </Text>
                    <Text size="sm" c="gray.6">
                      {t('anonymousDescription')}
                    </Text>
                  </Stack>
                </Group>
                <Button variant="filled" size="md">
                  {t('continueAnonymously')}
                </Button>
              </Stack>
            </Card>

            {/* Create Account Option */}
            <Card
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              component={Link}
              href="/register"
              style={{ textDecoration: 'none', cursor: 'pointer', flex: 1 }}
            >
              <Stack gap="sm">
                <Group justify="space-between" align="flex-start">
                  <Stack gap={4} style={{ flex: 1 }}>
                    <Text size="xl" fw={600} c="dark">
                      {t('createAccount')}
                    </Text>
                    <Text size="sm" c="gray.6">
                      {t('accountDescription')}
                    </Text>
                  </Stack>
                </Group>
                <Button variant="light" size="md">
                  {t('createAccount')}
                </Button>
              </Stack>
            </Card>
          </Group>

          {/* Sign In Link */}
          <Text ta="center" size="sm" c="gray.6">
            {t('alreadyHaveAccount')}{' '}
            <Text
              component={Link}
              href="/sign-in"
              fw={500}
              c="blue.6"
              style={{ textDecoration: 'none' }}
            >
              {t('signIn')}
            </Text>
          </Text>
        </Stack>
      </Container>
    </Center>
  );
}
