import { useCallback, useEffect, useRef, useState } from 'react';
import { serializeProject, type Project } from '@planner/domain/model';
import { sampleProject } from '@planner/domain/examples';
import type { Provider } from '@planner/domain/providers';
import { useFullscreen } from '../shared/hooks/useFullscreen';
import { useHistory } from './state/history';
import { repository } from '@planner/adapters/storage/repository';
import { useAI } from '../features/ai/AIControls';
import { downloadArtifact } from '@planner/adapters/platform/download';
import type { ExportFormat } from '@planner/adapters/exports/artifacts';
export function useWorkspace(keyboardHistory = true) {
    const { project, past, future, open, apply, undo, redo } = useHistory();
    const [needsProjectChoice,setNeedsProjectChoice]=useState(false);
    const [projects, setProjects] = useState<Project[]>([]), [selected, setSelected] = useState<string>(), [message, setMessage] = useState(''), [saveStatus, setSaveStatus] = useState('Loading local projects…'), [page, setPage] = useState(location.hash === '#settings' ? 'settings' : location.hash === '#workspace' ? 'workspace' : 'dashboard');
    const [requirementsCollapsed, setRequirementsCollapsed] = useState(false), [costCollapsed, setCostCollapsed] = useState(false);
    const [exporting, setExporting] = useState('');
    const [service, setService] = useState(''), [provider, setProvider] = useState<Provider>('aws'), [from, setFrom] = useState(''), [to, setTo] = useState(''), [connectionLabel, setConnectionLabel] = useState('HTTPS');
    const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const lastSaved = useRef(''), importRef = useRef<HTMLInputElement>(null);
    const ai = useAI(project, apply, (text) => setMessage(text));
    const reportError = useCallback((message: string) => setMessage(message), []);
    const fullscreen = useFullscreen(reportError);
    const refresh = useCallback(async () => setProjects(await repository.list()), []);
    useEffect(() => {
        let cancelled = false;
        repository.list().then(list => {
            if (cancelled)
                return;
            setProjects(list);
            setNeedsProjectChoice(list.length===0);
            open(list[0] ?? sampleProject());
        }).catch(() => {
            if (!cancelled) {
                setNeedsProjectChoice(true);
                open(sampleProject());
                setMessage('Local storage is unavailable. Keep your work by downloading project JSON.');
            }
        });
        const route = () => setPage(location.hash === '#settings' ? 'settings' : location.hash === '#workspace' ? 'workspace' : 'dashboard');
        window.addEventListener('hashchange', route);
        return () => { cancelled = true; window.removeEventListener('hashchange', route); };
    }, [open]);
    useEffect(() => {
        if (!project || needsProjectChoice)
            return;
        const text = serializeProject(project);
        if (text === lastSaved.current)
            return;
        setSaveStatus('Unsaved changes');
        let cancelled = false;
        const timer = setTimeout(() => {
            repository.save(project).then(async () => {
                if (cancelled)
                    return;
                lastSaved.current = text;
                setSaveStatus('Saved on this device');
                await refresh();
            }).catch(() => {
                if (!cancelled) {
                    setSaveStatus('Save failed — download JSON');
                    setMessage('Autosave failed. Your current project is still in memory. Download JSON to preserve it.');
                }
            });
        }, 350);
        saveTimer.current = timer;
        return () => { cancelled = true; clearTimeout(timer); };
    }, [project, refresh, needsProjectChoice]);
    const change = useCallback((p: Project) => {
        try {
            apply(p);
            setMessage('');
        }
        catch (e) {
            setMessage(e instanceof Error ? e.message : 'Invalid edit');
        }
    }, [apply]);
    useEffect(() => {
        const key = (e: KeyboardEvent) => {
            if (!keyboardHistory) return;
            const target = e.target as HTMLElement;
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)
                return;
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey)
                    redo();
                else
                    undo();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                redo();
            }
        };
        window.addEventListener('keydown', key);
        return () => window.removeEventListener('keydown', key);
    }, [undo, redo, keyboardHistory]);
    const json = () => {
        if (project)
            run(() => downloadArtifact(new Blob([serializeProject(project)], { type: 'application/json' }), `${project.name}.json`));
    };
    const run = (action: () => void | Promise<void>) => {
        try {
            Promise.resolve(action()).catch(e => reportError(e instanceof Error ? e.message : 'Operation failed'));
        }
        catch (e) {
            reportError(e instanceof Error ? e.message : 'Operation failed');
        }
    };
    const flushCurrent = async () => { if (!project)
        return; const snapshot = project; clearTimeout(saveTimer.current); try {
        await repository.save(snapshot);
    }
    catch {
        throw new Error('Could not save the current project. It remains in memory; download JSON before switching projects.');
    } if (useHistory.getState().project !== snapshot)
        throw new Error('The project changed while saving. Please select again.'); lastSaved.current = serializeProject(snapshot); };
    const switchProject = async (next: Project) => { await flushCurrent(); open(next); setSelected(undefined); await refresh(); };
    const exportFile = async (format: ExportFormat) => {
        if (!project)
            return;
        setExporting(format);
        try {
            const { exportArtifact } = await import('@planner/adapters/exports/artifacts');
            await downloadArtifact(await exportArtifact(project, format), `${project.name}.${format}`);
        }
        catch (e) {
            reportError(e instanceof Error ? e.message : 'Export failed');
        }
        finally {
            setExporting('');
        }
    };
    return { needsProjectChoice,setNeedsProjectChoice,project, projects, setProjects, selected, setSelected, message, setMessage, saveStatus, page, requirementsCollapsed, setRequirementsCollapsed, costCollapsed, setCostCollapsed, exporting, service, setService, provider, setProvider, from, setFrom, to, setTo, connectionLabel, setConnectionLabel, saveTimer, importRef, ai, fullscreen, refresh, change, run, json, flushCurrent, switchProject, exportFile, open, past, future, undo, redo, reportError };
}
export type WorkspaceController = ReturnType<typeof useWorkspace>;
export type LoadedWorkspace = WorkspaceController & {
    project: Project;
};
