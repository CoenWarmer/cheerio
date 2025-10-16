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
  FileButton,
  Avatar,
  Group,
} from '@mantine/core';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { useUpdateProfile, useUploadAvatar } from '@/hooks/useProfiles';

type Step = 'register' | 'setup' | 'success';

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations('auth.register');

  // Registration step
  const [step, setStep] = useState<Step>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Profile setup step
  const [displayName, setDisplayName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { updateProfileAsync } = useUpdateProfile();
  const { uploadAvatarAsync } = useUploadAvatar();

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
        // Move to profile setup step instead of showing success
        if (data.session) {
          setStep('setup');
        } else {
          // If email confirmation is required, skip to success
          setStep('success');
        }
      }
    } catch {
      setError(t('unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (file: File | null) => {
    setAvatarFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setAvatarPreview(null);
    }
  };

  const handleProfileSetup = async () => {
    if (!displayName.trim()) {
      setError(t('displayNameRequired'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Upload avatar if provided
      let avatarUrl = null;
      if (avatarFile) {
        const result = await uploadAvatarAsync(avatarFile);
        avatarUrl = result.avatar_url;
      }

      // Update profile with display name and avatar
      await updateProfileAsync({
        display_name: displayName.trim(),
        ...(avatarUrl && { avatar_url: avatarUrl }),
      });

      // Redirect to events
      router.push('/events');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSkipSetup = () => {
    router.push('/events');
    router.refresh();
  };

  if (step === 'success') {
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

  if (step === 'setup') {
    return (
      <Center mih="100vh" bg="gray.0" p="md">
        <Container size="xs" w="100%">
          <Paper shadow="sm" p="xl" radius="md" withBorder>
            <Stack gap="md">
              <Title order={1} ta="center">
                {t('setupProfile')}
              </Title>
              <Text c="gray.6" ta="center" size="sm">
                {t('setupSubtitle')}
              </Text>

              <Stack gap="md">
                <TextInput
                  label={t('displayName')}
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  required
                  placeholder={t('displayNamePlaceholder')}
                />

                <Stack gap="xs">
                  <Text size="sm" fw={500}>
                    {t('avatar')}
                  </Text>
                  <Text size="xs" c="gray.6">
                    {t('avatarOptional')}
                  </Text>
                  <Group gap="md">
                    <Avatar
                      src={avatarPreview}
                      size="lg"
                      radius="xl"
                      alt="Avatar preview"
                    />
                    <FileButton
                      onChange={handleAvatarChange}
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                    >
                      {props => (
                        <Button variant="light" {...props}>
                          {t('uploadAvatar')}
                        </Button>
                      )}
                    </FileButton>
                  </Group>
                </Stack>

                {error && (
                  <Alert color="red" variant="light">
                    {error}
                  </Alert>
                )}

                <Group grow>
                  <Button
                    variant="default"
                    onClick={handleSkipSetup}
                    disabled={loading}
                  >
                    {t('skip')}
                  </Button>
                  <Button onClick={handleProfileSetup} loading={loading}>
                    {t('continue')}
                  </Button>
                </Group>
              </Stack>
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
