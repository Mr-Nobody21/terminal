import { useEffect, useRef, useState } from 'react';
import { createAdapter, loadPreferences, savePreferences, privacyNotice, type AIProvider, type AISettings } from './adapter';
import { applyExtraction, extractRequirements, generateArchitectures, unresolvedCritical } from '../requirements/engine';
import type { Project } from '../../core/model';
const endpoints: Record<AIProvider, string> = { openai: 'https://api.openai.com/v1', anthropic: 'https://api.anthropic.com/v1', gemini: 'https://generativelanguage.googleapis.com/v1beta', local: 'http://localhost:1234/v1' };
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
    return { settings, key, busy, setKey, updateSettings: (next: AISettings) => { setSettings(next); try {
            savePreferences(next);
        }
        catch {
            onError('AI preferences could not be saved. Your key remains in memory.');
        } }, cancel: () => controller.current?.abort(), run };
}
export type AIState = ReturnType<typeof useAI>;
export function AISettingsPanel({ ai }: {
    ai: AIState;
}) { return <section className="settings-panel"><h2>AI settings</h2><p>Bring your own key, or use a local OpenAI-compatible model.</p><p className="privacy">{privacyNotice}</p><label>AI provider<select aria-label="AI provider" value={ai.settings.provider} onChange={e => { const provider = e.target.value as AIProvider; ai.updateSettings({ ...ai.settings, provider, endpoint: endpoints[provider], model: '' }); }}>{(['openai', 'anthropic', 'gemini', 'local'] as const).map(p => <option key={p} value={p}>{p}</option>)}</select></label><label>Endpoint<input aria-label="AI endpoint" value={ai.settings.endpoint} onChange={e => ai.updateSettings({ ...ai.settings, endpoint: e.target.value })}/></label><label>Model name<input aria-label="AI model" placeholder="Model available on your endpoint" value={ai.settings.model} onChange={e => ai.updateSettings({ ...ai.settings, model: e.target.value })}/></label><label>API key (memory only)<input aria-label="API key" type="password" autoComplete="off" value={ai.key} onChange={e => ai.setKey(e.target.value)}/></label><button onClick={() => ai.setKey('')}>Clear key</button><p className="hint">Local endpoints must allow browser CORS requests. Some hosted endpoints restrict browser access. Failed requests preserve your project.</p><a href="#workspace">Return to workspace</a></section>; }
export function AIRequirementsControls({ ai, project }: {
    ai: AIState;
    project: Project;
}) { const blocked = unresolvedCritical(project); return <div className="ai-controls"><p className="privacy">{privacyNotice}</p><button className="primary" disabled={!!ai.busy} onClick={() => void ai.run('extract')}>{ai.busy === 'extract' ? 'Extracting…' : 'Extract facts & questions'}</button><button className="primary" disabled={!!ai.busy || !!blocked.length} onClick={() => void ai.run('generate')}>{ai.busy === 'generate' ? 'Generating…' : 'Generate Lean & Recommended'}</button>{!!blocked.length && <p className="hint">Answer {blocked.length} critical question(s), or enter an explicit assumption.</p>}{ai.busy && <button onClick={ai.cancel}>Cancel AI request</button>}<a href="#settings">Configure AI</a></div>; }
