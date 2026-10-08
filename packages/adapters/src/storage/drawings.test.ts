import { describe, expect, it } from 'vitest';
import { createDrawing } from '@planner/domain/drawings/model';
import { DrawingRepository } from './drawings';
describe('drawing storage', () => {
    it('persists documents separately by project and type, including reload', async () => {
        const name = crypto.randomUUID(), repo = new DrawingRepository(name), projectId = crypto.randomUUID();
        const drawing = createDrawing(projectId, 'flowchart'); await repo.save(drawing); repo.close();
        const reopened = new DrawingRepository(name); expect(await reopened.list(projectId)).toEqual([drawing]); expect(await reopened.list(crypto.randomUUID())).toEqual([]); await reopened.delete();
    });
    it('imports transactionally and cannot overwrite another project through an ID collision', async () => {
        const repo = new DrawingRepository(crypto.randomUUID()), drawing = createDrawing(crypto.randomUUID(), 'flowchart'); await repo.save(drawing);
        await expect(repo.import('{"version":99}', drawing.projectId)).rejects.toThrow(); expect(await repo.list(drawing.projectId)).toEqual([drawing]);
        const otherId = crypto.randomUUID(); const imported = await repo.import(JSON.stringify(drawing), otherId); expect(imported.id).not.toBe(drawing.id); expect(await repo.list(drawing.projectId)).toEqual([drawing]); await repo.delete();
    });
    it('copies drawings with a project and removes associated drawings', async () => {
        const repo = new DrawingRepository(crypto.randomUUID()), projectId = crypto.randomUUID(), destination = crypto.randomUUID();
        await repo.save(createDrawing(projectId, 'er')); await repo.duplicateProject(projectId, destination);
        expect(await repo.list(destination)).toHaveLength(1); await repo.removeProject(projectId); expect(await repo.list(projectId)).toEqual([]); expect(await repo.list(destination)).toHaveLength(1); await repo.delete();
    });
});
