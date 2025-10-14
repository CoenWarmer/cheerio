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
import { supabase } from '@/lib/supabase';

export default function SignInPage() {
  const router = useRouter();
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
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred');
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
              Sign In
            </Title>
            <Text c="gray.6" ta="center" size="sm">
              Welcome back! Please sign in to your account.
            </Text>

            <form onSubmit={handleSignIn}>
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

                {error && (
                  <Alert color="red" variant="light">
                    {error}
                  </Alert>
                )}

                <Button type="submit" loading={loading} fullWidth>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </Stack>
            </form>

            <Text ta="center" size="sm" c="gray.6">
              Don&apos;t have an account?{' '}
              <Anchor component={Link} href="/register" fw={500}>
                Sign up
              </Anchor>
            </Text>
          </Stack>
        </Paper>
      </Container>
    </Center>
  );
}
