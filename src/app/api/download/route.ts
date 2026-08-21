import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fileUrl = searchParams.get("url");
  let filename = searchParams.get("filename") || "design-file";

  if (!fileUrl) {
    return new NextResponse("Missing file URL", { status: 400 });
  }

  try {
    const response = await fetch(fileUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });

    if (!response.ok) {
      return new NextResponse(`Failed to fetch image: ${response.statusText}`, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const arrayBuffer = await response.arrayBuffer();

    // Sanitize filename
    filename = filename.replace(/[/\\?%*:|"<>]/g, "-");

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("Download proxy error:", error);
    return new NextResponse("Error downloading file", { status: 500 });
  }
}
