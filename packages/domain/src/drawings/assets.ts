import { thirdPartyTools } from './tools';
import { services } from '../providers/index';
export const assetLibraries = ['aws', 'azure', 'gcp', 'oracle', 'ibm', 'kubernetes', 'generic', 'tools'] as const;
export type AssetLibrary = typeof assetLibraries[number];
export const libraryNames: Record<AssetLibrary, string> = { aws: 'AWS', azure: 'Azure', gcp: 'Google Cloud', oracle: 'Oracle Cloud', ibm: 'IBM Cloud', kubernetes: 'Kubernetes', generic: 'Generic infrastructure', tools: 'Third-party tools' };
export type DrawingAsset = { id: string; label: string; library: AssetLibrary; icon: string; keywords?: string };
const extra: Record<'oracle' | 'ibm' | 'kubernetes' | 'generic', [string, string][]> = {
    oracle: [['compute', 'Virtual Machine'], ['functions', 'Functions'], ['object-storage', 'Object Storage'], ['vcn', 'Virtual Cloud Network'], ['load-balancer', 'Load Balancer'], ['autonomous-db', 'Autonomous Database']],
    ibm: [['virtual-server', 'Virtual Server'], ['kubernetes', 'Kubernetes Cluster'], ['database', 'Database'], ['object-storage', 'Object Storage'], ['load-balancer', 'Load Balancer'], ['vpc', 'Virtual Private Cloud']],
    kubernetes: [['pod', 'Pod'], ['deployment', 'Deployment'], ['service', 'Service'], ['ingress', 'Ingress'], ['secret', 'Secret'], ['node', 'Node']],
    generic: [['server', 'Server'], ['database', 'Database'], ['user', 'User'], ['internet', 'Internet'], ['firewall', 'Firewall'], ['queue', 'Queue']],
};
export const drawingAssets: DrawingAsset[] = [
    ...thirdPartyTools.map(tool => ({ id: `tools/${tool.id}`, label: tool.label, library: 'tools' as const, icon: `/drawing-assets/tools/${tool.id}.svg`, keywords: tool.keywords })),
    ...services.map(service => ({ id: `${service.provider}/${service.id}`, label: service.name, library: service.provider, icon: service.icon })),
    ...Object.entries(extra).filter(([library]) => library !== 'oracle' && library !== 'ibm').flatMap(([library, entries]) => entries.map(([id, label]) => ({ id: `${library}/${id}`, label, library: library as AssetLibrary, icon: `/drawing-assets/${library}/${id}.svg` }))),
];
export const drawingAsset = (id: string) => drawingAssets.find(asset => asset.id === id);
