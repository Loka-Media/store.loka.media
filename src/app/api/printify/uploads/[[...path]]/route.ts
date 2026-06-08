/**
 * Printify Uploads API Routes
 * POST /api/printify/uploads/images   → upload image by URL or base64
 * GET  /api/printify/uploads/:id      → get uploaded image info
 * POST /api/printify/uploads/:id/archive → delete uploaded image
 */

import { NextRequest, NextResponse } from 'next/server';
import { printifyUploadsAPI } from '@/services/printify/PrintifyClient';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path } = await params;
    const segments = path || [];

    if (segments.length === 0) {
      const searchParams = request.nextUrl.searchParams;
      const limit = parseInt(searchParams.get('limit') || '10');
      const page = parseInt(searchParams.get('page') || '1');
      const images = await printifyUploadsAPI.getImages({ limit, page });
      return NextResponse.json({ success: true, data: images });
    }

    const image = await printifyUploadsAPI.getImage(segments[0]);
    return NextResponse.json({ success: true, data: image });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload GET failed';
    console.error('[Printify Uploads GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path } = await params;
    const segments = path || [];

    // POST /api/printify/uploads/:id/archive → delete
    if (segments.length === 2 && segments[1] === 'archive') {
      await printifyUploadsAPI.archiveImage(segments[0]);
      return NextResponse.json({ success: true, message: 'Image archived' });
    }

    // POST /api/printify/uploads/images → upload
    // Body: { file_name, url } or { file_name, contents (base64) }
    const body = await request.json();
    const image = await printifyUploadsAPI.uploadImage(body);
    return NextResponse.json({ success: true, data: image }, { status: 201 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload POST failed';
    console.error('[Printify Uploads POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
