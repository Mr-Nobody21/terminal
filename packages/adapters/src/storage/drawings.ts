import Dexie, { type Table } from 'dexie';
import { duplicateDrawing, parseDrawing, type Drawing } from '@planner/domain/drawings/model';
export class DrawingRepository extends Dexie {
    drawings!: Table<Drawing, string>;
    constructor(name = 'planner-drawings-v1') { super(name); this.version(1).stores({ drawings: 'id,projectId,updatedAt,[projectId+kind]' }); }
    async save(drawing: Drawing) {
        const validated = parseDrawing(drawing);
        await this.transaction('rw', this.drawings, async () => {
            const existing = await this.drawings.get(validated.id);
            if (existing && existing.projectId !== validated.projectId) throw new Error('Drawing ID belongs to another project');
            await this.drawings.where('[projectId+kind]').equals([validated.projectId, validated.kind]).filter(d => d.id !== validated.id).delete();
            await this.drawings.put(validated);
        });
    }
    async removeProject(projectId: string) { await this.drawings.where('projectId').equals(projectId).delete(); }
    async duplicateProject(sourceId: string, destinationId: string) {
        const copies = (await this.list(sourceId)).map(drawing => duplicateDrawing(drawing, destinationId));
        await this.transaction('rw', this.drawings, async () => { for (const drawing of copies) await this.save(drawing); });
    }
    async list(projectId: string) { return (await this.drawings.where('projectId').equals(projectId).toArray()).map(parseDrawing); }
    async import(text: string, projectId: string) {
        const drawing = parseDrawing(JSON.parse(text));
        const existing = await this.drawings.get(drawing.id);
        const imported = existing && (existing.projectId !== projectId || existing.kind !== drawing.kind) ? duplicateDrawing(drawing, projectId) : parseDrawing({ ...drawing, projectId });
        await this.transaction('rw', this.drawings, async () => { await this.save(imported); });
        return imported;
    }
}
export let drawingRepository = new DrawingRepository();

export function scopeDrawingRepository(owner:string){drawingRepository.close();drawingRepository=new DrawingRepository('planner-drawings-v1:'+owner);}
