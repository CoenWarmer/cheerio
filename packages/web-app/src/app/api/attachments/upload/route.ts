import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

/**
 * POST /api/attachments/upload
 * Uploads an attachment file to Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Get authenticated user (if logged in)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const eventId = formData.get('eventId') as string;
    const type = formData.get('type') as string; // e.g., 'audio', 'image', 'video'
    const user_id = formData.get('user_id') as string; // For anonymous users

    // Support both authenticated users and anonymous users
    const userId = user_id || user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required (authenticated or anonymous)' },
        { status: 400 }
      );
    }

    if (!file || !eventId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: file, eventId, type' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
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
    if (type === 'audio' && !allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` },
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

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'webm';
    const filename = `${type}-${userId}-${timestamp}.${extension}`;
    const filePath = `${type}-messages/${eventId}/${filename}`;

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('room-attachments')
      .upload(filePath, buffer, {
        contentType: file.type,
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
        mimeType: file.type,
        size: file.size,
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
