import { useState, useRef, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
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
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [isFFmpegLoaded, setIsFFmpegLoaded] = useState(false);

  const { sendMessage } = useSendMessage();
  const { currentUser } = useCurrentUser();

  // Load FFmpeg on first use
  const loadFFmpeg = useCallback(async () => {
    if (ffmpegRef.current || isFFmpegLoaded) return;

    try {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;

      // Load FFmpeg core from CDN
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpeg.load({
        coreURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.js`,
          'text/javascript'
        ),
        wasmURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.wasm`,
          'application/wasm'
        ),
      });

      setIsFFmpegLoaded(true);
      console.log('✅ FFmpeg.wasm loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load FFmpeg.wasm:', error);
      throw new Error('Failed to load audio converter. Please try again.');
    }
  }, [isFFmpegLoaded]);

  // Convert WebM to M4A using FFmpeg.wasm
  const convertToM4A = useCallback(async (webmBlob: Blob): Promise<Blob> => {
    if (!ffmpegRef.current) {
      throw new Error('FFmpeg not loaded');
    }

    const ffmpeg = ffmpegRef.current;

    try {
      console.log('🔄 Converting WebM to M4A...');

      // Write input file to FFmpeg virtual filesystem
      await ffmpeg.writeFile('input.webm', await fetchFile(webmBlob));

      // Convert to M4A
      await ffmpeg.exec([
        '-i',
        'input.webm',
        '-c:a',
        'aac', // AAC codec
        '-b:a',
        '128k', // 128kbps bitrate
        '-ac',
        '1', // Mono
        '-ar',
        '44100', // 44.1kHz sample rate
        'output.m4a',
      ]);

      // Read output file (returns Uint8Array for binary files)
      const data = (await ffmpeg.readFile('output.m4a')) as Uint8Array;

      // Convert to Blob (cast to ArrayBuffer for TypeScript compatibility)
      const m4aBlob = new Blob([data.buffer as ArrayBuffer], {
        type: 'audio/mp4',
      });

      console.log(
        `✅ Conversion complete! WebM: ${webmBlob.size} bytes → M4A: ${m4aBlob.size} bytes`
      );

      // Clean up virtual filesystem
      await ffmpeg.deleteFile('input.webm');
      await ffmpeg.deleteFile('output.m4a');

      return m4aBlob;
    } catch (error) {
      console.error('❌ Conversion failed:', error);
      throw new Error('Failed to convert audio. Uploading original format.');
    }
  }, []);

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
      // Load FFmpeg if not already loaded
      if (!isFFmpegLoaded) {
        console.log('🔧 Loading FFmpeg.wasm...');
        await loadFFmpeg();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // Use the best format that the browser can actually RECORD
      // Note: Chrome/Firefox can only record WebM, even though they support playing MP4
      // Safari can record MP4, but it's rare
      let mimeType = 'audio/webm';

      // Try specific WebM codec first (best quality)
      if (MediaRecorder.isTypeSupported('audio/webm; codecs=opus')) {
        mimeType = 'audio/webm; codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      }

      console.log('🎤 Recording with MIME type:', mimeType);

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
        const webmBlob = new Blob(audioChunksRef.current, {
          type: mimeType,
        });

        setIsSending(true);
        try {
          // Convert WebM to M4A in the browser
          let audioToUpload: Blob;
          try {
            audioToUpload = await convertToM4A(webmBlob);
          } catch (conversionError) {
            // If conversion fails, fall back to uploading WebM
            console.warn(
              '⚠️ Conversion failed, uploading WebM:',
              conversionError
            );
            audioToUpload = webmBlob;
          }

          // Upload via API route (uses slug for folder naming)
          const { attachment } = await attachmentsApi.upload(
            audioToUpload,
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
  }, [
    eventSlug,
    sendMessage,
    onRecordingComplete,
    currentUser,
    isFFmpegLoaded,
    loadFFmpeg,
    convertToM4A,
  ]);

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
