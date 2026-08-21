'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';

export default function SmoothScroll() {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // 1. Disable browser's native scroll restoration on single page app navigation
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    } as any);

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // 2. Handle Browser Back & Forward Buttons (popstate event)
    const resetScrollToTop = () => {
      window.scrollTo(0, 0);
      if (lenisRef.current) {
        lenisRef.current.scrollTo(0, { immediate: true });
        lenisRef.current.resize();
      }
    };

    const handlePopState = () => {
      resetScrollToTop();
      setTimeout(resetScrollToTop, 50);
      setTimeout(resetScrollToTop, 150);
      setTimeout(resetScrollToTop, 350);
      setTimeout(resetScrollToTop, 600);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // 3. Reset scroll position to top on every route/pathname change
  useEffect(() => {
    const resetScrollToTop = () => {
      window.scrollTo(0, 0);
      if (lenisRef.current) {
        lenisRef.current.scrollTo(0, { immediate: true });
        lenisRef.current.resize();
      }
    };

    resetScrollToTop();
    const t1 = setTimeout(resetScrollToTop, 50);
    const t2 = setTimeout(resetScrollToTop, 150);
    const t3 = setTimeout(resetScrollToTop, 350);
    const t4 = setTimeout(resetScrollToTop, 600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [pathname]);

  return null;
}
