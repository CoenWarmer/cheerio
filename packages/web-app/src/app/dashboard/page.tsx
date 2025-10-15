'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Anchor,
  Box,
  Center,
  Container,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { AppHeader } from '@/components/AppHeader';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current user
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/sign-in');
      } else {
        setUser(user);
      }
      setLoading(false);
    };

    checkUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/sign-in');
      } else if (session?.user) {
        setUser(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <Center mih="100vh">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="gray.6">Loading...</Text>
        </Stack>
      </Center>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Box mih="100vh" bg="gray.0">
      <AppHeader pageTitle="Dashboard" />

      <Container size="xl" py="xl">
        <Stack gap="xl">
          <Paper shadow="sm" p="xl" radius="md" withBorder>
            <Title order={2} mb="md">
              Welcome! 👋
            </Title>
            <Text c="gray.6" mb="xl">
              You&apos;re successfully authenticated with Supabase.
            </Text>

            <Paper p="md" withBorder bg="gray.0">
              <Stack gap="xs">
                <Text size="sm">
                  <strong>Email:</strong> {user.email}
                </Text>
                <Text size="sm">
                  <strong>User ID:</strong> {user.id}
                </Text>
                <Text size="sm">
                  <strong>Created:</strong>{' '}
                  {new Date(user.created_at).toLocaleDateString()}
                </Text>
              </Stack>
            </Paper>
          </Paper>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
            <Paper shadow="sm" p="xl" radius="md" withBorder>
              <Title order={3} mb="lg">
                Quick Links
              </Title>
              <Stack gap="sm">
                <Anchor
                  component={Link}
                  href="/profile"
                  style={{
                    display: 'block',
                    padding: '1rem',
                    background: '#fef3c7',
                    color: '#92400e',
                    borderRadius: '0.375rem',
                    textDecoration: 'none',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#fde68a';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#fef3c7';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  👤 Edit Profile →
                </Anchor>
                <Anchor
                  component={Link}
                  href="/new"
                  style={{
                    display: 'block',
                    padding: '1rem',
                    background: '#dcfce7',
                    color: '#166534',
                    borderRadius: '0.375rem',
                    textDecoration: 'none',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#bbf7d0';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#dcfce7';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  ➕ Create New Room →
                </Anchor>
                <Anchor
                  component={Link}
                  href="/rooms"
                  style={{
                    display: 'block',
                    padding: '1rem',
                    background: '#eff6ff',
                    color: '#1e40af',
                    borderRadius: '0.375rem',
                    textDecoration: 'none',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#dbeafe';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#eff6ff';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  🏠 View All Rooms →
                </Anchor>
              </Stack>
            </Paper>

            <Paper shadow="sm" p="xl" radius="md" withBorder>
              <Title order={3} mb="lg">
                Getting Started
              </Title>
              <Text
                component="ul"
                c="gray.6"
                style={{ lineHeight: 1.75, paddingLeft: '1.5rem' }}
                size="sm"
              >
                <li>This is your protected dashboard page</li>
                <li>Only authenticated users can access this page</li>
                <li>You can now build features that require authentication</li>
                <li>
                  Check out the Supabase docs for database queries, storage, and
                  more
                </li>
              </Text>
            </Paper>
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}
