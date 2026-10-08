import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readTheme, ThemeProvider, ThemeSelect } from './Theme';
describe('appearance preference', () => {
 let media: MediaQueryList;
 let update: EventListener;
 beforeEach(() => {
  localStorage.clear();
  media = { matches: true, addEventListener: vi.fn((_type, listener) => { update = listener; }), removeEventListener: vi.fn() } as unknown as MediaQueryList;
  vi.stubGlobal('matchMedia', vi.fn(() => media));
 });
 afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); delete document.documentElement.dataset.theme; });
 it('follows live system changes and removes its listener', () => {
  const view = render(<ThemeProvider><ThemeSelect/></ThemeProvider>);
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  act(() => { Object.defineProperty(media, 'matches', { value: false }); update(new Event('change')); });
  expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  view.unmount(); expect(media.removeEventListener).toHaveBeenCalled();
 });
 it('persists explicit preferences across remounts and ignores system changes', () => {
  const view = render(<ThemeProvider><ThemeSelect/></ThemeProvider>);
  fireEvent.change(screen.getByLabelText('Appearance'), { target: { value: 'light' } });
  expect(localStorage.getItem('planner-theme')).toBe('light');
  act(() => update(new Event('change')));
  expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  view.unmount(); render(<ThemeProvider><ThemeSelect/></ThemeProvider>);
  expect(screen.getByLabelText('Appearance')).toHaveValue('light');
  fireEvent.change(screen.getByLabelText('Appearance'), { target: { value: 'dark' } });
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
 });
 it('recovers from invalid and unavailable storage', () => {
  expect(readTheme({ getItem: () => 'invalid' })).toBe('system');
  expect(readTheme({ getItem: () => { throw new Error('denied'); } })).toBe('system');
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full'); });
  render(<ThemeProvider><ThemeSelect/></ThemeProvider>);
  fireEvent.change(screen.getByLabelText('Appearance'), { target: { value: 'light' } });
  expect(document.documentElement).toHaveAttribute('data-theme', 'light');
 });
 it('synchronizes changes from another tab', () => {
  render(<ThemeProvider><ThemeSelect/></ThemeProvider>);
  localStorage.setItem('planner-theme', 'light');
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'planner-theme' })));
  expect(screen.getByLabelText('Appearance')).toHaveValue('light');
 });
});
