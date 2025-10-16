'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import AnonymousSetup from '@/components/AnonymousSetup';
import { Center, Loader } from '@mantine/core';

/**
 * Client component that handles routing logic for home page
 * - If user is authenticated → redirect to events
 * - If user is anonymous (has profile) → redirect to events
 * - Otherwise → show anonymous setup (choose anonymous or register)
 */
export default function HomeClient() {
  const router = useRouter();
  const { currentUser, isLoading } = useCurrentUser();

  useEffect(() => {
    // If any user (authenticated or anonymous), redirect to events
    if (currentUser) {
      router.push('/events');
      return;
    }
  }, [currentUser, router]);

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  // If user exists (authenticated or anonymous), they'll be redirected
  // Show setup for new visitors
  if (!currentUser) {
    return <AnonymousSetup />;
  }

  // Show loading while redirecting
  return (
    <Center h="100vh">
      <Loader size="lg" />
    </Center>
  );
}
