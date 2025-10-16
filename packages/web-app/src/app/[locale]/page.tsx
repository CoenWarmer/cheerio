import Link from 'next/link';
import { Box, Button, Group } from '@mantine/core';
import styles from './page.module.css';
import { Logo } from '@/components/Logo';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import Image from 'next/image';

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  const t = await getTranslations('home');

  return (
    <Box className={styles.page}>
      <Box component="main" className={styles.main}>
        <Logo size="xl" mode="big" />
        <h1 className={styles.title}>{t('title')}</h1>

        <Group className={styles.ctas} gap="md" justify="center">
          <Image
            alt="cheerioo landing"
            src="/hero.png"
            width={512}
            height={512}
          />
          <Button component={Link} href="/sign-in" size="lg" variant="light">
            {t('signIn')}
          </Button>
        </Group>
      </Box>
      <Box component="footer" className={styles.footer}></Box>
    </Box>
  );
}
