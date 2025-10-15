'use client';

import { useRef } from 'react';
import Link from 'next/link';
import {
  Box,
  Container,
  Title,
  Text,
  TextInput,
  Button,
  Group,
  Stack,
  Alert,
  Paper,
  Avatar,
  Badge,
  Loader,
  Center,
} from '@mantine/core';
import { AppHeader } from '@/components/AppHeader';
import { useProfileForm } from '@/hooks/useProfileForm';
import { getPermissionLabel } from '@/types/permissions';

export default function ProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          <Text c="gray.6">Loading profile...</Text>
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
      <AppHeader pageTitle="Edit Profile" />
      <Container size="sm" py="xl">
        <Stack gap="xl">
          {/* Success Message */}
          {success && (
            <Alert color="green" variant="light">
              ✓ Profile updated successfully!
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
                    Avatar
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
                          {uploading ? 'Uploading...' : 'Upload'}
                        </Button>
                        {avatarUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            color="red"
                            onClick={handleRemoveAvatar}
                          >
                            Remove
                          </Button>
                        )}
                      </Group>
                      <Text size="xs" c="gray.6">
                        JPEG, PNG or WebP. Max 5MB.
                      </Text>
                    </Stack>
                  </Group>
                </Box>

                {/* Display Name */}
                <TextInput
                  label="Display Name"
                  placeholder="Enter your display name"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  description="This is how other users will see you in rooms and chats."
                />

                {/* Email (read-only) */}
                <TextInput
                  label="Email"
                  value={user?.email || ''}
                  disabled
                  styles={{
                    input: { backgroundColor: '#f9fafb', color: '#6b7280' },
                  }}
                />

                {/* Permission (read-only) */}
                <Box>
                  <Text size="sm" fw={500} mb="xs">
                    Permission Level
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
                  <Text size="xs" c="gray.6" mt="xs">
                    Contact an administrator to change your permission level.
                  </Text>
                </Box>

                {/* Submit Button */}
                <Button type="submit" loading={saving} fullWidth>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Stack>
            </form>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
