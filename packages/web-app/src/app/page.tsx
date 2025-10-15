import Link from 'next/link';
import { Box, Text, Button, Group, Stack, Anchor } from '@mantine/core';
import styles from './page.module.css';
import { Logo } from '@/components/Logo';

export default function Home() {
  return (
    <Box className={styles.page}>
      <Box component="main" className={styles.main}>
        <Logo size="xl" />
        <h1 className={styles.title}>Welcome to Cheerioo</h1>

        <Group className={styles.ctas} gap="md" justify="center">
          <Button
            component={Link}
            href="/register"
            size="lg"
            className={styles.primary}
          >
            Get Started
          </Button>
          <Button component={Link} href="/sign-in" size="lg" variant="light">
            Sign In
          </Button>
        </Group>

        <Stack mt="xl" align="center" gap="xs">
          <Text size="sm" c="gray.5">
            Already set up?
          </Text>
          <Anchor component={Link} href="/events" size="sm">
            Go to Events →
          </Anchor>
        </Stack>
      </Box>
      <Box component="footer" className={styles.footer}></Box>
    </Box>
  );
}
