import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/$/, "");

const forwardHeaders = (request: NextRequest) => {
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");
  return headers;
};

const proxyRequest = async (request: NextRequest) => {
  const targetUrl = `${BACKEND_URL}${request.nextUrl.pathname}${request.nextUrl.search}`;
  const headers = forwardHeaders(request);

  const fetchOptions: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    fetchOptions.body = await request.arrayBuffer();
  }

  try {
    const response = await fetch(targetUrl, fetchOptions);
    const responseBody = await response.arrayBuffer();
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("x-proxied-by", "nextjs-printful-proxy");

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Printful proxy request failed.",
        details: String(error),
        targetUrl,
      },
      { status: 502 }
    );
  }
};

export async function GET(request: NextRequest) {
  return proxyRequest(request);
}

export async function POST(request: NextRequest) {
  return proxyRequest(request);
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request);
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request);
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request);
}

export async function OPTIONS(request: NextRequest) {
  return proxyRequest(request);
}
