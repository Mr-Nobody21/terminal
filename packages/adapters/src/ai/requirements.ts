import { z } from 'zod';
import { commit, newId, parseProject, variantSchema, type Project } from '@planner/domain/model';
import { services } from '@planner/domain/providers';
import { structuredOutput, type AIAdapter } from './adapter';

export const extractionSchema=z.object({facts:z.array(z.object({text:z.string().min(1),critical:z.boolean(),source:z.enum(['user','prd'])}).strict()),unknowns:z.array(z.object({question:z.string().min(1),critical:z.boolean(),impact:z.enum(['architecture','cost','other'])}).strict()).max(8),assumptions:z.array(z.object({label:z.string().min(1),value:z.string(),unit:z.string(),critical:z.boolean()}).strict())}).strict();
export type Extraction=z.infer<typeof extractionSchema>;
export function rankedQuestions(extraction:Extraction){const rank={architecture:0,cost:1,other:2};return [...extraction.unknowns].sort((a,b)=>Number(b.critical)-Number(a.critical)||rank[a.impact]-rank[b.impact]).slice(0,8);}
export async function extractRequirements(adapter:AIAdapter,text:string,signal?:AbortSignal){if(!text.trim())throw new Error('Enter requirements or paste a PRD first.');return structuredOutput(adapter,'Extract only supported facts from the supplied text. Label facts user or prd. Record up to eight highest-impact missing architecture and workload details as unknowns, not invented facts. Prioritize all critical decisions. Proposed assumptions must be explicitly labeled. Do not calculate prices.',{text},extractionSchema,signal);}
export function applyExtraction(project:Project,text:string,result:Extraction):Project {return commit(project,d=>{
  d.requirementsText=text;const userSource={id:newId(),kind:'user' as const,text},prdSource={id:newId(),kind:'prd' as const,text},inferredSource={id:newId(),kind:'inferred' as const,text:'AI clarification questions; unresolved'};
  // Retain prior facts and assumptions because existing architecture inputs may refer to them.
  d.sources.push(userSource,prdSource,inferredSource);
  d.requirements.push(...result.facts.map(f=>({id:newId(),text:f.text,sourceId:f.source==='prd'?prdSource.id:userSource.id,critical:f.critical,status:'known' as const})),...rankedQuestions(result).map(u=>({id:newId(),text:u.question,sourceId:inferredSource.id,critical:u.critical,status:'unknown' as const})));
  d.assumptions.push(...result.assumptions.map(a=>({...a,id:newId(),source:'inferred' as const})));
});}
export function unresolvedCritical(project:Project){return project.requirements.filter(r=>r.status==='unknown'&&r.critical&&!r.answer?.trim()&&!r.assumptionId);}
export function answerQuestion(project:Project,id:string,answer:string,asAssumption=false){if(!answer.trim())throw new Error('Enter an answer or an explicit assumption.');return commit(project,d=>{const question=d.requirements.find(r=>r.id===id);if(!question)throw new Error('Question was not found.');if(asAssumption){const assumption={id:newId(),label:question.text,value:answer,unit:'user statement',source:'user' as const,critical:question.critical};d.assumptions.push(assumption);question.assumptionId=assumption.id;}else question.answer=answer;});}
const generatedVariant=variantSchema.extend({name:z.enum(['Lean','Recommended'])}).strict();
export const generationSchema=z.object({variants:z.array(generatedVariant).length(2)}).strict();
export async function generateArchitectures(adapter:AIAdapter,project:Project,signal?:AbortSignal):Promise<Project>{
  if(unresolvedCritical(project).length)throw new Error('Answer critical clarification questions or record an explicit assumption before generating.');
  const validate=(result:z.infer<typeof generationSchema>)=>{
    if(new Set(result.variants.map(v=>v.name)).size!==2)throw new Error('Both Lean and Recommended are required.');
    if(result.variants.some(v=>!v.resources.length))throw new Error('Each variant requires a resource.');
    parseProject({...project,variants:result.variants,activeVariantId:result.variants[0].id,presentation:{positions:{}}});
  };
  const result=await structuredOutput(adapter,'Generate Lean and Recommended canonical architectures. Output JSON only, never coordinates, presentation data, costs, arithmetic, or Draw.io XML. Use globally unique UUIDs for every new entity and preserve supplied provenance IDs. Use only selected provider/region catalog services; an unavailable service must have unsupported:true and category:unsupported. Every numeric pricing input must reference a supplied requirement/assumption ID or an allowed catalog constant (month-hours=730, quantity-one=1, scenario-base=1). Omit unknown numeric inputs instead of inventing values. Both variants must have service resources. Return exactly one Lean and one Recommended variant.',{provider:project.provider,region:project.region,requirementsText:project.requirementsText,requirements:project.requirements,assumptions:project.assumptions,catalog:services.filter(s=>s.provider===project.provider&&s.category!=='unsupported').map(({id,name,category})=>({id,name,category}))},generationSchema,signal,validate);
  // One atomic replacement only after both proposals pass the complete canonical contract.
  return commit(project,d=>{d.variants=result.variants;d.activeVariantId=result.variants[0].id;d.presentation.positions={};});
}
