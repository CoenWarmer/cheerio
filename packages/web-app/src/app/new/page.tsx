'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { roomsApi, ApiError } from '@/lib/api-client';
import { getCurrentLocation, isValidCoordinates } from '@/utils/location';

type RoomStatus = 'awaiting' | 'in_progress' | 'finished';

export default function NewRoomPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [donationLink, setDonationLink] = useState('');
  const [startTime, setStartTime] = useState('');
  const [status, setStatus] = useState<RoomStatus>('awaiting');
  const [isPrivate, setIsPrivate] = useState(false);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGetCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const coords = await getCurrentLocation();
      setLatitude(coords.lat.toString());
      setLongitude(coords.long.toString());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to get your location. Please check permissions.'
      );
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate required fields
    if (!title.trim()) {
      setError('Title is required');
      setLoading(false);
      return;
    }

    // Validate coordinates if provided
    let locationJson = null;
    if (latitude.trim() && longitude.trim()) {
      const lat = parseFloat(latitude);
      const long = parseFloat(longitude);

      if (isNaN(lat) || isNaN(long)) {
        setError('Invalid coordinates. Please enter valid numbers.');
        setLoading(false);
        return;
      }

      if (!isValidCoordinates({ lat, long })) {
        setError(
          'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.'
        );
        setLoading(false);
        return;
      }

      // Store as JSON object
      locationJson = { lat, long };
    }

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('You must be logged in to create a room');
        setLoading(false);
        return;
      }

      // Prepare room data
      const roomData = {
        name: title.trim(),
        description: description.trim() || null,
        donation_link: donationLink.trim() || null,
        start_time: startTime ? new Date(startTime).toISOString() : null,
        status: status,
        is_private: isPrivate,
        created_by: user.id,
        location: locationJson,
      };

      // Call API route to create room
      const result = await roomsApi.create(roomData);

      if (result.data) {
        // Redirect to the newly created room
        router.push(`/room/${result.data.slug}`);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to create room. Please try again.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <nav
        style={{
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '1rem 2rem',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            Create New Room
          </h1>
          <Link
            href="/dashboard"
            style={{
              color: '#6b7280',
              textDecoration: 'none',
              fontSize: '0.875rem',
            }}
          >
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      <main
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '2rem',
        }}
      >
        <div
          style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="title"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}
              >
                Room Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                placeholder="Enter room title"
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                }}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="description"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe your room..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Donation Link */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="donationLink"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}
              >
                Donation Link
              </label>
              <input
                id="donationLink"
                type="url"
                value={donationLink}
                onChange={e => setDonationLink(e.target.value)}
                placeholder="https://example.com/donate"
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                }}
              />
              <p
                style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  marginTop: '0.25rem',
                }}
              >
                Optional: Add a link where people can donate
              </p>
            </div>

            {/* Start Time */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="startTime"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}
              >
                Start Time
              </label>
              <input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                }}
              />
              <p
                style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  marginTop: '0.25rem',
                }}
              >
                Optional: When does this room start?
              </p>
            </div>

            {/* Status */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="status"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}
              >
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={e => setStatus(e.target.value as RoomStatus)}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                  background: 'white',
                }}
              >
                <option value="awaiting">Awaiting</option>
                <option value="in_progress">In Progress</option>
                <option value="finished">Finished</option>
              </select>
            </div>

            {/* Location Section */}
            <div
              style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                background: '#f9fafb',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <label
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  }}
                >
                  📍 Location (Optional)
                </label>
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={loadingLocation}
                  style={{
                    padding: '0.5rem 1rem',
                    background: loadingLocation ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    cursor: loadingLocation ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loadingLocation
                    ? 'Getting location...'
                    : '📍 Use My Location'}
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                }}
              >
                <div>
                  <label
                    htmlFor="latitude"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.75rem',
                      color: '#6b7280',
                    }}
                  >
                    Latitude
                  </label>
                  <input
                    id="latitude"
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={e => setLatitude(e.target.value)}
                    placeholder="37.7749"
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="longitude"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.75rem',
                      color: '#6b7280',
                    }}
                  >
                    Longitude
                  </label>
                  <input
                    id="longitude"
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={e => setLongitude(e.target.value)}
                    placeholder="-122.4194"
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
              </div>

              <p
                style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  marginTop: '0.5rem',
                }}
              >
                Set the location for your room. Click Use My Location or enter
                coordinates manually.
              </p>
            </div>

            {/* Is Private */}
            <div style={{ marginBottom: '2rem' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={e => setIsPrivate(e.target.checked)}
                  style={{
                    width: '1rem',
                    height: '1rem',
                    marginRight: '0.5rem',
                    cursor: 'pointer',
                  }}
                />
                <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                  🔒 Make this room private
                </span>
              </label>
              <p
                style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  marginTop: '0.25rem',
                  marginLeft: '1.5rem',
                }}
              >
                Private rooms are only visible to invited members
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div
                style={{
                  padding: '0.75rem',
                  background: '#fee',
                  color: '#dc2626',
                  borderRadius: '0.375rem',
                  marginBottom: '1rem',
                  fontSize: '0.875rem',
                }}
              >
                {error}
              </div>
            )}

            {/* Buttons */}
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end',
              }}
            >
              <Link
                href="/dashboard"
                style={{
                  padding: '0.625rem 1.25rem',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '0.625rem 1.25rem',
                  background: loading ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Creating...' : 'Create Room'}
              </button>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div
          style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: '#eff6ff',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            color: '#1e40af',
          }}
        >
          <strong>💡 Tip:</strong> After creating your room, you can share the
          link with others to join. Use the chat to communicate in real-time!
        </div>
      </main>
    </div>
  );
}
