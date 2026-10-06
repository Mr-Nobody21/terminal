import { useCallback, useEffect, useRef, useState } from 'react';
import { fullscreenState, setFullscreen } from '@planner/adapters/platform/fullscreen';

export function useFullscreen(onError: (message: string) => void) {
  const [fullscreen, updateFullscreen] = useState(false), [busy, setBusy] = useState(false);
  const mounted = useRef(false), changing = useRef(false);
  useEffect(() => {
    mounted.current = true;
    const refresh = () => { void fullscreenState().then(value => { if (mounted.current) updateFullscreen(value); }).catch(() => {}); };
    refresh();
    let settled: ReturnType<typeof setTimeout> | undefined;
    const resized = () => { refresh(); clearTimeout(settled); settled = setTimeout(refresh, 1000); };
    window.addEventListener('resize', resized);
    document.addEventListener('fullscreenchange', refresh);
    return () => { mounted.current = false; clearTimeout(settled); window.removeEventListener('resize', resized); document.removeEventListener('fullscreenchange', refresh); };
  }, []);
  const toggle = useCallback(async () => {
    if (changing.current) return;
    changing.current = true; setBusy(true);
    try {
      const desired = !await fullscreenState();
      await setFullscreen(desired);
      // Native macOS Spaces transitions complete asynchronously.
      for (let attempt = 0; attempt < 50; attempt++) {
        const actual = await fullscreenState();
        if (mounted.current) updateFullscreen(actual);
        if (actual === desired) return;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      throw new Error('Fullscreen did not finish changing. Try the window fullscreen control again.');
    } catch (error) { if (mounted.current) onError(error instanceof Error ? error.message : 'Could not change fullscreen.'); }
    finally { changing.current = false; if (mounted.current) setBusy(false); }
  }, [onError]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'F11') { event.preventDefault(); void toggle(); }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [toggle]);
  return { fullscreen, busy, toggle };
}
