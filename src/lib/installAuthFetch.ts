/**
 * Attach the logged-in user's access token to same-origin `/api/...` fetch calls.
 *
 * Many pages call internal Next.js API routes with a bare `fetch('/api/...')`.
 * Those routes verify the JWT server-side (see lib/serverAuth.ts), so the token
 * has to travel with the request. The token lives in localStorage (no cookie),
 * so we add the `Authorization` header here, once, instead of at every call site.
 *
 * Only same-origin `/api/` requests are touched, and an explicit Authorization
 * header set by the caller always wins. The token is never sent to other hosts.
 */
let installed = false;

function isSameOriginApi(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.origin === window.location.origin && parsed.pathname.startsWith('/api/');
  } catch {
    return false;
  }
}

export function installAuthFetch(): void {
  if (installed || typeof window === 'undefined' || typeof window.fetch !== 'function') return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

      if (isSameOriginApi(url)) {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const headers = new Headers(
            init?.headers ?? (input instanceof Request ? input.headers : undefined)
          );
          if (!headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${token}`);
            if (input instanceof Request) {
              return originalFetch(new Request(input, { ...init, headers }));
            }
            return originalFetch(input, { ...init, headers });
          }
        }
      }
    } catch {
      // Never break a request because of header handling
    }
    return originalFetch(input, init);
  };
}
