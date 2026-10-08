import { api } from './client';
export interface CatalogAsset {key:string;content:string;mime:string}
let catalog=new Map<string,CatalogAsset>();
export function setAssetCatalog(assets:CatalogAsset[]){
 const next=new Map(assets.map(asset=>[asset.key,asset]));
 if(!next.has('/icons/fallback.svg'))throw new Error('Asset catalog is empty. Run the backend seed command.');
 catalog=next;
}
export async function loadAssetCatalog(){const result=await api<{assets:CatalogAsset[]}>('/assets/catalog');setAssetCatalog(result.assets);}
export function assetSvg(key:string){return catalog.get(key)?.content??catalog.get('/icons/fallback.svg')?.content??'';}
export function assetUrl(key:string){return `data:image/svg+xml,${encodeURIComponent(assetSvg(key))}`;}
