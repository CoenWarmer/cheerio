'use client';

import { useEffect, useState, useRef } from 'react';
import { attachmentsApi, ApiError } from '@/lib/api-client';
import type { User } from '@supabase/supabase-js';
import {
  useMessages,
  useSendMessage,
  type EnrichedMessage,
} from '@/hooks/useMessages';
import {
  usePresence,
  useUpdatePresence,
  useRemovePresence,
} from '@/hooks/usePresence';

interface ChatSidebarProps {
  roomId: string; // Room UUID for realtime subscriptions
  roomSlug: string; // Room slug for API calls
  roomName: string;
  currentUser: User;
  currentUserLocation?: { lat: number; long: number } | null;
  onToggleSidebar: () => void;
}

export default function ChatSidebar({
  roomId,
  roomSlug,
  roomName,
  currentUser,
  currentUserLocation,
  onToggleSidebar,
}: ChatSidebarProps) {
  // Use hooks for data fetching
  const { messages: messagesData, isLoading: loading } = useMessages(
    roomId,
    roomSlug
  );
  const { sendMessage } = useSendMessage();
  const { count: activeUsers } = usePresence(roomId, roomSlug);
  const { updatePresence } = useUpdatePresence();
  const { removePresence } = useRemovePresence();

  const [messages, setMessages] = useState<EnrichedMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const presenceIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync messages from hook to local state (for real-time updates)
  useEffect(() => {
    setMessages(messagesData);
    scrollToBottom();
  }, [messagesData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Presence management
  useEffect(() => {
    // Initial presence update
    updatePresence({ roomId: roomSlug, status: 'online' });

    // Update presence every 20 seconds
    presenceIntervalRef.current = setInterval(() => {
      updatePresence({ roomId: roomSlug, status: 'online' });
    }, 20000);

    // Cleanup on unmount
    return () => {
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
      }
      // Remove presence when leaving
      removePresence(roomSlug);
    };
  }, [roomSlug, updatePresence, removePresence]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time subscriptions are now handled by useMessages and usePresence hooks

  // Helper to check if a string is a single emoji
  const isEmoji = (str: string): boolean => {
    const emojiRegex =
      /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Extended_Pictographic})$/u;
    return emojiRegex.test(str.trim());
  };

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!newMessage.trim() || sending) return;

    setSending(true);

    try {
      const content = newMessage.trim();
      const messageData: {
        content: string;
        location?: { lat: number; long: number };
      } = {
        content,
      };

      // If this is an emoji and the user has a location, include it
      if (isEmoji(content) && currentUserLocation) {
        messageData.location = currentUserLocation;
      }

      sendMessage({ roomId: roomSlug, messageData });
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
      if (err instanceof ApiError) {
        alert(`Failed to send message: ${err.message}`);
      } else {
        alert('Failed to send message');
      }
    } finally {
      setSending(false);
    }
  }

  async function toggleRecording() {
    if (isRecording) {
      // Stop recording
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        // Try to use MP4/M4A format (compatible with iOS), fall back to WebM
        let mimeType = 'audio/webm';

        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (
          MediaRecorder.isTypeSupported('audio/mp4; codecs="mp4a.40.2"')
        ) {
          mimeType = 'audio/mp4; codecs="mp4a.40.2"'; // AAC-LC
        } else if (MediaRecorder.isTypeSupported('audio/webm; codecs=opus')) {
          mimeType = 'audio/webm; codecs=opus';
        }

        console.log('Using audio format:', mimeType);

        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = event => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          // Stop all tracks to release microphone
          stream.getTracks().forEach(track => track.stop());

          // Create audio blob with the correct MIME type
          const audioBlob = new Blob(audioChunksRef.current, {
            type: mimeType,
          });

          setSending(true);
          try {
            // Upload via API route (uses slug for folder naming)
            const { attachment } = await attachmentsApi.upload(
              audioBlob,
              roomSlug,
              'audio'
            );

            // Send message with attachment URL
            const messageData = {
              content: '🎤 Voice message',
              attachment,
            };

            sendMessage({ roomId: roomSlug, messageData });
          } catch (err) {
            console.error('Failed to send voice message:', err);
            if (err instanceof ApiError) {
              alert(`Failed to send voice message: ${err.message}`);
            } else if (err instanceof Error) {
              alert(`Failed to send voice message: ${err.message}`);
            } else {
              alert('Failed to send voice message');
            }
          } finally {
            setSending(false);
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Failed to access microphone:', err);
        alert(
          'Failed to access microphone. Please grant permission and try again.'
        );
      }
    }
  }

  function formatTime(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Chat Header */}
      <div
        style={{
          padding: '1rem',
          borderBottom: '1px solid #e5e7eb',
          background: 'white',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '0.5rem',
            justifyItems: 'stretch',
          }}
        >
          <h3
            style={{
              fontSize: '1.125rem',
              fontWeight: 'bold',
              margin: 0,
              color: '#3b82f6',
            }}
          >
            💬 {roomName}
          </h3>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginTop: '0.25rem',
              justifyContent: 'flex-end',
              flexGrow: 1,
            }}
          >
            <p
              style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                margin: 0,
              }}
            >
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </p>
            <span style={{ color: '#e5e7eb' }}>•</span>
            <p
              style={{
                fontSize: '0.75rem',
                color: '#10b981',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10b981',
                  display: 'inline-block',
                }}
              />
              {activeUsers} active
            </p>
          </div>
          <button
            style={{
              width: '20px',
              height: '20px',
            }}
            onClick={onToggleSidebar}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {loading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              color: '#6b7280',
            }}
          >
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              color: '#6b7280',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
            <p style={{ fontSize: '0.875rem' }}>
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map(message => {
            const isCurrentUser = message.user_id === currentUser.id;
            const userName = isCurrentUser
              ? 'You'
              : message.userName || 'Unknown User';

            return (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
                }}
              >
                {/* User name label */}
                {!isCurrentUser && (
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      marginBottom: '0.25rem',
                      marginLeft: '0.5rem',
                      fontWeight: '500',
                    }}
                  >
                    {userName}
                  </div>
                )}

                <div
                  style={{
                    maxWidth: '75%',
                    padding: '0.75rem 1rem',
                    borderRadius: '1rem',
                    background: isCurrentUser ? '#3b82f6' : 'white',
                    color: isCurrentUser ? 'white' : '#111827',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    wordWrap: 'break-word',
                    borderBottomRightRadius: isCurrentUser ? '0.25rem' : '1rem',
                    borderBottomLeftRadius: isCurrentUser ? '1rem' : '0.25rem',
                  }}
                >
                  {message.content}
                  {message.attachment &&
                    message.attachment.type === 'audio' && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <audio
                          controls
                          src={
                            message.attachment.url || message.attachment.data
                          }
                          style={{
                            width: '100%',
                            maxWidth: '300px',
                            height: '32px',
                          }}
                        />
                      </div>
                    )}
                </div>
                <div
                  style={{
                    fontSize: '0.6875rem',
                    color: '#9ca3af',
                    marginTop: '0.25rem',
                    paddingLeft: isCurrentUser ? '0' : '0.5rem',
                    paddingRight: isCurrentUser ? '0.5rem' : '0',
                  }}
                >
                  {formatTime(message.created_at)}
                  {message.edited_at && ' (edited)'}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div
        style={{
          padding: '1rem',
          borderTop: '1px solid #e5e7eb',
          background: 'white',
        }}
      >
        <form
          onSubmit={handleSendMessage}
          style={{ display: 'flex', gap: '0.5rem' }}
        >
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending || isRecording}
            style={{
              flex: 1,
              padding: '0.625rem 0.875rem',
              border: '1px solid #d1d5db',
              borderRadius: '1.5rem',
              fontSize: '0.875rem',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => {
              e.target.style.borderColor = '#3b82f6';
            }}
            onBlur={e => {
              e.target.style.borderColor = '#d1d5db';
            }}
          />
          <button
            type="button"
            onClick={toggleRecording}
            disabled={sending}
            style={{
              padding: '0.625rem 1.25rem',
              background: isRecording ? '#ef4444' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '1.5rem',
              fontSize: '1.5rem',
              fontWeight: '500',
              cursor: sending ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
            onMouseEnter={e => {
              if (!sending) {
                e.currentTarget.style.background = isRecording
                  ? '#dc2626'
                  : '#059669';
              }
            }}
            onMouseLeave={e => {
              if (!sending) {
                e.currentTarget.style.background = isRecording
                  ? '#ef4444'
                  : '#10b981';
              }
            }}
          >
            {isRecording ? (
              <>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'white',
                    animation: 'pulse 1.5s infinite',
                  }}
                />
                Stop
              </>
            ) : (
              <>📣</>
            )}
          </button>
          <button
            type="submit"
            disabled={!newMessage.trim() || sending || isRecording}
            style={{
              padding: '0.625rem 1.25rem',
              background:
                !newMessage.trim() || sending || isRecording
                  ? '#9ca3af'
                  : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '1.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor:
                !newMessage.trim() || sending || isRecording
                  ? 'not-allowed'
                  : 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => {
              if (!sending && newMessage.trim() && !isRecording) {
                e.currentTarget.style.background = '#2563eb';
              }
            }}
            onMouseLeave={e => {
              if (!sending && newMessage.trim() && !isRecording) {
                e.currentTarget.style.background = '#3b82f6';
              }
            }}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
        <style jsx>{`
          @keyframes pulse {
            0%,
            100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
