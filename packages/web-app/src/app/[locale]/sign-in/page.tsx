'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Alert,
  Anchor,
  Button,
  Center,
  Container,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';

export default function SignInPage() {
  const router = useRouter();
  const t = useTranslations('auth.signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        router.push('/events');
        router.refresh();
      }
    } catch {
      setError(t('unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center mih="100vh" bg="gray.0" p="md">
      <Container size="xs" w="100%">
        <Paper shadow="sm" p="xl" radius="md" withBorder>
          <Stack gap="md">
            <Title order={1} ta="center">
              {t('title')}
            </Title>
            <Text c="gray.6" ta="center" size="sm">
              {t('welcome')}
            </Text>

            <form onSubmit={handleSignIn}>
              <Stack gap="md">
                <TextInput
                  label={t('email')}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder={t('emailPlaceholder')}
                />

                <PasswordInput
                  label={t('password')}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder={t('passwordPlaceholder')}
                />

                {error && (
                  <Alert color="red" variant="light">
                    {error}
                  </Alert>
                )}

                <Button type="submit" loading={loading} fullWidth>
                  {loading ? t('signingIn') : t('button')}
                </Button>
              </Stack>
            </form>

            <Text ta="center" size="sm" c="gray.6">
              {t('noAccount')}{' '}
              <Anchor component={Link} href="/register" fw={500}>
                {t('signUp')}
              </Anchor>
            </Text>
          </Stack>
        </Paper>
      </Container>
    </Center>
  );
}
