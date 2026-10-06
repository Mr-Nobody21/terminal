import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import JSZip from 'jszip';
import { sampleProject } from '../src/core/sample';
import { type Provider } from '../src/core/providers';
test('manual example editing, persistence, history, import, and all exports', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Cloud Architecture Planner' })).toBeVisible();
    await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible();
    await page.getByRole('textbox', { name: 'Project name' }).fill('Manual acceptance');
    await expect(page.locator('.react-flow__node-service')).toHaveCount(4);
    const node=page.locator('.react-flow__node-service').first();const bounds=await node.boundingBox();expect(bounds).not.toBeNull();
    await page.mouse.move(bounds!.x+bounds!.width/2,bounds!.y+bounds!.height/2);await page.mouse.down();await page.mouse.move(bounds!.x+bounds!.width/2+50,bounds!.y+bounds!.height/2+30,{steps:10});await page.mouse.up();
    await expect(page.getByText('Saved on this device',{exact:true})).toBeVisible();
    await page.getByText('Resources & connections', { exact: false }).click();
    await page.getByRole('button', { name: 'ECS / Fargate', exact: true }).click();
    const costBefore = await page.getByTestId('cost-total').textContent();
    await page.getByRole('spinbutton', { name: 'cpu input', exact: true }).fill('0.5');
    await expect(page.getByTestId('cost-total')).not.toHaveText(costBefore!);
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(page.getByTestId('cost-total')).toHaveText(costBefore!);
    await page.getByRole('button', { name: 'Redo', exact: true }).click();
    await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('textbox', { name: 'Project name' })).toHaveValue('Manual acceptance');
    await page.getByRole('combobox', { name: 'Service to add' }).selectOption('lambda');
    await page.getByRole('button', { name: 'Add service', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Service configuration' })).toBeVisible();
    await page.getByRole('button', { name: 'Delete resource', exact: true }).click();
    await page.getByRole('combobox', { name: 'Service to add' }).selectOption('sqs');
    await page.getByRole('button', { name: 'Add service', exact: true }).click();
    await expect(page.getByText('Incomplete estimate — unpriced costs remain')).toBeVisible();
    await page.getByLabel('Import project JSON').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"version":99}') });
    await expect(page.getByRole('alert')).toContainText('Unsupported project version');
    await expect(page.getByRole('textbox', { name: 'Project name' })).toHaveValue('Manual acceptance');
    for (const kind of ['DRAWIO', 'JSON', 'SVG', 'PNG', 'PDF', 'MD', 'DOCX', 'ZIP']) {
        const pending = page.waitForEvent('download');
        await page.getByRole('button', { name: `Export ${kind}`, exact: true }).click();
        const download = await pending;
        const path = await download.path();
        expect(path).not.toBeNull();
        const bytes = await readFile(path!);
        expect(bytes.length).toBeGreaterThan(30);
        if (kind === 'DRAWIO')
            expect(bytes.toString()).toContain('edge="1"');
        if (kind === 'JSON') {const p=JSON.parse(bytes.toString());expect(p.name).toBe('Manual acceptance');expect(Object.keys(p.presentation.positions).length).toBeGreaterThan(0);}
        if (kind === 'PNG')
            expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
        if (kind === 'PDF')
            expect(bytes.subarray(0, 4).toString()).toBe('%PDF');
        if (kind === 'ZIP') {
            const zip = await JSZip.loadAsync(bytes);
            expect(zip.file('architecture.png')).not.toBeNull();
            expect(zip.file('architecture.drawio')).not.toBeNull();
        }
    }
    await page.screenshot({path:'test-results/workspace.png',fullPage:true});
    await page.getByRole('button', { name: 'Duplicate', exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'Project name' })).toHaveValue('Manual acceptance (copy)');
});
for (const provider of ['aws', 'azure', 'gcp'] as Provider[]) {
    test(`mocked requirements to two ${provider} variants and credential exclusion`, async ({ page }) => {
        await page.goto('/');
        await page.getByRole('combobox', { name: 'Example provider' }).selectOption(provider);
        await page.getByRole('button', { name: 'New example', exact: true }).click();
        let requestCount = 0;
        await page.route('https://api.openai.com/v1/chat/completions', async (route) => {
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
                const variants = [sampleProject(provider).variants[0], sampleProject(provider).variants[0]];
                variants.forEach((v, i) => { v.name = i === 0 ? 'Lean' : 'Recommended'; v.resources.forEach(r => Object.values(r.configuration.inputs).forEach(p => { if (p.source.kind === 'assumption')
                    p.source.id = input.assumptions[0].id; })); });
                result = { variants };
            }
            await route.fulfill({ json: { choices: [{ message: { content: JSON.stringify(result) } }] } });
        });
        await page.getByRole('link', { name: 'AI settings', exact: true }).click();
        await page.getByRole('textbox', { name: 'AI model' }).fill('mock-model');
        await page.getByLabel('API key', { exact: true }).fill('private-test-key');
        await page.getByRole('link', { name: 'Return to workspace' }).click();
        await page.getByRole('button', { name: 'Extract facts & questions' }).click();
        await expect(page.getByRole('textbox', { name: 'Answer: Monthly traffic?' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Generate Lean & Recommended' })).toBeDisabled();
        await page.getByRole('textbox', { name: 'Answer: Monthly traffic?' }).fill('10000 requests monthly');
        await page.getByRole('button', { name: 'Generate Lean & Recommended' }).click();
        await expect(page.getByRole('combobox', { name: 'Architecture variant' })).toHaveValue(/.+/);
        await expect(page.getByRole('combobox', { name: 'Architecture variant' }).locator('option')).toHaveText(['Lean', 'Recommended']);
        expect(requestCount).toBe(2);
        await page.getByRole('combobox', { name: 'Architecture variant' }).selectOption({ label: 'Recommended' });
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
test('failed AI calls leave architecture unchanged and recoverable', async ({ page }) => { await page.goto('/'); await page.getByRole('link', { name: 'AI settings', exact: true }).click(); await page.getByRole('textbox', { name: 'AI model' }).fill('mock'); await page.getByLabel('API key', { exact: true }).fill('key'); await page.getByRole('link', { name: 'Return to workspace' }).click(); await page.route('https://api.openai.com/**', route => route.fulfill({ status: 401, json: { error: 'secret' } })); await page.getByRole('button', { name: 'Generate Lean & Recommended' }).click(); await expect(page.getByRole('alert')).toContainText('authentication'); await expect(page.getByRole('combobox', { name: 'Architecture variant' }).locator('option')).toHaveText(['Manual']); });


test('unavailable IndexedDB preserves the manual workspace and offers JSON recovery',async({page})=>{await page.addInitScript(()=>{Object.defineProperty(window,'indexedDB',{value:{open:()=>{throw new Error('Storage blocked');}}});});await page.goto('/');await expect(page.getByRole('heading',{name:'Cloud Architecture Planner'})).toBeVisible();await expect(page.getByRole('status')).toContainText('Save failed');await expect(page.getByRole('alert')).toContainText('current project is still in memory');const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Download JSON',exact:true}).click();const dl=await pending;expect(JSON.parse(await readFile((await dl.path())!,'utf8')).version).toBe(1);});


test('committed edits survive switching projects before the autosave debounce',async({page})=>{await page.goto('/');await expect(page.getByRole('textbox',{name:'Project name'})).toBeVisible();await page.getByRole('textbox',{name:'Project name'}).fill('Saved before switch');await page.getByRole('button',{name:'New example',exact:true}).click();await expect(page.getByRole('textbox',{name:'Project name'})).toHaveValue('Web application architecture');await page.getByRole('combobox',{name:'Project',exact:true}).selectOption({label:'Saved before switch'});await expect(page.getByRole('textbox',{name:'Project name'})).toHaveValue('Saved before switch');});
