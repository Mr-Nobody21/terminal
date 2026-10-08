import { it,expect } from 'vitest';
import { sampleProject } from '@planner/domain/examples';
import { createDrawing } from '@planner/domain/drawings/model';
import { repository,scopeProjectRepository } from './repository';
import { drawingRepository,scopeDrawingRepository } from './drawings';
it('separates local project and drawing caches by account while preserving IDs',async()=>{
 const project=sampleProject(),a=crypto.randomUUID(),b=crypto.randomUUID();
 scopeProjectRepository(a);scopeDrawingRepository(a);await repository.save(project);await drawingRepository.save(createDrawing(project.id,'flowchart'));
 scopeProjectRepository(b);scopeDrawingRepository(b);expect(await repository.load(project.id)).toBeUndefined();expect(await drawingRepository.list(project.id)).toEqual([]);await repository.delete();await drawingRepository.delete();
 scopeProjectRepository(a);scopeDrawingRepository(a);expect((await repository.load(project.id))?.id).toBe(project.id);expect(await drawingRepository.list(project.id)).toHaveLength(1);await repository.delete();await drawingRepository.delete();
});
