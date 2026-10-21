import { NextResponse } from "next/server";
import { validateProxyUrl, isAllowedImageContentType } from "@/lib/proxySecurity";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  const validation = validateProxyUrl(url);
  if (!validation.valid || !validation.parsedUrl) {
    return NextResponse.json(
      { error: validation.error || "Invalid proxy URL." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(validation.parsedUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "image/*",
        "User-Agent": "LokaMedia-ImageProxy/1.0",
      },
      // Do not follow redirects automatically to prevent redirect-based SSRF into private networks
      redirect: "manual",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream image fetch failed with status ${response.status}.` },
        { status: 502 }
      );
    }

    const contentType = response.headers.get("content-type");
    if (!isAllowedImageContentType(contentType)) {
      return NextResponse.json(
        { error: "Forbidden upstream content-type. Only valid image media is accepted." },
        { status: 415 }
      );
    }

    const imageBuffer = await response.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType || "image/jpeg",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; img-src 'self'",
      },
    });
  } catch (error) {
    console.error("[ImageProxy] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Image proxy fetch failed." }, { status: 502 });
  }
}
