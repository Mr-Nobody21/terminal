import { serviceFor, type Provider } from '@planner/domain/providers';
import { assetSvg, assetUrl } from '../backend/assets';
export function iconSvg(provider:Provider,service:string):string {return assetSvg(serviceFor(provider,service)?.icon??'/icons/fallback.svg');}
export function iconData(provider:Provider,service:string):string {return assetUrl(serviceFor(provider,service)?.icon??'/icons/fallback.svg');}
