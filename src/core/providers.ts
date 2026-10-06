export const providers = ['aws', 'azure', 'gcp'] as const;
export type Provider = typeof providers[number];
export const categories = ['compute', 'container', 'serverless', 'database', 'storage', 'cdn', 'network', 'cache', 'messaging', 'dns', 'security', 'unsupported'] as const;
export type Category = typeof categories[number];
export type Service = {
    id: string;
    name: string;
    category: Category;
    provider: Provider;
    icon: string;
};
const names: Record<Provider, [
    string,
    string,
    Category
][]> = {
    aws: [['ec2', 'EC2', 'compute'], ['fargate', 'ECS / Fargate', 'container'], ['lambda', 'Lambda', 'serverless'], ['rds', 'RDS PostgreSQL', 'database'], ['dynamodb', 'DynamoDB', 'database'], ['s3', 'S3', 'storage'], ['cloudfront', 'CloudFront', 'cdn'], ['alb', 'Application Load Balancer', 'network'], ['elasticache', 'ElastiCache', 'cache'], ['sqs', 'SQS', 'messaging'], ['route53', 'Route 53', 'dns'], ['secrets', 'Secrets Manager', 'security']],
    azure: [['vm', 'Virtual Machines', 'compute'], ['container-apps', 'Container Apps', 'container'], ['functions', 'Functions', 'serverless'], ['postgres', 'Database for PostgreSQL', 'database'], ['cosmos', 'Cosmos DB', 'database'], ['blob', 'Blob Storage', 'storage'], ['front-door', 'Front Door / CDN', 'cdn'], ['gateway', 'Application Gateway', 'network'], ['redis', 'Cache for Redis', 'cache'], ['service-bus', 'Service Bus', 'messaging'], ['dns', 'Azure DNS', 'dns'], ['key-vault', 'Key Vault', 'security']],
    gcp: [['compute', 'Compute Engine', 'compute'], ['cloud-run', 'Cloud Run', 'container'], ['functions', 'Cloud Functions', 'serverless'], ['cloud-sql', 'Cloud SQL', 'database'], ['firestore', 'Firestore', 'database'], ['storage', 'Cloud Storage', 'storage'], ['cdn', 'Cloud CDN', 'cdn'], ['load-balancer', 'Cloud Load Balancing', 'network'], ['memorystore', 'Memorystore', 'cache'], ['pubsub', 'Pub/Sub', 'messaging'], ['dns', 'Cloud DNS', 'dns'], ['secrets', 'Secret Manager', 'security']],
};
export const regions: Record<Provider, string[]> = { aws: ['us-east-1'], azure: ['eastus'], gcp: ['us-central1'] };
export const services: Service[] = providers.flatMap(provider => names[provider].map(([id, name, category]) => ({ id, name, category, provider, icon: `/icons/${provider}/${id}.svg` })));
export const serviceFor = (provider: Provider, id: string) => services.find(s => s.provider === provider && s.id === id);
export const providerName: Record<Provider, string> = { aws: 'Amazon Web Services', azure: 'Microsoft Azure', gcp: 'Google Cloud' };

/** Provider configuration rules are registry behavior, shared by pricing/inspectors. */
export function configurationWarning(provider:Provider,service:string,inputs:Record<string,{value:number}>):string|undefined {
  if(provider==='aws'&&service==='fargate'&&inputs.cpu&&inputs.memory){
    const ranges:Record<number,[number,number,number]>={0.25:[0.5,2,0.5],0.5:[1,4,1],1:[2,8,1],2:[4,16,1],4:[8,30,1],8:[16,60,4],16:[32,120,8]};
    const range=ranges[inputs.cpu.value],memory=inputs.memory.value;
    if(!range||memory<range[0]||memory>range[1]||(memory-range[0])%range[2]!==0||(inputs.cpu.value===0.25&&![0.5,1,2].includes(memory)))return 'unsupported Fargate CPU/memory configuration';
  }
  return undefined;
}
export const capacityUnit=(provider:Provider)=>provider==='azure'?'CU-hours':'LCU-hours';
