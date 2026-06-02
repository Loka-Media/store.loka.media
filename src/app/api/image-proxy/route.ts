import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url query parameter." }, { status: 400 });
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return NextResponse.json({ error: "Invalid URL protocol." }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Invalid URL." }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        // Maintain a minimal request when proxying images.
        Accept: "image/*,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch image." }, { status: 502 });
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const imageBuffer = await response.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Image proxy failed.", details: String(error) }, { status: 502 });
  }
}
