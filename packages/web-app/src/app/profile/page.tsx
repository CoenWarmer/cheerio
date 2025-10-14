'use client';

import { useRef } from 'react';
import Link from 'next/link';
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
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f9fafb',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e5e7eb',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: '#6b7280' }}>Loading profile...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f9fafb',
        padding: '2rem 1rem',
      }}
    >
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <Link
            href="/dashboard"
            style={{
              color: '#6b7280',
              textDecoration: 'none',
              fontSize: '0.875rem',
              display: 'inline-block',
              marginBottom: '1rem',
            }}
          >
            ← Back to Dashboard
          </Link>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
            }}
          >
            Edit Profile
          </h1>
          <p style={{ color: '#6b7280' }}>
            Manage your display name and avatar
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div
            style={{
              padding: '1rem',
              background: '#d1fae5',
              border: '1px solid #10b981',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              color: '#065f46',
            }}
          >
            ✓ Profile updated successfully!
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: '1rem',
              background: '#fee2e2',
              border: '1px solid #ef4444',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              color: '#991b1b',
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={onSubmit}
          style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          {/* Avatar Section */}
          <div style={{ marginBottom: '2rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.5rem',
              }}
            >
              Avatar
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Avatar Preview */}
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {previewUrl || avatarUrl ? (
                  <img
                    src={previewUrl || avatarUrl || ''}
                    alt="Avatar"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <span style={{ fontSize: '2rem', color: '#9ca3af' }}>
                    {displayName?.[0]?.toUpperCase() ||
                      user?.email?.[0]?.toUpperCase() ||
                      '?'}
                  </span>
                )}
              </div>

              {/* Upload Buttons */}
              <div style={{ flex: 1 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={onFileSelect}
                  style={{ display: 'none' }}
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                      padding: '0.5rem 1rem',
                      background: uploading ? '#d1d5db' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontWeight: '500',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                    }}
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'white',
                        color: '#ef4444',
                        border: '1px solid #ef4444',
                        borderRadius: '0.375rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    marginTop: '0.5rem',
                  }}
                >
                  JPEG, PNG or WebP. Max 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div style={{ marginBottom: '2rem' }}>
            <label
              htmlFor="displayName"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.5rem',
              }}
            >
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              style={{
                width: '100%',
                padding: '0.625rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem',
              }}
            />
            <p
              style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                marginTop: '0.5rem',
              }}
            >
              This is how other users will see you in rooms and chats.
            </p>
          </div>

          {/* Email (read-only) */}
          <div style={{ marginBottom: '2rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.5rem',
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              style={{
                width: '100%',
                padding: '0.625rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                background: '#f9fafb',
                color: '#6b7280',
              }}
            />
          </div>

          {/* Permission (read-only) */}
          <div style={{ marginBottom: '2rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.5rem',
              }}
            >
              Permission Level
            </label>
            <div
              style={{
                width: '100%',
                padding: '0.625rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                background: '#f9fafb',
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  background:
                    permissions === 'admin'
                      ? '#fef3c7'
                      : permissions === 'tracker'
                        ? '#dbeafe'
                        : '#f3f4f6',
                  color:
                    permissions === 'admin'
                      ? '#92400e'
                      : permissions === 'tracker'
                        ? '#1e40af'
                        : '#374151',
                }}
              >
                {permissions}
              </span>
              <span>{getPermissionLabel(permissions)}</span>
            </div>
            <p
              style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                marginTop: '0.5rem',
              }}
            >
              Contact an administrator to change your permission level.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: saving ? '#d1d5db' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
