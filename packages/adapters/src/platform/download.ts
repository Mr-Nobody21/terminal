import { invoke, isTauri } from '@tauri-apps/api/core';

/** The native bridge accepts export bytes, never arbitrary paths or credentials. */
export async function downloadArtifact(blob: Blob, filename: string): Promise<void> {
  const safeName = Array.from(filename, char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127 || '/\\:'.includes(char) ? '_' : char).join('');
  if (isTauri()) {
    await invoke<boolean>('save_export', { filename: safeName, bytes: Array.from(new Uint8Array(await blob.arrayBuffer())) });
    return;
  }
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = safeName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
