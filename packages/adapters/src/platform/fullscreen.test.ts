import { afterEach, expect, test, vi } from 'vitest';
const native = vi.hoisted(() => ({ enabled: false, invoke: vi.fn() }));
vi.mock('@tauri-apps/api/core', () => ({ isTauri: () => native.enabled, invoke: native.invoke }));
import { fullscreenState, setFullscreen } from './fullscreen';
afterEach(() => { native.enabled = false; native.invoke.mockReset(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
test('desktop fullscreen uses native commands for the invoking window', async () => {
  native.enabled = true;
  native.invoke.mockResolvedValueOnce(true).mockResolvedValueOnce(undefined).mockResolvedValueOnce(undefined);
  expect(await fullscreenState()).toBe(true);
  await setFullscreen(false);
  await setFullscreen(true);
  expect(native.invoke.mock.calls).toEqual([['fullscreen_state'], ['set_fullscreen', { fullscreen: false }], ['set_fullscreen', { fullscreen: true }]]);
});
test('browser fullscreen enters and exits using the document API', async () => {
  const enter = vi.fn().mockResolvedValue(undefined), exit = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('document', { documentElement: { requestFullscreen: enter }, exitFullscreen: exit, fullscreenElement: {} });
  expect(await fullscreenState()).toBe(true);
  await setFullscreen(true); await setFullscreen(false);
  expect(enter).toHaveBeenCalledOnce(); expect(exit).toHaveBeenCalledOnce();
  expect(native.invoke).not.toHaveBeenCalled();
});
test('native failures are surfaced to the caller', async () => {
  native.enabled = true; native.invoke.mockRejectedValueOnce(new Error('Native window unavailable'));
  await expect(setFullscreen(true)).rejects.toThrow('Native window unavailable');
});

test('unsupported browsers report a useful error without invoking native APIs', async () => {
  vi.stubGlobal('document', { documentElement: {}, fullscreenElement: null });
  expect(await fullscreenState()).toBe(false);
  await expect(setFullscreen(true)).rejects.toThrow('unavailable in this browser');
});
