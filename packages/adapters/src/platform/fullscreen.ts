import { invoke, isTauri } from '@tauri-apps/api/core';

export async function fullscreenState(): Promise<boolean> {
  return isTauri() ? invoke<boolean>('fullscreen_state') : Boolean(document.fullscreenElement);
}
export async function setFullscreen(fullscreen: boolean): Promise<void> {
  if (isTauri()) { await invoke('set_fullscreen', { fullscreen }); return; }
  if (fullscreen) {
    if (typeof document.documentElement.requestFullscreen !== 'function') throw new Error('Fullscreen is unavailable in this browser.');
    await document.documentElement.requestFullscreen();
  } else if (document.fullscreenElement) await document.exitFullscreen();
}
