import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';

import { readdirSync,readFileSync } from 'node:fs';
import { setAssetCatalog } from '../../packages/adapters/src/backend/assets';
function svgFiles(dir:string):string[]{return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?svgFiles(dir+'/'+e.name):e.name.endsWith('.svg')?[dir+'/'+e.name]:[]);}
setAssetCatalog(svgFiles('backend/assets').map(path=>({key:path.slice('backend/assets'.length),mime:'image/svg+xml',content:readFileSync(path,'utf8')})));
