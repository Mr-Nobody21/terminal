import type { Provider } from '@planner/domain/providers';
const bundled = import.meta.glob('../../../../data/icons/**/*.svg', { eager: true, query: '?raw', import: 'default' }) as Record<string,string>;
export function iconSvg(provider:Provider,service:string):string {return bundled[`../../../../data/icons/${provider}/${service}.svg`]??bundled['../../../../data/icons/fallback.svg'];}
export function iconData(provider:Provider,service:string):string {return `data:image/svg+xml,${encodeURIComponent(iconSvg(provider,service))}`;}
