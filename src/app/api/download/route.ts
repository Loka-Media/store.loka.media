import { NextRequest, NextResponse } from "next/server";
import { validateProxyUrl } from "@/lib/proxySecurity";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fileUrl = searchParams.get("url");
  let filename = searchParams.get("filename") || "design-file";

  const validation = validateProxyUrl(fileUrl);
  if (!validation.valid || !validation.parsedUrl) {
    return NextResponse.json(
      { error: validation.error || "Invalid download URL." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(validation.parsedUrl.toString(), {
      headers: {
        "User-Agent": "LokaMedia-DownloadProxy/1.0",
      },
      redirect: "manual",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch file: ${response.statusText}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const arrayBuffer = await response.arrayBuffer();

    // Sanitize filename to prevent header injection or directory traversal characters
    filename = filename.replace(/[/\\?%*:|"<>]/g, "-").replace(/[\r\n]/g, "");

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: any) {
    console.error("Download proxy error:", error);
    return NextResponse.json({ error: "Error downloading file" }, { status: 500 });
  }
}
