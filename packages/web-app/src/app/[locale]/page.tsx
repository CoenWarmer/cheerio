import Link from 'next/link';
import { Box, Button, Text } from '@mantine/core';
import styles from './page.module.css';
import { setRequestLocale, getTranslations } from 'next-intl/server';

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
          {t('description')}
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
          {t('getStartedButton')}
        </Button>
      </Box>
      <Box component="footer" className={styles.footer}></Box>
    </Box>
  );
}
