// Compiled exclusively with native-smoke; absent from distributed builds.
addEventListener('DOMContentLoaded', async () => {
  const until = async (check) => {
    for (let i = 0; i < 300; i++) { if (await check()) return; await new Promise(r => setTimeout(r, 100)); }
    throw Error('Native UI timeout: ' + document.body.innerText.slice(0, 400));
  };
  try {
    await until(() => document.querySelectorAll('.react-flow__node-service').length === 4 && document.body.innerText.includes('Saved on this device'));
    if (!crypto.randomUUID || !indexedDB) throw Error('Missing local-first APIs');
    if ('require' in window || 'process' in window) throw Error('Unexpected Node globals');
    const images = [...document.querySelectorAll('.service-node img')];
    await until(() => images.length === 4 && images.every(img => img.naturalWidth > 0));
    const fullscreenButton = () => document.querySelector('[aria-label="Enter full screen"], [aria-label="Exit full screen"]');
    fullscreenButton().click();
    await until(async () => await window.__TAURI_INTERNALS__.invoke('fullscreen_state'));
    await until(() => fullscreenButton().getAttribute('aria-label') === 'Exit full screen' && !fullscreenButton().disabled);
    fullscreenButton().click();
    await until(async () => !await window.__TAURI_INTERNALS__.invoke('fullscreen_state'));
    await until(() => fullscreenButton().getAttribute('aria-label') === 'Enter full screen' && !fullscreenButton().disabled);
    // Exercise native changes outside the React button, like the Mac window/menu controls.
    await window.__TAURI_INTERNALS__.invoke('set_fullscreen', { fullscreen: true });
    await until(() => fullscreenButton().getAttribute('aria-label') === 'Exit full screen');
    await window.__TAURI_INTERNALS__.invoke('set_fullscreen', { fullscreen: false });
    await until(() => fullscreenButton().getAttribute('aria-label') === 'Enter full screen');
    const input = document.querySelector('[aria-label="Project name"]');
    const previous = localStorage.getItem('planner-native-smoke');
    if (previous && input.value !== previous) throw Error('Project did not persist across native relaunch');
    if (!previous) {
      const name = 'Tauri native smoke ' + Date.now();
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, name);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      localStorage.setItem('planner-native-smoke', name);
      await new Promise(r => setTimeout(r, 1200));
      await until(() => document.body.innerText.includes('Saved on this device'));
    }
    for (const format of ['JSON', 'PNG', 'ZIP']) {
      const button = [...document.querySelectorAll('button')].find(b => b.textContent === `Export ${format}`);
      button.click();
      await new Promise(r => setTimeout(r, 200));
      await until(() => !button.disabled);
      if (document.querySelector('[role="alert"]')) throw Error(document.querySelector('[role="alert"]').textContent);
    }
    await window.__TAURI_INTERNALS__.invoke('smoke_result', { result: { ok: true, persisted: !!previous, nodes: 4, icons: 4, fullscreenRoundTrip: true, origin: location.origin } });
  } catch (e) {
    await window.__TAURI_INTERNALS__.invoke('smoke_result', { result: { ok: false, error: String(e) } });
  }
});
