import { useEffect, useRef, useState } from 'react';
import { createDrawing, type Drawing, type DrawingKind } from '@planner/domain/drawings/model';
import { drawingRepository } from '@planner/adapters/storage/drawings';
export function useDrawings(projectId?: string) {
    const [drawings, setDrawings] = useState<Drawing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [status, setStatus] = useState('');
    const queue = useRef(Promise.resolve());
    const failure = useRef('');
    const owner = useRef(projectId); owner.current = projectId;
    useEffect(() => {
        let cancelled = false; setLoading(true); setDrawings([]); setError('');
        if (projectId) void queue.current.then(() => drawingRepository.list(projectId)).then(list => { if (!cancelled) { setDrawings(list); setLoading(false); setStatus('Drawing saved locally'); } }).catch(() => { if (!cancelled) { setLoading(false); setError('Drawing storage unavailable. Edits remain in memory; export drawing JSON to preserve your work.'); } });
        return () => { cancelled = true; };
    }, [projectId]);
    const save = (drawing: Drawing) => {
        setDrawings(previous => [...previous.filter(d => d.kind !== drawing.kind), drawing]); setStatus('Saving drawing…');
        queue.current = queue.current.then(() => drawingRepository.save(drawing)).then(() => { if (owner.current === drawing.projectId) { setStatus('Drawing saved locally'); setError(''); failure.current = '';  } }).catch(() => { if (owner.current === drawing.projectId) { setStatus('Drawing save failed'); failure.current = 'Drawing save failed. Export drawing JSON before switching projects.'; setError(failure.current); } });
    };
    const ensure = (kind: DrawingKind) => {
        const existing = drawings.find(d => d.kind === kind);
        if (existing || !projectId || loading) return existing;
        const drawing = createDrawing(projectId, kind); save(drawing); return drawing;
    };
    return { drawings, loading, error, status, save, ensure, flush: async () => { await queue.current; if (failure.current) throw new Error(failure.current); } };
}
