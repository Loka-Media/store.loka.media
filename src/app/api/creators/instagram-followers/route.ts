import { NextRequest, NextResponse } from "next/server";

// Cache follower counts for 1 hour to prevent hitting Instagram rate limits
interface CachedFollowerData {
  handle: string;
  followers: string;
  count: number;
  timestamp: number;
}

const cache = new Map<string, CachedFollowerData>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export function extractInstagramHandle(input: string): string {
  if (!input) return "";
  let clean = input.trim();

  // If it's a full URL
  if (clean.includes("instagram.com/")) {
    try {
      if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
        clean = "https://" + clean;
      }
      const url = new URL(clean);
      const segments = url.pathname.split("/").filter(Boolean);
      // Exclude special Instagram paths like /p/, /stories/, /reel/, /explore/
      if (segments.length > 0 && !["p", "stories", "reel", "reels", "explore"].includes(segments[0].toLowerCase())) {
        clean = segments[0];
      }
    } catch {
      const match = clean.match(/instagram\.com\/([a-zA-Z0-9._]+)/i);
      if (match) clean = match[1];
    }
  }

  // Strip leading @, query parameters, trailing slashes
  clean = clean.split("?")[0].split("#")[0];
  clean = clean.replace(/^@/, "").replace(/\/+$/, "").trim();

  return clean;
}

export async function fetchInstagramFollowers(handle: string): Promise<{ followers: string; count: number }> {
  if (!handle) return { followers: "0", count: 0 };

  const key = handle.toLowerCase();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { followers: cached.followers, count: cached.count };
  }

  try {
    const res = await fetch(`https://www.instagram.com/${encodeURIComponent(handle)}/`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`[Instagram] HTTP ${res.status} for ${handle}`);
      return { followers: "0", count: 0 };
    }

    const html = await res.text();

    // 1. Check og:description tag: content="687M Followers, 302 Following, ..."
    let match = html.match(/content="([0-9.,KMBkmb]+)\s+Followers/i);
    if (!match) {
      // 2. Check general meta content or description
      match = html.match(/([0-9.,KMBkmb]+)\s+Followers/i);
    }

    let followersStr = "";
    let numericCount = 0;

    if (match && match[1]) {
      followersStr = match[1];
      const raw = match[1].toUpperCase().trim();
      if (raw.endsWith("M")) {
        numericCount = Math.round(parseFloat(raw.replace("M", "")) * 1000000);
      } else if (raw.endsWith("K")) {
        numericCount = Math.round(parseFloat(raw.replace("K", "")) * 1000);
      } else if (raw.endsWith("B")) {
        numericCount = Math.round(parseFloat(raw.replace("B", "")) * 1000000000);
      } else {
        numericCount = parseInt(raw.replace(/,/g, ""), 10) || 0;
      }
    } else {
      // 3. Check JSON schema or edge_followed_by count
      const edgeMatch = html.match(/"edge_followed_by":\s*\{\s*"count":\s*(\d+)\s*\}/);
      if (edgeMatch && edgeMatch[1]) {
        numericCount = parseInt(edgeMatch[1], 10);
        if (numericCount >= 1000000) {
          followersStr = (numericCount / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
        } else if (numericCount >= 1000) {
          followersStr = (numericCount / 1000).toFixed(1).replace(/\.0$/, "") + "K";
        } else {
          followersStr = numericCount.toLocaleString();
        }
      }
    }

    if (!followersStr) {
      followersStr = "0";
      numericCount = 0;
    }

    const result = { followers: followersStr, count: numericCount };
    // Only cache if we got real data or non-zero, or for a shorter duration if 0
    cache.set(key, {
      handle,
      followers: followersStr,
      count: numericCount,
      timestamp: Date.now() - (followersStr === "0" ? CACHE_TTL_MS + 1000 : 0),
    });
    return result;
  } catch (err) {
    console.error(`[Instagram Followers] Failed to fetch for ${handle}:`, err);
    return { followers: "0", count: 0 };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const target = searchParams.get("url") || searchParams.get("username") || searchParams.get("handle") || "";

    if (!target) {
      return NextResponse.json({ error: "Missing url or username parameter" }, { status: 400 });
    }

    const handle = extractInstagramHandle(target);
    if (!handle) {
      return NextResponse.json({ error: "Invalid Instagram URL or handle" }, { status: 400 });
    }

    const { followers, count } = await fetchInstagramFollowers(handle);

    return NextResponse.json({
      success: true,
      handle,
      followers,
      count,
    });
  } catch (error: any) {
    console.error("[Instagram Followers GET] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch followers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const targets: string[] = Array.isArray(body?.targets)
      ? body.targets
      : Array.isArray(body?.usernames)
      ? body.usernames
      : [];

    if (targets.length === 0) {
      return NextResponse.json({ success: true, data: {} });
    }

    // Limit batch size to 25
    const safeTargets = targets.slice(0, 25);
    const results: Record<string, { handle: string; followers: string; count: number }> = {};

    await Promise.all(
      safeTargets.map(async (target) => {
        const handle = extractInstagramHandle(target);
        if (!handle) {
          results[target] = { handle: "", followers: "0", count: 0 };
          return;
        }
        const { followers, count } = await fetchInstagramFollowers(handle);
        results[target] = { handle, followers, count };
      })
    );

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    console.error("[Instagram Followers POST] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch followers" }, { status: 500 });
  }
}
