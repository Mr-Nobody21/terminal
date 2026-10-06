import type { Provider } from '../core/providers';
const bundled = import.meta.glob('./icon-assets/**/*.svg', { eager: true, query: '?raw', import: 'default' }) as Record<string,string>;
export function iconSvg(provider:Provider,service:string):string {return bundled[`./icon-assets/${provider}/${service}.svg`]??bundled['./icon-assets/fallback.svg'];}
export function iconData(provider:Provider,service:string):string {return `data:image/svg+xml,${encodeURIComponent(iconSvg(provider,service))}`;}
