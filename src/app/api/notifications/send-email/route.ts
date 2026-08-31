import { NextResponse } from 'next/server';
import { sendResendEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, name, type } = body;

    if (!to || !type) {
      return NextResponse.json({ error: 'Email (to) and notification type are required' }, { status: 400 });
    }

    if (!['pending_approval', 'approved', 'rejected'].includes(type)) {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    const result = await sendResendEmail({ to, name, type });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    console.error('[Send Email Route Error]', error);
    return NextResponse.json({ error: error?.message || 'Failed to process email' }, { status: 500 });
  }
}
