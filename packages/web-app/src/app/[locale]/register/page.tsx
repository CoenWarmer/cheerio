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
  PasswordInput,
  Button,
  Stack,
  Alert,
  Anchor,
  Center,
} from '@mantine/core';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations('auth.register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      setLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError(t('passwordTooShort'));
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        setSuccess(true);
        // If email confirmation is disabled, redirect to events
        // If email confirmation is enabled, show success message
        if (data.session) {
          setTimeout(() => {
            router.push('/events');
            router.refresh();
          }, 2000);
        }
      }
    } catch {
      setError(t('unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Center mih="100vh" bg="gray.0" p="md">
        <Container size="xs" w="100%">
          <Paper shadow="sm" p="xl" radius="md" withBorder>
            <Stack align="center" gap="md">
              <Text fz={48}>✅</Text>
              <Title order={2} ta="center">
                {t('success')}
              </Title>
              <Text c="gray.6" ta="center">
                {t('successMessage')}
              </Text>
              <Button component={Link} href="/sign-in" fullWidth>
                {t('goToSignIn')}
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Center>
    );
  }

  return (
    <Center mih="100vh" bg="gray.0" p="md">
      <Container size="xs" w="100%">
        <Paper shadow="sm" p="xl" radius="md" withBorder>
          <Stack gap="md">
            <Title order={1} ta="center">
              {t('title')}
            </Title>
            <Text c="gray.6" ta="center" size="sm">
              {t('subtitle')}
            </Text>

            <form onSubmit={handleRegister}>
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

                <PasswordInput
                  label={t('confirmPassword')}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  placeholder={t('confirmPasswordPlaceholder')}
                />

                {error && (
                  <Alert color="red" variant="light">
                    {error}
                  </Alert>
                )}

                <Button type="submit" loading={loading} fullWidth>
                  {loading ? t('creating') : t('button')}
                </Button>
              </Stack>
            </form>

            <Text ta="center" size="sm" c="gray.6">
              {t('hasAccount')}{' '}
              <Anchor component={Link} href="/sign-in" fw={500}>
                {t('signIn')}
              </Anchor>
            </Text>
          </Stack>
        </Paper>
      </Container>
    </Center>
  );
}
