import Image from 'next/image';
import Link from 'next/link';
import { Box, Title, Text, Button, Group, Stack, Anchor } from '@mantine/core';
import styles from './page.module.css';

export default function Home() {
  return (
    <Box className={styles.page}>
      <Box component="main" className={styles.main}>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <Title order={1} ta="center" mb="md">
          Welcome to Cheerio
        </Title>
        <Text c="gray.6" ta="center" mb="xl">
          A modern web app with authentication powered by Supabase
        </Text>

        <Group className={styles.ctas} gap="md" justify="center">
          <Button
            component={Link}
            href="/register"
            size="lg"
            className={styles.primary}
          >
            Get Started
          </Button>
          <Button
            component={Link}
            href="/sign-in"
            size="lg"
            variant="default"
            className={styles.secondary}
          >
            Sign In
          </Button>
        </Group>

        <Stack mt="xl" align="center" gap="xs">
          <Text size="sm" c="gray.5">
            Already set up?
          </Text>
          <Anchor component={Link} href="/dashboard" size="sm">
            Go to Dashboard →
          </Anchor>
        </Stack>
      </Box>
      <Box component="footer" className={styles.footer}>
        <a
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </Box>
    </Box>
  );
}
