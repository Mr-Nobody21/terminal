import Dexie, { type Table } from 'dexie';
import { importProject, parseProject, type Project } from '@planner/domain/model';
export class ProjectRepository extends Dexie {
    projects!: Table<Project, string>;
    constructor(name = 'cloud-planner-v1') { super(name); this.version(1).stores({ projects: 'id,updatedAt,name' }); }
    async save(project: Project) { const validated = parseProject(project); await this.projects.put(validated); }
    async list() { return (await this.projects.orderBy('updatedAt').reverse().toArray()).map(parseProject); }
    async load(id: string) { const value = await this.projects.get(id); return value ? parseProject(value) : undefined; }
    async remove(id: string) { await this.projects.delete(id); }
    async import(text: string) { const p = importProject(text); await this.transaction('rw', this.projects, async () => { await this.save(p); }); return p; }
}
export let repository = new ProjectRepository();

export function scopeProjectRepository(owner:string){repository.close();repository=new ProjectRepository('cloud-planner-v1:'+owner);}
