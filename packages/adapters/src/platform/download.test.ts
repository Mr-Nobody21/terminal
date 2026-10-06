import { beforeEach, expect, test, vi } from 'vitest';
const native = vi.hoisted(() => ({ enabled: false, invoke: vi.fn() }));
vi.mock('@tauri-apps/api/core', () => ({ isTauri: () => native.enabled, invoke: native.invoke }));
import { downloadArtifact } from './download';
beforeEach(() => { native.enabled = false; native.invoke.mockReset(); });
test('native export passes bytes and a basename, with no arbitrary path', async () => {
  native.enabled = true;
  native.invoke.mockResolvedValue(true);
  const blob = { arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer } as Blob;
  await downloadArtifact(blob, 'folder/plan.json');
  expect(native.invoke).toHaveBeenCalledWith('save_export', { filename: 'folder_plan.json', bytes: [1, 2, 3] });
});
test('native cancellation is harmless and save errors remain recoverable', async () => {
  native.enabled = true;
  native.invoke.mockResolvedValueOnce(false).mockRejectedValueOnce(new Error('Disk full'));
  const blob = { arrayBuffer: async () => new ArrayBuffer(0) } as Blob;
  await expect(downloadArtifact(blob, 'plan.json')).resolves.toBeUndefined();
  await expect(downloadArtifact(blob, 'plan.json')).rejects.toThrow('Disk full');
});
test('browser export retains the download link and revokes its URL', async () => {
  vi.useFakeTimers();
  const create = vi.fn(() => 'blob:example'), revoke = vi.fn();
  vi.stubGlobal('URL', { createObjectURL: create, revokeObjectURL: revoke });
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  try {
    await downloadArtifact(new Blob(['project']), 'plan.json');
    expect(click).toHaveBeenCalledOnce();
    expect(native.invoke).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(revoke).toHaveBeenCalledWith('blob:example');
  } finally { vi.useRealTimers(); vi.unstubAllGlobals(); click.mockRestore(); }
});
