import { useEffect, useRef, useState } from 'react';
import { createAdapter, loadPreferences, savePreferences, privacyNotice, type AISettings } from '@planner/adapters/ai/adapter';
import { applyExtraction, extractRequirements, generateArchitectures, unresolvedCritical } from '@planner/adapters/ai/requirements';
import type { Project } from '@planner/domain/model';
import { aiProviders, aiProviderProfiles, usesChatCompletions, type AIProvider } from '@planner/adapters/ai/providers';
export function useAI(project: Project | null, onChange: (p: Project) => void, onError: (message: string) => void) {
    const [settings, setSettings] = useState<AISettings>(loadPreferences), [key, setKey] = useState(''), [busy, setBusy] = useState('');
    const controller = useRef<AbortController | null>(null), generation = useRef(0);
    const currentProject = useRef(project);
    currentProject.current = project;
    useEffect(() => { generation.current++; controller.current?.abort(); setBusy(''); }, [project?.id]);
    useEffect(() => () => controller.current?.abort(), []);
    const run = async (task: 'extract' | 'generate') => { if (!project || busy)
        return; const snapshot = project, token = ++generation.current; const control = new AbortController(); controller.current = control; setBusy(task); try {
        const adapter = createAdapter(settings, key);
        const result = task === 'extract' ? applyExtraction(snapshot, snapshot.requirementsText, await extractRequirements(adapter, snapshot.requirementsText, control.signal)) : await generateArchitectures(adapter, snapshot, control.signal);
        if (control.signal.aborted || token !== generation.current)
            return;
        if (currentProject.current !== snapshot)
            throw new Error('Project changed while AI was working. Review your edits and submit again.');
        onChange(result);
    }
    catch (e) {
        if (token === generation.current)
            onError(e instanceof Error ? e.message : 'AI request failed');
    }
    finally {
        if (token === generation.current) {
            setBusy('');
            controller.current = null;
        }
    } };
    return { settings, key, busy, setKey, updateSettings: (next: AISettings) => { if (next.provider !== settings.provider || next.endpoint !== settings.endpoint) setKey(''); setSettings(next); try {
            savePreferences(next);
        }
        catch {
            onError('AI preferences could not be saved. Your key remains in memory.');
        } }, cancel: () => controller.current?.abort(), run };
}
export type AIState = ReturnType<typeof useAI>;
export function AISettingsPanel({ ai }: {
    ai: AIState;
}) { return <section className="settings-panel"><h2>AI settings</h2><p>Bring your own OpenRouter, Groq, OpenAI, Anthropic or Gemini key, or connect another compatible service or local model.</p><p className="privacy">{privacyNotice}</p><label>AI provider<select aria-label="AI provider" value={ai.settings.provider} onChange={e => { const provider = e.target.value as AIProvider; ai.updateSettings({ ...ai.settings, provider, endpoint: aiProviderProfiles[provider].endpoint, model: '', jsonMode: true }); }}>{aiProviders.map(p => <option key={p} value={p}>{aiProviderProfiles[p].label}</option>)}</select></label><p className="hint">{aiProviderProfiles[ai.settings.provider].hint}</p><label>API base URL<input aria-label="AI endpoint" value={ai.settings.endpoint} onChange={e => ai.updateSettings({ ...ai.settings, endpoint: e.target.value })}/></label><label>Model name<input aria-label="AI model" placeholder={aiProviderProfiles[ai.settings.provider].modelPlaceholder} value={ai.settings.model} onChange={e => ai.updateSettings({ ...ai.settings, model: e.target.value })}/></label>{usesChatCompletions(ai.settings.provider) && <><label className="json-mode"><input type="checkbox" aria-label="Request JSON mode" checked={ai.settings.jsonMode !== false} onChange={e => ai.updateSettings({ ...ai.settings, jsonMode: e.target.checked })}/> Request JSON mode</label><p className="hint">Turn off for models that do not support JSON mode. Responses still pass local schema and architecture validation.</p></>}<label>{ai.settings.provider==='local'?'API key (optional, memory only)':'API key (memory only)'}<input aria-label="API key" type="password" autoComplete="off" required={ai.settings.provider!=='local'} placeholder={ai.settings.provider==='local'?'Leave blank unless your local server requires authentication':undefined} value={ai.key} onChange={e => ai.setKey(e.target.value)}/></label><button disabled={!ai.key} onClick={() => ai.setKey('')}>Clear key</button>{ai.settings.provider==='local'&&<p className="hint">No API key is needed for most local models. Leave this field blank; no Authorization header will be sent.</p>}<p className="hint">Changing provider or API base URL clears the key. Local endpoints must allow browser CORS requests. Some hosted endpoints restrict browser access. Failed requests preserve your project.</p><a href="#workspace">Return to workspace</a></section>; }
export function AIRequirementsControls({ ai, project }: {
    ai: AIState;
    project: Project;
}) { const blocked = unresolvedCritical(project); return <div className="ai-controls"><p className="privacy">{privacyNotice}</p><button className="primary" disabled={!!ai.busy} onClick={() => void ai.run('extract')}>{ai.busy === 'extract' ? 'Extracting…' : 'Extract facts & questions'}</button><button className="primary" disabled={!!ai.busy || !!blocked.length} onClick={() => void ai.run('generate')}>{ai.busy === 'generate' ? 'Generating…' : 'Generate Lean & Recommended'}</button>{!!blocked.length && <p className="hint">Answer {blocked.length} critical question(s), or enter an explicit assumption.</p>}{ai.busy && <button onClick={ai.cancel}>Cancel AI request</button>}<a href="#settings">Configure AI</a></div>; }
