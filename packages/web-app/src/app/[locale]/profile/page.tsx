'use client';

import { useRef } from 'react';
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Center,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useTranslations } from 'next-intl';
import { useProfileForm } from '@/hooks/useProfileForm';
import { getPermissionLabel } from '@/types/permissions';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useMediaQuery } from '@mantine/hooks';

export default function ProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations('profile');
  const tNav = useTranslations('navigation');
  const isMobile = useMediaQuery('(max-width: 48em)');

  useHeaderConfig({
    pageTitle: tNav('profile'),
    showNavigationLinks: true,
    showLogoText: !isMobile,
  });

  const {
    user,
    displayName,
    setDisplayName,
    avatarUrl,
    permissions,
    loading,
    saving,
    uploading,
    error,
    success,
    previewUrl,
    handleFileSelect,
    handleRemoveAvatar,
    handleSubmit,
  } = useProfileForm();

  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileSelect(file);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmit();
  };

  if (loading) {
    return (
      <Center mih="100vh" bg="gray.0">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="gray.6">{t('loadingProfile')}</Text>
        </Stack>
      </Center>
    );
  }

  const getPermissionBadgeColor = (perm: string) => {
    if (perm === 'admin') return 'yellow';
    if (perm === 'tracker') return 'blue';
    return 'gray';
  };

  return (
    <Box mih="100vh" bg="gray.0">
      <Container size="sm" py="xl">
        <Stack gap="xl">
          {/* Success Message */}
          {success && (
            <Alert color="green" variant="light">
              ✓ {t('success')}
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert color="red" variant="light">
              {error}
            </Alert>
          )}

          {/* Form */}
          <Paper shadow="sm" p="xl" radius="md" withBorder>
            <form onSubmit={onSubmit}>
              <Stack gap="lg">
                {/* Avatar Section */}
                <Box>
                  <Text size="sm" fw={500} mb="sm">
                    {t('avatar')}
                  </Text>
                  <Group align="center">
                    <Avatar
                      src={previewUrl || avatarUrl || undefined}
                      size={80}
                      radius="xl"
                      color="gray"
                    >
                      {!previewUrl &&
                        !avatarUrl &&
                        (displayName?.[0]?.toUpperCase() ||
                          user?.email?.[0]?.toUpperCase() ||
                          '?')}
                    </Avatar>

                    <Stack gap="xs" style={{ flex: 1 }}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={onFileSelect}
                        style={{ display: 'none' }}
                      />
                      <Group gap="xs">
                        <Button
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          loading={uploading}
                        >
                          {uploading ? t('uploading') : t('upload')}
                        </Button>
                        {avatarUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            color="red"
                            onClick={handleRemoveAvatar}
                          >
                            {t('remove')}
                          </Button>
                        )}
                      </Group>
                      <Text size="xs" c="gray.6">
                        {t('avatarDescription')}
                      </Text>
                    </Stack>
                  </Group>
                </Box>

                {/* Display Name */}
                <TextInput
                  label={t('displayName')}
                  placeholder={t('displayNamePlaceholder')}
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  description={t('displayNameDescription')}
                />

                {/* Email (read-only) */}
                <TextInput
                  label={t('email')}
                  value={user?.email || ''}
                  disabled
                  styles={{
                    input: { backgroundColor: '#f9fafb', color: '#6b7280' },
                  }}
                />

                {/* Permission (read-only) */}
                <Box>
                  <Text size="sm" fw={500} mb="xs">
                    {t('permissionLevel')}
                  </Text>
                  <Paper p="xs" withBorder bg="gray.0">
                    <Group gap="sm">
                      <Badge
                        color={getPermissionBadgeColor(permissions)}
                        variant="light"
                        tt="uppercase"
                        size="sm"
                      >
                        {permissions}
                      </Badge>
                      <Text size="sm" c="gray.6">
                        {getPermissionLabel(permissions)}
                      </Text>
                    </Group>
                  </Paper>
                </Box>

                {/* Submit Button */}
                <Button type="submit" loading={saving} fullWidth>
                  {saving ? t('saving') : t('saveChanges')}
                </Button>
              </Stack>
            </form>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
