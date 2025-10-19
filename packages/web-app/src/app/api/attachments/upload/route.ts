import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { validateUserId } from '@/lib/validate-user-id';

/**
 * POST /api/attachments/upload
 * Uploads an attachment file to Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const eventId = formData.get('eventId') as string;
    const type = formData.get('type') as string; // e.g., 'audio', 'image', 'video'
    const user_id = formData.get('user_id') as string; // For anonymous users

    // Validate user ID (prevents impersonation)
    const { userId, error: userIdError } = await validateUserId(
      supabase,
      user_id
    );

    if (!userId || userIdError) {
      return NextResponse.json(
        { error: userIdError || 'User ID required' },
        { status: 403 }
      );
    }

    if (!file || !eventId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: file, eventId, type' },
        { status: 400 }
      );
    }

    // Validate file type (check base type, ignore codecs)
    const allowedAudioTypes = [
      'audio/webm',
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/mp4',
      'audio/m4a',
      'audio/x-m4a',
      'audio/aac',
    ];

    const allowedImageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    // Extract base MIME type (before semicolon for codecs)
    const baseMimeType = file.type.split(';')[0].trim();

    if (type === 'audio' && !allowedAudioTypes.includes(baseMimeType)) {
      return NextResponse.json(
        {
          error: `Invalid audio type: ${baseMimeType}. Allowed: ${allowedAudioTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    if (type === 'image' && !allowedImageTypes.includes(baseMimeType)) {
      return NextResponse.json(
        {
          error: `Invalid image type: ${baseMimeType}. Allowed: ${allowedImageTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer: Buffer = Buffer.from(arrayBuffer);
    const finalMimeType = file.type;

    // Determine file extension based on MIME type (not filename)
    // This handles cases where Chrome sends audio/mp4 with filename "recording.webm"
    let finalExtension: string;
    if (file.type.includes('audio/mp4') || file.type.includes('audio/m4a')) {
      finalExtension = 'm4a';
    } else if (
      file.type.includes('audio/mpeg') ||
      file.type.includes('audio/mp3')
    ) {
      finalExtension = 'mp3';
    } else if (file.type.includes('audio/wav')) {
      finalExtension = 'wav';
    } else if (file.type.includes('audio/ogg')) {
      finalExtension = 'ogg';
    } else if (file.type.includes('audio/webm')) {
      finalExtension = 'webm';
    } else if (
      file.type.includes('image/jpeg') ||
      file.type.includes('image/jpg')
    ) {
      finalExtension = 'jpg';
    } else if (file.type.includes('image/png')) {
      finalExtension = 'png';
    } else if (file.type.includes('image/gif')) {
      finalExtension = 'gif';
    } else if (file.type.includes('image/webp')) {
      finalExtension = 'webp';
    } else {
      // Fallback to filename extension
      finalExtension = file.name.split('.').pop() || type;
    }

    console.log(
      `📁 File: ${file.name} | Type: ${file.type} | Size: ${file.size} bytes`
    );
    console.log(`✅ Detected extension: .${finalExtension}`);

    // Note: Audio conversion is now handled in the browser via ffmpeg.wasm
    // before upload, so we just upload the already-converted M4A file

    // Generate unique filename with correct extension
    const timestamp = Date.now();
    const filename = `${type}-${userId}-${timestamp}.${finalExtension}`;
    const filePath = `${type}-messages/${eventId}/${filename}`;

    // Upload to Supabase Storage
    // Use base MIME type without codecs (Supabase doesn't accept codecs in contentType)
    const uploadMimeType = finalMimeType.split(';')[0].trim();

    const { error: uploadError } = await supabase.storage
      .from('room-attachments')
      .upload(filePath, buffer, {
        contentType: uploadMimeType,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('room-attachments').getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      attachment: {
        type,
        url: publicUrl,
        filename,
        mimeType: uploadMimeType, // Use base MIME type (without codecs)
        size: buffer.length, // Use converted file size
      },
    });
  } catch (error) {
    console.error('Error in upload attachment API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
