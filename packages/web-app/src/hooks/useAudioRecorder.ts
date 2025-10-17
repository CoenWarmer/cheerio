import { useState, useRef, useCallback } from 'react';
import { attachmentsApi } from '@/lib/api/attachments-api';
import { ApiError } from '@/lib/api/api-client';
import { useSendMessage } from './useMessages';
import { useCurrentUser } from './useCurrentUser';

interface UseAudioRecorderProps {
  eventSlug: string;
  onRecordingComplete?: () => void;
}

export function useAudioRecorder({
  eventSlug,
  onRecordingComplete,
}: UseAudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { sendMessage } = useSendMessage();
  const { currentUser } = useCurrentUser();

  const startRecording = useCallback(async () => {
    // Ensure we have a user ID before starting
    if (!currentUser?.id) {
      console.error('Cannot record: No user ID available');
      alert('Please wait for your profile to load before recording.');
      return;
    }

    // Capture user ID at the start to use in the onstop callback
    const userId = currentUser.id;

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

        setIsSending(true);
        try {
          // Upload via API route (uses slug for folder naming)
          const { attachment } = await attachmentsApi.upload(
            audioBlob,
            eventSlug,
            'audio',
            userId
          );

          // Send message with attachment URL
          const messageData = {
            content: '📢 Cheerioo!',
            attachment,
            user_id: userId,
          };

          sendMessage({ eventId: eventSlug, messageData });

          // Callback when complete
          onRecordingComplete?.();
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
          setIsSending(false);
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
  }, [eventSlug, sendMessage, onRecordingComplete, currentUser]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isSending,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}
