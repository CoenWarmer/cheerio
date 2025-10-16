import Link from 'next/link';
import { Box, Button, Group, Text } from '@mantine/core';
import styles from './page.module.css';
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
        {/* <Logo size="xl" mode="big" /> */}
        <h1 className={styles.title}>{t('title')}</h1>
        <Text size="20px" c="grey" mb={28}>
          Track en moedig jouw mensen aan.
        </Text>
        <Button
          component={Link}
          href={`/${locale}/on-your-marks`}
          variant="filled"
          radius={30}
          py={15}
          h={50}
          style={{
            display: 'flex',
            maxWidth: 'min-content',
          }}
        >
          Klik hier om te beginnen
        </Button>

        <Group className={styles.ctas} gap="md" justify="center">
          <Image
            alt="cheerioo landing"
            src="/hero.png"
            width={512}
            height={512}
          />
        </Group>
      </Box>
      <Box component="footer" className={styles.footer}></Box>
    </Box>
  );
}
