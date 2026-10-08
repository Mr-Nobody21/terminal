import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { readdirSync,readFileSync } from 'node:fs';
function catalogFiles(dir:string):string[]{return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?catalogFiles(dir+'/'+e.name):e.name.endsWith('.svg')?[dir+'/'+e.name]:[]);}
const assets=catalogFiles('backend/assets').map(path=>({key:path.slice('backend/assets'.length),mime:'image/svg+xml',content:readFileSync(path,'utf8')}));
test.beforeEach(async({page})=>{await page.route('**/api/auth/me',route=>route.fulfill({json:{user:{id:'33333333-3333-4333-8333-333333333333',email:'test@example.com',displayName:'Test account'}}}));await page.route('**/api/assets/catalog',route=>route.fulfill({json:{assets}}));await page.route('**/api/assets',route=>route.fulfill({status:201,json:{id:'44444444-4444-4444-8444-444444444444'}}));});
import JSZip from 'jszip';
import { sampleProject } from '@planner/domain/examples';
import { type Provider } from '@planner/domain/providers';
async function start(page:Page){await page.goto('/');await page.getByRole('button',{name:'Plan with costs',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await page.getByRole('button',{name:'Close panel',exact:true}).click();}
async function openPanel(page: Page, name: string) {
    const button = page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name, exact: true });
    if (await button.getAttribute('aria-expanded') !== 'true') await button.click();
}
async function openExports(page: Page) {
    const button = page.getByRole('button', { name: 'Export', exact: true });
    if (await button.getAttribute('aria-expanded') !== 'true') await button.click();
}
test('manual example editing, persistence, history, import, and all exports', async ({ page }) => {
    await start(page);
    await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible();
    await openPanel(page, 'Projects');
    await page.getByRole('textbox', { name: 'Project name' }).fill('Manual acceptance');
    await page.getByRole('button', { name: 'Close panel' }).click();
    await expect(page.locator('.react-flow__node-service')).toHaveCount(4);
    const node = page.locator('.react-flow__node-service').first();
    const bounds = (await node.boundingBox())!;
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width / 2 + 50, bounds.y + bounds.height / 2 + 30, { steps: 10 });
    await page.mouse.up();
    await page.getByText('Resources & connections', { exact: false }).click();
    await page.getByRole('button', { name: 'ECS / Fargate', exact: true }).click();
    await page.getByText('More settings', { exact: true }).click();
    await page.getByText('Monthly workload inputs', { exact: true }).click();
    await page.getByRole('spinbutton', { name: 'cpu input' }).fill('2');
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await page.getByRole('button', { name: 'Redo', exact: true }).click();
    await page.getByRole('button', { name: 'Close properties' }).click();
    await openPanel(page, 'Shapes');
    await page.getByRole('button', { name: 'Add SQS', exact: true }).click();
    await openPanel(page, 'Costs');
    await expect(page.getByText('Incomplete estimate — unpriced costs remain')).toBeVisible();
    await openPanel(page, 'Projects');
    await page.getByLabel('Import project JSON').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"version":99}') });
    await expect(page.getByRole('alert')).toContainText('Unsupported project version');
    await expect(page.getByRole('textbox', { name: 'Project name' })).toHaveValue('Manual acceptance');
    await page.getByRole('button', { name: 'Dismiss notification' }).click();
    await openExports(page);
    for (const kind of ['DRAWIO', 'JSON', 'SVG', 'PNG', 'PDF', 'MD', 'DOCX', 'ZIP']) {
        const pending = page.waitForEvent('download');
        await page.getByRole('button', { name: `Export ${kind}`, exact: true }).click();
        const path = await (await pending).path();
        const bytes = await readFile(path!);
        expect(bytes.length).toBeGreaterThan(30);
        if (kind === 'DRAWIO') expect(bytes.toString()).toContain('edge="1"');
        if (kind === 'JSON') { const p = JSON.parse(bytes.toString()); expect(p.name).toBe('Manual acceptance'); expect(Object.keys(p.presentation.positions).length).toBeGreaterThan(0); }
        if (kind === 'PNG') expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
        if (kind === 'PDF') expect(bytes.subarray(0, 4).toString()).toBe('%PDF');
        if (kind === 'ZIP') { const zip = await JSZip.loadAsync(bytes); expect(zip.file('architecture.png')).not.toBeNull(); expect(zip.file('architecture.drawio')).not.toBeNull(); }
    }
    await openPanel(page, 'Projects');
    await page.getByRole('button', { name: 'Duplicate', exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'Project name' })).toHaveValue('Manual acceptance (copy)');
});
for (const [provider, aiProvider, endpoint] of [['aws','openai','https://api.openai.com/v1'],['azure','openai','https://api.openai.com/v1'],['gcp','openai','https://api.openai.com/v1'],['aws','openrouter','https://openrouter.ai/api/v1'],['aws','groq','https://api.groq.com/openai/v1'],['aws','compatible','https://custom.example/v1']] as const) {
    test(`mocked requirements to two ${provider} variants through ${aiProvider} and credential exclusion`, async ({ page }) => {
        await start(page);
        await openPanel(page, 'Projects');
        await page.getByRole('combobox', { name: 'Example provider' }).selectOption(provider);
        await page.getByRole('button', { name: 'New example', exact: true }).click();
        await page.getByRole('button',{name:'Plan with costs',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
        let requestCount = 0;
        await page.route(`${endpoint}/chat/completions`, async (route) => {
            requestCount++;
            const body = route.request().postDataJSON() as {
                messages: {
                    role: string;
                    content: string;
                }[];
            };
            const input = JSON.parse(body.messages[1].content);
            let result: unknown;
            if (input.text) {
                result = { facts: [{ text: 'Requires a PostgreSQL database', critical: true, source: 'prd' }], unknowns: [{ question: 'Monthly traffic?', critical: true, impact: 'cost' }], assumptions: [] };
            }
            else {
                const variants = [sampleProject(provider as Provider).variants[0], sampleProject(provider as Provider).variants[0]];
                variants.forEach((v, i) => { v.name = i === 0 ? 'Lean' : 'Recommended'; v.resources.forEach(r => Object.values(r.configuration.inputs).forEach(p => { if (p.source.kind === 'assumption')
                    p.source.id = input.assumptions[0].id; })); });
                result = { variants };
            }
            await route.fulfill({ json: { choices: [{ message: { content: JSON.stringify(result) } }] } });
        });
        await page.getByRole('link', { name: 'AI settings', exact: true }).click();
        await page.getByRole('combobox', { name: 'AI provider', exact: true }).selectOption(aiProvider);
        if(aiProvider === 'compatible') await page.getByRole('textbox', { name: 'AI endpoint' }).fill(endpoint);
        await expect(page.getByRole('textbox', { name: 'AI endpoint' })).toHaveValue(endpoint);
        await page.getByRole('textbox', { name: 'AI model' }).fill('mock-model');
        await page.getByLabel('API key', { exact: true }).fill('private-test-key');
        await page.getByRole('link', { name: 'Return to workspace' }).click();
        await openPanel(page, 'Requirements');
        await page.getByRole('button', { name: 'Extract facts & questions' }).click();
        await expect(page.getByRole('textbox', { name: 'Answer: Monthly traffic?' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Generate Lean & Recommended' })).toBeDisabled();
        await page.getByRole('textbox', { name: 'Answer: Monthly traffic?' }).fill('10000 requests monthly');
        await page.getByRole('button', { name: 'Generate Lean & Recommended' }).click();
        await expect(page.getByRole('combobox', { name: 'Architecture variant' })).toHaveValue(/.+/);
        await expect(page.getByRole('combobox', { name: 'Architecture variant' }).locator('option')).toHaveText(['Lean', 'Recommended']);
        expect(requestCount).toBe(2);
        await page.getByRole('link', { name: 'AI settings', exact: true }).click();
        await page.getByRole('combobox', { name: 'AI provider', exact: true }).selectOption('local');
        await expect(page.getByLabel('API key', { exact: true })).toHaveValue('');
        await page.getByRole('link', { name: 'Return to workspace' }).click();
        await page.getByRole('combobox', { name: 'Architecture variant' }).selectOption({ label: 'Recommended' });
        await openExports(page);
        const pending = page.waitForEvent('download');
        await page.getByRole('button', { name: 'Export JSON', exact: true }).click();
        const dl = await pending;
        const bytes = await readFile((await dl.path())!);
        expect(bytes.toString()).not.toContain('private-test-key');
        expect(JSON.parse(bytes.toString()).variants).toHaveLength(2);
        const prefs = await page.evaluate(() => localStorage.getItem('planner-ai-preferences'));
        expect(prefs).not.toContain('private-test-key');
        await page.reload();
        await page.getByRole('link', { name: 'AI settings', exact: true }).click();
        await expect(page.getByLabel('API key', { exact: true })).toHaveValue('');
    });
}
test('failed AI calls leave architecture unchanged and recoverable', async ({ page }) => {
    await start(page);
    await page.getByRole('link', { name: 'AI settings', exact: true }).click();
    await page.getByRole('textbox', { name: 'AI model' }).fill('mock');
    await page.getByLabel('API key', { exact: true }).fill('key');
    await page.getByRole('link', { name: 'Return to workspace' }).click();
    await openPanel(page, 'Requirements');
    await page.route('https://api.openai.com/**', route => route.fulfill({ status: 401, json: { error: 'secret' } }));
    await page.getByRole('button', { name: 'Generate Lean & Recommended' }).click();
    await expect(page.getByRole('alert')).toContainText('authentication');
    await expect(page.getByRole('combobox', { name: 'Architecture variant' }).locator('option')).toHaveText(['Manual']);
});
test('unavailable IndexedDB preserves the manual workspace and offers JSON recovery', async ({ page }) => {
    await page.addInitScript(() => { Object.defineProperty(window, 'indexedDB', { value: { open: () => { throw new Error('Storage blocked'); } } }); });
    await start(page);
    await expect(page.locator('.zen-header [role="status"]')).toContainText('Save failed');
    await expect(page.getByRole('alert')).toContainText('current project is still in memory');
    await page.getByRole('button', { name: 'Dismiss notification' }).click();
    await openPanel(page, 'Projects');
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download JSON', exact: true }).click();
    expect(JSON.parse(await readFile((await (await pending).path())!, 'utf8')).version).toBe(3);
});
test('committed edits survive switching projects before the autosave debounce', async ({ page }) => {
    await start(page); await openPanel(page, 'Projects');
    await page.getByRole('textbox', { name: 'Project name' }).fill('Saved before switch');
    await page.getByRole('button', { name: 'New example', exact: true }).click();
        await page.getByRole('button',{name:'Plan with costs',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
    await openPanel(page,'Projects');
    await expect(page.getByRole('textbox', { name: 'Project name' })).toHaveValue('Web application architecture');
    await page.getByRole('combobox', { name: 'Project', exact: true }).selectOption({ label: 'Saved before switch' });
    await expect(page.getByRole('textbox', { name: 'Project name' })).toHaveValue('Saved before switch');
});
test('zen navigation expands with keyboard, persists and keeps panels contextual', async ({ page }) => {
    await start(page);
    await expect(page.getByRole('complementary', { name: 'Service palette' })).toBeHidden();
    await expect(page.getByRole('complementary', { name: 'Selection properties' })).toBeHidden();
    await expect(page.getByRole('textbox', { name: 'Requirements', exact: true })).toBeHidden();
    await page.getByRole('button', { name: 'Expand navigation' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Collapse navigation' })).toHaveAttribute('aria-expanded', 'true');
    await openPanel(page, 'Requirements');
    await page.getByRole('textbox', { name: 'Requirements', exact: true }).fill('Keep my requirements while panels close');
    await openPanel(page, 'Costs');
    await expect(page.getByRole('textbox', { name: 'Requirements', exact: true })).toBeHidden();
    await expect(page.getByTestId('cost-total')).toBeVisible();
    await openPanel(page, 'Requirements');
    await expect(page.getByRole('textbox', { name: 'Requirements', exact: true })).toHaveValue('Keep my requirements while panels close');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('textbox', { name: 'Requirements', exact: true })).toBeHidden();
    await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Collapse navigation' })).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'Service palette' })).toBeHidden();
    await page.setViewportSize({ width: 640, height: 900 });
    await openPanel(page, 'Shapes');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: 'test-results/zen-mobile.png', fullPage: true });
});
test('fullscreen button and F11 enter and exit without changing the project', async ({ page }) => {
    await start(page);
    const title = await page.locator('.project-trigger').textContent();
    await page.getByRole('button', { name: 'Enter full screen', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Exit full screen', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
    await page.keyboard.press('F11');
    await expect(page.getByRole('button', { name: 'Enter full screen', exact: true })).toBeEnabled();
    await page.keyboard.press('F11');
    await expect(page.getByRole('button', { name: 'Exit full screen', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Exit full screen', exact: true }).click();
    await expect(page.locator('.project-trigger')).toHaveText(title!);
});
test('workspace controls retain their state across settings navigation', async ({ page }) => {
    await start(page);
    await openPanel(page, 'Shapes');
    await page.getByRole('textbox', { name: 'Search services' }).fill('lambda');
    await page.getByText('Resources & connections', { exact: false }).click();
    await page.getByRole('textbox', { name: 'Connection label' }).fill('Custom protocol');
    await page.getByRole('link', { name: 'AI settings', exact: true }).click();
    await page.getByLabel('API key', { exact: true }).fill('session-only');
    await page.getByRole('link', { name: 'Return to workspace' }).click();
    await expect(page.getByRole('textbox', { name: 'Search services' })).toHaveValue('lambda');
    await expect(page.getByRole('textbox', { name: 'Connection label' })).toHaveValue('Custom protocol');
    await page.getByRole('link', { name: 'AI settings', exact: true }).click();
    await expect(page.getByLabel('API key', { exact: true })).toHaveValue('session-only');
});
test('contextual drawing supports search, drop, properties, history and blank variants', async ({ page }) => {
    await start(page);
    await page.screenshot({ path: 'test-results/zen-canvas.png', fullPage: true });
    await openPanel(page, 'Shapes');
    await page.getByRole('textbox', { name: 'Search services' }).fill('lambda');
    const palette = page.getByRole('complementary', { name: 'Service palette' });
    await expect(palette.getByRole('button', { name: 'Add Lambda', exact: true })).toHaveCount(1);
    await palette.getByRole('button', { name: 'Add Lambda', exact: true }).click();
    await expect(page.locator('.react-flow__node-service')).toHaveCount(5);
    const properties = page.getByRole('complementary', { name: 'Selection properties' });
    await properties.getByRole('textbox', { name: 'Name', exact: true }).fill('Manual worker');
    await page.getByRole('button', { name: 'Pan', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Pan', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Select', exact: true }).click();
    const canvas = page.locator('.react-flow');
    const bounds = (await canvas.boundingBox())!;
    await canvas.dispatchEvent('drop', { clientX: bounds.x + bounds.width / 2, clientY: bounds.y + bounds.height / 2, dataTransfer: await page.evaluateHandle(() => { const data = new DataTransfer(); data.setData('application/x-planner-service', 'lambda'); return data; }) });
    await expect(page.locator('.react-flow__node-service')).toHaveCount(6);
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(page.locator('.react-flow__node-service')).toHaveCount(5);
    await page.getByRole('button', { name: 'Redo', exact: true }).click();
    await expect(page.locator('.react-flow__node-service')).toHaveCount(6);
    await page.screenshot({ path: 'test-results/zen-panels.png', fullPage: true });
    await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.locator('.react-flow__node-service')).toHaveCount(6);
    await openExports(page);
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export JSON', exact: true }).click();
    const project = JSON.parse(await readFile((await (await pending).path())!, 'utf8'));
    const positions = Object.values(project.presentation.positions) as { x: number; y: number }[];
    expect(positions).toHaveLength(1); expect(positions[0].x % 20).toBe(0); expect(positions[0].y % 20).toBe(0);
    await page.getByRole('button', { name: 'Close panel' }).click();
    await page.getByLabel('More diagram tools').click();
    await page.getByRole('button', { name: 'New blank variant', exact: true }).click();
    await expect(page.locator('.react-flow__node-service')).toHaveCount(0);
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(page.locator('.react-flow__node-service')).toHaveCount(6);
});

test('cross-cloud palette adds five providers to one persisted architecture', async ({ page }) => {
    await start(page); await openPanel(page, 'Shapes');
    let count=4;
    for (const [provider, service] of [['Azure', 'Virtual Machines'], ['Google Cloud', 'Compute Engine'], ['AWS', 'EC2'], ['Oracle Cloud','Virtual Machine'], ['IBM Cloud','Virtual Server']] as const) {
        await page.getByRole('combobox', { name: 'Cloud asset library' }).selectOption({ label: provider });
        await page.getByLabel('Search services').fill(service);
        await page.getByRole('button', { name: `Add ${service}`, exact: true }).click();
        await expect(page.locator('.react-flow__node-service')).toHaveCount(++count);
        await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible();
        await page.getByRole('button', { name: 'Close properties' }).click();
    }
    await page.getByRole('combobox', { name: 'Cloud asset library' }).selectOption('aws');
    await page.getByLabel('Search services').fill('accessanalyzer');
    await page.getByRole('button', {name:'Add accessanalyzer',exact:true}).click();
    await expect(page.getByRole('link',{name:'Official service reference'})).toBeVisible();
    await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible();
    await page.reload(); await expect(page.locator('.react-flow__node-service')).toHaveCount(10);
    await openExports(page);const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export JSON',exact:true}).click();
    const saved=JSON.parse(await readFile((await (await pending).path())!,'utf8'));
    expect(saved.version).toBe(3);expect(new Set(saved.variants[0].resources.map((r:{provider:string})=>r.provider)).size).toBe(5);
    expect(saved.variants[0].resources.find((r:{service:string})=>r.service==='catalog-accessanalyzer').unsupported).toBe(true);
    await page.getByRole('button',{name:'Close panel'}).click();
    await openPanel(page, 'Projects');
    await expect(page.getByRole('combobox', { name: 'Project', exact: true }).locator('option')).toHaveCount(1);
});
async function chooseDrawing(page: Page, kind: string) {
    await page.getByRole('combobox', { name: 'Diagram type' }).selectOption(kind);
    await expect(page.locator('.drawing-editor')).toBeVisible();
    await openPanel(page, 'Shapes');
}
async function drawingJson(page: Page) {
    await openExports(page);
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export JSON', exact: true }).click();
    return JSON.parse(await readFile((await (await pending).path())!, 'utf8'));
}
async function addDrawingConnection(page: Page, source: string, target: string, label: string, sequence = false) {
    const details = page.locator('.drawing-editor .connections');
    if ((await details.getAttribute('open')) === null) await details.locator('summary').click();
    await page.getByRole('combobox', { name: 'Drawing connection source' }).selectOption({ label: source });
    await page.getByRole('combobox', { name: 'Drawing connection target' }).selectOption({ label: target });
    await page.getByRole('textbox', { name: 'Drawing connection label' }).fill(label);
    await page.getByRole('button', { name: sequence ? 'Add message' : 'Connect shapes', exact: true }).click();
}
test('flowchart shapes, connections, history, import/export and reload remain independent from architecture', async ({ page }) => {
    await start(page); await chooseDrawing(page, 'flowchart');
    await page.getByRole('button', { name: 'Add process', exact: true }).click();
    await page.getByRole('textbox', { name: 'Shape label' }).fill('Receive <request>');
    await page.getByRole('button', { name: 'Add decision', exact: true }).click();
    await page.getByRole('textbox', { name: 'Shape label' }).fill('Valid?');
    await addDrawingConnection(page, 'Receive <request>', 'Valid?', 'yes & continue');
    const exported = await drawingJson(page); expect(exported.kind).toBe('flowchart'); expect(exported.edges).toHaveLength(1);
    await page.getByLabel('Import drawing JSON').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"version":99}') });
    await expect(page.getByRole('alert')).toContainText('Unsupported drawing version');
    await page.getByRole('button', { name: 'Dismiss notification' }).click();
    await expect(page.getByText('Drawing saved locally', { exact: true })).toBeVisible();
    await page.reload(); await chooseDrawing(page, 'flowchart');
    await expect(page.locator('.react-flow__node-shape')).toHaveCount(2);
    await page.getByRole('combobox', { name: 'Diagram type' }).selectOption('architecture');
    await expect(page.locator('.react-flow__node-service')).toHaveCount(4);
    await expect(page.getByRole('button', { name: 'Show monthly estimate' })).toContainText('/mo');
});
test('sequence diagrams preserve participants, ordered messages and dashed replies', async ({ page }) => {
    await start(page); await chooseDrawing(page, 'sequence');
    await page.getByRole('button', { name: 'Add participant', exact: true }).click();
    await page.getByRole('textbox', { name: 'Shape label' }).fill('Client');
    await page.getByRole('button', { name: 'Add participant', exact: true }).click();
    await page.getByRole('textbox', { name: 'Shape label' }).fill('API');
    await addDrawingConnection(page, 'Client', 'API', 'Request', true);
    await addDrawingConnection(page, 'API', 'Client', 'Response', true);
    await page.getByRole('button', { name: 'Move message 2 up' }).click();
    await page.getByRole('button', { name: '1. Response', exact: true }).click();
    await page.getByRole('checkbox', { name: 'Reply (dashed)' }).check();
    await page.getByRole('button', { name: 'Close shapes', exact: true }).click();
    await page.screenshot({ path: 'test-results/sequence-diagram.png', fullPage: true });
    const exported = await drawingJson(page); expect(exported.edges.map((e: { label: string }) => e.label)).toEqual(['Response', 'Request']); expect(exported.edges[0].reply).toBe(true);
    await page.getByRole('button', { name: 'Export SVG', exact: true }).click();
    await page.getByRole('button', { name: 'Close panel' }).click();
    await expect(page.getByText('Drawing saved locally', { exact: true })).toBeVisible();
    await page.reload(); await chooseDrawing(page, 'sequence');
    await expect(page.locator('.sequence-svg svg')).toContainText('Response');
    await expect(page.locator('.sequence-svg [data-node-id]')).toHaveCount(2);
});
test('ER diagrams support attributes, cardinality and atomic connected-entity deletion', async ({ page }) => {
    await start(page); await chooseDrawing(page, 'er');
    await page.getByRole('button', { name: 'Add entity', exact: true }).click();
    await page.getByRole('textbox', { name: 'Shape label' }).fill('Customer');
    await page.getByRole('textbox', { name: 'Entity attributes' }).fill('id: UUID PK\nemail: text UNIQUE');
    await page.getByRole('button', { name: 'Add entity', exact: true }).click();
    await page.getByRole('textbox', { name: 'Shape label' }).fill('Order');
    await addDrawingConnection(page, 'Customer', 'Order', 'places');
    await page.getByRole('button', { name: 'places', exact: true }).click();
    await page.getByRole('combobox', { name: 'Relationship cardinality' }).selectOption('N:M');
    let exported = await drawingJson(page); expect(exported.edges[0].relation).toBe('N:M'); expect(exported.nodes[0].fields).toContain('email: text UNIQUE');
    await page.getByRole('button', { name: 'Close panel' }).click();
    await page.locator('.drawing-editor .connections summary').click();
    await page.getByRole('button', { name: 'Customer', exact: true }).click();
    await page.getByRole('button', { name: 'Delete shape', exact: true }).click();
    exported = await drawingJson(page); expect(exported.nodes).toHaveLength(1); expect(exported.edges).toHaveLength(0);
    await page.getByRole('button', { name: 'Close panel' }).click();
    await page.locator('body').click({ position: { x: 500, y: 80 } });
    await page.keyboard.press('ControlOrMeta+z');
    await expect(page.locator('.react-flow__node-shape')).toHaveCount(2);
    await page.screenshot({ path: 'test-results/er-diagram.png', fullPage: true });
});
test('infrastructure diagrams mix all seven asset libraries with no price claims', async ({ page }) => {
    await start(page); await chooseDrawing(page, 'infrastructure');
    for (const [library, asset] of [['aws', 'EC2'], ['azure', 'Virtual Machines'], ['gcp', 'Compute Engine'], ['oracle', 'Virtual Machine'], ['ibm', 'Virtual Server'], ['kubernetes', 'Pod'], ['generic', 'Server']] as const) {
        await page.getByRole('combobox', { name: 'Asset library' }).selectOption(library);
        await page.getByRole('button', { name: `Add ${asset}`, exact: true }).click();
    }
    await expect(page.locator('.react-flow__node-shape')).toHaveCount(7);
    expect(await page.locator('.drawing-node img').evaluateAll(images => images.every(img => (img as HTMLImageElement).naturalWidth > 0))).toBe(true);
    await expect(page.getByRole('button', { name: 'Show monthly estimate' })).toHaveText('Visual diagram');
    const exported = await drawingJson(page); expect(exported.nodes).toHaveLength(7); expect(exported.nodes.map((n: { assetId: string }) => n.assetId.split('/')[0])).toEqual(['aws', 'azure', 'gcp', 'oracle', 'ibm', 'kubernetes', 'generic']);
    await openPanel(page, 'Costs'); await expect(page.getByRole('heading', { name: 'No cloud estimate' })).toBeVisible();
});

test('dragging a flowchart shape stores its position and ignores invalid payloads', async ({ page }) => {
    await start(page); await chooseDrawing(page, 'flowchart');
    const canvas = page.locator('.drawing-editor .editor-canvas'), bounds = (await canvas.boundingBox())!;
    await canvas.dispatchEvent('drop', { clientX: bounds.x + 500, clientY: bounds.y + 300, dataTransfer: await page.evaluateHandle(() => { const data = new DataTransfer(); data.setData('application/x-planner-shape', JSON.stringify({ shape: 'decision' })); return data; }) });
    await expect(page.locator('.react-flow__node-shape')).toHaveCount(1);
    await canvas.dispatchEvent('drop', { clientX: bounds.x + 500, clientY: bounds.y + 300, dataTransfer: await page.evaluateHandle(() => { const data = new DataTransfer(); data.setData('application/x-planner-shape', JSON.stringify({ shape: 'asset', assetId: 'remote/unknown' })); return data; }) });
    await expect(page.locator('.react-flow__node-shape')).toHaveCount(1);
    const exported = await drawingJson(page); expect(exported.nodes[0].x % 20).toBe(0); expect(exported.nodes[0].y % 20).toBe(0);
});

test('new project choice persists simple mode and switches to the cost workspace',async({page})=>{
    await page.goto('/');await expect(page.getByRole('dialog')).toContainText('Include cost calculations?');
    await page.getByRole('button',{name:'Simple diagram',exact:true}).click();
    await expect(page.getByRole('navigation').getByRole('button',{name:'Costs',exact:true})).toHaveCount(0);
    await expect(page.getByRole('button',{name:'Show monthly estimate'})).toHaveCount(0);
    await expect(page.getByRole('combobox',{name:'Diagram type'})).toHaveValue('infrastructure');
    await expect(page.getByText('Drawing saved locally',{exact:true})).toBeVisible();await page.waitForTimeout(450);await page.reload();
    await expect(page.getByRole('combobox',{name:'Diagram type'})).toHaveValue('infrastructure');await expect(page.getByRole('dialog')).toHaveCount(0);
    await openPanel(page,'Projects');await page.getByRole('button',{name:'New project',exact:true}).click();await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.getByRole('textbox',{name:'Project name'})).toHaveValue('Untitled diagram');
    await page.getByRole('button',{name:'New project',exact:true}).click();await page.getByRole('button',{name:'Plan with costs',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('combobox',{name:'Diagram type'})).toHaveValue('architecture');await expect(page.getByRole('heading',{name:'Monthly estimate'})).toBeVisible();await expect(page.locator('.react-flow__node-service')).toHaveCount(0);
    await openPanel(page,'Projects');await page.getByLabel('Enable cost calculations').uncheck();await expect(page.getByRole('combobox',{name:'Diagram type'})).toHaveValue('infrastructure');
});

test('Mermaid XML and Excel import/export preserve projects and reject invalid files',async({page})=>{
    await start(page);await openExports(page);
    for(const [label,extension] of [['Mermaid','mmd'],['XML','xml'],['XLSX','xlsx']] as const){
        const pending=page.waitForEvent('download');await page.getByRole('button',{name:`Export ${label}`,exact:true}).click();const bytes=await readFile((await (await pending).path())!);
        await page.getByLabel('Import Mermaid, XML, Excel or image').setInputFiles({name:`roundtrip.${extension}`,mimeType:extension==='xlsx'?'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':'text/plain',buffer:bytes});
        await expect(page.getByRole('alert')).toContainText('Project imported and validated');await page.getByRole('button',{name:'Dismiss notification'}).click();await expect(page.locator('.react-flow__node-service')).toHaveCount(4);
    }
    await page.getByLabel('Import Mermaid, XML, Excel or image').setInputFiles({name:'broken.xml',mimeType:'application/xml',buffer:Buffer.from('<mxfile>')});await expect(page.getByRole('alert')).toContainText('Invalid XML');await expect(page.locator('.react-flow__node-service')).toHaveCount(4);await page.getByRole('button',{name:'Dismiss notification'}).click();
    await page.getByLabel('Import Mermaid, XML, Excel or image').setInputFiles({name:'flow.mmd',mimeType:'text/plain',buffer:Buffer.from('flowchart LR\nA["Client"]\nB["API"]\nA -->|"HTTPS"| B')});
    await expect(page.getByRole('combobox',{name:'Diagram type'})).toHaveValue('flowchart');await expect(page.locator('.drawing-editor .react-flow__node-shape')).toHaveCount(2);
});

test('PNG and JPEG references persist and export as both raster formats',async({page})=>{
    await start(page);await openExports(page);
    const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aC1sAAAAASUVORK5CYII=','base64');
    await page.getByLabel('Import Mermaid, XML, Excel or image').setInputFiles({name:'reference.png',mimeType:'image/png',buffer:png});
    await expect(page.getByRole('combobox',{name:'Diagram type'})).toHaveValue('infrastructure');await expect(page.locator('.reference-image')).toHaveCount(1);await page.getByRole('button',{name:'Dismiss notification'}).click();
    const jpeg=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=80;canvas.height=40;return canvas.toDataURL('image/jpeg').split(',')[1];});
    await page.getByLabel('Import Mermaid, XML, Excel or image').setInputFiles({name:'reference.jpeg',mimeType:'image/jpeg',buffer:Buffer.from(jpeg,'base64')});await expect(page.locator('.reference-image')).toHaveCount(2);
    for(const label of ['PNG','JPEG']){const pending=page.waitForEvent('download');await page.getByRole('button',{name:`Export ${label}`,exact:true}).click();const bytes=await readFile((await (await pending).path())!);expect(bytes[0]).toBe(label==='PNG'?137:255);}
    await expect(page.getByText('Drawing saved locally',{exact:true})).toBeVisible();await page.reload();await chooseDrawing(page,'infrastructure');await expect(page.locator('.reference-image')).toHaveCount(2);
});
