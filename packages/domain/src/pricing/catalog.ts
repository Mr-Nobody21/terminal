import type { Provider } from '../providers/index';
import {z} from 'zod';
export const rateCatalogSchema=z.object({provider:z.enum(['aws','azure','gcp']),region:z.string().min(1),service:z.string().min(1),sku:z.string().min(1),formula:z.enum(['instance','container','serverless','database','storage','egress','load-balancer']),rates:z.record(z.string(),z.number().nonnegative().finite()),source:z.url(),retrieved:z.iso.date(),units:z.string().min(1),assumptions:z.string().min(1),maximum:z.object({input:z.string().min(1),value:z.number().positive().finite()}).strict().optional()}).strict().superRefine((r,ctx)=>{
 const dimensions:Record<Formula,string[]>={instance:['hour'],container:['cpu','memory'],serverless:['requests','execution'],database:['hour','storage'],storage:['storage'],egress:['egress'],'load-balancer':['hour','capacity']};
 for(const key of dimensions[r.formula])if(r.rates[key]===undefined)ctx.addIssue({code:'custom',path:['rates',key],message:'Missing formula rate dimension'});
});
export type Formula = 'instance'|'container'|'serverless'|'database'|'storage'|'egress'|'load-balancer';
export type Rate = {provider:Provider;region:string;service:string;sku:string;formula:Formula;rates:Record<string,number>;source:string;retrieved:string;units:string;assumptions:string;maximum?:{input:string;value:number}};
const rate=(provider:Provider,service:string,sku:string,formula:Formula,rates:Record<string,number>,source:string,units:string,assumptions:string):Rate=>({provider,region:{aws:'us-east-1',azure:'eastus',gcp:'us-central1'}[provider],service,sku,formula,rates,source,retrieved:'2026-10-06',units,assumptions});
/** Deliberately bounded catalog: absent services/SKUs remain unpriced. */
export const pricingCatalog:Rate[]=[
 {...rate('aws','s3','standard','storage',{storage:0.023,egress:0.09},'https://aws.amazon.com/s3/pricing/','USD/GiB-month; USD/GiB internet egress','S3 Standard first 50 TiB; internet egress first 10 TiB; excludes requests'),maximum:{input:'storage',value:51200}},
 rate('aws','rds','standard','database',{hour:0.016,storage:0.115,egress:0.09},'https://aws.amazon.com/rds/postgresql/pricing/','USD/instance-hour; USD/GiB-month','PostgreSQL db.t4g.micro Single-AZ gp2; excludes backup overage, CPU credits and IOPS'),
 {...rate('aws','cloudfront','standard','egress',{egress:0.085},'https://aws.amazon.com/cloudfront/pricing/','USD/GiB delivery','US edge delivery pay-as-you-go first 10 TiB; excludes request and origin charges'),maximum:{input:'egress',value:10240}},
 {...rate('gcp','cdn','standard','egress',{egress:0.08},'https://cloud.google.com/cdn/pricing','USD/GiB delivery','North American cache hit delivery first 10 TiB; excludes lookups, cache fill and load balancer'),maximum:{input:'egress',value:10240}},
 rate('azure','postgres','standard','database',{hour:0.017,storage:0.115},'https://prices.azure.com/api/retail/prices','USD/instance-hour; USD/GB-month','Flexible Server Burstable B1MS, provisioned storage; excludes backup overage, IOPS and networking'),
 rate('azure','vm','B1s','instance',{hour:0.0104},'https://prices.azure.com/api/retail/prices','USD/instance-hour','Linux Standard_B1s on-demand East US; excludes disk and networking'),
 rate('azure','container-apps','standard','container',{cpu:0.000024*3600,memory:0.000003*3600},'https://prices.azure.com/api/retail/prices','USD/vCPU-hour; USD/GiB-hour','Standard active usage; excludes requests, environment charges and networking'),
 rate('azure','functions','standard','serverless',{requests:0.0000002,execution:0.000016},'https://prices.azure.com/api/retail/prices','USD/request; USD/GB-second','Standard consumption; excludes storage and network'),
 rate('azure','blob','standard','storage',{storage:0.0208},'https://prices.azure.com/api/retail/prices','USD/GB-month','General Block Blob v2 Hot LRS first tier; excludes operations and networking'),
 rate('azure','gateway','standard','load-balancer',{hour:0.2,capacity:0.008},'https://prices.azure.com/api/retail/prices','USD/hour; USD/capacity-unit-hour','Standard v2; capacity input represents CU-hours, not AWS LCU-hours'),
 rate('gcp','storage','standard','storage',{storage:0.000027397*730},'https://cloud.google.com/storage/pricing','USD/GiB-month','Regional Standard storage; hourly rate multiplied by 730; excludes operations, retrieval and network'),
 rate('aws','fargate','standard','container',{cpu:0.000011244*3600,memory:0.000001235*3600,egress:0.09},'https://aws.amazon.com/fargate/pricing/','USD/vCPU-hour; USD/GiB-hour','Linux x86 ECS; 20 GiB ephemeral storage included; extra storage, IPv4 and logs excluded'),
 rate('aws','lambda','standard','serverless',{requests:0.2/1e6,execution:0.0000166667},'https://aws.amazon.com/lambda/pricing/','USD/request; USD/GiB-second','x86 first on-demand tier; excludes provisioned concurrency'),
 rate('aws','alb','standard','load-balancer',{hour:0.0225,capacity:0.008},'https://aws.amazon.com/elasticloadbalancing/pricing/','USD/hour; USD/LCU-hour','Application Load Balancer; capacity must be supplied as aggregate LCU-hours'),
 rate('gcp','cloud-run','standard','container',{cpu:0.000018*3600,memory:0.000002*3600},'https://cloud.google.com/run/pricing','USD/vCPU-hour; USD/GiB-hour','Instance-based billing; no GPU; excludes network and build'),
];
pricingCatalog.forEach(r=>rateCatalogSchema.parse(r));

export const transferCatalog:Partial<Record<Provider,{source:string;maximum:number;assumptions:string}>>={
 aws:{source:'https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AWSDataTransfer/current/us-east-1/index.json',maximum:10240,assumptions:'Internet egress first 10 TiB; free 100 GB excluded'}
};
