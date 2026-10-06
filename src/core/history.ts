import { create } from 'zustand';
import { parseProject, type Project } from './model';
type History = {
    project: Project | null;
    past: Project[];
    future: Project[];
    open: (p: Project) => void;
    apply: (p: Project) => void;
    undo: () => void;
    redo: () => void;
};
export const useHistory = create<History>((set) => ({ project: null, past: [], future: [], open: p => set({ project: parseProject(p), past: [], future: [] }), apply: p => set(s => ({ project: parseProject(p), past: s.project ? [...s.past.slice(-49), s.project] : [], future: [] })), undo: () => set(s => s.past.length ? { project: s.past.at(-1)!, past: s.past.slice(0, -1), future: s.project ? [s.project, ...s.future] : s.future } : s), redo: () => set(s => s.future.length ? { project: s.future[0], past: s.project ? [...s.past, s.project] : s.past, future: s.future.slice(1) } : s) }));
