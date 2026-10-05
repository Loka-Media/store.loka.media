import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = (process.env.BACKEND_URL || 'https://catalog.loka.media').replace(/\/$/, '');
const ALLOWED_ORIGIN = 'https://store-loka-ui-v2-glksz.ondigitalocean.app';

async function handler(
  request: NextRequest,
  context: { params: Promise<{ catchall: string[] }> }
) {
  const { catchall } = await context.params;
  const targetPath = catchall ? catchall.join('/') : '';
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${BACKEND_URL}/api/${targetPath}${searchParams ? `?${searchParams}` : ''}`;

  const headers: Record<string, string> = {
    'Origin': ALLOWED_ORIGIN,
    'Referer': `${ALLOWED_ORIGIN}/`,
  };

  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  const authorization = request.headers.get('authorization');
  if (authorization) {
    headers['Authorization'] = authorization;
  }
  const cookie = request.headers.get('cookie');
  if (cookie) {
    headers['Cookie'] = cookie;
  }

  let body: BodyInit | null = null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const text = await request.text();
    if (text) {
      body = text;
    }
  }

  try {
    const response = await fetch(url, {
      method: request.method,
      headers,
      body,
    });

    const data = await response.text();
    const responseHeaders = new Headers();
    const resContentType = response.headers.get('content-type');
    if (resContentType) {
      responseHeaders.set('content-type', resContentType);
    }
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      responseHeaders.set('set-cookie', setCookie);
    }

    return new NextResponse(data, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error(`Catchall proxy error for /api/${targetPath}:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = async () => {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
