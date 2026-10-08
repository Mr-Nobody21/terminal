import { services, type Service, type Provider } from '../providers/index';
import { drawingAssets, type DrawingAsset } from '../drawings/assets';
const normalize = (text: string) => text.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const providers: Record<string, string> = { aws:'aws amazon amazon web services', azure:'azure microsoft', gcp:'gcp google google cloud gcloud', oracle:'oracle oci', ibm:'ibm', kubernetes:'kubernetes k8s', generic:'generic infrastructure', tools:'third party tools software devops' };
const aliases: Record<string, string> = {
 compute:'server servers compute vm virtual machine virtual machines instance ec2 host hosting vps',
 container:'server servers container containers docker ecs fargate cloud run container apps code engine microservice microservices kubernetes k8s eks aks oke pod deployment',
 serverless:'function functions lambda faas serverless event execution',
 database:'database databases db datastore',
 sql:'database databases db datastore sql postgres postgresql mysql rds cloud sql relational',
 nosql:'database databases db datastore nosql document key value cosmos dynamodb firestore mongodb',
 storage:'storage object bucket buckets blob s3 files file disk volume',
 cache:'cache caching redis memory memorystore elasticache',
 messaging:'queue queues messaging message messages event events pubsub pub sub sqs service bus kafka',
 network:'network networking vpc vcn subnet load balancer load balancing gateway ingress traffic firewall',
 cdn:'cdn content delivery edge cloudfront front door',
 dns:'dns domain domains route 53 name resolution',
 security:'security secret secrets vault key keys identity iam kms authentication',
 search:'search elasticsearch elastic opensearch full text indexing search engine cloudsearch',
};
function group(service: Service | DrawingAsset): string {
 const name = normalize('name' in service ? `${service.name} ${service.id}` : `${service.label} ${service.id}`);
 if (/opensearch|elasticsearch|cloudsearch|ai search/.test(name)) return 'search';
 if (/container instances|container apps|cloud run|code engine|kubernetes|\beks\b|\baks\b|\bpod\b|\bdeployment\b|container engine/.test(name)) return 'container';
 if (/dynamodb|firestore|cosmos|mongodb/.test(name)) return 'nosql';
 if (/postgres|mysql|cloud sql|\brds\b|autonomous database/.test(name)) return 'sql';
 if ('category' in service && service.category !== 'unsupported') return service.category;
 if (/virtual machine|virtual server|compute engine|bare metal|generic server|oracle compute|kubernetes node/.test(name)) return 'compute';
 if (/database|postgres|mysql/.test(name)) return 'database';
 if (/object storage|blob storage/.test(name)) return 'storage';
 return '';
}
interface Indexed<T> { value:T; name:string; literal:string[]; expanded:string[] }
function index<T extends Service | DrawingAsset>(values: T[]): Indexed<T>[] {
 const seen=new Set<string>();
 return values.filter(value=>{const provider='provider' in value?value.provider:value.library;const name=normalize('name' in value?value.name:value.label).replace(/^(amazon web services|amazon|aws|microsoft azure|azure|google cloud|google|oracle cloud|ibm cloud) /,'');const key=`${provider}/${name}`;if(seen.has(key))return false;seen.add(key);return true;}).map(value => {
  const name = normalize('name' in value ? value.name : value.label);
  const provider = 'provider' in value ? value.provider : value.library;
  return { value, name, literal:normalize(`${name} ${value.id} ${providers[provider]} ${'category' in value && value.category !== 'unsupported' ? value.category : ''}`).split(' '), expanded:normalize(`${aliases[group(value)] || ''} ${'keywords' in value ? value.keywords ?? '' : ''}`).split(' ') };
 });
}
function search<T>(entries: Indexed<T>[], query: string): T[] {
 const text=normalize(query),tokens=text.split(' ').filter(Boolean);
 if(!tokens.length)return entries.map(entry=>entry.value);
 return entries.flatMap((entry,order)=>{
  const scores=tokens.map(token=>entry.literal.includes(token)?8:entry.literal.some(word=>word.startsWith(token))?5:entry.expanded.includes(token)?3:entry.expanded.some(word=>word.startsWith(token))?1:0);
  if(scores.some(score=>score===0))return [];
  return [{entry,order,score:scores.reduce((total,score)=>total+score,entry.name===text?30:0)}];
 }).sort((a,b)=>b.score-a.score||a.order-b.order).map(item=>item.entry.value);
}
const serviceIndex=index(services),assetIndex=index(drawingAssets);
export const searchServices=(query:string)=>search(serviceIndex,query);
export const searchAssets=(query:string)=>search(assetIndex,query);
export const serviceKey=(service:Service)=>`${service.provider}/${service.id}`;
export function resolveService(key:string,defaultProvider:Provider){return services.find(service=>serviceKey(service)===key)??services.find(service=>service.provider===defaultProvider&&service.id===key);}
