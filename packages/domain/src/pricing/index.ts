import {configurationWarning} from '../providers/index';
import { activeVariant, parseProject, pricingInputSchema, type Project, type Resource, type PricingInput, type Variant } from '../model/index';
import { pricingCatalog, transferCatalog, rateCatalogSchema, type Rate } from './catalog';
import {z} from 'zod';
const totalsSchema=z.object({low:z.number().nonnegative().finite(),base:z.number().nonnegative().finite(),high:z.number().nonnegative().finite(),complete:z.boolean()}).strict();
export const pricingLineItemSchema=z.object({label:z.string().min(1),amount:z.number().nonnegative().finite(),formula:z.string().min(1),inputs:z.record(z.string(),pricingInputSchema),rate:rateCatalogSchema}).strict();
const resourceEstimateSchema=totalsSchema.extend({resourceId:z.uuid(),name:z.string(),category:z.string(),environment:z.string(),lineItems:z.array(pricingLineItemSchema),warnings:z.array(z.string())}).strict();
export const costEstimateSchema=totalsSchema.extend({currency:z.literal('USD'),completeness:z.number().min(0).max(1),resources:z.array(resourceEstimateSchema),categories:z.record(z.string(),totalsSchema),environments:z.record(z.string(),totalsSchema),warnings:z.array(z.string()),sources:z.array(z.url())}).strict();
export const instanceHours=(hours:number,quantity:number,rate:number)=>hours*quantity*rate;
export const containerHours=(hours:number,quantity:number,cpu:number,memory:number,cpuRate:number,memoryRate:number)=>hours*quantity*(cpu*cpuRate+memory*memoryRate);
export const serverless=(requests:number,durationSeconds:number,memoryGiB:number,requestRate:number,executionRate:number)=>requests*(requestRate+durationSeconds*memoryGiB*executionRate);
export const database=(hours:number,quantity:number,storageGiB:number,computeRate:number,storageRate:number)=>hours*quantity*computeRate+storageGiB*storageRate;
export const objectStorage=(gibMonths:number,rate:number)=>gibMonths*rate;
export const egress=(gib:number,rate:number)=>gib*rate;
export const loadBalancer=(hours:number,quantity:number,capacityHours:number,hourRate:number,capacityRate:number)=>hours*quantity*hourRate+capacityHours*capacityRate;
export type Totals={low:number;base:number;high:number;complete:boolean};
export type LineItem={label:string;amount:number;formula:string;inputs:Record<string,PricingInput>;rate:Rate};
export type ResourceEstimate=Totals&{resourceId:string;name:string;category:string;environment:string;lineItems:LineItem[];warnings:string[]};
export type Estimate=Totals&{currency:'USD';completeness:number;resources:ResourceEstimate[];categories:Record<string,Totals>;environments:Record<string,Totals>;warnings:string[];sources:string[]};
const units:Record<string,string[]>={hours:['hours/month'],quantity:['count'],cpu:['vCPU'],memory:['GB','GiB'],storage:['GB-month','GiB-month'],egress:['GB/month','GiB/month'],requests:['requests/month'],duration:['seconds'],capacity:['LCU-hours','CU-hours']};
function resourceEstimate(r:Resource):ResourceEstimate {
 const result:ResourceEstimate={resourceId:r.id,name:r.name,category:r.category,environment:r.environment,low:0,base:0,high:0,complete:false,lineItems:[],warnings:[]};
 const rate=pricingCatalog.find(x=>x.provider===r.provider&&x.region===r.region&&x.service===r.service&&x.sku===r.configuration.sku);
 if(r.unsupported||!rate){result.warnings.push(`${r.name}: unsupported configuration or no verified catalog rate; unpriced`);return result;}
 const inputs=r.configuration.inputs;
 const required:Record<Rate['formula'],string[]>={instance:['hours','quantity'],container:['hours','quantity','cpu','memory'],serverless:['requests','duration','memory'],database:['hours','quantity','storage'],storage:['storage'],egress:['egress'],'load-balancer':['hours','quantity','capacity']};
 const keys=required[rate.formula];
 if(rate.maximum&&inputs[rate.maximum.input]?.value*(r.configuration.scenarios?.high??1)>rate.maximum.value){result.warnings.push(`${r.name}: workload exceeds verified first-tier catalog limit; unpriced`);return result;}
 for(const key of keys){if(!inputs[key]||!units[key].includes(inputs[key].unit))result.warnings.push(`${r.name}: missing or incompatible ${key} input; unpriced`);}
 if(result.warnings.length)return result;
 const configurationIssue=configurationWarning(r.provider,r.service,inputs);if(configurationIssue){result.warnings.push(`${r.name}: ${configurationIssue}; unpriced`);return result;}
 const v=(key:string)=>inputs[key].value;
 const rr=rate.rates;
 const amounts:Record<Rate['formula'],()=>number>={instance:()=>instanceHours(v('hours'),v('quantity'),rr.hour),container:()=>containerHours(v('hours'),v('quantity'),v('cpu'),v('memory'),rr.cpu,rr.memory),serverless:()=>serverless(v('requests'),v('duration'),v('memory'),rr.requests,rr.execution),database:()=>database(v('hours'),v('quantity'),v('storage'),rr.hour,rr.storage),storage:()=>objectStorage(v('storage'),rr.storage),egress:()=>egress(v('egress'),rr.egress),'load-balancer':()=>loadBalancer(v('hours'),v('quantity'),v('capacity'),rr.hour,rr.capacity)};
 const amount=amounts[rate.formula]();if(!Number.isFinite(amount)){result.warnings.push(`${r.name}: missing catalog dimension; unpriced`);return result;}
 const formulas:Record<Rate['formula'],string>={instance:'hours × quantity × hourly rate',container:'hours × quantity × (CPU × CPU rate + memory × memory rate)',serverless:'requests × (request rate + duration × memory × execution rate)',database:'hours × quantity × compute rate + storage × storage rate',storage:'storage × storage rate',egress:'egress × transfer rate','load-balancer':'hours × quantity × hourly rate + capacity hours × capacity rate'};
 result.base=amount;result.complete=true;
 result.lineItems.push({label:rate.formula,amount,formula:formulas[rate.formula],inputs:Object.fromEntries(keys.map(k=>[k,inputs[k]])),rate});
 if(rate.formula!=='egress'&&inputs.egress){
  const transfer=transferCatalog[r.provider];
  if(!units.egress.includes(inputs.egress.unit)||!rr.egress||!transfer||inputs.egress.value*(r.configuration.scenarios?.high??1)>transfer.maximum){result.complete=false;result.warnings.push(`${r.name}: explicit egress is unpriced: no compatible verified first-tier transfer rate`);}
  else {const amount=egress(v('egress'),rr.egress);result.base+=amount;result.lineItems.push({label:'Internet egress',amount,formula:formulas.egress,inputs:{egress:inputs.egress},rate:{...rate,formula:'egress',source:transfer!.source,units:'USD/GiB',assumptions:transfer!.assumptions}});}
 }
 result.low=result.base*(r.configuration.scenarios?.low??1);result.high=result.base*(r.configuration.scenarios?.high??1);
 result.warnings.push(`${r.name}: ${rate.assumptions}`);
 return result;
}
export function estimate(project:Project,variant:Variant=activeVariant(project)):Estimate {
 parseProject(project);
 const resources=variant.resources.map(resourceEstimate);
 const sum=(items:ResourceEstimate[]):Totals=>({low:items.reduce((n,r)=>n+r.low,0),base:items.reduce((n,r)=>n+r.base,0),high:items.reduce((n,r)=>n+r.high,0),complete:items.every(r=>r.complete)});
 const groups=(key:'category'|'environment')=>Object.fromEntries([...new Set(resources.map(r=>r[key]))].map(k=>[k,sum(resources.filter(r=>r[key]===k))]));
 const crossCloud = variant.connections.some(c => variant.resources.find(r=>r.id===c.source)?.provider !== variant.resources.find(r=>r.id===c.target)?.provider);
 const warnings=resources.flatMap(r=>r.warnings);if(!variant.resources.some(r=>r.configuration.scenarios))warnings.push('No workload variability supplied: low and high equal base.');
 for(const r of project.requirements.filter(r=>r.status==='unknown'&&!r.answer&&!r.assumptionId))warnings.push(`Unresolved requirement may affect pricing: ${r.text}`);
 if(crossCloud)warnings.push('Cross-cloud connection transfer, VPN, interconnect and gateway charges are unpriced. Resource internet egress inputs do not establish connection-specific transfer costs.');
 warnings.push('Known subtotal only. Excludes taxes, credits, negotiated discounts and free tiers. Additional provider charges may apply.');
 return {...sum(resources),complete:sum(resources).complete&&!crossCloud,currency:'USD',completeness:resources.length?resources.filter(r=>r.complete).length/resources.length:1,resources,categories:groups('category'),environments:groups('environment'),warnings,sources:[...new Set(resources.flatMap(r=>r.lineItems.map(l=>l.rate.source)))]};
}
