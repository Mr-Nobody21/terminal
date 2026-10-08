import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from 'react';
export type ThemePreference = 'system' | 'light' | 'dark';
const storageKey = 'planner-theme';
export function readTheme(storage: Pick<Storage, 'getItem'>): ThemePreference {
    try { const value = storage.getItem(storageKey); return value === 'light' || value === 'dark' ? value : 'system'; }
    catch { return 'system'; }
}
const ThemeContext = createContext<{ preference: ThemePreference; change: (theme: ThemePreference) => void }>({ preference: 'system', change: () => {} });
export function ThemeProvider({ children }: { children: ReactNode }) {
    const [preference, setPreference] = useState<ThemePreference>(() => { try { return readTheme(localStorage); } catch { return 'system'; } });
    useLayoutEffect(() => {
        const media = window.matchMedia?.('(prefers-color-scheme: dark)');
        const apply = () => { document.documentElement.dataset.theme = preference === 'system' ? (media?.matches ? 'dark' : 'light') : preference; };
        apply(); media?.addEventListener('change', apply);
        const sync = (event: StorageEvent) => { if (event.key === storageKey || event.key === null) { try { setPreference(readTheme(localStorage)); } catch { setPreference('system'); } } };
        window.addEventListener('storage', sync);
        return () => { media?.removeEventListener('change', apply); window.removeEventListener('storage', sync); };
    }, [preference]);
    const change = (theme: ThemePreference) => { setPreference(theme); try { localStorage.setItem(storageKey, theme); } catch { /* Theme remains usable when storage is unavailable. */ } };
    return <ThemeContext.Provider value={{ preference, change }}>{children}</ThemeContext.Provider>;
}
export function ThemeSelect() {
    const { preference, change } = useContext(ThemeContext);
    return <label className="theme-control"><span className="sr-only">Appearance</span><select aria-label="Appearance" value={preference} onChange={event => change(event.target.value as ThemePreference)}><option value="system">System theme</option><option value="light">Light mode</option><option value="dark">Dark mode</option></select></label>;
}
