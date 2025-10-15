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
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const router = useRouter();
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
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
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
      setError('An unexpected error occurred');
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
                Registration Successful!
              </Title>
              <Text c="gray.6" ta="center">
                Check your email for a confirmation link, or if email
                confirmation is disabled, you&apos;ll be redirected to events
                shortly.
              </Text>
              <Button component={Link} href="/sign-in" fullWidth>
                Go to Sign In
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
              Create Account
            </Title>
            <Text c="gray.6" ta="center" size="sm">
              Sign up to get started with Cheerioo.
            </Text>

            <form onSubmit={handleRegister}>
              <Stack gap="md">
                <TextInput
                  label="Email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />

                <PasswordInput
                  label="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />

                <PasswordInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />

                {error && (
                  <Alert color="red" variant="light">
                    {error}
                  </Alert>
                )}

                <Button type="submit" loading={loading} fullWidth>
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </Stack>
            </form>

            <Text ta="center" size="sm" c="gray.6">
              Already have an account?{' '}
              <Anchor component={Link} href="/sign-in" fw={500}>
                Sign in
              </Anchor>
            </Text>
          </Stack>
        </Paper>
      </Container>
    </Center>
  );
}
